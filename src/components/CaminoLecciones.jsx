import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { estadoLeccion, getLeccion, leccionAnterior } from '../content/index.js'
import { guardarReto, reiniciarLeccion } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { claro, oscuro, tinta } from '../ui/color.js'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useDeslizar from '../ui/useDeslizar.js'
import Hoja from '../ui/Hoja.jsx'
import NavegadorModulos from './NavegadorModulos.jsx'

const ISLA = 80 // diámetro de cada isla (px)
const INSIGNIA = 72 // cuadrado con el número del módulo, al inicio del camino
const FILA = 196 // separación vertical entre islas en el celular
const ETIQUETA = 168 // ancho máximo del título de cada isla
const ONDA = 26 // ondulación del camino horizontal
const PUNTO = 16 // diámetro del puntito de la isla actual (los demás, la mitad)
// Isla abierta = «isla + bocadillo»: la isla crece hasta BOLA (con su aro de avance) y debajo
// cuelga un globo con la información. El centro de la bola queda en el punto del camino.
const BOLA = 112 // diámetro de la isla abierta
// «Tilt» al chocar con un extremo (isla abierta) o al arrastrar la barra de puntitos (px, grados, ms).
// En la barra, el tilt y el desplazamiento lateral dependen de lo lejos del centro que esté el dedo
// (f = −1 borde izquierdo … 0 centro … +1 borde derecho); el desplazamiento vertical es siempre igual.
// `minimo`: lo que queda del desplazamiento lateral en el centro (para que también ahí se note).
const TILT = { x: 12, grados: 3, vuelve: 250, barra: { x: 10, y: 8, grados: 3, minimo: 0.35 } }
const BARRA_ALTO = 124 // alto de la zona de la barra de puntitos (con su desvanecido): la isla abierta queda por encima
const ARO = 16 // el aro de avance sobresale de la bola
const SEPARA = 30 // de la bola al globo (deja sitio al labio y al piquito)
const ALTO_ESTIMADO = BOLA + SEPARA + 210 // alto de bola + globo hasta medirlo
const Y_ANCHO = 124 // altura del centro de la isla abierta en pantallas anchas

