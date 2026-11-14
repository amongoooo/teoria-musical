import { motion } from 'motion/react'
import BotonNovedades from '../components/Novedades.jsx'
import BotonOpciones from '../components/Opciones.jsx'
import { Cuadrito } from '../components/NavegadorModulos.jsx'
import { MODULOS, moduloDisponible } from '../content/index.js'
import { META_SEGUNDOS } from '../progress/entrenamiento.js'
import { tiendaOido } from '../progress/oido.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Metronomo, Oreja, Pluma } from '../ui/Iconos.jsx'
import { tiendaVocab } from '../progress/vocabulario.js'
import { useOpciones } from '../progress/opciones.js'
import { HERRAMIENTAS, ORDEN_RUTAS, herramientaAbierta } from '../content/rutas.js'
import { useRuta } from '../components/rutaModulo.js'
import { ultimaTonalidad } from '../progress/circulo.js'
import CirculoNodos, { tonalidad } from '../components/CirculoNodos.jsx'
import { datosCasilla } from '../components/CirculoQuintas.jsx'
import { COLOR_CIRCULO } from './Circulo.jsx'
import useTemblor from '../ui/useTemblor.js'
import { useCurso } from '../components/cursoModulo.js'
import { AREAS, ORDEN_AREAS } from '../content/curso.js'

/**
 * Inicio con aire de videojuego (pedido del usuario; como el arranque del entrenador de oído): el logo como
 * insignia, el botón del CURSO COMPLETO (anillo en tres colores; el siguiente paso vive dentro del curso), los ENTRENAMIENTOS en bloques con relieve (Oído y
 * Ritmo; después vendrán más), los MÓDULOS como cuadritos y el PIANO LIBRE. Títulos de sección en la
 * letra de juego. Sin textos grises de instrucciones.
 */
