import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import Flow from '../components/Flow.jsx'
import { Segmentado } from '../components/Opciones.jsx'
import RimasDiccionario from '../components/RimasDiccionario.jsx'
import { cargarDiccionario } from '../letras/rimasDiccionario.js'
import { analizar, rimasEnLetra } from '../letras/analisis.js'
import { rima } from '../letras/rima.js'
import { borrarLetra, getLetra, guardarLetra, nuevaLetra, tituloDe, useCuaderno } from '../progress/letras.js'
import { resumenVocab, tiendaVocab } from '../progress/vocabulario.js'
import { navegar, rutas } from '../router.js'
import { labio, oscuro, tinta } from '../ui/color.js'
import Hoja from '../ui/Hoja.jsx'
import { Atras, Pluma } from '../ui/Iconos.jsx'
import { RESORTE, SUBE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import { BotonInicio } from '../ui/Volver.jsx'

/** Color del entrenamiento de letras: M6 (rosa). */
const ACENTO = 'var(--color-modulo-6)'

/** Letra de ejemplo (escrita para la app) para probar sin pegar nada. */
const EJEMPLO = {
  titulo: 'De noche',
  texto: `Camino de noche por la avenida
la luna me sigue, me cuida la vida
traigo en el pecho un fuego que quema
cada palabra se vuelve poema

Siempre tengo el reproche
porque vengo de noche
el tiempo no espera, la calle no miente
yo sigo de frente con toda mi gente`,
}

/** #/letras → cuaderno; #/letras/ID → una letra (escribir / analizar). */
export default function Letras({ id }) {
  // La lista de ~45 000 palabras para buscar rimas se empieza a cargar al entrar a Letras (no antes).
  useEffect(() => {
    cargarDiccionario().catch(() => {})
  }, [])
  if (id) return <Letra key={id} id={id} />
  return <Cuaderno />
}

// ---------------------------------------------------------------------------
// Cuaderno: las letras guardadas en este dispositivo
// ---------------------------------------------------------------------------

function Cuaderno() {
  const { letras } = useCuaderno()
  const abrir = (datos) => navegar(rutas.letras(nuevaLetra(datos)))
  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-6 sm:py-10">
      <BotonInicio />
      <motion.header variants={itemLista} className="flex flex-col gap-2">
        <h1 className="font-titulo text-4xl font-extrabold tracking-tight sm:text-5xl">Letras</h1>
        <p className="text-lg text-zinc-600">Pega una letra y mira cómo rima: sílabas, rimas y multis.</p>
      </motion.header>

      <motion.section variants={itemLista} className="flex flex-col gap-3">
        <Pulsable
          onClick={() => abrir()}
          data-nueva-letra
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-lg font-semibold text-white"
        >
          <Pluma className="size-6" /> Nueva letra
        </Pulsable>
        {!letras.length && (
          <Pulsable onClick={() => abrir(EJEMPLO)} data-ejemplo className="min-h-12 rounded-2xl border-2 border-zinc-200 bg-white px-5 text-base font-semibold text-zinc-800">
            Probar con un ejemplo
          </Pulsable>
        )}
      </motion.section>

      <motion.section variants={itemLista}>
        <TarjetaVocabulario />
      </motion.section>

      {letras.length > 0 && (
        <motion.section variants={itemLista} className="flex flex-col gap-3">
          <h2 className="font-titulo text-2xl font-bold tracking-tight">Tu cuaderno</h2>
          {letras.map((l) => (
            <TarjetaLetra key={l.id} letra={l} />
          ))}
        </motion.section>
      )}
    </motion.main>
  )
}

/** Entrada al vocabulario (tarjeta del color del módulo 6): racha propia y cuántas palabras tocan hoy. */
function TarjetaVocabulario() {
  const estado = tiendaVocab.usar()
  const racha = tiendaVocab.rachaActual(estado)
  const r = resumenVocab(estado)
  const pendientes = r.porRepasar + r.nuevasHoy
  return (
    <Pulsable
      href={rutas.vocabulario()}
      tipo="tarjeta"
      data-vocabulario
      className="flex min-h-20 items-center gap-4 rounded-3xl px-4 py-4 text-blanco"
      style={{ backgroundColor: oscuro(ACENTO), boxShadow: `0 6px 0 ${labio(ACENTO)}` }}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blanco/15" aria-hidden>
        <Pluma className="size-7" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-titulo text-lg font-bold leading-snug">Vocabulario</span>
        <span className="text-sm opacity-90">
          {pendientes ? `${pendientes} ${pendientes === 1 ? 'palabra' : 'palabras'} para hoy` : 'Todo repasado por hoy'}
          {' · '}
          <span className="font-juego text-base">
            {racha} {racha === 1 ? 'día' : 'días'}
          </span>
        </span>
      </span>
      <span aria-hidden className="text-2xl opacity-70">
        ›
      </span>
    </Pulsable>
  )
}

