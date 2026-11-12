import { animate, motion, useAnimationControls, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { MINUTOS_DIA, setPrograma, setReloj, useOpciones } from '../progress/opciones.js'
import { Luna, Sol } from '../ui/Iconos.jsx'
import { HUNDIR, RESORTE } from '../ui/movimiento.js'
import { useTemblorCreciente } from '../ui/useTemblor.js'

// Opciones → Apariencia → «Programar» (pedido del usuario): a qué hora del día empieza el modo claro (sol, punto
// amarillo) y a cuál el oscuro (luna, punto azul), sobre una BARRA DEL DÍA (0 a 24 h, 24 partes).
//  - Bloques: sin hora puesta, un cuadrito del color del punto con su ícono; con hora, ícono + hora. Tocar el borde
//    o el ícono elige el punto y la barra se resalta (sin texto); tocar la hora cambia 24 h ↔ am/pm; mantener
//    pulsado dibuja un contorno que da la vuelta como un reloj (1,5 s) y al cerrarse borra el punto.
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
  const { programa, reloj } = useOpciones()
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
      {/* Cada bloque vive en su mitad de la fila (pedido del usuario). */}
      <div className="grid grid-cols-2 gap-2">
        {CLAVES.map((k, i) => (
          <Bloque
            key={k}
            k={k}
            lado={i}
            ambosCerrados={p.claro == null && p.oscuro == null}
            minuto={p[k]}
            activo={eligiendo === k}
            reloj={reloj}
            onElegir={() => setEligiendo((e) => (e === k ? null : k))}
            onBorrar={() => {
              setEligiendo((e) => (e === k ? null : e))
              setPrograma({ ...programa, [k]: null })
            }}
          />
        ))}
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

/** Mantener pulsado un bloque: `reconocer` ms hasta que cuenta como «mantener» y `borrar` ms de reloj hasta borrar. */
const MANTENER = { reconocer: 450, borrar: 1500, mover: 10 }

/** «20:30» o, en am/pm, { hora: '8:30', sufijo: 'pm' }. */
function partesHora(m, reloj) {
  if (reloj !== '12') return { hora: hora(m), sufijo: null }
  const h = Math.floor(m / 60)
  return { hora: `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')}`, sufijo: h < 12 ? 'am' : 'pm' }
}

/**
 * Bloque del sol o de la luna (pedido del usuario). Sin hora: un cuadrito del color del punto con su ícono. Con hora:
 * ícono + hora. Tocar la hora cambia 24 h ↔ am/pm; tocar el borde o el ícono elige el punto; mantener pulsado (también
 * sobre la hora) dibuja un contorno del color del ícono que da la vuelta como un reloj y, al cerrarse, borra el punto.
 */
function Bloque({ k, lado, ambosCerrados, minuto, activo, reloj, onElegir, onBorrar }) {
  const { Icono, nombre, color, icono } = PUNTOS[k]
  const puesto = minuto != null
  const reducir = useReducedMotion()
  const ref = useRef(null)
  const g = useRef(null) // { id, x, y, enHora, largo, timers }
  const [borrando, setBorrando] = useState(null) // { w, h } mientras corre el reloj
  const vuelta = useMotionValue(0)
  // Mientras corre el reloj, el bloque tiembla cada vez más (pedido del usuario).
  const [refTemblor, empezarTemblor, pararTemblor] = useTemblorCreciente()

  const cancelar = () => {
    const d = g.current
    if (!d) return
    d.timers.forEach(clearTimeout)
    g.current = null
    setBorrando(null)
    pararTemblor()
    vuelta.stop()
    vuelta.set(0)
    return d
  }
  useEffect(() => () => g.current?.timers.forEach(clearTimeout), [])

  const alPresionar = (e) => {
    if (e.button > 0) return
    const enHora = Boolean(e.target.closest('[data-hora]'))
    const d = { id: e.pointerId, x: e.clientX, y: e.clientY, enHora, largo: false, timers: [] }
    g.current = d
    if (!puesto) return // sin punto no hay nada que borrar
    d.timers.push(
      setTimeout(() => {
        d.largo = true
        // offsetWidth/Height: sin el «hundirse» (scale) del toque.
        setBorrando({ w: ref.current.offsetWidth, h: ref.current.offsetHeight })
        vuelta.set(0)
        animate(vuelta, 1, reducir ? { duration: MANTENER.borrar / 1000 } : { duration: MANTENER.borrar / 1000, ease: 'linear' })
        empezarTemblor(MANTENER.borrar)
        d.timers.push(
          setTimeout(() => {
            cancelar()
            onBorrar()
          }, MANTENER.borrar),
        )
      }, MANTENER.reconocer),
    )
  }
  const alMover = (e) => {
    const d = g.current
    if (d && e.pointerId === d.id && Math.hypot(e.clientX - d.x, e.clientY - d.y) > MANTENER.mover) cancelar()
  }
  const alSoltar = (e) => {
    const d = g.current
    if (!d || e.pointerId !== d.id) return
    cancelar()
    if (d.largo) return // mantener no es un toque
    if (d.enHora && puesto) setReloj(reloj === '12' ? '24' : '12')
    else onElegir()
  }

  const { hora: texto, sufijo } = puesto ? partesHora(minuto, reloj) : {}

  // Si la hora no cabe (p. ej. «12:00 pm» en una mitad estrecha), se desvanece antes del borde.
  const refHora = useRef(null)
  const [noCabe, setNoCabe] = useState(false)
  useEffect(() => {
    const el = refHora.current
    if (!el) return setNoCabe(false)
    const medir = () => setNoCabe(el.scrollWidth > el.clientWidth + 0.5)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [texto, sufijo, puesto])

  // Dónde va en su mitad: con hora, la llena; sin hora, cuadrito centrado en su mitad; con los dos sin hora, en 1/3 y
  // 2/3 de la fila (2/3 de la mitad izquierda y 1/3 de la derecha).
  const izquierda = puesto ? 0 : ambosCerrados ? (lado === 0 ? 'calc(66.667% - 2rem)' : 'calc(33.333% - 2rem)') : 'calc(50% - 2rem)'
  return (
    <div ref={refTemblor} className="h-16" style={{ width: puesto ? '100%' : '4rem', marginLeft: izquierda }} data-celda={k}>
      <motion.button
        ref={ref}
        type="button"
        layout
        transition={{ layout: RESORTE.suave }}
        whileTap={{ scale: HUNDIR.tarjeta }}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={cancelar}
        onPointerLeave={cancelar}
        onContextMenu={(e) => e.preventDefault()}
        // Teclado (Enter / espacio): elige el punto.
        onClick={(e) => e.detail === 0 && onElegir()}
        aria-pressed={activo}
        aria-label={`${nombre}: ${puesto ? hora(minuto) : 'sin hora'}`}
        data-bloque={k}
        data-puesto={puesto || undefined}
        data-borrando={borrando ? true : undefined}
        className={`relative flex size-full select-none items-center rounded-2xl border-2 transition-colors duration-200 [-webkit-touch-callout:none] ${
          puesto ? 'gap-2.5 px-3' : 'justify-center'
        }`}
        style={{
          touchAction: 'manipulation',
          borderColor: puesto ? (activo ? color : 'var(--color-zinc-200)') : color,
          backgroundColor: puesto ? (activo ? mezcla(color, 16) : 'var(--color-white)') : color,
          // Sin hora y elegido: un aro de su color separado por la superficie.
          boxShadow: !puesto && activo ? `0 0 0 3px var(--color-white), 0 0 0 6px ${mezcla(color, 55)}` : '0 0 0 0 transparent',
        }}
      >
        {puesto ? (
          <>
            <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: color, color: icono }}>
              <Icono className="size-5" />
            </span>
            <span
              ref={refHora}
              data-hora={k}
              data-no-cabe={noCabe || undefined}
              className="flex min-w-0 flex-1 items-baseline gap-1 overflow-hidden whitespace-nowrap py-2 font-dato font-medium tabular-nums text-zinc-900"
              style={noCabe ? { maskImage: MASCARA, WebkitMaskImage: MASCARA } : undefined}
            >
              <span className="text-2xl">{texto}</span>
              {sufijo && <span className="text-sm text-zinc-500">{sufijo}</span>}
            </span>
          </>
        ) : (
          <span className="grid place-items-center" style={{ color: icono }}>
            <Icono className="size-7" />
          </span>
        )}
        {borrando && <ContornoReloj {...borrando} color={color} vuelta={vuelta} />}
      </motion.button>
    </div>
  )
}