export default function Inicio() {
  const progreso = useProgreso()
  const opciones = useOpciones()

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-9 px-5 pt-4 pb-14 sm:pt-8"
    >
      <motion.header variants={itemLista} className="relative flex flex-col items-center gap-4 pt-10 text-center">
        <BotonNovedades className="absolute left-0 top-0" />
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

      {/* En el lugar de la antigua tarjeta de «Continuar» (pedido del usuario): el Curso completo. */}
      <motion.div variants={itemLista}>
        <BotonCurso />
      </motion.div>

      {/* Orden (pedido del usuario): Rutas arriba, luego Prácticas, Herramientas y, hasta abajo, los Módulos. */}
      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <Titulo>Rutas</Titulo>
        {/* Como los módulos: un cuadrito por ruta (con su ícono); las que aún no tienen paradas, con candado. */}
        <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
          {ORDEN_RUTAS.map((id) => (
            <li key={id}>
              <CuadritoRuta id={id} />
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <Titulo>Prácticas</Titulo>
        <div className="grid grid-cols-3 gap-2">
          <BloqueRacha tienda={tiendaOido} href={rutas.oido()} id="oido" nombre="Oído" titulo="Entrenamiento de oído" Icono={Oreja} acento="var(--color-melodia)" />
          <BloqueRacha tienda={tiendaRitmo} href={rutas.ritmo()} id="ritmo" nombre="Ritmo" titulo="Entrenamiento de ritmo" Icono={Metronomo} acento="var(--color-ritmo)" />
          <BloqueRacha tienda={tiendaVocab} href={rutas.letras()} id="letras" nombre="Letras" titulo="Entrenamiento de letras" Icono={Pluma} acento="var(--color-letras)" />
        </div>
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <Titulo>Herramientas</Titulo>
        <div className="flex flex-col gap-3">
          <TarjetaCirculo abierta={herramientaAbierta('circulo', progreso, opciones.admin)} />
          <TarjetaPiano />
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
    </motion.main>
  )
}

/** Título de sección con aire de videojuego (como en el arranque del entrenador). */
function Titulo({ children }) {
  return <h2 className="text-center font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">{children}</h2>
}

/** Relieve sólido bajo bloques y tarjetas (como el labio de las islas). */
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

/** Anillo del curso: lo hecho de cada área, una detrás de otra en su color (y el reto de las tres en neutro). */
function AnilloCurso({ areas, total, tam = 84, grosor = 10 }) {
  const r = (100 - grosor) / 2
  const c = 2 * Math.PI * r
  let desde = 0
  return (
    <svg viewBox="0 0 100 100" style={{ width: tam, height: tam }} className="-rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" style={{ stroke: 'var(--color-zinc-100)' }} strokeWidth={grosor} />
      {[...ORDEN_AREAS, 'tres'].map((a, k) => {
        const largo = total ? (areas[a].hechas / total) * c : 0
        const arco = (
          <motion.circle
            key={a}
            data-arco-curso={a}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            style={{ stroke: AREAS[a].acento }}
            strokeWidth={grosor}
            initial={{ strokeDasharray: `0 ${c}` }}
            animate={{ strokeDasharray: `${Math.max(0, largo - (largo > 2 ? 1.5 : 0))} ${c}` }}
            strokeDashoffset={-desde}
            transition={{ ...RESORTE.suave, delay: 0.25 + k * 0.1 }}
          />
        )
        desde += largo
        return arco
      })}
    </svg>
  )
}

/**
 * El botón CURSO COMPLETO (pedido del usuario; en el lugar de la tarjeta de «Continuar»): tarjeta blanca con relieve,
 * el anillo con el % en los tres colores (Armonía M4, Ritmo M2, Letras M6), «11 de 40 · 3 rutas», la leyenda de las
 * tres áreas y ›. Sin franja «Sigue…»: el siguiente paso vive solo dentro del curso.
 */
function BotonCurso() {
  const { estado } = useCurso()
  const porcentaje = Math.round((estado.hechas / estado.total) * 100)
  return (
    <Pulsable
      href={rutas.curso()}
      tipo="tarjeta"
      data-boton-curso
      aria-label={`Curso completo: ${porcentaje} %, ${estado.hechas} de ${estado.total}`}
      className="flex w-full items-center gap-3.5 rounded-[1.75rem] border-2 border-zinc-200 bg-white p-4 pr-3 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      <span className="relative grid size-19 shrink-0 place-items-center">
        <span className="absolute inset-0">
          <AnilloCurso areas={estado.areas} total={estado.total} tam={76} />
        </span>
        <span className="relative font-titulo text-xl font-extrabold tabular-nums">{porcentaje}%</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="whitespace-nowrap font-juego text-xl font-semibold uppercase leading-tight tracking-wide text-zinc-900">Curso completo</span>
        <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">
          {estado.hechas} de {estado.total} · 3 rutas
        </span>
        <span className="flex flex-wrap gap-x-2.5 gap-y-1">
          {ORDEN_AREAS.map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tinta(AREAS[a].acento) }}>
              <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: AREAS[a].acento }} aria-hidden />
              {AREAS[a].nombre}
            </span>
          ))}
        </span>
      </span>
      <span className="text-3xl font-semibold text-zinc-400" aria-hidden>
        ›
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
  // Entra directo al módulo (pedido del usuario): «¿Ya lo sabes?» va en el globo de su insignia.
  return (
    <Pulsable
      href={rutas.modulo(m.numero)}
      tipo="tarjeta"
      data-cuadrito-modulo={m.numero}
      aria-label={`Módulo ${m.numero}: ${m.titulo}. ${hechas} de ${m.lecciones.length} lecciones`}
      className="flex min-h-11 w-full flex-col items-center gap-2 rounded-3xl px-1 pt-1 pb-2 text-center"
    >
      {contenido}
    </Pulsable>
  )
}

/** Lección del curso que abre el explorador del círculo (pedido del usuario: «se desbloquea al desbloquear la rueda en el curso»). */
const LECCION_CIRCULO = HERRAMIENTAS.circulo.leccion

/**
 * Entrada al explorador del círculo de quintas: tarjetita con un mini círculo de nodos (la última tonalidad vista,
 * con sus 7 notas prendidas), «Explorar», su nombre y su armadura. Hasta terminar la 3.5 va punteada y gris, con
 * candado, los nodos apagados y «Termina la 3.5»; al tocarla tiembla. En modo administrador siempre está abierta.
 */
