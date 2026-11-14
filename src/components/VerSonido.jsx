import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { golpeAhora, playNotes } from '../audio/engine.js'
import { eventosSonido, notasDe, reproducir } from '../audio/sonido.js'
import { PERCUSION, esPercusion, formaGroove } from '../theory/bateria.js'
import { midi, nombre, notaDesdeMidi } from '../theory/notas.js'
import { oscuro, tinta } from '../ui/color.js'
import { Metronomo } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import { Pad } from './PiezasRitmo.jsx'

// LO QUE SUENA, A LA VISTA (pedido del usuario: «que salgan los componentes que dice: un botón de metrónomo y pads como
// los de las lecciones de ritmo, resaltado en cada caja»). Solo en los pasos para APRENDER (texto y siente: BotonSonido
// con `ver`); en las preguntas no, porque delataría la respuesta.
//  - groove: metrónomo (BPM y un puntito por tiempo que se enciende; tocarlo = solo el clic) + un pad por instrumento
//    (Bombo, Caja, Palmas, Hi-hat) que se ilumina en cada golpe con su fuerza; tocarlo = ese golpe. Si el groove
//    lleva piano, también el teclado.
//  - notas: un teclado de las octavas que usa, con las notas del sonido marcadas; cada una se enciende (celeste = lo que
//    suena) y abajo su nombre. Tocar una tecla la hace sonar.
//  - frecuencia: la onda, más apretada cuanto más aguda, que corre mientras suena.

const ORDEN_GOLPES = ['kick', 'snare', 'clap', 'hat', 'tom']

/** Lo que el sonido trae para ver: { groove?: { bpm, tiempos, golpes, compases }, notas?: [midi…], frecuencia? }. */
export function partesSonido(sonido) {
  if (sonido.frecuencia) return { frecuencia: sonido.frecuencia }
  const eventos = eventosSonido(sonido)
  const tonos = [...new Set(eventos.flatMap(notasDe).filter((n) => !esPercusion(n)).map(midi))].sort((a, b) => a - b)
  const partes = { notas: tonos.length ? tonos : null }
  if (sonido.groove) {
    const forma = formaGroove(sonido.groove, sonido)
    const golpes = ORDEN_GOLPES.filter((g) => eventos.some((e) => notasDe(e).includes(g)))
    partes.groove = { bpm: sonido.bpm ?? 90, tiempos: forma.tiempos, porTiempo: forma.porTiempo, compases: sonido.compases ?? 2, golpes }
  }
  return partes
}

/**
 * Estado de lo que suena para la vista: `alSonar` se pasa a reproducir(); `vista` = { pulso, golpes: { kick: {n, fuerza} },
 * teclas: { midi: veces }, ultimas: ['C4'…] }.
 */
export function useVistaSonido(sonido) {
  const [vista, setVista] = useState({ pulso: -1, golpes: {}, teclas: {}, ultimas: [] })
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const encender = (notas, dur) => {
    const tonos = notas.filter((n) => !esPercusion(n))
    const golpes = notas.filter(esPercusion)
    setVista((v) => {
      const g = { ...v.golpes }
      for (const x of golpes) g[x] = { n: (g[x]?.n ?? 0) + 1, fuerza: dur.fuerza }
      const teclas = { ...v.teclas }
      for (const t of tonos) teclas[midi(t)] = (teclas[midi(t)] ?? 0) + 1
      return { ...v, golpes: g, teclas, ultimas: tonos.length ? tonos : v.ultimas }
    })
    if (tonos.length) {
      const t = setTimeout(
        () =>
          setVista((v) => {
            const teclas = { ...v.teclas }
            for (const x of tonos) teclas[midi(x)] = Math.max(0, (teclas[midi(x)] ?? 1) - 1)
            return { ...v, teclas }
          }),
        Math.min(dur.segundos, 1.2) * 1000,
      )
      timers.current.push(t)
    }
  }

  const forma = sonido.groove ? formaGroove(sonido.groove, sonido) : null
  const alSonar = (e) => {
    if (forma && e.casilla != null && e.casilla % forma.porTiempo === 0) setVista((v) => ({ ...v, pulso: e.compas * forma.tiempos + e.casilla / forma.porTiempo }))
    encender(notasDe(e), { segundos: e.duracion, fuerza: e.velocidad })
  }
  const alParar = () => setVista((v) => ({ ...v, pulso: -1, teclas: {} }))
  return { vista, alSonar, alParar, encender, setPulso: (pulso) => setVista((v) => ({ ...v, pulso })) }
}

/** La vista de un sonido (debajo de su botón). */
export function VerSonido({ sonido, partes, vista, color, sonando, encender, setPulso }) {
  return (
    <div className="flex flex-col gap-3" data-ver-sonido>
      {partes.groove && <VerMetronomo groove={partes.groove} pulso={vista.pulso} color={color} setPulso={setPulso} />}
      {partes.groove?.golpes.length > 0 && <Pads golpes={partes.groove.golpes} vista={vista} color={color} encender={encender} />}
      {partes.notas && <TecladoSonido notas={partes.notas} vista={vista} color={color} encender={encender} />}
      {partes.frecuencia && <Onda hz={partes.frecuencia} sonando={sonando} />}
    </div>
  )
}

