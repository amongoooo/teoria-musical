import { motion } from 'motion/react'
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
  const abiertos = MODULOS.filter(moduloDisponible)
  const proximos = MODULOS.filter((m) => !moduloDisponible(m))

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-5 py-10 sm:py-16"
    >
      <motion.header variants={itemLista} className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Teoría Musical</h1>
        <p className="text-lg text-zinc-500 sm:text-xl">
          Aprende teoría musical y producción en FL Studio, paso a paso y tocando.
        </p>
      </motion.header>

      {destacada && (
        <motion.section
          variants={itemLista}
          className="flex flex-col gap-4 rounded-3xl p-6 text-white"
          style={{ backgroundColor: oscuro(destacada.modulo.acento) }}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-white/90">
            {siguiente ? 'Tu siguiente lección' : '¡Todo al día!'} · Módulo {destacada.modulo.numero}
          </span>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            {destacada.id} · {destacada.titulo}
          </h2>
          {!siguiente && <p className="text-base text-white/90">Completaste todas las lecciones disponibles. Vienen más pronto.</p>}
          <Pulsable
            href={rutas.leccion(destacada.id)}
            className="grid min-h-14 place-items-center rounded-2xl bg-white px-6 text-lg font-semibold text-zinc-900"
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
        <ol className="flex flex-col gap-3">
          {abiertos.map((m) => {
            const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
            return (
              <li key={m.numero}>
                <Pulsable
                  href={rutas.modulo(m.numero)}
                  tipo="tarjeta"
                  className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white"
                    style={{ backgroundColor: oscuro(m.acento) }}
                  >
                    {m.numero}
                  </span>
                  <span className="flex flex-1 flex-col gap-1.5">
                    <span className="text-lg font-semibold leading-snug text-zinc-900">{m.titulo}</span>
                    <span className="flex items-center gap-2 text-sm text-zinc-500">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ backgroundColor: m.acento }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(hechas / m.lecciones.length) * 100}%` }}
                          transition={{ ...RESORTE.suave, delay: 0.25 }}
                        />
                      </span>
                      {hechas}/{m.lecciones.length} lecciones
                    </span>
                  </span>
                  <span aria-hidden className="text-2xl text-zinc-300">›</span>
                </Pulsable>
              </li>
            )
          })}
        </ol>

        {/* Los módulos que aún no existen: compactos, para no empujar todo hacia abajo. */}
        {proximos.length > 0 && (
          <div className="flex flex-col gap-1 rounded-3xl border border-dashed border-zinc-300 px-4 py-3">
            <p className="py-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Próximamente</p>
            <ol className="flex flex-col">
              {proximos.map((m) => (
                <li key={m.numero} className="flex items-center gap-3 py-1.5 text-base text-zinc-600">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-500">
                    {m.numero}
                  </span>
                  {m.titulo}
                </li>
              ))}
            </ol>
          </div>
        )}
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