function TarjetaCirculo({ abierta }) {
  const [ref, temblar] = useTemblor()
  const id = ultimaTonalidad()
  const t = tonalidad(id)
  const mini = (
    <span className="relative w-20 shrink-0" aria-hidden>
      <CirculoNodos color={COLOR_CIRCULO} seleccion={abierta ? id : null} mini />
      {!abierta && (
        <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-zinc-400 text-white">
          <Candado className="size-3.5" />
        </span>
      )}
    </span>
  )
  if (!abierta) {
    return (
      <div ref={ref}>
        <Pulsable
          tipo="tarjeta"
          onClick={temblar}
          data-tarjeta-circulo="bloqueada"
          aria-label={`Círculo de quintas: se abre al terminar la lección ${LECCION_CIRCULO}`}
          className="flex w-full items-center gap-4 rounded-3xl border-2 border-dashed border-zinc-300 p-3 pr-4 text-left"
        >
          {mini}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-juego text-lg uppercase tracking-wide text-zinc-500">Círculo de quintas</span>
            <span className="text-base font-semibold text-zinc-500">Termina la {LECCION_CIRCULO}</span>
          </span>
        </Pulsable>
      </div>
    )
  }
  return (
    <Pulsable
      href={rutas.circulo()}
      tipo="tarjeta"
      data-tarjeta-circulo="abierta"
      aria-label={`Explorar el círculo de quintas: ${t.nombre}`}
      className="flex items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-3 pr-4 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      {mini}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-juego text-lg uppercase tracking-wide text-zinc-800">Círculo de quintas</span>
        <span className="font-titulo text-xl font-bold leading-tight" style={{ color: tinta(COLOR_CIRCULO) }}>
          {t.nombre}
        </span>
        <span className="font-dato text-sm font-medium text-zinc-500">
          {t.textoArmadura} · ↔ {datosCasilla(t.relativa).nombre}
        </span>
      </span>
      <span className="text-2xl text-zinc-400" aria-hidden>
        ›
      </span>
    </Pulsable>
  )
}

/** Tarjetita del Piano libre (Herramientas; pedido del usuario: «que el piano salga también en tarjetita como el círculo»). */
function TarjetaPiano() {
  return (
    <Pulsable
      href={rutas.piano()}
      tipo="tarjeta"
      data-tarjeta-piano
      aria-label="Piano libre"
      className="flex items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-3 pr-4 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      <MiniPiano />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-juego text-lg uppercase tracking-wide text-zinc-800">Piano libre</span>
        <span className="font-titulo text-xl font-bold leading-tight" style={{ color: tinta('var(--color-melodia)') }}>
          Toca lo que quieras
        </span>
      </span>
      <span className="text-2xl text-zinc-400" aria-hidden>
        ›
      </span>
    </Pulsable>
  )
}

/** Dibujito de un teclado (5 blancas y 3 negras), siempre claro como el Piano. */
function MiniPiano() {
  const negras = [7.25, 17.25, 37.25] // entre Do-Re, Re-Mi y Fa-Sol
  return (
    <span className="tema-claro grid size-20 shrink-0 place-items-center" aria-hidden>
      <svg viewBox="0 0 50 34" className="w-full">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 10 + 0.5} y={0.5} width={9} height={33} rx={2} style={{ fill: 'var(--color-white)', stroke: 'var(--color-zinc-300)' }} />
        ))}
        {negras.map((x) => (
          <rect key={x} x={x} y={0.5} width={5.5} height={20} rx={1.5} style={{ fill: 'var(--color-zinc-800)' }} />
        ))}
      </svg>
    </span>
  )
}

/** Cuadrito de una ruta (como el de un módulo, con su ícono): paradas hechas / total; sin paradas aún, con candado. */
function CuadritoRuta({ id }) {
  const { ruta, modulo, estado } = useRuta(id)
  const disponible = modulo.disponible
  const contenido = (
    <>
      <span className="relative">
        <Cuadrito modulo={modulo} disponible={disponible} hecho={disponible && estado.hechas === estado.total} tam={76} />
        {!disponible && (
          <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-zinc-400 text-white" aria-hidden>
            <Candado className="size-3.5" />
          </span>
        )}
      </span>
      <span className={`text-base font-semibold leading-snug ${disponible ? 'text-zinc-900' : 'text-zinc-500'}`}>{ruta.nombre}</span>
      {disponible && (
        <span className="font-juego text-base tabular-nums" style={{ color: tinta(modulo.acento) }} data-ruta-inicio={id}>
          {estado.hechas}/{estado.total}
        </span>
      )}
    </>
  )
  if (!disponible) {
    return (
      <div className="flex flex-col items-center gap-2 px-1 pt-1 pb-2 text-center" aria-label={`${ruta.titulo}. Próximamente`} data-cuadrito-ruta={id}>
        {contenido}
      </div>
    )
  }
  // Entra directo a la ruta (pedido del usuario): «¿Ya lo sabes?» va en el globo de su insignia.
  return (
    <Pulsable
      href={rutas.ruta(id)}
      tipo="tarjeta"
      aria-label={`${ruta.titulo}: ${estado.hechas} de ${estado.total} paradas`}
      data-cuadrito-ruta={id}
      className="flex min-h-11 w-full flex-col items-center gap-2 rounded-3xl px-1 pt-1 pb-2 text-center"
    >
      {contenido}
    </Pulsable>
  )
}
