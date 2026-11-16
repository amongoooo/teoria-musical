import { motion } from 'motion/react'
import { META_SEGUNDOS } from '../progress/entrenamiento.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { codigoLeccion } from '../content/index.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { claro, tinta } from '../ui/color.js'
import { Atras, Candado, Check } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useTemblor from '../ui/useTemblor.js'
import { VIDRIO } from '../ui/vidrio.js'
import { BotonInicio } from '../ui/Volver.jsx'

/**
 * Panel de un entrenamiento (oído, ritmo): la racha, los minutos de hoy y la semana; debajo sus ejercicios y las
 * estadísticas. `tienda` es su memoria (progress/entrenamiento.js), `modos` sus ejercicios, `ruta(id)` adónde lleva
 * cada uno e `Icono` su ícono. Opcional: `volver` (‹ a otro apartado en vez de la casita), `children` (va entre el
 * día y los ejercicios), `arriba` (va antes del día: la acción principal) y, en cada modo, `resumen(datos)` en lugar del nivel y `maxItems` en sus estadísticas.
 */
export default function PanelEntrenamiento({ titulo, descripcion, sugerencia, nombre, tienda, modos, ruta, Icono, volver, etiquetaVolver, arriba, despues, children }) {
  const estado = tienda.usar()
  const dia = tienda.datosDeHoy(estado)
  const racha = tienda.rachaActual(estado)
  const semana = tienda.ultimosDias(7, estado)
  const avance = Math.min(1, dia.segundos / META_SEGUNDOS)
  const hayDatos = modos.some((m) => tienda.datosModo(m.id, estado).total > 0)
  const progreso = useProgreso()
  const { admin } = useOpciones()

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-6 sm:py-10"
    >
      {volver ? (
        <Pulsable href={volver} aria-label={etiquetaVolver} className={`grid size-11 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}>
          <Atras className="size-6" />
        </Pulsable>
      ) : (
        <BotonInicio />
      )}

      <motion.header variants={itemLista} className="flex flex-col gap-2">
        <h1 className="font-titulo text-4xl font-extrabold tracking-tight sm:text-5xl">{titulo}</h1>
        <p className="text-lg text-zinc-600">{descripcion}</p>
      </motion.header>

      {arriba}

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
              : sugerencia}
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

      {children}

      <motion.section variants={itemLista} className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Ejercicios</h2>
        {modos.map((m) => {
          const d = tienda.datosModo(m.id, estado)
          if (!modoAbierto(m, progreso, admin)) return <EjercicioBloqueado key={m.id} modo={m} Icono={Icono} />
          return (
            <Pulsable
              key={m.id}
              href={ruta(m.id)}
              tipo="tarjeta"
              data-ejercicio={m.id}
              className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-4"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: claro(m.acento), color: tinta(m.acento) }} aria-hidden>
                <Icono className="size-7" />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-titulo text-lg font-bold leading-snug">{m.titulo}</span>
                <span className="text-sm leading-snug text-zinc-500">{m.descripcion}</span>
                <span className="text-sm font-semibold" style={{ color: tinta(m.acento) }}>
                  {m.resumen ? (
                    m.resumen(d)
                  ) : (
                    <>
                      <span className="font-juego text-base">{nombreNivel(m, d.nivel)}</span>
                      {d.total > 0 && ` · ${porcentaje(d.aciertos, d.total)} % bien`}
                    </>
                  )}
                </span>
              </span>
              <span aria-hidden className="text-2xl text-zinc-300">›</span>
            </Pulsable>
          )
        })}
      </motion.section>

      {despues}

      {hayDatos && (
        <motion.section variants={itemLista} className="flex flex-col gap-4">
          <h2 className="font-titulo text-2xl font-bold tracking-tight">Estadísticas</h2>
          {modos.map((m) => (
            <Estadisticas key={m.id} modo={m} datos={tienda.datosModo(m.id, estado)} Icono={Icono} />
          ))}
          <Pulsable
            onClick={() => {
              if (window.confirm(`¿Borrar todas las estadísticas y la racha del entrenamiento de ${nombre}?`)) tienda.reiniciar()
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

/**
 * ¿Está abierto este ejercicio? Un modo con `requiere` (p. ej. Funciones ← 5.1) sale con candado hasta terminar esa
 * lección (como el Flow con la 2.4); en modo administrador, siempre abierto.
 */
export function modoAbierto(modo, progreso, admin = false) {
  return admin || !modo.requiere || Boolean(progreso?.lecciones?.[modo.requiere]?.completada)
}

/**
 * Cuántos niveles del modo están abiertos: un nivel con `modo.requiereNivel[n]` (Acordes: las séptimas ← 5.2 y 5.5)
 * lleva candado hasta terminar esa lección, y con él los que siguen. En modo administrador, todos.
 */
export function nivelesAbiertos(modo, progreso, admin = false) {
  if (admin || !modo.requiereNivel) return modo.niveles
  for (let n = 1; n <= modo.niveles; n++) {
    const id = modo.requiereNivel[n]
    if (id && !progreso?.lecciones?.[id]?.completada) return n - 1
  }
  return modo.niveles
}

/** Ejercicio con candado: punteado y gris, «Termina la 5.1»; al tocarlo tiembla. */
function EjercicioBloqueado({ modo, Icono }) {
  const [ref, temblar] = useTemblor()
  return (
    <div ref={ref}>
      <Pulsable
        tipo="tarjeta"
        onClick={temblar}
        data-ejercicio={modo.id}
        data-bloqueado
        aria-label={`${modo.titulo}: se abre al terminar la lección ${codigoLeccion(modo.requiere)}`}
        className="flex min-h-20 w-full items-center gap-4 rounded-3xl border-2 border-dashed border-zinc-300 px-4 py-4 text-left"
      >
        <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-400" aria-hidden>
          <Icono className="size-7" />
          <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-zinc-400 text-white">
            <Candado className="size-3.5" />
          </span>
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="font-titulo text-lg font-bold leading-snug text-zinc-500">{modo.titulo}</span>
          <span className="text-base font-semibold text-zinc-500">Termina la {codigoLeccion(modo.requiere)}</span>
        </span>
      </Pulsable>
    </div>
  )
}

const INICIAL_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function nombreNivel(modo, n) {
  return modo.nombreNivel ? modo.nombreNivel(n) : `Nivel ${n}`
}

/**
 * Texto del feedback al aprobar un nivel (`r` = lo que devuelve registrarRespuesta): nivel nuevo, o el mismo nivel
 * superado con más dificultad, o el aviso de la lección que abre lo siguiente (Acordes: las séptimas).
 */
export function textoAprobado(modo, r, { abiertos = modo.niveles } = {}) {
  if (!r?.aprobado) return ''
  const { nivel, dificultad, mejora } = r.aprobado
  let t = ''
  if (r.desbloqueo) t = ` **¡Subiste a ${nombreNivel(modo, r.nuevoNivel).toLowerCase()}!** Nuevo: ${modo.nuevosEnNivel(r.nuevoNivel).join(', ')}.`
  else if (mejora) t = ` **¡Nivel ${nivel} superado con dificultad ${dificultad}!**`
  else t = ` **Nivel ${nivel} superado.**`
  if (r.subio && !r.desbloqueo) t += ` Sigues con el nivel ${r.nuevoNivel}.`
  const leccion = modo.requiereNivel?.[abiertos + 1]
  if (!r.subio && nivel >= abiertos && leccion) t += ` Lo siguiente se abre con la lección ${codigoLeccion(leccion)}.`
  return t
}

/**
 * Dominio de un nivel en cinco puntitos: encendidos (cada uno con el color de su dificultad) hasta la dificultad más
 * alta con la que lo aprobaste. Sin aprobar, los cinco apagados.
 */
export function PuntosDominio({ dificultad = 0, className = '' }) {
  return (
    <span className={`flex items-center gap-[3px] ${className}`} data-dominio={dificultad} aria-label={dificultad ? `Superado con dificultad ${dificultad}` : 'Sin superar'}>
      {[1, 2, 3, 4, 5].map((k) => (
        <span
          key={k}
          className="size-[5px] rounded-full"
          style={{ backgroundColor: k <= dificultad ? `var(--color-dificultad-${k})` : 'var(--color-zinc-300)' }}
        />
      ))}
    </span>
  )
}

function porcentaje(a, t) {
  return t ? Math.round((a / t) * 100) : 0
}

function minutos(segundos) {
  const m = segundos / 60
  return m < 10 ? Math.floor(m * 10) / 10 : Math.floor(m)
}

function Estadisticas({ modo, datos, Icono }) {
  if (!datos.total) return null
  const items = Object.entries(datos.items)
    .sort((a, b) => porcentaje(a[1].a, a[1].t) - porcentaje(b[1].a, b[1].t))
    .slice(0, modo.maxItems ?? Infinity)
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-titulo text-lg font-bold">
          <Icono className="size-5" /> {modo.titulo}
        </h3>
        <span className="text-sm text-zinc-500">
          {datos.aciertos}/{datos.total} · {porcentaje(datos.aciertos, datos.total)} %
        </span>
      </div>
      <p className="text-sm text-zinc-500">
        {modo.resumen ? '' : `Máximo: ${nombreNivel(modo, datos.nivelMax)} · `}Mejor serie de aciertos: {datos.mejorRacha}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map(([id, { a, t }]) => {
          const p = porcentaje(a, t)
          return (
            <li key={id} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 font-medium leading-tight text-zinc-700">{modo.nombreItem(id)}</span>
              <BarraProgreso valor={p / 100} color={modo.acento} fondo="bg-zinc-100" className="flex-1" />
              <span className="w-20 shrink-0 whitespace-nowrap text-right font-dato tabular-nums text-zinc-500">
                {p} % <span className="text-zinc-500">({t})</span>
              </span>
            </li>
          )
        })}
      </ul>
      {items.length > 1 && (
        <p className="text-sm text-zinc-500">
          {modo.maxItems ? 'Lo que más te cuesta.' : 'Ordenado de lo que más te cuesta a lo que mejor te sale.'}
        </p>
      )}
    </div>
  )
}
