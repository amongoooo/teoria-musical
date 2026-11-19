import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { bucleRack, golpeAhora, latenciaAudio, tiempoAudio } from '../audio/engine.js'
import { FILAS_RACK, PASOS, PINCELES, POR_TIEMPO, conPaso, golpesPaso, tipoDe, velocidad } from '../theory/rack.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { IconoPlay } from './BotonSonido.jsx'
import Perilla from './Perilla.jsx'

/**
 * CHANNEL RACK táctil (Producción 1; S1 en content/INTERACCIONES.md), como el de FL Studio: una fila por sonido y
 * 16 pasos en 4 grupos de tono alterno (uno por tiempo). Tocar un paso lo enciende o lo apaga; arrastrar el dedo por
 * la fila pinta (o borra) todos los que cruza, como en FL. «Reproducir» lo repite en bucle y el cabezal azul lo
 * recorre; lo que cambias se oye al tiempo siguiente. La luz de cada fila la silencia (como el botón verde de FL).
 *
 * Props:
 *  - filas: ['kick', 'clap', 'hat', 'tom'] (theory/rack.js → FILAS_RACK)
 *  - patron: { kick: [0, 7, 10], … } (controlado) · onCambio(patron): sin él, solo se escucha
 *  - fijas: filas que no se pueden cambiar (las que ya vienen dadas en un ejercicio)
 *  - mudas / onMudas: filas silenciadas (controlado; sin onMudas, la luz no se toca)
 *  - bpm, color (el acento del área)
 *  - guia: patrón con contorno punteado (lo que hay que poner) · marcas: { 'kick:7': 'sobra' | 'mal' }
 *      'sobra' = paso de más (oro, tachado: primer error) · 'mal' = el que faltaba (contorno rojo grueso sobre rojo
 *      suave: segundo error; no relleno, porque el rojo coral de Producción es el de los pasos encendidos)
 *  - alPaso(paso, audibles): cuando se OYE cada paso del bucle (audibles = filas que suenan en ese momento)
 *      'cambio' = paso que acaba de cambiar al pasar de un género a otro (contorno de oro que se apaga solo; P1.2)
 *  - extra: algo más en la barra de arriba (el tempo de la Caja de ritmos)
 *  - api: ref que recibe { empezar, sonando } (para arrancar el bucle desde fuera, p. ej. al elegir un género)
 *  - swing (0–1) / onSwing: la PERILLA de Swing (árbol de géneros): retrasa los pasos impares, como la de FL. Con
 *      `swing` numérico se ve la perilla; sin `onSwing`, solo enseña el valor (el del género).
 *  - pinceles: true = el PINCEL de la P1.3 encima de las filas (Golpe · Suave · ×2 · ×3; theory/rack.js → PINCELES):
 *      lo que pinta el dedo. Tocar un paso con el mismo pincel lo apaga. Los rolls se ven con 2 o 3 barritas y los
 *      suaves, pálidos. Sin `pinceles`, el dedo pone golpes (lo que ya traiga el patrón se ve igual).
 *  - bajo808 / saturado808: la línea de 808 de un género (P1.4: reggaetón, phonk) que suena con el bucle; no tiene fila
 *      (el 808 se escribe en el Piano roll, como en FL Studio).
 */
