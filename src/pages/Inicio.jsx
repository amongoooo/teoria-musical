import Piano from '../components/Piano.jsx'
import { leccionesDisponibles, MODULOS, moduloDisponible } from '../content/index.js'
import { META_SEGUNDOS, datosDeHoy, rachaActual, useOido } from '../progress/oido.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'

export default function Inicio() {
  const progreso = useProgreso()
  const disponibles = leccionesDisponibles()
  // Siguiente lección: la primera sin completar (o la última si ya hiciste todas).
  const siguiente = disponibles.find((l) => !progreso.lecciones[l.id]?.completada)
  const destacada = siguiente ?? disponibles[disponibles.length - 1]
  const p = destacada ? progreso.lecciones[destacada.id] : null
  const textoBoton = !siguiente ? 'Repasar' : p?.paso > 0 ? 'Continuar' : 'Empezar'

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-5 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Teoría Musical</h1>
        <p className="text-lg text-zinc-500 sm:text-xl">
          Aprende teoría musical y producción en FL Studio, paso a paso y tocando.
        </p>
      </header>

      {destacada && (
        <section
          className="flex flex-col gap-4 rounded-3xl p-6 text-white"
          style={{ backgroundColor: destacada.modulo.acento }}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-white/80">
            {siguiente ? 'Tu siguiente lección' : '¡Todo al día!'} · Módulo {destacada.modulo.numero}
          </span>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            {destacada.id} · {destacada.titulo}
          </h2>
          {!siguiente && <p className="text-base text-white/90">Completaste todas las lecciones disponibles. Vienen más pronto.</p>}
          <a
            href={rutas.leccion(destacada.id)}
            className="grid min-h-14 place-items-center rounded-2xl bg-white px-6 text-lg font-semibold text-zinc-900 transition active:scale-[0.99]"
          >
            {textoBoton}
          </a>
        </section>
      )}

      <TarjetaOido />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Módulos</h2>
        <ol className="flex flex-col gap-3">
          {MODULOS.map((m) => {
            const abierto = moduloDisponible(m)
            const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
            const contenido = (
              <>
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white"
                  style={{ backgroundColor: abierto ? m.acento : '#d4d4d8' }}
                >
                  {m.numero}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={`text-lg font-semibold leading-snug ${abierto ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {m.titulo}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {abierto ? `${hechas}/${m.lecciones.length} lecciones` : 'Próximamente'}
                  </span>
                </span>
                {abierto && <span aria-hidden className="text-2xl text-zinc-300">›</span>}
              </>
            )
            return (
              <li key={m.numero}>
                {abierto ? (
                  <a
                    href={rutas.modulo(m.numero)}
                    className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-3 transition active:scale-[0.99]"
                  >
                    {contenido}
                  </a>
                ) : (
                  <div className="flex min-h-20 items-center gap-4 rounded-3xl border border-dashed border-zinc-200 px-4 py-3">
                    {contenido}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Piano libre</h2>
        <Piano />
      </section>
    </main>
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
    <a
      href={rutas.oido()}
      className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 transition active:scale-[0.99]"
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
        <div
          className={`h-full rounded-full ${cumplida ? 'bg-emerald-500' : 'bg-sky-500'}`}
          style={{ width: `${avance * 100}%` }}
        />
      </div>
    </a>
  )
}
