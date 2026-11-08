import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getStatus,
  initPiano,
  isAudioRunning,
  noteOff,
  noteOn,
  onStatusChange,
  releaseAll,
  startAudio,
} from '../audio/engine.js'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SPANISH = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' }

/** Teclas de `octaves` octavas empezando en C`startOctave`. */
function buildKeys(startOctave, octaves) {
  const white = []
  const black = []
  for (let o = 0; o < octaves; o++) {
    const octave = startOctave + o
    NOTE_NAMES.forEach((name) => {
      const note = `${name}${octave}`
      if (name.includes('#')) {
        // La negra queda sobre el borde derecho de la última blanca añadida.
        black.push({ note, afterWhite: white.length })
      } else {
        white.push({ note, label: SPANISH[name], octave })
      }
    })
  }
  return { white, black }
}

/** Número de octavas visibles según el ancho del contenedor. */
function useVisibleOctaves(ref, max) {
  const [visible, setVisible] = useState(max)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setVisible(Math.min(max, el.clientWidth < 560 ? 1 : max))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, max])
  return visible
}

/**
 * Piano táctil.
 * Props:
 *  - startOctave (4): primera octava (C4 = Do central).
 *  - octaves (2): octavas totales disponibles.
 *  - showLabels (true): nombre de la nota en las teclas blancas.
 *  - onNoteOn / onNoteOff: callbacks opcionales (útiles para ejercicios).
 *  - marcadas ([]): notas resaltadas en ámbar (p. ej. la nota de referencia).
 *  - compacto (false): teclas más bajas, para que quepa en lecciones en el celular.
 */
export default function Piano({
  startOctave = 4,
  octaves = 2,
  showLabels = true,
  onNoteOn,
  onNoteOff,
  marcadas = [],
  compacto = false,
}) {
  const wrapperRef = useRef(null)
  const visibleOctaves = useVisibleOctaves(wrapperRef, octaves)
  const [offset, setOffset] = useState(0) // octava desplazada cuando no caben todas
  const [active, setActive] = useState(() => new Set())
  const [status, setStatus] = useState(getStatus)
  const [audioOn, setAudioOn] = useState(isAudioRunning)

  // pointerId -> nota que está sonando con ese dedo
  const pointers = useRef(new Map())

  const maxOffset = octaves - visibleOctaves
  const firstOctave = startOctave + Math.min(offset, maxOffset)
  const { white, black } = buildKeys(firstOctave, visibleOctaves)

  useEffect(() => {
    initPiano()
    return onStatusChange(setStatus)
  }, [])

  // En las lecciones (compacto) la barra inferior crece al mostrar un mensaje y
  // puede tapar el teclado en el celular: si pasa, desplazamos lo justo para verlo.
  useEffect(() => {
    if (!compacto) return
    const barra = document.querySelector('[data-barra-accion]')
    if (!barra) return
    let primera = true
    let frame = 0
    const ajustar = () => {
      const el = wrapperRef.current
      if (!el) return
      const limite = window.innerHeight - barra.offsetHeight - 8
      const tapado = el.getBoundingClientRect().bottom - limite
      if (tapado > 1) window.scrollBy({ top: tapado, behavior: 'smooth' })
    }
    const ro = new ResizeObserver(() => {
      if (primera) return void (primera = false) // al montar no movemos nada
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(ajustar)
    })
    ro.observe(barra)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [compacto])

  // Recalcular el número de dedos activos -> teclas iluminadas
  const refreshActive = useCallback(() => {
    setActive(new Set(pointers.current.values()))
  }, [])

  const press = useCallback(
    (pointerId, note) => {
      const prev = pointers.current.get(pointerId)
      if (prev === note) return
      if (prev) {
        pointers.current.delete(pointerId)
        // Solo soltar si ningún otro dedo mantiene la misma nota
        if (![...pointers.current.values()].includes(prev)) {
          noteOff(prev)
          onNoteOff?.(prev)
        }
      }
      if (note) {
        const alreadyHeld = [...pointers.current.values()].includes(note)
        pointers.current.set(pointerId, note)
        if (!alreadyHeld) {
          noteOn(note)
          onNoteOn?.(note)
        }
      }
      refreshActive()
    },
    [onNoteOn, onNoteOff, refreshActive],
  )

  const release = useCallback((pointerId) => press(pointerId, null), [press])

  // Al desmontar o cambiar de octava, soltar todo
  useEffect(() => {
    const map = pointers.current
    return () => {
      map.clear()
      releaseAll()
    }
  }, [firstOctave, visibleOctaves])

  const noteAt = (x, y) => {
    const el = document.elementFromPoint(x, y)
    const key = el?.closest?.('[data-note]')
    return key && wrapperRef.current?.contains(key) ? key.dataset.note : null
  }

  const handlePointerDown = (e) => {
    e.preventDefault()
    if (!audioOn) startAudio().then(() => setAudioOn(isAudioRunning()))
    // Liberamos la captura implícita (táctil) para poder deslizar entre teclas.
    e.target.releasePointerCapture?.(e.pointerId)
    press(e.pointerId, noteAt(e.clientX, e.clientY))
  }

  const handlePointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    press(e.pointerId, noteAt(e.clientX, e.clientY))
  }

  const handlePointerEnd = (e) => {
    if (pointers.current.has(e.pointerId)) release(e.pointerId)
  }

  const whiteWidth = 100 / white.length
  const blackWidth = whiteWidth * 0.6

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-7 items-center justify-between gap-3 text-sm text-zinc-500">
        <span aria-live="polite">
          {status === 'loading' && 'Cargando sonido…'}
          {status !== 'loading' && !audioOn && 'Toca para activar el sonido'}
          {status !== 'loading' && audioOn && (status === 'fallback' ? 'Sonido sintetizado' : 'Listo')}
        </span>

        {maxOffset > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={offset === 0}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-zinc-700 disabled:opacity-30"
              aria-label="Octava anterior"
            >
              ◀
            </button>
            <span className="tabular-nums">Octava {firstOctave}</span>
            <button
              type="button"
              onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
              disabled={offset >= maxOffset}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-zinc-700 disabled:opacity-30"
              aria-label="Octava siguiente"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      <div
        ref={wrapperRef}
        role="group"
        aria-label="Piano"
        className={`relative w-full ${compacto ? 'h-44 sm:h-56' : 'h-56 sm:h-64'} overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-sm select-none`}
        style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex h-full gap-px">
          {white.map(({ note, label, octave }) => (
            <div
              key={note}
              data-note={note}
              className={`flex flex-1 items-end justify-center rounded-b-lg pb-3 text-sm font-medium transition-colors duration-75 ${
                active.has(note)
                  ? 'bg-sky-200 text-sky-900'
                  : marcadas.includes(note)
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-white text-zinc-400'
              }`}
            >
              {showLabels && (
                <span className="pointer-events-none">
                  {label}
                  {label === 'Do' && <sub className="text-[0.7em]">{octave}</sub>}
                </span>
              )}
            </div>
          ))}
        </div>

        {black.map(({ note, afterWhite }) => (
          <div
            key={note}
            data-note={note}
            className={`absolute top-0 h-[60%] rounded-b-md transition-colors duration-75 ${
              active.has(note) ? 'bg-sky-500' : marcadas.includes(note) ? 'bg-amber-500' : 'bg-zinc-900'
            }`}
            style={{ left: `${afterWhite * whiteWidth - blackWidth / 2}%`, width: `${blackWidth}%` }}
          />
        ))}
      </div>
    </div>
  )
}
