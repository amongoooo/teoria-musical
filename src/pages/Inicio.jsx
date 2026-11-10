import { motion } from 'motion/react'
import BotonOpciones from '../components/Opciones.jsx'
import { Cuadrito } from '../components/NavegadorModulos.jsx'
import Piano from '../components/Piano.jsx'
import { leccionesDisponibles, MODULOS, moduloDisponible } from '../content/index.js'
import { META_SEGUNDOS, datosDeHoy, rachaActual, useOido } from '../progress/oido.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { oscuro } from '../ui/color.js'

export default function Inicio() {
  const progreso = useProgreso()
  const disponibles = leccionesDisponibles()
  // Siguiente lección: la primera sin completar (o la última si ya hiciste todas).
  const siguiente = disponibles.find((l) => !progreso.lecciones[l.id]?.completada)
  const destacada = siguiente ?? disponibles[disponibles.length - 1]
  const p = destacada ? progreso.lecciones[destacada.id] : null
  const textoBoton = !siguiente ? 'Repasar' : p?.paso > 0 ? 'Continuar' : 'Empezar'

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-5 py-10 sm:py-16"
    >
      <motion.header variants={itemLista} className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Teoría Musical</h1>
          <BotonOpciones className="mt-0.5 sm:mt-3" />
        </div>
        <p className="text-lg text-zinc-500 sm:text-xl">
          Aprende teoría musical y producción en FL Studio, paso a paso y tocando.
        </p>
      </motion.header>

      {destacada && (
        <motion.section
          variants={itemLista}
          className="flex flex-col gap-4 rounded-3xl p-6 text-blanco"
          style={{ backgroundColor: oscuro(destacada.modulo.acento) }}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-blanco/90">
            {siguiente ? 'Tu siguiente lección' : '¡Todo al día!'} · Módulo {destacada.modulo.numero}
          </span>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            {destacada.id} · {destacada.titulo}
          </h2>
          {!siguiente && <p className="text-base text-blanco/90">Completaste todas las lecciones disponibles. Vienen más pronto.</p>}
          <Pulsable
            href={rutas.leccion(destacada.id)}
            className="grid min-h-14 place-items-center rounded-2xl bg-blanco px-6 text-lg font-semibold text-negro"
          >
            {textoBoton}
          </Pulsable>
        </motion.section>
      )}

      <motion.div variants={itemLista}>
        <TarjetaOido />
      </motion.div>

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Módulos</h2>
        {/* Cada módulo es un cuadrito con su número y su título; al tocarlo se despliegan sus islas. */}
        <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
          {MODULOS.map((m) => {
            const disponible = moduloDisponible(m)
            const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
            const contenido = (
              <>
                <Cuadrito modulo={m} disponible={disponible} tam={76} />
                <span className={`line-clamp-3 text-base font-semibold leading-snug ${disponible ? 'text-zinc-900' : 'text-zinc-500'}`}>{m.titulo}</span>
                <span className="text-sm tabular-nums text-zinc-500">{disponible ? `${hechas}/${m.lecciones.length}` : 'Próximamente'}</span>
              </>
            )
            return (
              <li key={m.numero}>
                {disponible ? (
                  <Pulsable
                    href={rutas.modulo(m.numero)}
                    tipo="tarjeta"
                    aria-label={`Módulo ${m.numero}: ${m.titulo}. ${hechas} de ${m.lecciones.length} lecciones`}
                    className="flex min-h-11 flex-col items-center gap-2 rounded-3xl px-1 pt-1 pb-2 text-center"
                  >
                    {contenido}
                  </Pulsable>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-1 pt-1 pb-2 text-center" aria-label={`Módulo ${m.numero}: ${m.titulo}. Próximamente`}>
                    {contenido}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Piano libre</h2>
        <Piano />
      </motion.section>
    </motion.main>
  )
}
/** Acceso al entrenamiento de oído con la racha y el avance de hoy. */
function TarjetaOido() {
  const oido = useOido()
  const dia = datosDeHoy(oido)
  const racha = rachaActual(oido)
  const avance = Math.min(1, dia.segundos / META_SEGUNDOS)
  const cumplida = avance >= 1
  return (
    <Pulsable
      href={rutas.oido()}
      tipo="tarjeta"
      className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-2xl" aria-hidden>
          👂
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-xl font-bold leading-snug">Entrenamiento de oído</span>
          <span className="text-sm text-zinc-500">
            {cumplida ? '¡Hecho por hoy!' : 'Práctica diaria de 5 minutos'} · 🔥 {racha} {racha === 1 ? 'día' : 'días'}
          </span>
        </span>
        <span aria-hidden className="text-2xl text-zinc-300">›</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
        <motion.div
          className={`h-full rounded-full ${cumplida ? 'bg-emerald-500' : 'bg-sky-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${avance * 100}%` }}
          transition={{ ...RESORTE.suave, delay: 0.25 }}
        />
      </div>
    </Pulsable>
  )
}
