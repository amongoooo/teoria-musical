import { animate, useMotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'
import { goma, resistencia } from './useDeslizar.js'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * «Tirar más allá del borde» de la página, en vertical, con las mismas reglas que el swipe lateral
 * (skill de diseño, sección 3b):
 *  - Abajo del todo y el dedo sigue subiendo → dir +1 (p. ej. módulo siguiente).
 *  - Arriba del todo y el dedo baja → dir −1 (módulo anterior), PERO solo si el gesto empezó por
 *    debajo de `limiteRecarga()` (px desde arriba de la pantalla; p. ej. el borde de abajo del título del
 *    módulo; si no se da, `DESLIZAR.pagina.recarga` × alto de la pantalla). Si empieza más arriba, no
 *    se toca: el navegador hace su «tirar para recargar» de siempre.
 * Fases: zona muerta (DESLIZAR.zonaMuerta px) → resistencia fuerte hasta el 30 % de X (como mucho
 * DESLIZAR.resistencia × X) → alcanza al dedo con RESORTE.pulsar y lo sigue 1:1 (por debajo del 26 %
 * vuelve la resistencia) → pasado el 50 % de X sigue al dedo con goma y `listo` vale ±1 («Suelta para
 * ir»): **solo al soltar ahí** llama a `onPasar(dir)`. Si el dedo vuelve por debajo del 50 %, `listo`
 * vuelve a 0 y al soltar regresa con RESORTE.pantalla. Si `puede(dir)` es false: goma.
 *
 * Usa eventos táctiles (con el scroll, el navegador se queda con los Pointer Events). Cuando el gesto
 * es nuestro se cancela el touchmove, así no hay rebote ni recarga a la vez. Además, lejos de arriba
 * `html` y `body` llevan `overscroll-behavior-y: none` (sin rebote ni «estirón» propio del navegador:
 * en Android, Chrome estira la página al pasar del borde y eso empujaba fuera de la pantalla lo que
 * está fijo abajo, como la barra de puntitos) y arriba del todo `auto` (para que funcione «tirar para
 * recargar»), salvo si el gesto está desactivado (p. ej. con una isla abierta): entonces siempre `none`.
 * Devuelve { progreso, listo }: `progreso` en fracciones de X con signo (+ abajo, − arriba; ±0,5 = punto
 * de pasar) y `listo` (±1 si al soltar ahora pasaría, 0 si no).
 */
export default function useTirarBordes({ activo, umbral, puede, onPasar, limiteRecarga }) {
  const progreso = useMotionValue(0)
  const listo = useMotionValue(0)
  const op = useRef(null)
  op.current = { activo, umbral, puede, onPasar, limiteRecarga }
  const rebote = useRef(null)
  // Al activarse o desactivarse (abrir/cerrar una isla), el rebote del navegador cambia al momento.
  useEffect(() => rebote.current?.(), [activo])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const antes = [html.style.overscrollBehaviorY, body.style.overscrollBehaviorY]
    const ajustarRebote = () => {
      const valor = op.current.activo && window.scrollY <= 0 ? 'auto' : 'none'
      html.style.overscrollBehaviorY = valor
      body.style.overscrollBehaviorY = valor
    }
    rebote.current = ajustarRebote
    ajustarRebote()

    let g = null
    let anim = null
    const ir = (valor, resorte) => {
      anim?.stop()
      anim = null
      if (!resorte) return progreso.set(valor)
      anim = animate(progreso, valor, { ...resorte, onComplete: () => (anim = null) })
    }
    const enFondo = () => window.innerHeight + window.scrollY >= html.scrollHeight - 2
    const arriba = () => window.scrollY <= 0

    const empezar = (e) => {
      g = null
      ajustarRebote()
      if (!op.current.activo || e.touches.length !== 1) return
      if (e.target.closest?.('[role=dialog], [data-sin-tirar]')) return
      const t = e.touches[0]
      g = {
        x0: t.clientX,
        y0: t.clientY,
        ultimoY: t.clientY,
        decidido: false,
        armado: null,
        dir: 0,
        fase: 'quieto',
        sigue: false,
        pasado: false,
        // Tirar desde arriba solo si el dedo se apoyó en la parte baja de la pantalla.
        arribaPermitido: t.clientY > (op.current.limiteRecarga?.() ?? window.innerHeight * DESLIZAR.pagina.recarga),
      }
    }

    const mover = (e) => {
      if (!g) return
      if (g.pasado) return e.cancelable && e.preventDefault()
      if (e.touches.length !== 1) return soltar()
      const t = e.touches[0]
      if (!g.decidido) {
        const dx = t.clientX - g.x0
        const dy = t.clientY - g.y0
        // Arriba del todo, bajando desde la parte baja: el gesto es nuestro desde el primer px
        // (si no, el navegador empezaría a recargar).
        if (g.arribaPermitido && arriba() && dy > 0 && Math.abs(dy) >= Math.abs(dx) && e.cancelable) e.preventDefault()
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        if (Math.abs(dx) > Math.abs(dy)) return (g = null) // gesto lateral: no es nuestro
        g.decidido = true
      }
      // Se «arma» en el borde: abajo del todo subiendo el dedo, o arriba del todo bajándolo.
      if (g.armado === null) {
        if (enFondo() && t.clientY < g.ultimoY) g.dir = 1
        else if (g.arribaPermitido && arriba() && t.clientY > g.ultimoY) g.dir = -1
        else return (g.ultimoY = t.clientY)
        g.armado = g.ultimoY
      }
      const { umbral: X, puede } = op.current
      const dir = g.dir
      const r = (g.armado - t.clientY) * dir // px que se ha tirado más allá del borde
      if (r < 0) {
        // El dedo volvió atrás: la página vuelve a desplazarse normal.
        g.armado = null
        g.ultimoY = t.clientY
        if (g.fase !== 'quieto') ir(0, RESORTE.pantalla)
        g.fase = 'quieto'
        g.sigue = false
        listo.set(0)
        return
      }
      if (e.cancelable) e.preventDefault()
      const zm = Math.min(DESLIZAR.zonaMuerta, X * DESLIZAR.inicio * 0.6)
      let fase
      let valor
      if (!puede(dir)) {
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
      // Pasado el 50 %: «Suelta para ir». Sigue al dedo, cada vez más duro (goma); pasa solo al soltar.
      const l = fase !== 'goma' && valor >= DESLIZAR.iman ? dir : 0
      if (l) valor = DESLIZAR.iman + goma(r - X * DESLIZAR.iman, 0, X) / X
      if (l !== listo.get()) listo.set(l)
      const resorte = fase === 'sigue' ? RESORTE.pulsar : RESORTE.pantalla
      if (fase !== g.fase || anim) ir(dir * valor, resorte) // cambio de fase (o aún persiguiendo): con resorte
      else ir(dir * valor)
      g.fase = fase
    }

    const soltar = (e) => {
      if (!g) return
      const l = listo.get()
      listo.set(0)
      if (l && e?.type === 'touchend' && op.current.puede(l)) {
        g.pasado = true
        g = null
        return op.current.onPasar(l)
      }
      if (g.fase !== 'quieto') ir(0, RESORTE.pantalla)
      g = null
    }

    const pasivo = { passive: true }
    const activoEv = { passive: false } // touchmove se cancela cuando el gesto es nuestro
    window.addEventListener('touchstart', empezar, pasivo)
    window.addEventListener('touchmove', mover, activoEv)
    window.addEventListener('touchend', soltar, pasivo)
    window.addEventListener('touchcancel', soltar, pasivo)
    window.addEventListener('scroll', ajustarRebote, pasivo)
    return () => {
      anim?.stop()
      ;[html.style.overscrollBehaviorY, body.style.overscrollBehaviorY] = antes
      rebote.current = null
      window.removeEventListener('touchstart', empezar, pasivo)
      window.removeEventListener('touchmove', mover, activoEv)
      window.removeEventListener('touchend', soltar, pasivo)
      window.removeEventListener('touchcancel', soltar, pasivo)
      window.removeEventListener('scroll', ajustarRebote, pasivo)
    }
  }, [progreso, listo])

  return { progreso, listo }
}
