import { motion } from 'motion/react'
import { META_SEGUNDOS } from '../progress/entrenamiento.js'
import { TIENDAS_PRACTICA, TarjetaHoy } from '../components/Tarjetas.jsx'
import { rutas } from '../router.js'
import { labio, oscuro, tinta, claro } from '../ui/color.js'
import { Metronomo, Oreja, Pluma } from '../ui/Iconos.jsx'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

const MELODIA = 'var(--color-melodia)'
const ARMONIA = 'var(--color-armonia)'
const RITMO = 'var(--color-ritmo)'
const LETRAS = 'var(--color-letras)'

/**
 * Las prácticas: el panel de cada una (su racha y sus minutos) y sus modos a un toque. Oído no es un área: el bloque va
 * en Melodía y cada modo en el color de lo que entrena (Intervalos y Oído absoluto → Melodía, Acordes → Armonía).
 */
const PRACTICAS = [
  {
    id: 'oido',
    nombre: 'Oído',
    titulo: 'Entrenamiento de oído',
    Icono: Oreja,
    acento: MELODIA,
    panel: rutas.oido(),
    modos: [
      { id: 'intervalos', nombre: 'Intervalos', acento: MELODIA, href: rutas.oido('intervalos') },
      { id: 'acordes', nombre: 'Acordes', acento: ARMONIA, href: rutas.oido('acordes') },
      { id: 'absoluto', nombre: 'Oído absoluto', acento: MELODIA, href: rutas.oido('absoluto') },
    ],
  },
  {
    id: 'ritmo',
    nombre: 'Ritmo',
    titulo: 'Entrenamiento de ritmo',
    Icono: Metronomo,
    acento: RITMO,
    panel: rutas.ritmo(),
    modos: [
      { id: 'seguir', nombre: 'Seguir', acento: RITMO, href: rutas.ritmo('seguir') },
      { id: 'eco', nombre: 'Eco', acento: RITMO, href: rutas.ritmo('eco') },
    ],
  },
  {
    id: 'letras',
    nombre: 'Letras',
    titulo: 'Entrenamiento de letras',
    Icono: Pluma,
    acento: LETRAS,
    panel: rutas.letras(),
    modos: [
      { id: 'cuaderno', nombre: 'Cuaderno', acento: LETRAS, href: rutas.letras() },
      { id: 'vocabulario', nombre: 'Vocabulario', acento: LETRAS, href: rutas.vocabulario() },
    ],
  },
]

/**
 * Pestaña PRACTICAR (fase 3 del rediseño; maqueta aprobada: https://claude.ai/artifact/6EWwNQ4puh3mtiT1T8Pfne): «Hoy»
 * arriba y un bloque por práctica (antes en Inicio): su insignia, nombre, racha y minutos de hoy (lleva a su panel) y
 * sus modos a un toque (abren el arranque del entrenador o el cuaderno).
 */
export default function Practicar() {
  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-5 pt-6 pb-36 sm:pt-8"
    >
      <motion.h1 variants={itemLista} className="font-titulo text-4xl font-extrabold tracking-tight">
        Practicar
      </motion.h1>
      <motion.div variants={itemLista}>
        <TarjetaHoy />
      </motion.div>
      {PRACTICAS.map((p) => (
        <motion.div key={p.id} variants={itemLista}>
          <BloquePractica practica={p} />
        </motion.div>
      ))}
    </motion.main>
  )
}

function BloquePractica({ practica: p }) {
  const { tienda } = TIENDAS_PRACTICA.find((t) => t.id === p.id)
  const estado = tienda.usar()
  const racha = tienda.rachaActual(estado)
  const minutos = Math.floor(tienda.datosDeHoy(estado).segundos / 60)
  const meta = Math.round(META_SEGUNDOS / 60)
  const Icono = p.Icono
  return (
    <section className="flex flex-col gap-3 rounded-[1.75rem] border-2 border-zinc-200 bg-white p-3" style={{ boxShadow: '0 5px 0 var(--color-zinc-200)' }}>
      <Pulsable
        href={p.panel}
        tipo="tarjeta"
        data-entrenamiento={p.id}
        aria-label={`${p.titulo}: racha de ${racha} ${racha === 1 ? 'día' : 'días'}`}
        className="flex items-center gap-3 rounded-2xl text-left"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-blanco" style={{ backgroundColor: oscuro(p.acento), boxShadow: `0 4px 0 ${labio(p.acento)}` }} aria-hidden>
          <Icono className="size-8" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-juego text-xl font-semibold uppercase tracking-wide text-zinc-900">{p.nombre}</span>
          <span className="font-juego text-base tabular-nums" style={{ color: tinta(p.acento) }}>
            {racha} {racha === 1 ? 'día' : 'días'} · {Math.min(minutos, meta)}/{meta} min
          </span>
        </span>
        <span className="pr-2 text-3xl font-semibold text-zinc-400" aria-hidden>
          ›
        </span>
      </Pulsable>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {p.modos.map((m) => (
          <Pulsable
            key={m.id}
            href={m.href}
            data-modo-practica={m.id}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-center text-base font-bold leading-tight"
            style={{ backgroundColor: claro(m.acento), color: tinta(m.acento) }}
          >
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: m.acento }} aria-hidden />
            {m.nombre}
          </Pulsable>
        ))}
      </div>
    </section>
  )
}
