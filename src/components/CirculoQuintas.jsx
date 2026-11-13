import { motion } from 'motion/react'
import { useState } from 'react'
import { playNotes } from '../audio/engine.js'
import { CIRCULO, armaduraMayor, escalaMayor, escalaMenor, relativaMenor } from '../theory/escalas.js'
import { nombre } from '../theory/notas.js'
import { claro, oscuro, tinta } from '../ui/color.js'
import { Bombilla, Check } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'

// Círculo de quintas táctil (lección 3.5): las 12 mayores en el anillo de fuera (Do arriba; en el sentido
// del reloj, una 5.ª más arriba = un ♯ más) y sus relativas menores en el de dentro. Cada casilla es un botón.
// Identificadores: una mayor es su tónica ('D'); una menor, su tónica + 'm' ('Bm', 'F#m', 'Bbm').

/** Nombre en español sin octava: 'F#' → 'Fa♯'. */
export const es = (n) => nombre(`${n}4`, { octava: false })

/** Id de la casilla i: mayor ('G') o su relativa menor ('Em'). */
export const idCasilla = (i, menor) => (menor ? `${relativaMenor(CIRCULO[i])}m` : CIRCULO[i])

/** Datos de una casilla por su id: { tonica, menor, mayor (la de su casilla), nombre: 'Mi menor', corto: 'Mim' }. */
export function datosCasilla(id) {
  const menor = id.endsWith('m')
  const tonica = menor ? id.slice(0, -1) : id
  const i = menor ? CIRCULO.findIndex((t) => relativaMenor(t) === tonica) : CIRCULO.indexOf(tonica)
  const mayor = CIRCULO[i]
  return { i, tonica, menor, mayor, nombre: `${es(tonica)} ${menor ? 'menor' : 'mayor'}`, corto: `${es(tonica)}${menor ? 'm' : ''}` }
}

/** Armadura en texto: '0', '2♯', '3♭'. */
export function textoArmadura(mayor) {
  const a = armaduraMayor(mayor)
  return a.cantidad ? `${a.cantidad}${a.signo}` : '0'
}

// Geometría (viewBox de 340 × 340 centrado en 0): anillo de fuera, de dentro y el centro.
const R = { fuera: [107, 168], dentro: [64, 105], centro: 62 }
const PASO = 30 // grados por casilla

