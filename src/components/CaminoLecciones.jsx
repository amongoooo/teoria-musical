import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { estadoLeccion, getLeccion, leccionAnterior } from '../content/index.js'
import { reiniciarLeccion } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { claro, oscuro } from '../ui/color.js'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useDeslizar from '../ui/useDeslizar.js'

const ISLA = 80 // diámetro de cada isla (px)
const INSIGNIA = 72 // cuadrado con el número del módulo, al inicio del camino
const FILA = 196 // separación vertical entre islas en el celular
const ETIQUETA = 168 // ancho máximo del título de cada isla
const ONDA = 26 // ondulación del camino horizontal
const PUNTO = 16 // diámetro del puntito de la isla actual (los demás, la mitad)

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

/**
 * Camino de lecciones en forma de islas.
 *  - Celular (< 560 px): vertical en zigzag. Pantallas anchas: horizontal y ondulado.
 *  - Empieza con un cuadrado con el número del módulo.
 *  - Al tocar una isla, crece hasta un círculo grande con su información y botones;
 *    las demás se apartan. Se cierra con ✕, tocando fuera o con Escape.
 *  - Con una isla abierta funciona como un CARRUSEL CONTINUO: la posición es un número real
 *    `p` (índice de la isla abierta + arrastre). Cada isla se coloca interpolando entre las
 *    disposiciones calculadas para «abierta = floor(p)» y «abierta = ceil(p)», y crece según lo
 *    cerca que esté de p. Deslizar de lado (useDeslizar, reglas de la skill) o arrastrar por la
 *    barra de puntitos de abajo mueve p; al soltar todo se asienta con resortes.
 *  - Las posiciones se escriben directamente en el DOM (sin re-render) en cada fotograma.
 */
