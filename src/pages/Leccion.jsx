import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initPiano, pararRitmo, releaseAll, toneStop } from '../audio/engine.js'
import Emparejar from '../components/exercises/Emparejar.jsx'
import EscuchaElige from '../components/exercises/EscuchaElige.jsx'
import ExploraFrecuencia from '../components/exercises/ExploraFrecuencia.jsx'
import PianoRollEjercicio from '../components/exercises/PianoRollEjercicio.jsx'
import Pulso from '../components/exercises/Pulso.jsx'
import RetoFL from '../components/exercises/RetoFL.jsx'
import TocaEnPiano from '../components/exercises/TocaEnPiano.jsx'
import PasoSiente from '../components/pasos/PasoSiente.jsx'
import PasoTexto from '../components/pasos/PasoTexto.jsx'
import Rich from '../components/Rich.jsx'
import { etiquetaPaso } from '../content/actividad.js'
import { getLeccion, getModulo, leccionDisponible } from '../content/index.js'
import { completarLeccion, getLeccion as getProgresoLeccion, guardarPaso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import { Bombilla, Cerrar, Check, ICONO_ACTIVIDAD } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'

// Tipo de paso -> componente. Para un tipo nuevo: créalo y añádelo aquí.
const PASOS = {
  texto: PasoTexto,
  siente: PasoSiente,
  elegir: EscuchaElige,
  emparejar: Emparejar,
  tocar: TocaEnPiano,
  frecuencia: ExploraFrecuencia,
  reto: RetoFL,
  pianoroll: PianoRollEjercicio,
  pulso: Pulso,
}

/**
 * Visor de lecciones paso a paso.
 *
 * Cada paso recibe { paso, leccionId, setAccion, siguiente, completar }:
 *  - setAccion({ label, onClick, disabled, ayuda, feedback }) controla el botón
 *    grande de abajo. Si el paso no la usa, se muestra "Continuar".
 *  - feedback: { tipo: 'bien' | 'mal', titulo, texto } aparece sobre el botón.
 *  - completar({ aciertos, total }) guarda la puntuación del paso.
 *  - siguiente() avanza al siguiente paso.
 */
export default function Leccion({ id, soloReto = false }) {
  const leccion = getLeccion(id)
  const [vuelta, setVuelta] = useState(0)
  if (!leccion) return <NoEncontrada id={id} />
  return <Visor key={vuelta} leccion={leccion} soloReto={soloReto} onRepetir={() => setVuelta((v) => v + 1)} />
}

/**
 * soloReto: abre directamente el paso «reto» (desde la isla de Retos del módulo); al continuar
 * vuelve al módulo sin tocar el progreso de la lección.
 */
function Visor({ leccion, soloReto, onRepetir }) {
  const modulo = getModulo(leccion.modulo)
  const total = leccion.pasos.length

  const [indice, setIndice] = useState(() => {
    const iReto = leccion.pasos.findIndex((p) => p.tipo === 'reto')
    if (soloReto && iReto >= 0) return iReto
    const p = getProgresoLeccion(leccion.id)
    return p && !p.completada && p.paso > 0 && p.paso < total ? p.paso : 0
  })
  const [terminado, setTerminado] = useState(false)
  const [accion, setAccion] = useState(null)
  const puntos = useRef({}) // índice de paso -> { aciertos, total }

  useEffect(() => {
    initPiano()
    return () => {
      releaseAll()
      toneStop()
      pararRitmo()
    }
  }, [])

  // siguiente/completar estables para que los pasos los usen en efectos.
  const estado = useRef({ indice, total })
  estado.current = { indice, total }

  const siguiente = useCallback(() => {
    const { indice: i, total: t } = estado.current
    if (soloReto) return navegar(rutas.modulo(leccion.modulo))
    setAccion(null)
    window.scrollTo(0, 0)
    if (i < t - 1) {
      setIndice(i + 1)
      guardarPaso(leccion.id, i + 1)
    } else {
      const suma = Object.values(puntos.current).reduce(
        (acc, p) => ({ aciertos: acc.aciertos + p.aciertos, total: acc.total + p.total }),
        { aciertos: 0, total: 0 },
      )
      completarLeccion(leccion.id, suma)
      setTerminado(true)
    }
  }, [leccion.id, leccion.modulo, soloReto])

  const completar = useCallback((resultado) => {
    puntos.current[estado.current.indice] = resultado
  }, [])

  const salir = () => navegar(rutas.modulo(leccion.modulo))

  if (terminado) {
    return <Final leccion={leccion} modulo={modulo} puntos={puntos.current} onRepetir={onRepetir} />
  }

  const paso = leccion.pasos[indice]
  const Componente = PASOS[paso.tipo]
  const boton = accion ?? { label: 'Continuar', onClick: siguiente }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Cabecera de vidrio (como la de Módulo): ✕ en un círculo y la barra de pasos con el contador en una
          píldora; el paso pasa por detrás, desenfocado. */}
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
          <Pulsable
            onClick={salir}
            aria-label="Salir de la lección"
            className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
          >
            <Cerrar className="size-6" />
          </Pulsable>
          <div className={`flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full pl-4 pr-3 ${VIDRIO}`}>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={indice}
              aria-label={`Paso ${indice + 1} de ${total}`}
            >
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${(indice / total) * 100}%` }}
                transition={RESORTE.suave}
                style={{ backgroundColor: modulo?.acento ?? 'var(--color-zinc-900)' }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-dato text-sm tabular-nums text-zinc-600">
              {indice + 1}/{total}
            </span>
          </div>
        </div>
      </header>

      {/* Cada paso entra desde la derecha con un resorte (como avanzar en iOS). */}
      <motion.main
        key={indice}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4"
      >
        <Etiqueta paso={paso} indice={indice} />
        <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{paso.titulo}</h1>
        {paso.intro && (
          <p className="text-lg leading-relaxed text-zinc-600">
            <Rich>{paso.intro}</Rich>
          </p>
        )}
        {Componente ? (
          <Componente
            paso={paso}
            leccionId={leccion.id}
            setAccion={setAccion}
            siguiente={siguiente}
            completar={completar}
          />
        ) : (
          <p className="text-fijate-tinta">Tipo de paso desconocido: {paso.tipo}</p>
        )}
      </motion.main>

      <BarraAccion accion={boton} />
    </div>
  )
}

/**
 * Etiqueta del paso: ícono de su actividad + nombre del ejercicio (catálogo de INTERACCIONES.md),
 * p. ej. «Oído · Escuchar y elegir». Las explicaciones no llevan etiqueta.
 */
function Etiqueta({ paso, indice }) {
  const e = etiquetaPaso(paso, indice)
  if (!e) return null
  const Icono = ICONO_ACTIVIDAD[e.actividad]
  return (
    <p className="-mb-2 inline-flex items-center gap-1.5 self-start rounded-full bg-zinc-100 py-1 pr-3 pl-2.5 text-sm font-bold text-zinc-700">
      <Icono className="size-[18px]" />
      {e.ejercicio ? `${e.texto} · ${e.ejercicio}` : e.texto}
    </p>
  )
}

/** Barra fija de abajo con el botón grande (también la usa el entrenamiento de oído). */
export function BarraAccion({ accion }) {
  const { feedback } = accion
  const bien = feedback?.tipo === 'bien'
  return (
    <div data-barra-accion className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-2 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {feedback && (
          <motion.div
            key={feedback.titulo + feedback.texto}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={RESORTE.suave}
            className={`flex max-h-36 flex-col gap-0.5 overflow-y-auto rounded-2xl px-4 py-3 ${bien ? 'bg-bien-suave text-bien-tinta' : 'bg-fijate-suave text-fijate-tinta'}`}
          >
            <p className="flex items-center gap-2 text-base font-bold leading-snug">
              {bien ? <Check className="size-5" /> : <Bombilla className="size-5" />}
              {feedback.titulo}
            </p>
            {feedback.texto && (
              <p className="text-base leading-snug">
                <Rich>{feedback.texto}</Rich>
              </p>
            )}
          </motion.div>
        )}
        {accion.ayuda && <p className="text-center text-sm text-zinc-500">{accion.ayuda}</p>}
        <Pulsable
          onClick={accion.onClick}
          disabled={accion.disabled}
          className={`min-h-14 w-full rounded-2xl px-6 text-lg font-semibold transition-colors duration-200 disabled:bg-zinc-300 disabled:text-zinc-500 ${
            bien ? 'bg-bien-relleno text-blanco' : 'bg-zinc-900 text-white'
          }`}
        >
          {accion.label}
        </Pulsable>
      </div>
    </div>
  )
}

function Final({ leccion, modulo, puntos, onRepetir }) {
  const suma = Object.values(puntos).reduce(
    (acc, p) => ({ aciertos: acc.aciertos + p.aciertos, total: acc.total + p.total }),
    { aciertos: 0, total: 0 },
  )
  const lecciones = modulo?.lecciones ?? []
  const pos = lecciones.findIndex((l) => l.id === leccion.id)
  const proxima = lecciones[pos + 1]
  const proximaLista = proxima && leccionDisponible(proxima.id)

  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-12">
      <motion.div variants={itemLista} className="flex flex-col items-center gap-3 text-center">
        <motion.div
          className="grid size-20 place-items-center rounded-full bg-bien-relleno text-blanco"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.1 }}
          aria-hidden
        >
          <Check className="size-10" grosor={3} />
        </motion.div>
        <h1 className="font-titulo text-3xl font-bold tracking-tight sm:text-4xl">¡Lección completada!</h1>
        <p className="text-lg text-zinc-500">
          {leccion.id} · {leccion.titulo}
        </p>
        {suma.total > 0 && (
          <p className="rounded-full bg-zinc-100 px-4 py-2 text-base font-medium text-zinc-700">
            {suma.aciertos} de {suma.total} a la primera
          </p>
        )}
      </motion.div>

      {leccion.resumen && (
        <motion.section variants={itemLista} className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
          <h2 className="font-titulo text-xl font-bold">Lo que aprendiste</h2>
          <motion.ul variants={lista} className="flex flex-col gap-2 text-base leading-relaxed text-zinc-600">
            {leccion.resumen.map((r, i) => (
              <motion.li key={i} variants={itemLista} className="flex gap-2">
                <span aria-hidden className="text-zinc-400">•</span>
                <span>
                  <Rich>{r}</Rich>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      <motion.div variants={itemLista} className="flex flex-col gap-3">
        {proximaLista ? (
          <Pulsable
            href={rutas.leccion(proxima.id)}
            className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 px-6 text-center text-lg font-semibold text-white"
          >
            Siguiente: {proxima.titulo}
          </Pulsable>
        ) : (
          proxima && (
            <p className="text-center text-base text-zinc-500">
              La lección {proxima.id} ({proxima.titulo}) llega pronto.
            </p>
          )
        )}
        <Pulsable
          href={rutas.modulo(leccion.modulo)}
          className={`grid min-h-14 place-items-center rounded-2xl px-6 text-lg font-semibold ${
            proximaLista ? 'border-2 border-zinc-200 bg-white text-zinc-800' : 'bg-zinc-900 text-white'
          }`}
        >
          Volver al módulo
        </Pulsable>
        <Pulsable
          onClick={() => {
            window.scrollTo(0, 0)
            onRepetir()
          }}
          className="min-h-12 rounded-2xl px-6 text-base font-medium text-zinc-500"
        >
          Repetir lección
        </Pulsable>
      </motion.div>
    </motion.main>
  )
}

function NoEncontrada({ id }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
      <h1 className="font-titulo text-3xl font-bold">Lección {id}</h1>
      <p className="text-lg text-zinc-500">Esta lección todavía no está disponible.</p>
      <a href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
        Volver al inicio
      </a>
    </main>
  )
}
