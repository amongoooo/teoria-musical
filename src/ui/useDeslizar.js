import { animate, useMotionValue } from 'motion/react'
import { useRef } from 'react'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * Gesto de deslizar con las reglas de la app (skill de diseño, sección 3b «Gestos»).
 *
 *  1. Zona muerta REAL: hasta que el dedo se aleja `zonaMuerta` px de donde se apoyó, no se mueve
 *     nada. Al salir, el movimiento empieza desde 0 (sin salto).
 *  2. Del 0 al 75 % del umbral X el contenido sigue al dedo 1:1; del 75 % al 100 % hay una fuerza
 *     en contra (avanza cada vez menos que el dedo): se nota la barrera.
 *  3. Al llegar al 100 % pasa al siguiente SIN soltar. Desde ahí, regresar 1/5 de X vuelve al
 *     anterior; ese regreso tiene también su zona muerta y su barrera del 75 %.
 *  4. `unaPorGesto`: un mismo gesto nunca se aleja más de un paso del punto de partida.
 *  5. Gesto rápido: si se suelta antes de X pero a ≥ DESLIZAR.velocidad en esa dirección, pasa.
 *  6. Sin más elementos (o ya pasado uno con `unaPorGesto`): resistencia tipo goma.
 *  7. `eje`: si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll).
 *
 * Devuelve `progreso`: MotionValue con el avance visual hacia el vecino, en «pasos»
 * (0 = en su sitio, +1 = el siguiente ya en su lugar). Quien lo usa dibuja la posición
 * continua `índice + progreso`. Al pasar, `onPaso(dir)` cambia el índice y el progreso se
 * compensa (-dir) para que no haya saltos; luego vuelve a 0 con un resorte.
 *
 * Opciones:
 *  - onPaso(dir): dir = +1 (siguiente) o -1 (anterior). Cambia el índice.
 *  - puede(dir): true si existe ese vecino.
 *  - umbral: X en px.   - sentido: -1 = arrastrar a la izquierda es «siguiente» (carrusel);
 *    +1 = arrastrar a la derecha es «siguiente» (barra de puntitos).
 *  - zonaMuerta, unaPorGesto, rapido (gesto rápido), eje (ver arriba).
 *  - anclaExacta: tras pasar, el nuevo punto de partida es exactamente X más allá (no donde
 *    está el dedo). Sirve para que el dedo siga alineado con los puntitos.
 *  - alEmpezar(e): se llama al apoyar el dedo (antes de decidir el gesto).
 */
