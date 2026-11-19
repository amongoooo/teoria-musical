import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { nota808Ahora, playNotes, playPattern } from '../audio/engine.js'
import { PERCUSION, claveNota, esPercusion } from '../theory/bateria.js'
import { midi, nombre, notaDesdeMidi, parseNota } from '../theory/notas.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useSobreBarra from '../ui/useSobreBarra.js'
import { tinta } from '../ui/color.js'
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
 *
 * El 808 (P1.4; propuesta aprobada: https://claude.ai/artifact/XMnFwLjZLG7f8GjQUdnF4d), con opciones de `roll`:
 *  - instrumento: '808' → las notas suenan en la voz del 808 (audio/bateria.js → nota808), monofónica.
 *  - bombo: [0, 7, 11] → fila «Bombo» fija arriba (columnas del roll) para alinear el 808; la cola de una nota que pisa
 *      un bombo (sin otra nota que empiece ahí) se tacha en oro desde ese golpe: «barro».
 *  - fondo: eventos que suenan con «Reproducir» además de las notas (el beat: theory/rack.js → fondoRoll).
 *  - slide: true → pincel «Nota · Slide» encima del roll; con Slide, tocar una nota la marca o la desmarca (no la borra)
 *      y una nota nueva nace marcada. Una nota slide (`slide: true`) lleva el triangulito de FL y una rampa desde la
 *      nota anterior: el 808 se desliza hasta ella.
 */
export default function PianoRoll({ roll = {}, notas, onCambio, soloVelocity = false, fantasma = [], fantasmaBien = false, color = 'var(--color-melodia)' }) {
  const filas = filasDe(roll)
  const es808 = roll.instrumento === '808'
  const bombo = roll.bombo ?? null
  const [pincel, setPincel] = useState('nota') // 'nota' | 'slide' (solo con roll.slide)
  const conSlide = Boolean(roll.slide) && Boolean(onCambio) && !soloVelocity
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
  const ancho = nombres ? 'w-[6.5rem]' : bombo ? 'w-16' : filas.some(esPercusion) ? 'w-[4.5rem]' : filas.some((f) => /^G#/.test(f)) ? 'w-16' : 'w-14'

  const areaRef = useRef(null)
  const cajaRef = useRef(null)
  useSobreBarra(cajaRef)
  const carrilRef = useRef(null)
  const arrastre = useRef(null)
  const reloj = useRef(0)
  useEffect(() => () => cancelAnimationFrame(reloj.current), [])

  const fila = (nota) => filas.findIndex((f) => claveNota(f) === claveNota(nota))
  // Lo que suena al tocar: el piano o el 808.
  const oir = (nota, duracion = 0.5, velocidad = 0.8) => (es808 ? nota808Ahora(nota, duracion, velocidad) : playNotes(nota, { duracion, velocidad }))
  // La nota de antes (la que empieza más cerca antes que ella): de donde sale el glide.
  const anterior = (n, lista = notas) => lista.filter((m) => m !== n && m.id !== n.id && m.inicio < n.inicio).sort((a, b) => b.inicio - a.inicio)[0] ?? null
  const oirSlide = (n) => {
    const a = anterior(n)
    if (!a || !es808) return oir(n.nota, 0.45)
    nota808Ahora(a.nota, 0.3)
    setTimeout(() => nota808Ahora(n.nota, 0.4, 0.8, { slide: true }), 160)
  }

  const reproducir = () => {
    cancelAnimationFrame(reloj.current)
    // Exclusivo: si otro sonido lo corta, el cabezal se va.
    const lista = es808 ? notas.map((n) => ({ ...n, inst: '808' })) : notas
    const total = playPattern([...lista, ...(roll.fondo ?? [])], {
      paso,
      alParar: () => {
        cancelAnimationFrame(reloj.current)
        setCabezal(null)
      },
    })
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
      const marcar = conSlide && pincel === 'slide'
      arrastre.current = { id: existente.id, inicio: existente.inicio, fila: f, nueva: false, movido: false, marcar, pointer: e.pointerId }
      // Pincel Slide: tocar una nota la marca o la desmarca (no la borra).
      if (marcar) {
        const cambiada = { ...existente, slide: !existente.slide }
        if (cambiada.slide) oirSlide(cambiada)
        onCambio(notas.map((n) => (n.id === existente.id ? cambiada : n)))
      }
      return
    }
    const nueva = { id: nuevoId(), nota: filas[f], inicio: c, duracion: 1, velocity: roll.velocityInicial ?? 0.78, ...(conSlide && pincel === 'slide' ? { slide: true } : {}) }
    if (nueva.slide) oirSlide(nueva)
    else oir(nueva.nota, 0.4, nueva.velocity)
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
    if (!a.nueva && !a.movido && !a.marcar) onCambio(notas.filter((n) => n.id !== a.id))
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
    if (enColumna.length && es808) oir(enColumna[0].nota, 0.5, enColumna[0].velocity)
    else if (enColumna.length) playNotes(enColumna.map((n) => n.nota), { modo: 'acorde', duracion: 0.5, velocidad: enColumna[0].velocity })
  }

  const tiempos = Math.ceil(columnas / porTiempo)
  // La cola que pisa un bombo (sin otra nota que empiece en ese golpe): desde dónde se tacha en oro (en casillas).
  const choqueDe = (n) => (bombo ?? []).find((c) => c > n.inicio && c < n.inicio + n.duracion && !notas.some((m) => m.id !== n.id && m.inicio === c)) ?? null
  // Las rampas del glide: de la fila de la nota anterior a la de la nota slide.
  const rampas = notas
    .filter((n) => n.slide)
    .map((n) => ({ n, a: anterior(n) }))
    .filter(({ n, a }) => a && fila(a.nota) >= 0 && fila(n.nota) >= 0)
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

      {conSlide && <PincelRoll pincel={pincel} onPincel={setPincel} color={color} />}

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

        {/* El bombo (808): fila fija para alinear; cada golpe se enciende cuando suena */}
        {bombo && (
          <div className="flex border-b border-zinc-200 bg-zinc-50" data-bombo>
            <div className={`flex ${ancho} h-8 shrink-0 items-center border-r border-zinc-200 px-1.5 text-sm font-semibold text-zinc-600`}>Bombo</div>
            <div className="grid h-8 flex-1" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
              {Array.from({ length: columnas }, (_, c) => (
                <span key={c} className={`flex items-center justify-center border-l ${c % porTiempo === 0 ? 'border-zinc-300' : 'border-zinc-100'}`}>
                  {bombo.includes(c) && (
                    <span
                      data-golpe-bombo={c}
                      className={`h-4 w-[70%] rounded-[4px] transition-colors duration-100 ${cabezal === c ? 'bg-sky-500' : 'bg-zinc-400'}`}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex">
          {/* Teclado de la izquierda: tocar una fila hace sonar su nota */}
          <div className={`tema-claro ${ancho} shrink-0 border-r border-zinc-200`}>
            {filas.map((f) => {
              const negra = esNegra(f)
              return (
                <button
                  key={f}
                  type="button"
                  onPointerDown={() => (esPercusion(f) ? playNotes(f, { duracion: 0.5 }) : oir(f))}
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
            data-rejilla
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
                  className={`relative size-full rounded-lg border-2 border-dashed transition-colors duration-200 ${
                    fantasmaBien ? 'border-bien bg-bien/10' : 'border-zinc-400 bg-zinc-400/10'
                  }`}
                >
                  {n.slide && <Triangulo className={fantasmaBien ? 'border-l-bien' : 'border-l-zinc-500'} />}
                </div>
              </Rect>
            ))}

            {rampas.length > 0 && (
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full"
                viewBox={`0 0 ${columnas} ${filas.length}`}
                preserveAspectRatio="none"
                data-rampas={rampas.length}
              >
                {rampas.map(({ n, a }) => (
                  <line
                    key={n.id}
                    x1={Math.max(a.inicio + 0.3, n.inicio - 0.6)}
                    y1={fila(a.nota) + 0.5}
                    x2={n.inicio + 0.45}
                    y2={fila(n.nota) + 0.5}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="5 4"
                    vectorEffect="non-scaling-stroke"
                    style={{ stroke: tinta(color) }}
                  />
                ))}
              </svg>
            )}

            {notas.map((n) => {
              const suena = cabezal !== null && cabezal >= columnaDe(n) && cabezal < columnaDe(n) + n.duracion
              const choque = choqueDe(n)
              return (
                <Rect key={n.id} n={n} fila={fila(n.nota)} filas={filas.length} columnas={columnas}>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: suena ? 1.06 : 1, opacity: 1 }}
                    transition={RESORTE.pulsar}
                    className="relative size-full overflow-hidden rounded-lg border border-black/15"
                    style={{ backgroundColor: `color-mix(in oklab, ${color} ${Math.round(30 + 70 * (n.velocity ?? 0.8))}%, var(--color-white))` }}
                    data-nota={n.nota}
                    data-slide={n.slide ? '' : undefined}
                  >
                    {choque !== null && (
                      <span
                        data-choque={choque}
                        className="absolute inset-y-0 right-0 border-l-2 border-fijate-tinta"
                        style={{
                          left: `${((choque - n.inicio) / n.duracion) * 100}%`,
                          backgroundImage: 'repeating-linear-gradient(135deg, var(--color-fijate) 0 4px, var(--color-fijate-claro) 4px 8px)',
                        }}
                      />
                    )}
                    {n.slide && <Triangulo className="border-l-white" />}
                  </motion.div>
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

/** El triangulito de una nota slide (como el de FL Studio). */
function Triangulo({ className = '' }) {
  return <span aria-hidden className={`absolute left-1 top-1/2 -translate-y-1/2 border-y-[5px] border-l-[7px] border-y-transparent ${className}`} />
}

/** El pincel del roll del 808 (como el del Channel rack): Nota · Slide. */
function PincelRoll({ pincel, onPincel, color }) {
  const opciones = [
    { id: 'nota', texto: 'Nota', ayuda: 'nota normal' },
    { id: 'slide', texto: 'Slide', ayuda: 'slide, el 808 se desliza hasta ella' },
  ]
  return (
    <div role="radiogroup" aria-label="Pincel" className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1" data-pincel-roll>
      {opciones.map((o) => {
        const elegido = pincel === o.id
        return (
          <Pulsable
            key={o.id}
            role="radio"
            aria-checked={elegido}
            aria-label={`Pincel: ${o.ayuda}`}
            data-pincel={o.id}
            onClick={() => onPincel(o.id)}
            className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-sm font-bold transition-colors duration-200 ${elegido ? 'text-zinc-900' : 'text-zinc-600'}`}
          >
            {elegido && <motion.span layoutId="pincel-roll-elegido" transition={RESORTE.pulsar} aria-hidden className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
            <span aria-hidden className="relative block h-3.5 w-7 rounded-[3px]" style={{ backgroundColor: elegido ? color : 'currentColor' }}>
              {o.id === 'slide' && <span className="absolute left-1 top-1/2 -translate-y-1/2 border-y-[4px] border-l-[6px] border-y-transparent border-l-white" />}
            </span>
            <span className="relative">{o.texto}</span>
          </Pulsable>
        )
      })}
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