function punto(r, grados) {
  const a = ((grados - 90) * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}

/** Sector de corona entre los radios r1 y r2, centrado en la casilla i. */
function sector(i, [r1, r2]) {
  const a1 = i * PASO - PASO / 2
  const a2 = i * PASO + PASO / 2
  const [x1, y1] = punto(r2, a1)
  const [x2, y2] = punto(r2, a2)
  const [x3, y3] = punto(r1, a2)
  const [x4, y4] = punto(r1, a1)
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`
}

/**
 * Props:
 *  - color: acento del módulo
 *  - seleccion: id elegido (se pinta en el color del módulo)
 *  - estados: { id: 'bien' | 'mal' } (al comprobar)
 *  - resaltar: ids en el tono suave del módulo (p. ej. el lado de los sostenidos)
 *  - armaduras: muestra «2♯» bajo cada mayor
 *  - menores: muestra el anillo de dentro
 *  - tocable: 'mayor' | 'menor' | 'ambos' | null (qué anillo responde al dedo)
 *  - onElegir(id)
 *  - centro: lo que va en el círculo del medio
 */
export default function CirculoQuintas({
  color,
  seleccion = null,
  estados = {},
  resaltar = [],
  armaduras = true,
  menores = true,
  tocable = 'ambos',
  onElegir,
  centro,
}) {
  const anillos = menores ? [false, true] : [false]
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem] select-none" data-circulo>
      <svg viewBox="-170 -170 340 340" className="size-full overflow-visible" role="group" aria-label="Círculo de quintas">
        {anillos.map((menor) =>
          CIRCULO.map((_, i) => {
            const id = idCasilla(i, menor)
            const activo = tocable === 'ambos' || (!!tocable && (tocable === 'menor') === menor)
            return (
              <Casilla
                key={id}
                i={i}
                id={id}
                menor={menor}
                color={color}
                estado={estados[id] ?? (seleccion === id ? 'elegida' : resaltar.includes(id) ? 'resaltada' : null)}
                armadura={armaduras && !menor ? textoArmadura(CIRCULO[i]) : null}
                activo={activo && !!onElegir}
                onElegir={onElegir}
              />
            )
          }),
        )}
        {!menores && <circle r={R.dentro[1]} fill="var(--color-fondo)" />}
      </svg>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center"
        style={{ width: `${((menores ? R.centro : R.dentro[1]) * 2 * 100) / 340 - 4}%` }}
      >
        {centro}
      </div>
    </div>
  )
}

function Casilla({ i, id, menor, color, estado, armadura, activo, onElegir }) {
  const anillo = menor ? R.dentro : R.fuera
  const medio = (anillo[0] + anillo[1]) / 2
  const [x, y] = punto(medio + (armadura ? 5 : 0), i * PASO)
  const datos = datosCasilla(id)

  const relleno = {
    elegida: oscuro(color),
    bien: 'var(--color-bien-relleno)',
    mal: 'var(--color-fijate)',
    resaltada: claro(color),
  }[estado] ?? (menor ? 'var(--color-zinc-100)' : 'var(--color-white)')
  const texto = {
    elegida: 'var(--color-blanco)',
    bien: 'var(--color-blanco)',
    mal: 'var(--color-zinc-900)',
    resaltada: tinta(color),
  }[estado] ?? (menor ? 'var(--color-zinc-600)' : 'var(--color-zinc-900)')
  const pop = estado === 'elegida' || estado === 'bien'

  return (
    <motion.g
      role={activo ? 'button' : undefined}
      aria-label={activo ? datos.nombre : undefined}
      aria-pressed={activo ? estado === 'elegida' : undefined}
      tabIndex={activo ? 0 : undefined}
      data-casilla={id}
      data-estado={estado ?? ''}
      onPointerDown={activo ? (e) => (e.preventDefault(), onElegir(id)) : undefined}
      onKeyDown={activo ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), e.stopPropagation(), onElegir(id)) : undefined}
      whileTap={activo ? { scale: 0.95 } : undefined}
      animate={pop ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={pop ? { duration: 0.35 } : RESORTE.pulsar}
      style={{ transformBox: 'fill-box', transformOrigin: 'center', cursor: activo ? 'pointer' : 'default', outline: 'none', touchAction: 'manipulation' }}
    >
      <path
        d={sector(i, anillo)}
        style={{ fill: relleno, stroke: 'var(--color-fondo)', strokeWidth: 3, transition: 'fill 200ms' }}
        strokeLinejoin="round"
      />
      <text
        x={x}
        y={y - (armadura ? 9 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        className={menor ? 'font-sans text-[13px] font-semibold' : 'font-titulo text-[19px] font-bold'}
        style={{ fill: texto, transition: 'fill 200ms' }}
      >
        {datos.corto}
      </text>
      {armadura && (
        <text
          x={x}
          y={y + 11}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-dato text-[13px] font-medium"
          style={{ fill: texto, opacity: estado ? 0.9 : 0.6, transition: 'fill 200ms' }}
        >
          {armadura}
        </text>
      )}
    </motion.g>
  )
}

/** Centro del círculo: la tonalidad elegida con su armadura y su relativa (o lo que diga la ronda). */
export function CentroTonalidad({ id, color, armadura = true, relativa = true, estado = null }) {
  if (!id) return null
  const d = datosCasilla(id)
  const a = armaduraMayor(d.mayor)
  const pareja = d.menor ? `${es(d.mayor)} mayor` : `${es(relativaMenor(d.mayor))} menor`
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={RESORTE.pulsar}
      className="flex flex-col items-center gap-0.5"
    >
      {estado === 'bien' && <Check className="size-5 text-bien-tinta" />}
      {estado === 'mal' && <Bombilla className="size-5 text-fijate-tinta" />}
      <span className="font-titulo text-[17px] font-bold leading-tight" style={{ color: tinta(color) }}>
        {d.nombre}
      </span>
      {armadura && (
        <span className="font-dato text-sm font-medium leading-tight text-zinc-600">
          {a.cantidad ? `${a.cantidad}${a.signo} · ${a.notas.map(es).join(' ')}` : 'sin ♯ ni ♭'}
        </span>
      )}
      {relativa && <span className="text-sm leading-tight text-zinc-500">↔ {pareja}</span>}
    </motion.div>
  )
}

/** Escala de una casilla, en un registro cómodo (tónica entre Fa♯3 y Fa4). */
export function escalaDe(id) {
  const d = datosCasilla(id)
  const octava = ['F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].includes(d.tonica) ? 3 : 4
  return (d.menor ? escalaMenor : escalaMayor)(`${d.tonica}${octava}`)
}

/** Círculo para explicar (paso `texto` con `circulo`): tocar una tonalidad la elige y suena su escala. */
export function CirculoSonoro({ circulo, color }) {
  const [id, setId] = useState(circulo.inicial ?? 'C')
  const elegir = (nuevo) => {
    setId(nuevo)
    playNotes(escalaDe(nuevo), { intervalo: 0.17, duracion: 0.35 })
  }
  return (
    <CirculoQuintas
      color={color}
      seleccion={id}
      resaltar={circulo.resaltar ?? []}
      armaduras={circulo.armaduras ?? true}
      menores={circulo.menores ?? true}
      onElegir={elegir}
      centro={<CentroTonalidad id={id} color={color} relativa={circulo.menores ?? true} />}
    />
  )
}
