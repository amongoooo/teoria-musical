import { useEffect, useRef, useState } from 'react'
import { initPiano, releaseAll } from '../audio/engine.js'
import { reproducir } from '../audio/sonido.js'
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
import { rutas } from '../router.js'
import { parseNota } from '../theory/notas.js'
import { DIRECCIONES, MODOS_OIDO, getModoOido } from '../theory/oido.js'
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
    <main className="animate-entrada mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-8 sm:py-12">
      <a href={rutas.inicio()} className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-full px-2 text-base text-zinc-500">
        ‹ Inicio
      </a>

      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Entrenamiento de oído</h1>
        <p className="text-lg text-zinc-500">Unos 5 minutos al día. Poco pero seguido es lo que entrena el oído.</p>
      </header>

      <section className="flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Hoy</span>
            <span className="text-3xl font-bold tabular-nums">
              {minutos(dia.segundos)} <span className="text-xl font-medium text-zinc-400">/ 5 min</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold tabular-nums">🔥 {racha}</span>
            <span className="text-sm text-zinc-500">{racha === 1 ? 'día seguido' : 'días seguidos'}</span>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${avance >= 1 ? 'bg-emerald-500' : 'bg-zinc-900'}`}
            style={{ width: `${avance * 100}%` }}
          />
        </div>
        <p className="text-base text-zinc-600">
          {avance >= 1
            ? '¡Meta de hoy cumplida! Si quieres, sigue un rato más.'
            : dia.respuestas > 0
              ? `Llevas ${dia.respuestas} respuestas hoy (${porcentaje(dia.aciertos, dia.respuestas)} % bien).`
              : 'Sugerencia: 2 min de intervalos, 1 de acordes y 2 de oído absoluto.'}
        </p>
        <ol className="flex justify-between gap-1" aria-label="Últimos 7 días">
          {semana.map((d) => {
            const [y, m, dd] = d.fecha.split('-').map(Number)
            const letra = INICIAL_DIA[new Date(y, m - 1, dd).getDay()]
            const meta = d.segundos >= META_SEGUNDOS
            return (
              <li key={d.fecha} className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${
                    meta ? 'bg-emerald-500 text-white' : d.respuestas ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}
                  title={`${d.fecha}: ${minutos(d.segundos)} min`}
                >
                  {meta ? '✓' : d.respuestas ? '•' : ''}
                </span>
                <span className="text-xs text-zinc-500">{letra}</span>
              </li>
            )
          })}
        </ol>
        {estado.mejorRacha > 0 && <p className="text-sm text-zinc-500">Mejor racha: {estado.mejorRacha} {estado.mejorRacha === 1 ? 'día' : 'días'}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Ejercicios</h2>
        {MODOS_OIDO.map((m) => {
          const d = datosModo(m.id, estado)
          return (
            <a
              key={m.id}
              href={rutas.oido(m.id)}
              className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-4 transition active:scale-[0.99]"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ backgroundColor: `${m.acento}22` }} aria-hidden>
                {m.emoji}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-lg font-semibold leading-snug">{m.titulo}</span>
                <span className="text-sm leading-snug text-zinc-500">{m.descripcion}</span>
                <span className="text-sm font-medium" style={{ color: m.acento }}>
                  {nombreNivel(m, d.nivel)}
                  {d.total > 0 && ` · ${porcentaje(d.aciertos, d.total)} % bien`}
                </span>
              </span>
              <span aria-hidden className="text-2xl text-zinc-300">›</span>
            </a>
          )
        })}
      </section>

      {hayDatos && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Estadísticas</h2>
          {MODOS_OIDO.map((m) => (
            <Estadisticas key={m.id} modo={m} datos={datosModo(m.id, estado)} />
          ))}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Borrar todas las estadísticas y la racha del entrenamiento de oído?')) reiniciarOido()
            }}
            className="min-h-12 self-center rounded-2xl px-6 text-base font-medium text-zinc-400"
          >
            Borrar estadísticas
          </button>
        </section>
      )}
    </main>
  )
}

function Estadisticas({ modo, datos }) {
  if (!datos.total) return null
  const items = Object.entries(datos.items).sort((a, b) => porcentaje(a[1].a, a[1].t) - porcentaje(b[1].a, b[1].t))
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">
          {modo.emoji} {modo.titulo}
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
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <span className="block h-full rounded-full" style={{ width: `${p}%`, backgroundColor: modo.acento }} />
              </span>
              <span className="w-20 shrink-0 whitespace-nowrap text-right tabular-nums text-zinc-500">
                {p} % <span className="text-zinc-400">({t})</span>
              </span>
            </li>
          )
        })}
      </ul>
      {items.length > 1 && <p className="text-xs text-zinc-400">Ordenado de lo que más te cuesta a lo que mejor te sale.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Entrenador: práctica sin fin de un modo
// ---------------------------------------------------------------------------

function Entrenador({ modo }) {
  const estado = useOido()
  const datos = datosModo(modo.id, estado)
  const dia = datosDeHoy(estado)

  const [jugando, setJugando] = useState(false)
  const [pregunta, setPregunta] = useState(null)
  const [respuesta, setRespuesta] = useState(null) // id elegido
  const [resultado, setResultado] = useState(null) // lo que devuelve registrarRespuesta
  const [sesion, setSesion] = useState({ aciertos: 0, total: 0 })
  const contador = useRef(0)

  useEffect(() => {
    initPiano()
    return () => releaseAll()
  }, [])

  const nueva = () => {
    const d = datosModo(modo.id)
    const p = modo.generar(d.nivel, d.ajustes, pregunta)
    contador.current += 1
    setPregunta({ ...p, n: contador.current, nivel: d.nivel, opciones: modo.opciones(d.nivel) })
    setRespuesta(null)
    setResultado(null)
    window.scrollTo(0, 0)
    reproducir(p.sonido)
  }

  const empezar = () => {
    empezarSesion()
    setJugando(true)
    nueva()
  }

  const responder = (id) => {
    if (respuesta) {
      // Ya respondida: tocar una opción la hace sonar para comparar.
      reproducir(pregunta.sonidoDe(id))
      return
    }
    const bien = id === pregunta.item
    setRespuesta(id)
    setResultado(registrarRespuesta(modo.id, { item: pregunta.item, bien, niveles: modo.niveles }))
    setSesion((s) => ({ aciertos: s.aciertos + (bien ? 1 : 0), total: s.total + 1 }))
  }

  let accion
  if (!jugando) {
    accion = { label: 'Empezar', onClick: empezar }
  } else if (!respuesta) {
    accion = { label: '▶ Escuchar otra vez', onClick: () => reproducir(pregunta.sonido), ayuda: 'Toca tu respuesta arriba' }
  } else {
    const bien = respuesta === pregunta.item
    let texto = bien ? pregunta.explicacion : `Elegiste ${modo.nombreItem(respuesta)}. ${pregunta.explicacion}`
    if (!bien) texto += ' Toca las opciones para compararlas.'
    if (resultado?.subio) {
      const nuevos = modo.nuevosEnNivel(resultado.nuevoNivel).join(', ')
      texto += ` 🎉 **¡Subiste a ${nombreNivel(modo, resultado.nuevoNivel).toLowerCase()}!** Nuevo: ${nuevos}.`
    }
    if (resultado?.metaCumplida) texto += ' ✅ **¡Cumpliste tus 5 minutos de hoy!**'
    accion = {
      label: 'Siguiente',
      onClick: nueva,
      feedback: bien
        ? { tipo: 'bien', titulo: '¡Correcto!', texto }
        : { tipo: 'mal', titulo: `Era: ${modo.nombreItem(pregunta.item)}.`, texto },
    }
  }

  const avanceHoy = Math.min(1, dia.segundos / META_SEGUNDOS)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <a
            href={rutas.oido()}
            aria-label="Volver al entrenamiento de oído"
            className="grid size-11 shrink-0 place-items-center rounded-full text-2xl text-zinc-500 active:bg-zinc-200"
          >
            ✕
          </a>
          <div className="flex flex-1 flex-col gap-1">
            <div className="h-3 overflow-hidden rounded-full bg-zinc-200" aria-label={`Hoy: ${minutos(dia.segundos)} de 5 minutos`}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${avanceHoy * 100}%`, backgroundColor: avanceHoy >= 1 ? '#10b981' : modo.acento }}
              />
            </div>
          </div>
          <span className="w-16 shrink-0 text-right text-sm tabular-nums text-zinc-500">{minutos(dia.segundos)}/5 min</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4">
        {!jugando ? (
          <Portada modo={modo} datos={datos} />
        ) : (
          <div key={pregunta.n} className="animate-entrada flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 text-sm text-zinc-500">
              <span className="font-semibold" style={{ color: modo.acento }}>
                {modo.titulo} · {nombreNivel(modo, pregunta.nivel)}
              </span>
              <span className="tabular-nums">
                {sesion.aciertos}/{sesion.total}
                {datos.racha > 1 && ` · 🔥 ${datos.racha} seguidas`}
              </span>
            </div>

            <Ventana datos={datos} niveles={modo.niveles} acento={modo.acento} />

            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{modo.pregunta}</h1>

            <div className={`grid gap-3 ${pregunta.opciones.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {pregunta.opciones.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => responder(op.id)}
                  className={`min-h-16 rounded-2xl border-2 px-2 py-3 text-center text-lg font-semibold leading-tight transition active:scale-[0.98] ${claseOpcion(op.id, pregunta.item, respuesta)}`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {respuesta && (
              <div className="animate-entrada flex flex-col gap-2">
                <p className="text-sm text-zinc-500">En el teclado (puedes tocarlo):</p>
                <Piano
                  key={pregunta.n}
                  compacto
                  startOctave={octavaInicial(pregunta.notas)}
                  octaves={2}
                  marcadas={pregunta.notas}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <BarraAccion accion={accion} />
    </div>
  )
}

function octavaInicial(notas) {
  return Math.min(...notas.map((n) => parseNota(n).octava))
}

function claseOpcion(id, correcta, respuesta) {
  if (!respuesta) return 'border-zinc-200 bg-white text-zinc-800'
  if (id === correcta) return 'border-emerald-500 bg-emerald-50 text-emerald-900'
  if (id === respuesta) return 'border-amber-400 bg-amber-50 text-amber-900'
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
          <span
            key={i}
            className="h-2 flex-1 rounded-full"
            style={{ backgroundColor: v === true ? acento : v === false ? '#fcd34d' : '#e4e4e7' }}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        {aciertos} de los últimos {TAMANO_VENTANA} · con {ACIERTOS_PARA_SUBIR} subes de nivel
      </p>
    </div>
  )
}

/** Pantalla antes de empezar: qué se practica, nivel y ajustes. */
function Portada({ modo, datos }) {
  const opciones = modo.opciones(datos.nivel)
  return (
    <div className="animate-entrada flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-4xl" aria-hidden>
          {modo.emoji}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{modo.titulo}</h1>
        <p className="text-lg leading-relaxed text-zinc-600">{modo.descripcion}</p>
      </header>

      {modo.id === 'absoluto' && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-base leading-relaxed text-amber-900">
          <Rich>
            Es un **juego**: suena una nota sin ninguna referencia y adivinas cuál es. Empiezas con 2 notas y se suma una
            cada vez que aciertas 8 de 10. En adultos el oído absoluto es muy difícil de adquirir, así que tómalo como un
            reto divertido, no como una promesa.
          </Rich>
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Nivel</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: datos.nivelMax }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => elegirNivel(modo.id, n)}
              aria-pressed={datos.nivel === n}
              className={`min-h-12 rounded-full border-2 px-4 text-base font-semibold ${
                datos.nivel === n ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              {nombreNivel(modo, n)}
            </button>
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          Sube solo al acertar {ACIERTOS_PARA_SUBIR} de {TAMANO_VENTANA}.
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
      </section>

      {modo.id === 'intervalos' && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Cómo suenan las dos notas</h2>
          <div className="grid grid-cols-3 gap-2">
            {DIRECCIONES.map((d) => {
              const activa = (datos.ajustes.direccion ?? 'sube') === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => guardarAjustes(modo.id, { direccion: d.id })}
                  aria-pressed={activa}
                  className={`min-h-12 rounded-2xl border-2 px-2 text-base font-semibold ${
                    activa ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'
                  }`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {datos.total > 0 && (
        <p className="text-base text-zinc-500">
          Llevas {datos.total} respuestas en total, {porcentaje(datos.aciertos, datos.total)} % bien. Mejor serie: {datos.mejorRacha} seguidas.
        </p>
      )}
    </div>
  )
}
