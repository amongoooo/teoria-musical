import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { iniciarRitmo, latenciaAudio, tiempoAudio } from '../audio/engine.js'
import { formaGroove } from '../theory/bateria.js'
import { oscuro } from '../ui/color.js'
import { RESORTE } from '../ui/movimiento.js'

/**
 * Piezas para tocar al ritmo, compartidas por los ejercicios `pulso` de las lecciones (exercises/Pulso.jsx) y el
 * entrenamiento de ritmo (pages/Ritmo.jsx): el pad grande, la cuenta del compás, el medidor antes/tarde y los
 * relojes que miden contra el tiempo de audio.
 */

/**
 * Casillas por tiempo del contador: 'tiempos' «1 2 3 4», 'y' «1 y 2 y», 'e' «1 e y a» (semicorcheas)
 * y 'swing' «1 · y» (el tiempo en tresillo: la «y» con swing cae en la 3.ª parte).
 */
export const DIVISION = { tiempos: 1, y: 2, e: 4, swing: 3 }
const SILABAS = { 1: [''], 2: ['', 'y'], 3: ['', '·', 'y'], 4: ['', 'e', 'y', 'a'] }

export const TOLERANCIA = 0.09 // segundos de margen para contar un toque «a tiempo» (lecciones)
const RANGO = 0.25 // el medidor muestra ±250 ms

/** Ritmo en bucle ligado al componente: se para al desmontar. */
export function useRitmo() {
  const [ritmo, setRitmo] = useState(null)
  const ref = useRef(null)
  const empezar = useCallback((groove, bpm, opciones) => {
    ref.current?.parar()
    const { eventos, casillas, porTiempo } = formaGroove(groove, opciones)
    const r = iniciarRitmo(eventos, { bpm, casillas, porTiempo })
    ref.current = r
    setRitmo(r)
    return r
  }, [])
  const parar = useCallback(() => {
    ref.current?.parar()
    ref.current = null
    setRitmo(null)
  }, [])
  useEffect(() => () => ref.current?.parar(), [])
  return { ritmo, empezar, parar }
}

/**
 * Número de latido que se está oyendo ahora (‑1 antes de empezar).
 * `periodo` y `desfase` en tiempos: (0.5) cuenta corcheas; (4, 2) cuenta cada compás desde el tiempo 3.
 */
export function useLatido(ritmo, periodo = 1, desfase = 0) {
  const [latido, setLatido] = useState(-1)
  useEffect(() => {
    if (!ritmo || !periodo) return setLatido(-1)
    let frame = 0
    const tic = () => {
      const b = Math.floor((tiempoAudio() - latenciaAudio() - ritmo.inicio - desfase * ritmo.pulso) / (periodo * ritmo.pulso))
      setLatido((prev) => (prev === b ? prev : b))
      frame = requestAnimationFrame(tic)
    }
    tic()
    return () => cancelAnimationFrame(frame)
  }, [ritmo, periodo, desfase])
  return latido
}

/** Momento del toque en el reloj de audio, descontando lo que tardó en llegar el evento. */
export function momentoToque(e) {
  const retraso = e?.timeStamp ? Math.max(0, (performance.now() - e.timeStamp) / 1000) : 0
  return tiempoAudio() - retraso
}

export const mediana = (xs) => {
  const a = [...xs].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

/**
 * Textura del pad (pedido del usuario: «como de cuerito», muy fina): ruido fractal de SVG convertido en puntitos
 * oscuros con transparencia. Es una imagen fija (el navegador la dibuja una vez y la repite en mosaico): no anima nada
 * ni usa modos de fusión, así que casi no cuesta.
 */
const GRANO = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.62'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
)}")`

/**
 * Botón grande para tocar al pulso. Late con cada tiempo si `latido` >= 0. Responde al apoyar el dedo (no al
 * soltarlo), para medir el momento exacto. Dentro va `texto` o, si se pasan, los `children` (la cuenta, un ícono…).
 * `atenuado`: se ve apagado pero se puede tocar (no es tu turno).
 */
export function Pad({ onToque, latido, mostrarLatido, color, texto = 'Toca aquí al pulso', disabled, atenuado, children, ref, ...props }) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return
        e.preventDefault()
        onToque(e)
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={RESORTE.pulsar}
      className={`relative grid h-40 w-full place-items-center overflow-hidden rounded-3xl text-xl font-semibold text-blanco select-none transition-opacity duration-200 disabled:opacity-40 ${
        atenuado ? 'opacity-60' : ''
      }`}
      style={{
        backgroundColor: oscuro(color),
        boxShadow: 'inset 0 2px 0 rgb(255 255 255 / 0.14), inset 0 -5px 0 rgb(0 0 0 / 0.14)',
        touchAction: 'manipulation',
        WebkitTouchCallout: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
      {...props}
    >
      {/* Cuero: grano fino, costura punteada por dentro y un borde de luz arriba y de sombra abajo. */}
      <span aria-hidden data-textura className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: GRANO, backgroundSize: '140px 140px' }} />
      <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[1.15rem] border-2 border-dashed border-blanco/25" />
      {mostrarLatido && latido >= 0 && (
        <motion.span
          key={latido}
          aria-hidden
          className="absolute size-32 rounded-full bg-white"
          initial={{ scale: 1.15, opacity: 0.45 }}
          animate={{ scale: 0.9, opacity: 0.08 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      )}
      <span className="relative">{children ?? texto}</span>
    </motion.button>
  )
}

