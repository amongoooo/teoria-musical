import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { elegirNivel, guardarAjustes } from '../progress/oido.js'
import { CROMATICA, getJuego, nombreClase, notaNuevaDelNivel, notasDelNivel } from '../theory/oido.js'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Circulo8, Cronometro, Info, Oreja, Rayo } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import Rich from './Rich.jsx'
import { Segmentado } from './Opciones.jsx'

/**
 * Arranque de un ejercicio del entrenamiento de oído (pedido del usuario; por ahora solo el oído absoluto):
 * título grande, ícono, descripción con la burbuja ⓘ que se despliega, modos de juego en bloques, nivel en una rueda
 * vertical (el 1 abajo) junto a la cajita de notas, y «Responder con» con una vista pequeña del piano o de los botones.
 * Sin textos grises de instrucciones: se entiende por el movimiento y el color.
 */
export default function ArranqueOido({ modo, datos }) {
  const cifrado = datos.ajustes.cifrado === 'en' ? 'en' : 'es'
  const cambiarCifrado = () => guardarAjustes(modo.id, { cifrado: cifrado === 'en' ? 'es' : 'en' })
  // Nivel que se ve en la rueda mientras se desliza (la cajita de notas lo sigue al instante).
  const [vista, setVista] = useState(datos.nivel)
  const conPiano = datos.ajustes.respuesta !== 'botones'

  return (
    <LayoutGroup>
      <motion.div variants={lista} initial="oculta" animate="visible" className="flex flex-col gap-8">
        <motion.header variants={itemLista} layout="position" className="flex flex-col items-center gap-5 text-center">
          <h1 className="font-titulo text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">{modo.titulo}</h1>
          {/* Insignia del ejercicio: el mismo ícono, con relieve como las islas (pantalla de «iniciar nivel»). */}
          <motion.span
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
            className="grid size-24 place-items-center rounded-[1.75rem] text-blanco"
            style={{ backgroundColor: oscuro(modo.acento), boxShadow: `0 7px 0 ${labio(modo.acento)}` }}
            aria-hidden
          >
            <Oreja className="size-14" />
          </motion.span>
          <Descripcion texto={modo.descripcion} info={modo.info} />
        </motion.header>

        {modo.juegos && (
          <motion.section variants={itemLista} layout="position" className="flex flex-col gap-3">
            <Titulo>Modo de juego</Titulo>
            <ModosJuego modo={modo} datos={datos} />
          </motion.section>
        )}

        <motion.section variants={itemLista} layout="position" className="flex flex-col gap-3">
          <Titulo id="nivel">Nivel</Titulo>
          <div className="flex gap-3">
            <RuedaNivel
              total={modo.niveles}
              max={datos.nivelMax}
              valor={datos.nivel}
              onVista={setVista}
              onElegir={(n) => elegirNivel(modo.id, n)}
              acento={modo.acento}
            />
            <CajaNotas nivel={vista} cifrado={cifrado} onCifrado={cambiarCifrado} acento={modo.acento} />
          </div>
        </motion.section>

        {modo.piano && (
          <motion.section variants={itemLista} layout="position" className="flex flex-col gap-3">
            <Titulo id="responder-con">Responder con</Titulo>
            <Segmentado
              etiqueta="responder-con"
              capa="responder-con"
              opciones={[
                { id: 'piano', nombre: 'Piano' },
                { id: 'botones', nombre: 'Botones' },
              ]}
              valor={conPiano ? 'piano' : 'botones'}
              onCambiar={(id) => guardarAjustes(modo.id, { respuesta: id })}
            />
            <div className="grid" data-vista-respuesta={conPiano ? 'piano' : 'botones'}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={conPiano ? 'piano' : 'botones'}
                  initial={{ opacity: 0, x: conPiano ? -24 : 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: conPiano ? 24 : -24 }}
                  transition={{ ...RESORTE.suave, opacity: { duration: 0.18 } }}
                  className="col-start-1 row-start-1 flex justify-center"
                >
                  {conPiano ? (
                    <MiniPiano nivel={datos.nivel} />
                  ) : (
                    <MiniBotones nivel={datos.nivel} cifrado={cifrado} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </motion.div>
    </LayoutGroup>
  )
}

/** Título de sección con aire de videojuego (letra de juego, centrado). */
function Titulo({ id, children }) {
  return (
    <h2 id={id} className="text-center font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">
      {children}
    </h2>
  )
}

/** Relieve sólido bajo bloques y tarjetas (como el labio de las islas): se ve «apretable», de juego. */
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

// ---------------------------------------------------------------------------
// Descripción + burbuja ⓘ: cerrada es un círculo de oro con la «i»; al tocarla se despliega (el círculo se estira
// hasta ser la burbuja con el texto) y al tocarla otra vez se recoge.
// ---------------------------------------------------------------------------

function Descripcion({ texto, info }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-xl leading-relaxed text-zinc-600">{texto}</p>
      {info &&
        (abierta ? (
          <Pulsable
            layoutId="burbuja-info"
            tipo="tarjeta"
            onClick={() => setAbierta(false)}
            aria-expanded
            aria-label="Ocultar información"
            data-info="abierta"
            className="flex w-full items-start gap-3 bg-fijate-suave px-4 py-3.5 text-left text-fijate-tinta"
            style={{ borderRadius: 22 }}
          >
            <motion.span layoutId="burbuja-info-i" className="grid pt-0.5">
              <Info className="size-6" />
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.2 }}
              className="flex-1 text-base leading-relaxed"
            >
              <Rich>{info}</Rich>
            </motion.span>
          </Pulsable>
        ) : (
          <Pulsable
            layoutId="burbuja-info"
            onClick={() => setAbierta(true)}
            aria-expanded={false}
            aria-label="Más información"
            data-info="cerrada"
            className="grid size-11 shrink-0 place-items-center bg-fijate-suave text-fijate-tinta"
            style={{ borderRadius: 22 }}
          >
            <motion.span layoutId="burbuja-info-i" className="grid">
              <Info className="size-6" />
            </motion.span>
          </Pulsable>
        ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modos de juego: bloques con ícono. Tocar uno lo elige y lo abre (su texto sale debajo, con un piquito que apunta a
// él); tocarlo otra vez lo cierra (sigue elegido).
// ---------------------------------------------------------------------------

const ICONO_JUEGO = { normal: Circulo8, rapido: Rayo, contrarreloj: Cronometro }

function ModosJuego({ modo, datos }) {
  const actual = getJuego(datos.ajustes.juego)
  const [abierto, setAbierto] = useState(false)
  const n = modo.juegos.length
  const i = modo.juegos.findIndex((j) => j.id === actual.id)
  const centro = `${((i + 0.5) / n) * 100}%`
  const acento = modo.acento

  const tocar = (j) => {
    if (j.id === actual.id) setAbierto((a) => !a)
    else {
      guardarAjustes(modo.id, { juego: j.id })
      setAbierto(true)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {modo.juegos.map((j) => {
          const Icono = ICONO_JUEGO[j.id] ?? Circulo8
          const activo = j.id === actual.id
          return (
            <Pulsable
              key={j.id}
              tipo="tarjeta"
              onClick={() => tocar(j)}
              aria-pressed={activo}
              aria-expanded={activo ? abierto : undefined}
              data-juego={j.id}
              className={`flex min-h-26 flex-col items-center justify-center gap-2 rounded-3xl border-2 px-1 py-3 transition-[background-color,border-color,color,box-shadow] duration-200 ${
                activo ? 'border-transparent text-blanco' : 'border-zinc-200 bg-white text-zinc-700'
              }`}
              style={
                activo
                  ? { backgroundColor: oscuro(acento), boxShadow: `0 5px 0 ${labio(acento)}` }
                  : { boxShadow: RELIEVE }
              }
            >
              <Icono className="size-8" />
              <span className="font-juego text-base font-semibold leading-tight tracking-tight">{j.nombre}</span>
            </Pulsable>
          )
        })}
      </div>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            key="texto"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={RESORTE.suave}
            style={{ transformOrigin: `${centro} 0%` }}
            className="relative pt-4"
            data-juego-texto={actual.id}
          >
            <motion.span
              aria-hidden
              className="absolute top-2.5 size-4 rounded-[4px]"
              initial={false}
              animate={{ left: centro }}
              transition={RESORTE.pulsar}
              style={{ x: '-50%', rotate: 45, backgroundColor: claro(acento) }}
            />
            <div className="relative overflow-hidden rounded-2xl px-4 py-3.5 text-center" style={{ backgroundColor: claro(acento), color: tinta(acento) }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={actual.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ ...RESORTE.suave, opacity: { duration: 0.15 } }}
                  className="text-lg font-medium leading-snug"
                >
                  {actual.descripcion}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rueda de nivel (vertical, el 1 abajo): se desliza con el dedo (lo sigue 1:1 tras una zona muerta corta), al soltar
// se asienta en el más cercano (con la inercia del gesto) y con goma en los extremos. Encima del último desbloqueado
// asoma el siguiente con candado (no se puede elegir). Tocar un nivel que se ve lo elige; flechas ↑ ↓ también.
// ---------------------------------------------------------------------------

const ALTO_ITEM = 60
const ZONA_MUERTA = 8
const INERCIA_MS = 160

function RuedaNivel({ total, max, valor, onVista, onElegir, acento }) {
  const ultimo = Math.max(0, Math.min(total, max) - 1) // índice del último que se puede elegir
  const vistos = Math.min(total, max + 1) // + el siguiente con candado
  const pos = useMotionValue(valor - 1)
  const anim = useRef(null)
  const gesto = useRef(null)
  const caja = useRef(null)
  const [actual, setActual] = useState(valor - 1)

  useMotionValueEvent(pos, 'change', (v) => {
    const k = Math.max(0, Math.min(ultimo, Math.round(v)))
    setActual(k)
    onVista(k + 1)
  })

  const ir = (k) => {
    const destino = Math.max(0, Math.min(ultimo, k))
    anim.current?.stop()
    anim.current = animate(pos, destino, RESORTE.pantalla)
    if (destino + 1 !== valor) onElegir(destino + 1)
  }

  // Si el nivel cambia por fuera (p. ej. se desbloquea uno), la rueda va a él.
  useEffect(() => {
    if (gesto.current) return
    if (Math.round(pos.get()) !== valor - 1) {
      anim.current?.stop()
      anim.current = animate(pos, valor - 1, RESORTE.pantalla)
    }
  }, [valor, pos])

  const goma = (v) => {
    if (v > ultimo) return ultimo + 0.6 * (1 - 1 / (1 + (v - ultimo) * 0.9))
    if (v < 0) return -0.6 * (1 - 1 / (1 + -v * 0.9))
    return v
  }

  const abajo = (e) => {
    anim.current?.stop()
    gesto.current = { y0: e.clientY, p0: pos.get(), movido: false, muestras: [{ t: e.timeStamp, y: e.clientY }] }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const mueve = (e) => {
    const g = gesto.current
    if (!g) return
    const dy = e.clientY - g.y0
    if (!g.movido && Math.abs(dy) < ZONA_MUERTA) return
    if (!g.movido) {
      g.movido = true
      g.y0 += Math.sign(dy) * ZONA_MUERTA // desde aquí sigue al dedo 1:1, sin salto
    }
    g.muestras.push({ t: e.timeStamp, y: e.clientY })
    if (g.muestras.length > 6) g.muestras.shift()
    // Dedo hacia abajo = sube el nivel (los niveles altos están arriba).
    pos.set(goma(g.p0 + (e.clientY - g.y0) / ALTO_ITEM))
  }
  const suelta = (e) => {
    const g = gesto.current
    gesto.current = null
    if (!g) return
    if (!g.movido) {
      // Toque: elige el nivel que está bajo el dedo.
      const r = caja.current.getBoundingClientRect()
      const k = Math.round(pos.get() - (e.clientY - (r.top + r.height / 2)) / ALTO_ITEM)
      ir(k)
      return
    }
    const a = g.muestras[0]
    const b = g.muestras[g.muestras.length - 1]
    const v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0 // px/ms
    ir(Math.round(pos.get() + (v * INERCIA_MS) / ALTO_ITEM))
  }

  const tecla = (e) => {
    if (e.key === 'ArrowUp') ir(actual + 1)
    else if (e.key === 'ArrowDown') ir(actual - 1)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={caja}
      role="slider"
      tabIndex={0}
      aria-labelledby="nivel"
      aria-orientation="vertical"
      aria-valuemin={1}
      aria-valuemax={ultimo + 1}
      aria-valuenow={actual + 1}
      data-rueda-nivel
      data-posicion={actual + 1}
      onPointerDown={abajo}
      onPointerMove={mueve}
      onPointerUp={suelta}
      onPointerCancel={suelta}
      onKeyDown={tecla}
      className="relative w-24 shrink-0 cursor-grab touch-none select-none rounded-3xl border-2 border-zinc-200 bg-white outline-none focus-visible:ring-4 focus-visible:ring-sky-300 active:cursor-grabbing"
      style={{ boxShadow: RELIEVE }}
    >
      {/* Ranura del elegido: del color del modo, como el marcador de un selector de nivel. */}
      <div
        className="pointer-events-none absolute inset-x-1.5 top-1/2 rounded-2xl"
        style={{ height: ALTO_ITEM, marginTop: -ALTO_ITEM / 2, backgroundColor: claro(acento) }}
        aria-hidden
      />
      <div
        className="absolute inset-0 overflow-hidden rounded-[1.375rem]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)',
        }}
      >
        {Array.from({ length: vistos }, (_, i) => (
          <ItemRueda key={i} i={i} pos={pos} bloqueado={i > ultimo} acento={acento} />
        ))}
      </div>
    </div>
  )
}

function ItemRueda({ i, pos, bloqueado, acento }) {
  const y = useTransform(pos, (p) => (p - i) * ALTO_ITEM)
  const distancia = useTransform(pos, (p) => Math.abs(p - i))
  const scale = useTransform(distancia, [0, 1, 2], [1, 0.72, 0.55])
  const opacity = useTransform(distancia, [0, 1, 2.2], [1, 0.45, 0])
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 grid place-items-center"
      style={{ height: ALTO_ITEM, marginTop: -ALTO_ITEM / 2, y, scale, opacity, color: tinta(acento) }}
      data-nivel={i + 1}
    >
      {bloqueado ? <Candado className="size-8 text-zinc-400" /> : <span className="font-juego text-4xl leading-none">{i + 1}</span>}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Cajita de notas: las 12 notas; las del nivel se encienden con el color del modo y la que se suma en ese nivel va
// en oro («nuevo»). Tocar cualquier nombre cambia todas entre Do / C.
// ---------------------------------------------------------------------------

function CajaNotas({ nivel, cifrado, onCifrado, acento }) {
  const libres = new Set(notasDelNivel(nivel))
  const nueva = notaNuevaDelNivel(nivel)
  return (
    <div
      className="grid min-w-0 flex-1 grid-cols-3 content-center gap-1.5 rounded-3xl border-2 border-zinc-200 bg-white p-2.5"
      style={{ boxShadow: RELIEVE }}
      data-caja-notas
    >
      {CROMATICA.map((c) => {
        const libre = libres.has(c)
        const esNueva = c === nueva
        const nombre = nombreClase(c, cifrado)
        return (
          <Pulsable
            key={c}
            onClick={onCifrado}
            aria-label={`${nombre}: cambiar a ${cifrado === 'en' ? 'Do, Re, Mi' : 'C, D, E'}`}
            data-nota={c}
            data-libre={libre || undefined}
            className={`grid h-10 place-items-center overflow-hidden rounded-xl text-base font-semibold transition-[background-color,color,opacity] duration-200 ${
              esNueva ? 'bg-fijate text-negro' : libre ? '' : 'text-zinc-500 opacity-50'
            }`}
            style={libre && !esNueva ? { backgroundColor: claro(acento), color: tinta(acento) } : undefined}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={nombre}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ ...RESORTE.pulsar, opacity: { duration: 0.12 } }}
                className="col-start-1 row-start-1"
              >
                {nombre}
              </motion.span>
            </AnimatePresence>
          </Pulsable>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vistas pequeñas de «Responder con» (solo se miran): el piano de una octava con candados en las notas que faltan, o
// los botones con los nombres de las notas del nivel.
// ---------------------------------------------------------------------------

const BLANCAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const NEGRAS = [
  ['C#', 1],
  ['D#', 2],
  ['F#', 4],
  ['G#', 5],
  ['A#', 6],
]

function MiniPiano({ nivel }) {
  const libres = new Set(notasDelNivel(nivel))
  return (
    <div className="tema-claro relative flex h-24 w-full max-w-xs overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-300" data-mini-piano aria-hidden>
      {BLANCAS.map((c) => (
        <div
          key={c}
          className={`flex flex-1 items-end justify-center border-r border-zinc-300 pb-2 last:border-r-0 transition-colors duration-200 ${
            libres.has(c) ? 'bg-white' : 'bg-zinc-100'
          }`}
        >
          {!libres.has(c) && <Candado className="size-4 text-zinc-400" />}
        </div>
      ))}
      {NEGRAS.map(([c, k]) => (
        <div
          key={c}
          className={`absolute top-0 flex h-[58%] w-[9%] items-end justify-center rounded-b-md pb-1.5 transition-colors duration-200 ${
            libres.has(c) ? 'bg-zinc-800' : 'bg-zinc-400'
          }`}
          style={{ left: `${(k / 7) * 100}%`, transform: 'translateX(-50%)' }}
        >
          {!libres.has(c) && <Candado className="size-3 text-zinc-200" />}
        </div>
      ))}
    </div>
  )
}

function MiniBotones({ nivel, cifrado }) {
  const notas = notasDelNivel(nivel)
  return (
    <div
      className={`grid w-full max-w-xs gap-1.5 ${notas.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}
      data-mini-botones
      aria-hidden
    >
      {notas.map((c) => (
        <div
          key={c}
          className="grid min-h-10 place-items-center rounded-xl border-2 border-zinc-200 bg-white text-base font-semibold text-zinc-800"
        >
          {nombreClase(c, cifrado)}
        </div>
      ))}
    </div>
  )
}
