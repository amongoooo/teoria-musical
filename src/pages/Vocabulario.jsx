import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import CabeceraEntrenador from '../components/CabeceraEntrenador.jsx'
import PanelEntrenamiento from '../components/PanelEntrenamiento.jsx'
import RimasDiccionario from '../components/RimasDiccionario.jsx'
import { EJERCICIOS, crearPregunta } from '../letras/vocabulario/ejercicios.js'
import { TEMAS, VOCABULARIO, partirVerso, tipoDe } from '../letras/vocabulario/index.js'
import { CAJAS, diasEntre, estadoPalabra, siguiente } from '../letras/vocabulario/repaso.js'
import { hoy } from '../progress/entrenamiento.js'
import { useOpciones } from '../progress/opciones.js'
import { alternarTema, nuevasDeHoy, responderVocab, resumenVocab, temasElegidos, tiendaVocab } from '../progress/vocabulario.js'
import { rutas } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { Bombilla, Check, Pluma } from '../ui/Iconos.jsx'
import { RESORTE, SALTO, SUBE, itemLista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { BarraAccion } from './Leccion.jsx'

/** Color del entrenamiento de letras: M6 (rosa). */
const ACENTO = 'var(--color-modulo-6)'
/** Preguntas por tanda: la barra de arriba se llena con ellas. */
const TANDA = 10

const porcentaje = (a, t) => (t ? Math.round((a / t) * 100) : 0)
const resumenModo = (d) => (d.total ? `${porcentaje(d.aciertos, d.total)} % bien · ${d.total} respuestas` : 'Sin empezar')

/** Los tres ejercicios (decisión del usuario). Las estadísticas: las 6 palabras que más cuestan en cada uno. */
export const MODOS_VOCAB = [
  { id: 'significado', titulo: '¿Qué significa?', descripcion: 'Elige la definición de la palabra.', pregunta: '¿Qué significa?' },
  { id: 'sinonimos', titulo: 'Sinónimos', descripcion: 'Encuentra otra palabra que diga lo mismo.', pregunta: 'Un sinónimo de' },
  { id: 'verso', titulo: 'Completa el verso', descripcion: 'La palabra que falta en el verso.', pregunta: 'Completa el verso' },
].map((m) => ({ ...m, acento: ACENTO, resumen: resumenModo, nombreItem: (id) => id, maxItems: 6 }))

const MODO_REPASO = { id: 'repaso', titulo: 'Repaso de hoy' }

/** #/letras/vocabulario → panel; #/letras/vocabulario/repaso (o un ejercicio) → entrenador. */
export default function Vocabulario({ modo }) {
  const m = modo === 'repaso' ? MODO_REPASO : MODOS_VOCAB.find((x) => x.id === modo)
  if (m) return <Entrenador key={m.id} modo={m} />
  return <Panel />
}

// ---------------------------------------------------------------------------
// Panel: racha y 5 min propios, el repaso de hoy, los temas y los tres ejercicios
// ---------------------------------------------------------------------------

function Panel() {
  return (
    <PanelEntrenamiento
      titulo="Vocabulario"
      descripcion="Palabras para tus letras. Cada una vuelve justo cuando está por olvidarse."
      sugerencia="Empieza con el repaso de hoy."
      nombre="vocabulario"
      tienda={tiendaVocab}
      modos={MODOS_VOCAB}
      ruta={rutas.vocabulario}
      Icono={Pluma}
      volver={rutas.letras()}
      etiquetaVolver="Volver al cuaderno de letras"
      arriba={<RepasoDeHoy />}
    >
      <Temas />
    </PanelEntrenamiento>
  )
}

/** Tarjeta destacada (color del módulo 6): cuántas tocan hoy y cuántas nuevas quedan; botón blanco «Repasar». */
function RepasoDeHoy() {
  const estado = tiendaVocab.usar()
  const r = resumenVocab(estado)
  const pendientes = r.porRepasar + r.nuevasHoy
  return (
    <motion.section variants={itemLista}>
      <Pulsable
        href={rutas.vocabulario('repaso')}
        tipo="tarjeta"
        data-repaso-hoy={pendientes}
        className="flex flex-col gap-4 rounded-3xl p-5 text-blanco"
        style={{ backgroundColor: oscuro(ACENTO), boxShadow: `0 7px 0 ${labio(ACENTO)}` }}
      >
        <span className="font-juego text-xl uppercase tracking-wide">Repaso de hoy</span>
        <span className="grid grid-cols-3 gap-2 text-center">
          <Cifra valor={r.porRepasar} nombre="por repasar" />
          <Cifra valor={r.nuevasHoy} nombre={r.nuevasHoy === 1 ? 'nueva' : 'nuevas'} />
          <Cifra valor={r.dominadas} nombre={`de ${VOCABULARIO.length} dominadas`} />
        </span>
        <span
          className="grid min-h-14 place-items-center rounded-2xl bg-blanco font-juego text-2xl uppercase tracking-wide"
          style={{ color: tinta(ACENTO), boxShadow: '0 5px 0 rgb(0 0 0 / 0.18)' }}
        >
          {pendientes ? 'Repasar' : 'Practicar'}
        </span>
      </Pulsable>
    </motion.section>
  )
}

function Cifra({ valor, nombre }) {
  return (
    <span className="flex flex-col items-center gap-0.5 rounded-2xl bg-blanco/15 px-1 py-2">
      <span className="font-dato text-3xl font-medium tabular-nums">{valor}</span>
      <span className="text-sm leading-tight opacity-90">{nombre}</span>
    </span>
  )
}

/**
 * Temas (las palabras nuevas salen de los encendidos; siempre queda uno): tarjeta con borde negro = encendido,
 * su avance (vistas) y las dominadas en la barra.
 */
function Temas() {
  const estado = tiendaVocab.usar()
  const elegidos = temasElegidos(estado)
  return (
    <motion.section variants={itemLista} className="flex flex-col gap-3">
      <h2 className="font-titulo text-2xl font-bold tracking-tight">Temas</h2>
      <div className="grid grid-cols-2 gap-3">
        {TEMAS.map((t) => {
          const r = resumenVocab(estado, t.palabras.map((w) => ({ ...w, tema: t.id })))
          const activo = elegidos.includes(t.id)
          return (
            <Pulsable
              key={t.id}
              tipo="tarjeta"
              role="switch"
              aria-checked={activo}
              onClick={() => alternarTema(t.id)}
              data-tema={t.id}
              className={`relative flex min-h-24 flex-col items-start gap-2 rounded-3xl border-2 bg-white p-4 text-left transition-colors duration-200 ${
                activo ? 'border-zinc-900' : 'border-zinc-200'
              }`}
            >
              <span className={`font-titulo text-lg font-bold leading-tight ${activo ? 'text-zinc-900' : 'text-zinc-500'}`}>{t.nombre}</span>
              <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">
                {r.vistas}/{t.palabras.length}
              </span>
              <BarraProgreso valor={r.vistas / t.palabras.length} color={activo ? ACENTO : 'var(--color-zinc-400)'} fondo="bg-zinc-100" alto="h-1.5" className="w-full" />
              <motion.span
                aria-hidden
                className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-zinc-900 text-white"
                initial={false}
                animate={{ scale: activo ? 1 : 0, opacity: activo ? 1 : 0 }}
                transition={RESORTE.pulsar}
              >
                <Check className="size-4" />
              </motion.span>
            </Pulsable>
          )
        })}
      </div>
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Entrenador: una palabra por pregunta (el repaso mezcla los tres ejercicios)
// ---------------------------------------------------------------------------

function nuevaPregunta(modo, recientes, n) {
  const e = tiendaVocab.leer()
  const { palabra, motivo } = siguiente(e.repaso ?? {}, VOCABULARIO, hoy(), {
    temas: temasElegidos(e),
    evitar: recientes,
    nuevasHechasHoy: nuevasDeHoy(e),
  })
  // En el repaso, una palabra nueva se presenta primero con su significado; las demás, con cualquier ejercicio.
  const tipo = modo.id !== 'repaso' ? modo.id : motivo === 'nueva' ? 'significado' : EJERCICIOS[Math.floor(Math.random() * EJERCICIOS.length)]
  return { ...crearPregunta(palabra, tipo), motivo, n, caja: estadoPalabra(e.repaso, palabra.p).caja }
}

function Entrenador({ modo }) {
  const { gesto: sentidoGesto } = useOpciones()
  const recientes = useRef([])
  const [pregunta, setPregunta] = useState(() => {
    tiendaVocab.empezarSesion()
    return nuevaPregunta(modo, [], 0)
  })
  const [respuesta, setRespuesta] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [tanda, setTanda] = useState({ hechas: 0, aciertos: 0 })

  const responder = (id) => {
    if (respuesta) return
    const bien = id === pregunta.correcta
    setRespuesta(id)
    setResultado(responderVocab(pregunta.tipo, pregunta.palabra.p, bien))
    setTanda((t) => ({ hechas: t.hechas + 1, aciertos: t.aciertos + (bien ? 1 : 0) }))
  }

  const siguienteP = () => {
    recientes.current = [...recientes.current, pregunta.palabra.p].slice(-4)
    if (tanda.hechas >= TANDA) setTanda({ hechas: 0, aciertos: 0 })
    setPregunta(nuevaPregunta(modo, recientes.current, pregunta.n + 1))
    setRespuesta(null)
    setResultado(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const w = pregunta.palabra
  const bien = respuesta === pregunta.correcta
  const tipoModo = MODOS_VOCAB.find((m) => m.id === pregunta.tipo)
  const completa = tanda.hechas >= TANDA

  let accion
  if (!respuesta) {
    accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda: 'Elige una respuesta' }
  } else {
    let texto = cuando(resultado)
    if (!bien && pregunta.tipo === 'sinonimos') texto = `«${w.p}» también se dice ${lista(w.s)}. ${texto}`
    if (!bien && pregunta.tipo === 'verso') texto = `**${w.p}**: ${minuscula(w.d)} ${texto}`
    if (resultado?.metaCumplida) texto += ' **¡Cumpliste tus 5 minutos de hoy!**'
    if (completa) texto += ` **Tanda completa: ${tanda.aciertos} de ${TANDA}.**`
    const correcta = pregunta.opciones.find((o) => o.id === pregunta.correcta)
    accion = {
      label: 'Continuar',
      onClick: siguienteP,
      feedback: bien
        ? { tipo: 'bien', titulo: '¡Correcto!', texto }
        : // En «¿Qué significa?», lo útil es saber de qué palabra era la definición que elegiste.
          { tipo: 'mal', titulo: pregunta.tipo === 'significado' ? `Esa definición es de «${respuesta}».` : `Era «${correcta.label}».`, texto },
    }
  }

  const navegacion = {
    invertido: sentidoGesto === 'invertido',
    puede: (dir) => dir > 0 && Boolean(respuesta),
    ir: (dir) => dir > 0 && siguienteP(),
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraEntrenador
        volver={rutas.vocabulario()}
        etiquetaVolver="Volver al vocabulario"
        barra={{ clave: 'vocabulario', avance: tanda.hechas / TANDA, lleno: completa, acento: oscuro(ACENTO) }}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-72 pt-4">
        <motion.div
          key={pregunta.n}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
          className="flex flex-col gap-5"
          data-pregunta={pregunta.tipo}
          data-palabra={w.p}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tinta(ACENTO) }}>
              <Pluma className="size-[18px]" />
              {modo.id === 'repaso' ? `Repaso · ${tipoModo.titulo}` : tipoModo.titulo}
            </span>
            {pregunta.motivo === 'nueva' && !respuesta ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-fijate-suave px-2.5 py-1 text-sm font-semibold text-fijate-tinta" data-nueva>
                <Bombilla className="size-4" /> Nueva
              </span>
            ) : (
              <Cajas caja={resultado?.caja ?? pregunta.caja} />
            )}
          </div>

          {pregunta.tipo === 'verso' ? (
            <>
              <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{tipoModo.pregunta}</h1>
              <VersoHueco pregunta={pregunta} respuesta={respuesta} />
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight text-zinc-600 sm:text-3xl">{tipoModo.pregunta}</h1>
              <p className="font-titulo text-5xl font-extrabold tracking-tight" style={{ color: tinta(ACENTO) }}>
                {w.p}
              </p>
            </div>
          )}

          <div className={`grid gap-3 ${pregunta.tipo === 'significado' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {pregunta.opciones.map((op) => (
              <Pulsable
                key={op.id}
                tipo="tarjeta"
                onClick={() => responder(op.id)}
                animate={respuesta && op.id === pregunta.correcta ? SALTO : { scale: 1 }}
                data-opcion={op.id}
                data-correcta={op.id === pregunta.correcta || undefined}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 leading-snug transition-colors duration-200 ${
                  pregunta.tipo === 'significado' ? 'text-left text-lg font-medium' : 'justify-center text-center text-lg font-semibold'
                } ${claseOpcion(op.id, pregunta.correcta, respuesta)}`}
              >
                {respuesta && op.id === pregunta.correcta && <Check className="size-5 shrink-0" />}
                {respuesta && op.id === respuesta && !bien && <Bombilla className="size-5 shrink-0" />}
                <span>{op.label}</span>
              </Pulsable>
            ))}
          </div>

          {respuesta && <FichaVocab w={w} resultado={resultado} />}
        </motion.div>
      </main>

      <BarraAccion accion={accion} navegacion={navegacion} />
    </div>
  )
}

