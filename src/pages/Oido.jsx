import { motion, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { initPiano, limpiarOido, releaseAll } from '../audio/engine.js'
import { reproducir, seguirNotas } from '../audio/sonido.js'
import Piano from '../components/Piano.jsx'
import Rich from '../components/Rich.jsx'
import {
  ACIERTOS_PARA_SUBIR,
  META_SEGUNDOS,
  TAMANO_VENTANA,
  datosDeHoy,
  datosModo,
  elegirNivel,
  empezarSesion,
  guardarAjustes,
  rachaActual,
  registrarRespuesta,
  reiniciarOido,
  ultimosDias,
  useOido,
} from '../progress/oido.js'
import { Segmentado } from '../components/Opciones.jsx'
import { useOpciones } from '../progress/opciones.js'
import { rutas } from '../router.js'
import { parseNota } from '../theory/notas.js'
import { DIRECCIONES, MODOS_OIDO, PARTES_NIVEL, claseDe, getJuego, getModoOido } from '../theory/oido.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { claro, tinta } from '../ui/color.js'
import { Bocina, Cerrar, Check, Oreja } from '../ui/Iconos.jsx'
import { POP, RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import { BotonInicio } from '../ui/Volver.jsx'
import { BarraAccion } from './Leccion.jsx'

/** #/oido → panel del día; #/oido/intervalos (etc.) → práctica. */
export default function Oido({ modo: modoId }) {
  const modo = modoId ? getModoOido(modoId) : null
  if (modo) return <Entrenador key={modo.id} modo={modo} />
  return <Panel />
}

function nombreNivel(modo, n) {
  return modo.nombreNivel ? modo.nombreNivel(n) : `Nivel ${n}`
}

function porcentaje(a, t) {
  return t ? Math.round((a / t) * 100) : 0
}

function minutos(segundos) {
  const m = segundos / 60
  return m < 10 ? Math.floor(m * 10) / 10 : Math.floor(m)
}

// ---------------------------------------------------------------------------
// Panel: racha, meta del día, ejercicios y estadísticas
// ---------------------------------------------------------------------------

const INICIAL_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function Panel() {
  const estado = useOido()
  const dia = datosDeHoy(estado)
  const racha = rachaActual(estado)
  const semana = ultimosDias(7, estado)
  const avance = Math.min(1, dia.segundos / META_SEGUNDOS)
  const hayDatos = MODOS_OIDO.some((m) => datosModo(m.id, estado).total > 0)

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-6 sm:py-10"
    >
      <BotonInicio />

      <motion.header variants={itemLista} className="flex flex-col gap-2">
        <h1 className="font-titulo text-4xl font-extrabold tracking-tight sm:text-5xl">Entrenamiento de oído</h1>
        <p className="text-lg text-zinc-600">Unos 5 minutos al día. Poco pero seguido es lo que entrena el oído.</p>
      </motion.header>

      <motion.section variants={itemLista} className="flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Hoy</span>
            <span className="font-dato text-3xl font-medium tabular-nums">
              {minutos(dia.segundos)} <span className="text-xl text-zinc-500">/ 5 min</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-juego text-4xl font-semibold tabular-nums">{racha}</span>
            <span className="text-sm text-zinc-500">{racha === 1 ? 'día seguido' : 'días seguidos'}</span>
          </div>
        </div>
        <BarraProgreso valor={avance} color={avance >= 1 ? 'var(--color-bien)' : 'var(--color-zinc-900)'} fondo="bg-zinc-100" alto="h-3" />
        <p className="text-base text-zinc-600">
          {avance >= 1
            ? '¡Meta de hoy cumplida! Si quieres, sigue un rato más.'
            : dia.respuestas > 0
              ? `Llevas ${dia.respuestas} respuestas hoy (${porcentaje(dia.aciertos, dia.respuestas)} % bien).`
              : 'Sugerencia: 2 min de intervalos, 1 de acordes y 2 de oído absoluto.'}
        </p>
        <motion.ol
          className="flex justify-between gap-1"
          aria-label="Últimos 7 días"
          initial="oculta"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.035, delayChildren: 0.25 } } }}
        >
          {semana.map((d) => {
            const [y, m, dd] = d.fecha.split('-').map(Number)
            const letra = INICIAL_DIA[new Date(y, m - 1, dd).getDay()]
            const meta = d.segundos >= META_SEGUNDOS
            return (
              <motion.li
                key={d.fecha}
                className="flex flex-col items-center gap-1"
                variants={{ oculta: { opacity: 0, scale: 0.6 }, visible: { opacity: 1, scale: 1, transition: RESORTE.pulsar } }}
              >
                <span
                  className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${
                    meta ? 'bg-bien-relleno text-blanco' : d.respuestas ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}
                  title={`${d.fecha}: ${minutos(d.segundos)} min`}
                >
                  {meta ? <Check className="size-5" /> : d.respuestas ? '•' : ''}
                </span>
                <span className="text-sm text-zinc-500">{letra}</span>
              </motion.li>
            )
          })}
        </motion.ol>
        {estado.mejorRacha > 0 && (
          <p className="text-sm text-zinc-500">
            Mejor racha: <span className="font-juego text-base text-zinc-700">{estado.mejorRacha} {estado.mejorRacha === 1 ? 'día' : 'días'}</span>
          </p>
        )}
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Ejercicios</h2>
        {MODOS_OIDO.map((m) => {
          const d = datosModo(m.id, estado)
          return (
            <Pulsable
              key={m.id}
              href={rutas.oido(m.id)}
              tipo="tarjeta"
              className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-4"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: claro(m.acento), color: tinta(m.acento) }} aria-hidden>
                <Oreja className="size-7" />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-titulo text-lg font-bold leading-snug">{m.titulo}</span>
                <span className="text-sm leading-snug text-zinc-500">{m.descripcion}</span>
                <span className="text-sm font-semibold" style={{ color: tinta(m.acento) }}>
                  <span className="font-juego text-base">{nombreNivel(m, d.nivel)}</span>
                  {d.total > 0 && ` · ${porcentaje(d.aciertos, d.total)} % bien`}
                </span>
              </span>
              <span aria-hidden className="text-2xl text-zinc-300">›</span>
            </Pulsable>
          )
        })}
      </motion.section>

      {hayDatos && (
        <motion.section variants={itemLista} className="flex flex-col gap-4">
          <h2 className="font-titulo text-2xl font-bold tracking-tight">Estadísticas</h2>
          {MODOS_OIDO.map((m) => (
            <Estadisticas key={m.id} modo={m} datos={datosModo(m.id, estado)} />
          ))}
          <Pulsable
            onClick={() => {
              if (window.confirm('¿Borrar todas las estadísticas y la racha del entrenamiento de oído?')) reiniciarOido()
            }}
            className="min-h-12 self-center rounded-2xl px-6 text-base font-medium text-zinc-500 active:bg-zinc-200"
          >
            Borrar estadísticas
          </Pulsable>
        </motion.section>
      )}
    </motion.main>
  )
}

