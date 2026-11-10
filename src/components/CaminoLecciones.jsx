import { motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { estadoLeccion, getLeccion } from '../content/index.js'
import { claro, oscuro } from '../ui/color.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

const ISLA = 80 // diámetro de cada isla (px)
const FILA = 196 // separación vertical entre islas en el celular
const ETIQUETA = 168 // ancho del texto bajo cada isla en el celular

/**
 * Camino de lecciones en forma de islas (estilo Duolingo).
 *  - Celular (< 560 px): vertical en zigzag.
 *  - Pantallas anchas: horizontal, con una ligera ondulación.
 * Los tramos entre islas se colorean al completar la lección anterior.
 * onElegir(leccion) se llama al tocar una isla (abre la hoja de detalle).
 */
export default function CaminoLecciones({ modulo, progreso, onElegir }) {
  const ref = useRef(null)
  const ancho = useAncho(ref)
  const lecciones = modulo.lecciones
  const estados = lecciones.map((l) => estadoLeccion(l.id, progreso))
  // La isla «actual»: la primera desbloqueada sin completar.
  const actual = estados.findIndex((e) => e === 'nueva' || e === 'empezada')
  const vertical = ancho < 560

  const puntos = lecciones.map((_, i) => {
    if (vertical) {
      const amplitud = Math.max(0, Math.min(72, ancho / 2 - ETIQUETA / 2 - 4))
      return { x: ancho / 2 + amplitud * Math.round(Math.sin((i * Math.PI) / 2)), y: ISLA / 2 + 16 + i * FILA }
    }
    const col = ancho / lecciones.length
    return { x: col * (i + 0.5), y: ISLA / 2 + 16 + (i % 2 ? 36 : 0) }
  })
  const alto = vertical ? lecciones.length * FILA + 8 : ISLA + 36 + 110
  const anchoEtiqueta = vertical ? ETIQUETA : Math.min(ETIQUETA, ancho / lecciones.length - 8)

  // Al entrar, si la isla actual queda fuera de la pantalla, la acercamos.
  const islaActual = useRef(null)
  useEffect(() => {
    const el = islaActual.current
    if (!el || !ancho) return
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect()
      if (r.bottom > window.innerHeight - 24) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 450)
    return () => clearTimeout(t)
  }, [ancho])

  return (
    <div ref={ref} className="relative w-full" style={{ height: ancho ? alto : FILA * lecciones.length }}>
      {ancho > 0 && (
        <>
          <svg className="absolute inset-0 overflow-visible" width={ancho} height={alto} aria-hidden>
            {puntos.slice(1).map((b, i) => {
              const a = puntos[i]
              const d = vertical
                ? `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`
                : `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`
              const hecho = estados[i] === 'hecha'
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke="#e4e4e7" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 14" />
                  {hecho && (
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={modulo.acento}
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ ...RESORTE.suave, delay: 0.15 + i * 0.08 }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {lecciones.map((l, i) => {
            const { x, y } = puntos[i]
            const estado = estados[i]
            const p = progreso.lecciones[l.id]
            const contenido = getLeccion(l.id)
            const texto = textoEstado(estado, p, contenido)
            return (
              <motion.div
                key={l.id}
                ref={i === actual ? islaActual : undefined}
                className="absolute flex flex-col items-center"
                style={{ left: x - anchoEtiqueta / 2, top: y - ISLA / 2, width: anchoEtiqueta }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...RESORTE.pulsar, delay: 0.05 + i * 0.06 }}
              >
                <Isla
                  leccion={l}
                  estado={estado}
                  esActual={i === actual}
                  avance={estado === 'empezada' && contenido ? p.paso / contenido.pasos.length : 0}
                  acento={modulo.acento}
                  descripcion={texto}
                  onClick={() => onElegir(l)}
                />
                {/* Fondo del color de la página: el camino pasa «por detrás» del texto. */}
                <span className="mt-2.5 flex flex-col items-center rounded-xl bg-[#fafafa] px-2 py-0.5">
                  <span className={`line-clamp-2 text-center text-base font-semibold leading-snug ${estado === 'bloqueada' || estado === 'proximamente' ? 'text-zinc-500' : 'text-zinc-900'}`}>
                    {l.titulo}
                  </span>
                  <span
                    className={`text-center text-sm font-semibold ${i === actual ? '' : 'text-zinc-500'}`}
                    style={i === actual ? { color: oscuro(modulo.acento) } : undefined}
                  >
                    {texto}
                  </span>
                </span>
              </motion.div>
            )
          })}
        </>
      )}
    </div>
  )
}

export function textoEstado(estado, p, contenido) {
  if (estado === 'hecha') return '✓ Completada'
  if (estado === 'empezada') return `Paso ${p.paso + 1} de ${contenido.pasos.length}`
  if (estado === 'nueva') return 'Empezar'
  if (estado === 'bloqueada') return 'Bloqueada'
  return 'Próximamente'
}

/** Una isla: círculo con «labio» inferior que se hunde al tocarla. */
function Isla({ leccion, estado, esActual, avance, acento, descripcion, onClick }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const fondo = lleno ? oscuro(acento) : estado === 'bloqueada' ? '#e4e4e7' : '#ffffff'
  const labio = lleno ? `color-mix(in oklab, ${acento} 45%, black)` : estado === 'bloqueada' ? '#d4d4d8' : 'transparent'
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      {/* Anillo de la lección actual (y su avance si está a medias) */}
      {esActual && (
        <svg className="pointer-events-none absolute -inset-3" viewBox="0 0 104 104" aria-hidden>
          <circle cx="52" cy="52" r="49" fill="none" stroke={claro(acento)} strokeWidth="6" />
          {avance > 0 && (
            <motion.circle
              cx="52"
              cy="52"
              r="49"
              fill="none"
              stroke={acento}
              strokeWidth="6"
              strokeLinecap="round"
              transform="rotate(-90 52 52)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: avance }}
              transition={{ ...RESORTE.suave, delay: 0.3 }}
            />
          )}
        </svg>
      )}
      <Pulsable
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label={`Lección ${leccion.id}: ${leccion.titulo}. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full text-2xl font-bold ${lleno ? 'text-white' : estado === 'bloqueada' ? 'text-zinc-500' : 'border-2 border-dashed border-zinc-300 text-zinc-500'}`}
        style={{ backgroundColor: fondo, boxShadow: `0 6px 0 ${labio}` }}
      >
        {estado === 'hecha' ? <IconoCheck /> : estado === 'bloqueada' ? <IconoCandado /> : estado === 'proximamente' ? <span className="text-xl">…</span> : leccion.id}
      </Pulsable>
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
