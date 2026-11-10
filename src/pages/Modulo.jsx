import { motion } from 'motion/react'
import { getLeccion, getModulo, leccionDisponible } from '../content/index.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { oscuro } from '../ui/color.js'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import Volver from '../ui/Volver.jsx'

export default function Modulo({ numero }) {
  const modulo = getModulo(numero)
  const progreso = useProgreso()

  if (!modulo) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
        <p className="text-lg text-zinc-500">Este módulo no existe.</p>
        <Pulsable href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
          Volver al inicio
        </Pulsable>
      </main>
    )
  }

  const hechas = modulo.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const total = modulo.lecciones.length

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-6 sm:py-10"
    >
      <Volver href={rutas.inicio()}>Inicio</Volver>

      <motion.header variants={itemLista} className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: oscuro(modulo.acento) }}>
          Módulo {modulo.numero}
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{modulo.titulo}</h1>
        <p className="text-lg text-zinc-600">{modulo.descripcion}</p>
        <div className="flex items-center gap-3">
          <BarraProgreso valor={total ? hechas / total : 0} color={modulo.acento} className="flex-1" />
          <span className="text-sm tabular-nums text-zinc-500">
            {hechas}/{total}
          </span>
        </div>
      </motion.header>

      <ol className="flex flex-col gap-3">
        {modulo.lecciones.map((l) => {
          const disponible = leccionDisponible(l.id)
          const p = progreso.lecciones[l.id]
          const estado = p?.completada ? 'hecha' : p?.paso > 0 ? 'empezada' : null
          const contenido = (
            <>
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-full text-base font-bold ${
                  estado === 'hecha' ? 'text-white' : disponible ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-100 text-zinc-500'
                }`}
                style={estado === 'hecha' ? { backgroundColor: oscuro(modulo.acento) } : undefined}
              >
                {estado === 'hecha' ? '✓' : l.id}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className={`text-lg font-semibold leading-snug ${disponible ? 'text-zinc-900' : 'text-zinc-500'}`}>
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
                {/* Lección a medias: cuánto llevas */}
                {disponible && estado === 'empezada' && (
                  <BarraProgreso valor={p.paso / getLeccion(l.id).pasos.length} color={modulo.acento} fondo="bg-zinc-100" alto="h-1.5" className="mt-1 w-24" />
                )}
              </span>
              {disponible && <span aria-hidden className="text-2xl text-zinc-300">›</span>}
            </>
          )
          return (
            <motion.li key={l.id} variants={itemLista}>
              {disponible ? (
                <Pulsable
                  href={rutas.leccion(l.id)}
                  tipo="tarjeta"
                  className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-3"
                >
                  {contenido}
                </Pulsable>
              ) : (
                <div className="flex min-h-20 items-center gap-4 rounded-3xl border border-dashed border-zinc-300 px-4 py-3">
                  {contenido}
                </div>
              )}
            </motion.li>
          )
        })}
      </ol>

      <motion.section variants={itemLista} className="flex flex-col gap-4 rounded-3xl bg-zinc-100 p-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-800">¿Qué se siente?</h2>
          <p className="text-base text-zinc-600">{modulo.siente}</p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-800">Reto del módulo en FL Studio</h2>
          <p className="text-base text-zinc-600">{modulo.reto}</p>
        </div>
      </motion.section>
    </motion.main>
  )
}
