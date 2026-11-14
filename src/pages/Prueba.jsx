import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initPiano, releaseAll, toneStop } from '../audio/engine.js'
import EligeEnCirculo from '../components/exercises/EligeEnCirculo.jsx'
import EscuchaElige from '../components/exercises/EscuchaElige.jsx'
import { getLeccion } from '../content/index.js'
import { armarPreguntas, datosPrueba } from '../content/pruebas/index.js'
import { getProgreso, saltarLecciones } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { tinta } from '../ui/color.js'
import { Bombilla, Cerrar, MarcaBien } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import { BarraAccion } from './Leccion.jsx'

const PASOS = { elegir: EscuchaElige, circulo: EligeEnCirculo }

/**
 * Prueba rápida «¿Ya lo sabes?» (content/pruebas/): una pregunta por lección pendiente del módulo o del tramo, con el
 * mismo botón de abajo que las lecciones (Comprobar → Continuar) y «No lo sé». Arriba, un segmento por pregunta que se
 * pinta de verde (bien) u oro (fíjate). Al final, la lista de lecciones: las acertadas ya marcadas para saltar; tocar
 * una fila la quita o la pone. «Saltar N lecciones» las marca como hechas (saltadas) y vuelve al módulo o a la ruta.
 */
export default function Prueba({ id }) {
  const prueba = datosPrueba(id)
  if (!prueba) return <NoEncontrada />
  return <Visor key={id} prueba={prueba} />
}

