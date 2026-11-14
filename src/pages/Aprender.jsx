import { LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'
import { BotonCurso, CuadritoModulo, CuadritoRuta } from '../components/Tarjetas.jsx'
import { AREAS_CONOCIMIENTO, color } from '../content/areas.js'
import { CATALOGO, NIVELES } from '../content/catalogo.js'
import { MODULOS, faltanRequisitos, getLeccion, leccionDisponible } from '../content/index.js'
import { ORDEN_RUTAS, RUTAS } from '../content/rutas.js'
import { useProgreso } from '../progress/progreso.js'
import { marcarOrigenLeccion, navegar, rutas } from '../router.js'
import { claro, tinta } from '../ui/color.js'
import { Bombilla, Candado, MarcaBien } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'

/**
 * Pestaña APRENDER (fase 3 del rediseño; maqueta aprobada: https://claude.ai/artifact/6EWwNQ4puh3mtiT1T8Pfne).
 * Arriba, en vidrio, el selector Rutas | Biblioteca (#/aprender y #/aprender/biblioteca).
 *  - RUTAS: el Curso completo y una fila por ÁREA con sus rutas (cuadritos); un área sin rutas aún, con candado.
 *  - BIBLIOTECA: fichas de área para filtrar, los módulos en una fila y TODAS las lecciones del catálogo
 *    (content/catalogo.js) por nivel, con su área. Se abren sin `/guiada`: si falta un prerrequisito, la fila lo dice
 *    en oro («Antes: 3.2») y la lección avisa «Antes te conviene». Nada se bloquea.
 */
export default function Aprender({ vista = null }) {
  const biblioteca = vista === 'biblioteca'
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-20">
        <div className="mx-auto flex max-w-2xl px-4 pt-3 pb-2">
          <Selector biblioteca={biblioteca} />
        </div>
      </header>
      <motion.main
        key={biblioteca ? 'biblioteca' : 'rutas'}
        variants={lista}
        initial="oculta"
        animate="visible"
        className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-5 pt-3 pb-36"
      >
        {biblioteca ? <Biblioteca /> : <Rutas />}
      </motion.main>
    </div>
  )
}

/** Rutas | Biblioteca: píldora de vidrio con la marca blanca que se desliza (resorte) a la elegida. */
function Selector({ biblioteca }) {
  const opciones = [
    { id: 'rutas', texto: 'Rutas', href: rutas.aprender(), activa: !biblioteca },
    { id: 'biblioteca', texto: 'Biblioteca', href: rutas.aprender('biblioteca'), activa: biblioteca },
  ]
  return (
    <LayoutGroup id="selector-aprender">
      <div role="tablist" aria-label="Aprender" className={`pointer-events-auto flex h-12 w-full gap-1 rounded-full p-1 ${VIDRIO}`}>
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={o.activa}
            data-aprender={o.id}
            onClick={() => !o.activa && navegar(o.href)}
            className={`relative flex-1 rounded-full text-base font-bold transition-colors ${o.activa ? 'text-zinc-900' : 'text-zinc-500'}`}
            style={{ touchAction: 'manipulation' }}
          >
            {o.activa && (
              <motion.span
                layoutId="marca-aprender"
                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_rgb(16_18_28/0.14)]"
                transition={RESORTE.pulsar}
              />
            )}
            <span className="relative">{o.texto}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  )
}

/** Título de un grupo: el área con su cuadrito de color (o un nivel), en mayúsculas pequeñas. */
function NombreArea({ area }) {
  const acento = color(area)
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(acento) }}>
      <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: acento }} aria-hidden />
      {AREAS_CONOCIMIENTO[area].nombre}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

function Rutas() {
  return (
    <>
      <motion.div variants={itemLista}>
        <BotonCurso />
      </motion.div>
      {Object.keys(AREAS_CONOCIMIENTO).map((area) => {
        const suyas = ORDEN_RUTAS.filter((id) => RUTAS[id].area === area)
        return (
          <motion.section key={area} variants={itemLista} className="flex flex-col gap-3" data-area-rutas={area}>
            <NombreArea area={area} />
            <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
              {suyas.length ? (
                suyas.map((id) => (
                  <li key={id}>
                    <CuadritoRuta id={id} />
                  </li>
                ))
              ) : (
                <li>
                  <RutaProxima />
                </li>
              )}
            </ol>
          </motion.section>
        )
      })}
    </>
  )
}

