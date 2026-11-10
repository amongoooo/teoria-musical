import { useCallback, useEffect, useRef, useState } from 'react'
import { initPiano, releaseAll, toneStop } from '../audio/engine.js'
import EscuchaElige from '../components/exercises/EscuchaElige.jsx'
import ExploraFrecuencia from '../components/exercises/ExploraFrecuencia.jsx'
import RetoFL from '../components/exercises/RetoFL.jsx'
import TocaEnPiano from '../components/exercises/TocaEnPiano.jsx'
import PasoSiente from '../components/pasos/PasoSiente.jsx'
import PasoTexto from '../components/pasos/PasoTexto.jsx'
import Rich from '../components/Rich.jsx'
import { getLeccion, getModulo, leccionDisponible } from '../content/index.js'
import { completarLeccion, getLeccion as getProgresoLeccion, guardarPaso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'

// Tipo de paso -> componente. Para un tipo nuevo: créalo y añádelo aquí.
const PASOS = {
  texto: PasoTexto,
  siente: PasoSiente,
  elegir: EscuchaElige,
  tocar: TocaEnPiano,
  frecuencia: ExploraFrecuencia,
  reto: RetoFL,
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
export default function Leccion({ id }) {
  const leccion = getLeccion(id)
  const [vuelta, setVuelta] = useState(0)
  if (!leccion) return <NoEncontrada id={id} />
  return <Visor key={vuelta} leccion={leccion} onRepetir={() => setVuelta((v) => v + 1)} />
}

function Visor({ leccion, onRepetir }) {
  const modulo = getModulo(leccion.modulo)
  const total = leccion.pasos.length

  const [indice, setIndice] = useState(() => {
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
    }
  }, [])

  // siguiente/completar estables para que los pasos los usen en efectos.
  const estado = useRef({ indice, total })
  estado.current = { indice, total }

  const siguiente = useCallback(() => {
    const { indice: i, total: t } = estado.current
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
  }, [leccion.id])

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
      <header className="sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={salir}
            aria-label="Salir de la lección"
            className="grid size-11 shrink-0 place-items-center rounded-full text-2xl text-zinc-500 active:bg-zinc-200"
          >
            ✕
          </button>
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={indice}
            aria-label={`Paso ${indice + 1} de ${total}`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${(indice / total) * 100}%`, backgroundColor: modulo?.acento ?? '#18181b' }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-zinc-500">
            {indice + 1}/{total}
          </span>
        </div>
      </header>

      <main key={indice} className="animate-entrada mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{paso.titulo}</h1>
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
          <p className="text-red-600">Tipo de paso desconocido: {paso.tipo}</p>
        )}
      </main>

      <BarraAccion accion={boton} />
    </div>
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
          <div
            key={feedback.titulo + feedback.texto}
            role="status"
            className={`animate-entrada rounded-2xl px-4 py-3 ${bien ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
          >
            <p className="max-h-28 overflow-y-auto text-base leading-snug">
              <strong className="font-bold">{feedback.titulo}</strong>
              {feedback.texto && (
                <>
                  {' '}
                  <Rich>{feedback.texto}</Rich>
                </>
              )}
            </p>
          </div>
        )}
        {accion.ayuda && <p className="text-center text-sm text-zinc-500">{accion.ayuda}</p>}
        <button
          type="button"
          onClick={accion.onClick}
          disabled={accion.disabled}
          className={`min-h-14 w-full rounded-2xl px-6 text-lg font-semibold text-white transition active:scale-[0.99] disabled:bg-zinc-300 disabled:text-zinc-500 ${
            bien ? 'bg-emerald-600' : 'bg-zinc-900'
          }`}
        >
          {accion.label}
        </button>
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
    <main className="animate-entrada mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="grid size-20 place-items-center rounded-full text-4xl text-white"
          style={{ backgroundColor: modulo?.acento ?? '#18181b' }}
          aria-hidden
        >
          ✓
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">¡Lección completada!</h1>
        <p className="text-lg text-zinc-500">
          {leccion.id} · {leccion.titulo}
        </p>
        {suma.total > 0 && (
          <p className="rounded-full bg-zinc-100 px-4 py-2 text-base font-medium text-zinc-700">
            {suma.aciertos} de {suma.total} a la primera
          </p>
        )}
      </div>

      {leccion.resumen && (
        <section className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-bold">Lo que aprendiste</h2>
          <ul className="flex flex-col gap-2 text-base leading-relaxed text-zinc-600">
            {leccion.resumen.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-zinc-400">•</span>
                <span>
                  <Rich>{r}</Rich>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3">
        {proximaLista ? (
          <a
            href={rutas.leccion(proxima.id)}
            className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 px-6 text-lg font-semibold text-white"
          >
            Siguiente: {proxima.titulo}
          </a>
        ) : (
          proxima && (
            <p className="text-center text-base text-zinc-500">
              La lección {proxima.id} ({proxima.titulo}) llega pronto.
            </p>
          )
        )}
        <a
          href={rutas.modulo(leccion.modulo)}
          className={`grid min-h-14 place-items-center rounded-2xl px-6 text-lg font-semibold ${
            proximaLista ? 'border-2 border-zinc-200 bg-white text-zinc-800' : 'bg-zinc-900 text-white'
          }`}
        >
          Volver al módulo
        </a>
        <button
          type="button"
          onClick={() => {
            window.scrollTo(0, 0)
            onRepetir()
          }}
          className="min-h-12 rounded-2xl px-6 text-base font-medium text-zinc-500"
        >
          Repetir lección
        </button>
      </div>
    </main>
  )
}

function NoEncontrada({ id }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
      <h1 className="text-3xl font-bold">Lección {id}</h1>
      <p className="text-lg text-zinc-500">Esta lección todavía no está disponible.</p>
      <a href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
        Volver al inicio
      </a>
    </main>
  )
}