export default function useDeslizar(opciones) {
  const progreso = useMotionValue(0)
  const op = useRef(opciones)
  op.current = { sentido: -1, zonaMuerta: DESLIZAR.zonaMuerta, unaPorGesto: true, rapido: true, eje: true, anclaExacta: false, activo: true, ...opciones }
  const g = useRef(null)
  const ultimoMovido = useRef(false)
  // progreso = dedo + resto. `dedo` sigue al dedo; `resto` es lo que queda por asentar (resorte).
  const v = useRef({ dedo: 0, resto: 0, anim: null })

  const emitir = () => progreso.set(v.current.dedo + v.current.resto)

  /** Lleva `resto` a 0 con un resorte (opcionalmente con velocidad inicial, en pasos/s). */
  const asentar = (velocidad = 0) => {
    const s = v.current
    s.anim?.stop()
    s.anim = animate(s.resto, 0, {
      ...RESORTE.pantalla,
      velocity: velocidad,
      onUpdate: (r) => {
        s.resto = r
        emitir()
      },
    })
  }

  const puedeIr = (s, dir) => (!op.current.unaPorGesto || Math.abs(s.k + dir) <= 1) && op.current.puede(dir)

  /** d = desplazamiento del dedo hacia «siguiente» (px) desde que se apoyó. */
  const mover = (s, d) => {
    const { umbral: X, zonaMuerta } = op.current
    const rel = d - s.ancla
    const dir = Math.sign(rel)
    const r = Math.abs(rel)
    if (dir === 0) {
      v.current.dedo = 0
      return emitir()
    }
    // Umbral de esta dirección: 1/5 de X si es para deshacer el último paso.
    const T = s.ultimo !== 0 && dir === -s.ultimo ? X * DESLIZAR.retorno : X
    const zm = Math.min(zonaMuerta, T * 0.5)
    if (r > zm) s.movido = true
    const puede = puedeIr(s, dir)
    if (puede && r >= T) {
      // Pasa sin soltar: el índice cambia y el progreso se compensa para no saltar.
      const total = v.current.dedo + v.current.resto
      op.current.onPaso(dir)
      s.k += dir
      s.ultimo = dir
      s.ancla = op.current.anclaExacta ? s.ancla + dir * T : d
      v.current.dedo = 0
      v.current.resto = total - dir
      asentar()
      return mover(s, d) // por si el dedo ya cruzó otro umbral (solo sin `unaPorGesto`)
    }
    const visto = puede ? barrera(r, T, zm) : goma(r, zm, X)
    v.current.dedo = (dir * visto) / X
    emitir()
  }

  const posicion = (e) => (op.current.sentido < 0 ? -e.clientX : e.clientX)

  const onPointerDown = (e) => {
    ultimoMovido.current = false
    if (!op.current.activo || (e.pointerType === 'mouse' && e.button !== 0)) return
    op.current.alEmpezar?.(e)
    // Si aún se estaba asentando, lo que falte sigue asentándose; el dedo empieza en 0.
    v.current.resto += v.current.dedo
    v.current.dedo = 0
    if (v.current.resto !== 0) asentar()
    g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, d0: posicion(e), ancla: 0, k: 0, ultimo: 0, decidido: !op.current.eje, movido: false, muestras: [{ t: e.timeStamp, d: 0 }] }
    if (!op.current.eje) e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    if (!s.decidido) {
      const dx = e.clientX - s.x0
      const dy = e.clientY - s.y0
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) {
        g.current = null // gesto vertical: es scroll
        return
      }
      s.decidido = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const d = posicion(e) - s.d0
    s.muestras.push({ t: e.timeStamp, d })
    if (s.muestras.length > 8) s.muestras.shift()
    mover(s, d)
  }

  const terminar = (e, cancelado = false) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    g.current = null
    ultimoMovido.current = s.movido || s.k !== 0
    if (!s.decidido) return
    const { umbral: X, zonaMuerta } = op.current
    const m = s.muestras
    const ultimo = m[m.length - 1]
    const previo = m.find((q) => ultimo.t - q.t <= 100) ?? m[0]
    const vel = ultimo.t > previo.t ? (ultimo.d - previo.d) / (ultimo.t - previo.t) : 0 // px/ms hacia «siguiente»
    // Gesto rápido: pasa aunque no haya llegado a X (solo un paso por gesto).
    const rel = ultimo.d - s.ancla
    const dir = Math.sign(rel)
    if (
      !cancelado &&
      op.current.rapido &&
      s.k === 0 &&
      dir !== 0 &&
      Math.abs(rel) > zonaMuerta &&
      Math.sign(vel) === dir &&
      Math.abs(vel) >= DESLIZAR.velocidad &&
      puedeIr(s, dir)
    ) {
      const total = v.current.dedo + v.current.resto
      op.current.onPaso(dir)
      v.current.dedo = 0
      v.current.resto = total - dir
    } else {
      v.current.resto += v.current.dedo
      v.current.dedo = 0
    }
    emitir()
    asentar(cancelado ? 0 : (vel / X) * 1000)
  }

  // Tras un arrastre, el «click» que el navegador dispara al soltar no debe activar botones.
  const onClickCapture = (e) => {
    if (ultimoMovido.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return {
    progreso,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e) => terminar(e),
      onPointerCancel: (e) => terminar(e, true),
      onClickCapture,
    },
  }
}

/**
 * Cuánto se mueve el contenido (px) cuando el dedo lleva `r` px hacia un umbral `T`:
 * 0 dentro de la zona muerta, 1:1 hasta el 75 % y, de ahí al 100 %, cada vez menos
 * (fuerza en contra que crece; la pendiente baja de 1 a 1 - DESLIZAR.fuerza).
 */
export function barrera(r, T, zm) {
  if (r <= zm) return 0
  const lin = T * DESLIZAR.barrera
  if (r <= lin) return r - zm
  const tramo = T - lin
  const u = Math.min(1, (r - lin) / tramo)
  return lin - zm + tramo * (u - (DESLIZAR.fuerza * u * u) / 2)
}

/** Resistencia tipo goma cuando no se puede pasar: se mueve poco y cada vez menos. */
export function goma(r, zm, X) {
  if (r <= zm) return 0
  const e = (r - zm) * DESLIZAR.goma
  const max = X * 0.25
  return e / (1 + e / max)
}
