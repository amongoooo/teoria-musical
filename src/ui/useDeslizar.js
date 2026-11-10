import { animate, useMotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'
import { DESLIZAR, RESORTE } from './movimiento.js'

/**
 * Gesto de deslizar con las reglas de la app (skill de diseño, sección 3b «Gestos»).
 * X = `umbral` (px). F = desplazamiento del dedo desde donde se apoyó, en fracciones de X.
 *
 *  1. Zona muerta REAL (`zonaMuerta` px): ahí no se mueve nada.
 *  2. Resistencia de inicio fuerte: hasta el 30 % de X el contenido casi no se mueve
 *     (como mucho `DESLIZAR.resistencia` × X, cada vez más duro).
 *  3. Al pasar el 30 %: alcanza la posición exacta del dedo con un resorte rápido (RESORTE.pulsar)
 *     y lo sigue 1:1.
 *  4. Imán al 50 %, SIN soltar y sin histéresis: por encima del 50 % se pega al vecino
 *     (RESORTE.pantalla) y ese pasa a ser el actual; si el dedo vuelve por debajo del 50 %, se pega
 *     otra vez al de antes. Pegado, apenas se mueve (un tirón suave hacia el dedo).
 *  5. Avance continuo (`continuo`): ya pegado al vecino, con el dedo a partir del 75 % pasa isla por
 *     isla sola; la espera depende de dónde esté el dedo (DESLIZAR.continuo: 75 % → 1000 ms …
 *     98 % → 250 ms). Para al soltar, al bajar del 75 % o en el extremo.
 *  6. Soltar antes del 50 % (sin haberse pegado): vuelve a su sitio. Gesto rápido: pasa uno.
 *  7. Sin vecino: resistencia tipo goma.
 *  8. Tope de velocidad: el contenido nunca va más rápido que DESLIZAR.velocidadMax (px/ms), ni
 *     siguiendo al dedo ni con los resortes.
 *  9. `eje`: si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll).
 *
 * `cadena` (barra de puntitos): el imán se repite entre cada par de puntitos (una isla por cada
 * puntito que se cruza, mismo 50 % en los dos sentidos) y no hay avance continuo.
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
  // Objetivo = dedo + resto. `dedo` es donde el gesto quiere el contenido; `resto` es lo que falta
  // por asentar (resorte hacia 0). `visto` es lo que se muestra: persigue al objetivo con tope de velocidad.
  const v = useRef({ dedo: 0, resto: 0, anim: null, visto: 0, t: null, raf: 0 })

  /**
   * Muestra `visto` y, si va por detrás del objetivo, lo hace avanzar fotograma a fotograma sin
   * pasar del tope de velocidad. (Las compensaciones de `cambiar` se muestran al instante.)
   */
  const emitir = () => {
    const s = v.current
    progreso.set(s.visto)
    if (s.raf || s.visto === s.dedo + s.resto) return
    const fotograma = (ts) => {
      const dt = s.t == null ? 1000 / 60 : Math.min(1000 / 60, ts - s.t) // como mucho un fotograma
      s.t = ts
      const objetivo = s.dedo + s.resto
      const max = (DESLIZAR.velocidadMax * dt) / op.current.umbral // pasos en este fotograma
      const dif = objetivo - s.visto
      s.visto = Math.abs(dif) <= max ? objetivo : s.visto + Math.sign(dif) * max
      progreso.set(s.visto)
      if (s.visto === objetivo) {
        s.raf = 0
        s.t = null
      } else s.raf = requestAnimationFrame(fotograma)
    }
    s.raf = requestAnimationFrame(fotograma)
  }

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

  /** Cambia de elemento: el índice cambia y el progreso (objetivo y lo visto) se compensa para no saltar. */
  const cambiar = (dir) => {
    op.current.onPaso(dir)
    v.current.resto -= dir
    v.current.visto -= dir
  }

  const pararAuto = (s) => {
    if (!s) return
    clearTimeout(s.auto)
    s.auto = null
    s.desde = null
  }

  /** Espera del avance continuo según dónde esté el dedo (null = fuera de la zona). */
  const espera = (a) => {
    let ms = null
    for (const [desde, t] of DESLIZAR.continuo) if (a >= desde) ms = t
    return ms
  }

  /** Programa (o reprograma, si cambió la zona) el próximo paso automático. */
  const programarAuto = (s, ms) => {
    clearTimeout(s.auto)
    s.auto = setTimeout(() => {
      if (g.current !== s) return
      const dir = s.off
      if (!op.current.puede(dir)) return pararAuto(s) // extremo: goma
      s.movido = true
      cambiar(dir)
      s.k += dir
      asentar(RESORTE.pantalla) // cada paso automático se anima con resorte
      emitir() // en este mismo instante, para que no se vea ni un fotograma adelantado
      s.desde = performance.now()
      const sig = espera(Math.abs(s.F))
      if (sig) programarAuto(s, sig)
      else pararAuto(s)
    }, Math.max(0, s.desde + ms - performance.now()))
  }

  /** Dónde quiere el gesto el contenido (en pasos) y en qué fase está. */
  const objetivo = (s) => {
    const { umbral: X, zonaMuerta, cadena } = op.current
    const zm = Math.min(zonaMuerta, X * DESLIZAR.inicio * 0.6)
    const gr = s.F - s.off // posición del dedo respecto al elemento actual
    // Pegado: llegó por el imán y el dedo aún no ha cruzado su centro (o, en el carrusel, ya pasó uno).
    const pegado = (!cadena && s.off !== 0) || (s.llegada !== 0 && gr * s.llegada <= 0)
    const dir = Math.sign(gr)
    if (pegado) {
      const px = Math.abs(gr) * X
      const tir = op.current.puede(dir) ? tiron(px, X) : goma(px, 0, X)
      return { fase: 'pegado', valor: (dir * tir) / X }
    }
    const r = Math.abs(gr) * X
    if (dir === 0 || r <= zm) return { fase: 'quieto', valor: 0 }
    if (!op.current.puede(dir)) return { fase: 'goma', valor: (dir * goma(r, zm, X)) / X }
    const sigue = s.sigue === dir ? r >= X * DESLIZAR.sigueSale : r >= X * DESLIZAR.inicio
    s.sigue = sigue ? dir : 0
    if (sigue) return { fase: 'sigue', valor: gr }
    return { fase: 'inicio', valor: (dir * resistencia(r, zm, X)) / X }
  }

  /** Recalcula todo para el dedo en `d` (px hacia «siguiente» desde donde se apoyó). */
  const colocar = (s, d) => {
    const { umbral: X, cadena } = op.current
    s.F = d / X
    let resorte = null
    // Imán al 50 %, igual en los dos sentidos (en el carrusel, como mucho un vecino; en la barra, encadenado).
    for (let vueltas = 0; vueltas < 30; vueltas++) {
      const gr = s.F - s.off
      const dir = gr >= DESLIZAR.iman ? 1 : gr <= -DESLIZAR.iman ? -1 : 0
      if (!dir || (!cadena && Math.abs(s.off + dir) > 1) || !op.current.puede(dir)) break
      cambiar(dir)
      s.k += dir
      s.off += dir
      s.llegada = dir
      s.sigue = 0
      resorte = RESORTE.pantalla
    }
    const { fase, valor } = objetivo(s)
    if (fase !== 'quieto' && fase !== 'goma') s.movido = true
    if (Math.abs(d) > op.current.zonaMuerta) s.movido = true
    // Cambio de fase: lo que separa el objetivo anterior del nuevo queda en `resto` y se asienta.
    if (fase !== s.fase && !resorte) resorte = fase === 'sigue' ? RESORTE.pulsar : RESORTE.pantalla
    s.fase = fase
    const antes = v.current.dedo + v.current.resto
    v.current.dedo = valor
    if (resorte) {
      v.current.resto = antes - valor
      asentar(resorte)
    }
    emitir()
    // Avance continuo: pegado al vecino y con el dedo a partir del 75 % en esa dirección.
    const ms = !cadena && op.current.continuo && s.off !== 0 && Math.sign(s.F) === s.off ? espera(Math.abs(s.F)) : null
    if (!ms) pararAuto(s)
    else if (ms !== s.ms || !s.auto) {
      if (s.desde == null) s.desde = performance.now()
      programarAuto(s, ms)
    }
    s.ms = ms
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
    g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, d0: posicion(e), d: 0, F: 0, off: 0, llegada: 0, k: 0, sigue: 0, fase: 'quieto', auto: null, desde: null, ms: null, decidido: !op.current.eje, movido: false, muestras: [{ t: e.timeStamp, d: 0 }] }
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
    s.d = d
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
    const dir = Math.sign(s.d)
    // Gesto rápido: soltar con velocidad (aún sin haber pasado ninguno) también pasa uno.
    const rapido = !cancelado && op.current.rapido && s.k === 0 && s.llegada === 0 && Math.abs(s.d) > zonaMuerta && Math.sign(vel) === dir && Math.abs(vel) >= DESLIZAR.velocidad && op.current.puede(dir)
    v.current.resto += v.current.dedo
    v.current.dedo = 0
    if (rapido) cambiar(dir)
    emitir()
    // Si el contenido seguía al dedo, hereda su velocidad (el tope la limita igualmente).
    asentar(RESORTE.pantalla, !cancelado && s.fase === 'sigue' ? (vel / X) * 1000 : 0)
  }

  // Al desmontar, que no quede nada programado.
  useEffect(
    () => () => {
      pararAuto(g.current)
      cancelAnimationFrame(v.current.raf)
    },
    [],
  )

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

/** Tirón cuando está pegado por el imán: se nota el dedo, pero apenas (satura en la resistencia). */
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
