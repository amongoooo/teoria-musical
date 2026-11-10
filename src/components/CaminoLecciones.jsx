import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { estadoLeccion, getLeccion, leccionAnterior } from '../content/index.js'
import { reiniciarLeccion } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { claro, oscuro } from '../ui/color.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useDeslizar from '../ui/useDeslizar.js'

const ISLA = 80 // diámetro de cada isla (px)
const INSIGNIA = 72 // cuadrado con el número del módulo, al inicio del camino
const FILA = 196 // separación vertical entre islas en el celular
const ETIQUETA = 168 // ancho máximo del título de cada isla
const ONDA = 26 // ondulación del camino horizontal

/**
 * Camino de lecciones en forma de islas.
 *  - Celular (< 560 px): vertical en zigzag. Pantallas anchas: horizontal y ondulado.
 *  - Empieza con un cuadrado con el número del módulo.
 *  - Al tocar una isla, crece hasta un círculo grande con su información y botones;
 *    las demás se apartan. Con una isla abierta, deslizar de lado pasa a la anterior o
 *    la siguiente (useDeslizar). Se cierra con ✕, tocando fuera o con Escape.
 */
export default function CaminoLecciones({ modulo, progreso }) {
  const ref = useRef(null)
  const ancho = useAncho(ref)
  const lecciones = modulo.lecciones
  const n = lecciones.length
  const estados = lecciones.map((l) => estadoLeccion(l.id, progreso))
  const actual = estados.findIndex((e) => e === 'nueva' || e === 'empezada')
  const vertical = ancho < 560

  const [abierta, setAbierta] = useState(null)
  const abiertaRef = useRef(abierta)
  abiertaRef.current = abierta

  const grande = vertical ? Math.min(ancho - 8, 320) : Math.min(340, Math.max(290, ancho * 0.36))
  const { x: arrastre, handlers } = useDeslizar({
    activo: abierta !== null,
    umbral: vertical ? Math.max(90, ancho * 0.3) : 150,
    onPaso: (dir) => {
      const a = abiertaRef.current
      const sig = a + dir
      if (a === null || sig < 0 || sig >= n) return false
      abiertaRef.current = sig
      setAbierta(sig)
      return true
    },
  })

  // Escape o tocar en cualquier parte fuera de las islas cierra la isla abierta.
  // (Tras un arrastre, useDeslizar anula ese «click», así que deslizar no cierra.)
  const abiertaSiNo = abierta !== null
  useEffect(() => {
    if (!abiertaSiNo) return
    const tecla = (e) => e.key === 'Escape' && setAbierta(null)
    const fuera = (e) => !e.target.closest?.('[data-nodo]') && setAbierta(null)
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

  const { nodos, alto } = calcular({ ancho, vertical, n, abierta, grande })

  // En el celular, al abrir o cambiar de isla, que el círculo quede a la vista.
  const circulo = useRef(null)
  useEffect(() => {
    if (abierta === null || !vertical) return
    const t = setTimeout(() => {
      const r = circulo.current?.getBoundingClientRect()
      if (r && (r.top < 8 || r.bottom > window.innerHeight - 8)) circulo.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 250)
    return () => clearTimeout(t)
  }, [abierta, vertical])

  const camino = nodos.slice(1).map((b, i) => {
    const a = nodos[i]
    const d = vertical
      ? `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`
    return { d, color: estados[i] !== 'bloqueada' && estados[i] !== 'proximamente' }
  })

  return (
    <div
      ref={ref}
      className="relative w-full select-none"
      style={{ height: ancho ? alto : FILA * n, touchAction: 'pan-y' }}
      {...handlers}
    >
      {ancho > 0 && (
        <>
          <svg className="pointer-events-none absolute inset-0 overflow-visible" width={ancho} height={alto} aria-hidden>
            {camino.map((c, i) => (
              <g key={i}>
                <motion.path initial={false} animate={{ d: c.d }} transition={RESORTE.suave} fill="none" stroke="#e4e4e7" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 14" />
                {c.color && (
                  <motion.path
                    initial={{ pathLength: 0, d: c.d }}
                    animate={{ pathLength: 1, d: c.d }}
                    transition={{ ...RESORTE.suave, pathLength: { ...RESORTE.suave, delay: montado ? 0 : 0.15 + i * 0.08 } }}
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
          <Nodo nodo={nodos[0]} montado={montado} indice={0}>
            <span
              className="grid place-items-center rounded-3xl text-3xl font-bold text-white"
              style={{ width: INSIGNIA, height: INSIGNIA, backgroundColor: oscuro(modulo.acento), boxShadow: `0 6px 0 ${labio(modulo.acento)}` }}
              aria-label={`Módulo ${modulo.numero}`}
            >
              {modulo.numero}
            </span>
          </Nodo>

          {lecciones.map((l, i) => {
            const nodo = nodos[i + 1]
            const estado = estados[i]
            const p = progreso.lecciones[l.id]
            const contenido = getLeccion(l.id)
            const texto = textoEstado(estado, p, contenido)
            if (i === abierta) return null
            return (
              <Nodo key={l.id} nodo={nodo} montado={montado} indice={i + 1}>
                <Isla
                  leccion={l}
                  estado={estado}
                  esActual={i === actual}
                  avance={estado === 'empezada' && contenido ? p.paso / contenido.pasos.length : 0}
                  acento={modulo.acento}
                  descripcion={texto}
                  onClick={() => setAbierta(i)}
                />
                {nodo.etiqueta && (
                  <span
                    className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center rounded-xl bg-[#fafafa] px-2 py-0.5"
                    style={{ width: nodo.anchoEtiqueta, ...(nodo.etiqueta === 'arriba' ? { bottom: ISLA + 10 } : { top: ISLA + 12 }) }}
                  >
                    <span className={`line-clamp-2 text-center text-base font-semibold leading-snug ${estado === 'bloqueada' || estado === 'proximamente' ? 'text-zinc-500' : 'text-zinc-900'}`}>
                      {l.titulo}
                    </span>
                    {nodo.etiqueta === 'abajo' && (
                      <span className={`text-center text-sm font-semibold ${i === actual ? '' : 'text-zinc-500'}`} style={i === actual ? { color: oscuro(modulo.acento) } : undefined}>
                        {texto}
                      </span>
                    )}
                  </span>
                )}
              </Nodo>
            )
          })}

          <AnimatePresence initial={false}>
            {abierta !== null && (
              <motion.div
                key="grande"
                data-nodo
                className="absolute left-0 top-0"
                initial={{ x: nodos[abierta + 1].x - grande / 2, y: nodos[abierta + 1].y - grande / 2, scale: ISLA / grande, opacity: 0 }}
                animate={{ x: nodos[abierta + 1].x - grande / 2, y: nodos[abierta + 1].y - grande / 2, scale: 1, opacity: 1 }}
                exit={{ scale: ISLA / grande, opacity: 0, transition: { duration: 0.18 } }}
                transition={{ ...RESORTE.pantalla, opacity: { duration: 0.15 } }}
              >
                <motion.div ref={circulo} style={{ x: arrastre }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={lecciones[abierta].id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                      transition={RESORTE.pulsar}
                    >
                      <IslaAbierta
                        meta={lecciones[abierta]}
                        modulo={modulo}
                        progreso={progreso}
                        tam={grande}
                        indice={abierta}
                        total={n}
                        onCerrar={() => setAbierta(null)}
                        onIr={(i) => setAbierta(i)}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

/** Un punto del camino (insignia o isla) que se coloca y se mueve con un resorte. */
function Nodo({ nodo, montado, indice, children }) {
  return (
    <motion.div
      data-nodo
      className="absolute left-0 top-0 size-0"
      initial={{ x: nodo.x, y: nodo.y, scale: 0.6, opacity: 0 }}
      animate={{ x: nodo.x, y: nodo.y, scale: nodo.escala, opacity: 1 }}
      transition={{ ...RESORTE.suave, opacity: { duration: 0.2 }, delay: montado ? 0 : 0.05 + indice * 0.06 }}
    >
      <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">{children}</div>
    </motion.div>
  )
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
