// Piezas de las pestañas (Inicio, Aprender, Practicar y Herramientas; fase 3 del rediseño): antes vivían todas en
// pages/Inicio.jsx. Curso completo (anillo + botón), «Hoy» (racha y minutos), cuadritos de módulos y rutas y
// las tarjetitas de las herramientas (Círculo, Piano libre, Flow).
import { motion } from 'motion/react'
import { Cuadrito } from './NavegadorModulos.jsx'
import { moduloDisponible } from '../content/index.js'
import { META_SEGUNDOS } from '../progress/entrenamiento.js'
import { tiendaOido } from '../progress/oido.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { tiendaVocab } from '../progress/vocabulario.js'
import { rutas } from '../router.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { tinta } from '../ui/color.js'
import { Candado } from '../ui/Iconos.jsx'
import { HERRAMIENTAS } from '../content/rutas.js'
import { useRuta } from './rutaModulo.js'
import { ultimaTonalidad } from '../progress/circulo.js'
import CirculoNodos, { tonalidad } from './CirculoNodos.jsx'
import { datosCasilla } from './CirculoQuintas.jsx'
import { COLOR_CIRCULO } from '../pages/Circulo.jsx'
import useTemblor from '../ui/useTemblor.js'
import { useCurso } from './cursoModulo.js'
import { AREAS, ORDEN_AREAS } from '../content/curso.js'

/** Título de sección con aire de videojuego (como en el arranque del entrenador). */
export function Titulo({ children }) {
  return <h2 className="text-center font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">{children}</h2>
}

/** Relieve sólido bajo bloques y tarjetas (como el labio de las islas). */
export const RELIEVE = '0 5px 0 var(--color-zinc-200)'

/** Anillo del curso: lo hecho de cada área, una detrás de otra en su color (y el reto de las tres en neutro). */
export function AnilloCurso({ areas, total, tam = 84, grosor = 10 }) {
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
export function BotonCurso() {
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

/** Cuadrito de un módulo: abierto, con lecciones hechas / total; si aún no existe, con candado. */
export function CuadritoModulo({ modulo: m, progreso }) {
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
export function TarjetaCirculo({ abierta }) {
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
export function TarjetaPiano() {
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
export function MiniPiano() {
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
export function CuadritoRuta({ id }) {
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

/** Las prácticas con su memoria propia (racha y minutos de hoy): Oído, Ritmo y Letras (vocabulario). */
export const TIENDAS_PRACTICA = [
  { id: 'oido', tienda: tiendaOido, acento: 'var(--color-melodia)' },
  { id: 'ritmo', tienda: tiendaRitmo, acento: 'var(--color-ritmo)' },
  { id: 'letras', tienda: tiendaVocab, acento: 'var(--color-letras)' },
]

/**
 * «HOY» (Inicio y Practicar): la racha más larga de tus prácticas en la letra de juego y, al lado, los minutos de hoy
 * con una barrita por práctica (el color de su área; verde al cumplir sus 5 minutos). Con `href`, lleva a Practicar.
 */
export function TarjetaHoy({ href = null }) {
  const datos = TIENDAS_PRACTICA.map(({ id, tienda, acento }) => {
    const estado = tienda.usar()
    return { id, acento, racha: tienda.rachaActual(estado), segundos: tienda.datosDeHoy(estado).segundos }
  })
  const racha = Math.max(...datos.map((d) => d.racha))
  const minutos = Math.floor(datos.reduce((s, d) => s + d.segundos, 0) / 60)
  const contenido = (
    <>
      <span className="flex w-14 shrink-0 flex-col items-center font-juego leading-none text-zinc-900">
        <span className="text-4xl font-semibold tabular-nums">{racha}</span>
        <span className="text-base text-zinc-500">{racha === 1 ? 'día' : 'días'}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-titulo text-xl font-bold text-zinc-900">Hoy</span>
          <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">{minutos} min</span>
        </span>
        <span className="flex gap-1.5" aria-hidden>
          {datos.map((d, i) => {
            const avance = Math.min(1, d.segundos / META_SEGUNDOS)
            return (
              <span key={d.id} className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100" data-hoy={d.id}>
                <motion.span
                  className="block h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${avance * 100}%`, backgroundColor: avance >= 1 ? 'var(--color-bien)' : d.acento }}
                  transition={{ ...RESORTE.suave, delay: 0.3 + i * 0.08 }}
                />
              </span>
            )
          })}
        </span>
      </span>
    </>
  )
  const clase = 'flex w-full items-center gap-4 rounded-[1.75rem] bg-white p-4 text-left'
  const etiqueta = `Hoy: racha de ${racha} ${racha === 1 ? 'día' : 'días'}, ${minutos} minutos de práctica`
  if (!href) {
    return (
      <div className={clase} aria-label={etiqueta} data-tarjeta-hoy>
        {contenido}
      </div>
    )
  }
  return (
    <Pulsable href={href} tipo="tarjeta" className={clase} aria-label={etiqueta} data-tarjeta-hoy>
      {contenido}
      <span className="text-3xl font-semibold text-zinc-400" aria-hidden>
        ›
      </span>
    </Pulsable>
  )
}

/** Lección que abre el Flow (la pestaña Flow de cada letra del cuaderno). */
const LECCION_FLOW = HERRAMIENTAS.flow.leccion

/**
 * Tarjetita del FLOW (Herramientas): ocho casillas del compás con las tónicas marcadas. Hasta terminar la 2.4, punteada
 * y gris con candado («Termina la 2.4») y tiembla al tocarla; abierta, lleva al cuaderno de letras (el Flow es la
 * tercera pestaña de cada letra).
 */
export function TarjetaFlow({ abierta }) {
  const [ref, temblar] = useTemblor()
  const acento = 'var(--color-letras)'
  const dibujo = (
    <span className="relative grid size-20 shrink-0 place-items-center" aria-hidden>
      <svg viewBox="0 0 80 40" className="w-full">
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x={i * 10 + 1}
            y={6}
            width={8}
            height={28}
            rx={3}
            style={{
              fill: abierta && i % 2 === 0 ? acento : 'none',
              stroke: abierta ? (i % 2 === 0 ? acento : 'var(--color-zinc-300)') : 'var(--color-zinc-300)',
            }}
            strokeWidth={2}
          />
        ))}
      </svg>
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
          data-tarjeta-flow="bloqueada"
          aria-label={`Flow: se abre al terminar la lección ${LECCION_FLOW}`}
          className="flex w-full items-center gap-4 rounded-3xl border-2 border-dashed border-zinc-300 p-3 pr-4 text-left"
        >
          {dibujo}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-juego text-lg uppercase tracking-wide text-zinc-500">Flow</span>
            <span className="text-base font-semibold text-zinc-500">Termina la {LECCION_FLOW}</span>
          </span>
        </Pulsable>
      </div>
    )
  }
  return (
    <Pulsable
      href={rutas.letras()}
      tipo="tarjeta"
      data-tarjeta-flow="abierta"
      aria-label="Flow: tus versos sobre el beat"
      className="flex items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-3 pr-4 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      {dibujo}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-juego text-lg uppercase tracking-wide text-zinc-800">Flow</span>
        <span className="font-titulo text-xl font-bold leading-tight" style={{ color: tinta(acento) }}>
          Tus versos sobre el beat
        </span>
      </span>
      <span className="text-2xl text-zinc-400" aria-hidden>
        ›
      </span>
    </Pulsable>
  )
}
