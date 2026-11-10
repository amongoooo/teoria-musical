import { animate, useMotionValue } from 'motion/react'
import { useRef } from 'react'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * Gesto de deslizar (swipe) horizontal con las reglas de la app (ver skill de diseño, «Gestos»):
 *
 *  1. Empieza en cuanto se presiona el dedo o el ratón.
 *  2. Zona muerta: los primeros píxeles casi no mueven nada (curva suave, sin saltos).
 *  3. Si se arrastra `umbral` px, pasa al siguiente AUNQUE NO SE SUELTE; el arrastre sigue
 *     desde la nueva posición.
 *  4. Si después se regresa 1/5 del umbral, vuelve al anterior (histéresis).
 *  5. Al soltar sin llegar al umbral: si el gesto fue rápido (velocidad ≥ DESLIZAR.velocidad)
 *     y en la misma dirección, también pasa. Si no, vuelve a su sitio con un resorte.
 *  6. En los extremos (no hay más) ofrece resistencia tipo goma.
 *  7. Si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll).
 *
 * onPaso(dir) — dir = +1 (siguiente, arrastrando hacia la izquierda) o ‑1. Debe devolver
 * true si pudo moverse y false si ya está en el extremo.
 *
 * Devuelve { x, handlers, arrastrando } — `x` es un MotionValue para el elemento que sigue al
 * dedo (style={{ x }}), `handlers` van en el contenedor que recibe el gesto.
 */
export default function useDeslizar({ onPaso, umbral = 110, activo = true }) {
  const x = useMotionValue(0)
  const g = useRef(null)
  const ultimoMovido = useRef(false)
  const zm = DESLIZAR.zonaMuerta

  /** Curva de la zona muerta: cuadrática hasta `zm` y luego lineal (continua y sin escalón). */
  const suave = (d) => {
    const a = Math.abs(d)
    return Math.sign(d) * (a < zm ? (a * a) / (2 * zm) : a - zm / 2)
  }

  const mostrar = (r, extremo) => x.set(suave(extremo ? r * DESLIZAR.goma : r))

  const onPointerDown = (e) => {
    if (!activo || (e.pointerType === 'mouse' && e.button !== 0)) return
    g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, k: 0, decidido: false, movido: false, extremo: 0, muestras: [{ t: e.timeStamp, x: e.clientX }] }
  }

  const onPointerMove = (e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (!s.decidido) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) {
        g.current = null // gesto vertical: es scroll
        return
      }
      s.decidido = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    if (Math.abs(dx) > zm) s.movido = true
    s.muestras.push({ t: e.timeStamp, x: e.clientX })
    if (s.muestras.length > 6) s.muestras.shift()

    // Avance en «umbrales»: p = 1 → un paso hacia la siguiente.
    const p = -dx / umbral
    let cambio = true
    while (cambio) {
      cambio = false
      const adelante = s.k >= 0 ? s.k + 1 : s.k + DESLIZAR.retorno
      const atras = s.k <= 0 ? s.k - 1 : s.k - DESLIZAR.retorno
      if (p >= adelante) {
        if (onPaso(+1)) {
          s.k += 1
          cambio = true
          s.extremo = 0
        } else s.extremo = 1
      } else if (p <= atras) {
        if (onPaso(-1)) {
          s.k -= 1
          cambio = true
          s.extremo = 0
        } else s.extremo = -1
      } else if ((s.extremo === 1 && p < s.k + 1) || (s.extremo === -1 && p > s.k - 1)) {
        s.extremo = 0
      }
    }
    const r = dx + s.k * umbral // desplazamiento respecto a la posición ya alcanzada
    mostrar(r, s.extremo !== 0 && Math.sign(-r) === s.extremo)
  }

  const terminar = (e, cancelado = false) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    g.current = null
    if (!s.decidido) return
    const dx = e.clientX - s.x0
    const m = s.muestras
    const ultimo = m[m.length - 1]
    const previo = m.find((q) => ultimo.t - q.t <= 100) ?? m[0]
    const v = ultimo.t > previo.t ? (ultimo.x - previo.x) / (ultimo.t - previo.t) : 0 // px/ms
    let r = dx + s.k * umbral
    // Gesto corto pero rápido: cuenta como swipe.
    if (!cancelado && s.k === 0 && Math.abs(dx) >= zm && Math.abs(v) >= DESLIZAR.velocidad && Math.sign(v) === Math.sign(dx)) {
      const dir = dx < 0 ? 1 : -1
      if (onPaso(dir)) r = dx + dir * umbral // la nueva entra desde donde está el dedo
    }
    x.set(suave(r))
    animate(x, 0, { ...RESORTE.pantalla, velocity: v * 1000 })
  }

  // Tras un arrastre, el «click» que el navegador dispara al soltar no debe activar botones.
  const onClickCapture = (e) => {
    if (ultimoMovido.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return {
    x,
    handlers: {
      onPointerDown: (e) => {
        ultimoMovido.current = false
        onPointerDown(e)
      },
      onPointerMove,
      onPointerUp: (e) => {
        ultimoMovido.current = Boolean(g.current?.movido)
        terminar(e)
      },
      onPointerCancel: (e) => terminar(e, true),
      onClickCapture,
    },
  }
}
