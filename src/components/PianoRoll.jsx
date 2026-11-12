import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playNotes, playPattern } from '../audio/engine.js'
import { PERCUSION, claveNota, esPercusion } from '../theory/bateria.js'
import { midi, nombre, notaDesdeMidi, parseNota } from '../theory/notas.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useSobreBarra from '../ui/useSobreBarra.js'
import { IconoPlay } from './BotonSonido.jsx'

/**
 * Mini Piano Roll táctil (como el de FL Studio, simplificado para el celular).
 *  - Filas = notas (arriba agudo), columnas = tiempo (casillas).
 *  - Tocar una casilla vacía crea una nota; arrastrar a la derecha la alarga.
 *  - Tocar una nota la borra; arrastrar desde ella cambia su duración.
 *  - Carril de velocity abajo: desliza el dedo arriba/abajo sobre una columna.
 *
 * Props:
 *  - roll: { filas | rango, soloBlancas, columnas, porTiempo, compas, bpm, etiquetas, alternar, velocity }
 *      compas: tiempos por compás (los números vuelven a 1 y la línea de compás es más marcada).
 *      nombres: { C4: 'Redonda', … } → texto propio para la columna de la izquierda (más ancha).
 *  - notas: [{ id, nota, inicio, duracion, velocity }]  (controlado)
 *  - onCambio(notas): si falta, el roll es solo de lectura.
 *  - soloVelocity: solo se puede cambiar la velocity (no crear ni borrar notas).
 *  - fantasma: notas guía (contorno punteado); `fantasmaBien` las pinta en verde.
 *  - color: color de las notas (acento del módulo).
 */
