import { motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getLeccion } from '../content/index.js'
import { HERRAMIENTAS } from '../content/rutas.js'
import { guardarReto } from '../progress/progreso.js'
import { rutas as enlaces } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import Hoja from '../ui/Hoja.jsx'
import { Candado, Check, MarcaBien, Trofeo } from '../ui/Iconos.jsx'
import { itemLista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

// Camino de una RUTA (dentro del panel de su entrenamiento): islas en zigzag como las del módulo, unidas por una
// línea punteada (del color de la ruta hasta la parada actual). Cada parada tiene su forma:
//   lección = círculo con su número · meta de práctica = círculo con el ícono del entrenamiento ·
//   se abre algo = cuadrito (como la insignia) con el ícono de lo que se abre · reto = trofeo con borde.
// Hecha = relleno del color con ✓ en la esquina; actual = relleno con anillo suave; bloqueada = gris con candado.
// Tocar una isla abre una hoja con qué pide y el botón para ir (o «Lo hice» en el reto).

const ISLA = 76
const FILA = 124 // alto de cada parada (isla + título)
const COLUMNAS = [0.24, 0.5, 0.76, 0.5]
const GRIS = 'var(--color-zinc-200)'
const LABIO_GRIS = 'color-mix(in oklab, var(--color-zinc-200) 82%, black)'

/**
 * Props: ruta (de content/rutas.js), estado (de estadoRuta), Icono (del entrenamiento), IconoAbre ({ flow: Pluma }),
 * nivelMax(modo), enlaceMeta(modo) (a dónde lleva una meta de práctica).
 */
export default function CaminoRuta({ ruta, estado, Icono, iconosAbre = {}, nivelMax, enlaceMeta }) {
  const caja = useRef(null)
  const [ancho, setAncho] = useState(0)
  const [abierta, setAbierta] = useState(null)
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => setAncho(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { paradas, hechas, total, actual } = estado
  const puntos = paradas.map((_, i) => [COLUMNAS[i % COLUMNAS.length] * ancho, ISLA / 2 + 12 + i * FILA])
  const tramo = (i) => {
    const [x0, y0] = puntos[i - 1]
    const [x1, y1] = puntos[i]
    return `M${x0} ${y0} C${x0} ${y0 + FILA / 2} ${x1} ${y1 - FILA / 2} ${x1} ${y1}`
  }
  const alto = paradas.length * FILA

  return (
    <motion.section variants={itemLista} className="flex flex-col gap-5" data-ruta={ruta.id}>
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">{ruta.titulo}</h2>
          <span className="font-dato text-base font-medium tabular-nums" style={{ color: tinta(ruta.acento) }} data-ruta-avance>
            {hechas}/{total}
          </span>
        </div>
        <BarraProgreso valor={hechas / total} color={hechas === total ? 'var(--color-bien)' : ruta.acento} alto="h-3" />
      </div>

      <div ref={caja} className="relative" style={{ height: alto }}>
        {ancho > 0 && (
          <>
            <svg className="pointer-events-none absolute inset-0" width={ancho} height={alto} aria-hidden>
              {paradas.slice(1).map((p, k) => (
                <path
                  key={p.i}
                  d={tramo(p.i)}
                  fill="none"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray="0.1 13"
                  style={{ stroke: actual < 0 || p.i <= actual ? ruta.acento : 'var(--color-zinc-300)' }}
                  data-tramo={k}
                />
              ))}
            </svg>
            {paradas.map((p) => (
              <Parada
                key={p.i}
                parada={p}
                x={puntos[p.i][0]}
                y={puntos[p.i][1]}
                acento={ruta.acento}
                Icono={p.tipo === 'abre' ? (iconosAbre[p.herramienta] ?? Icono) : Icono}
                onClick={() => setAbierta(p.i)}
              />
            ))}
          </>
        )}
      </div>

      <HojaParada
        parada={abierta == null ? null : paradas[abierta]}
        anterior={abierta ? paradas[actual] : null}
        ruta={ruta}
        nivelMax={nivelMax}
        enlaceMeta={enlaceMeta}
        onCerrar={() => setAbierta(null)}
      />
    </motion.section>
  )
}

function Parada({ parada: p, x, y, acento, Icono, onClick }) {
  const bloqueada = p.estado === 'bloqueada'
  const reto = p.tipo === 'reto'
  const lleno = !bloqueada && !(reto && !p.hecha)
  const fondo = bloqueada ? GRIS : lleno ? oscuro(acento) : 'var(--color-white)'
  const sombra = bloqueada ? LABIO_GRIS : lleno ? labio(acento) : claro(acento)
  const forma = p.tipo === 'abre' ? 'rounded-3xl' : 'rounded-full'
  const contenido = bloqueada ? (
    <Candado className="size-8" grosor={2.2} />
  ) : p.tipo === 'leccion' ? (
    p.id
  ) : p.tipo === 'reto' ? (
    <Trofeo className="size-9" />
  ) : (
    <Icono className="size-9" />
  )
  return (
    <motion.div
      className="absolute flex w-32 flex-col items-center gap-2 text-center"
      style={{ left: x - 64, top: y - ISLA / 2 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 + p.i * 0.05 }}
      data-parada={p.i}
      data-tipo={p.tipo}
      data-estado={p.estado}
    >
      <span className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
        {p.estado === 'actual' && (
          <span aria-hidden className={`pointer-events-none absolute -inset-2.5 ${forma}`} style={{ boxShadow: `0 0 0 5px ${claro(acento)}` }} />
        )}
        <Pulsable
          onClick={onClick}
          aria-label={`${p.titulo}${p.hecha ? ', hecha' : bloqueada ? ', bloqueada' : ''}`}
          className={`grid size-full place-items-center font-titulo text-2xl font-bold ${forma} ${
            bloqueada ? 'text-zinc-500' : lleno ? 'text-blanco' : ''
          }`}
          style={{
            backgroundColor: fondo,
            boxShadow: `0 6px 0 ${sombra}`,
            color: !bloqueada && !lleno ? tinta(acento) : undefined,
            border: reto && !p.hecha && !bloqueada ? `3px solid ${acento}` : undefined,
          }}
        >
          {contenido}
        </Pulsable>
        {p.hecha && <MarcaBien className="pointer-events-none absolute -right-1 -top-1 size-7" aro="var(--color-fondo)" />}
      </span>
      <span className={`rounded-md bg-fondo px-1 text-base font-semibold leading-tight ${bloqueada ? 'text-zinc-500' : 'text-zinc-800'}`}>
        {p.titulo}
      </span>
    </motion.div>
  )
}

/** Hoja de una parada: qué es, qué pide, cómo vas y el botón para ir. */
function HojaParada({ parada: p, anterior, ruta, nivelMax, enlaceMeta, onCerrar }) {
  // Conserva la última parada mientras la hoja se cierra (si no, se vacía antes de bajar).
  const [vista, setVista] = useState(p)
  useEffect(() => {
    if (p) setVista(p)
  }, [p])
  const q = p ?? vista
  if (!q) return <Hoja abierta={false} onCerrar={onCerrar} etiqueta="Parada" />

  const bloqueada = q.estado === 'bloqueada'
  const tipo = { leccion: `Lección ${q.id}`, meta: 'Práctica', abre: 'Se abre', reto: 'Reto en FL Studio' }[q.tipo]
  let texto = q.texto
  let boton = null
  if (q.tipo === 'leccion') {
    const total = getLeccion(q.id)?.pasos.length
    texto = q.hecha ? 'Completada.' : bloqueada ? null : 'Una lección del curso: si ya la hiciste ahí, aquí ya cuenta.'
    if (!bloqueada) boton = { href: enlaces.leccion(q.id), texto: q.hecha ? 'Repasar' : 'Empezar', detalle: total ? `${total} pasos` : null }
  } else if (q.tipo === 'meta') {
    if (!bloqueada) boton = { href: enlaceMeta(q.modo), texto: 'Practicar' }
  } else if (q.tipo === 'abre') {
    const h = HERRAMIENTAS[q.herramienta]
    texto = q.hecha ? q.texto : `${q.texto} Se abre al terminar la lección ${h.leccion}.`
    if (q.hecha && q.herramienta === 'flow') boton = { href: enlaces.letras(), texto: 'Ir a Letras' }
  }

  return (
    <Hoja abierta={!!p} onCerrar={onCerrar} etiqueta={q.titulo}>
      <div className="flex flex-col gap-4" data-hoja-parada={q.i}>
        <div className="flex flex-col gap-1">
          <span className="font-juego text-lg uppercase tracking-wide" style={{ color: tinta(ruta.acento) }}>
            {tipo}
          </span>
          <h2 className="font-titulo text-3xl font-bold leading-tight tracking-tight">{q.titulo}</h2>
        </div>
        {q.hecha && (
          <span className="flex items-center gap-2 self-start rounded-full bg-bien-suave px-3 py-1 text-base font-semibold text-bien-tinta">
            <Check className="size-5" /> Hecha
          </span>
        )}
        {texto && <p className="text-lg leading-relaxed text-zinc-700">{texto}</p>}
        {q.tipo === 'meta' && (
          <p className="font-dato text-base font-medium text-zinc-600" data-nivel-meta>
            Tu nivel: {Math.min(nivelMax(q.modo), 10)} · meta: {q.nivel}
          </p>
        )}
        {bloqueada && anterior && (
          <p className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-base text-zinc-600">
            <Candado className="size-5 shrink-0" /> Antes: {anterior.titulo}
          </p>
        )}
        {q.tipo === 'reto' && !bloqueada && (
          <Pulsable
            data-foco
            onClick={() => guardarReto(q.id, { hecho: !q.hecha })}
            aria-pressed={q.hecha}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl text-lg font-semibold ${
              q.hecha ? 'bg-bien-relleno text-blanco' : 'bg-zinc-900 text-white'
            }`}
          >
            {q.hecha && <Check className="size-5" />}
            {q.hecha ? '¡Hecho!' : 'Lo hice'}
          </Pulsable>
        )}
        {boton && (
          <Pulsable
            data-foco
            href={boton.href}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl text-lg font-semibold text-blanco"
            style={{ backgroundColor: oscuro(ruta.acento), boxShadow: `0 5px 0 ${labio(ruta.acento)}` }}
          >
            {boton.texto}
            {boton.detalle && <span className="font-dato text-sm font-medium text-blanco/80">· {boton.detalle}</span>}
          </Pulsable>
        )}
      </div>
    </Hoja>
  )
}

