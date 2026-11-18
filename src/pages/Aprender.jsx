import { LayoutGroup, motion } from 'motion/react'
import { CuadritoModulo, CuadritoRuta } from '../components/Tarjetas.jsx'
import { AREAS_CONOCIMIENTO, color } from '../content/areas.js'
import { MODULOS } from '../content/index.js'
import { ORDEN_RUTAS, RUTAS, RUTAS_PROXIMAS } from '../content/rutas.js'
import { useProgreso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { tinta } from '../ui/color.js'
import { Candado } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import { VIDRIO } from '../ui/vidrio.js'
import { ContenidoCurso } from './Curso.jsx'

/**
 * Pestaña APRENDER (pedido del usuario, 2026-11-16: tres maneras de estudiar en lugar de Rutas | Biblioteca).
 * Arriba, en vidrio, el selector Curso | Rutas | Módulos (#/aprender, #/aprender/rutas y #/aprender/modulos;
 * el viejo #/aprender/biblioteca abre Módulos):
 *  - CURSO (lo recomendado para empezar): la página del Curso completo tal cual (ContenidoCurso de pages/Curso.jsx).
 *  - RUTAS: una fila por ÁREA con sus rutas (cuadritos); un área sin rutas aún, con candado.
 *  - MÓDULOS: el temario, agrupado por ÁREA con su color (el de Letras, con las L1–L5, va en Letras).
 */
const VISTAS = [
  { id: 'curso', texto: 'Curso' },
  { id: 'rutas', texto: 'Rutas' },
  { id: 'modulos', texto: 'Módulos' },
]

export default function Aprender({ vista = null }) {
  const actual = VISTAS.some((v) => v.id === vista) ? vista : 'curso'
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-20">
        <div className="mx-auto flex max-w-2xl px-4 pt-3 pb-2">
          <Selector actual={actual} />
        </div>
      </header>
      <motion.main
        key={actual}
        variants={lista}
        initial="oculta"
        animate="visible"
        className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-5 pt-3 pb-36"
      >
        {actual === 'rutas' ? <Rutas /> : actual === 'modulos' ? <Modulos /> : <Curso />}
      </motion.main>
    </div>
  )
}

/** Curso | Rutas | Módulos: píldora de vidrio con la marca blanca que se desliza (resorte) a la elegida. */
function Selector({ actual }) {
  const opciones = VISTAS.map((v) => ({ ...v, href: rutas.aprender(v.id === 'curso' ? null : v.id), activa: v.id === actual }))
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

/** Título de un apartado, igual que el del Curso completo: antetítulo en `font-juego` y título grande. */
function Encabezado({ antetitulo, titulo }) {
  return (
    <motion.header variants={itemLista} className="flex flex-col gap-1">
      <span className="font-juego text-base uppercase tracking-wide text-zinc-500">{antetitulo}</span>
      <h1 data-titulo-aprender className="font-titulo text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
        {titulo}
      </h1>
    </motion.header>
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
      <Encabezado antetitulo="Por habilidad" titulo="Rutas" />
      {Object.keys(AREAS_CONOCIMIENTO).map((area) => {
        const suyas = ORDEN_RUTAS.filter((id) => RUTAS[id].area === area)
        const proximas = RUTAS_PROXIMAS.filter((r) => r.area === area)
        return (
          <motion.section key={area} variants={itemLista} className="flex flex-col gap-3" data-area-rutas={area}>
            <NombreArea area={area} />
            <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
              {suyas.map((id) => (
                <li key={id}>
                  <CuadritoRuta id={id} />
                </li>
              ))}
              {proximas.map((r) => (
                <li key={r.id}>
                  <RutaProxima nombre={r.nombre} />
                </li>
              ))}
              {!suyas.length && !proximas.length && (
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

/** Una ruta que aún no existe (o un área sin rutas): cuadrito punteado con candado, su nombre y «Próximamente». */
function RutaProxima({ nombre = null }) {
  return (
    <div className="flex flex-col items-center gap-2 px-1 pt-1 pb-2 text-center" aria-label={nombre ? `Ruta de ${nombre}: próximamente` : 'Ruta próximamente'} data-ruta-proxima={nombre ?? ''}>
      <span className="relative grid size-19 place-items-center rounded-3xl border-2 border-dashed border-zinc-300 bg-white" aria-hidden>
        <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-zinc-400 text-white">
          <Candado className="size-3.5" />
        </span>
      </span>
      {nombre && <span className="-mb-1.5 text-base font-semibold leading-snug text-zinc-600">{nombre}</span>}
      <span className={`${nombre ? 'text-sm' : 'text-base'} font-semibold leading-snug text-zinc-500`}>Próximamente</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Curso
// ---------------------------------------------------------------------------

/** El Curso completo (todas las áreas a la par, en orden), directamente: avance, «Sigue aquí», bloques y rutas. */
function Curso() {
  return (
    <div className="flex flex-col gap-9" data-pagina-curso>
      <ContenidoCurso />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------------

/** Los módulos agrupados por su área (en el orden de las áreas); cada grupo con sus cuadritos. */
function Modulos() {
  const progreso = useProgreso()
  return (
    <>
      <Encabezado antetitulo="Por tema" titulo="Módulos" />
      {Object.keys(AREAS_CONOCIMIENTO).map((area) => {
        const suyos = MODULOS.filter((m) => m.area === area)
        if (!suyos.length) return null
        return (
          <motion.section key={area} variants={itemLista} className="flex flex-col gap-3" data-area-modulos={area}>
            <NombreArea area={area} />
            <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
              {suyos.map((m) => (
                <li key={m.numero}>
                  <CuadritoModulo modulo={m} progreso={progreso} />
                </li>
              ))}
            </ol>
          </motion.section>
        )
      })}
    </>
  )
}