/** Metrónomo: «90 BPM» y un puntito por tiempo (el 1 más grande); tocarlo = solo el clic a ese tempo. */
function VerMetronomo({ groove, pulso, color, setPulso }) {
  const { bpm, tiempos, compases } = groove
  const actual = pulso >= 0 ? pulso % tiempos : -1
  const tocar = () =>
    reproducir(
      { groove: Array.from({ length: tiempos }, (_, t) => ({ nota: 'click', inicio: t, velocity: t === 0 ? 1 : 0.6 })), tiempos, porTiempo: 1, bpm, compases },
      { alSonar: (e) => setPulso(e.compas * tiempos + e.casilla), alParar: () => setPulso(-1) },
    )
  return (
    <Pulsable
      tipo="tarjeta"
      onClick={tocar}
      aria-label={`Metrónomo a ${bpm} BPM`}
      data-metronomo={bpm}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-2 text-left"
    >
      <Metronomo className="size-6 shrink-0" style={{ color: tinta(color) }} />
      <span className="font-dato text-lg font-medium tabular-nums text-zinc-900">
        {bpm} <span className="text-base text-zinc-500">BPM</span>
      </span>
      <span className="ml-auto flex items-center gap-2" aria-hidden>
        {Array.from({ length: tiempos }, (_, i) => (
          <motion.span
            key={i}
            data-pulso={i}
            data-encendido={i === actual || undefined}
            className={`rounded-full ${i === 0 ? 'size-4' : 'size-3'}`}
            initial={false}
            animate={{ backgroundColor: i === actual ? oscuro(color) : 'var(--color-zinc-300)', scale: i === actual ? 1.35 : 1 }}
            transition={{ duration: 0.08 }}
          />
        ))}
      </span>
    </Pulsable>
  )
}

/** Un pad de goma por instrumento del groove: se ilumina con cada golpe; tocarlo lo hace sonar. */
function Pads({ golpes, vista, color, encender }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${golpes.length}, minmax(0, 1fr))` }}>
      {golpes.map((g) => (
        <Pad
          key={g}
          chico
          color={color}
          destello={vista.golpes[g]}
          data-pad-sonido={g}
          data-golpes={vista.golpes[g]?.n ?? 0}
          aria-label={PERCUSION[g] ?? g}
          onToque={() => golpeAhora(g)}
        >
          {PERCUSION[g] ?? g}
        </Pad>
      ))}
    </div>
  )
}

const NEGRAS = new Set([1, 3, 6, 8, 10])

/**
 * Teclado de las octavas que usa el sonido (de Do a Si). Las notas del sonido llevan un puntito del color; la que suena
 * se enciende en celeste. Abajo, el nombre de lo último que sonó.
 */
function TecladoSonido({ notas, vista, color, encender }) {
  const desde = Math.floor(notas[0] / 12) * 12
  const hasta = Math.floor(notas[notas.length - 1] / 12) * 12 + 11
  const teclas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
  const blancas = teclas.filter((m) => !NEGRAS.has(m % 12))
  const ancho = 100 / blancas.length
  const delSonido = new Set(notas)
  const tocar = (m) => {
    const n = notaDesdeMidi(m)
    playNotes(n, { duracion: 0.6 })
    encender([n], { segundos: 0.4, fuerza: 1 })
  }
  const tecla = (m, negra, izquierda) => {
    const encendida = vista.teclas[m] > 0
    return (
      <button
        key={m}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          tocar(m)
        }}
        aria-label={nombre(notaDesdeMidi(m))}
        data-tecla-sonido={notaDesdeMidi(m)}
        data-encendida={encendida || undefined}
        className={`absolute grid place-items-end justify-center pb-1.5 transition-colors duration-75 ${
          negra ? 'top-0 z-10 h-[60%] rounded-b-md' : 'top-0 h-full rounded-b-lg border border-zinc-300'
        } ${encendida ? 'bg-sky-500' : negra ? 'bg-zinc-900' : 'bg-white'}`}
        style={{ left: `${izquierda}%`, width: `${negra ? ancho * 0.6 : ancho}%`, touchAction: 'manipulation' }}
      >
        {delSonido.has(m) && !encendida && (
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: negra ? 'var(--color-white)' : oscuro(color) }} />
        )}
      </button>
    )
  }
  let b = -1
  const piezas = teclas.map((m) => {
    if (!NEGRAS.has(m % 12)) {
      b++
      return tecla(m, false, b * ancho)
    }
    return tecla(m, true, (b + 1) * ancho - ancho * 0.3)
  })
  return (
    <div className="flex flex-col gap-2">
      <div className="tema-claro relative h-24 overflow-hidden rounded-xl bg-zinc-300" data-teclado-sonido>
        {piezas}
      </div>
      <p className="min-h-6 text-center font-dato text-base font-medium text-zinc-700" aria-live="polite" data-nombres-sonido>
        {vista.ultimas.map((n) => nombre(n)).join(' · ')}
      </p>
    </div>
  )
}

/** La onda de una frecuencia: más vueltas cuanto más aguda (escala logarítmica); corre mientras suena. */
function Onda({ hz, sonando }) {
  // Vueltas en cada mitad (entera): el dibujo mide dos anchos y corre medio, así el bucle no se nota.
  const vueltas = Math.round(Math.max(1, Math.min(14, 1 + Math.log2(hz / 55) * 2)))
  const puntos = Array.from({ length: 481 }, (_, i) => {
    const x = (i / 480) * 400
    const y = 30 - 22 * Math.sin((i / 480) * 2 * vueltas * 2 * Math.PI)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-100 px-2 py-2" data-onda={hz}>
      <motion.svg
        viewBox="0 0 400 60"
        className="h-14 w-[200%]"
        preserveAspectRatio="none"
        animate={sonando ? { x: ['0%', '-50%'] } : { x: '0%' }}
        transition={sonando ? { duration: 1, ease: 'linear', repeat: Infinity } : { duration: 0.2 }}
        aria-hidden
      >
        <polyline points={puntos} fill="none" style={{ stroke: 'var(--color-sky-500)' }} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </motion.svg>
    </div>
  )
}
