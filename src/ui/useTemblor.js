import { useAnimate, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'
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

/** Valor del temblor en `t` (0…1 del ciclo): los puntos de TEMBLOR.ida repartidos, con «ease in-out» entre ellos. */
function enCiclo(t) {
  const puntos = [0, ...TEMBLOR.ida]
  const tramos = puntos.length - 1
  const i = Math.min(tramos - 1, Math.floor(t * tramos))
  const u = t * tramos - i
  const suave = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2
  return puntos[i] + (puntos[i + 1] - puntos[i]) * suave
}

/**
 * Temblor que CRECE (pedido del usuario: al mantener pulsado algo que se va a borrar). `empezar(ms)` tiembla sin parar,
 * ciclo tras ciclo (los de `TEMBLOR`: 0,25 s, sentido y desfase al azar en cada eje), con la amplitud subiendo poco a
 * poco de 0 a la de siempre (`medidaTemblor`) en `ms`; `parar()` lo detiene y lo devuelve a su sitio. El elemento con
 * `ref` no debe animar x / y / rotate por su cuenta. Con «reducir movimiento», parpadea cada vez más.
 * (Con requestAnimationFrame y no con animate(): encadenar animate() ciclo tras ciclo no llegaba a moverlo.)
 */
export function useTemblorCreciente() {
  const ref = useRef(null)
  const reducir = useReducedMotion()
  const vivo = useRef(null)

  const parar = useCallback(() => {
    const e = vivo.current
    if (!e) return
    cancelAnimationFrame(e.raf)
    vivo.current = null
    const el = ref.current
    if (!el) return
    // Vuelve a su sitio con un fundido corto.
    el.style.transition = 'transform 120ms ease-out, opacity 120ms ease-out'
    el.style.transform = ''
    el.style.opacity = ''
    setTimeout(() => el && (el.style.transition = ''), 140)
  }, [])

  const empezar = useCallback(
    (ms) => {
      parar()
      const el = ref.current
      if (!el) return
      el.style.transition = ''
      const medida = medidaTemblor(el.offsetWidth, el.offsetHeight)
      const dur = TEMBLOR.duracion * 1000
      const t0 = performance.now()
      // Cada eje con su propio ciclo: sentido y desfase al azar en cada vuelta.
      const ejes = ['x', 'y', 'rotate'].map((eje) => ({ eje, sentido: 1, retraso: 0, inicio: -Infinity }))
      const e = { raf: 0 }
      vivo.current = e
      const paso = (ahora) => {
        if (vivo.current !== e) return
        // Crece con una curva suave (lento al principio): f de 0 a 1 en `ms`, luego se queda en 1.
        const f = Math.min(1, (ahora - t0) / ms) ** 1.5
        const v = {}
        for (const c of ejes) {
          if (ahora - c.inicio >= dur) {
            c.inicio = ahora
            c.sentido = Math.random() < 0.5 ? -1 : 1
            c.retraso = Math.random() * TEMBLOR.desfase * 1000
          }
          const t = (ahora - c.inicio - c.retraso) / (dur - c.retraso)
          v[c.eje] = t <= 0 ? 0 : enCiclo(Math.min(1, t)) * c.sentido * f * medida[c.eje]
        }
        if (reducir) el.style.opacity = String(1 - 0.55 * f * Math.abs(enCiclo(((ahora - t0) % dur) / dur)))
        else el.style.transform = `translate(${v.x.toFixed(2)}px, ${v.y.toFixed(2)}px) rotate(${v.rotate.toFixed(2)}deg)`
        e.raf = requestAnimationFrame(paso)
      }
      e.raf = requestAnimationFrame(paso)
    },
    [reducir, parar],
  )

  useEffect(() => () => cancelAnimationFrame(vivo.current?.raf), [])
  return [ref, empezar, parar]
}