function Visor({ prueba }) {
  const [preguntas] = useState(() => armarPreguntas(prueba, getProgreso()))
  const [indice, setIndice] = useState(0)
  const [accion, setAccion] = useState(null)
  const [resultados, setResultados] = useState({}) // índice → true (bien) | false
  const [terminado, setTerminado] = useState(false)
  const total = preguntas.length

  useEffect(() => {
    initPiano()
    return () => {
      releaseAll()
      toneStop()
    }
  }, [])

  const estado = useRef({ indice, total })
  estado.current = { indice, total }

  const completar = useCallback(({ aciertos, total: t }) => {
    const i = estado.current.indice
    setResultados((r) => ({ ...r, [i]: aciertos === t }))
  }, [])

  const siguiente = useCallback(() => {
    const { indice: i, total: t } = estado.current
    setAccion(null)
    window.scrollTo(0, 0)
    if (i < t - 1) setIndice(i + 1)
    else setTerminado(true)
  }, [])

  const salir = () => navegar(prueba.volver)

  if (terminado || total === 0) return <Resultado prueba={prueba} preguntas={preguntas} resultados={resultados} />

  const pregunta = preguntas[indice]
  const leccion = getLeccion(pregunta.leccion)
  const Componente = PASOS[pregunta.paso.tipo]
  const boton = accion ?? { label: 'Comprobar', disabled: true }

  return (
    <div className="flex min-h-dvh flex-col" data-prueba={prueba.id}>
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
          <Pulsable
            onClick={salir}
            aria-label="Salir de la prueba"
            className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
          >
            <Cerrar className="size-6" />
          </Pulsable>
          {/* Un segmento por pregunta: verde = bien, oro = fíjate, color de la prueba = la de ahora. */}
          <div
            className={`flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-full px-4 ${VIDRIO}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={indice}
            aria-label={`Pregunta ${indice + 1} de ${total}`}
          >
            {preguntas.map((_, i) => {
              const r = resultados[i]
              const color = r === true ? 'var(--color-bien)' : r === false ? 'var(--color-fijate)' : i === indice ? prueba.acento : 'var(--color-zinc-200)'
              return (
                <motion.span
                  key={i}
                  data-segmento={r === true ? 'bien' : r === false ? 'fijate' : i === indice ? 'actual' : 'pendiente'}
                  className="h-2.5 flex-1 rounded-full"
                  initial={false}
                  animate={{ backgroundColor: color, scaleY: i === indice && r === undefined ? 1.3 : 1 }}
                  transition={RESORTE.pulsar}
                />
              )
            })}
          </div>
        </div>
      </header>

      <motion.main
        key={indice}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4"
      >
        {/* De qué lección es (en vez del título del paso): el número en el color de la prueba. */}
        <p className="-mb-1 inline-flex items-center gap-2 self-start rounded-full bg-zinc-100 py-1 pr-3 pl-2.5 text-sm font-bold text-zinc-700">
          <span className="font-dato" style={{ color: tinta(prueba.acento) }}>
            {pregunta.leccion}
          </span>
          {leccion?.titulo}
        </p>
        <Componente
          paso={pregunta.paso}
          leccionId={pregunta.leccion}
          setAccion={setAccion}
          siguiente={siguiente}
          completar={completar}
          noLoSe
        />
      </motion.main>

      <BarraAccion accion={boton} />
    </div>
  )
}

/**
 * Final de la prueba: cuántas acertaste y la lista de lecciones. Las acertadas salen marcadas (verde con ✓,
 * «La saltas»); las falladas, en oro con bombilla («Conviene verla»). Tocar una fila la pone o la quita.
 */
function Resultado({ prueba, preguntas, resultados }) {
  const aciertos = Object.values(resultados).filter(Boolean).length
  const total = preguntas.length
  const [elegidas, setElegidas] = useState(() => new Set(preguntas.filter((_, i) => resultados[i]).map((p) => p.leccion)))
  const n = elegidas.size
  const esModulo = prueba.id.startsWith('modulo/')
  const volver = esModulo ? 'Ir al módulo' : 'Ir a la ruta'

  const cambiar = (id) =>
    setElegidas((s) => {
      const x = new Set(s)
      if (x.has(id)) x.delete(id)
      else x.add(id)
      return x
    })

  const terminar = (saltar) => {
    saltarLecciones(saltar ? [...elegidas] : [], prueba.clave, { aciertos, total })
    navegar(prueba.volver)
  }

  if (total === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
        <h1 className="font-titulo text-3xl font-bold tracking-tight">Ya hiciste todas</h1>
        <p className="text-lg text-zinc-600">No queda ninguna lección de {prueba.titulo} por saltar.</p>
        <Pulsable href={prueba.volver} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
          {volver}
        </Pulsable>
      </main>
    )
  }

  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-10" data-resultado-prueba>
      <motion.div variants={itemLista} className="flex flex-col gap-2">
        <p className="font-dato text-sm font-medium uppercase tracking-wider" style={{ color: tinta(prueba.acento) }}>
          {prueba.etiqueta} · {aciertos} de {total}
        </p>
        <h1 className="font-titulo text-3xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-4xl">
          {n > 0 ? `Puedes saltar ${n} ${n === 1 ? 'lección' : 'lecciones'}` : 'Mejor empieza por las lecciones'}
        </h1>
      </motion.div>

      <motion.ul variants={lista} className="flex flex-col gap-2">
        {preguntas.map((p, i) => {
          const elegida = elegidas.has(p.leccion)
          const bien = resultados[i]
          return (
            <motion.li key={p.leccion} variants={itemLista}>
              <Pulsable
                tipo="tarjeta"
                onClick={() => cambiar(p.leccion)}
                aria-pressed={elegida}
                data-fila-prueba={p.leccion}
                data-elegida={elegida || undefined}
                className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition-colors duration-200 ${
                  elegida ? 'border-bien bg-bien-suave' : bien ? 'border-zinc-200 bg-white' : 'border-transparent bg-fijate-suave'
                }`}
              >
                <span className="grid size-8 shrink-0 place-items-center">
                  {elegida ? (
                    <MarcaBien className="size-7" />
                  ) : bien ? (
                    <span className="size-6 rounded-full border-2 border-zinc-300" aria-hidden />
                  ) : (
                    <Bombilla className="size-6 text-fijate-tinta" />
                  )}
                </span>
                <span className="w-9 shrink-0 font-dato text-sm font-medium text-zinc-500">{p.leccion}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-semibold leading-snug text-zinc-900">{getLeccion(p.leccion)?.titulo}</span>
                  <span className={`text-sm font-medium ${elegida ? 'text-bien-tinta' : bien ? 'text-zinc-500' : 'text-fijate-tinta'}`}>
                    {elegida ? 'La saltas' : bien ? 'La haces' : 'Conviene verla'}
                  </span>
                </span>
              </Pulsable>
            </motion.li>
          )
        })}
      </motion.ul>

      <motion.div variants={itemLista} className="flex flex-col gap-3">
        {n > 0 ? (
          <>
            <Pulsable onClick={() => terminar(true)} data-saltar className="grid min-h-14 place-items-center rounded-2xl bg-bien-relleno px-6 text-lg font-semibold text-blanco">
              Saltar {n} {n === 1 ? 'lección' : 'lecciones'}
            </Pulsable>
            <Pulsable onClick={() => terminar(false)} className="grid min-h-14 place-items-center rounded-2xl border-2 border-zinc-200 bg-white px-6 text-lg font-semibold text-zinc-700">
              Hacerlas todas
            </Pulsable>
          </>
        ) : (
          <Pulsable onClick={() => terminar(false)} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 px-6 text-lg font-semibold text-white">
            {volver}
          </Pulsable>
        )}
      </motion.div>
    </motion.main>
  )
}

function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
      <h1 className="font-titulo text-3xl font-bold">Esta prueba no existe</h1>
      <a href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
        Volver al inicio
      </a>
    </main>
  )
}
