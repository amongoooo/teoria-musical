import { animate, motion, useAnimationControls, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { MINUTOS_DIA, setPrograma, useOpciones } from '../progress/opciones.js'
import { Luna, Sol } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

// Opciones → Apariencia → «Programar» (pedido del usuario): a qué hora del día empieza el modo claro (sol, punto
// amarillo) y a cuál el oscuro (luna, punto azul), sobre una BARRA DEL DÍA (0 a 24 h, 24 partes).
//  - Tocar el sol o la luna lo elige y la barra se resalta (sin texto): ahí hay que poner el punto.
//  - Los puntos caen solo en las horas exactas, con un imán (resorte); nunca entre dos horas.
//  - Mantener un punto 1 s sobre la misma hora hace ZOOM a 2 horas alrededor (14–16 h si estaba en las 15), con
//    marcas cada 5 min; el rango no se mueve hasta soltar, y al soltar vuelve a 0–24 h.
//  - Color de la barra: cada punto pinta desde su hora hacia la derecha hasta el otro (dando la vuelta: la barra es
//    el ciclo del día); con un solo punto, toda la barra es de su color; sin puntos, un degradado ligero de noche y día.

const DIA = MINUTOS_DIA
const HORA = 60
/** Zoom: tras `mantener` ms quieto en una hora, muestra `ancho` minutos con puntos cada `paso` minutos. */
const ZOOM = { mantener: 1000, ancho: 120, paso: 5 }
const TOQUE = 24 // px alrededor de un punto puesto que sirven para tomarlo
const PUNTOS = {
  claro: { nombre: 'Modo claro', Icono: Sol, color: 'var(--color-dia)', icono: 'var(--color-negro)' },
  oscuro: { nombre: 'Modo oscuro', Icono: Luna, color: 'var(--color-noche)', icono: 'var(--color-blanco)' },
}
const CLAVES = ['claro', 'oscuro']
const otro = (k) => (k === 'claro' ? 'oscuro' : 'claro')

export function hora(m) {
  if (m == null) return '--:--'
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Qué punto manda en el minuto `m`: el último que hay a su izquierda (dando la vuelta a medianoche). */
function quienManda({ claro, oscuro }, m) {
  if (claro == null && oscuro == null) return null
  if (oscuro == null) return 'claro'
  if (claro == null) return 'oscuro'
  return (m - oscuro + DIA) % DIA < (claro - oscuro + DIA) % DIA ? 'oscuro' : 'claro'
}

const mezcla = (color, pct) => `color-mix(in oklab, ${color} ${pct}%, var(--color-white))`

/** Fondo de la barra para el rango [a, b]: tramos con bordes duros o, sin puntos, el degradado de noche y día. */
function fondo(p, a, b) {
  const pct = (m) => `${(((m - a) / (b - a)) * 100).toFixed(3)}%`
  if (p.claro == null && p.oscuro == null) {
    const n = mezcla(PUNTOS.oscuro.color, 55)
    const d = mezcla(PUNTOS.claro.color, 55)
    // Noche, amanece hacia las 7, día, anochece hacia las 19, noche.
    const paradas = [[0, n], [5 * HORA, n], [8 * HORA, d], [17 * HORA, d], [20 * HORA, n], [DIA, n]]
    return `linear-gradient(to right, ${paradas.map(([m, c]) => `${c} ${pct(m)}`).join(', ')})`
  }
  const cortes = [a, ...[p.claro, p.oscuro].filter((m) => m != null && m > a && m < b).sort((x, y) => x - y), b]
  const partes = []
  for (let i = 0; i < cortes.length - 1; i++) {
    const c = PUNTOS[quienManda(p, (cortes[i] + cortes[i + 1]) / 2)].color
    partes.push(`${c} ${pct(cortes[i])}`, `${c} ${pct(cortes[i + 1])}`)
  }
  return `linear-gradient(to right, ${partes.join(', ')})`
}

export default function ProgramarTema() {
  const { programa } = useOpciones()
  const reducir = useReducedMotion()
  const [eligiendo, setEligiendo] = useState(null) // 'claro' | 'oscuro' | null: el bloque tocado
  const [borrador, setBorrador] = useState(null) // el programa mientras se arrastra un punto
  const borradorRef = useRef(null)
  const p = borrador ?? programa
  const [arrastrando, setArrastrando] = useState(null)
  const [zoom, setZoom] = useState(null) // { a, b } mientras hay zoom

  // Rango visible de la barra (minutos), animado para el zoom.
  const desde = useMotionValue(0)
  const hasta = useMotionValue(DIA)
  const [vista, setVista] = useState({ a: 0, b: DIA })
  useMotionValueEvent(desde, 'change', (a) => setVista((v) => ({ ...v, a })))
  useMotionValueEvent(hasta, 'change', (b) => setVista((v) => ({ ...v, b })))
  const irRango = (a, b) => {
    if (reducir) {
      desde.set(a)
      hasta.set(b)
    } else {
      animate(desde, a, RESORTE.pantalla)
      animate(hasta, b, RESORTE.pantalla)
    }
  }

  // Dónde se dibuja cada punto (minutos): llega a cada hora con un resorte (el imán).
  const mvClaro = useMotionValue(programa.claro ?? 0)
  const mvOscuro = useMotionValue(programa.oscuro ?? 0)
  const mv = { claro: mvClaro, oscuro: mvOscuro }
  useEffect(() => {
    if (borrador) return
    for (const [m, v] of [[mvClaro, programa.claro], [mvOscuro, programa.oscuro]]) {
      if (v != null && !m.isAnimating() && Math.abs(m.get() - v) > 0.5) m.set(v)
    }
  }, [programa.claro, programa.oscuro, borrador, mvClaro, mvOscuro])

  // Al elegir el sol o la luna, la barra da un pop pequeño (además del aro de su color).
  const pop = useAnimationControls()
  useEffect(() => {
    if (eligiendo) pop.start({ scale: [1, 1.035, 1], transition: { duration: 0.28 } })
  }, [eligiendo, pop])

  const barra = useRef(null)
  const g = useRef(null) // gesto: { id, k, m, zoom, timer }
  useEffect(() => () => clearTimeout(g.current?.timer), [])

  const minutoEn = (clientX) => {
    const r = barra.current.getBoundingClientRect()
    return desde.get() + ((clientX - r.left) / r.width) * (hasta.get() - desde.get())
  }
  const xDe = (m) => {
    const r = barra.current.getBoundingClientRect()
    return r.left + ((m - desde.get()) / (hasta.get() - desde.get())) * r.width
  }
  /** La hora exacta más cercana (o, con zoom, los 5 min más cercanos dentro del rango). */
  const ajustar = (bruto, z) => {
    const paso = z ? ZOOM.paso : HORA
    const min = z ? z.a : 0
    const max = z ? Math.min(z.b, DIA - ZOOM.paso) : DIA - HORA
    return Math.max(min, Math.min(max, Math.round(bruto / paso) * paso))
  }

  const llegar = (m) => {
    const d = g.current
    if (!d || m === d.m) return
    d.m = m
    const prog = { ...(borradorRef.current ?? programa), [d.k]: m }
    borradorRef.current = prog
    setBorrador(prog)
    if (reducir) mv[d.k].set(m)
    else animate(mv[d.k], m, RESORTE.pulsar)
    // Quieto 1 s en la misma hora → zoom (una sola vez por gesto).
    clearTimeout(d.timer)
    if (!d.zoom) d.timer = setTimeout(() => acercar(m), ZOOM.mantener)
  }

  const acercar = (m) => {
    const d = g.current
    if (!d) return
    const a = Math.max(0, Math.min(DIA - ZOOM.ancho, m - ZOOM.ancho / 2))
    d.zoom = { a, b: a + ZOOM.ancho }
    setZoom(d.zoom)
    irRango(d.zoom.a, d.zoom.b)
  }

  const alPresionar = (e) => {
    if (g.current) return
    // ¿Tomó un punto ya puesto? (el más cercano); si no, coloca el del bloque elegido.
    let k = null
    let mejor = TOQUE
    for (const c of CLAVES) {
      if (p[c] == null) continue
      const dist = Math.abs(e.clientX - xDe(mv[c].get()))
      if (dist < mejor) {
        mejor = dist
        k = c
      }
    }
    k ??= eligiendo
    if (!k) return
    e.preventDefault()
    barra.current.setPointerCapture?.(e.pointerId)
    let m = ajustar(minutoEn(e.clientX), null)
    if (m === p[otro(k)]) m = m + HORA <= DIA - HORA ? m + HORA : m - HORA // nunca dos puntos en la misma hora
    if (p[k] == null) mv[k].set(m) // un punto nuevo aparece directo donde cae el dedo
    g.current = { id: e.pointerId, k, m: null, zoom: null, timer: null }
    setArrastrando(k)
    llegar(m)
  }

  const alMover = (e) => {
    const d = g.current
    if (!d || e.pointerId !== d.id) return
    const m = ajustar(minutoEn(e.clientX), d.zoom)
    if (m === (borradorRef.current ?? programa)[otro(d.k)]) return // no se encima con el otro
    llegar(m)
  }

  const alSoltar = (e) => {
    const d = g.current
    if (!d || e.pointerId !== d.id) return
    clearTimeout(d.timer)
    g.current = null
    if (d.zoom) {
      setZoom(null)
      irRango(0, DIA)
    }
    if (borradorRef.current) setPrograma(borradorRef.current)
    borradorRef.current = null
    setBorrador(null)
    setArrastrando(null)
    setEligiendo(null)
  }

  // Marcas: cada hora (las de 0, 6, 12 y 18 más largas); con zoom, cada 5 min (las de las horas más largas).
  const { a, b } = vista
  const ancho = b - a
  const paso = ancho > 300 ? HORA : ZOOM.paso
  const marcas = []
  for (let m = Math.ceil(a / paso) * paso; m <= b + 0.01; m += paso) marcas.push(m)
  const larga = (m) => m % (paso === HORA ? 6 * HORA : HORA) === 0
  const etiquetas =
    ancho > 300
      ? [0, 6, 12, 18, 24].map((h) => ({ m: h * HORA, texto: String(h) }))
      : marcas.filter((m) => m % HORA === 0).map((m) => ({ m, texto: m === DIA ? '24:00' : hora(m) }))
  const pct = (m) => `${((m - a) / ancho) * 100}%`
  const colorElegido = eligiendo ? PUNTOS[eligiendo].color : null

  return (
    <div className="flex flex-col gap-3" data-programar>
      <div className="grid grid-cols-2 gap-2">
        {CLAVES.map((k) => {
          const { Icono, nombre, color, icono } = PUNTOS[k]
          const activo = eligiendo === k
          return (
            <Pulsable
              key={k}
              tipo="tarjeta"
              onClick={() => setEligiendo(activo ? null : k)}
              aria-pressed={activo}
              aria-label={`${nombre}: ${p[k] == null ? 'sin hora' : hora(p[k])}`}
              data-bloque={k}
              className="flex min-h-16 items-center gap-3 rounded-2xl border-2 px-3 transition-colors duration-200"
              style={{ borderColor: activo ? color : 'var(--color-zinc-200)', backgroundColor: activo ? mezcla(color, 16) : 'var(--color-white)' }}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: color, color: icono }}>
                <Icono className="size-5" />
              </span>
              <span className={`whitespace-nowrap font-dato text-2xl font-medium tabular-nums ${p[k] == null ? 'text-zinc-400' : 'text-zinc-900'}`} data-hora={k}>
                {hora(p[k])}
              </span>
            </Pulsable>
          )
        })}
      </div>

      {/* La barra del día. `data-sin-arrastre`: arrastrar aquí no mueve la hoja de Opciones. */}
      <div className="px-3.5" data-sin-arrastre>
        <div
          ref={barra}
          data-barra-dia
          data-eligiendo={eligiendo ?? undefined}
          data-arrastrando={arrastrando ?? undefined}
          data-zoom={zoom ? `${zoom.a}-${zoom.b}` : undefined}
          className="relative h-14 select-none"
          style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onContextMenu={(e) => e.preventDefault()}
        >
          <motion.div
            animate={pop}
            className="absolute inset-x-0 top-4 h-6 rounded-full transition-shadow duration-200"
            style={{ boxShadow: colorElegido ? `0 0 0 4px ${mezcla(colorElegido, 45)}` : '0 0 0 0 transparent' }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full" data-fondo style={{ backgroundImage: fondo(p, a, b) }} />
          </motion.div>
          {marcas.map((m) => (
            <span
              key={`${paso}-${m}`}
              aria-hidden
              className={`absolute top-11 w-px -translate-x-1/2 ${larga(m) ? 'h-2.5 bg-zinc-500' : 'h-1.5 bg-zinc-300'}`}
              style={{ left: pct(m) }}
            />
          ))}
          {CLAVES.map((k) =>
            p[k] == null ? null : <Punto key={k} k={k} mv={mv[k]} desde={desde} hasta={hasta} activo={arrastrando === k} />,
          )}
        </div>
        <div className="relative h-5 font-dato text-sm tabular-nums text-zinc-500" aria-hidden>
          {etiquetas.map(({ m, texto }) => (
            <span key={`${paso}-${m}`} className="absolute -translate-x-1/2" style={{ left: pct(m) }}>
              {texto}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Un punto sobre la barra (amarillo = claro, azul = oscuro). Crece mientras se arrastra. */
function Punto({ k, mv, desde, hasta, activo }) {
  const left = useTransform(() => `${((mv.get() - desde.get()) / (hasta.get() - desde.get())) * 100}%`)
  const opacity = useTransform(() => (mv.get() < desde.get() - 1 || mv.get() > hasta.get() + 1 ? 0 : 1))
  return (
    <motion.span
      aria-hidden
      data-punto={k}
      className="pointer-events-none absolute top-7 -mt-3.5 -ml-3.5 size-7 rounded-full border-[3px] border-white shadow-[0_2px_8px_rgb(16_18_28/0.3)]"
      style={{ left, opacity, backgroundColor: PUNTOS[k].color }}
      initial={{ scale: 0 }}
      animate={{ scale: activo ? 1.25 : 1 }}
      transition={RESORTE.pulsar}
    />
  )
}
