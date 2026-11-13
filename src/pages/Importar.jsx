import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useOpciones } from '../progress/opciones.js'
import { datosActuales, importar, leerCodigo, resumen } from '../progress/sincronizar.js'
import { navegar, rutas } from '../router.js'
import { RESORTE, SALTO, SUBE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { BotonInicio } from '../ui/Volver.jsx'
import { Bombilla, Check } from '../ui/Iconos.jsx'

const NOMBRE_TEMA = { claro: 'Claro', oscuro: 'Oscuro', sistema: 'Automático' }

/**
 * #/importar/CÓDIGO: enseña qué trae el código y pregunta antes de cargarlo.
 * Siempre COMBINA con lo de este dispositivo (no borra nada).
 */
export default function Importar({ codigo }) {
  const { tema } = useOpciones()
  const [estado, setEstado] = useState({ fase: 'leyendo' }) // leyendo | error | pregunta | hecho
  const [conTema, setConTema] = useState(true)

  useEffect(() => {
    let vivo = true
    leerCodigo(codigo)
      .then((datos) => vivo && setEstado({ fase: 'pregunta', datos }))
      .catch((e) => vivo && setEstado({ fase: 'error', motivo: e?.message }))
    return () => {
      vivo = false
    }
  }, [codigo])

  const datos = estado.datos
  const trae = datos ? resumen(datos) : null
  const temaDistinto = trae?.tema && trae.tema !== tema

  const combinar = () => {
    importar(datos, { conTema: temaDistinto && conTema })
    setEstado({ fase: 'hecho', datos, despues: resumen({ ...datosActuales(), c: {} }) })
  }

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-10 sm:py-16"
    >
      <motion.div variants={itemLista}>
        <BotonInicio />
      </motion.div>

      <motion.header variants={itemLista} className="flex flex-col gap-3">
        <h1 className="font-titulo text-3xl font-bold tracking-tight sm:text-5xl">Cargar progreso</h1>
        <p className="text-lg leading-relaxed text-zinc-600">
          {estado.fase === 'hecho'
            ? 'Tu progreso de los dos dispositivos ya está junto en este.'
            : 'Progreso que viene de otro dispositivo. Se combina con el de aquí: no se borra nada.'}
        </p>
      </motion.header>

      <motion.div variants={itemLista} className="flex flex-col gap-6">
        <AnimatePresence mode="wait" initial={false}>
          {estado.fase === 'leyendo' && (
            <motion.p key="leyendo" {...SUBE} exit={{ opacity: 0 }} className="text-lg text-zinc-500">
              Leyendo el código…
            </motion.p>
          )}

          {estado.fase === 'error' && (
            <motion.div key="error" {...SUBE} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <div role="alert" className="flex flex-col gap-1 rounded-3xl bg-fijate-suave p-5 text-fijate-tinta">
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <Bombilla className="size-5" />
                  No se pudo leer este código
                </p>
                <p className="text-base">
                  {estado.motivo === 'navegador'
                    ? 'Este navegador es demasiado antiguo para abrirlo. Prueba con Chrome o Safari actualizados.'
                    : 'Puede que el link se cortara al copiarlo. Vuelve a compartirlo desde Opciones → Tu progreso en el otro dispositivo.'}
                </p>
              </div>
              <Pulsable href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
                Ir al inicio
              </Pulsable>
            </motion.div>
          )}

          {estado.fase === 'pregunta' && (
            <motion.div key="pregunta" {...SUBE} exit={{ opacity: 0, x: -24 }} className="flex flex-col gap-6">
              <Resumen titulo="Este código trae" r={trae} />

              {temaDistinto && (
                <Pulsable
                  tipo="tarjeta"
                  role="switch"
                  aria-checked={conTema}
                  onClick={() => setConTema((v) => !v)}
                  className="flex min-h-16 items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white px-5 py-3 text-left"
                >
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold text-zinc-900">Usar también su apariencia</span>
                    <span className="text-base text-zinc-600">
                      {NOMBRE_TEMA[trae.tema]} (aquí: {NOMBRE_TEMA[tema]})
                    </span>
                  </span>
                  <Interruptor activo={conTema} />
                </Pulsable>
              )}

              <div className="flex flex-col gap-3">
                <Pulsable
                  data-foco
                  onClick={combinar}
                  className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white"
                >
                  Combinar con mi progreso
                </Pulsable>
                <Pulsable
                  onClick={() => navegar(rutas.inicio())}
                  className="grid min-h-14 place-items-center rounded-2xl border-2 border-zinc-200 bg-white text-lg font-semibold text-zinc-800"
                >
                  Ahora no
                </Pulsable>
              </div>
            </motion.div>
          )}

          {estado.fase === 'hecho' && (
            <motion.div key="hecho" {...SUBE} className="flex flex-col gap-6">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                className="grid size-16 place-items-center rounded-full bg-bien-relleno text-blanco"
                aria-hidden
              >
                <Check className="size-8" grosor={3} />
              </motion.div>
              <Resumen titulo="Ahora tienes" r={estado.despues} celebrar />
              <Pulsable href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
                Ir al inicio
              </Pulsable>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.main>
  )
}

function Resumen({ titulo, r, celebrar = false }) {
  const filas = [
    { nombre: 'Lecciones completadas', valor: r.completadas },
    { nombre: 'Lecciones a medias', valor: r.aMedias },
    { nombre: 'Retos hechos', valor: r.retos },
    { nombre: 'Días de práctica de oído', valor: r.dias },
    { nombre: 'Días de práctica de ritmo', valor: r.diasRitmo ?? 0 },
    { nombre: 'Palabras de vocabulario', valor: r.palabras ?? 0 },
  ]
  return (
    <section className="flex flex-col gap-3" aria-label={titulo}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{titulo}</h2>
      <ul className="flex flex-col divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white">
        {filas.map((f, i) => (
          <li key={f.nombre} className="flex min-h-14 items-center justify-between gap-4 px-5">
            <span className="text-lg text-zinc-700">{f.nombre}</span>
            <motion.span
              className="font-dato text-2xl font-medium tabular-nums text-zinc-900"
              animate={celebrar && f.valor > 0 ? SALTO : { scale: 1 }}
              transition={{ ...RESORTE.pulsar, delay: 0.25 + i * 0.06 }}
            >
              {f.valor}
            </motion.span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Interruptor({ activo }) {
  return (
    <span
      aria-hidden
      className={`relative h-8 w-13 shrink-0 rounded-full transition-colors duration-200 ${activo ? 'bg-bien-relleno' : 'bg-zinc-300'}`}
    >
      <motion.span
        className="absolute top-1 left-1 size-6 rounded-full bg-blanco shadow-sm"
        animate={{ x: activo ? 20 : 0 }}
        transition={RESORTE.pulsar}
      />
    </span>
  )
}