/** El verso con un hueco donde va la palabra; al responder, el hueco se llena con ella (color del módulo). */
function VersoHueco({ pregunta, respuesta }) {
  const v = pregunta.verso
  return (
    <p className="rounded-3xl border border-zinc-200 bg-white p-5 font-titulo text-2xl font-semibold leading-snug tracking-tight text-zinc-800" data-verso-hueco>
      {v.antes}
      {respuesta ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={RESORTE.pulsar}
          className="inline-block rounded-lg px-1.5"
          style={{ backgroundColor: claro(ACENTO), color: tinta(ACENTO) }}
        >
          {v.palabra}
        </motion.span>
      ) : (
        <span aria-label="hueco" className="mx-1 inline-block h-[0.8em] w-24 border-b-4 border-dashed border-zinc-300 align-baseline" />
      )}
      {v.despues}
    </p>
  )
}

/** Las 5 cajas del repaso espaciado: llenas hasta la de la palabra (1 día … 16 días). */
function Cajas({ caja }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`Caja ${caja} de ${CAJAS}`} data-caja={caja}>
      {Array.from({ length: CAJAS }, (_, i) => (
        <motion.span
          key={i}
          className="size-2.5 rounded-full"
          initial={false}
          animate={{ backgroundColor: i < caja ? oscuro(ACENTO) : 'var(--color-zinc-200)', scale: i === caja - 1 ? [1, 1.4, 1] : 1 }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </span>
  )
}

/** Tras responder: la ficha de la palabra (tipo, definición, verso, sinónimos) y sus rimas en el diccionario. */
function FichaVocab({ w, resultado }) {
  const v = partirVerso(w)
  return (
    <motion.section {...SUBE} className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5" data-ficha-vocab={w.p}>
      <div className="flex flex-col gap-0.5">
        <span className="font-titulo text-2xl font-bold tracking-tight">{w.p}</span>
        <span className="text-sm text-zinc-500">{tipoDe(w)}</span>
      </div>
      <p className="text-lg leading-relaxed text-zinc-700">{w.d}</p>
      <p className="border-l-4 pl-3 text-lg italic leading-relaxed text-zinc-600" style={{ borderColor: claro(ACENTO) }}>
        {v.antes}
        <span className="rounded px-0.5 not-italic font-semibold" style={{ backgroundColor: claro(ACENTO), color: tinta(ACENTO) }}>
          {v.palabra}
        </span>
        {v.despues}
      </p>
      <div className="flex flex-wrap gap-2">
        {w.s.map((s) => (
          <span key={s} className="rounded-full bg-zinc-100 px-3 py-1.5 text-base font-medium text-zinc-700">
            {s}
          </span>
        ))}
      </div>
      {resultado && (
        <p className="text-sm text-zinc-500">
          Vuelve <span className="font-dato font-medium text-zinc-700">{cuandoCorto(resultado.proximo)}</span>
        </p>
      )}
      <RimasDiccionario palabra={w.p} max={12} />
    </motion.section>
  )
}

function cuandoCorto(proximo) {
  const n = diasEntre(hoy(), proximo)
  return n <= 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`
}

/** Texto de cuándo vuelve la palabra (solo si su caja se movió). */
function cuando(r) {
  if (!r?.movida) return 'Práctica extra: su repaso sigue igual.'
  return `Vuelve ${cuandoCorto(r.proximo)}.`
}

const minuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1)
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} o ${xs.at(-1)}` : xs[0])

function claseOpcion(id, correcta, respuesta) {
  if (!respuesta) return 'border-zinc-200 bg-white text-zinc-800'
  if (id === correcta) return 'border-bien bg-bien-suave text-bien-tinta'
  if (id === respuesta) return 'border-fijate bg-fijate-suave text-fijate-tinta'
  return 'border-zinc-200 bg-white text-zinc-500'
}