function TarjetaLetra({ letra }) {
  const versos = letra.texto.split('\n').filter((v) => v.trim())
  const a = useMemo(() => analizar(letra.texto), [letra.texto])
  const esquema = a.estrofas.map((e) => e.versos.map((v) => v.letra).join('')).join(' · ')
  return (
    <Pulsable
      href={rutas.letras(letra.id)}
      tipo="tarjeta"
      data-letra={letra.id}
      className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-4"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: 'var(--color-modulo-6-suave)', color: tinta(ACENTO) }} aria-hidden>
        <Pluma className="size-7" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-titulo text-lg font-bold leading-snug">{tituloDe(letra)}</span>
        <span className="text-sm text-zinc-500">
          {versos.length} {versos.length === 1 ? 'verso' : 'versos'}
          {esquema && (
            <>
              {' · '}
              <span className="font-dato font-medium">{esquema}</span>
            </>
          )}
        </span>
      </span>
      <span aria-hidden className="text-2xl text-zinc-300">›</span>
    </Pulsable>
  )
}

// ---------------------------------------------------------------------------
// Una letra: escribir y analizar
// ---------------------------------------------------------------------------

function Letra({ id }) {
  useCuaderno() // se vuelve a pintar al guardar
  const letra = getLetra(id)
  const [vista, setVista] = useState(() => (letra?.texto.trim() ? 'analizar' : 'escribir'))
  const [porPalabra, setPorPalabra] = useState(false)
  const [palabra, setPalabra] = useState(null)
  const analisis = useMemo(() => (letra ? analizar(letra.texto, { porPalabra }) : null), [letra, porPalabra])

  if (!letra) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-6">
        <BotonInicio />
        <p className="text-lg text-zinc-600">Esta letra no está en este dispositivo.</p>
        <Pulsable href={rutas.letras()} className="min-h-12 self-start rounded-2xl bg-zinc-900 px-6 text-base font-semibold text-white">
          Ir al cuaderno
        </Pulsable>
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
          <Pulsable
            href={rutas.letras()}
            aria-label="Volver al cuaderno"
            className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
          >
            <Atras className="size-6" />
          </Pulsable>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-16 pt-2">
        <input
          value={letra.titulo}
          onChange={(e) => guardarLetra(id, { titulo: e.target.value })}
          placeholder={tituloDe({ texto: letra.texto, titulo: '' })}
          aria-label="Título de la letra"
          className="w-full rounded-xl bg-transparent font-titulo text-3xl font-bold tracking-tight outline-none placeholder:text-zinc-400"
        />

        <Segmentado
          opciones={[
            { id: 'escribir', nombre: 'Escribir' },
            { id: 'analizar', nombre: 'Analizar' },
            { id: 'flow', nombre: 'Flow' },
          ]}
          valor={vista}
          onCambiar={setVista}
          capa="vista-letra"
        />

        <AnimatePresence mode="wait" initial={false}>
          {vista === 'escribir' ? (
            <motion.div key="escribir" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <textarea
                value={letra.texto}
                onChange={(e) => guardarLetra(id, { texto: e.target.value })}
                placeholder={'Pega o escribe tu letra.\n\nUna línea en blanco separa las estrofas.'}
                aria-label="Letra"
                data-texto-letra
                className="min-h-[55vh] w-full resize-y rounded-3xl border border-zinc-200 bg-white p-4 text-lg leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </motion.div>
          ) : vista === 'flow' ? (
            <motion.div key="flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {analisis.estrofas.length ? (
                <Flow letra={letra} />
              ) : (
                <Pulsable onClick={() => setVista('escribir')} className="min-h-14 w-full rounded-2xl border-2 border-dashed border-zinc-300 px-5 text-base font-semibold text-zinc-500">
                  Aún no hay letra: escríbela o pégala
                </Pulsable>
              )}
            </motion.div>
          ) : (
            <motion.div key="analizar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-5">
              {analisis.estrofas.length ? (
                <>
                  <Leyenda />
                  <Segmentado
                    opciones={[
                      { id: 'dicen', nombre: 'Como se dicen' },
                      { id: 'palabra', nombre: 'Palabra por palabra' },
                    ]}
                    valor={porPalabra ? 'palabra' : 'dicen'}
                    onCambiar={(v) => setPorPalabra(v === 'palabra')}
                    capa="silabas-letra"
                  />
                  {analisis.estrofas.map((e, i) => (
                    <Estrofa key={i} estrofa={e} familias={analisis.familias} porPalabra={porPalabra} onPalabra={setPalabra} />
                  ))}
                </>
              ) : (
                <Pulsable onClick={() => setVista('escribir')} className="min-h-14 rounded-2xl border-2 border-dashed border-zinc-300 px-5 text-base font-semibold text-zinc-500">
                  Aún no hay letra: escríbela o pégala
                </Pulsable>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Pulsable
          onClick={() => {
            if (window.confirm('¿Borrar esta letra del cuaderno?')) {
              borrarLetra(id)
              navegar(rutas.letras())
            }
          }}
          className="mt-6 min-h-12 self-center rounded-2xl px-6 text-base font-medium text-zinc-500"
        >
          Borrar letra
        </Pulsable>
      </main>

      <Hoja abierta={Boolean(palabra)} onCerrar={() => setPalabra(null)} etiqueta="Palabra">
        {palabra && <FichaPalabra key={palabra} palabra={palabra} analisis={analisis} onPalabra={setPalabra} />}
      </Hoja>
    </div>
  )
}

/** Cómo se pinta cada familia: consonante = relleno suave; asonante = subrayado punteado (siempre con su color). */
function estiloFamilia(f) {
  if (!f?.color) return {}
  const c = `var(--color-rima-${f.color})`
  if (f.tipo === 'consonante') return { backgroundColor: `var(--color-rima-${f.color}-suave)`, color: `var(--color-rima-${f.color}-tinta)` }
  return { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: c, textDecorationThickness: '3px', textUnderlineOffset: '5px' }
}

/** Leyenda: qué es cada marca (enseña la diferencia entre las dos rimas). */
function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-zinc-600">
      <span>
        <span className="rounded-md px-1 font-semibold" style={estiloFamilia({ tipo: 'consonante', color: 1 })}>
          corazón · razón
        </span>{' '}
        consonante
      </span>
      <span>
        <span className="font-semibold" style={estiloFamilia({ tipo: 'asonante', color: 2 })}>
          noche · golpe
        </span>{' '}
        asonante
      </span>
    </div>
  )
}

