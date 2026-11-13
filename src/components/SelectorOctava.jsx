import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { RESORTE } from '../ui/movimiento.js'
import useRuedaMouse from '../ui/useRuedaMouse.js'

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
 *  - invertida (Opciones → Barra de octavas → «Mover las teclas»): los segmentos van al revés (5 · 4 · 3), así al
 *    deslizar a la derecha el teclado se mueve con el dedo y trae las graves (como arrastrar las teclas).
 *    `indice`, onCambiar y onSeguir siguen hablando en el orden real (0 = la más grave).
 *  - onSeguir(p): mientras se arrastra, la posición CONTINUA del dedo en segmentos (0 … n − 1), para que el
 *    teclado lo acompañe; al soltar (o si el navegador cancela el gesto), onSeguir(null): ajustarse a `indice`.
 */
export default function SelectorOctava({ octavas, indice, onCambiar, onSeguir, invertida = false }) {
  const n = octavas.length
  // Índice real ↔ posición en la barra (es su propia inversa). Todo lo de dentro trabaja en posiciones.
  const enBarra = (i) => (invertida ? n - 1 - i : i)
  const caja = useRef(null)
  const pos = useMotionValue(enBarra(indice)) // posición de la píldora, en segmentos (entre dos solo mientras salta)
  const x = useTransform(pos, (p) => `${p * 100}%`)
  const gesto = useRef(null) // { id, x0, arrastrando, ultimo }
  const tras = useRef(false) // ignora el click que llega justo después de arrastrar
  // Computadora: la rueda del mouse mueve la píldora un segmento hacia donde va el scroll.
  // Suma al último destino pedido (varias muescas seguidas llegan antes de que cambie `indice`).
  const objetivo = useRef(indice)
  useEffect(() => {
    objetivo.current = indice
  }, [indice])
  const destinoRueda = (dir) => objetivo.current + (invertida ? -dir : dir)
  useRuedaMouse(caja, {
    puede: (dir) => destinoRueda(dir) >= 0 && destinoRueda(dir) < n,
    onPaso: (dir) => {
      objetivo.current = destinoRueda(dir)
      onCambiar(objetivo.current)
    },
  })

  // La píldora va a la octava elegida (por el dedo, un toque o la prop `ir` del Piano) con un resorte.
  const reducir = useReducedMotion()
  useEffect(() => {
    const destino = invertida ? n - 1 - indice : indice
    if (reducir) return pos.set(destino)
    const control = animate(pos, destino, RESORTE.pantalla)
    return () => control.stop()
  }, [indice, pos, reducir, invertida, n])

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
    // El teclado acompaña al dedo; la píldora no: siempre gana una octava, la más cercana al dedo (salta a
    // ella con el resorte del efecto).
    const p = enSegmentos(e.clientX)
    onSeguir?.(enBarra(p))
    const cerca = enBarra(Math.round(p))
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
    onSeguir?.(null)
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
      {octavas.map((_, v) => {
        const i = enBarra(v) // segmento v de la barra = octava real i
        const o = octavas[i]
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
