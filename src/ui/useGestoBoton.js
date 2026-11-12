import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { goma, resistencia } from './useDeslizar.js'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * Gesto del botón principal de la lección (BarraAccion): el botón es también un control para pasar de paso
 * (pedido del usuario; skill de diseño, «BarraAccion» y «Gestos»). Dos maneras:
 *
 *  - DESLIZAR sobre el botón: una tarjeta (amarilla si se puede pasar, gris si no) sale del lado donde empezó
 *    el dedo y se desplaza con él; en ese lado aparece la flechita. Mismas reglas que useDeslizar: zona
 *    muerta real (DESLIZAR.zonaMuerta), resistencia fuerte hasta el 30 % de X, alcanza al dedo con
 *    RESORTE.pulsar y lo sigue 1:1, y «suelta para ir» pasado el 50 % (goma más allá). Sin gesto rápido:
 *    pasar de paso tiene que ser a propósito. Si no se puede pasar: goma todo el recorrido y nunca «listo».
 *    Al soltar sin «listo», la tarjeta vuelve con RESORTE.pantalla.
 *  - MANTENER pulsado un borde lateral (DESLIZAR.boton.borde del ancho) DESLIZAR.boton.mantener ms: aparece
 *    la flechita de ese lado; al soltar, pasa si era amarilla. Moverse más que la zona muerta lo cancela.
 *
 * Lado (−1 izquierda, +1 derecha) = de donde sale la tarjeta = donde empezó el gesto. Dirección del paso:
 * por defecto, de izquierda a derecha = siguiente (+1) y de derecha a izquierda = anterior (−1);
 * con `invertido`, al revés (el lado de donde empieza es de donde viene la página: derecha → izquierda = siguiente).
 *
 * Opciones: { puede(dir) → bool, ir(dir), invertido, activo }.
 * Devuelve { handlers, gesto: { modo: null | 'desliza' | 'mantiene' | 'vuelve', lado, dir, puede, listo }, x, opacidad, cubre }:
 *  - x: MotionValue con la posición (px) de la tarjeta respecto al botón (±ancho = fuera; 0 = lo cubre todo).
 *  - opacidad: MotionValue de la tarjeta (se desvanece después de pasar de paso).
 *  - cubre: 0…1, cuánto se ha desplazado la tarjeta respecto a X/2 (para atenuar el texto del botón).
 */