/** Desvanecido a la derecha de la hora cuando no cabe (no llega a tocar el borde). */
const MASCARA = 'linear-gradient(to right, black calc(100% - 1.25rem), transparent)'

/** Contorno del bloque que se dibuja como la aguja de un reloj: empieza arriba al centro y da la vuelta. */
function ContornoReloj({ w, h, color, vuelta }) {
  const t = 3 // grosor
  const r = 16 // radio de la esquina (rounded-2xl)
  // Coordenadas de la caja con borde (el svg se coloca 2 px afuera, sobre el borde de 2 px del bloque).
  const x0 = t / 2
  const y0 = t / 2
  const x1 = w - t / 2
  const y1 = h - t / 2
  const c = r - t / 2
  const d = [
    `M ${w / 2} ${y0}`,
    `H ${x1 - c}`,
    `A ${c} ${c} 0 0 1 ${x1} ${y0 + c}`,
    `V ${y1 - c}`,
    `A ${c} ${c} 0 0 1 ${x1 - c} ${y1}`,
    `H ${x0 + c}`,
    `A ${c} ${c} 0 0 1 ${x0} ${y1 - c}`,
    `V ${y0 + c}`,
    `A ${c} ${c} 0 0 1 ${x0 + c} ${y0}`,
    `H ${w / 2}`,
  ].join(' ')
  return (
    <svg aria-hidden className="pointer-events-none absolute -top-0.5 -left-0.5 overflow-visible" width={w} height={h}>
      <motion.path d={d} fill="none" strokeWidth={t} strokeLinecap="round" style={{ stroke: color, pathLength: vuelta }} data-reloj-borrar />
    </svg>
  )
}
