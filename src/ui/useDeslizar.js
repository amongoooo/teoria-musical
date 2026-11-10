import { animate, useMotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * Gesto de deslizar con las reglas de la app (skill de diseño, sección 3b «Gestos»).
 * X = `umbral` (px). f = desplazamiento del dedo desde el ancla, en fracciones de X.
 *
 *  1. Zona muerta REAL (`zonaMuerta` px): ahí no se mueve nada.
 *  2. Resistencia de inicio fuerte: del final de la zona muerta al 30 % de X el contenido casi no se
 *     mueve (como mucho `DESLIZAR.resistencia` × X, cada vez más duro).
 *  3. Al pasar el 30 %: el contenido alcanza la posición exacta del dedo con un resorte rápido
 *     (RESORTE.pulsar) y desde ahí lo sigue 1:1. (Vuelve a la resistencia por debajo del 26 %.)
 *  4. Imán al 50 %, SIN soltar: se pega al vecino con RESORTE.pantalla y ese pasa a ser el actual.
 *     Si el dedo regresa por debajo del 40 % (histéresis), vuelve al anterior.
 *  5. Avance continuo (`continuo`): con el dedo más allá del 95 % pasa isla por isla sola
 *     (1000 → 700 → 500 → 350 → 250 ms). Para al soltar, al regresar o en el extremo.
 *  6. Soltar antes del 50 %: vuelve a su sitio. Gesto rápido (≥ DESLIZAR.velocidad): pasa uno.
 *  7. Sin vecino: resistencia tipo goma.
 *  8. `eje`: si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll).
 *
 * `cadena` (barra de puntitos): tras cada imán el ancla avanza exactamente X (el puntito siguiente)
 * y la misma curva se repite entre puntito y puntito: una isla por cada puntito que se cruza, sin
 * avance continuo.
 *
 * Devuelve `progreso`: MotionValue con el avance visual hacia el vecino, en «pasos»
 * (0 = en su sitio, +1 = el siguiente ya en su lugar). Quien lo usa dibuja la posición continua
 * `índice + progreso`. Al pasar, `onPaso(dir)` cambia el índice y el progreso se compensa (-dir)
 * para que no haya saltos; luego se asienta con un resorte.
 *
 * Opciones:
 *  - onPaso(dir): dir = +1 (siguiente) o -1 (anterior). Cambia el índice.
 *  - puede(dir): true si existe ese vecino.
 *  - umbral: X en px.   - sentido: -1 = arrastrar a la izquierda es «siguiente» (carrusel);
 *    +1 = arrastrar a la derecha es «siguiente» (barra de puntitos).
 *  - zonaMuerta, rapido (gesto rápido), eje, cadena, continuo (ver arriba).
 *  - alEmpezar(e): se llama al apoyar el dedo (antes de decidir el gesto).
 */