export default function CaminoLecciones({ modulo, progreso }) {
  const ref = useRef(null)
  const ancho = useAncho(ref)
  const lecciones = modulo.lecciones
  const n = lecciones.length
  const estados = lecciones.map((l) => estadoLeccion(l.id, progreso))
  const actual = estados.findIndex((e) => e === 'nueva' || e === 'empezada')
  const vertical = ancho < 560
  const grande = vertical ? Math.min(ancho - 8, 320) : Math.min(340, Math.max(290, ancho * 0.36))
  const X = vertical ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho
  const reducir = useReducedMotion()
  const resorte = reducir ? { duration: 0 } : RESORTE.pantalla

  const [abierta, setAbierta] = useState(null)
  const abiertaRef = useRef(null) // isla abierta (destino) o null
  const base = useMotionValue(0) // índice continuo de la isla abierta, sin contar el arrastre
  const apertura = useMotionValue(0) // 0 = camino cerrado, 1 = una isla abierta

  // Disposición del camino cerrado y con cada isla abierta.
  const layouts = useMemo(
    () => (ancho ? { cerrado: calcular({ ancho, vertical, n, abierta: null, grande }), abiertas: Array.from({ length: n }, (_, j) => calcular({ ancho, vertical, n, abierta: j, grande })) } : null),
    [ancho, vertical, n, grande],
  )

  // Elementos que se mueven a mano en cada fotograma.
  const els = useRef({ nodo: [], escala: [], chica: [], grande: [], etiqueta: [], gris: [], color: [], punto: [] }).current
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

  const islas = useDeslizar({ activo: abierta !== null, umbral: X, onPaso: paso, puede, alEmpezar: fijarAncla })
  const puntos = useDeslizar({
    activo: abierta !== null,
    umbral: DESLIZAR.puntitos.separacion,
    zonaMuerta: DESLIZAR.puntitos.zonaMuerta,
    sentido: 1, // por la barra, arrastrar a la derecha va a la siguiente
    unaPorGesto: false, // una isla cada vez que se cruza un puntito
    rapido: false,
    eje: false,
    anclaExacta: true,
    onPaso: paso,
    puede,
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
      const x = lerp(c.x, ox, a)
      const y = lerp(c.y, lerp(lo.y, hi.y, f), a)
      const esc = lerp(c.escala, lerp(lo.escala, hi.escala, f), a)
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
      const tam = lerp(esc, grande / ISLA, o) // escala de la isla pequeña
      const chica = els.chica[li]
      if (chica) {
        chica.style.transform = `scale(${tam})`
        chica.style.opacity = String(opacidadChica(o))
        chica.inert = o >= 0.5
      }
      const gr = els.grande[li]
      if (gr) {
        gr.style.transform = `translate(-50%, -50%) scale(${(tam * ISLA) / grande})`
        gr.style.opacity = String(opacidadDisco(o))
        gr.style.setProperty('--contenido', String(opacidadContenido(o)))
        gr.style.visibility = o > 0.002 ? 'visible' : 'hidden'
        gr.inert = o < 0.5
      }
      const et = els.etiqueta[li]
      if (et) {
        const conEtiqueta = lerp(c.etiqueta ? 1 : 0, lerp(lo.etiqueta ? 1 : 0, hi.etiqueta ? 1 : 0, f), a) * opacidadTitulo(o)
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
      els.gris[s]?.setAttribute('d', d)
      els.color[s]?.setAttribute('d', d)
    }
    // Celular: la isla abierta se queda en el mismo sitio de la pantalla mientras se cambia.
    if (vertical && ancla.current !== null && a > 0.999 && p !== ultimaP.current) {
      const dy = cont.getBoundingClientRect().top - (ancla.current - focoY(L, p, n))
      if (Math.abs(dy) > 0.5) window.scrollBy(0, dy)
    }
    ultimaP.current = p
  }
  const actualizarRef = useRef(actualizar)
  actualizarRef.current = actualizar
  useLayoutEffect(() => actualizar())
  useEffect(() => {
    const quitar = [base, apertura, islas.progreso, puntos.progreso].map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [base, apertura, islas.progreso, puntos.progreso])

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
      if (e.key === 'Escape') cerrarRef.current()
      else if (e.key === 'ArrowRight') irARef.current(abiertaRef.current + 1)
      else if (e.key === 'ArrowLeft') irARef.current(abiertaRef.current - 1)
    }
    const fuera = (e) => !e.target.closest?.('[data-nodo]') && cerrarRef.current()
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

  // En el celular, al abrir una isla, que el círculo quede a la vista.
  useEffect(() => {
    if (!abiertaSiNo || !vertical) return
    const t = setTimeout(() => {
      const el = els.grande[abiertaRef.current]
      const r = el?.getBoundingClientRect()
      if (r && (r.top < 8 || r.bottom > window.innerHeight - 96)) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
    return () => clearTimeout(t)
  }, [abiertaSiNo, vertical, els])

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
              {lecciones.map((l, s) => (
                <g key={l.id}>
                  <path ref={guardar('gris', s)} fill="none" stroke="#e4e4e7" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 14" />
                  {estados[s] !== 'bloqueada' && estados[s] !== 'proximamente' && (
                    <motion.path
                      ref={guardar('color', s)}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ ...RESORTE.suave, delay: montado ? 0 : 0.15 + s * 0.08 }}
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
                  <span
                    className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl text-3xl font-bold text-white"
                    style={{ width: INSIGNIA, height: INSIGNIA, backgroundColor: oscuro(modulo.acento), boxShadow: `0 6px 0 ${labio(modulo.acento)}` }}
                    aria-label={`Módulo ${modulo.numero}`}
                  >
                    {modulo.numero}
                  </span>
                </div>
              </motion.div>
            </div>

            {lecciones.map((l, i) => {
              const estado = estados[i]
              const p = progreso.lecciones[l.id]
              const contenido = getLeccion(l.id)
              const texto = textoEstado(estado, p, contenido)
              return (
                <div key={l.id} ref={guardar('nodo', i + 1)} data-nodo className="absolute left-0 top-0 size-0">
                  <motion.div {...entrada(i + 1)}>
                    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                      <div ref={guardar('chica', i)}>
                        <Isla
                          leccion={l}
                          estado={estado}
                          esActual={i === actual}
                          avance={estado === 'empezada' && contenido ? p.paso / contenido.pasos.length : 0}
                          acento={modulo.acento}
                          descripcion={texto}
                          onClick={() => irA(i)}
                        />
                      </div>
                      <span
                        ref={guardar('etiqueta', i)}
                        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center rounded-xl bg-[#fafafa] px-2 py-0.5"
                        style={vertical ? { top: ISLA + 12 } : { bottom: ISLA + 10 }}
                      >
                        <span className={`line-clamp-2 text-center text-base font-semibold leading-snug ${estado === 'bloqueada' || estado === 'proximamente' ? 'text-zinc-500' : 'text-zinc-900'}`}>{l.titulo}</span>
                        {vertical && (
                          <span className={`text-center text-sm font-semibold ${i === actual ? '' : 'text-zinc-500'}`} style={i === actual ? { color: oscuro(modulo.acento) } : undefined}>
                            {texto}
                          </span>
                        )}
                      </span>
                    </div>
                    <div ref={guardar('grande', i)} className="absolute left-0 top-0 origin-center" style={{ visibility: 'hidden', opacity: 0 }}>
                      <IslaAbierta meta={l} modulo={modulo} progreso={progreso} tam={grande} indice={i} total={n} onCerrar={cerrar} onIr={irA} />
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {abierta !== null && (
            <BarraPuntitos key="puntitos" lecciones={lecciones} estados={estados} abierta={abierta} acento={modulo.acento} guardar={guardar} handlers={puntos.handlers} onIr={irA} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/**
 * Barra de puntitos (uno por lección) fija abajo mientras hay una isla abierta. Sube con un
 * resorte y respeta la zona segura. Tocar un puntito va a esa isla; arrastrar por encima pasa
 * de isla en isla con las mismas reglas del swipe (una isla cada vez que se cruza un puntito).
 */
function BarraPuntitos({ lecciones, estados, abierta, acento, guardar, handlers, onIr }) {
  const sep = DESLIZAR.puntitos.separacion
  return (
    <motion.div
      data-nodo
      data-puntitos
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      initial={{ y: '120%' }}
      animate={{ y: 0 }}
      exit={{ y: '120%' }}
      transition={RESORTE.pantalla}
    >
      <div
        role="group"
        aria-label="Lecciones del módulo"
        className="pointer-events-auto flex select-none items-center rounded-full border border-zinc-200 bg-white/95 px-3 shadow-sm backdrop-blur"
        style={{ touchAction: 'none' }}
        {...handlers}
      >
        {lecciones.map((l, i) => {
          const hecha = estados[i] === 'hecha'
          return (
            <button
              key={l.id}
              type="button"
              data-punto={i}
              onClick={() => onIr(i)}
              aria-label={`Lección ${l.id}: ${l.titulo}${hecha ? ' (completada)' : ''}`}
              aria-current={i === abierta ? 'true' : undefined}
              className="grid h-14 place-items-center"
              style={{ width: sep }}
            >
              <span
                ref={guardar('punto', i)}
                className="block rounded-full"
                style={{ width: PUNTO, height: PUNTO, backgroundColor: hecha ? oscuro(acento) : acento, opacity: hecha ? 1 : 0.35, transform: `scale(${i === abierta ? 1 : 0.5})` }}
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
function calcular({ ancho, vertical, n, abierta, grande }) {
  const nodos = []
  if (!ancho) return { nodos: Array.from({ length: n + 1 }, () => ({ x: 0, y: 0, escala: 1 })), alto: 0 }

  if (vertical) {
    const amplitud = Math.max(0, Math.min(72, ancho / 2 - ETIQUETA / 2 - 4))
    const extra = abierta === null ? 0 : grande - ISLA + 8
    nodos.push({ x: ancho / 2, y: INSIGNIA / 2 + 8, escala: 1 })
    const y0 = INSIGNIA + 8 + 56 + ISLA / 2
    for (let i = 0; i < n; i++) {
      const base = y0 + i * FILA
      if (i === abierta) nodos.push({ x: ancho / 2, y: base + (grande - ISLA) / 2, escala: 1 })
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
    const alto = ultimo.y + (abierta === n - 1 ? grande / 2 + 16 : ISLA / 2 + 80)
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

  const alto = Math.max(base + ONDA + ISLA / 2 + 24, grande + 40)
  const cy = alto / 2
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

/** Una isla pequeña: círculo con «labio» inferior que se hunde al tocarla. */
function Isla({ leccion, estado, esActual, avance, acento, descripcion, onClick }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const fondo = lleno ? oscuro(acento) : estado === 'bloqueada' ? '#e4e4e7' : '#ffffff'
  const sombra = lleno ? labio(acento) : estado === 'bloqueada' ? '#d4d4d8' : 'transparent'
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      {esActual && <Anillo tam={ISLA + 24} acento={acento} avance={avance} />}
      <Pulsable
        onClick={onClick}
        aria-expanded={false}
        aria-label={`Lección ${leccion.id}: ${leccion.titulo}. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full text-2xl font-bold ${lleno ? 'text-white' : estado === 'bloqueada' ? 'text-zinc-500' : 'border-2 border-dashed border-zinc-300 text-zinc-500'}`}
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

/** La isla abierta: círculo grande con información y acciones. */
function IslaAbierta({ meta, modulo, progreso, tam, indice, total, onCerrar, onIr }) {
  const estado = estadoLeccion(meta.id, progreso)
  const leccion = getLeccion(meta.id)
  const p = progreso.lecciones[meta.id]
  const pasos = leccion?.pasos.length ?? 0
  const anterior = leccionAnterior(meta.id)
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const porcentaje = estado === 'hecha' ? 100 : estado === 'empezada' ? Math.round((p.paso / pasos) * 100) : 0
  const ir = (reiniciar = false) => {
    if (reiniciar) reiniciarLeccion(meta.id)
    navegar(rutas.leccion(meta.id))
  }
  const tinta = lleno ? 'text-white' : 'text-zinc-700'
  const botonPrincipal = `flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold ${lleno ? 'bg-white' : 'bg-zinc-900 text-white'}`

  return (
    <div className="relative grid place-items-center" style={{ width: tam, height: tam }} role="group" aria-label={`Lección ${meta.id}: ${meta.titulo}`}>
      <Anillo tam={tam + 28} acento={modulo.acento} avance={porcentaje / 100} grosor={4} />
      <div
        className={`relative flex size-full flex-col items-center justify-center gap-2 rounded-full px-10 text-center ${tinta} ${estado === 'proximamente' ? 'border-2 border-dashed border-zinc-300' : ''}`}
        style={{ backgroundColor: lleno ? oscuro(modulo.acento) : estado === 'bloqueada' ? '#e4e4e7' : '#ffffff', boxShadow: lleno ? `0 8px 0 ${labio(modulo.acento)}` : estado === 'bloqueada' ? '0 8px 0 #d4d4d8' : undefined }}
      >
        <div className="flex flex-col items-center gap-2" style={{ opacity: 'var(--contenido, 1)' }}>
          <Pulsable
            onClick={onCerrar}
            aria-label="Cerrar"
            className={`absolute grid size-11 place-items-center rounded-full text-xl ${lleno ? 'text-white/90 active:bg-white/15' : 'text-zinc-500 active:bg-zinc-900/5'}`}
            style={{ top: tam * 0.1, right: tam * 0.1 }}
          >
            ✕
          </Pulsable>

          <span className="text-2xl font-bold tabular-nums">{meta.id}</span>
          <h3 className="line-clamp-2 text-lg font-bold leading-tight">{meta.titulo}</h3>
          {leccion && (
            <p className={`text-sm ${lleno ? 'text-white/85' : 'text-zinc-600'}`}>
              ~{leccion.minutos} min · {pasos} pasos
            </p>
          )}

          {(estado === 'nueva' || estado === 'empezada' || estado === 'hecha') && (
            <Pulsable data-foco onClick={() => ir(estado === 'hecha')} className={botonPrincipal} style={{ color: oscuro(modulo.acento) }}>
              <span aria-hidden>{estado === 'hecha' ? '↻' : '▶'}</span>
              {estado === 'nueva' ? 'Empezar' : estado === 'empezada' ? 'Continuar' : 'Repetir'}
            </Pulsable>
          )}
          {estado === 'empezada' && (
            <Pulsable onClick={() => ir(true)} className="-my-1 min-h-11 rounded-xl px-3 text-base font-semibold text-white/90 underline underline-offset-4 active:bg-white/15">
              Empezar de cero
            </Pulsable>
          )}
          {estado === 'bloqueada' && anterior && (
            <>
              <p className="flex items-center gap-1.5 text-base leading-snug">
                <IconoCandado className="size-5 shrink-0" /> Termina la {anterior.id} antes
              </p>
              <Pulsable data-foco onClick={() => onIr(indice - 1)} className={botonPrincipal}>
                Ir a la {anterior.id}
              </Pulsable>
            </>
          )}
          {estado === 'proximamente' && <p className="text-base">Llega pronto</p>}

          {lleno && (
            <span className="text-xl font-bold tabular-nums">
              {porcentaje} %{estado === 'hecha' && p?.total ? <span className="ml-1 text-sm font-semibold text-white/85">· {p.aciertos}/{p.total} a la primera</span> : null}
            </span>
          )}
        </div>
      </div>
      <span className="sr-only">
        Lección {indice + 1} de {total}. Desliza a los lados para ver las demás.
      </span>
    </div>
  )
}

function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