export default function useGestoBoton({ puede, ir, invertido = false, activo = true }) {
  const reducir = useReducedMotion()
  const [gesto, setGesto] = useState(NADA)
  const op = useRef(null)
  op.current = { puede, ir, invertido, activo }
  const g = useRef(null) // gesto en curso
  const suprimir = useRef(false) // el «click» al soltar no debe pulsar el botón
  const ancho = useRef(320)

  // Lo que se ve = base (lo que pide el dedo) + desfase (lo que falta por asentar, con resorte).
  const base = useMotionValue(0)
  const desfase = useMotionValue(0)
  const lado = useMotionValue(0)
  const opacidad = useMotionValue(1) // de la tarjeta (se desvanece tras pasar de paso)
  const anim = useRef(null)
  const avance = useTransform([base, desfase], ([b, d]) => Math.max(0, b + d))
  const x = useTransform([avance, lado], ([a, l]) => (l === 0 ? ancho.current + 40 : l * (ancho.current - a)))
  const cubre = useTransform(avance, (a) => Math.min(1, a / (umbral(ancho.current) * DESLIZAR.iman)))

  const asentar = (resorte) => {
    anim.current?.stop()
    if (reducir) {
      desfase.set(0)
      return
    }
    anim.current = animate(desfase, 0, resorte)
  }

  /** Mueve el objetivo a `valor` px; si cambió de fase, lo que se separa se asienta con `resorte`. */
  const colocar = (valor, resorte) => {
    const vis = base.get() + desfase.get()
    base.set(valor)
    if (resorte) {
      desfase.set(vis - valor)
      asentar(resorte)
    }
  }

  const cambiarGesto = (s, nuevo) => {
    if (s.estado.modo === nuevo.modo && s.estado.lado === nuevo.lado && s.estado.puede === nuevo.puede && s.estado.listo === nuevo.listo) return
    s.estado = nuevo
    setGesto(nuevo)
  }

  const dirDe = (l) => (op.current.invertido ? l : -l)

  const terminarVisual = (paso) => {
    anim.current?.stop()
    if (paso && !reducir) {
      // Pasa: la tarjeta acaba de cubrir el botón y se desvanece con el cambio de paso.
      const vis = base.get() + desfase.get()
      base.set(ancho.current)
      desfase.set(vis - ancho.current)
      anim.current = animate(desfase, 0, RESORTE.pulsar)
      // …y, ya cubierto, se desvanece (fundido de 200 ms) para dejar ver el color del paso nuevo.
      animate(opacidad, 0, { duration: 0.2, delay: 0.12 }).then(() => {
        if (g.current) return
        setGesto(NADA)
        base.set(0)
        desfase.set(0)
        lado.set(0)
        opacidad.set(1)
      })
      return
    }
    if (paso) {
      base.set(0)
      desfase.set(0)
      lado.set(0)
      setGesto(NADA)
      return
    }
    colocar(0, RESORTE.pantalla)
    setGesto((e) => (e.modo ? { ...e, modo: 'vuelve', listo: false } : e))
    if (reducir) {
      lado.set(0)
      setGesto(NADA)
    } else {
      const vuelta = anim.current
      vuelta?.then?.(() => {
        if (g.current || anim.current !== vuelta) return // ya empezó otro gesto
        lado.set(0)
        setGesto(NADA)
      })
    }
  }

  const onPointerDown = (e) => {
    suprimir.current = false
    if (!op.current.activo || (e.pointerType === 'mouse' && e.button !== 0)) return
    const caja = e.currentTarget.getBoundingClientRect()
    ancho.current = caja.width
    const rel = e.clientX - caja.left
    const borde = Math.max(DESLIZAR.boton.bordeMin, caja.width * DESLIZAR.boton.borde)
    const ladoBorde = rel <= borde ? -1 : rel >= caja.width - borde ? 1 : 0
    const s = { id: e.pointerId, x0: e.clientX, y0: e.clientY, decidido: false, fase: 'quieto', sigue: false, estado: NADA, timer: null }
    if (ladoBorde) {
      s.timer = setTimeout(() => {
        if (g.current !== s || s.decidido) return
        const dir = dirDe(ladoBorde)
        suprimir.current = true
        anim.current?.stop()
        base.set(0)
        desfase.set(0)
        lado.set(0)
        cambiarGesto(s, { modo: 'mantiene', lado: ladoBorde, dir, puede: op.current.puede(dir), listo: op.current.puede(dir) })
      }, DESLIZAR.boton.mantener)
    }
    g.current = s
  }

  const onPointerMove = (e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (s.estado.modo === 'mantiene') return // ya se mantiene: el dedo puede temblar sin cambiar nada
    if (!s.decidido) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) {
        clearTimeout(s.timer)
        g.current = null // vertical: es scroll
        return
      }
      s.decidido = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const X = umbral(ancho.current)
    const zm = DESLIZAR.zonaMuerta
    const r = Math.abs(dx)
    if (r <= zm) {
      // Zona muerta REAL: no se mueve nada (y aún puede contar como pulsación larga).
      if (s.fase !== 'quieto') colocar(0, RESORTE.pantalla)
      s.fase = 'quieto'
      s.sigue = false
      return
    }
    clearTimeout(s.timer)
    suprimir.current = true
    const l = dx < 0 ? 1 : -1 // sale del lado donde empezó el dedo
    const dir = dirDe(l)
    const permitido = op.current.puede(dir)
    if (lado.get() !== l) {
      // Cambió de lado (o empieza): la tarjeta sale de su borde, sin arrastrar lo de antes.
      anim.current?.stop()
      base.set(0)
      desfase.set(0)
      lado.set(l)
      opacidad.set(1)
      s.fase = 'quieto'
      s.sigue = false
    }
    let fase
    let valor
    if (!permitido) {
      fase = 'goma'
      valor = goma(r, zm, X)
    } else {
      s.sigue = s.sigue ? r >= X * DESLIZAR.sigueSale : r >= X * DESLIZAR.inicio
      if (!s.sigue) {
        fase = 'inicio'
        valor = resistencia(r, zm, X)
      } else if (r > X * DESLIZAR.iman) {
        fase = 'sigue' // suelta para ir: sigue al dedo cada vez más duro
        valor = X * DESLIZAR.iman + goma(r - X * DESLIZAR.iman, 0, X)
      } else {
        fase = 'sigue'
        valor = r
      }
    }
    const resorte = fase !== s.fase && s.fase !== 'quieto' ? (fase === 'sigue' ? RESORTE.pulsar : RESORTE.pantalla) : null
    s.fase = fase
    colocar(valor, resorte)
    cambiarGesto(s, { modo: 'desliza', lado: l, dir, puede: permitido, listo: permitido && r >= X * DESLIZAR.iman })
  }

  const terminar = (e, cancelado = false) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    g.current = null
    clearTimeout(s.timer)
    const { modo, dir, listo } = s.estado
    const pasa = !cancelado && modo && listo
    if (!modo) return
    terminarVisual(pasa)
    if (pasa) op.current.ir(dir)
  }

  useEffect(() => () => clearTimeout(g.current?.timer), [])

  const onClickCapture = (e) => {
    if (!suprimir.current) return
    suprimir.current = false
    e.stopPropagation()
    e.preventDefault()
  }

  return {
    gesto,
    x,
    opacidad,
    cubre,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e) => terminar(e),
      onPointerCancel: (e) => terminar(e, true),
      onClickCapture,
      onContextMenu: (e) => e.preventDefault(), // pulsación larga en Android: sin menú
    },
  }
}

const NADA = { modo: null, lado: 0, dir: 0, puede: false, listo: false }

/** X del gesto del botón: una fracción de su ancho, con mínimo. */
const umbral = (w) => Math.max(DESLIZAR.boton.umbralMin, w * DESLIZAR.boton.umbral)