export default function PianoRoll({ roll = {}, notas, onCambio, soloVelocity = false, fantasma = [], fantasmaBien = false, color = 'var(--color-modulo-1)' }) {
  const filas = filasDe(roll)
  const columnas = roll.columnas ?? 8
  const porTiempo = roll.porTiempo ?? 2
  const compas = roll.compas ?? null
  const inicioCompas = (t) => compas && t > 0 && t % compas === 0
  const paso = 60 / (roll.bpm ?? 100) / porTiempo
  const editable = Boolean(onCambio)
  const [etiquetas, setEtiquetas] = useState(roll.etiquetas ?? 'app')
  const [cabezal, setCabezal] = useState(null) // columna que suena al reproducir
  const [ultimaVel, setUltimaVel] = useState(null)
  const alto = filas.length > 6 ? 'h-8' : 'h-10'
  const nombres = roll.nombres ?? null
  // «Sol♯4» no cabe en w-14 (DM Mono): con alguna fila de Sol♯, la columna se ensancha un poco.
  const ancho = nombres ? 'w-[6.5rem]' : filas.some(esPercusion) ? 'w-[4.5rem]' : filas.some((f) => /^G#/.test(f)) ? 'w-16' : 'w-14'

  const areaRef = useRef(null)
  const cajaRef = useRef(null)
  useSobreBarra(cajaRef)
  const carrilRef = useRef(null)
  const arrastre = useRef(null)
  const reloj = useRef(0)
  useEffect(() => () => cancelAnimationFrame(reloj.current), [])

  const fila = (nota) => filas.findIndex((f) => claveNota(f) === claveNota(nota))

  const reproducir = () => {
    cancelAnimationFrame(reloj.current)
    const total = playPattern(notas, { paso })
    const t0 = performance.now() + 50
    const fin = Math.max(total, columnas * paso)
    const tic = () => {
      const s = (performance.now() - t0) / 1000
      if (s > fin) return setCabezal(null)
      setCabezal(Math.max(0, Math.floor(s / paso)))
      reloj.current = requestAnimationFrame(tic)
    }
    tic()
  }

  // ----- Rejilla de notas -----
  const celda = (e) => {
    const r = areaRef.current.getBoundingClientRect()
    const c = Math.floor(((e.clientX - r.left) / r.width) * columnas)
    const f = Math.floor(((e.clientY - r.top) / r.height) * filas.length)
    return { c: Math.min(columnas - 1, Math.max(0, c)), f: Math.min(filas.length - 1, Math.max(0, f)) }
  }

  const onDown = (e) => {
    if (!editable || soloVelocity) return
    e.preventDefault()
    areaRef.current.setPointerCapture?.(e.pointerId)
    const { c, f } = celda(e)
    const existente = notas.find((n) => fila(n.nota) === f && c >= n.inicio && c < n.inicio + n.duracion)
    if (existente) {
      arrastre.current = { id: existente.id, inicio: existente.inicio, fila: f, nueva: false, movido: false, pointer: e.pointerId }
      return
    }
    const nueva = { id: nuevoId(), nota: filas[f], inicio: c, duracion: 1, velocity: roll.velocityInicial ?? 0.78 }
    playNotes(nueva.nota, { duracion: 0.4, velocidad: nueva.velocity })
    arrastre.current = { id: nueva.id, inicio: c, fila: f, nueva: true, movido: false, pointer: e.pointerId }
    onCambio([...notas, nueva])
  }

  const onMove = (e) => {
    const a = arrastre.current
    if (!a || a.pointer !== e.pointerId) return
    const { c } = celda(e)
    // No puede pisar la siguiente nota de la misma fila.
    const siguiente = notas
      .filter((n) => n.id !== a.id && fila(n.nota) === a.fila && n.inicio > a.inicio)
      .reduce((min, n) => Math.min(min, n.inicio), columnas)
    const duracion = Math.max(1, Math.min(c - a.inicio + 1, siguiente - a.inicio))
    const actual = notas.find((n) => n.id === a.id)
    if (actual && actual.duracion !== duracion) {
      a.movido = true
      onCambio(notas.map((n) => (n.id === a.id ? { ...n, duracion } : n)))
    }
  }

  const onUp = (e) => {
    const a = arrastre.current
    if (!a || a.pointer !== e.pointerId) return
    arrastre.current = null
    if (!a.nueva && !a.movido) onCambio(notas.filter((n) => n.id !== a.id))
  }

  // ----- Carril de velocity -----
  const velDe = (e) => {
    const r = carrilRef.current.getBoundingClientRect()
    const c = Math.min(columnas - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * columnas)))
    const v = Math.min(1, Math.max(0.05, 1 - (e.clientY - r.top) / r.height))
    return { c, v: Math.round(v * 127) / 127 }
  }
  const cambiarVel = (e) => {
    const { c, v } = velDe(e)
    if (!notas.some((n) => columnaDe(n) === c)) return null
    setUltimaVel(Math.round(v * 127))
    onCambio(notas.map((n) => (columnaDe(n) === c ? { ...n, velocity: v } : n)))
    return c
  }
  const onVelDown = (e) => {
    if (!editable) return
    e.preventDefault()
    carrilRef.current.setPointerCapture?.(e.pointerId)
    arrastre.current = { vel: true, pointer: e.pointerId, c: cambiarVel(e) }
  }
  const onVelMove = (e) => {
    const a = arrastre.current
    if (!a?.vel || a.pointer !== e.pointerId) return
    a.c = cambiarVel(e) ?? a.c
  }
  const onVelUp = (e) => {
    const a = arrastre.current
    if (!a?.vel || a.pointer !== e.pointerId) return
    arrastre.current = null
    const enColumna = notas.filter((n) => columnaDe(n) === a.c)
    if (enColumna.length) playNotes(enColumna.map((n) => n.nota), { modo: 'acorde', duracion: 0.5, velocidad: enColumna[0].velocity })
  }

  const tiempos = Math.ceil(columnas / porTiempo)
  const sinToque = { touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pulsable
          onClick={reproducir}
          className={`flex min-h-12 items-center gap-3 rounded-2xl border py-1.5 pl-2 pr-4 text-base font-medium transition-colors duration-200 ${
            cabezal !== null ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-800'
          }`}
        >
          <IconoPlay sonando={cabezal !== null} />
          Reproducir
        </Pulsable>
        {roll.alternar && <SelectorEtiquetas valor={etiquetas} onCambio={setEtiquetas} />}
      </div>

      <div ref={cajaRef} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* Números de tiempo */}
        <div className="flex border-b border-zinc-200 bg-zinc-50">
          <div className={`${ancho} shrink-0`} />
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${tiempos}, minmax(0, 1fr))` }}>
            {Array.from({ length: tiempos }, (_, t) => (
              <span
                key={t}
                className={`border-l py-1 pl-1.5 font-dato text-sm tabular-nums ${inicioCompas(t) ? 'border-zinc-500' : 'border-zinc-300'} ${
                  compas && t % compas === 0 ? 'font-bold text-zinc-800' : 'font-semibold text-zinc-500'
                }`}
              >
                {compas ? (t % compas) + 1 : t + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="flex">
          {/* Teclado de la izquierda: tocar una fila hace sonar su nota */}
          <div className={`tema-claro ${ancho} shrink-0 border-r border-zinc-200`}>
            {filas.map((f) => {
              const negra = esNegra(f)
              return (
                <button
                  key={f}
                  type="button"
                  onPointerDown={() => playNotes(f, { duracion: 0.5 })}
                  className={`flex w-full flex-col items-start justify-center border-b px-2 leading-none last:border-b-0 ${alto} ${
                    negra ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-200 bg-white text-zinc-800'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                  aria-label={nombres?.[f] ?? (esPercusion(f) ? PERCUSION[f] : `${nombre(f)} (en FL Studio ${nombreFL(f)})`)}
                >
                  {nombres?.[f] ? <span className="text-sm font-semibold">{nombres[f]}</span> : <Etiqueta nota={f} modo={etiquetas} />}
                </button>
              )
            })}
          </div>

          {/* Rejilla */}
          <div
            ref={areaRef}
            className="relative flex-1"
            style={editable && !soloVelocity ? sinToque : undefined}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {filas.map((f) => (
              <div
                key={f}
                className={`grid border-b last:border-b-0 ${alto} ${esNegra(f) ? 'border-zinc-200 bg-zinc-100' : 'border-zinc-100 bg-white'}`}
                style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: columnas }, (_, c) => (
                  <span
                    key={c}
                    className={`border-l ${c % porTiempo === 0 ? (inicioCompas(c / porTiempo) ? 'border-zinc-500' : 'border-zinc-300') : 'border-zinc-100'}`}
                  />
                ))}
              </div>
            ))}

            {cabezal !== null && cabezal < columnas && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 border-l-2 border-sky-500 bg-sky-500/10"
                style={{ left: `${(cabezal / columnas) * 100}%`, width: `${100 / columnas}%` }}
              />
            )}

            {fantasma.map((n, i) => (
              <Rect key={`f${i}`} n={n} fila={fila(n.nota)} filas={filas.length} columnas={columnas}>
                <div
                  className={`size-full rounded-lg border-2 border-dashed transition-colors duration-200 ${
                    fantasmaBien ? 'border-bien bg-bien/10' : 'border-zinc-400 bg-zinc-400/10'
                  }`}
                />
              </Rect>
            ))}

            {notas.map((n) => {
              const suena = cabezal !== null && cabezal >= columnaDe(n) && cabezal < columnaDe(n) + n.duracion
              return (
                <Rect key={n.id} n={n} fila={fila(n.nota)} filas={filas.length} columnas={columnas}>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: suena ? 1.06 : 1, opacity: 1 }}
                    transition={RESORTE.pulsar}
                    className="size-full rounded-lg border border-black/15"
                    style={{ backgroundColor: `color-mix(in oklab, ${color} ${Math.round(30 + 70 * (n.velocity ?? 0.8))}%, var(--color-white))` }}
                  />
                </Rect>
              )
            })}
          </div>
        </div>

        {roll.velocity && (
          <div className="flex border-t border-zinc-200 bg-zinc-50">
            <div className={`flex ${ancho} shrink-0 flex-col justify-center border-r border-zinc-200 px-1.5 text-center text-sm font-semibold leading-tight text-zinc-600`}>
              Vel.
              {ultimaVel !== null && <span className="font-dato tabular-nums text-zinc-500">{ultimaVel}</span>}
            </div>
            <div
              ref={carrilRef}
              className="relative grid h-20 flex-1"
              style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`, ...(editable ? sinToque : {}) }}
              onPointerDown={onVelDown}
              onPointerMove={onVelMove}
              onPointerUp={onVelUp}
              onPointerCancel={onVelUp}
              aria-label="Carril de velocity: desliza arriba o abajo sobre una nota"
            >
              {Array.from({ length: columnas }, (_, c) => {
                const n = notas.find((x) => columnaDe(x) === c)
                return (
                  <div key={c} className={`relative border-l ${c % porTiempo === 0 ? 'border-zinc-300' : 'border-zinc-200'}`}>
                    {n && (
                      <motion.div
                        className="absolute inset-x-[30%] bottom-0 origin-bottom rounded-t-md"
                        initial={false}
                        animate={{ scaleY: n.velocity ?? 0.8 }}
                        transition={RESORTE.pulsar}
                        style={{ height: '100%', backgroundColor: color }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Columna de una nota (las corridas por el swing o al humanizar caen en la más cercana). */
const columnaDe = (n) => Math.round(n.inicio)

/** Posiciona una nota (o su fantasma) en la rejilla. */
function Rect({ n, fila, filas, columnas, children }) {
  if (fila < 0) return null
  return (
    <div
      className="pointer-events-none absolute p-[3px]"
      style={{
        top: `${(fila / filas) * 100}%`,
        height: `${100 / filas}%`,
        left: `${(n.inicio / columnas) * 100}%`,
        width: `${(Math.min(n.duracion, columnas - n.inicio) / columnas) * 100}%`,
      }}
    >
      {children}
    </div>
  )
}

function Etiqueta({ nota, modo }) {
  if (esPercusion(nota)) return <span className="text-sm font-semibold">{PERCUSION[nota]}</span>
  // Notas en la fuente de datos (DM Mono): es lo que se ve igual en FL Studio.
  if (modo === 'fl') return <span className="font-dato text-base font-medium">{nombreFL(nota)}</span>
  if (modo === 'ambas')
    return (
      <>
        <span className="font-dato text-sm font-medium">{nombreFL(nota)}</span>
        <span className="mt-0.5 font-dato text-sm opacity-75">{nombre(nota)}</span>
      </>
    )
  return <span className="font-dato text-base font-medium">{nombre(nota)}</span>
}

function SelectorEtiquetas({ valor, onCambio }) {
  const opciones = [
    { id: 'app', texto: 'Esta app' },
    { id: 'fl', texto: 'FL Studio' },
  ]
  return (
    <div className="flex gap-1 rounded-2xl bg-zinc-100 p-1" role="radiogroup" aria-label="Nombres de las notas">
      {opciones.map((o) => (
        <Pulsable
          key={o.id}
          role="radio"
          aria-checked={valor === o.id}
          onClick={() => onCambio(o.id)}
          className={`min-h-11 rounded-xl px-3 text-base font-semibold transition-colors duration-200 ${
            valor === o.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'
          }`}
        >
          {o.texto}
        </Pulsable>
      ))}
    </div>
  )
}

const esNegra = (f) => !esPercusion(f) && parseNota(f).alteracion !== 0

let contador = 0
export function nuevoId() {
  contador += 1
  return `n${contador}`
}

/** Nombre como en FL Studio: una octava más (Do central = C5). 'C4' -> 'C5'. */
export function nombreFL(nota) {
  const n = notaDesdeMidi(midi(nota))
  const { octava } = parseNota(n)
  return n.replace(/-?\d+$/, String(octava + 1))
}

/** Filas del roll, de la más aguda (arriba) a la más grave. */
export function filasDe(roll = {}) {
  if (roll.filas) return roll.filas
  const [grave, aguda] = roll.rango ?? ['C4', 'C5']
  const filas = []
  for (let m = midi(aguda); m >= midi(grave); m--) {
    const n = notaDesdeMidi(m)
    if (roll.soloBlancas && n.includes('#')) continue
    filas.push(n)
  }
  return filas
}

/** Añade un id a cada nota del contenido. */
export function conIds(notas = []) {
  return notas.map((n) => ({ velocity: 0.78, duracion: 1, ...n, id: nuevoId() }))
}