export default function useDeslizar(opciones) {
  const progreso = useMotionValue(0)
  const op = useRef(opciones)
  op.current = { sentido: -1, zonaMuerta: DESLIZAR.zonaMuerta, rapido: true, eje: true, cadena: false, continuo: true, activo: true, ...opciones }
  const g = useRef(null)
  const ultimoMovido = useRef(false)
  // progreso = dedo + resto. `dedo` es donde el gesto quiere el contenido; `resto` es lo que falta
  // por asentar (resorte hacia 0). Así cada cambio de fase se suaviza sin saltos.
  const v = useRef({ dedo: 0, resto: 0, anim: null })

  const emitir = () => progreso.set(v.current.dedo + v.current.resto)

  /** Lleva `resto` a 0 con un resorte (opcionalmente con velocidad inicial, en pasos/s). */
  const asentar = (resorte = RESORTE.pantalla, velocidad = 0) => {
    const s = v.current
    s.anim?.stop()
    s.anim = animate(s.resto, 0, {
      ...resorte,
      velocity: velocidad,
      onUpdate: (r) => {
        s.resto = r
        emitir()
      },
    })
  }

  /** Cambia de elemento: el índice cambia y el progreso se compensa para que no salte. */
  const pasar = (s, dir) => {
    op.current.onPaso(dir)
    s.k += dir
    v.current.resto -= dir
  }

  const pararAuto = (s) => {
    clearTimeout(s?.auto)
    if (s) s.auto = null
  }

  /** Avance continuo: el siguiente paso llega tras DESLIZAR.continuo[n] ms (el último se repite). */
  const programarAuto = (s) => {
    const esperas = DESLIZAR.continuo
    s.auto = setTimeout(() => {
      if (g.current !== s) return
      const dir = s.pegado
      if (!op.current.puede(dir)) return (s.auto = null) // extremo: goma
      s.movido = true
      pasar(s, dir)
      asentar(RESORTE.pantalla) // cada paso automático se anima con resorte
      s.nAuto += 1
      programarAuto(s)
    }, esperas[Math.min(s.nAuto, esperas.length - 1)])
  }

  /** Dónde quiere el gesto el contenido (en pasos) para la fracción f; también da la fase. */
  const objetivo = (s, f) => {
    const { umbral: X, zonaMuerta } = op.current
    const zm = Math.min(zonaMuerta, X * DESLIZAR.inicio * 0.6)
    if (s.pegado !== 0) {
      // Pegado al vecino: casi quieto, con un tirón suave hacia donde va el dedo (goma si no hay más).
      const d = (f + s.pegado * DESLIZAR.iman) * X // px desde el punto del imán (signo: hacia «siguiente»)
      const dir = Math.sign(d)
      const px = op.current.puede(dir) ? tiron(Math.abs(d), X) : goma(Math.abs(d), 0, X)
      return { fase: 'pegado', valor: (dir * px) / X }
    }
    const dir = Math.sign(f)
    const r = Math.abs(f) * X
    if (dir === 0 || r <= zm) return { fase: 'quieto', valor: 0 }
    if (!op.current.puede(dir)) return { fase: 'goma', valor: (dir * goma(r, zm, X)) / X }
    const sigue = s.sigue === dir ? r >= X * DESLIZAR.sigueSale : r >= X * DESLIZAR.inicio
    s.sigue = sigue ? dir : 0
    if (sigue) return { fase: 'sigue', valor: f }
    return { fase: 'inicio', valor: (dir * resistencia(r, zm, X)) / X }
  }

  /** Recalcula la posición del contenido para el dedo en `d` (px hacia «siguiente»). */
  const colocar = (s, d) => {
    if (d !== null) s.d = d
    const X = op.current.umbral
    let f = (s.d - s.ancla) / X
    let resorte = null
    // Imán y su histéresis (puede encadenar varios en un movimiento grande con `cadena`).
    for (let vueltas = 0; vueltas < 20; vueltas++) {
      if (s.pegado !== 0 && f * s.pegado < DESLIZAR.vuelve - 1) {
        // Regresó por debajo del 40 %: vuelve al anterior.
        const dir = -s.pegado
        pasar(s, dir)
        s.ancla += dir * X
        s.pegado = 0
        s.sigue = 0
        pararAuto(s)
        s.nAuto = 0
        resorte = RESORTE.pantalla
      } else if (s.pegado !== 0 && op.current.cadena && f * s.pegado >= 0) {
        s.pegado = 0 // cruzó el puntito: desde aquí, curva nueva hacia el siguiente
        s.sigue = 0
      } else if (s.pegado === 0 && Math.abs(f) >= DESLIZAR.iman && op.current.puede(Math.sign(f))) {
        const dir = Math.sign(f)
        pasar(s, dir)
        s.ancla += dir * X
        s.pegado = dir
        s.sigue = 0
        resorte = RESORTE.pantalla
      } else break
      f = (s.d - s.ancla) / X
    }
    const { fase, valor } = objetivo(s, f)
    if (fase !== 'quieto' && fase !== 'goma') s.movido = true
    if (Math.abs(s.d) > op.current.zonaMuerta) s.movido = true
    // Cambio de fase: lo que separa la posición vista de la nueva queda en `resto` y se asienta.
    if (fase !== s.fase && !resorte) resorte = fase === 'sigue' ? RESORTE.pulsar : RESORTE.pantalla
    s.fase = fase
    const visto = v.current.dedo + v.current.resto
    v.current.dedo = valor
    if (resorte) {
      v.current.resto = visto - valor
      asentar(resorte)
    }
    emitir()
    // Avance continuo con el dedo más allá del 95 %.
    const lejos = fase === 'pegado' && !op.current.cadena && op.current.continuo && f * s.pegado >= DESLIZAR.continuoDesde - 1
    if (lejos && !s.auto) programarAuto(s)
    else if (!lejos && s.auto) {
      pararAuto(s)
      s.nAuto = 0
    }
  }

  const posicion = (e) => (op.current.sentido < 0 ? -e.clientX : e.clientX)

  const onPointerDown = (e) => {
    ultimoMovido.current = false
    if (!op.current.activo || (e.pointerType === 'mouse' && e.button !== 0)) return
    pararAuto(g.current)
    op.current.alEmpezar?.(e)
    // Si aún se estaba asentando, lo que falte sigue asentándose; el dedo empieza en 0.
    v.current.resto += v.current.dedo
    v.current.dedo = 0
    if (v.current.resto !== 0) asentar()
    g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, d0: posicion(e), d: 0, ancla: 0, k: 0, pegado: 0, sigue: 0, fase: 'quieto', auto: null, nAuto: 0, decidido: !op.current.eje, movido: false, muestras: [{ t: e.timeStamp, d: 0 }] }
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
    colocar(s, d)
  }

  const terminar = (e, cancelado = false) => {
    const s = g.current
    if (!s || s.id !== e.pointerId) return
    g.current = null
    pararAuto(s)
    ultimoMovido.current = s.movido || s.k !== 0
    if (!s.decidido) return
    const { umbral: X, zonaMuerta } = op.current
    const m = s.muestras
    const ultimo = m[m.length - 1]
    const previo = m.find((q) => ultimo.t - q.t <= 100) ?? m[0]
    const vel = ultimo.t > previo.t ? (ultimo.d - previo.d) / (ultimo.t - previo.t) : 0 // px/ms hacia «siguiente»
    const rel = s.d - s.ancla
    const dir = Math.sign(rel)
    // Gesto rápido: soltar con velocidad (aún sin pegar) también pasa uno.
    const rapido = !cancelado && op.current.rapido && s.pegado === 0 && s.k === 0 && Math.abs(rel) > zonaMuerta && Math.sign(vel) === dir && Math.abs(vel) >= DESLIZAR.velocidad && op.current.puede(dir)
    const visto = v.current.dedo + v.current.resto
    v.current.dedo = 0
    v.current.resto = visto
    if (rapido) {
      op.current.onPaso(dir)
      v.current.resto -= dir
    }
    emitir()
    // Si el contenido seguía al dedo, hereda su velocidad.
    asentar(RESORTE.pantalla, !cancelado && s.fase === 'sigue' ? (vel / X) * 1000 : 0)
  }

  // Al desmontar, que no quede un avance continuo programado.
  useEffect(() => () => pararAuto(g.current), [])

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
 * Resistencia de inicio (px que se mueve el contenido) con el dedo a `r` px: 0 en la zona muerta y,
 * hasta el 30 % de X, una curva que se aplana (cada vez más dura) hasta DESLIZAR.resistencia × X.
 */
export function resistencia(r, zm, X) {
  if (r <= zm) return 0
  const u = Math.min(1, (r - zm) / (X * DESLIZAR.inicio - zm))
  return X * DESLIZAR.resistencia * (1 - (1 - u) * (1 - u))
}

/** Tirón cuando ya está pegado al vecino: se nota el dedo, pero apenas (satura en la resistencia). */
export function tiron(px, X) {
  const max = X * DESLIZAR.resistencia
  return max * (px / (px + X * 0.3))
}

/** Resistencia tipo goma cuando no se puede pasar: se mueve poco y cada vez menos. */
export function goma(r, zm, X) {
  if (r <= zm) return 0
  const e = (r - zm) * DESLIZAR.goma
  const max = X * 0.25
  return e / (1 + e / max)
}
