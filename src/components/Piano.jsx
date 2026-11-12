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
import { notaDesdeMidi, midi } from '../theory/notas.js'
import SelectorOctava from './SelectorOctava.jsx'
import useSobreBarra from '../ui/useSobreBarra.js'

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
 *  - ir (nota): si no se ve (pantalla angosta, 1 octava), el teclado pasa a la octava de esa nota
 *    cada vez que cambia (p. ej. la siguiente nota de una fórmula).
 * Si no caben todas las octavas, debajo va la barra de octavas (SelectorOctava): tocar una o deslizar.
 */
export default function Piano({
  startOctave = 4,
  octaves = 2,
  showLabels = true,
  onNoteOn,
  onNoteOff,
  marcadas = [],
  compacto = false,
  ir,
}) {
  const wrapperRef = useRef(null)
  const raizRef = useRef(null)
  const visibleOctaves = useVisibleOctaves(wrapperRef, octaves)
  const [offset, setOffset] = useState(0) // octava desplazada cuando no caben todas
  const [active, setActive] = useState(() => new Set())
  // Marcadas normalizadas a sostenidos (así "Db4" resalta la tecla C#4).
  const marcadasSet = new Set(marcadas.map((n) => notaDesdeMidi(midi(n))))
  const [status, setStatus] = useState(getStatus)
  const [audioOn, setAudioOn] = useState(isAudioRunning)

  // pointerId -> nota que está sonando con ese dedo
  const pointers = useRef(new Map())

  const maxOffset = octaves - visibleOctaves
  const firstOctave = startOctave + Math.min(offset, maxOffset)
  const { white, black } = buildKeys(firstOctave, visibleOctaves)

  // Al cambiar de octava, las teclas pintadas (marcadas) se desvanecen y aparecen las de la nueva octava
  // (pedido del usuario: así se entiende que cambió). Las teclas van por POSICIÓN (key = índice), no por
  // nota, para que sea la misma tecla la que cambia de color con un fundido de 300 ms; el resto del tiempo,
  // 75 ms (lo que se toca responde al instante).
  const [cambiando, setCambiando] = useState(false)
  const octavaAntes = useRef(firstOctave)
  useEffect(() => {
    if (octavaAntes.current === firstOctave) return
    octavaAntes.current = firstOctave
    setCambiando(true)
    const t = setTimeout(() => setCambiando(false), 400)
    return () => clearTimeout(t)
  }, [firstOctave])
  const fundido = cambiando ? 'duration-300' : 'duration-75'

  // Llevar la vista a la octava de `ir` si queda fuera (solo cuando cambia `ir`).
  const octavaIr = ir ? Math.floor(midi(ir) / 12) - 1 : null
  useEffect(() => {
    if (octavaIr == null || maxOffset <= 0) return
    setOffset((o) => {
      const primera = startOctave + Math.min(o, maxOffset)
      if (octavaIr >= primera && octavaIr < primera + visibleOctaves) return o
      return Math.max(0, Math.min(maxOffset, octavaIr - startOctave))
    })
  }, [octavaIr, startOctave, maxOffset, visibleOctaves])

  useEffect(() => {
    initPiano()
    return onStatusChange(setStatus)
  }, [])

  // En lecciones (compacto), que la barra inferior no tape el teclado ni la barra de octavas.
  useSobreBarra(raizRef, compacto)

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
    <div ref={raizRef} className="flex flex-col gap-3">
      <div className="flex min-h-6 items-center gap-3 text-sm text-zinc-500">
        <span aria-live="polite">
          {status === 'loading' && 'Cargando sonido…'}
          {status !== 'loading' && !audioOn && 'Toca para activar el sonido'}
          {status !== 'loading' && audioOn && (status === 'fallback' ? 'Sonido sintetizado' : 'Listo')}
        </span>

      </div>

      <div
        ref={wrapperRef}
        role="group"
        aria-label="Piano"
        className={`relative w-full ${compacto ? 'h-44 sm:h-56' : 'h-56 sm:h-64'} tema-claro overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-sm select-none`}
        style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex h-full gap-px">
          {white.map(({ note, label, octave }, i) => (
            <div
              key={i}
              data-note={note}
              className={`flex flex-1 items-end justify-center rounded-b-lg pb-3 text-sm font-medium transition-colors ${fundido} ${
                active.has(note)
                  ? 'bg-sky-200 text-sky-900'
                  : marcadasSet.has(note)
                    ? 'bg-fijate-claro text-fijate-tinta'
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

        {black.map(({ note, afterWhite }, i) => (
          <div
            key={i}
            data-note={note}
            className={`absolute top-0 h-[60%] rounded-b-md transition-colors ${fundido} ${
              active.has(note) ? 'bg-sky-500' : marcadasSet.has(note) ? 'bg-fijate' : 'bg-zinc-900'
            }`}
            style={{ left: `${afterWhite * whiteWidth - blackWidth / 2}%`, width: `${blackWidth}%` }}
          />
        ))}
      </div>

      {/* Si no caben todas las octavas (celular), una barra de octavas debajo: tocar o deslizar. */}
      {maxOffset > 0 && (
        <SelectorOctava
          octavas={Array.from({ length: maxOffset + 1 }, (_, i) => startOctave + i)}
          indice={Math.min(offset, maxOffset)}
          onCambiar={setOffset}
        />
      )}
    </div>
  )
}