/** Un área que aún no tiene ruta: cuadrito punteado con candado, «Próximamente». */
function RutaProxima() {
  return (
    <div className="flex flex-col items-center gap-2 px-1 pt-1 pb-2 text-center" aria-label="Ruta próximamente">
      <span className="relative grid size-19 place-items-center rounded-3xl border-2 border-dashed border-zinc-300 bg-white" aria-hidden>
        <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-zinc-400 text-white">
          <Candado className="size-3.5" />
        </span>
      </span>
      <span className="text-base font-semibold leading-snug text-zinc-500">Próximamente</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Biblioteca
// ---------------------------------------------------------------------------

/** El área elegida se recuerda mientras la app esté abierta (al volver de una lección sigue igual). */
let filtroGuardado = 'todas'

const NOMBRE_NIVEL = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }
/** Lecciones del catálogo que ya existen, en su orden. */
const LECCIONES = Object.keys(CATALOGO).filter(leccionDisponible)

function Biblioteca() {
  const progreso = useProgreso()
  const [filtro, setFiltroLocal] = useState(filtroGuardado)
  const setFiltro = (f) => {
    filtroGuardado = f
    setFiltroLocal(f)
  }
  const pasa = (id) => filtro === 'todas' || CATALOGO[id].areas.includes(filtro)
  // Un módulo entra si es de esa área o si alguna de sus lecciones la toca (el 3 sale también en Armonía).
  const modulos = MODULOS.filter((m) => filtro === 'todas' || m.area === filtro || m.lecciones.some((l) => CATALOGO[l.id]?.areas.includes(filtro)))

  return (
    <>
      <motion.div variants={itemLista} role="group" aria-label="Filtrar por área" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {['todas', ...Object.keys(AREAS_CONOCIMIENTO)].map((a) => (
          <Ficha key={a} area={a} activa={filtro === a} onClick={() => setFiltro(a)} />
        ))}
      </motion.div>

      <motion.section variants={itemLista} className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Módulos</h2>
        <ol className="-mx-5 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" data-modulos-biblioteca>
          {modulos.map((m) => (
            <li key={m.numero} className="w-26 shrink-0">
              <CuadritoModulo modulo={m} progreso={progreso} />
            </li>
          ))}
        </ol>
      </motion.section>

      {NIVELES.map((nivel) => {
        const ids = LECCIONES.filter((id) => CATALOGO[id].nivel === nivel && pasa(id))
        const hechas = ids.filter((id) => progreso.lecciones[id]?.completada).length
        return (
          <motion.section key={nivel} variants={itemLista} className="flex flex-col gap-3" data-nivel={nivel}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-titulo text-2xl font-bold tracking-tight">{NOMBRE_NIVEL[nivel]}</h2>
              {ids.length > 0 && (
                <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">
                  {hechas}/{ids.length}
                </span>
              )}
            </div>
            {ids.length ? (
              <ul className="flex flex-col gap-2">
                {ids.map((id) => (
                  <li key={id}>
                    <FilaLeccion id={id} progreso={progreso} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-zinc-300 px-4 py-4 text-base text-zinc-500">
                <Candado className="size-5 shrink-0" />
                {nivel === 'avanzado' ? 'Llega con los módulos 7–9' : 'Aún no hay lecciones de esta área en este nivel'}
              </p>
            )}
          </motion.section>
        )
      })}
    </>
  )
}

/** Ficha de un área para filtrar (o «Todas»): con su cuadrito de color; la elegida, con el fondo suave del área. */
function Ficha({ area, activa, onClick }) {
  const todas = area === 'todas'
  const acento = todas ? 'var(--color-zinc-900)' : color(area)
  return (
    <Pulsable
      onClick={onClick}
      aria-pressed={activa}
      data-filtro={area}
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-base font-bold whitespace-nowrap"
      style={
        activa
          ? { borderColor: todas ? 'var(--color-zinc-900)' : acento, color: todas ? 'var(--color-zinc-900)' : tinta(acento), backgroundColor: todas ? 'var(--color-zinc-100)' : claro(acento) }
          : { borderColor: 'var(--color-zinc-200)', color: 'var(--color-zinc-600)', backgroundColor: 'var(--color-white)' }
      }
    >
      {!todas && <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: acento }} aria-hidden />}
      {todas ? 'Todas' : AREAS_CONOCIMIENTO[area].nombre}
    </Pulsable>
  )
}

/**
 * Una lección de la Biblioteca: su número en el color suave de su área principal (✓ si está hecha; en contorno si se
 * saltó con la prueba), su título, sus áreas (la principal en su tinta) y, si le falta un prerrequisito, «Antes: …» en
 * oro con la bombilla. Abre la lección sin `/guiada`, así que avisa «Antes te conviene».
 */
function FilaLeccion({ id, progreso }) {
  const leccion = getLeccion(id)
  const { areas } = CATALOGO[id]
  const acento = color(areas[0])
  const p = progreso.lecciones[id]
  const faltan = p?.completada ? [] : faltanRequisitos(id, progreso)
  const empezada = !p?.completada && p?.paso > 0
  return (
    <Pulsable
      href={rutas.leccion(id)}
      onClick={() => marcarOrigenLeccion(id, rutas.aprender('biblioteca'))}
      tipo="tarjeta"
      data-leccion-biblioteca={id}
      aria-label={`${id} ${leccion.titulo}${p?.completada ? ', hecha' : ''}${faltan.length ? `. Antes te conviene ${faltan.join(' y ')}` : ''}`}
      className="flex min-h-18 w-full items-center gap-3 rounded-3xl bg-white px-3 py-2.5 text-left"
    >
      <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl font-dato text-base font-medium" style={{ backgroundColor: claro(acento), color: tinta(acento) }}>
        {id}
        {p?.completada && <MarcaBien className="absolute -right-1.5 -bottom-1.5 size-6" aro="var(--color-white)" saltada={p.saltada} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-semibold leading-snug text-zinc-900">{leccion.titulo}</span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm">
          {areas.map((a, i) => (
            <span key={a} className={i ? 'text-zinc-500' : 'font-semibold'} style={i ? undefined : { color: tinta(acento) }}>
              {AREAS_CONOCIMIENTO[a].nombre}
            </span>
          ))}
          {empezada && <span className="font-semibold text-zinc-600">· Empezada</span>}
          {faltan.length > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-fijate-tinta" data-antes={faltan.join(',')}>
              <Bombilla className="size-4" />
              Antes: {faltan.join(', ')}
            </span>
          )}
        </span>
      </span>
      <span className="pr-1 text-2xl text-zinc-400" aria-hidden>
        ›
      </span>
    </Pulsable>
  )
}
