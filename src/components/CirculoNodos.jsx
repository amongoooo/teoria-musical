import { animate, motion, useAnimate, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Note } from 'tonal'
import { CIRCULO, armaduraMayor, notasTonalidad } from '../theory/escalas.js'
import { claro, oscuro, tinta } from '../ui/color.js'
import { RESORTE } from '../ui/movimiento.js'
import { datosCasilla, idCasilla, textoArmadura } from './CirculoQuintas.jsx'

// Círculo de quintas de NODOS (explorador #/circulo; pedido del usuario: «que las notas sean nodos sin color»).
// Las 12 mayores son nodos sobre una línea gris (Do arriba, una 5.ª más en el sentido del reloj) y las relativas
// menores, nodos más chicos por dentro. Sin elegir, ningún nodo tiene color; al elegir una tonalidad SE PRENDEN
// sus 7 notas (siempre 7 seguidas en el círculo) y una línea turquesa las une; al pasar a otra, la línea gira con
// resorte. El nodo de una nota que suena se prende en celeste. Ids como en CirculoQuintas: 'G', 'Em', 'F#m'.

const R = { fuera: 140, dentro: 84 }
const NODO = { mayor: 25, menor: 17 } // radio del nodo
const TOQUE = { mayor: 31, menor: 22 } // radio de la zona táctil (≥ 44 px en el celular)

/** Datos de una tonalidad del círculo: los de la casilla + sus 7 notas, sus vecinas y su relativa. */
export function tonalidad(id) {
  const d = datosCasilla(id)
  const a = armaduraMayor(d.mayor)
  return {
    ...d,
    id,
    notas: notasTonalidad(d.tonica, d.menor),
    armadura: a,
    textoArmadura: textoArmadura(d.mayor),
    subdominante: idCasilla((d.i + 11) % 12, d.menor),
    dominante: idCasilla((d.i + 1) % 12, d.menor),
    relativa: idCasilla(d.i, !d.menor),
  }
}

/** Estado de cada nodo con `id` elegido: 'elegida' | 'vecina' | 'nota' (una de sus 7 notas) | ''. */
export function estadosNodos(id) {
  if (!id) return {}
  const t = tonalidad(id)
  const cromas = t.notas.map(Note.chroma)
  const e = {}
  CIRCULO.forEach((n, i) => cromas.includes(Note.chroma(n)) && (e[idCasilla(i, false)] = 'nota'))
  e[t.subdominante] = e[t.dominante] = e[t.relativa] = 'vecina'
  e[id] = 'elegida'
  return e
}

function punto(r, grados) {
  const a = ((grados - 90) * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}
function arco(r, g1, g2) {
  const [x1, y1] = punto(r, g1)
  const [x2, y2] = punto(r, g2)
  return `M${x1} ${y1}A${r} ${r} 0 ${g2 - g1 > 180 ? 1 : 0} 1 ${x2} ${y2}`
}

/**
 * Props:
 *  - color: acento (el del Módulo 3)
 *  - seleccion: id elegido (o null: todo apagado)
 *  - sonando: lista de cromas (0–11) que suenan ahora → sus nodos en celeste
 *  - onElegir(id)
 *  - centro: lo que va en el medio
 *  - mini: sin letras ni toques (tarjeta de Inicio)
 */
export default function CirculoNodos({ color, seleccion = null, sonando = [], onElegir, centro, mini = false }) {
  const estados = estadosNodos(seleccion)
  const menores = !mini
  const linea = useRef(null)
  const giro = useMotionValue(seleccion ? datosCasilla(seleccion).i * 30 : 0)
  const reducir = useReducedMotion()

  // La línea encendida va de la vecina de la izquierda (−1) a la 5.ª casilla a la derecha (+5): gira por el camino corto.
  useEffect(() => {
    const pintar = (v) => linea.current?.setAttribute('transform', `rotate(${v})`)
    pintar(giro.get())
    return giro.on('change', pintar)
  }, [giro])
  useEffect(() => {
    if (!seleccion) return
    let destino = datosCasilla(seleccion).i * 30
    const actual = giro.get()
    while (destino - actual > 180) destino -= 360
    while (destino - actual < -180) destino += 360
    const control = animate(giro, destino, reducir ? { duration: 0 } : RESORTE.pantalla)
    return () => control.stop()
  }, [seleccion, giro, reducir])

  const nodos = []
  for (const menor of menores ? [false, true] : [false]) {
    CIRCULO.forEach((_, i) => {
      const id = idCasilla(i, menor)
      const [x, y] = punto(menor ? R.dentro : R.fuera, i * 30)
      const croma = Note.chroma(datosCasilla(id).tonica)
      nodos.push(
        <Nodo
          key={id}
          id={id}
          x={x}
          y={y}
          menor={menor}
          mini={mini}
          color={color}
          estado={estados[id] ?? ''}
          suena={!menor && sonando.includes(croma)}
          onElegir={mini ? null : onElegir}
        />,
      )
    })
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[23rem] select-none" data-circulo-nodos>
      <svg viewBox="-184 -184 368 368" className="size-full overflow-visible" role="group" aria-label="Círculo de quintas">
        <circle r={R.fuera} fill="none" style={{ stroke: 'var(--color-zinc-200)', strokeWidth: mini ? 5 : 2 }} />
        {menores && <circle r={R.dentro} fill="none" style={{ stroke: 'var(--color-zinc-200)', strokeWidth: 2 }} />}
        <g ref={linea} style={{ opacity: seleccion ? 1 : 0, transition: 'opacity 200ms' }}>
          <path
            d={arco(R.fuera, -30, 150)}
            fill="none"
            strokeLinecap="round"
            data-linea-encendida
            style={{ stroke: color, strokeWidth: mini ? 14 : 5, opacity: 0.55 }}
          />
        </g>
        {nodos}
      </svg>
      {centro && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center"
        >
          {centro}
        </div>
      )}
    </div>
  )
}