/**
 * Cuenta del compás: «1 2 3 4», «1 y 2 y…» (division 2), «1 · y…» (division 3, en dos filas de 6)
 * o «1 e y a…» (division 4, en dos filas de 8).
 * Se ilumina la casilla que suena; las que hay que tocar llevan un aro del acento.
 *
 * En el entrenamiento de ritmo, además:
 *  - `estados[i]`: cómo salió esa casilla: 'bien' (verde), 'casi' (oro: se tocó fuera del margen), 'falta' (contorno de
 *    oro: no se tocó) o 'sobra' (oro punteado: un toque donde no había golpe).
 *  - `colorCabezal`: color de la casilla que suena (por defecto el acento; celeste cuando solo se escucha).
 */
export function Contador({ tiempos, division, actual, cada, desfase, patron, color, estados, colorCabezal }) {
  const total = tiempos * division
  const pos = actual >= 0 ? actual % total : -1
  const silabas = SILABAS[division] ?? SILABAS[2]
  const objetivo = (i) => {
    if (patron) return patron.some((t) => Math.abs(t - i / division) < 1e-6)
    const x = (i / division - desfase) / cada
    return Math.abs(x - Math.round(x)) < 1e-6
  }
  const filas = total > 8
  return (
    <div
      className={filas ? 'grid gap-1.5' : 'flex gap-1.5'}
      style={filas ? { gridTemplateColumns: `repeat(${Math.ceil(total / 2)}, minmax(0, 1fr))` } : undefined}
      aria-hidden
      data-contador={total}
    >
      {Array.from({ length: total }, (_, i) => {
        const tiempo = i % division === 0
        const encendida = i === pos
        const marca = objetivo(i)
        const estado = estados?.[i]
        const lleno = encendida || estado === 'bien' || estado === 'casi'
        return (
          <span
            key={i}
            data-objetivo={marca || undefined}
            data-estado={estado}
            data-encendida={encendida || undefined}
            className={`grid h-12 min-w-0 flex-1 place-items-center rounded-2xl border-2 font-dato tabular-nums transition-colors duration-100 ${
              tiempo ? 'text-xl font-bold' : 'text-base font-semibold'
            } ${
              encendida || estado === 'bien'
                ? 'text-blanco'
                : estado === 'casi'
                  ? 'text-negro'
                  : tiempo && (i === 0 || division > 1)
                    ? 'text-zinc-900'
                    : 'text-zinc-600'
            } ${lleno ? '' : estado === 'sobra' ? 'bg-fijate-suave' : 'bg-white'}`}
            style={{
              backgroundColor: encendida
                ? (colorCabezal ?? oscuro(color))
                : estado === 'bien'
                  ? 'var(--color-bien-relleno)'
                  : estado === 'casi'
                    ? 'var(--color-fijate)'
                    : undefined,
              borderColor:
                estado === 'bien'
                  ? 'var(--color-bien-relleno)'
                  : estado
                    ? 'var(--color-fijate)'
                    : marca
                      ? oscuro(color)
                      : 'var(--color-zinc-200)',
              borderStyle: estado === 'sobra' ? 'dashed' : undefined,
            }}
          >
            {tiempo ? i / division + 1 : silabas[i % division]}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Medidor horizontal: dónde cayó el último toque respecto al pulso. `tolerancia`: el margen que cuenta como «a
 * tiempo» (la zona verde); `vacio`: el texto antes del primer toque.
 */
export function Medidor({ error, tolerancia = TOLERANCIA, vacio = 'Aquí verás si tocas antes o después' }) {
  const hay = error !== undefined && error !== null
  const bien = hay && Math.abs(error) <= tolerancia
  const pos = hay ? 50 + (Math.max(-RANGO, Math.min(RANGO, error)) / RANGO) * 50 : 50
  const ms = hay ? Math.round(Math.abs(error) * 1000) : 0
  const texto = !hay ? vacio : bien ? (ms < 30 ? '¡Justo!' : `A tiempo (${ms} ms)`) : error < 0 ? `Antes de tiempo (${ms} ms)` : `Tarde (${ms} ms)`
  const zona = (Math.min(tolerancia, RANGO) / RANGO) * 50
  return (
    <div className="flex flex-col gap-2" aria-live="polite" data-medidor={hay ? Math.round(error * 1000) : undefined}>
      <div className="relative h-10 overflow-hidden rounded-full bg-zinc-100">
        <motion.div
          className="absolute inset-y-0 bg-bien-suave"
          initial={false}
          animate={{ left: `${50 - zona}%`, width: `${zona * 2}%` }}
          transition={RESORTE.suave}
        />
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-bien-relleno" />
        {hay && (
          <motion.div
            className={`absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm transition-colors duration-200 ${bien ? 'bg-bien-relleno' : 'bg-fijate'}`}
            initial={false}
            animate={{ left: `${pos}%` }}
            transition={RESORTE.pulsar}
          />
        )}
      </div>
      <div className="flex justify-between text-sm text-zinc-500">
        <span>‹ Antes</span>
        <span className={`text-base font-semibold ${!hay ? 'text-zinc-500' : bien ? 'text-bien-tinta' : 'text-fijate-tinta'}`}>{texto}</span>
        <span>Tarde ›</span>
      </div>
    </div>
  )
}