function Estrofa({ estrofa, familias, porPalabra, onPalabra }) {
  const esquema = estrofa.versos.map((v) => v.letra).join('')
  return (
    <section className="flex flex-col gap-1 rounded-3xl border border-zinc-200 bg-white p-4" data-estrofa data-esquema={esquema}>
      <div className="mb-1 flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-zinc-500">
        <span>Esquema</span>
        <span className="font-dato text-base font-medium tracking-[0.2em] text-zinc-700">{esquema}</span>
      </div>
      {estrofa.versos.map((v, i) => {
        const fin = v.palabras.at(-1)
        const f = fin ? familias[fin.familia] : null
        return (
          <div key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-baseline gap-2 py-1" data-verso data-silabas={v.silabas}>
            <span className="font-dato text-base font-medium" style={{ color: f?.color ? `var(--color-rima-${f.color}-tinta)` : 'var(--color-zinc-500)' }}>
              {v.letra}
            </span>
            <p className="text-lg leading-relaxed text-zinc-900">
              <Verso verso={v} familias={familias} porPalabra={porPalabra} onPalabra={onPalabra} />
              {v.multi > 0 && (
                <span className="ml-2 inline-block rounded-full bg-zinc-100 px-2 align-middle font-dato text-sm font-medium text-zinc-600" data-multi={v.multi}>
                  multi {v.multi}
                </span>
              )}
            </p>
            <span className="text-right font-dato text-base font-medium tabular-nums text-zinc-500" aria-label={`${v.silabas} sílabas`}>
              {v.silabas}
            </span>
          </div>
        )
      })}
    </section>
  )
}

