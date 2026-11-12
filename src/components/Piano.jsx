import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
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
import { useOpciones } from '../progress/opciones.js'
import { BRILLO_MS, RESORTE } from '../ui/movimiento.js'
import { Bombilla, Candado, Check } from '../ui/Iconos.jsx'

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

/**
 * Teclado del computador como en FL Studio (pedido del usuario), por POSICIÓN física de la tecla (`e.code`, así
 * sirve igual en un teclado en español: la tecla de la «Ñ» es `Semicolon`). Semitonos desde el Do de la octava base
 * (la primera que se ve): fila de abajo Z S X D C V G B H N J M = Do…Si y sigue , L . Ñ - (Do…Mi de la siguiente);
 * fila de arriba (solo en el piano libre, `tecladoArriba`) Q 2 W 3 E R 5 T 6 Y 7 U = una octava más arriba y sigue
 * I 9 O 0 P [ = ] .
 */
const TECLAS_ABAJO = {
  KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
  Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16,
}
const TECLAS_ARRIBA = {
  KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23,
  KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28, BracketLeft: 29, Equal: 30, BracketRight: 31,
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
 *  - tecladoArriba (false): en el piano libre, además de la fila de abajo del teclado del computador (Z…M), la de
 *    arriba (Q…U, una octava más arriba), como en FL Studio. Ver TECLAS_ABAJO / TECLAS_ARRIBA.
 *  - senalar ({ notas: ['A4'], n }): cada vez que cambia `n`, el teclado va a la octava de la primera nota (si no
 *    se ve) y sus teclas se iluminan un momento, como si se tocaran (no llama a onNoteOn ni suena: el sonido lo
 *    pone quien señala; p. ej. «Escuchar las 3 La» o una casilla verde).
 *  - bloqueada ((nota) => bool): teclas con candado, en gris: no suenan ni responden (p. ej. las notas del oído
 *    absoluto que aún no se desbloquean).
 *  - inactivo (false): ninguna tecla responde (p. ej. mientras suena el «borrador» del oído absoluto).
 *  - estados ({ 'C4': 'bien' | 'fijate' }): tecla en verde con ✓ (la respuesta) u oro con bombilla (lo que elegiste).
 *  - sinEstado (false): sin la línea de arriba («Sonido sintetizado», «Teclado: Z–M»), p. ej. en el juego de oído absoluto.
 * Si no caben todas las octavas, el teclado completo va en una TIRA que se recorre con un resorte hasta la octava
 * elegida (pedido del usuario) y debajo va la barra de octavas (SelectorOctava): tocar una o deslizar; mientras
 * se desliza, la tira acompaña al dedo y al soltar se ajusta a la octava más cercana.
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
  senalar,
  tecladoArriba = false,
  bloqueada,
  inactivo = false,
  estados = {},
  sinEstado = false,
}) {
  const wrapperRef = useRef(null)
  const raizRef = useRef(null)
  const visibleOctaves = useVisibleOctaves(wrapperRef, octaves)
  const [offset, setOffset] = useState(0) // octava desplazada cuando no caben todas
  const [active, setActive] = useState(() => new Set())
  const [brillo, setBrillo] = useState(() => new Set()) // teclas iluminadas por `senalar`
  // Marcadas normalizadas a sostenidos (así "Db4" resalta la tecla C#4).
  const marcadasSet = new Set(marcadas.map((n) => notaDesdeMidi(midi(n))))
  const [status, setStatus] = useState(getStatus)
  const [audioOn, setAudioOn] = useState(isAudioRunning)
  const reducir = useReducedMotion()
  const { octavas: sentidoOctavas } = useOpciones()

  // pointerId -> nota que está sonando con ese dedo
  const pointers = useRef(new Map())

  const maxOffset = octaves - visibleOctaves
  const indice = Math.min(offset, maxOffset)
  // Todas las teclas están siempre; la tira mide `octaves / visibleOctaves` veces el ancho del teclado.
  const { white, black } = buildKeys(startOctave, octaves)

  // ——— La tira: `pos` = octava que se ve (en octavas desde startOctave; continua mientras se mueve) ———
  const pos = useMotionValue(indice)
  const xTira = useTransform(pos, (p) => `${(-p * 100) / octaves}%`)
  const siguiendo = useRef(false) // el dedo arrastra la barra de octavas: la tira lo acompaña
  const animacion = useRef(null)
  const indiceRef = useRef(indice)
  indiceRef.current = indice

  const mover = useCallback(
    (destino, resorte) => {
      animacion.current?.stop()
      if (reducir) pos.set(destino) // reducir movimiento: sin recorrido, salta
      else animacion.current = animate(pos, destino, resorte)
    },
    [pos, reducir],
  )

  // La octava elegida (toque en la barra, `ir`, `senalar`, soltar el dedo) → la tira se recorre hasta ella.
  useEffect(() => {
    if (!siguiendo.current) mover(indice, RESORTE.pantalla)
  }, [indice, mover])
  useEffect(() => () => animacion.current?.stop(), [])

  // Mientras se arrastra la barra: la tira sigue al dedo (posición continua en octavas); al soltar, se ajusta.
  const seguir = useCallback(
    (p) => {
      if (p == null) {
        siguiendo.current = false
        mover(indiceRef.current, RESORTE.pantalla)
      } else {
        siguiendo.current = true
        if (reducir) pos.set(p)
        else mover(p, RESORTE.pulsar)
      }
    },
    [mover, pos, reducir],
  )

  /** Octava visible a la que hay que ir para ver `nota` (o la de ahora si ya se ve). */
  const desplazarA = useCallback(
    (nota, o) => {
      const octava = Math.floor(midi(nota) / 12) - 1
      const primera = startOctave + Math.min(o, maxOffset)
      if (octava >= primera && octava < primera + visibleOctaves) return o
      return Math.max(0, Math.min(maxOffset, octava - startOctave))
    },
    [startOctave, maxOffset, visibleOctaves],
  )

  // Llevar la vista a la octava de `ir` si queda fuera (solo cuando cambia `ir`).
  const octavaIr = ir ? Math.floor(midi(ir) / 12) - 1 : null
  useEffect(() => {
    if (octavaIr == null || maxOffset <= 0) return
    setOffset((o) => desplazarA(`C${octavaIr}`, o))
  }, [octavaIr, maxOffset, desplazarA])

  // `senalar`: ir a la octava de la (primera) nota e iluminar sus teclas un momento.
  const nSenal = senalar?.n
  const notasSenal = senalar?.notas
  useEffect(() => {
    if (!notasSenal?.length) return
    // Si hay que ir a otra octava, la tecla se ilumina mientras llega y un poco más (para verla ya quieta).
    const viaja = maxOffset > 0 && desplazarA(notasSenal[0], indiceRef.current) !== indiceRef.current
    if (viaja) setOffset((o) => desplazarA(notasSenal[0], o))
    setBrillo(new Set(notasSenal.map((n) => notaDesdeMidi(midi(n)))))
    const t = setTimeout(() => setBrillo(new Set()), BRILLO_MS + (viaja && !reducir ? 300 : 0))
    return () => clearTimeout(t)
  }, [nSenal]) // solo cuando llega una señal nueva

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

  // Teclas con candado o teclado inactivo: no suenan ni responden (como si el dedo no estuviera en una tecla).
  const libreRef = useRef(null)
  libreRef.current = (note) => !inactivo && !bloqueada?.(note)

  const press = useCallback(
    (pointerId, nota) => {
      const note = nota && libreRef.current(nota) ? nota : null
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

  // Al desmontar o cambiar cuántas octavas caben, soltar todo. (Al recorrer la tira no: la nota que se
  // mantiene sigue sonando y, al mover el dedo, pasa a la tecla que quede debajo.)
  useEffect(() => {
    const map = pointers.current
    return () => {
      map.clear()
      releaseAll()
    }
  }, [visibleOctaves])

  // Teclado del computador (FL Studio): keydown = apretar, keyup = soltar; cada tecla es un «dedo» más
  // (`k-KeyZ`…), así se pueden tocar acordes y mezclar con el ratón. La octava base es la primera que se ve.
  const baseRef = useRef(0)
  baseRef.current = startOctave + indice
  useEffect(() => {
    const ocupado = (e) =>
      e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea, select, [contenteditable=true]') || document.querySelector('[role=dialog]')
    const semitonos = (code) => TECLAS_ABAJO[code] ?? (tecladoArriba ? TECLAS_ARRIBA[code] : undefined)
    const abajo = (e) => {
      const st = semitonos(e.code)
      if (st == null || ocupado(e)) return
      e.preventDefault()
      if (e.repeat) return
      const m = (baseRef.current + 1) * 12 + st
      if (m < (startOctave + 1) * 12 || m >= (startOctave + octaves + 1) * 12) return // fuera del teclado
      if (!isAudioRunning()) startAudio().then(() => setAudioOn(isAudioRunning()))
      press(`k-${e.code}`, notaDesdeMidi(m))
    }
    const arriba = (e) => {
      if (pointers.current.has(`k-${e.code}`)) release(`k-${e.code}`)
    }
    // Al perder el foco la ventana no llegan los keyup: soltar las teclas del computador.
    const suelta = () => [...pointers.current.keys()].filter((k) => String(k).startsWith('k-')).forEach(release)
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    window.addEventListener('blur', suelta)
    return () => {
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
      window.removeEventListener('blur', suelta)
    }
  }, [press, release, startOctave, octaves, tecladoArriba])

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

  // Tecla encendida (dedo, ratón, teclado del computador o `senalar`): se enciende al instante (75 ms) y al
  // soltarla se DESVANECE en 300 ms (pedido del usuario). La duración de una transición CSS es la del estado al
  // que se llega, así que la clase cambia según esté encendida o no.
  const encendida = (note) => active.has(note) || brillo.has(note)
  const fundido = (note) => (encendida(note) ? 'duration-75' : 'duration-300 ease-out')

  const whiteWidth = 100 / white.length
  const blackWidth = whiteWidth * 0.6

  return (
    <div ref={raizRef} className="flex flex-col gap-3">
      <div className={`flex min-h-6 items-center gap-3 text-sm text-zinc-500 ${sinEstado ? 'hidden' : ''}`}>
        <span aria-live="polite">
          {status === 'loading' && 'Cargando sonido…'}
          {status !== 'loading' && !audioOn && 'Toca para activar el sonido'}
          {status !== 'loading' && audioOn && (status === 'fallback' ? 'Sonido sintetizado' : 'Listo')}
        </span>
        {/* Solo con ratón (computadora): pista del teclado del computador. */}
        <span className="ml-auto hidden font-dato text-xs text-zinc-400 pointer-fine:inline" aria-hidden>
          Teclado: Z–M{tecladoArriba ? ' · Q–U' : ''}
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
        <motion.div
          data-tira
          className="absolute inset-y-0 left-0"
          style={{ width: `${(octaves / visibleOctaves) * 100}%`, x: xTira }}
        >
          <div className="flex h-full gap-px">
            {white.map(({ note, label, octave }) => {
              const cerrada = bloqueada?.(note)
              const estado = estados[note]
              return (
                <div
                  key={note}
                  data-note={note}
                  data-bloqueada={cerrada || undefined}
                  data-estado={estado}
                  className={`flex flex-1 flex-col items-center justify-end gap-1.5 rounded-b-lg pb-3 text-sm font-medium transition-colors ${fundido(note)} ${
                    encendida(note)
                      ? 'bg-sky-200 text-sky-900'
                      : estado === 'bien'
                        ? 'bg-bien-relleno text-blanco'
                        : estado === 'fijate'
                          ? 'bg-fijate text-zinc-900'
                          : cerrada
                            ? 'bg-zinc-100 text-zinc-400'
                            : marcadasSet.has(note)
                              ? 'bg-fijate-claro text-fijate-tinta'
                              : 'bg-white text-zinc-400'
                  }`}
                >
                  <IconoTecla cerrada={cerrada} estado={estado} />
                  {showLabels && (
                    <span className="pointer-events-none">
                      {label}
                      {label === 'Do' && <sub className="text-[0.7em]">{octave}</sub>}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {black.map(({ note, afterWhite }) => {
            const cerrada = bloqueada?.(note)
            const estado = estados[note]
            return (
              <div
                key={note}
                data-note={note}
                data-bloqueada={cerrada || undefined}
                data-estado={estado}
                className={`absolute top-0 flex h-[60%] items-end justify-center rounded-b-md pb-2 transition-colors ${fundido(note)} ${
                  encendida(note)
                    ? 'bg-sky-500'
                    : estado === 'bien'
                      ? 'bg-bien-relleno text-blanco'
                      : estado === 'fijate'
                        ? 'bg-fijate text-zinc-900'
                        : cerrada
                          ? 'bg-zinc-400 text-zinc-100'
                          : marcadasSet.has(note)
                            ? 'bg-fijate'
                            : 'bg-zinc-900'
                }`}
                style={{ left: `${afterWhite * whiteWidth - blackWidth / 2}%`, width: `${blackWidth}%` }}
              >
                <IconoTecla cerrada={cerrada} estado={estado} />
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Si no caben todas las octavas (celular), una barra de octavas debajo: tocar o deslizar. */}
      {maxOffset > 0 && (
        <SelectorOctava
          octavas={Array.from({ length: maxOffset + 1 }, (_, i) => startOctave + i)}
          indice={indice}
          onCambiar={setOffset}
          onSeguir={seguir}
          invertida={sentidoOctavas === 'teclas'}
        />
      )}
    </div>
  )
}

/** Ícono dentro de una tecla: ✓ (respuesta), bombilla (lo que elegiste) o candado (bloqueada). */
function IconoTecla({ cerrada, estado }) {
  const Icono = estado === 'bien' ? Check : estado === 'fijate' ? Bombilla : cerrada ? Candado : null
  return Icono ? <Icono className="pointer-events-none size-[18px] max-w-[70%]" /> : null
}
