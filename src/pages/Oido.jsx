import { animate, motion, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { initPiano, limpiarOido, releaseAll } from '../audio/engine.js'
import { reproducir, seguirNotas } from '../audio/sonido.js'
import Piano from '../components/Piano.jsx'
import ArranqueOido from '../components/ArranqueOido.jsx'
import {
  ACIERTOS_PARA_SUBIR,
  META_SEGUNDOS,
  datosDeHoy,
  datosModo,
  elegirNivel,
  empezarSesion,
  rachaActual,
  registrarRespuesta,
  reiniciarOido,
  ultimosDias,
  useOido,
} from '../progress/oido.js'
import { useOpciones } from '../progress/opciones.js'
import { rutas } from '../router.js'
import { parseNota } from '../theory/notas.js'
import {
  MODOS_OIDO,
  PARTES_NIVEL,
  VIDAS_ESCALADA,
  VIDAS_INFINITAS,
  ajusteAbsoluto,
  claseDe,
  getJuego,
  getModoOido,
  nombreClase,
  notasInicialesRapido,
  octavasDe,
  quitarNotaAlAzar,
  sumarNotas,
  vidasDe,
} from '../theory/oido.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { claro, tinta } from '../ui/color.js'
import { Atras, Bocina, Check, Oreja } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useTemblor from '../ui/useTemblor.js'
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
  // Oído absoluto: modo de juego (Normal, Rápido, Contrarreloj) y respuesta con el piano.
  const juego = modo.juegos ? getJuego(datos.ajustes.juego) : null
  // Modo Rápido: el nivel es un multiplicador y la partida lleva sus propias notas (ver JUEGOS_ABSOLUTO).
  const rapido = Boolean(juego?.multiplicador)
  const multiplicador = ajusteAbsoluto(datos.ajustes, 'multiplicador')
  const cadaAciertos = ajusteAbsoluto(datos.ajustes, 'cadaAciertos')
  const segundosPorNota = juego?.segundos ? ajusteAbsoluto(datos.ajustes, 'segundos') : null
  // { notas, aciertos }: las notas de la partida y los aciertos que lleva (cada `cadaAciertos` se suman notas).
  const [partida, setPartida] = useState(null)
  const partidaRef = useRef(null)
  const cambiarPartida = (p) => {
    partidaRef.current = p
    setPartida(p)
  }
  // Se elige en la portada (junto al nivel): responder con el piano o con botones.
  const conPiano = Boolean(modo.piano) && datos.ajustes.respuesta !== 'botones'
  const { gesto: sentidoGesto, admin } = useOpciones()
  // Modo administrador (pedido del usuario): al sonar, la respuesta se señala (en oro, sin presionarla).
  const [sono, setSono] = useState(false)
  // Piano de respuesta: la octava que se está viendo (se conserva entre preguntas) y la tecla que se tocó.
  const [octavaVista, setOctavaVista] = useState(4)
  const [pulsada, setPulsada] = useState(null)

  const [jugando, setJugando] = useState(false)
  const [vidas, setVidas] = useState(null)
  const [golpes, setGolpes] = useState(0)
  const vidasRef = useRef(null)
  const cambiarVidas = (v) => {
    vidasRef.current = v
    setVidas(v)
  }
  const [pregunta, setPregunta] = useState(null)
  const [respuesta, setRespuesta] = useState(null) // id elegido (SIN_TIEMPO si se acabó el tiempo)
  const [resultado, setResultado] = useState(null) // lo que devuelve registrarRespuesta
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

  // Al abrir el modo, el nivel es el más alto al que has llegado (pedido del usuario): solo elegir y empezar.
  useEffect(() => {
    const d = datosModo(modo.id)
    if (d.nivel < d.nivelMax) elegirNivel(modo.id, d.nivelMax)
  }, [modo.id])

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
    const a = setTimeout(() => {
      setSonando(true)
      setSono(true)
    }, retraso * 1000)
    const b = setTimeout(() => setSonando(false), (retraso + dura) * 1000)
    pararSonar.current = () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }
  useEffect(() => () => pararSonar.current?.(), [])

  const nueva = () => {
    const d = datosModo(modo.id)
    const ajustes = rapido && partidaRef.current ? { ...d.ajustes, notas: partidaRef.current.notas } : d.ajustes
    const p = modo.generar(d.nivel, ajustes, pregunta)
    contador.current += 1
    setPregunta({ ...p, n: contador.current, nivel: d.nivel, opciones: modo.opciones(d.nivel, ajustes) })
    setRespuesta(null)
    setResultado(null)
    setSono(false)
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
    if (segundosPorNota) {
      const desde = performance.now() + retraso * 1000
      setReloj({ desde, hasta: desde + segundosPorNota * 1000 })
    } else setReloj(null)
  }

  const empezar = () => {
    empezarSesion()
    const inicio = rapido ? notasInicialesRapido(multiplicador) : null
    if (rapido) cambiarPartida({ notas: inicio, aciertos: 0 })
    // Vidas de la partida (pedido del usuario). `alcanzados`: niveles a los que ya se subió en esta partida (solo
    // la primera vez que se sube a cada uno se gana una vida). En la Escalada (Rápido con 0) las vidas son las notas
    // que llevas por encima de las del inicio.
    const v = vidasDe(datosModo(modo.id).ajustes, rapido)
    const escalada = rapido && v === VIDAS_ESCALADA
    cambiarVidas({
      infinitas: v === VIDAS_INFINITAS,
      escalada,
      actual: escalada ? 0 : v,
      max: escalada ? 0 : v,
      inicio: inicio?.length ?? null,
      alcanzados: [rapido ? inicio.length : datosModo(modo.id).nivel],
    })
    setJugando(true)
    nueva()
  }

  // Sin vidas: vuelve a la pantalla de arranque.
  const terminar = () => {
    clearTimeout(temporizador.current)
    pararSonar.current?.()
    releaseAll()
    setJugando(false)
    setPregunta(null)
    setRespuesta(null)
    setResultado(null)
    setReloj(null)
    window.scrollTo(0, 0)
  }

  const responder = (id, tecla = null) => {
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
    setPulsada(tecla)
    const r = registrarRespuesta(modo.id, {
      item: pregunta.item,
      bien,
      niveles: modo.niveles,
      sinNivel: rapido,
      carga: juego && !rapido ? { acierto: juego.acierto, fallo: juego.fallo, partes: PARTES_NIVEL } : undefined,
    })
    if (rapido) {
      // Cada `cadaAciertos` aciertos se suman N notas (el multiplicador); cada fallo quita una al azar.
      const antes = partidaRef.current
      const aciertos = antes.aciertos + (bien ? 1 : 0)
      let cambio = { notas: antes.notas, sumadas: [], quitada: null }
      if (bien && aciertos % cadaAciertos === 0) cambio = { ...cambio, ...sumarNotas(antes.notas, multiplicador) }
      if (!bien) cambio = { ...cambio, ...quitarNotaAlAzar(antes.notas) }
      cambiarPartida({ notas: cambio.notas, aciertos })
      // `ronda`: se completaron los aciertos de la ronda (la barra se llena aunque ya no queden notas por sumar).
      r.partida = { sumadas: cambio.sumadas, quitada: cambio.quitada, ronda: bien && aciertos % cadaAciertos === 0 }
    }
    // Vidas: cada fallo (también por tiempo) quita una; subir a un nivel nuevo en la partida da una (si no están
    // llenas). En la Escalada, las vidas son las notas por encima del inicio y un fallo al volver al inicio acaba.
    const vv = vidasRef.current
    if (vv && !vv.infinitas) {
      let { actual, max, alcanzados } = vv
      let fin = false
      if (vv.escalada) {
        const arriba = partidaRef.current.notas.length - vv.inicio
        actual = Math.max(0, arriba)
        max = Math.max(max, actual)
        fin = !bien && arriba <= 0
      } else {
        if (!bien) actual -= 1
        const nuevoNivel = rapido ? (r.partida.sumadas.length ? partidaRef.current.notas.length : null) : r.subio ? r.nuevoNivel : null
        if (nuevoNivel != null && !alcanzados.includes(nuevoNivel)) {
          alcanzados = [...alcanzados, nuevoNivel]
          if (actual < max) actual += 1
        }
        fin = actual <= 0
      }
      cambiarVidas({ ...vv, actual, max, alcanzados })
      if (actual < vv.actual) setGolpes((g) => g + 1) // perder una vida: los vidrios de arriba brillan en rojo y tiemblan
      r.vidas = { antes: vv.actual, despues: actual, fin }
    }
    setResultado(r)
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
    accion = { label: 'Empezar', onClick: empezar, flotante: true }
  } else if (limpiando) {
    accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda: 'Borrando la referencia… escucha: ahora viene la nota' }
  } else if (!respuesta) {
    accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda: conPiano ? 'Toca la nota en el piano' : 'Toca tu respuesta arriba' }
  } else {
    const fin = Boolean(resultado?.vidas?.fin)
    const bien = respuesta === pregunta.item
    const sinTiempo = respuesta === SIN_TIEMPO
    let texto = bien || sinTiempo ? pregunta.explicacion : `Elegiste ${modo.nombreItem(respuesta, datos.ajustes)}. ${pregunta.explicacion}`
    if (!bien) texto += conPiano ? ' Toca las teclas para compararlas.' : ' Toca las opciones para compararlas.'
    const cambio = resultado?.partida
    if (cambio?.sumadas.length) {
      texto += ` **¡+${cambio.sumadas.length} ${cambio.sumadas.length === 1 ? 'nota' : 'notas'}!** ${cambio.sumadas.map((c) => nombreClase(c, datos.ajustes.cifrado)).join(', ')}.`
    }
    if (cambio?.quitada) texto += ` Se fue ${nombreClase(cambio.quitada, datos.ajustes.cifrado)}.`
    if (resultado?.subio) {
      const nuevos = modo.nuevosEnNivel(resultado.nuevoNivel).join(', ')
      texto += ` **¡Subiste a ${nombreNivel(modo, resultado.nuevoNivel).toLowerCase()}!** Nuevo: ${nuevos}.`
    }
    if (resultado?.metaCumplida) texto += ' **¡Cumpliste tus 5 minutos de hoy!**'
    if (resultado?.vidas?.despues > resultado?.vidas?.antes && !vidas?.escalada) texto += ' **¡+1 vida!**'
    if (fin) texto += vidas?.escalada ? ' **Volviste al inicio: se acabó la escalada.**' : ' **¡Se acabaron las vidas!**'
    accion = {
      label: 'Continuar',
      onClick: fin ? terminar : nueva,
      feedback: bien
        ? { tipo: 'bien', titulo: '¡Correcto!', texto }
        : { tipo: 'mal', titulo: `${sinTiempo ? 'Se acabó el tiempo. ' : ''}Era ${modo.nombreItem(pregunta.item, datos.ajustes)}.`, texto },
    }
  }

  // Barra de arriba (pedido del usuario): se llena con los aciertos que faltan para subir de nivel. Oído absoluto:
  // las partes del círculo (8); Rápido: los aciertos para sumar notas; intervalos y acordes: 8 de los últimos 10.
  let avance
  if (rapido) avance = ((partida?.aciertos ?? 0) % cadaAciertos) / cadaAciertos
  else if (datos.nivel >= modo.niveles) avance = 1
  else if (juego) avance = (datos.carga ?? 0) / PARTES_NIVEL
  else avance = Math.min(1, datos.ventana.filter(Boolean).length / ACIERTOS_PARA_SUBIR)
  // Al subir (o al sumar notas en Rápido) la barra se llena del todo y vuelve a empezar.
  const lleno = Boolean(resultado?.subio || resultado?.partida?.ronda)
  const nivelVisto = rapido ? multiplicador : jugando && pregunta ? (resultado?.subio ? resultado.nuevoNivel : pregunta.nivel) : datos.nivel

  // Color de la dificultad (la barra de aciertos lo toma; en Contrarreloj, mientras corre el tiempo, va en amarillo).
  const colorDif = `var(--color-dificultad-${ajusteAbsoluto(datos.ajustes, 'octavas')})`
  // Solo jugando (pedido del usuario): mientras se configura, la barra sigue igual de delgada.
  const vidasVista = jugando && vidas && !vidas.infinitas && { actual: vidas.actual, max: Math.max(1, vidas.max) }

  // Gesto del botón (pedido del usuario): en el entrenador solo pasa a la SIGUIENTE pregunta (nunca atrás) y solo
  // cuando el botón ya dice «Continuar» (respondida); mientras se borra la referencia o falta responder, no pasa.
  const navegacion = jugando
    ? {
        invertido: sentidoGesto === 'invertido',
        puede: (dir) => dir > 0 && Boolean(respuesta) && !limpiando,
        ir: (dir) => {
          if (dir > 0) (resultado?.vidas?.fin ? terminar : nueva)()
        },
      }
    : null

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
          <Golpe n={golpes}>
            <Pulsable
              href={rutas.oido()}
              aria-label="Volver al entrenamiento de oído"
              className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
            >
              <Atras className="size-6" />
            </Pulsable>
          </Golpe>
          <Golpe n={golpes} className="min-w-0 flex-1">
            {/* Píldora de vidrio: arriba los aciertos y, ya jugando, debajo las vidas (barra roja lisa; con ∞ no sale). */}
            <div className={`flex min-h-11 w-full min-w-0 flex-col justify-center gap-1.5 rounded-full px-4 py-2 ${VIDRIO}`}>
              <BarraAciertos
                key={`${modo.id}-${jugando}`}
                avance={avance}
                lleno={lleno}
                reloj={jugando ? reloj : null}
                parado={Boolean(respuesta)}
                acento={colorDif}
              />
              {vidasVista && <BarraVidas actual={vidasVista.actual} max={vidasVista.max} />}
            </div>
          </Golpe>
          {/* Escuchar otra vez: solo la bocina (pedido del usuario). */}
          {jugando && (
            <Golpe n={golpes}>
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
            </Golpe>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4">
        {!jugando ? (
          <ArranqueOido modo={modo} datos={datos} />
        ) : (
          <motion.div
            key={pregunta.n}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tinta(modo.acento) }}>
                <Oreja className="size-[18px]" />
                {modo.titulo}
                {juego && ` · ${juego.nombre}`}
              </span>
              {/* Indicador del nivel (sin el círculo: el avance va en la barra de arriba). */}
              <motion.span
                key={nivelVisto}
                initial={resultado?.subio ? { scale: 0.6, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={RESORTE.pulsar}
                data-nivel={nivelVisto}
                className="font-juego text-lg font-semibold tracking-wide"
                style={{ color: tinta(modo.acento) }}
              >
                Nivel {nivelVisto}
              </motion.span>
            </div>

            <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{modo.pregunta}</h1>

            {conPiano ? (
              <PianoRespuesta
                pregunta={pregunta}
                respuesta={respuesta}
                pulsada={pulsada}
                octavas={octavasDe(ajusteAbsoluto(datos.ajustes, 'octavas'))}
                vista={octavaVista}
                onVista={setOctavaVista}
                inactivo={limpiando}
                pista={admin && sono}
                onResponder={responder}
              />
            ) : (
              <div className={`grid gap-3 ${pregunta.opciones.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {pregunta.opciones.map((op) => (
                  <Pulsable
                    key={op.id}
                    onClick={() => responder(op.id)}
                    disabled={limpiando}
                    // La correcta da un pequeño "salto" al revelarse.
                    animate={respuesta && op.id === pregunta.item ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    data-pista={admin && sono && !respuesta && op.id === pregunta.item ? true : undefined}
                    className={`min-h-16 rounded-2xl border-2 px-2 py-3 text-center text-lg font-semibold leading-tight transition-colors duration-200 disabled:opacity-50 ${
                      admin && sono && !respuesta && op.id === pregunta.item ? 'border-fijate bg-fijate-suave text-fijate-tinta' : claseOpcion(op.id, pregunta.item, respuesta)
                    }`}
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
function PianoRespuesta({ pregunta, respuesta, pulsada, octavas, vista, onVista, inactivo, pista, onResponder }) {
  const nota = pregunta.notas[0]
  const octava = parseNota(nota).octava
  const libres = new Set(pregunta.opciones.map((o) => o.id))
  const estados = {}
  if (respuesta) {
    if (respuesta !== pregunta.item && pulsada) estados[pulsada] = 'fijate'
    estados[`${pregunta.item}${octava}`] = 'bien'
  }
  // Las octavas de la dificultad, con su barra (pedido del usuario): se cambian a mano; el teclado NO va solo a la
  // octava que sonó (solo en modo administrador, con la pista, o ya respondida, para ver la correcta).
  return (
    <Piano
      startOctave={octavas[0]}
      octaves={octavas.length}
      octavaInicial={vista}
      onOctava={onVista}
      bloqueada={(n) => !libres.has(claseDe(n))}
      inactivo={inactivo}
      estados={estados}
      // Modo administrador: al sonar, el teclado va a la nota y la resalta en oro (sin tocarla).
      marcadas={pista && !respuesta ? [nota] : []}
      ir={pista || respuesta ? nota : undefined}
      sinEstado
      onNoteOn={(n) => onResponder(claseDe(n), n)}
    />
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

/**
 * Barra de arriba del entrenador (pedido del usuario): se llena con los aciertos que faltan para subir de nivel.
 * En Contrarreloj tiene doble función: mientras se borra la referencia sigue mostrando los aciertos y, justo antes de
 * que suene la nota, se vacía; al sonar se va llenando con el tiempo, en amarillo (`fijate`). Al responder —o si se
 * llena: fallo— primero vuelve a donde estaba, ahí recupera el color de la dificultad, y luego suma (o pierde) el
 * acierto. Al subir de nivel se llena del todo y vuelve a empezar.
 */
function BarraAciertos({ avance, lleno, reloj, parado, acento }) {
  const w = useMotionValue(avance)
  const previo = useRef(avance)
  const [tono, setTono] = useState('aciertos') // aciertos | tiempo
  const [modoBarra, setModoBarra] = useState('aciertos')
  const corriendo = Boolean(reloj) && !parado

  useEffect(() => {
    let cancelado = false
    let anim = null
    let raf = 0
    const ir = (v, t = RESORTE.suave) =>
      new Promise((listo) => {
        anim = animate(w, v, { ...t, onComplete: listo })
      })
    const espera = (ms) => new Promise((listo) => setTimeout(listo, ms))
    if (corriendo) {
      // Se vacía y, al sonar la nota, se llena con el tiempo.
      ;(async () => {
        // Espera a que esté por acabar el borrador de la referencia: no se vacía antes.
        const VACIAR = 300
        const falta = reloj.desde - VACIAR - performance.now()
        if (falta > 0) await espera(falta)
        if (cancelado) return
        setModoBarra('tiempo')
        await ir(0, { duration: VACIAR / 1000, ease: 'easeOut' })
        if (cancelado) return
        setTono('tiempo')
        const paso = () => {
          if (cancelado) return
          const f = Math.max(0, Math.min(1, (performance.now() - reloj.desde) / (reloj.hasta - reloj.desde)))
          w.set(f)
          if (f < 1) raf = requestAnimationFrame(paso)
        }
        paso()
      })()
    } else {
      ;(async () => {
        // Primero vuelve a donde estaba (si el reloj la movió) y luego suma o resta el acierto.
        if (Math.abs(w.get() - previo.current) > 0.001) {
          await ir(previo.current, RESORTE.pantalla)
          if (cancelado) return
        }
        setTono('aciertos')
        setModoBarra('aciertos')
        if (lleno) {
          await ir(1)
          if (cancelado) return
          await espera(250)
          if (cancelado) return
          w.set(0)
        }
        await ir(avance)
        if (!cancelado) previo.current = avance
      })()
    }
    return () => {
      cancelado = true
      anim?.stop()
      cancelAnimationFrame(raf)
    }
  }, [corriendo, reloj, avance, lleno, w])

  const color = tono === 'tiempo' ? 'var(--color-fijate)' : acento
  return (
    <div
      className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200"
      role="progressbar"
      aria-label={modoBarra === 'tiempo' ? 'Tiempo para responder' : 'Aciertos para subir de nivel'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(avance * 100)}
      data-barra-aciertos={modoBarra}
    >
      <motion.div
        className="h-full w-full origin-left rounded-full transition-colors duration-200"
        style={{ scaleX: w, backgroundColor: color }}
      />
    </div>
  )
}

/**
 * Vidas de la partida (pedido del usuario): barra roja LISA debajo de la de aciertos (no en partes); se acorta o
 * crece con un resorte. Solo sale jugando y con vidas contadas (con ∞, no).
 */
function BarraVidas({ actual, max }) {
  return (
    <motion.div
      className="h-2 overflow-hidden rounded-full bg-zinc-200"
      role="img"
      aria-label={`${actual} de ${max} vidas`}
      data-vidas={actual}
      data-vidas-max={max}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 8 }}
      transition={RESORTE.suave}
    >
      <motion.div
        className="h-full w-full origin-left rounded-full bg-vida"
        initial={false}
        animate={{ scaleX: Math.max(0, actual) / max }}
        transition={RESORTE.pulsar}
      />
    </motion.div>
  )
}

/**
 * Al perder una vida (pedido del usuario): el vidrio de dentro brilla levemente en rojo y tiembla (`useTemblor`, la
 * misma animación de toda la app). `n` cuenta los golpes: cada vez que sube, brilla y tiembla.
 */
function Golpe({ n, className = 'shrink-0', children }) {
  const [ref, temblar] = useTemblor()
  const antes = useRef(n)
  useEffect(() => {
    if (n > antes.current) temblar()
    antes.current = n
  }, [n, temblar])
  return (
    <div ref={ref} className={`relative ${className}`} data-golpes={n}>
      {children}
      {n > 0 && (
        <motion.span
          key={n}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ backgroundColor: 'color-mix(in oklab, var(--color-vida) 14%, transparent)', boxShadow: '0 0 14px 1px color-mix(in oklab, var(--color-vida) 55%, transparent)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, times: [0, 0.2, 1] }}
        />
      )}
    </div>
  )
}