const lerp = (a, b, t) => a + (b - a) * t
const limitar = (v, a, b) => Math.min(b, Math.max(a, v))
/** Curva suave de 0 a 1 entre `a` y `b`. */
const suave = (v, a, b) => {
  const t = limitar((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
// Según lo abierta que está una isla (o, 0–1): primero el disco grande tapa a la pequeña
// (que sigue opaca debajo), después aparece su contenido. Nada de círculos translúcidos encima.
const opacidadDisco = (o) => suave(o, 0.12, 0.32)
const opacidadContenido = (o) => suave(o, 0.45, 0.85)
const opacidadChica = (o) => 1 - suave(o, 0.3, 0.36)
const opacidadTitulo = (o) => 1 - suave(o, 0, 0.25)
/** Rebote al final (las islas se despliegan desde la insignia y se pasan un poco de su sitio). */
const rebote = (t) => {
  const c = 1.4
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}
// Despliegue al entrar al módulo: cada isla sale de la insignia, una tras otra.
const DESPLIEGUE = { espera: 0.12, entre: 0.07, dura: 0.5 }

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)

/** Retos del módulo: el reto del módulo (clave `M<número>`) y el reto de FL de cada lección que ya existe. */
export function retosDelModulo(modulo, progreso) {
  const lista = [{ clave: `M${modulo.numero}`, titulo: 'Reto del módulo', texto: modulo.reto, hecho: Boolean(progreso.retos[`M${modulo.numero}`]?.hecho) }]
  for (const l of modulo.lecciones) {
    const reto = getLeccion(l.id)?.pasos.find((p) => p.tipo === 'reto')
    if (!reto) continue
    lista.push({ clave: l.id, leccion: l, titulo: mayuscula(reto.titulo.replace(/^Reto en FL Studio:\s*/i, '')), texto: reto.objetivo, hecho: Boolean(progreso.retos[l.id]?.hecho) })
  }
  return lista
}

/**
 * Camino de lecciones en forma de islas.
 *  - Celular (< 560 px): vertical en zigzag. Pantallas anchas: horizontal y ondulado.
 *  - Empieza con un cuadrado con el número del módulo.
 *  - Al tocar una isla, crece (BOLA) y debajo sale un globo con su información y botones;
 *    las demás se apartan. Se cierra con ✕, tocando fuera o con Escape.
 *  - Con una isla abierta funciona como un CARRUSEL CONTINUO: la posición es un número real
 *    `p` (índice de la isla abierta + arrastre). Cada isla se coloca interpolando entre las
 *    disposiciones calculadas para «abierta = floor(p)» y «abierta = ceil(p)», y crece según lo
 *    cerca que esté de p. Deslizar de lado (useDeslizar, reglas de la skill) o arrastrar por la
 *    barra de puntitos de abajo mueve p; al soltar todo se asienta con resortes.
 *  - Las posiciones se escriben directamente en el DOM (sin re-render) en cada fotograma.
 */
export default function CaminoLecciones({ modulo, progreso, onAbierta }) {
  const ref = useRef(null)
  const ancho = useAncho(ref)
  const lecciones = modulo.lecciones
  // Islas del camino: las lecciones y, al final (lado opuesto a la insignia), la isla de Retos.
  const islasMeta = [...lecciones, { id: 'retos', titulo: 'Retos', esRetos: true }]
  const n = islasMeta.length
  const retos = retosDelModulo(modulo, progreso)
  const retosHechos = retos.filter((r) => r.hecho).length
  const moduloCompleto = lecciones.every((l) => progreso.lecciones[l.id]?.completada)
  const estados = [...lecciones.map((l) => estadoLeccion(l.id, progreso)), retosHechos === retos.length ? 'hecha' : 'retos']
  const actual = estados.findIndex((e) => e === 'nueva' || e === 'empezada')
  const [verModulos, setVerModulos] = useState(false)
  const [verRetos, setVerRetos] = useState(false)
  const vertical = ancho < 560
  const grande = vertical ? Math.min(ancho - 24, 340) : 320 // ancho del globo
  const [altos, setAltos] = useState({}) // alto real (bola + globo) de cada isla abierta, medido
  const X = vertical ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho
  const reducir = useReducedMotion()
  const resorte = reducir ? { duration: 0 } : RESORTE.pantalla

  const [abierta, setAbierta] = useState(null)
  const abiertaRef = useRef(null) // isla abierta (destino) o null
  const base = useMotionValue(0) // índice continuo de la isla abierta, sin contar el arrastre
  const apertura = useMotionValue(0) // 0 = camino cerrado, 1 = una isla abierta
  const despliegue = useMotionValue(0) // segundos desde que empezó el despliegue inicial

  // Disposición del camino cerrado y con cada isla abierta.
  const layouts = useMemo(
    () =>
      ancho
        ? {
            cerrado: calcular({ ancho, vertical, n, abierta: null, grande }),
            abiertas: Array.from({ length: n }, (_, j) => calcular({ ancho, vertical, n, abierta: j, grande, alto: altos[j] ?? ALTO_ESTIMADO })),
          }
        : null,
    [ancho, vertical, n, grande, altos],
  )

  // Elementos que se mueven a mano en cada fotograma.
  const els = useRef({ nodo: [], escala: [], chica: [], grande: [], inclina: [], etiqueta: [], gris: [], color: [], punto: [] }).current
  const finDespliegue = DESPLIEGUE.espera + (n - 1) * DESPLIEGUE.entre + DESPLIEGUE.dura
  const guardar = (tipo, i) => (el) => (els[tipo][i] = el)

  // En el celular, al cambiar de isla, la página se desplaza para que la isla abierta quede
  // donde estaba la anterior (las islas pasan por el mismo sitio de la pantalla).
  const ancla = useRef(null)
  const ultimaP = useRef(null)
  const posicion = () => base.get() + islas.progreso.get() + puntos.progreso.get()
  const fijarAncla = () => {
    if (!vertical || !layouts || abiertaRef.current === null || !ref.current) return (ancla.current = null)
    ancla.current = ref.current.getBoundingClientRect().top + focoY(layouts, posicion(), n)
  }

  const irA = (i) => {
    if (i < 0 || i >= n) return
    const antes = abiertaRef.current
    if (i === antes) return
    abiertaRef.current = i
    setAbierta(i)
    if (antes === null) {
      base.jump(i)
      animate(apertura, 1, resorte)
    } else {
      fijarAncla()
      animate(base, i, resorte)
    }
  }
  const cerrar = () => {
    abiertaRef.current = null
    setAbierta(null)
    animate(apertura, 0, resorte)
  }

  // Al pasar con un gesto: el índice cambia de golpe y useDeslizar compensa su progreso.
  const paso = (dir) => {
    const a = abiertaRef.current
    const sig = a + dir
    const desfase = base.get() - a // por si aún se movía hacia otra isla (p. ej. tras tocar un puntito)
    abiertaRef.current = sig
    setAbierta(sig)
    base.jump(sig + desfase)
    if (Math.abs(desfase) > 0.001) animate(base, sig, resorte)
  }
  const puede = (dir) => abiertaRef.current !== null && abiertaRef.current + dir >= 0 && abiertaRef.current + dir < n

  useEffect(() => onAbierta?.(abierta !== null), [abierta, onAbierta])

  // En los extremos (no hay más islas) la isla abierta no se mueve: hace un pequeño «tilt» y un
  // desplazamiento corto hacia donde va el dedo, y a los 0,25 s vuelve a su sitio con un resorte.
  const tilt = useRef(null)
  const inclinar = (lado) => {
    const el = els.inclina[abiertaRef.current]
    if (!el || reducir) return
    clearTimeout(tilt.current)
    animate(el, { x: lado * TILT.x, rotate: lado * TILT.grados }, RESORTE.pulsar)
    tilt.current = setTimeout(() => animate(el, { x: 0, rotate: 0 }, RESORTE.suave), TILT.vuelve)
  }
  useEffect(() => () => clearTimeout(tilt.current), [])

  // La barra de puntitos tampoco se mueve: al arrastrar sobre ella hacia arriba/abajo (o de lado cuando
  // ya no hay más islas) hace el mismo «tilt» + desplazamiento corto hacia el dedo y vuelve a los 0,25 s.
  const pildora = useRef(null)
  const tiltBarra = useRef(null)
  const dedoBarra = useRef(null) // última x del dedo sobre la barra
  /** −1 (borde izquierdo de la barra) … 0 (centro) … +1 (borde derecho), según la x del dedo. */
  const lejosDelCentro = (x) => {
    const r = pildora.current?.getBoundingClientRect()
    if (!r || x == null) return 0
    return limitar((x - (r.left + r.width / 2)) / (r.width / 2), -1, 1)
  }
  const inclinarBarra = ({ x = 0, y = 0, rotate = 0 }) => {
    const el = pildora.current
    if (!el || reducir) return
    clearTimeout(tiltBarra.current)
    animate(el, { x, y, rotate }, RESORTE.pulsar)
    tiltBarra.current = setTimeout(() => animate(el, { x: 0, y: 0, rotate: 0 }, RESORTE.suave), TILT.vuelve)
  }
  useEffect(() => () => clearTimeout(tiltBarra.current), [])

  const islas = useDeslizar({ activo: abierta !== null, umbral: X, onPaso: paso, puede, alEmpezar: fijarAncla, alTope: inclinar })
  const puntos = useDeslizar({
    activo: abierta !== null,
    umbral: DESLIZAR.puntitos.separacion,
    zonaMuerta: DESLIZAR.puntitos.zonaMuerta,
    veloz: DESLIZAR.puntitos.veloz,
    sentido: 1, // por la barra, arrastrar a la derecha va a la siguiente
    cadena: true, // una isla por cada puntito que se cruza, sin avance continuo
    rapido: false,
    eje: false,
    onPaso: paso,
    puede,
    // Contra un extremo: se empuja hacia el dedo; cuanto más lejos del centro, más se inclina y se desplaza.
    alTope: (lado) => {
      const f = Math.abs(lejosDelCentro(dedoBarra.current))
      const peso = TILT.barra.minimo + (1 - TILT.barra.minimo) * f
      inclinarBarra({ x: lado * TILT.barra.x * peso, rotate: lado * TILT.barra.grados * f })
    },
    // Se mide desde el centro del puntito tocado: la isla es siempre la del puntito más cercano al dedo.
    origen: (e) => centroPunto(els.punto, puntoMasCercano(els.punto, e.clientX)),
    alEmpezar: (e) => {
      // Tocar un puntito va directo a esa isla; el arrastre empieza desde ahí.
      const j = puntoMasCercano(els.punto, e.clientX)
      if (j !== null) irA(j)
      fijarAncla()
    },
  })

  /** Coloca cada isla, camino, título y puntito según la posición continua. */
  const actualizar = () => {
    const L = layouts
    const cont = ref.current
    if (!L || !cont) return
    const a = apertura.get()
    const p = posicion()
    const pc = limitar(p, 0, n - 1)
    const fuera = p - pc // goma en los extremos: todo se desplaza un poco
    const i = Math.floor(pc)
    const j = Math.min(i + 1, n - 1)
    const f = pc - i
    const A = L.abiertas[i]
    const B = L.abiertas[j]
    const C = L.cerrado
    const pos = []
    const td = despliegue.get()
    for (let m = 0; m <= n; m++) {
      const lo = A.nodos[m]
      const hi = B.nodos[m]
      const c = C.nodos[m]
      const li = m - 1 // índice de lección (‑1 = insignia)
      const cerca = m === 0 ? 0 : Math.max(0, 1 - Math.abs(pc - li)) // 1 = es la isla de p
      const o = a * cerca // cuánto está abierta esta isla
      let ox = lerp(lo.x, hi.x, f) - fuera * X
      // En vertical, la que se va sale un poco hacia el lado del dedo y la que llega entra por el otro.
      if (vertical && m > 0) ox -= (pc - li) * cerca * ancho * 0.5
      let x = lerp(c.x, ox, a)
      let y = lerp(c.y, lerp(lo.y, hi.y, f), a)
      const esc = lerp(c.escala, lerp(lo.escala, hi.escala, f), a)
      // Despliegue inicial: la isla sale de la insignia (nodo 0) y llega a su sitio con un rebote.
      const sale = m === 0 ? 1 : limitar((td - DESPLIEGUE.espera - (m - 1) * DESPLIEGUE.entre) / DESPLIEGUE.dura, 0, 1)
      const dsp = m === 0 ? 1 : rebote(sale)
      if (m > 0 && sale < 1) {
        x = lerp(pos[0].x, x, dsp)
        y = lerp(pos[0].y, y, dsp)
      }
      pos.push({ x, y })
      const nodo = els.nodo[m]
      if (nodo) {
        nodo.style.transform = `translate3d(${x}px, ${y}px, 0)`
        nodo.style.zIndex = o > 0.001 ? String(10 + Math.round(o * 10)) : ''
      }
      if (m === 0) {
        if (els.escala[0]) els.escala[0].style.transform = `scale(${esc})`
        continue
      }
      const tam = lerp(esc, BOLA / ISLA, o) // escala de la isla pequeña (crece hasta el tamaño de la bola)
      const chica = els.chica[li]
      if (chica) {
        chica.style.transform = `scale(${tam * lerp(0.3, 1, Math.max(0, dsp))})`
        chica.style.opacity = String(opacidadChica(o) * limitar(sale * 4, 0, 1))
        chica.inert = o >= 0.5
      }
      const gr = els.grande[li]
      if (gr) {
        gr.style.transform = `translate(-50%, ${-BOLA / 2}px) scale(${(tam * ISLA) / BOLA})`
        gr.style.opacity = String(opacidadDisco(o))
        gr.style.setProperty('--contenido', String(opacidadContenido(o)))
        gr.style.visibility = o > 0.002 ? 'visible' : 'hidden'
        gr.inert = o < 0.5
      }
      const et = els.etiqueta[li]
      if (et) {
        const conEtiqueta = lerp(c.etiqueta ? 1 : 0, lerp(lo.etiqueta ? 1 : 0, hi.etiqueta ? 1 : 0, f), a) * opacidadTitulo(o) * limitar(sale * 2 - 1, 0, 1)
        et.style.opacity = String(conEtiqueta)
        et.style.visibility = conEtiqueta > 0.01 ? 'visible' : 'hidden'
        et.style.width = `${lerp(c.anchoEtiqueta ?? ETIQUETA, lerp(lo.anchoEtiqueta ?? ETIQUETA, hi.anchoEtiqueta ?? ETIQUETA, f), a)}px`
      }
      const punto = els.punto[li]
      if (punto) punto.style.transform = `scale(${0.5 + 0.5 * cerca})`
    }
    cont.style.height = `${lerp(C.alto, lerp(A.alto, B.alto, f), a)}px`
    for (let s = 0; s < n; s++) {
      const d = curva(pos[s], pos[s + 1], vertical)
      if (els.gris[s]) els.gris[s].style.opacity = String(limitar((td - DESPLIEGUE.espera - s * DESPLIEGUE.entre) / DESPLIEGUE.dura * 3, 0, 1))
      els.gris[s]?.setAttribute('d', d)
      els.color[s]?.setAttribute('d', d)
    }
    // Celular: la isla abierta se queda en el mismo sitio de la pantalla mientras se cambia.
    if (vertical && ancla.current !== null && a > 0.999 && p !== ultimaP.current) {
      const dy = cont.getBoundingClientRect().top - (ancla.current - focoY(L, p, n))
      if (Math.abs(dy) > 0.5) window.scrollBy(0, dy)
    }
    ultimaP.current = p
    cont.dataset.posicion = p.toFixed(3) // posición continua del carrusel (útil para pruebas)
  }
  // Mide el alto real de cada isla abierta (bola + globo) para apartar lo justo a las de abajo.
  useLayoutEffect(() => {
    if (!ancho || typeof ResizeObserver === 'undefined') return
    const medir = () =>
      setAltos((prev) => {
        let cambio = false
        const sig = { ...prev }
        els.grande.forEach((el, i) => {
          const h = el?.offsetHeight
          if (h && Math.abs((prev[i] ?? 0) - h) > 1) {
            sig[i] = h
            cambio = true
          }
        })
        return cambio ? sig : prev
      })
    medir()
    const ro = new ResizeObserver(medir)
    els.grande.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [ancho, grande, n, els])

  const actualizarRef = useRef(actualizar)
  actualizarRef.current = actualizar
  useLayoutEffect(() => actualizar())
  useEffect(() => {
    const quitar = [base, apertura, despliegue, islas.progreso, puntos.progreso].map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [base, apertura, despliegue, islas.progreso, puntos.progreso])

  // Al entrar al módulo, las islas se despliegan desde la insignia (sin movimiento si se pide reducirlo).
  const desplegado = useRef(false)
  useEffect(() => {
    if (!ancho || desplegado.current) return
    desplegado.current = true
    if (reducir) despliegue.set(finDespliegue)
    else animate(despliegue, finDespliegue, { duration: finDespliegue, ease: 'linear' })
  }, [ancho, reducir, despliegue, finDespliegue])

  // Escape o tocar fuera de las islas y de la barra cierra la isla abierta; flechas: anterior / siguiente.
  // (Tras un arrastre, useDeslizar anula ese «click», así que deslizar no cierra.)
  const abiertaSiNo = abierta !== null
  const irARef = useRef(irA)
  irARef.current = irA
  const cerrarRef = useRef(cerrar)
  cerrarRef.current = cerrar
  useEffect(() => {
    if (!abiertaSiNo) return
    const tecla = (e) => {
      if (document.querySelector('[role=dialog]')) return // la hoja abierta se encarga
      if (e.key === 'Escape') cerrarRef.current()
      else if (e.key === 'ArrowRight') irARef.current(abiertaRef.current + 1)
      else if (e.key === 'ArrowLeft') irARef.current(abiertaRef.current - 1)
    }
    const fuera = (e) => !e.target.closest?.('[data-nodo], [role=dialog]') && cerrarRef.current()
    document.addEventListener('keydown', tecla)
    document.addEventListener('click', fuera)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('click', fuera)
    }
  }, [abiertaSiNo])

  // Primera aparición: entrada escalonada; después, solo se mueven.
  const [montado, setMontado] = useState(false)
  useEffect(() => {
    if (!ancho) return
    const t = setTimeout(() => setMontado(true), 600)
    return () => clearTimeout(t)
  }, [ancho])

  // Al abrir una isla o pasar a otra, que la isla y su globo queden a la vista (por encima de la barra
  // de puntitos). Si el dedo sigue apoyado (aún deslizando), espera a que se suelte.
  const dedo = useRef(false)
  useEffect(() => {
    const abajo = () => (dedo.current = true)
    const arriba = () => (dedo.current = false)
    window.addEventListener('pointerdown', abajo, true)
    window.addEventListener('pointerup', arriba, true)
    window.addEventListener('pointercancel', arriba, true)
    return () => {
      window.removeEventListener('pointerdown', abajo, true)
      window.removeEventListener('pointerup', arriba, true)
      window.removeEventListener('pointercancel', arriba, true)
    }
  }, [])
  useEffect(() => {
    if (abierta === null) return
    let t
    const revisar = () => {
      if (dedo.current) return (t = setTimeout(revisar, 150))
      const r = els.grande[abiertaRef.current]?.getBoundingClientRect()
      if (!r) return
      const arriba = r.top - ARO - 8
      const abajo = r.bottom - (window.innerHeight - BARRA_ALTO)
      const dy = arriba < 0 ? arriba : abajo > 0 ? Math.min(abajo, arriba) : 0
      if (Math.abs(dy) > 4) window.scrollBy({ top: dy, behavior: reducir ? 'auto' : 'smooth' })
    }
    t = setTimeout(revisar, 300)
    return () => clearTimeout(t)
  }, [abierta, els, reducir])

  const entrada = (indice) => ({
    initial: { scale: 0.6, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { ...RESORTE.suave, opacity: { duration: 0.2 }, delay: montado ? 0 : 0.05 + indice * 0.06 },
  })

  return (
    <>
      <div ref={ref} className="relative w-full select-none" style={{ height: ancho ? undefined : FILA * n, touchAction: 'pan-y' }} {...islas.handlers}>
        {ancho > 0 && (
          <>
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width="100%" height="100%" aria-hidden>
              {islasMeta.map((l, s) => (
                <g key={l.id}>
                  <path ref={guardar('gris', s)} fill="none" stroke="var(--color-zinc-200)" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 14" style={{ opacity: 0 }} />
                  {(l.esRetos ? moduloCompleto : estados[s] !== 'bloqueada' && estados[s] !== 'proximamente') && (
                    <motion.path
                      ref={guardar('color', s)}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ ...RESORTE.suave, delay: montado ? 0 : DESPLIEGUE.espera + s * DESPLIEGUE.entre + 0.2 }}
                      fill="none"
                      stroke={modulo.acento}
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Insignia del módulo */}
            <div ref={guardar('nodo', 0)} data-nodo className="absolute left-0 top-0 size-0">
              <motion.div {...entrada(0)}>
                <div ref={guardar('escala', 0)} className="absolute left-0 top-0">
                  <Pulsable
                    onClick={() => {
                      cerrar()
                      setVerModulos(true)
                    }}
                    aria-label={`Módulo ${modulo.numero}. Ver los demás módulos`}
                    aria-haspopup="dialog"
                    className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl text-3xl font-bold text-blanco"
                    style={{ width: INSIGNIA, height: INSIGNIA, backgroundColor: oscuro(modulo.acento), boxShadow: `0 6px 0 ${labio(modulo.acento)}` }}
                  >
                    {modulo.numero}
                  </Pulsable>
                </div>
              </motion.div>
            </div>

            {islasMeta.map((l, i) => {
              const estado = estados[i]
              const p = progreso.lecciones[l.id]
              const contenido = getLeccion(l.id)
              const texto = l.esRetos ? `${retosHechos}/${retos.length} hechos` : textoEstado(estado, p, contenido)
              return (
                <div key={l.id} ref={guardar('nodo', i + 1)} data-nodo className="absolute left-0 top-0 size-0">
                  <div>
                    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                      <div ref={guardar('chica', i)} style={{ opacity: 0 }}>
                        {l.esRetos ? (
                          <IslaRetos acento={modulo.acento} completo={estado === 'hecha'} descripcion={texto} onClick={() => irA(i)} />
                        ) : (
                        <Isla
                          leccion={l}
                          estado={estado}
                          esActual={i === actual}
                          avance={estado === 'empezada' && contenido ? p.paso / contenido.pasos.length : 0}
                          acento={modulo.acento}
                          descripcion={texto}
                          onClick={() => irA(i)}
                        />
                        )}
                      </div>
                      <span
                        ref={guardar('etiqueta', i)}
                        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center rounded-xl bg-fondo px-2 py-0.5"
                        style={{ opacity: 0, ...(vertical ? { top: ISLA + 12 } : { bottom: ISLA + 10 }) }}
                      >
                        <span className={`line-clamp-2 text-center text-base font-semibold leading-snug ${estado === 'bloqueada' || estado === 'proximamente' ? 'text-zinc-500' : 'text-zinc-900'}`}>{l.titulo}</span>
                        {vertical && (
                          <span className={`text-center text-sm font-semibold ${i === actual ? '' : 'text-zinc-500'}`} style={i === actual ? { color: tinta(modulo.acento) } : undefined}>
                            {texto}
                          </span>
                        )}
                      </span>
                    </div>
                    <div ref={guardar('grande', i)} className="absolute left-0 top-0" style={{ visibility: 'hidden', opacity: 0, width: grande, transformOrigin: `50% ${BOLA / 2}px` }}>
                      <div ref={guardar('inclina', i)} style={{ transformOrigin: `50% ${BOLA / 2}px` }}>
                        {l.esRetos ? (
                          <RetosAbierta modulo={modulo} retos={retos} hechos={retosHechos} onCerrar={cerrar} onVer={() => setVerRetos(true)} />
                        ) : (
                          <IslaAbierta meta={l} modulo={modulo} progreso={progreso} indice={i} total={n} onCerrar={cerrar} onIr={irA} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {abierta !== null && (
            <BarraPuntitos
              key="puntitos"
              lecciones={islasMeta}
              estados={estados}
              abierta={abierta}
              acento={modulo.acento}
              guardar={guardar}
              handlers={puntos.handlers}
              onIr={irA}
              pildora={pildora}
              dedo={dedoBarra}
              // Arriba/abajo: siempre se desplaza igual; se inclina hacia el lado del dedo, proporcional a su
              // distancia al centro de la barra (en el centro solo baja o sube, sin inclinarse).
              onVertical={(dy, x) => inclinarBarra({ y: Math.sign(dy) * TILT.barra.y, rotate: lejosDelCentro(x) * Math.sign(dy) * TILT.barra.grados })}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
      <NavegadorModulos abierta={verModulos} onCerrar={() => setVerModulos(false)} actual={modulo.numero} />
      <HojaRetos abierta={verRetos} onCerrar={() => setVerRetos(false)} modulo={modulo} retos={retos} progreso={progreso} />
    </>
  )
}

/**
 * Barra de puntitos (uno por lección) fija abajo mientras hay una isla abierta. Sube con un
 * resorte y respeta la zona segura. Tocar un puntito va a esa isla; arrastrar por encima pasa
 * de isla en isla con las mismas reglas del swipe (una isla cada vez que se cruza un puntito).
 */
function BarraPuntitos({ lecciones, estados, abierta, acento, guardar, handlers, onIr, pildora, dedo, onVertical }) {
  const sep = DESLIZAR.puntitos.separacion
  // Arrastre vertical sobre la barra: avisa una vez por sentido (arriba / abajo) con la x del dedo,
  // para inclinarla hacia ese lado. Además guarda la x del dedo (tilt en los extremos).
  const vert = useRef(null)
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...resto } = handlers
  const fin = (e, f) => {
    vert.current = null
    f?.(e)
  }
  return (
    <motion.div
      data-nodo
      data-puntitos
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-12"
      // Lo que queda debajo de la barra se desvanece hacia el fondo (así se lee que es otra capa).
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', background: 'linear-gradient(to top, var(--color-fondo) 40%, color-mix(in oklab, var(--color-fondo) 70%, transparent) 70%, transparent)' }}
      initial={{ y: '120%' }}
      animate={{ y: 0 }}
      exit={{ y: '120%' }}
      transition={RESORTE.pantalla}
    >
      <div
        role="group"
        aria-label="Lecciones del módulo"
        ref={pildora}
        className="pointer-events-auto flex select-none items-center rounded-full border border-zinc-200 bg-white/95 px-3 shadow-sm backdrop-blur"
        style={{ touchAction: 'none' }}
        {...resto}
        onPointerDown={(e) => {
          vert.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dir: 0 }
          dedo.current = e.clientX
          onPointerDown?.(e)
        }}
        onPointerMove={(e) => {
          dedo.current = e.clientX
          onPointerMove?.(e)
          const v = vert.current
          if (!v || v.id !== e.pointerId) return
          const dx = e.clientX - v.x0
          const dy = e.clientY - v.y0
          const dir = Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0
          if (dir && dir !== v.dir) onVertical(dy, e.clientX)
          if (Math.abs(dy) < 6) v.dir = 0
          else if (dir) v.dir = dir
        }}
        onPointerUp={(e) => fin(e, onPointerUp)}
        onPointerCancel={(e) => fin(e, onPointerCancel)}
      >
        {lecciones.map((l, i) => {
          const hecha = estados[i] === 'hecha'
          // Islas aún no desbloqueadas (o sin contenido): puntito gris.
          const cerrada = estados[i] === 'bloqueada' || estados[i] === 'proximamente'
          return (
            <button
              key={l.id}
              type="button"
              data-punto={i}
              onClick={() => onIr(i)}
              aria-label={l.esRetos ? 'Retos del módulo' : `Lección ${l.id}: ${l.titulo}${hecha ? ' (completada)' : cerrada ? ' (bloqueada)' : ''}`}
              aria-current={i === abierta ? 'true' : undefined}
              className="grid h-14 place-items-center"
              style={{ width: sep }}
            >
              <span
                ref={guardar('punto', i)}
                className={`block ${l.esRetos ? 'rounded-[5px]' : 'rounded-full'}`}
                style={{
                  width: PUNTO,
                  height: PUNTO,
                  backgroundColor: cerrada ? 'var(--color-zinc-300)' : hecha ? oscuro(acento) : acento,
                  opacity: cerrada || hecha ? 1 : 0.35,
                  transform: `scale(${i === abierta ? 1 : 0.5})`,
                }}
              />
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

/** Índice del puntito más cercano a la x del dedo (o null si no hay barra). */
function puntoMasCercano(puntos, x) {
  let mejor = null
  let dist = Infinity
  puntos.forEach((el, i) => {
    if (!el) return
    const r = el.parentElement.getBoundingClientRect()
    const d = Math.abs(r.left + r.width / 2 - x)
    if (d < dist) {
      dist = d
      mejor = i
    }
  })
  return mejor
}

/** x del centro de la celda del puntito i (o null). */
function centroPunto(puntos, i) {
  const r = i == null ? null : puntos[i]?.parentElement.getBoundingClientRect()
  return r ? r.left + r.width / 2 : null
}

/** Curva del camino entre dos puntos (vertical: en S de arriba abajo; horizontal: de lado). */
function curva(a, b, vertical) {
  return vertical
    ? `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`
    : `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`
}

/** Altura (dentro del camino) del centro de la isla abierta para la posición continua p. */
function focoY(L, p, n) {
  const pc = limitar(p, 0, n - 1)
  const i = Math.floor(pc)
  const j = Math.min(i + 1, n - 1)
  return lerp(L.abiertas[i].nodos[i + 1].y, L.abiertas[j].nodos[j + 1].y, pc - i)
}

/** Posiciones de la insignia (nodo 0) y de cada isla, con o sin una isla abierta. */
function calcular({ ancho, vertical, n, abierta, grande, alto: altoAbierta = ALTO_ESTIMADO }) {
  const nodos = []
  if (!ancho) return { nodos: Array.from({ length: n + 1 }, () => ({ x: 0, y: 0, escala: 1 })), alto: 0 }

  if (vertical) {
    const amplitud = Math.max(0, Math.min(72, ancho / 2 - ETIQUETA / 2 - 4))
    nodos.push({ x: ancho / 2, y: INSIGNIA / 2 + 8, escala: 1 })
    const y0 = INSIGNIA + 8 + 56 + ISLA / 2
    // Centro de la bola abierta y cuánto bajan las islas siguientes para dejar sitio al globo.
    const yAbierta = abierta === null ? 0 : y0 + abierta * FILA + 10
    const finAbierta = yAbierta - BOLA / 2 + altoAbierta
    const extra = abierta === null ? 0 : Math.max(0, finAbierta + 36 - (y0 + (abierta + 1) * FILA - ISLA / 2))
    for (let i = 0; i < n; i++) {
      const base = y0 + i * FILA
      if (i === abierta) nodos.push({ x: ancho / 2, y: yAbierta, escala: 1 })
      else
        nodos.push({
          x: ancho / 2 + amplitud * Math.round(Math.sin(((i + 1) * Math.PI) / 2)),
          y: base + (abierta !== null && i > abierta ? extra : 0),
          escala: 1,
          etiqueta: 'abajo',
          anchoEtiqueta: ETIQUETA,
        })
    }
    const ultimo = nodos[nodos.length - 1]
    const alto = abierta === n - 1 ? finAbierta + 24 : ultimo.y + ISLA / 2 + 80
    return { nodos, alto }
  }

  // Horizontal
  const base = 52 + 16 + ISLA / 2 + ONDA
  if (abierta === null) {
    const col = ancho / (n + 1)
    nodos.push({ x: col / 2, y: base, escala: 1 })
    for (let i = 0; i < n; i++) {
      nodos.push({ x: col * (i + 1.5), y: base + (i % 2 ? ONDA : -ONDA), escala: 1, etiqueta: 'arriba', anchoEtiqueta: Math.min(ETIQUETA, col - 8) })
    }
    return { nodos, alto: base + ONDA + ISLA / 2 + 24 }
  }

  const cy = Y_ANCHO // la bola abierta y las islas de los lados, a la misma altura
  const alto = Math.max(base + ONDA + ISLA / 2 + 24, cy - BOLA / 2 + altoAbierta + 28)
  const hueco = 20
  const izq = abierta + 1 // insignia + lecciones antes de la abierta
  const der = n - 1 - abierta
  const finIzq = ancho / 2 - grande / 2 - hueco
  const iniDer = ancho / 2 + grande / 2 + hueco
  const lado = (j, cuenta, desde, hasta) => {
    const s = (hasta - desde) / cuenta
    return { x: desde + s * (j + 0.5), s }
  }
  // Escala de las islas laterales según el espacio que les queda.
  const sIzq = izq ? finIzq / izq : 1
  const escalaDe = (s) => Math.max(0.55, Math.min(1, s / 110))
  {
    const { x } = lado(0, izq, 0, finIzq)
    nodos.push({ x, y: cy, escala: escalaDe(sIzq) })
  }
  for (let i = 0; i < n; i++) {
    if (i < abierta) {
      const { x, s } = lado(i + 1, izq, 0, finIzq)
      nodos.push({ x, y: cy + (i % 2 ? ONDA : -ONDA) * escalaDe(s), escala: escalaDe(s), etiqueta: s >= 120 ? 'arriba' : null, anchoEtiqueta: Math.min(ETIQUETA, s - 8) })
    } else if (i === abierta) {
      nodos.push({ x: ancho / 2, y: cy, escala: 1 })
    } else {
      const { x, s } = lado(i - abierta - 1, der, iniDer, ancho)
      nodos.push({ x, y: cy + (i % 2 ? ONDA : -ONDA) * escalaDe(s), escala: escalaDe(s), etiqueta: s >= 120 ? 'arriba' : null, anchoEtiqueta: Math.min(ETIQUETA, s - 8) })
    }
  }
  return { nodos, alto }
}

export function textoEstado(estado, p, contenido) {
  if (estado === 'hecha') return '✓ Completada'
  if (estado === 'empezada') return `Paso ${p.paso + 1} de ${contenido.pasos.length}`
  if (estado === 'nueva') return 'Empezar'
  if (estado === 'bloqueada') return 'Bloqueada'
  return 'Próximamente'
}

const labio = (acento) => `color-mix(in oklab, ${acento} 45%, black)`
// Isla bloqueada: gris del tema (claro u oscuro) y su labio, un poco más oscuro.
const GRIS = 'var(--color-zinc-200)'
const LABIO_GRIS = 'color-mix(in oklab, var(--color-zinc-200) 82%, black)'

/** Una isla pequeña: círculo con «labio» inferior que se hunde al tocarla. */
function Isla({ leccion, estado, esActual, avance, acento, descripcion, onClick }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const fondo = lleno ? oscuro(acento) : estado === 'bloqueada' ? GRIS : 'var(--color-white)'
  const sombra = lleno ? labio(acento) : estado === 'bloqueada' ? LABIO_GRIS : 'transparent'
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      {esActual && <Anillo tam={ISLA + 24} acento={acento} avance={avance} />}
      <Pulsable
        onClick={onClick}
        aria-expanded={false}
        aria-label={`Lección ${leccion.id}: ${leccion.titulo}. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full text-2xl font-bold ${lleno ? 'text-blanco' : estado === 'bloqueada' ? 'text-zinc-500' : 'border-2 border-dashed border-zinc-300 text-zinc-500'}`}
        style={{ backgroundColor: fondo, boxShadow: `0 6px 0 ${sombra}` }}
      >
        {estado === 'hecha' ? <IconoCheck /> : estado === 'bloqueada' ? <IconoCandado /> : estado === 'proximamente' ? <span className="text-xl">…</span> : leccion.id}
      </Pulsable>
    </div>
  )
}

/** Anillo claro alrededor de una isla, con el arco de avance si está a medias. */
function Anillo({ tam, acento, avance = 0, grosor = 6 }) {
  const r = 50 - grosor / 2
  return (
    <svg className="pointer-events-none absolute" style={{ width: tam, height: tam }} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke={claro(acento)} strokeWidth={grosor} />
      {avance > 0 && (
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={acento}
          strokeWidth={grosor}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: avance }}
          transition={{ ...RESORTE.suave, delay: 0.2 }}
        />
      )}
    </svg>
  )
}

/**
 * Isla abierta = «isla + bocadillo»: la isla crece hasta BOLA (con su aro de avance) y debajo
 * aparece un globo que apunta a ella con el título, el estado y los botones a lo ancho.
 * El globo sale de la isla con `--contenido` (lo escribe el carrusel en cada fotograma).
 */
function IslaAbierta({ meta, modulo, progreso, indice, total, onCerrar, onIr }) {
  const estado = estadoLeccion(meta.id, progreso)
  const leccion = getLeccion(meta.id)
  const p = progreso.lecciones[meta.id]
  const pasos = leccion?.pasos.length ?? 0
  const anterior = leccionAnterior(meta.id)
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const porcentaje = estado === 'hecha' ? 100 : estado === 'empezada' ? Math.round((p.paso / pasos) * 100) : 0
  const acento = modulo.acento
  const ir = (reiniciar = false) => {
    if (reiniciar) reiniciarLeccion(meta.id)
    navegar(rutas.leccion(meta.id))
  }
  const tema = lleno ? 'color' : estado === 'bloqueada' ? 'gris' : 'blanco'

  let detalle
  if (estado === 'nueva') detalle = <><IconoReloj /> ~{leccion.minutos} min · {pasos} pasos</>
  else if (estado === 'empezada') detalle = <>Paso {p.paso + 1} de {pasos} · {porcentaje} % · ~{leccion.minutos} min</>
  else if (estado === 'hecha') detalle = <><IconoCheck className="size-4" /> Completada{p?.total ? ` · ${p.aciertos}/${p.total} a la primera` : ''}</>
  else if (estado === 'bloqueada') detalle = <><IconoCandado className="size-4" /> Termina la {anterior?.id} antes</>
  else detalle = <>Llega pronto</>

  return (
    <div className="flex flex-col items-center" role="group" aria-label={`Lección ${meta.id}: ${meta.titulo}`}>
      <Bola acento={acento} estado={estado} avance={lleno ? porcentaje / 100 : null}>
        {estado === 'hecha' ? <IconoCheck className="size-11" /> : estado === 'bloqueada' ? <IconoCandado className="size-10" /> : estado === 'proximamente' ? '…' : meta.id}
      </Bola>
      <Globo tema={tema} acento={acento} onCerrar={onCerrar}>
        <h3 className="pr-10 text-xl font-bold leading-tight tracking-tight [text-wrap:balance]">{meta.titulo}</h3>
        <p className={`flex flex-wrap items-center gap-1.5 text-base font-medium ${tema === 'color' ? 'text-blanco/90' : 'text-zinc-600'}`}>{detalle}</p>
        {lleno && (
          <BotonGlobo tema={tema} acento={acento} principal data-foco onClick={() => ir(estado === 'hecha')}>
            {estado === 'hecha' ? <IconoOtraVez /> : <IconoPlay />}
            {estado === 'nueva' ? 'Empezar' : estado === 'empezada' ? 'Continuar' : 'Repetir'}
          </BotonGlobo>
        )}
        {estado === 'empezada' && (
          <BotonGlobo tema={tema} acento={acento} onClick={() => ir(true)}>
            Empezar de cero
          </BotonGlobo>
        )}
        {estado === 'bloqueada' && anterior && (
          <BotonGlobo tema={tema} acento={acento} principal data-foco onClick={() => onIr(indice - 1)}>
            Ir a la {anterior.id}
          </BotonGlobo>
        )}
      </Globo>
      <span className="sr-only">
        Lección {indice + 1} de {total}. Desliza a los lados para ver las demás.
      </span>
    </div>
  )
}

/** La isla en grande (BOLA px) con su labio y, si se da `avance` (0–1), el aro de avance alrededor. */
function Bola({ acento, estado, avance = null, children, retos = false }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  let estilo
  if (retos) {
    estilo = lleno
      ? { backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }
      : { backgroundColor: 'var(--color-white)', border: `3px solid ${acento}`, color: tinta(acento), boxShadow: `0 7px 0 ${claro(acento)}` }
  } else if (lleno) estilo = { backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }
  else if (estado === 'bloqueada') estilo = { backgroundColor: GRIS, boxShadow: `0 7px 0 ${LABIO_GRIS}` }
  else estilo = { backgroundColor: 'var(--color-white)' }
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: BOLA, height: BOLA }}>
      {avance !== null && <Anillo tam={BOLA + ARO * 2} acento={acento} avance={avance} grosor={7} />}
      <div
        className={`grid size-full place-items-center rounded-full text-3xl font-bold tabular-nums ${
          lleno ? 'text-blanco' : estado === 'bloqueada' ? 'text-zinc-500' : retos ? '' : 'border-2 border-dashed border-zinc-300 text-zinc-500'
        }`}
        style={estilo}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Globo bajo la isla abierta, con un piquito que apunta a ella y la ✕ arriba a la derecha.
 * tema: 'color' (acento oscurecido, texto blanco) · 'gris' (bloqueada) · 'blanco' (próximamente) · 'borde' (retos a medias).
 */
function Globo({ tema, acento, onCerrar, children }) {
  const fondo = { color: oscuro(acento), gris: GRIS, blanco: 'var(--color-white)', borde: 'var(--color-white)' }[tema]
  const borde = tema === 'blanco' ? '2px dashed var(--color-zinc-300)' : tema === 'borde' ? `2px solid ${acento}` : undefined
  return (
    <div
      className="w-full"
      style={{
        marginTop: SEPARA,
        opacity: 'var(--contenido, 1)',
        transform: 'translateY(calc((1 - var(--contenido, 1)) * -14px)) scale(calc(0.94 + 0.06 * var(--contenido, 1)))',
        transformOrigin: '50% 0',
      }}
    >
      <div
        className={`relative flex flex-col gap-3 rounded-3xl p-5 ${tema === 'color' ? 'text-blanco' : 'text-zinc-900'}`}
        style={{ backgroundColor: fondo, border: borde }}
      >
        {/* Piquito que apunta a la isla */}
        <span
          aria-hidden
          className="absolute left-1/2 top-0 size-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[4px]"
          style={{ backgroundColor: fondo, borderLeft: borde, borderTop: borde, marginTop: borde ? -1 : 0 }}
        />
        <Pulsable
          onClick={onCerrar}
          aria-label="Cerrar"
          className={`absolute right-2 top-2 grid size-11 place-items-center rounded-full ${tema === 'color' ? 'text-blanco/90 active:bg-blanco/15' : 'text-zinc-500 active:bg-zinc-900/5'}`}
        >
          <IconoCerrar />
        </Pulsable>
        {children}
      </div>
    </div>
  )
}

/** Botón a lo ancho dentro del globo: principal (relleno) o secundario (con borde). */
function BotonGlobo({ tema, acento, principal = false, className = '', ...props }) {
  const enColor = tema === 'color'
  const clase = principal
    ? enColor
      ? 'bg-blanco'
      : 'bg-zinc-900 text-white'
    : enColor
      ? 'border-2 border-blanco/35 text-blanco active:bg-blanco/10'
      : 'border-2 border-zinc-300 text-zinc-800'
  return (
    <Pulsable
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 font-bold ${principal ? 'min-h-13 text-lg' : 'min-h-12 text-base'} ${clase} ${className}`}
      style={principal && enColor ? { color: oscuro(acento) } : undefined}
    />
  )
}

/** Isla pequeña de Retos (al final del camino): trofeo; se rellena cuando todos los retos están hechos. */
function IslaRetos({ acento, completo, descripcion, onClick }) {
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      <Pulsable
        onClick={onClick}
        aria-label={`Retos del módulo. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full ${completo ? 'text-blanco' : 'border-[3px]'}`}
        style={completo ? { backgroundColor: oscuro(acento), boxShadow: `0 6px 0 ${labio(acento)}` } : { backgroundColor: 'var(--color-white)', borderColor: acento, color: tinta(acento), boxShadow: `0 6px 0 ${claro(acento)}` }}
      >
        <IconoTrofeo />
      </Pulsable>
    </div>
  )
}

/** Isla de Retos abierta: trofeo en grande y globo con el reto del módulo, cuántos van y «Ver retos». */
function RetosAbierta({ modulo, retos, hechos, onCerrar, onVer }) {
  const completo = hechos === retos.length
  const tema = completo ? 'color' : 'borde'
  return (
    <div className="flex flex-col items-center" role="group" aria-label="Retos del módulo">
      <Bola acento={modulo.acento} estado={completo ? 'hecha' : 'retos'} avance={hechos / retos.length} retos>
        <IconoTrofeo className="size-11" />
      </Bola>
      <Globo tema={tema} acento={modulo.acento} onCerrar={onCerrar}>
        <h3 className="pr-10 text-xl font-bold leading-tight tracking-tight">Retos en FL Studio</h3>
        <p className={`line-clamp-3 text-base leading-snug ${completo ? 'text-blanco/90' : 'text-zinc-600'}`}>{modulo.reto}</p>
        <p className="text-base font-semibold tabular-nums" style={completo ? undefined : { color: tinta(modulo.acento) }}>
          {hechos}/{retos.length} hechos
        </p>
        <BotonGlobo tema={tema} acento={modulo.acento} principal data-foco onClick={onVer}>
          Ver retos
        </BotonGlobo>
      </Globo>
    </div>
  )
}

/** Hoja con todos los retos del módulo: el del módulo (se marca aquí) y el de cada lección. */
function HojaRetos({ abierta, onCerrar, modulo, retos, progreso }) {
  const [delModulo, ...deLecciones] = retos
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta={`Retos del módulo ${modulo.numero}`}>
      <div className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto">
        <h2 className="text-2xl font-bold tracking-tight">Retos · Módulo {modulo.numero}</h2>
        <section className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(modulo.acento) }}>
            Reto del módulo
          </span>
          <p className="text-lg leading-snug text-zinc-800">{delModulo.texto}</p>
          <Pulsable
            data-foco
            onClick={() => guardarReto(delModulo.clave, { hecho: !delModulo.hecho })}
            aria-pressed={delModulo.hecho}
            className={`min-h-12 rounded-2xl text-lg font-semibold ${delModulo.hecho ? 'bg-emerald-600 text-blanco' : 'border-2 border-zinc-900 text-zinc-900'}`}
          >
            {delModulo.hecho ? '✓ ¡Hecho!' : 'Lo hice'}
          </Pulsable>
        </section>
        {deLecciones.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Retos de las lecciones</h3>
            {deLecciones.map((r) => {
              const hecha = progreso.lecciones[r.clave]?.completada
              const contenido = (
                <>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-base font-bold ${r.hecho ? 'bg-emerald-600 text-blanco' : 'bg-zinc-100 text-zinc-600'}`}>{r.hecho ? '✓' : r.clave}</span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-base font-semibold leading-snug text-zinc-900">{r.titulo}</span>
                    <span className="text-sm text-zinc-500">{r.hecho ? 'Hecho' : hecha ? 'Pendiente' : `Termina la lección ${r.clave} para llegar`}</span>
                  </span>
                  {hecha && <span aria-hidden className="text-2xl text-zinc-400">›</span>}
                </>
              )
              const clase = 'flex min-h-16 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left'
              return hecha ? (
                <Pulsable key={r.clave} tipo="tarjeta" href={rutas.reto(r.clave)} className={clase}>
                  {contenido}
                </Pulsable>
              ) : (
                <div key={r.clave} className={clase}>
                  {contenido}
                </div>
              )
            })}
          </section>
        )}
      </div>
    </Hoja>
  )
}

function IconoTrofeo({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 0 5H7M17 6h2.5a2.5 2.5 0 0 1 0 5H17" />
    </svg>
  )
}

function IconoPlay() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
    </svg>
  )
}

function IconoOtraVez() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </svg>
  )
}

function IconoReloj() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function IconoCerrar() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function IconoCheck({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function IconoCandado({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** Ancho del contenedor (se actualiza al girar el teléfono o cambiar la ventana). */
function useAncho(ref) {
  const [ancho, setAncho] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setAncho(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return ancho
}
