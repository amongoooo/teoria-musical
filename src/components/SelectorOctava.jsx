import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { RESORTE } from '../ui/movimiento.js'

/** Píxeles que tiene que moverse el dedo para que un toque pase a ser un arrastre. */
const ZONA_MUERTA = 6

/**
 * Barra de octavas del Piano (pedido del usuario: en lugar de las flechas ‹ ›): un control segmentado
 * delgado, como el de Apariencia, con una opción por octava. Se toca una octava para ir a ella, o se
 * desliza el dedo por la barra (slider). La píldora blanca NUNCA se queda entre dos octavas (pedido del
 * usuario, como la barra de puntitos del camino): al cruzar la mitad de un segmento salta a él con
 * `RESORTE.pantalla` y el teclado cambia de octava.
 *  - octavas: números de octava que se pueden mostrar (p. ej. [3, 4, 5]).
 *  - indice: la que se ve ahora; onCambiar(i) para ir a otra.
 */
export default function SelectorOctava({ octavas, indice, onCambiar }) {
  const n = octavas.length
  const caja = useRef(null)
  const pos = useMotionValue(indice) // posición de la píldora, en segmentos (entre dos solo mientras salta)
  const x = useTransform(pos, (p) => `${p * 100}%`)
  const gesto = useRef(null) // { id, x0, arrastrando, ultimo }
  const tras = useRef(false) // ignora el click que llega justo después de arrastrar

  // La píldora va a la octava elegida (por el dedo, un toque o la prop `ir` del Piano) con un resorte.
  useEffect(() => {
    const control = animate(pos, indice, RESORTE.pantalla)
    return () => control.stop()
  }, [indice, pos])

  /** Posición continua (en segmentos) bajo el dedo: el centro de cada segmento es un número entero. */
  const enSegmentos = (clientX) => {
    const r = caja.current.getBoundingClientRect()
    const p = ((clientX - r.left) / r.width) * n - 0.5
    return Math.min(n - 1, Math.max(0, p))
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesto.current = { id: e.pointerId, x0: e.clientX, arrastrando: false, ultimo: indice }
  }

  const onPointerMove = (e) => {
    const g = gesto.current
    if (!g || g.id !== e.pointerId) return
    if (!g.arrastrando) {
      if (Math.abs(e.clientX - g.x0) < ZONA_MUERTA) return
      g.arrastrando = true
      caja.current.setPointerCapture?.(e.pointerId)
    }
    // Siempre gana una octava: la más cercana al dedo (la píldora salta a ella con el resorte del efecto).
    const cerca = Math.round(enSegmentos(e.clientX))
    if (cerca !== g.ultimo) {
      g.ultimo = cerca
      onCambiar(cerca)
    }
  }

  const terminar = (e) => {
    const g = gesto.current
    if (!g || g.id !== e.pointerId) return
    gesto.current = null
    if (!g.arrastrando) return // un toque: lo resuelve el click del segmento
    tras.current = true
    setTimeout(() => (tras.current = false), 0)
  }

  return (
    <div
      ref={caja}
      role="radiogroup"
      aria-label="Octava del teclado"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={terminar}
      onPointerCancel={terminar}
      className="relative grid h-11 select-none rounded-full bg-zinc-100 p-1"
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, touchAction: 'pan-y' }}
    >
      <motion.span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-white shadow-sm dark:bg-zinc-300"
        style={{ width: `calc((100% - 0.5rem) / ${n})`, x }}
      />
      {octavas.map((o, i) => {
        const activa = i === indice
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={activa}
            aria-label={`Octava ${o}`}
            onClick={() => !tras.current && onCambiar(i)}
            className={`relative rounded-full font-dato text-sm font-medium tabular-nums transition-colors duration-200 ${
              activa ? 'text-zinc-900' : 'text-zinc-500'
            }`}
            style={{ touchAction: 'pan-y' }}
          >
            {n <= 3 ? `Octava ${o}` : o}
          </button>
        )
      })}
    </div>
  )
}
