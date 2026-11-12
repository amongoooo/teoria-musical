import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { goma, resistencia } from './useDeslizar.js'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * Gesto del botón principal de la lección (BarraAccion): el botón es también un control para pasar de paso
 * (pedido del usuario; skill de diseño, «BarraAccion» y «Gestos»). Dos maneras:
 *
 *  - DESLIZAR sobre el botón: desde el lado donde empezó el dedo entra la flechita (con su brillo) y la palabra
 *    del centro gira como un carrusel a «Atrás» o «Continuar». El avance sigue las reglas de useDeslizar: zona
 *    muerta real (DESLIZAR.zonaMuerta), resistencia fuerte hasta el 30 % de X, alcanza al dedo con RESORTE.pulsar
 *    y lo sigue 1:1, y «suelta para ir» pasado el 50 % (goma más allá). Sin gesto rápido: pasar de paso tiene que
 *    ser a propósito. Si no se puede pasar: goma todo el recorrido y nunca «listo». Al soltar, todo vuelve con
 *    RESORTE.pantalla (si pasa, el botón toma el color del paso nuevo desde ese lado).
 *  - MANTENER pulsado un borde lateral (DESLIZAR.boton.borde del ancho) DESLIZAR.boton.mantener ms: a los
 *    DESLIZAR.boton.brillo ms empieza a entrar la flechita con su brillo (modo 'carga') y el avance crece hasta
 *    quedar, al terminar, igual que el deslizamiento en «suelta para ir» (modo 'mantiene'); al soltar, pasa si se
 *    puede. Soltar antes es un toque normal; moverse más que la zona muerta lo convierte en un deslizamiento.
 *
 * Lado (−1 izquierda, +1 derecha) = donde empezó el gesto. Dirección del paso: por defecto el lado donde empieza es
 * de donde viene la página (derecha → izquierda = siguiente, +1; izquierda → derecha = anterior, −1); con
 * `invertido`, al revés (izquierda → derecha = siguiente).
 *
 * Opciones: { puede(dir) → bool, ir(dir, lado), invertido, activo }.
 * Devuelve { handlers, gesto: { modo: null | 'carga' | 'desliza' | 'mantiene' | 'vuelve' | 'pasa', lado, dir, puede, listo }, avance, dedoX, dedoY, cubre }:
 *  - avance: MotionValue, px que ha avanzado el gesto (con resistencia y goma).
 *  - dedoX / dedoY: MotionValues, posición del dedo respecto al botón (x desde el borde izquierdo, y desde el medio).
 *  - cubre: 0…1, el avance respecto a X/2 (1 = «suelta para ir»): mueve la flechita y el carrusel de palabras.
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
  // Dónde está el dedo respecto al botón: x desde su borde izquierdo, y desde su línea del medio (px). El brillo de la
  // flechita lo sigue un poco.
  const dedoX = useMotionValue(0)
  const dedoY = useMotionValue(0)
  const desfase = useMotionValue(0)
  const anim = useRef(null)
  const avance = useTransform([base, desfase], ([b, d]) => Math.max(0, b + d))
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

  const dirDe = (l) => (op.current.invertido ? -l : l)

  /**
   * Al soltar: todo vuelve a su sitio con resorte. Si pasa, el modo es 'pasa' (el carrusel sigue girando en el mismo
   * sentido: la palabra del paso nuevo entra por el lado del gesto) y el paso nuevo ya pinta su color.
   */
  const terminarVisual = (pasa = false) => {
    colocar(0, RESORTE.pantalla)
    setGesto((e) => (e.modo ? { ...e, modo: pasa ? 'pasa' : 'vuelve', listo: false } : e))
    if (reducir) return setGesto(NADA)
    const vuelta = anim.current
    vuelta?.then?.(() => {
      if (g.current || anim.current !== vuelta) return // ya empezó otro gesto
      setGesto(NADA)
    })
  }

  const onPointerDown = (e) => {
    suprimir.current = false
    if (!op.current.activo || (e.pointerType === 'mouse' && e.button !== 0)) return
    const caja = e.currentTarget.getBoundingClientRect()
    ancho.current = caja.width
    const rel = e.clientX - caja.left
    const borde = Math.max(DESLIZAR.boton.bordeMin, caja.width * DESLIZAR.boton.borde)
    const ladoBorde = rel <= borde ? -1 : rel >= caja.width - borde ? 1 : 0
    dedoX.set(e.clientX - caja.left)
    dedoY.set(e.clientY - (caja.top + caja.height / 2))
    const s = { id: e.pointerId, caja, x0: e.clientX, y0: e.clientY, decidido: false, fase: 'quieto', sigue: false, estado: NADA, timer: null, carga: null }
    if (ladoBorde) {
      // Pulsación larga: empieza con el brillo radial de la flechita (`brillo` ms, así un toque normal no lo enciende)
      // y la tarjeta va saliendo de ese borde hasta quedar, al segundo, IGUAL que el deslizamiento en «suelta para
      // ir» (amarilla al 50 % de X) o, si no se puede pasar, como el deslizamiento con goma al mismo recorrido (gris).
      const { mantener, brillo } = DESLIZAR.boton
      const dir = dirDe(ladoBorde)
      const X = umbral(caja.width)
      const meta = (puede) => (puede ? X * DESLIZAR.iman : goma(X * DESLIZAR.iman, DESLIZAR.zonaMuerta, X))
      s.carga = setTimeout(() => {
        if (g.current !== s || s.decidido) return
        const puede = op.current.puede(dir)
        anim.current?.stop()
        base.set(0)
        desfase.set(0)
        s.lado = ladoBorde
        cambiarGesto(s, { modo: 'carga', lado: ladoBorde, dir, puede, listo: false })
        if (!reducir) anim.current = animate(base, meta(puede), { duration: (mantener - brillo) / 1000, ease: [0.4, 0, 0.6, 1] })
      }, brillo)
      s.timer = setTimeout(() => {
        if (g.current !== s || s.decidido) return
        const puede = op.current.puede(dir)
        suprimir.current = true
        anim.current?.stop()
        base.set(meta(puede))
        desfase.set(0)
        cambiarGesto(s, { modo: 'mantiene', lado: ladoBorde, dir, puede, listo: puede })
      }, mantener)
    }
    g.current = s
  }

  const onPointerMove = (e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x0
    dedoX.set(e.clientX - s.caja.left)
    dedoY.set(e.clientY - (s.caja.top + s.caja.height / 2))
    const dy = e.clientY - s.y0
    if (s.estado.modo === 'mantiene') return // ya se mantiene: el dedo puede temblar sin cambiar nada
    if (!s.decidido) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) {
        clearTimeout(s.timer)
        clearTimeout(s.carga)
        g.current = null // vertical: es scroll
        if (s.estado.modo) terminarVisual()
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
    clearTimeout(s.carga)
    suprimir.current = true
    if (s.estado.modo === 'carga') {
      // Se movía mientras cargaba la pulsación larga: pasa a ser un deslizamiento; lo que ya salió se asienta.
      const vis = base.get() + desfase.get()
      anim.current?.stop()
      base.set(0)
      desfase.set(vis)
      asentar(RESORTE.pantalla)
      s.fase = 'quieto'
      s.sigue = false
    }
    const l = dx < 0 ? 1 : -1 // sale del lado donde empezó el dedo
    const dir = dirDe(l)
    const permitido = op.current.puede(dir)
    if (s.lado !== l) {
      // Cambió de lado (o empieza): la flechita entra desde su borde, sin arrastrar lo de antes.
      if (s.lado) {
        anim.current?.stop()
        base.set(0)
        desfase.set(0)
      }
      s.lado = l
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
    clearTimeout(s.carga)
    const { modo, dir, listo } = s.estado
    const pasa = !cancelado && modo && listo
    if (!modo) return
    terminarVisual(pasa)
    if (pasa) op.current.ir(dir, s.estado.lado)
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
    avance,
    dedoX,
    dedoY,
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