function Estadisticas({ modo, datos }) {
  if (!datos.total) return null
  const items = Object.entries(datos.items).sort((a, b) => porcentaje(a[1].a, a[1].t) - porcentaje(b[1].a, b[1].t))
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-titulo text-lg font-bold">
          <Oreja className="size-5" /> {modo.titulo}
        </h3>
        <span className="text-sm text-zinc-500">
          {datos.aciertos}/{datos.total} · {porcentaje(datos.aciertos, datos.total)} %
        </span>
      </div>
      <p className="text-sm text-zinc-500">
        Máximo: {nombreNivel(modo, datos.nivelMax)} · Mejor serie de aciertos: {datos.mejorRacha}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map(([id, { a, t }]) => {
          const p = porcentaje(a, t)
          return (
            <li key={id} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 font-medium text-zinc-700">{modo.nombreItem(id)}</span>
              <BarraProgreso valor={p / 100} color={modo.acento} fondo="bg-zinc-100" className="flex-1" />
              <span className="w-20 shrink-0 whitespace-nowrap text-right font-dato tabular-nums text-zinc-500">
                {p} % <span className="text-zinc-500">({t})</span>
              </span>
            </li>
          )
        })}
      </ul>
      {items.length > 1 && <p className="text-sm text-zinc-500">Ordenado de lo que más te cuesta a lo que mejor te sale.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Entrenador: práctica sin fin de un modo
// ---------------------------------------------------------------------------

/** Respuesta cuando se acaba el tiempo (Contrarreloj). */
const SIN_TIEMPO = '__tiempo'

function Entrenador({ modo }) {
  const estado = useOido()
  const datos = datosModo(modo.id, estado)
  const dia = datosDeHoy(estado)
  // Oído absoluto: modo de juego (Normal, Rápido, Contrarreloj) y respuesta con el piano.
  const juego = modo.juegos ? getJuego(datos.ajustes.juego) : null
  // Se elige en la portada (junto al nivel): responder con el piano o con botones.
  const conPiano = Boolean(modo.piano) && datos.ajustes.respuesta !== 'botones'
  const { gesto: sentidoGesto } = useOpciones()

  const [jugando, setJugando] = useState(false)
  const [pregunta, setPregunta] = useState(null)
  const [respuesta, setRespuesta] = useState(null) // id elegido (SIN_TIEMPO si se acabó el tiempo)
  const [resultado, setResultado] = useState(null) // lo que devuelve registrarRespuesta
  const [sesion, setSesion] = useState({ aciertos: 0, total: 0 })
  const contador = useRef(0)
  const [limpiando, setLimpiando] = useState(false)
  const temporizador = useRef(null)
  // Bocina de arriba: en celeste mientras suena la nota.
  const [sonando, setSonando] = useState(false)
  // Contrarreloj: cuándo empieza a correr el tiempo y cuándo se acaba (ms, performance.now()).
  const [reloj, setReloj] = useState(null)
  // Ya respondida, tocar una opción la hace sonar y sus notas se iluminan en el teclado de repaso al sonar.
  const [senal, setSenal] = useState(null) // { notas, n } para la prop `senalar` del Piano
  const cancelarSenal = useRef(null)
  useEffect(() => () => cancelarSenal.current?.(), [])

  useEffect(() => {
    initPiano()
    return () => {
      clearTimeout(temporizador.current)
      releaseAll()
    }
  }, [])

  // Toca la nota y pone la bocina en celeste mientras suena.
  const pararSonar = useRef(null)
  const escuchar = (sonido, retraso = 0) => {
    pararSonar.current?.()
    setSonando(false)
    const dura = reproducir(sonido, { retraso }) ?? 1.5
    const a = setTimeout(() => setSonando(true), retraso * 1000)
    const b = setTimeout(() => setSonando(false), (retraso + dura) * 1000)
    pararSonar.current = () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }
  useEffect(() => () => pararSonar.current?.(), [])

  const nueva = () => {
    const d = datosModo(modo.id)
    const p = modo.generar(d.nivel, d.ajustes, pregunta)
    contador.current += 1
    setPregunta({ ...p, n: contador.current, nivel: d.nivel, opciones: modo.opciones(d.nivel) })
    setRespuesta(null)
    setResultado(null)
    window.scrollTo(0, 0)
    clearTimeout(temporizador.current)
    // Modos sin referencia (oído absoluto): entre pregunta y pregunta suena un
    // "borrador" (notas al azar + ruido) para que la nota anterior no ayude.
    let retraso = 0
    if (modo.limpiar && pregunta) {
      retraso = limpiarOido()
      setLimpiando(true)
      temporizador.current = setTimeout(() => setLimpiando(false), retraso * 1000)
    } else {
      setLimpiando(false)
    }
    escuchar(p.sonido, retraso)
    if (juego?.segundos) {
      const desde = performance.now() + retraso * 1000
      setReloj({ desde, hasta: desde + juego.segundos * 1000 })
    } else setReloj(null)
  }

  const empezar = () => {
    empezarSesion()
    setJugando(true)
    nueva()
  }

  const responder = (id) => {
    if (limpiando) return
    if (respuesta) {
      // Con el piano, la tecla ya suena sola. Con botones: tocar una opción la hace sonar para comparar
      // (y se ve en el teclado de repaso).
      if (conPiano) return
      const sonido = pregunta.sonidoDe(id)
      reproducir(sonido)
      cancelarSenal.current?.()
      cancelarSenal.current = seguirNotas(sonido, (notas) => setSenal((s) => ({ notas, n: (s?.n ?? 0) + 1 })))
      return
    }
    const bien = id === pregunta.item
    setRespuesta(id)
    setResultado(
      registrarRespuesta(modo.id, {
        item: pregunta.item,
        bien,
        niveles: modo.niveles,
        carga: juego ? { acierto: juego.acierto, fallo: juego.fallo, partes: PARTES_NIVEL } : undefined,
      }),
    )
    setSesion((s) => ({ aciertos: s.aciertos + (bien ? 1 : 0), total: s.total + 1 }))
  }

  // Contrarreloj: si se acaba el tiempo sin responder, cuenta como fallo.
  const responderRef = useRef(responder)
  responderRef.current = responder
  useEffect(() => {
    if (!reloj || respuesta) return
    const t = setTimeout(() => responderRef.current(SIN_TIEMPO), Math.max(0, reloj.hasta - performance.now()))
    return () => clearTimeout(t)
  }, [reloj, respuesta])

  let accion
  if (!jugando) {
    accion = { label: 'Empezar', onClick: empezar }
  } else if (limpiando) {
    accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda: 'Borrando la referencia… escucha: ahora viene la nota' }
  } else if (!respuesta) {
    accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda: conPiano ? 'Toca la nota en el piano' : 'Toca tu respuesta arriba' }
  } else {
    const bien = respuesta === pregunta.item
    const sinTiempo = respuesta === SIN_TIEMPO
    let texto = bien || sinTiempo ? pregunta.explicacion : `Elegiste ${modo.nombreItem(respuesta)}. ${pregunta.explicacion}`
    if (!bien) texto += conPiano ? ' Toca las teclas para compararlas.' : ' Toca las opciones para compararlas.'
    if (resultado?.subio) {
      const nuevos = modo.nuevosEnNivel(resultado.nuevoNivel).join(', ')
      texto += ` **¡Subiste a ${nombreNivel(modo, resultado.nuevoNivel).toLowerCase()}!** Nuevo: ${nuevos}.`
    }
    if (resultado?.metaCumplida) texto += ' **¡Cumpliste tus 5 minutos de hoy!**'
    accion = {
      label: 'Continuar',
      onClick: nueva,
      feedback: bien
        ? { tipo: 'bien', titulo: '¡Correcto!', texto }
        : { tipo: 'mal', titulo: `${sinTiempo ? 'Se acabó el tiempo. ' : ''}Era ${modo.nombreItem(pregunta.item)}.`, texto },
    }
  }

  const avanceHoy = Math.min(1, dia.segundos / META_SEGUNDOS)

  // Gesto del botón (pedido del usuario): en el entrenador solo pasa a la SIGUIENTE pregunta (nunca atrás) y solo
  // cuando el botón ya dice «Continuar» (respondida); mientras se borra la referencia o falta responder, no pasa.
  const navegacion = jugando
    ? {
        invertido: sentidoGesto === 'invertido',
        puede: (dir) => dir > 0 && Boolean(respuesta) && !limpiando,
        ir: (dir) => {
          if (dir > 0) nueva()
        },
      }
    : null

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
          <Pulsable
            href={rutas.oido()}
            aria-label="Volver al entrenamiento de oído"
            className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
          >
            <Cerrar className="size-6" />
          </Pulsable>
          <div className={`flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full pl-4 pr-3 ${VIDRIO}`}>
            <BarraProgreso
              valor={avanceHoy}
              color={avanceHoy >= 1 ? 'var(--color-bien)' : modo.acento}
              alto="h-3"
              alAparecer={false}
              className="flex-1"
              aria-label={`Hoy: ${minutos(dia.segundos)} de 5 minutos`}
            />
            <span className="w-20 shrink-0 text-right font-dato text-sm tabular-nums text-zinc-600">{minutos(dia.segundos)}/5 min</span>
          </div>
          {/* Escuchar otra vez: solo la bocina (pedido del usuario). */}
          {jugando && (
            <Pulsable
              onClick={() => escuchar(pregunta.sonido)}
              disabled={limpiando}
              aria-label="Escuchar otra vez"
              data-escuchar
              className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${VIDRIO} ${
                sonando ? 'text-sky-500' : 'text-zinc-700'
              }`}
            >
              <Bocina className="size-6" />
            </Pulsable>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4">
        {!jugando ? (
          <Portada modo={modo} datos={datos} />
        ) : (
          <motion.div
            key={pregunta.n}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
            className="flex flex-col gap-5"
          >
            {juego ? (
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tinta(modo.acento) }}>
                  <Oreja className="size-[18px]" />
                  {modo.titulo} · {juego.nombre}
                </span>
                <CirculoNivel
                  numero={modo.nombreNivel ? pregunta.nivel + 1 : pregunta.nivel}
                  llenas={resultado ? (resultado.subio ? PARTES_NIVEL : resultado.carga) : datos.carga}
                  maximo={datos.nivel >= modo.niveles}
                  subio={Boolean(resultado?.subio)}
                  nuevo={resultado?.subio ? resultado.nuevoNivel + 1 : null}
                  acento={modo.acento}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: tinta(modo.acento) }}>
                    <Oreja className="size-[18px]" />
                    {modo.titulo} · <span className="font-juego text-base">{nombreNivel(modo, pregunta.nivel)}</span>
                  </span>
                  <span className="font-dato tabular-nums">
                    {sesion.aciertos}/{sesion.total}
                    {datos.racha > 1 && ` · ${datos.racha} seguidas`}
                  </span>
                </div>
                <Ventana datos={datos} niveles={modo.niveles} acento={modo.acento} />
              </>
            )}

            <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{modo.pregunta}</h1>

            {reloj && <Reloj desde={reloj.desde} hasta={reloj.hasta} parado={Boolean(respuesta)} acento={modo.acento} />}

            {conPiano ? (
              <PianoRespuesta pregunta={pregunta} respuesta={respuesta} inactivo={limpiando} onResponder={responder} />
            ) : (
              <div className={`grid gap-3 ${pregunta.opciones.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {pregunta.opciones.map((op) => (
                  <Pulsable
                    key={op.id}
                    onClick={() => responder(op.id)}
                    disabled={limpiando}
                    // La correcta da un pequeño "salto" al revelarse.
                    animate={respuesta && op.id === pregunta.item ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    className={`min-h-16 rounded-2xl border-2 px-2 py-3 text-center text-lg font-semibold leading-tight transition-colors duration-200 disabled:opacity-50 ${claseOpcion(op.id, pregunta.item, respuesta)}`}
                  >
                    {op.label}
                  </Pulsable>
                ))}
              </div>
            )}

            {!conPiano && respuesta && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={RESORTE.suave}
                className="flex flex-col gap-2"
              >
                <p className="text-sm text-zinc-500">En el teclado (puedes tocarlo):</p>
                <Piano
                  key={pregunta.n}
                  tecladoArriba
                  compacto
                  startOctave={octavaInicial(pregunta.notas)}
                  octaves={2}
                  marcadas={pregunta.notas}
                  senalar={senal}
                  sinEstado
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      <BarraAccion accion={accion} navegacion={navegacion} />
    </div>
  )
}

/**
 * Oído absoluto: se responde tocando una tecla (pedido del usuario). Una octava, la de la nota que sonó; las notas
 * que aún no se desbloquean van con candado. Al responder: la correcta en verde con ✓ y la elegida (si no era) en
 * oro con bombilla; después las teclas suenan para comparar.
 */
function PianoRespuesta({ pregunta, respuesta, inactivo, onResponder }) {
  const nota = pregunta.notas[0]
  const octava = parseNota(nota).octava
  const libres = new Set(pregunta.opciones.map((o) => o.id))
  const estados = {}
  if (respuesta) {
    if (respuesta !== pregunta.item && respuesta !== SIN_TIEMPO) estados[`${respuesta}${octava}`] = 'fijate'
    estados[`${pregunta.item}${octava}`] = 'bien'
  }
  return (
    <Piano
      startOctave={octava}
      octaves={1}
      bloqueada={(n) => !libres.has(claseDe(n))}
      inactivo={inactivo}
      estados={estados}
      sinEstado
      onNoteOn={(n) => onResponder(claseDe(n))}
    />
  )
}

/**
 * Indicador de nivel (pedido del usuario): un círculo en 8 partes que se llenan con los aciertos; en el centro, el
 * número de notas. Al llenarse sube de nivel (da un «pop» y cambia el número).
 */
function CirculoNivel({ numero, llenas, maximo, subio, nuevo, acento }) {
  const R = 23
  const C = 28
  const HUECO = 20 // grados entre partes (con las puntas redondeadas)
  const arco = (i) => {
    const a0 = ((-90 + i * (360 / PARTES_NIVEL) + HUECO / 2) * Math.PI) / 180
    const a1 = ((-90 + (i + 1) * (360 / PARTES_NIVEL) - HUECO / 2) * Math.PI) / 180
    const p = (a) => `${(C + R * Math.cos(a)).toFixed(2)} ${(C + R * Math.sin(a)).toFixed(2)}`
    return `M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}`
  }
  const total = maximo ? PARTES_NIVEL : llenas
  const n = nuevo ?? numero
  return (
    <motion.div
      data-circulo-nivel
      data-llenas={total}
      role="img"
      aria-label={maximo ? `${n} notas: nivel máximo` : nuevo ? `¡Subiste a ${n} notas!` : `${n} notas · ${total} de ${PARTES_NIVEL} para la siguiente`}
      className="relative grid size-14 shrink-0 place-items-center"
      animate={subio ? POP : { scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <svg viewBox="0 0 56 56" className="absolute inset-0 size-full" aria-hidden>
        {Array.from({ length: PARTES_NIVEL }, (_, i) => (
          <motion.path
            key={i}
            d={arco(i)}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            initial={false}
            animate={{ stroke: i < total ? acento : 'var(--color-zinc-200)' }}
            transition={{ duration: 0.25, delay: subio ? i * 0.03 : 0 }}
          />
        ))}
      </svg>
      <motion.span
        key={n}
        initial={nuevo ? { scale: 0.6, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={RESORTE.pulsar}
        className="font-juego text-xl font-semibold tabular-nums"
        style={{ color: tinta(acento) }}
      >
        {n}
      </motion.span>
    </motion.div>
  )
}

/** Contrarreloj: barra con el tiempo que queda para responder (se vacía; en oro el último segundo y medio). */
function Reloj({ desde, hasta, parado, acento }) {
  const queda = useMotionValue(1)
  const [poco, setPoco] = useState(false)
  const [segundos, setSegundos] = useState(Math.ceil((hasta - desde) / 1000))
  useEffect(() => {
    if (parado) return
    let id
    const paso = () => {
      const ahora = performance.now()
      const f = Math.max(0, Math.min(1, (hasta - ahora) / (hasta - desde)))
      queda.set(f)
      setPoco(hasta - ahora < 1500)
      setSegundos(Math.max(0, Math.ceil((hasta - Math.max(ahora, desde)) / 1000)))
      if (f > 0) id = requestAnimationFrame(paso)
    }
    paso()
    return () => cancelAnimationFrame(id)
  }, [desde, hasta, parado, queda])
  return (
    <div className="flex items-center gap-3" data-reloj>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200">
        <motion.div
          className="h-full origin-left rounded-full transition-colors duration-200"
          style={{ scaleX: queda, backgroundColor: poco ? 'var(--color-fijate)' : acento }}
        />
      </div>
      <span className={`w-10 text-right font-dato text-base font-medium tabular-nums ${poco ? 'text-fijate-tinta' : 'text-zinc-600'}`}>{segundos} s</span>
    </div>
  )
}

function octavaInicial(notas) {
  return Math.min(...notas.map((n) => parseNota(n).octava))
}

function claseOpcion(id, correcta, respuesta) {
  if (!respuesta) return 'border-zinc-200 bg-white text-zinc-800'
  if (id === correcta) return 'border-bien bg-bien-suave text-bien-tinta'
  if (id === respuesta) return 'border-fijate bg-fijate-suave text-fijate-tinta'
  return 'border-zinc-200 bg-white text-zinc-500'
}

/** Puntos con las últimas respuestas del nivel: muestra cuánto falta para subir. */
function Ventana({ datos, niveles, acento }) {
  if (datos.nivel >= niveles) {
    return <p className="text-sm text-zinc-500">¡Nivel máximo! Sigue practicando para afinar.</p>
  }
  const puntos = Array.from({ length: TAMANO_VENTANA }, (_, i) => datos.ventana[i])
  const aciertos = datos.ventana.filter(Boolean).length
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5" aria-hidden>
        {puntos.map((v, i) => (
          <motion.span
            key={i}
            className="h-2 flex-1 rounded-full"
            initial={false}
            animate={{ backgroundColor: v === true ? acento : v === false ? 'var(--color-fijate)' : 'var(--color-zinc-200)' }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        {aciertos} de los últimos {TAMANO_VENTANA} · con {ACIERTOS_PARA_SUBIR} subes de nivel
      </p>
    </div>
  )
}

/** Pantalla antes de empezar: qué se practica, nivel y ajustes. */
function Portada({ modo, datos }) {
  const opciones = modo.opciones(datos.nivel)
  return (
    <motion.div variants={lista} initial="oculta" animate="visible" className="flex flex-col gap-6">
      <motion.header variants={itemLista} className="flex flex-col gap-2">
        <span className="grid size-14 place-items-center rounded-2xl" style={{ backgroundColor: claro(modo.acento), color: tinta(modo.acento) }} aria-hidden>
          <Oreja className="size-8" />
        </span>
        <h1 className="font-titulo text-3xl font-bold tracking-tight sm:text-4xl">{modo.titulo}</h1>
        <p className="text-lg leading-relaxed text-zinc-600">{modo.descripcion}</p>
      </motion.header>

      {modo.id === 'absoluto' && (
        <motion.p variants={itemLista} className="rounded-2xl bg-fijate-suave px-4 py-3 text-base leading-relaxed text-fijate-tinta">
          <Rich>
            Es un **juego**: suena una nota sin ninguna referencia y la tocas en el piano. Empiezas con 2 notas (las demás
            tienen candado) y se desbloquea una más cada vez que llenas el círculo de 8 partes. En adultos el oído absoluto
            es muy difícil de adquirir, así que tómalo como un reto divertido, no como una promesa. Entre nota y nota suenan
            unas notas al azar y un ruido corto: así la nota anterior no te sirve de pista.
          </Rich>
        </motion.p>
      )}

      {modo.juegos && (
        <motion.section variants={itemLista} className="flex flex-col gap-3">
          <h2 className="font-titulo text-lg font-bold">Modo de juego</h2>
          <div className="flex flex-col gap-2">
            {modo.juegos.map((j) => {
              const activo = getJuego(datos.ajustes.juego).id === j.id
              return (
                <Pulsable
                  key={j.id}
                  tipo="tarjeta"
                  onClick={() => guardarAjustes(modo.id, { juego: j.id })}
                  aria-pressed={activo}
                  data-juego={j.id}
                  className={`flex min-h-16 flex-col items-start gap-0.5 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-200 ${
                    activo ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-800'
                  }`}
                >
                  <span className="text-base font-semibold">{j.nombre}</span>
                  <span className={`text-sm leading-snug ${activo ? 'text-zinc-300' : 'text-zinc-500'}`}>{j.descripcion}</span>
                </Pulsable>
              )
            })}
          </div>
        </motion.section>
      )}

      <motion.section variants={itemLista} className="flex flex-col gap-3">
        <h2 className="font-titulo text-lg font-bold">Nivel</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: datos.nivelMax }, (_, i) => i + 1).map((n) => (
            <Pulsable
              key={n}
              onClick={() => elegirNivel(modo.id, n)}
              aria-pressed={datos.nivel === n}
              className={`min-h-12 rounded-full border-2 px-4 font-juego text-base font-medium transition-colors duration-200 ${
                datos.nivel === n ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              {nombreNivel(modo, n)}
            </Pulsable>
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          {modo.juegos ? `Sube al llenar el círculo de ${PARTES_NIVEL} partes.` : `Sube solo al acertar ${ACIERTOS_PARA_SUBIR} de ${TAMANO_VENTANA}.`}
          {datos.nivelMax < modo.niveles && ' Los niveles que desbloquees aparecerán aquí.'}
        </p>
        {modo.id !== 'acordes' ? (
          <div className="flex flex-wrap gap-2">
            {opciones.map((o) => (
              <span key={o.id} className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700">
                {o.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-base text-zinc-700">{modo.nuevosEnNivel(datos.nivel)[0]}.</p>
        )}
      </motion.section>

      {modo.piano && (
        <motion.section variants={itemLista} className="flex flex-col gap-3">
          <h2 id="responder-con" className="font-titulo text-lg font-bold">
            Responder con
          </h2>
          <Segmentado
            etiqueta="responder-con"
            capa="responder-con"
            opciones={[
              { id: 'piano', nombre: 'Piano' },
              { id: 'botones', nombre: 'Botones' },
            ]}
            valor={datos.ajustes.respuesta === 'botones' ? 'botones' : 'piano'}
            onCambiar={(id) => guardarAjustes(modo.id, { respuesta: id })}
          />
          <p className="text-sm text-zinc-500">
            {datos.ajustes.respuesta === 'botones'
              ? 'Un botón por nota; solo las que ya desbloqueaste.'
              : 'Tocas la nota en el piano; las que aún no desbloqueas tienen candado.'}
          </p>
        </motion.section>
      )}

      {modo.id === 'intervalos' && (
        <motion.section variants={itemLista} className="flex flex-col gap-3">
          <h2 className="font-titulo text-lg font-bold">Cómo suenan las dos notas</h2>
          <div className="grid grid-cols-3 gap-2">
            {DIRECCIONES.map((d) => {
              const activa = (datos.ajustes.direccion ?? 'sube') === d.id
              return (
                <Pulsable
                  key={d.id}
                  onClick={() => guardarAjustes(modo.id, { direccion: d.id })}
                  aria-pressed={activa}
                  className={`min-h-12 rounded-2xl border-2 px-2 text-base font-semibold transition-colors duration-200 ${
                    activa ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'
                  }`}
                >
                  {d.label}
                </Pulsable>
              )
            })}
          </div>
        </motion.section>
      )}

      {datos.total > 0 && (
        <motion.p variants={itemLista} className="text-base text-zinc-500">
          Llevas {datos.total} respuestas en total, {porcentaje(datos.aciertos, datos.total)} % bien. Mejor serie: {datos.mejorRacha} seguidas.
        </motion.p>
      )}
    </motion.div>
  )
}