export default function ChannelRack({ filas, patron, onCambio, fijas = [], mudas = [], onMudas, bpm = 90, color = 'var(--color-produccion)', guia = null, marcas = null, alPaso, extra = null, api = null, swing = null, onSwing, pinceles = false, bajo808 = null, saturado808 = false }) {
  const [sonando, setSonando] = useState(false)
  const [pincel, setPincel] = useState(1)
  const pincelActivo = pinceles ? pincel : 1
  const [cabezal, setCabezal] = useState(null)
  const bucle = useRef(null)
  const reloj = useRef(0)
  const actual = useRef({ patron, mudas, filas, alPaso, swing, bajo808, saturado808 })
  actual.current = { patron, mudas, filas, alPaso, swing, bajo808, saturado808 }
  const editable = Boolean(onCambio)

  const parar = () => bucle.current?.parar()
  useEffect(() => () => parar(), [])
  // El tempo cambia: el bucle vuelve a empezar con el nuevo (solo si ya sonaba).
  useEffect(() => {
    if (bucle.current) empezar()
  }, [bpm]) // eslint-disable-line react-hooks/exhaustive-deps

  const empezar = () => {
    cancelAnimationFrame(reloj.current)
    const b = bucleRack(
      (p) => {
        const { patron: pa, mudas: mu, filas: fi, bajo808: b8, saturado808: sat } = actual.current
        const golpes = fi.filter((f) => !mu.includes(f)).flatMap((f) => golpesPaso(pa, f, p).map((g) => ({ nota: f, ...g })))
        // El 808 del género (sin fila): sus notas, con su duración en segundos.
        for (const n of b8 ?? []) {
          if (n.paso === p) golpes.push({ nota: n.nota, velocity: 0.9, inst: '808', slide: n.slide, saturado: sat, duracion: (60 / bpm / POR_TIEMPO) * n.pasos * 0.95 })
        }
        return golpes
      },
      {
        bpm,
        swing: () => actual.current.swing ?? 0,
        alParar: () => {
          if (bucle.current === b) bucle.current = null
          cancelAnimationFrame(reloj.current)
          setSonando(false)
          setCabezal(null)
        },
      },
    )
    bucle.current = b
    setSonando(true)
    let ultimo = -1
    const tic = () => {
      if (bucle.current !== b) return
      const pos = (tiempoAudio() - b.inicio - latenciaAudio()) / b.paso
      if (pos >= 0) {
        const s = Math.floor(pos) % PASOS
        if (s !== ultimo) {
          ultimo = s
          setCabezal(s)
          const { mudas: mu, filas: fi, alPaso: ap } = actual.current
          ap?.(s, fi.filter((f) => !mu.includes(f)))
        }
      }
      reloj.current = requestAnimationFrame(tic)
    }
    reloj.current = requestAnimationFrame(tic)
  }

  const alternar = () => (sonando ? parar() : empezar())
  if (api) api.current = { empezar: () => !bucle.current && empezar(), sonando: () => Boolean(bucle.current) }

  // ----- Pintar con el dedo -----
  const arrastre = useRef(null)
  // El paso bajo el dedo (los grupos tienen hueco entre ellos: se busca la casilla; si el dedo cae en un hueco o fuera,
  // la más cercana por su posición en la fila).
  const pasoDe = (e, el) => {
    const casilla = document.elementFromPoint?.(e.clientX, e.clientY)?.closest?.('[data-paso]')
    if (casilla && el.contains(casilla)) return Number(casilla.dataset.paso)
    const r = el.getBoundingClientRect()
    return Math.min(PASOS - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * PASOS)))
  }
  // `valor`: null (apagar) o el pincel (1, 's', 2, 3).
  const poner = (fila, paso, valor) => {
    const { patron: pa } = actual.current
    if (tipoDe(pa, fila, paso) === valor) return
    const nuevo = conPaso(pa, fila, paso, valor)
    if (valor && !bucle.current) escucharPaso(fila, golpesPaso(nuevo, fila, paso))
    actual.current.patron = nuevo
    onCambio(nuevo)
  }
  // Lo que suena al poner un paso con el rack parado (un roll, con sus golpes a su tempo).
  const escucharPaso = (fila, lista) => {
    const casilla = (60 / bpm / POR_TIEMPO) * 1000
    lista.forEach((g, i) => (i ? setTimeout(() => golpeAhora(fila, g.velocity), g.dentro * casilla) : golpeAhora(fila, g.velocity)))
  }
  const valorDe = (fila, p) => (tipoDe(actual.current.patron, fila, p) === pincelActivo ? null : pincelActivo)
  const onDown = (fila) => (e) => {
    if (!editable || fijas.includes(fila)) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const p = pasoDe(e, e.currentTarget)
    const valor = valorDe(fila, p)
    arrastre.current = { fila, valor, pointer: e.pointerId, ultimo: p }
    poner(fila, p, valor)
  }
  const onMove = (e) => {
    const a = arrastre.current
    if (!a || a.pointer !== e.pointerId) return
    const p = pasoDe(e, e.currentTarget)
    if (p === a.ultimo) return
    // Si el dedo va rápido, también los pasos que saltó.
    const [de, a2] = p > a.ultimo ? [a.ultimo + 1, p] : [p, a.ultimo - 1]
    for (let i = de; i <= a2; i++) poner(a.fila, i, a.valor)
    a.ultimo = p
  }
  const onUp = (e) => {
    if (arrastre.current?.pointer === e.pointerId) arrastre.current = null
  }
  const teclado = (fila, paso) => (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (editable && !fijas.includes(fila)) poner(fila, paso, valorDe(fila, paso))
  }

  const silenciar = (fila) => {
    const muda = mudas.includes(fila)
    onMudas(muda ? mudas.filter((f) => f !== fila) : [...mudas, fila])
    if (muda && !sonando) golpeAhora(fila, velocidad(fila, 0))
  }

  const tiempoActual = cabezal === null ? null : Math.floor(cabezal / POR_TIEMPO)
  const sinToque = { touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }

  return (
    <div className="flex flex-col gap-3" data-rack={sonando ? 'sonando' : 'quieto'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pulsable
          onClick={alternar}
          data-rack-play
          aria-pressed={sonando}
          className={`flex min-h-12 items-center gap-3 rounded-2xl border py-1.5 pl-2 pr-4 text-base font-medium transition-colors duration-200 ${
            sonando ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-800'
          }`}
        >
          <IconoPlay sonando={sonando} />
          {sonando ? 'Parar' : 'Reproducir'}
        </Pulsable>
        {typeof swing === 'number' && <Perilla valor={swing} onCambio={onSwing} color={color} />}
        {extra ?? <span className="font-dato text-base font-medium tabular-nums text-zinc-600">{bpm} BPM</span>}
      </div>

      {pinceles && editable && <Pinceles pincel={pincel} onPincel={setPincel} color={color} />}

      <div className="flex flex-col gap-1.5 rounded-3xl border border-zinc-200 bg-white p-2 select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* Números de los tiempos: el que suena se marca */}
        <div className="flex items-center gap-2" aria-hidden>
          <span className="w-[4.75rem] shrink-0" />
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((t) => (
              <span key={t} className={`pl-0.5 font-dato text-sm font-medium tabular-nums transition-colors duration-150 ${tiempoActual === t ? 'text-sky-600' : 'text-zinc-500'}`}>
                {t + 1}
              </span>
            ))}
          </div>
        </div>

        {filas.map((f) => {
          const muda = mudas.includes(f)
          const info = FILAS_RACK[f]
          return (
            <div key={f} className="flex items-center gap-2" data-fila={f} data-muda={muda || undefined}>
              {onMudas ? (
                <Pulsable
                  onClick={() => silenciar(f)}
                  aria-pressed={!muda}
                  aria-label={`${info.nombre}: ${muda ? 'silenciado, toca para que suene' : 'suena, toca para silenciarlo'}`}
                  data-luz={f}
                  className={`flex h-11 w-[4.75rem] shrink-0 items-center gap-1.5 rounded-xl px-2 text-left transition-colors duration-200 ${muda ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-100 text-zinc-900'}`}
                >
                  <Luz encendida={!muda} />
                  <span className="truncate text-sm font-bold">{info.fl}</span>
                </Pulsable>
              ) : (
                <span className="flex h-11 w-[4.75rem] shrink-0 items-center gap-1.5 rounded-xl bg-zinc-100 px-2 text-zinc-900" title={info.nombre}>
                  <Luz encendida />
                  <span className="truncate text-sm font-bold">{info.fl}</span>
                </span>
              )}
              <div
                className={`grid h-11 flex-1 grid-cols-4 gap-1.5 transition-opacity duration-200 ${muda ? 'opacity-35' : ''}`}
                style={editable && !fijas.includes(f) ? sinToque : undefined}
                onPointerDown={onDown(f)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                role="group"
                aria-label={`${info.nombre}: 16 pasos`}
              >
                {[0, 1, 2, 3].map((t) => (
                  <div key={t} className="grid grid-cols-4 gap-[2px]">
                    {[0, 1, 2, 3].map((s) => {
                      const p = t * POR_TIEMPO + s
                      return (
                        <Paso
                          key={p}
                          fila={f}
                          paso={p}
                          tipo={tipoDe(patron, f, p)}
                          oscuro={t % 2 === 1}
                          color={color}
                          suena={cabezal === p}
                          guia={guia ? tipoDe(guia, f, p) : null}
                          marca={marcas?.[`${f}:${p}`]}
                          onKeyDown={teclado(f, p)}
                          editable={editable && !fijas.includes(f)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** La luz de la fila: verde = suena (como el botón del canal en FL); gris hueca = silenciada. */
function Luz({ encendida }) {
  return <span aria-hidden className={`size-3 shrink-0 rounded-full border-2 transition-colors duration-200 ${encendida ? 'border-bien bg-bien' : 'border-zinc-400 bg-transparent'}`} />
}

/**
 * El PINCEL (P1.3): control segmentado con lo que pinta el dedo, dibujado como se ve en el paso (una barra, una
 * pálida, dos, tres). El elegido, en blanco y con el color del área.
 */
const NOMBRE_PINCEL = { 1: 'Golpe', s: 'Suave', 2: '×2', 3: '×3' }
const AYUDA_PINCEL = { 1: 'golpe normal', s: 'golpe suave', 2: 'roll de 2', 3: 'roll de 3' }

function Pinceles({ pincel, onPincel, color }) {
  return (
    <div role="radiogroup" aria-label="Pincel" className="grid grid-cols-4 gap-1 rounded-2xl bg-zinc-100 p-1" data-pinceles>
      {PINCELES.map((x) => {
        const elegido = pincel === x
        return (
          <Pulsable
            key={x}
            role="radio"
            aria-checked={elegido}
            aria-label={`Pincel: ${AYUDA_PINCEL[x]}`}
            data-pincel={x}
            onClick={() => onPincel(x)}
            className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-sm font-bold transition-colors duration-200 ${elegido ? 'text-zinc-900' : 'text-zinc-600'}`}
          >
            {elegido && <motion.span layoutId="pincel-elegido" transition={RESORTE.pulsar} aria-hidden className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
            <span aria-hidden className="relative flex h-3.5 w-5 items-stretch justify-center gap-[2px]">
              {Array.from({ length: x === 2 || x === 3 ? x : 1 }, (_, i) => (
                <span key={i} className="w-1.5 rounded-[2px]" style={{ backgroundColor: elegido ? color : 'currentColor', opacity: x === 's' ? 0.42 : 1 }} />
              ))}
            </span>
            <span className="relative">{NOMBRE_PINCEL[x]}</span>
          </Pulsable>
        )
      })}
    </div>
  )
}

const esRoll = (t) => t === 2 || t === 3

/** Un paso del rack. `tipo` = null (apagado), 1, 's', 2 o 3; `guia` = lo mismo, de lo que hay que poner. */
function Paso({ fila, paso, tipo, oscuro, color, suena, guia, marca: m, onKeyDown, editable }) {
  const on = Boolean(tipo)
  const cambio = m === 'cambio'
  const marca = cambio ? undefined : m
  const lleno = on && tipo === 1
  const fondo =
    marca === 'mal' ? 'var(--color-mal-suave)' : marca === 'sobra' ? 'var(--color-fijate)' : lleno ? color : oscuro ? 'var(--color-zinc-300)' : 'var(--color-zinc-200)'
  // La guía se ve mientras lo puesto no sea lo que va (también si es otro pincel).
  const conGuia = Boolean(guia) && guia !== tipo
  const nombreTipo = tipo === 's' ? ', suave' : esRoll(tipo) ? `, roll de ${tipo}` : ''
  return (
    <motion.button
      type="button"
      tabIndex={editable ? 0 : -1}
      onKeyDown={onKeyDown}
      data-paso={paso}
      data-on={on || undefined}
      data-tipo={on && tipo !== 1 ? tipo : undefined}
      data-marca={marca}
      aria-pressed={on}
      aria-label={`${FILAS_RACK[fila].nombre}, paso ${paso + 1}${nombreTipo}${marca === 'sobra' ? ', no va así' : marca === 'mal' ? ', así va' : ''}`}
      initial={false}
      animate={{ scale: on && suena ? 1.12 : 1 }}
      transition={RESORTE.pulsar}
      className={`relative h-full min-w-0 rounded-[5px] outline-offset-1 ${suena ? 'ring-2 ring-sky-500' : ''} ${marca === 'mal' ? 'border-[3px] border-mal' : conGuia ? 'border-2 border-dashed border-zinc-500' : ''}`}
      style={{ backgroundColor: fondo, touchAction: 'none', cursor: editable ? 'pointer' : 'default' }}
    >
      {on && !lleno && marca !== 'sobra' && (
        // Suave = pálido; roll = 2 o 3 barritas (el hueco entre ellas, del color del paso apagado).
        <span aria-hidden className="pointer-events-none absolute inset-0 flex gap-[2px] overflow-hidden rounded-[3px]">
          {Array.from({ length: esRoll(tipo) ? tipo : 1 }, (_, i) => (
            <span key={i} className="flex-1" style={{ backgroundColor: color, opacity: tipo === 's' ? 0.42 : 1 }} />
          ))}
        </span>
      )}
      {conGuia && esRoll(guia) && (
        // Guía de un roll: rayitas punteadas donde se parte el paso.
        <span aria-hidden className="pointer-events-none absolute inset-0 flex">
          {Array.from({ length: guia }, (_, i) => (
            <span key={i} className={`flex-1 ${i ? 'border-l-2 border-dashed border-zinc-500' : ''}`} />
          ))}
        </span>
      )}
      {cambio && (
        // Lo que cambió al pasar de un género a otro: contorno de oro que aparece con un pop y se apaga.
        <motion.span
          aria-hidden
          data-cambio
          className="pointer-events-none absolute -inset-[3px] rounded-[7px] border-[3px] border-fijate"
          initial={{ opacity: 0, scale: 1.25 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [1.25, 1, 1, 1] }}
          transition={{ duration: 1.3, times: [0, 0.15, 0.7, 1] }}
        />
      )}
      {marca === 'sobra' && (
        // Tachado: lo elegido que sobra o lleva otro pincel (primer error, en oro)
        <span aria-hidden className="absolute inset-0 rounded-[5px]" style={{ background: 'linear-gradient(to top right, transparent calc(50% - 1.5px), var(--color-fijate-tinta) calc(50% - 1.5px), var(--color-fijate-tinta) calc(50% + 1.5px), transparent calc(50% + 1.5px))' }} />
      )}
    </motion.button>
  )
}