/** El verso con cada palabra tocable y pintada según su familia; las sinalefas se ven como «‿». */
function Verso({ verso, familias, porPalabra, onPalabra }) {
  const partes = []
  let cursor = 0
  verso.palabras.forEach((p, i) => {
    const entre = verso.texto.slice(cursor, p.inicio)
    if (entre) {
      const liga = !porPalabra && verso.sinalefas.includes(i) && /^\s+$/.test(entre)
      partes.push(
        liga ? (
          <span key={`e${i}`} className="text-zinc-400" data-sinalefa>
            ‿
          </span>
        ) : (
          <Fragment key={`e${i}`}>{entre}</Fragment>
        ),
      )
    }
    const f = p.familia !== null ? familias[p.familia] : null
    partes.push(
      <button
        key={`p${i}`}
        type="button"
        onClick={() => onPalabra(p.texto)}
        data-palabra={p.texto}
        data-familia={f?.color ?? undefined}
        data-tipo-rima={f?.tipo}
        className="rounded-md px-0.5 active:bg-zinc-100"
        style={estiloFamilia(f)}
      >
        {p.texto}
      </button>,
    )
    cursor = p.fin
  })
  if (cursor < verso.texto.length) partes.push(<Fragment key="fin">{verso.texto.slice(cursor)}</Fragment>)
  return partes
}

const TIPOS = {
  aguda: 'Aguda: suena fuerte la última sílaba',
  llana: 'Llana: suena fuerte la penúltima',
  esdrújula: 'Esdrújula: suena fuerte la antepenúltima',
  sobresdrújula: 'Sobresdrújula: suena fuerte antes de la antepenúltima',
}

/** Hoja de una palabra: sus sílabas (la tónica resaltada), cómo rima y con qué riman en esta letra. */
function FichaPalabra({ palabra, analisis, onPalabra }) {
  const r = rima(palabra)
  const { consonantes, asonantes } = rimasEnLetra(analisis, palabra)
  return (
    <div className="flex flex-col gap-5" data-ficha={palabra}>
      <h2 className="font-titulo text-3xl font-bold tracking-tight">{palabra}</h2>
      <motion.div className="flex flex-wrap gap-2" initial="oculta" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
        {r.silabas.map((s, i) => (
          <motion.span
            key={i}
            variants={{ oculta: { opacity: 0, scale: 0.7 }, visible: { opacity: 1, scale: 1, transition: RESORTE.pulsar } }}
            data-tonica={i === r.tonica || undefined}
            className={`grid min-h-12 min-w-12 place-items-center rounded-2xl border-2 px-3 font-dato text-xl font-medium ${i === r.tonica ? 'border-transparent text-blanco' : 'border-zinc-200 bg-white text-zinc-700'}`}
            style={i === r.tonica ? { backgroundColor: oscuro(ACENTO) } : undefined}
          >
            {s}
          </motion.span>
        ))}
      </motion.div>
      <p className="text-base text-zinc-600">{TIPOS[r.tipo]}.</p>
      <div className="grid grid-cols-2 gap-2">
        <Dato titulo="Consonante" valor={`-${r.consonante}`} />
        <Dato titulo="Asonante" valor={r.asonante} />
      </div>
      <motion.div {...SUBE} className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">En esta letra riman</h3>
        {!consonantes.length && !asonantes.length && <p className="text-base text-zinc-500">Ninguna todavía.</p>}
        <Fichas titulo="Consonante" palabras={consonantes} estilo="bg-zinc-900 text-white" />
        <Fichas titulo="Asonante" palabras={asonantes} estilo="border-2 border-dashed border-zinc-300 text-zinc-700" />
      </motion.div>
      <RimasDiccionario palabra={palabra} onPalabra={onPalabra} />
    </div>
  )
}

function Dato({ titulo, valor }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-zinc-100 p-3">
      <span className="text-sm text-zinc-500">{titulo}</span>
      <span className="font-dato text-xl font-medium">{valor}</span>
    </div>
  )
}

function Fichas({ titulo, palabras, estilo }) {
  if (!palabras.length) return null
  return (
    <div className="flex flex-col gap-2">
      <span className="text-base font-semibold text-zinc-700">{titulo}</span>
      <div className="flex flex-wrap gap-2">
        {palabras.map((p) => (
          <span key={p} className={`rounded-full px-3 py-1.5 text-base font-medium ${estilo}`}>
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}
