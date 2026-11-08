import { getModulo, leccionDisponible } from '../content/index.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'

export default function Modulo({ numero }) {
  const modulo = getModulo(numero)
  const progreso = useProgreso()

  if (!modulo) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
        <p className="text-lg text-zinc-500">Este módulo no existe.</p>
        <a href={rutas.inicio()} className="text-lg font-semibold underline">
          Volver al inicio
        </a>
      </main>
    )
  }

  const hechas = modulo.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-6 sm:py-10">
      <a
        href={rutas.inicio()}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-full px-2 text-base font-medium text-zinc-500 active:bg-zinc-200"
      >
        ← Inicio
      </a>

      <header className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: modulo.acento }}>
          Módulo {modulo.numero}
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{modulo.titulo}</h1>
        <p className="text-lg text-zinc-500">{modulo.descripcion}</p>
        <Barra valor={hechas} total={modulo.lecciones.length} color={modulo.acento} />
      </header>

      <ol className="flex flex-col gap-3">
        {modulo.lecciones.map((l) => {
          const disponible = leccionDisponible(l.id)
          const p = progreso.lecciones[l.id]
          const estado = p?.completada ? 'hecha' : p?.paso > 0 ? 'empezada' : null
          const contenido = (
            <>
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-full text-base font-bold ${
                  estado === 'hecha' ? 'text-white' : disponible ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-100 text-zinc-400'
                }`}
                style={estado === 'hecha' ? { backgroundColor: modulo.acento } : undefined}
              >
                {estado === 'hecha' ? '✓' : l.id}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className={`text-lg font-semibold leading-snug ${disponible ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  {l.titulo}
                </span>
                <span className="text-sm text-zinc-500">
                  {!disponible
                    ? 'Próximamente'
                    : estado === 'hecha'
                      ? `Completada${p.total ? ` · ${p.aciertos}/${p.total} aciertos` : ''}`
                      : estado === 'empezada'
                        ? 'Continuar donde lo dejaste'
                        : 'Empezar'}
                </span>
              </span>
              {disponible && <span aria-hidden className="text-2xl text-zinc-300">›</span>}
            </>
          )
          return (
            <li key={l.id}>
              {disponible ? (
                <a
                  href={rutas.leccion(l.id)}
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

      <section className="flex flex-col gap-4 rounded-3xl bg-zinc-100 p-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-800">¿Qué se siente?</h2>
          <p className="text-base text-zinc-600">{modulo.siente}</p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-800">Reto del módulo en FL Studio</h2>
          <p className="text-base text-zinc-600">{modulo.reto}</p>
        </div>
      </section>
    </main>
  )
}

export function Barra({ valor, total, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full" style={{ width: `${total ? (valor / total) * 100 : 0}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm tabular-nums text-zinc-500">
        {valor}/{total}
      </span>
    </div>
  )
}
