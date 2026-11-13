import { motion } from 'motion/react'
import BotonOpciones from '../components/Opciones.jsx'
import { Cuadrito } from '../components/NavegadorModulos.jsx'
import Piano from '../components/Piano.jsx'
import { getLeccion, leccionesDisponibles, MODULOS, moduloDisponible } from '../content/index.js'
import { META_SEGUNDOS } from '../progress/entrenamiento.js'
import { tiendaOido } from '../progress/oido.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Metronomo, Oreja, Pluma } from '../ui/Iconos.jsx'
import { useCuaderno } from '../progress/letras.js'

/**
 * Inicio con aire de videojuego (pedido del usuario; como el arranque del entrenador de oído): el logo como
 * insignia, una tarjeta grande para seguir la siguiente lección, los ENTRENAMIENTOS en bloques con relieve (Oído y
 * Ritmo; después vendrán más), los MÓDULOS como cuadritos y el PIANO LIBRE. Títulos de sección en la
 * letra de juego. Sin textos grises de instrucciones.
 */
export default function Inicio() {
  const progreso = useProgreso()
  const disponibles = leccionesDisponibles()
  // Siguiente lección: la primera sin completar (o la última si ya hiciste todas).
  const siguiente = disponibles.find((l) => !progreso.lecciones[l.id]?.completada)
  const destacada = siguiente ?? disponibles[disponibles.length - 1]

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-9 px-5 pt-4 pb-14 sm:pt-8"
    >
      <motion.header variants={itemLista} className="relative flex flex-col items-center gap-4 pt-10 text-center">
        <BotonOpciones className="absolute right-0 top-0" />
        {/* Insignia del juego: el ícono de la app, entra con rebote. */}
        <motion.img
          src={`${import.meta.env.BASE_URL}iconos/icono.svg`}
          alt=""
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
          className="size-24 rounded-[1.75rem]"
          style={{ boxShadow: '0 7px 0 var(--color-zinc-300)' }}
        />
        <h1 className="font-titulo text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">Teoría Musical</h1>
      </motion.header>

      {destacada && (
        <motion.div variants={itemLista}>
          <TarjetaSiguiente leccion={destacada} progreso={progreso.lecciones[destacada.id]} todoHecho={!siguiente} />
        </motion.div>
      )}

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <Titulo>Entrenamientos</Titulo>
        <div className="grid grid-cols-3 gap-2">
          <BloqueRacha tienda={tiendaOido} href={rutas.oido()} id="oido" nombre="Oído" titulo="Entrenamiento de oído" Icono={Oreja} acento="var(--color-modulo-1)" />
          <BloqueRacha tienda={tiendaRitmo} href={rutas.ritmo()} id="ritmo" nombre="Ritmo" titulo="Entrenamiento de ritmo" Icono={Metronomo} acento="var(--color-modulo-2)" />
          <BloqueLetras />
        </div>
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <Titulo>Módulos</Titulo>
        {/* Cada módulo es un cuadrito con su número y su título; al tocarlo se despliegan sus islas. */}
        <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
          {MODULOS.map((m) => (
            <li key={m.numero}>
              <CuadritoModulo modulo={m} progreso={progreso} />
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <Titulo>Piano libre</Titulo>
        <Piano tecladoArriba />
      </motion.section>
    </motion.main>
  )
}

/** Título de sección con aire de videojuego (como en el arranque del entrenador). */
function Titulo({ children }) {
  return <h2 className="text-center font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">{children}</h2>
}

/** Relieve sólido bajo bloques y tarjetas (como el labio de las islas). */
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

/**
 * La siguiente lección, como el botón grande de «jugar»: tarjeta del color de su módulo con labio, el número del
 * módulo en un cuadrito, el título, la barra de pasos y un botón blanco con relieve. Toda la tarjeta se toca.
 */
function TarjetaSiguiente({ leccion, progreso, todoHecho }) {
  const acento = leccion.modulo.acento
  const total = getLeccion(leccion.id)?.pasos.length ?? 1
  const paso = progreso?.completada ? total : (progreso?.paso ?? 0)
  const texto = todoHecho ? 'Repasar' : paso > 0 ? 'Continuar' : 'Empezar'
  return (
    <Pulsable
      href={rutas.leccion(leccion.id)}
      tipo="tarjeta"
      aria-label={`${texto}: lección ${leccion.id}, ${leccion.titulo}`}
      data-siguiente={leccion.id}
      className="flex flex-col gap-4 rounded-[1.75rem] p-5 text-blanco"
      style={{ backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }}
    >
      <div className="flex items-center gap-4">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-blanco/15 font-titulo text-4xl font-bold"
          aria-hidden
        >
          {leccion.modulo.numero}
        </span>
        <span className="flex min-w-0 flex-col gap-1 text-left">
          <span className="font-juego text-base uppercase tracking-wide text-blanco/85">Lección {leccion.id}</span>
          <span className="font-titulo text-2xl font-bold leading-tight">{leccion.titulo}</span>
        </span>
      </div>
      <span className="h-2.5 overflow-hidden rounded-full bg-blanco/25" aria-hidden>
        <motion.span
          className="block h-full rounded-full bg-blanco"
          initial={{ width: 0 }}
          animate={{ width: `${(paso / total) * 100}%` }}
          transition={{ ...RESORTE.suave, delay: 0.3 }}
        />
      </span>
      <span
        className="grid min-h-14 place-items-center rounded-2xl bg-blanco font-juego text-2xl font-semibold uppercase tracking-wide"
        style={{ color: tinta(acento), boxShadow: '0 5px 0 rgb(0 0 0 / 0.22)' }}
      >
        {texto}
      </span>
    </Pulsable>
  )
}

/**
 * Bloque de entrenamiento con relieve: insignia del color del módulo con el que se relaciona (oído → M1, ritmo → M2),
 * nombre en la letra de juego y debajo su dato (racha y minutos de hoy).
 */
function BloqueEntrenamiento({ href, nombre, Icono, acento, children, ...props }) {
  return (
    <Pulsable
      href={href}
      tipo="tarjeta"
      className="flex flex-col items-center gap-2.5 rounded-3xl border-2 border-zinc-200 bg-white px-3 pt-4 pb-4 text-center"
      style={{ boxShadow: RELIEVE }}
      {...props}
    >
      <span
        className="grid size-16 place-items-center rounded-2xl text-blanco"
        style={{ backgroundColor: oscuro(acento), boxShadow: `0 5px 0 ${labio(acento)}` }}
        aria-hidden
      >
        <Icono className="size-9" />
      </span>
      <span className="font-juego text-xl font-semibold uppercase tracking-wide text-zinc-800">{nombre}</span>
      {children}
    </Pulsable>
  )
}

/**
 * Bloque de un entrenamiento con su racha (días seguidos) y la barra de los 5 minutos de hoy (verde al cumplirlos).
 * Cada entrenamiento lleva su propia memoria (`tienda`): oído y ritmo tienen racha y minutos aparte.
 */
function BloqueRacha({ tienda, href, id, nombre, titulo, Icono, acento }) {
  const estado = tienda.usar()
  const dia = tienda.datosDeHoy(estado)
  const racha = tienda.rachaActual(estado)
  const avance = Math.min(1, dia.segundos / META_SEGUNDOS)
  return (
    <BloqueEntrenamiento
      href={href}
      nombre={nombre}
      Icono={Icono}
      acento={acento}
      aria-label={`${titulo}: racha de ${racha} ${racha === 1 ? 'día' : 'días'}`}
      data-entrenamiento={id}
    >
      <span className="font-juego text-base tabular-nums" style={{ color: tinta(acento) }}>
        {racha} {racha === 1 ? 'día' : 'días'}
      </span>
      <span className="h-2 w-full overflow-hidden rounded-full bg-zinc-200" aria-hidden>
        <motion.span
          className="block h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${avance * 100}%`, backgroundColor: avance >= 1 ? 'var(--color-bien)' : acento }}
          transition={{ ...RESORTE.suave, delay: 0.35 }}
        />
      </span>
    </BloqueEntrenamiento>
  )
}

/** Letras (M6): el cuaderno de letras; su dato es cuántas tienes. */
function BloqueLetras() {
  const { letras } = useCuaderno()
  const acento = 'var(--color-modulo-6)'
  return (
    <BloqueEntrenamiento href={rutas.letras()} nombre="Letras" Icono={Pluma} acento={acento} aria-label={`Letras: ${letras.length} en tu cuaderno`} data-entrenamiento="letras">
      <span className="font-juego text-base tabular-nums" style={{ color: tinta(acento) }}>
        {letras.length} {letras.length === 1 ? 'letra' : 'letras'}
      </span>
    </BloqueEntrenamiento>
  )
}

/** Cuadrito de un módulo: abierto, con lecciones hechas / total; si aún no existe, con candado. */
function CuadritoModulo({ modulo: m, progreso }) {
  const disponible = moduloDisponible(m)
  const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const contenido = (
    <>
      <span className="relative">
        <Cuadrito modulo={m} disponible={disponible} hecho={disponible && hechas === m.lecciones.length} tam={76} />
        {!disponible && (
          <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-zinc-400 text-white" aria-hidden>
            <Candado className="size-3.5" />
          </span>
        )}
      </span>
      <span className={`line-clamp-3 text-base font-semibold leading-snug ${disponible ? 'text-zinc-900' : 'text-zinc-500'}`}>{m.titulo}</span>
      {disponible && (
        <span className="font-juego text-base tabular-nums" style={{ color: tinta(m.acento) }}>
          {hechas}/{m.lecciones.length}
        </span>
      )}
    </>
  )
  if (!disponible) {
    return (
      <div className="flex flex-col items-center gap-2 px-1 pt-1 pb-2 text-center" aria-label={`Módulo ${m.numero}: ${m.titulo}. Próximamente`}>
        {contenido}
      </div>
    )
  }
  return (
    <Pulsable
      href={rutas.modulo(m.numero)}
      tipo="tarjeta"
      aria-label={`Módulo ${m.numero}: ${m.titulo}. ${hechas} de ${m.lecciones.length} lecciones`}
      className="flex min-h-11 flex-col items-center gap-2 rounded-3xl px-1 pt-1 pb-2 text-center"
    >
      {contenido}
    </Pulsable>
  )
}
