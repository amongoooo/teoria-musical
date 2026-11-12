import { useAnimate, useReducedMotion } from 'motion/react'
import { useCallback } from 'react'
import { TEMBLOR } from './movimiento.js'

const limitar = (v, min, max) => Math.min(max, Math.max(min, v))

/** Cuánto tiembla un objeto de `ancho` × `alto` px: { x, y } en px y `rotate` en grados. */
export function medidaTemblor(ancho, alto) {
  const { px, grados, min, max } = TEMBLOR
  return {
    x: limitar(px / Math.max(ancho, 1), min.mover, max.mover),
    y: limitar(px / Math.max(alto, 1), min.mover, max.mover),
    rotate: limitar(grados / Math.sqrt(Math.max(ancho * alto, 1)), min.girar, max.girar),
  }
}

/**
 * Animación «temblar», la misma en toda la app (presets en `TEMBLOR` de movimiento.js; reglas en la skill de
 * diseño, sección Movimiento). Uso:
 *   const [ref, temblar] = useTemblor()
 *   <li ref={ref}>…</li>   …   temblar()
 * El elemento con `ref` no debe animar x / y / rotate por su cuenta (envuelve a lo que ya se anima).
 * Con «reducir movimiento» no se mueve: parpadea (opacidad) para que siga habiendo respuesta.
 */
export default function useTemblor() {
  const [ref, animate] = useAnimate()
  const reducir = useReducedMotion()

  const temblar = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (reducir) {
      animate(el, { opacity: [null, 0.45, 1] }, { duration: TEMBLOR.duracion, ease: 'easeInOut' })
      return
    }
    const medida = medidaTemblor(el.offsetWidth, el.offsetHeight)
    for (const eje of ['x', 'y', 'rotate']) {
      const sentido = Math.random() < 0.5 ? -1 : 1
      const retraso = Math.random() * TEMBLOR.desfase
      animate(
        el,
        { [eje]: [null, ...TEMBLOR.ida.map((f) => f * sentido * medida[eje])] },
        { duration: TEMBLOR.duracion - retraso, delay: retraso, ease: 'easeInOut' },
      )
    }
  }, [ref, animate, reducir])

  return [ref, temblar]
}