function Nodo({ id, x, y, menor, mini, color, estado, suena, onElegir }) {
  const [scope, animar] = useAnimate()
  const antes = useRef(estado)
  const d = datosCasilla(id)

  // Al prenderse (o al ser la elegida) da un pop.
  useEffect(() => {
    const era = antes.current
    antes.current = estado
    if (estado === era || !scope.current) return
    if ((estado && !era) || estado === 'elegida') animar(scope.current, { scale: [0.82, 1.14, 1] }, { duration: 0.38, ease: 'easeOut' })
  }, [estado, animar, scope])

  const encendido = estado === 'nota' || estado === 'vecina'
  const relleno = suena ? 'var(--color-sky-500)' : estado === 'elegida' ? oscuro(color) : encendido ? claro(color) : 'var(--color-white)'
  const borde = suena ? 'var(--color-sky-500)' : estado === 'elegida' ? oscuro(color) : encendido ? color : 'var(--color-zinc-300)'
  const texto = suena || estado === 'elegida' ? 'var(--color-blanco)' : encendido ? tinta(color) : menor ? 'var(--color-zinc-600)' : 'var(--color-zinc-700)'
  const r = mini ? 30 : menor ? NODO.menor : NODO.mayor
  const armadura = !menor && !mini ? textoArmadura(d.mayor) : null
  const activo = !!onElegir

  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g
        role={activo ? 'button' : undefined}
        aria-label={activo ? d.nombre : undefined}
        aria-pressed={activo ? estado === 'elegida' : undefined}
        tabIndex={activo ? 0 : undefined}
        data-nodo={id}
        data-estado={estado}
        data-suena={suena || undefined}
        onPointerDown={activo ? (e) => (e.preventDefault(), onElegir(id)) : undefined}
        onKeyDown={activo ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), e.stopPropagation(), onElegir(id)) : undefined}
        whileTap={activo ? { scale: 0.92 } : undefined}
        transition={RESORTE.pulsar}
        style={{ cursor: activo ? 'pointer' : 'default', outline: 'none', touchAction: 'manipulation' }}
      >
        {activo && <circle r={menor ? TOQUE.menor : TOQUE.mayor} fill="transparent" />}
        <g ref={scope} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle
            r={r}
            style={{
              fill: relleno,
              stroke: borde,
              strokeWidth: estado === 'vecina' ? 3.5 : 2,
              transition: suena ? 'fill 60ms, stroke 60ms' : 'fill 220ms, stroke 220ms, stroke-width 220ms',
            }}
          />
          {!mini && (
            <text
              y={armadura ? -5 : 0}
              textAnchor="middle"
              dominantBaseline="central"
              className={menor ? 'font-sans text-[11px] font-semibold' : 'font-titulo text-[15px] font-bold'}
              style={{ fill: texto, transition: 'fill 220ms' }}
            >
              {d.corto}
            </text>
          )}
          {armadura && (
            <text
              y={11}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-dato text-[10.5px] font-medium"
              style={{ fill: texto, opacity: 0.75, transition: 'fill 220ms' }}
            >
              {armadura}
            </text>
          )}
        </g>
      </motion.g>
    </g>
  )
}

/** Centro: la tonalidad, su armadura en corto y su relativa. */
export function CentroNodos({ id, color }) {
  if (!id) return null
  const t = tonalidad(id)
  const pareja = datosCasilla(t.relativa).nombre
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={RESORTE.pulsar}
      className="flex flex-col items-center gap-0.5"
      data-centro={id}
    >
      <span className="font-titulo text-[17px] font-bold leading-tight" style={{ color: tinta(color) }}>
        {t.nombre}
      </span>
      <span className="font-dato text-sm font-medium leading-tight text-zinc-600">{t.textoArmadura === '0' ? 'sin ♯ ni ♭' : t.textoArmadura}</span>
      <span className="text-sm leading-tight text-zinc-500">↔ {pareja}</span>
    </motion.div>
  )
}

