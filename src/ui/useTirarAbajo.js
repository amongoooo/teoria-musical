import { animate, useMotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'
import { goma, resistencia } from './useDeslizar.js'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * «Tirar más allá del final»: con la página ya abajo del todo, seguir subiendo el dedo
 * (desplazar «más abajo») tira de la página con las mismas reglas que el swipe lateral
 * (skill de diseño, sección 3b), en vertical:
 *  - zona muerta (DESLIZAR.zonaMuerta px) en la que no se mueve nada;
 *  - resistencia fuerte hasta el 30 % de X (como mucho DESLIZAR.resistencia × X);
 *  - al pasar el 30 % alcanza al dedo con RESORTE.pulsar y lo sigue 1:1 (por debajo del 26 % vuelve la resistencia);
 *  - al 50 % de X, sin soltar, llama a `onPasar()` (cambia de página);
 *  - soltar antes vuelve a su sitio con RESORTE.pantalla; si `puede()` es false, goma.
 * Usa eventos táctiles (el navegador se queda con los Pointer Events al hacer scroll).
 * Devuelve `progreso` (MotionValue en fracciones de X, 0 = en su sitio, 0,5 = pasa).
 */
export default function useTirarAbajo({ activo, umbral, puede, onPasar }) {
  const progreso = useMotionValue(0)
  const op = useRef(null)
  op.current = { activo, umbral, puede, onPasar }

  useEffect(() => {
    let g = null
    let anim = null
    const ir = (valor, resorte) => {
      anim?.stop()
      anim = null
      if (!resorte) return progreso.set(valor)
      anim = animate(progreso, valor, { ...resorte, onComplete: () => (anim = null) })
    }
    const enFondo = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

    const empezar = (e) => {
      g = null
      if (!op.current.activo || e.touches.length !== 1) return
      if (e.target.closest?.('[role=dialog], [data-sin-tirar]')) return
      const t = e.touches[0]
      g = { x0: t.clientX, y0: t.clientY, decidido: false, armado: null, fase: 'quieto', sigue: false, pasado: false }
    }

    const mover = (e) => {
      if (!g || g.pasado) return
      if (e.touches.length !== 1) return soltar()
      const t = e.touches[0]
      if (!g.decidido) {
        const dx = t.clientX - g.x0
        const dy = t.clientY - g.y0
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        if (Math.abs(dx) > Math.abs(dy)) return (g = null) // gesto lateral: no es nuestro
        g.decidido = true
      }
      // Se «arma» en cuanto la página está abajo del todo y el dedo sigue subiendo.
      if (g.armado === null) {
        if (!enFondo()) return (g.ultimoY = t.clientY)
        g.armado = g.ultimoY ?? t.clientY
      }
      const { umbral: X, puede } = op.current
      const r = g.armado - t.clientY // px que se ha tirado más allá del final
      if (r < 0) {
        // Volvió a bajar el dedo: la página vuelve a desplazarse normal.
        g.armado = null
        g.ultimoY = t.clientY
        if (g.fase !== 'quieto') ir(0, RESORTE.pantalla)
        g.fase = 'quieto'
        return
      }
      const zm = Math.min(DESLIZAR.zonaMuerta, X * DESLIZAR.inicio * 0.6)
      let fase
      let valor
      if (!puede()) {
        fase = 'goma'
        valor = goma(r, zm, X) / X
      } else if (r <= zm) {
        fase = 'quieto'
        valor = 0
      } else {
        g.sigue = g.sigue ? r >= X * DESLIZAR.sigueSale : r >= X * DESLIZAR.inicio
        fase = g.sigue ? 'sigue' : 'inicio'
        valor = g.sigue ? r / X : resistencia(r, zm, X) / X
      }
      if (fase !== 'goma' && valor >= DESLIZAR.iman) {
        g.pasado = true
        progreso.set(valor)
        op.current.onPasar()
        return
      }
      if (fase !== g.fase) ir(valor, fase === 'sigue' ? RESORTE.pulsar : RESORTE.pantalla)
      else if (anim)
        ir(valor, fase === 'sigue' ? RESORTE.pulsar : RESORTE.pantalla) // sigue persiguiendo con resorte
      else ir(valor)
      g.fase = fase
    }

    const soltar = () => {
      if (!g) return
      if (!g.pasado && g.fase !== 'quieto') ir(0, RESORTE.pantalla)
      g = null
    }

    const pasivo = { passive: true }
    window.addEventListener('touchstart', empezar, pasivo)
    window.addEventListener('touchmove', mover, pasivo)
    window.addEventListener('touchend', soltar, pasivo)
    window.addEventListener('touchcancel', soltar, pasivo)
    return () => {
      anim?.stop()
      window.removeEventListener('touchstart', empezar, pasivo)
      window.removeEventListener('touchmove', mover, pasivo)
      window.removeEventListener('touchend', soltar, pasivo)
      window.removeEventListener('touchcancel', soltar, pasivo)
    }
  }, [progreso])

  return progreso
}
