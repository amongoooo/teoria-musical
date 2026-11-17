import { LayoutGroup, motion } from 'motion/react'
import { modoAbierto, nombreNivel } from '../components/PanelEntrenamiento.jsx'
import { TIENDAS_PRACTICA } from '../components/Tarjetas.jsx'
import VistaPrevia from '../components/VistaPrevia.jsx'
import { codigoLeccion } from '../content/index.js'
import { META_SEGUNDOS } from '../progress/entrenamiento.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { MODOS_OIDO } from '../theory/oido.js'
import { MODOS_RITMO } from '../theory/ritmo.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { labio, oscuro, tinta, claro } from '../ui/color.js'
import { Candado, Metronomo, Oreja, Pluma } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useTemblor from '../ui/useTemblor.js'
import { VIDRIO } from '../ui/vidrio.js'

const MELODIA = 'var(--color-melodia)'
const ARMONIA = 'var(--color-armonia)'
const RITMO = 'var(--color-ritmo)'
const LETRAS = 'var(--color-letras)'
/** Relieve sólido bajo tarjetas (como el labio de las islas). */
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

/**
 * Los tipos de entrenamiento y sus ejercicios. Oído no es un área: el tipo va en Melodía y cada ejercicio en el color
 * de lo que entrena (Intervalos y Oído absoluto → Melodía, Acordes y Funciones → Armonía). `modo` = el de la teoría
 * (para su nivel), `descripcion` = qué se hace, en una línea.
 */
const TIPOS = [
  {
    id: 'oido',
    nombre: 'Oído',
    Icono: Oreja,
    acento: MELODIA,
    panel: rutas.oido(),
    modos: [
      { id: 'intervalos', nombre: 'Intervalos', descripcion: 'Escucha dos notas y elige la distancia.', acento: MELODIA, href: rutas.oido('intervalos') },
      { id: 'acordes', nombre: 'Acordes', descripcion: 'Escucha un acorde y di qué tipo es.', acento: ARMONIA, href: rutas.oido('acordes') },
      { id: 'funciones', nombre: 'Funciones', descripcion: '¿Ese acorde es casa, salida o tensión?', acento: ARMONIA, href: rutas.oido('funciones'), requiere: '5.1' },
      { id: 'absoluto', nombre: 'Oído absoluto', descripcion: 'Adivina la nota sin ninguna referencia.', acento: MELODIA, href: rutas.oido('absoluto') },
    ],
  },
  {
    id: 'ritmo',
    nombre: 'Ritmo',
    Icono: Metronomo,
    acento: RITMO,
    panel: rutas.ritmo(),
    modos: [
      { id: 'seguir', nombre: 'Seguir', descripcion: 'Toca los golpes sobre el beat.', acento: RITMO, href: rutas.ritmo('seguir') },
      { id: 'eco', nombre: 'Eco', descripcion: 'Escucha un compás y repítelo.', acento: RITMO, href: rutas.ritmo('eco') },
    ],
  },
  {
    id: 'letras',
    nombre: 'Letras',
    Icono: Pluma,
    acento: LETRAS,
    panel: rutas.vocabulario(),
    modos: [
      { id: 'cuaderno', nombre: 'Cuaderno', descripcion: 'Escribe tus letras y mira cómo riman.', acento: LETRAS, href: rutas.letras() },
      { id: 'vocabulario', nombre: 'Vocabulario', descripcion: 'Palabras nuevas, con repaso cada día.', acento: LETRAS, href: rutas.vocabulario() },
    ],
  },
]
const MODOS_TEORIA = [...MODOS_OIDO, ...MODOS_RITMO]

/**
 * Pestaña ENTRENAR (antes «Practicar»; pedido del usuario, 2026-11-17): arriba, en vidrio, la barra de tipos
 * Oído | Ritmo | Letras (como Curso | Rutas | Módulos en Aprender; #/entrenar, #/entrenar/ritmo, #/entrenar/letras).
 * Debajo: el título, tu día en ese tipo (racha y minutos; lleva a su panel con las estadísticas) y sus ejercicios EN
 * GRANDE, cada uno con una vista previa animada de cómo se juega (components/VistaPrevia.jsx).
 */
export default function Practicar({ vista = null }) {
  const tipo = TIPOS.find((t) => t.id === vista) ?? TIPOS[0]
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-20">
        <div className="mx-auto flex max-w-2xl px-4 pt-3 pb-2">
          <Selector actual={tipo.id} />
        </div>
      </header>
      <motion.main
        key={tipo.id}
        variants={lista}
        initial="oculta"
        animate="visible"
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 pt-3 pb-36"
        data-entrenar={tipo.id}
      >
        <motion.header variants={itemLista} className="flex flex-col gap-1">
          <span className="font-juego text-base uppercase tracking-wide text-zinc-500">Entrenar</span>
          <h1 className="font-titulo text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">{tipo.nombre}</h1>
        </motion.header>
        <motion.div variants={itemLista}>
          <TuDia tipo={tipo} />
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2">
          {tipo.modos.map((m) => (
            <motion.div key={m.id} variants={itemLista}>
              <Ejercicio tipo={tipo} modo={m} />
            </motion.div>
          ))}
        </div>
      </motion.main>
    </div>
  )
}

/** Oído | Ritmo | Letras: píldora de vidrio con la marca blanca que se desliza (resorte) al elegido. */
function Selector({ actual }) {
  return (
    <LayoutGroup id="selector-entrenar">
      <div role="tablist" aria-label="Entrenar" className={`pointer-events-auto flex h-12 w-full gap-1 rounded-full p-1 ${VIDRIO}`}>
        {TIPOS.map((t) => {
          const activa = t.id === actual
          const Icono = t.Icono
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activa}
              data-tipo-entrenar={t.id}
              onClick={() => !activa && navegar(rutas.practicar(t.id))}
              className={`relative flex flex-1 items-center justify-center rounded-full text-base font-bold transition-colors ${activa ? 'text-zinc-900' : 'text-zinc-500'}`}
              style={{ touchAction: 'manipulation' }}
            >
              {activa && (
                <motion.span
                  layoutId="marca-entrenar"
                  className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_rgb(16_18_28/0.14)]"
                  transition={RESORTE.pulsar}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icono className="size-5" style={activa ? { color: tinta(t.acento) } : undefined} />
                {t.nombre}
              </span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}

/** Tu día en este tipo: insignia, racha y minutos de hoy con su barrita; lleva al panel (días y estadísticas). */
function TuDia({ tipo }) {
  const { tienda } = TIENDAS_PRACTICA.find((t) => t.id === tipo.id)
  const estado = tienda.usar()
  const racha = tienda.rachaActual(estado)
  const segundos = tienda.datosDeHoy(estado).segundos
  const meta = Math.round(META_SEGUNDOS / 60)
  const cumplida = segundos >= META_SEGUNDOS
  const Icono = tipo.Icono
  return (
    <Pulsable
      href={tipo.panel}
      tipo="tarjeta"
      data-panel-entrenar={tipo.id}
      aria-label={`Tu día en ${tipo.nombre}: racha de ${racha} ${racha === 1 ? 'día' : 'días'}, ${Math.floor(segundos / 60)} de ${meta} minutos`}
      className="flex items-center gap-3 rounded-[1.75rem] border-2 border-zinc-200 bg-white p-3 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-blanco" style={{ backgroundColor: oscuro(tipo.acento), boxShadow: `0 4px 0 ${labio(tipo.acento)}` }} aria-hidden>
        <Icono className="size-8" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-juego text-xl font-semibold tabular-nums" style={{ color: tinta(tipo.acento) }}>
            {racha} {racha === 1 ? 'día' : 'días'}
          </span>
          <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">
            {Math.min(Math.floor(segundos / 60), meta)}/{meta} min hoy
          </span>
        </span>
        <BarraProgreso valor={Math.min(1, segundos / META_SEGUNDOS)} color={cumplida ? 'var(--color-bien)' : tipo.acento} fondo="bg-zinc-100" alto="h-2" aria-hidden />
      </span>
      <span className="pr-1 text-3xl font-semibold text-zinc-400" aria-hidden>
        ›
      </span>
    </Pulsable>
  )
}

/** Un ejercicio en grande: su vista previa arriba, el nombre, qué se hace y tu nivel. Con candado si pide una lección. */
function Ejercicio({ tipo, modo: m }) {
  const progreso = useProgreso()
  const { admin } = useOpciones()
  const { tienda } = TIENDAS_PRACTICA.find((t) => t.id === tipo.id)
  const estado = tienda.usar()
  if (!modoAbierto(m, progreso, admin)) return <EjercicioBloqueado modo={m} />
  const teoria = MODOS_TEORIA.find((x) => x.id === m.id)
  const nivel = teoria ? nombreNivel(teoria, tienda.datosModo(m.id, estado).nivel) : null
  return (
    <Pulsable
      href={m.href}
      tipo="tarjeta"
      data-ejercicio-entrenar={m.id}
      data-modo-practica={m.id}
      className="flex w-full flex-col gap-3 rounded-[1.75rem] border-2 border-zinc-200 bg-white p-3 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      <VistaPrevia tipo={m.id} acento={m.acento} />
      <span className="flex items-center gap-3 px-1.5 pb-1">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-juego text-2xl font-semibold uppercase leading-tight tracking-wide text-zinc-900">{m.nombre}</span>
            {nivel && (
              <span className="rounded-full px-2.5 py-0.5 font-juego text-base tabular-nums" style={{ backgroundColor: claro(m.acento), color: tinta(m.acento) }} data-nivel-ejercicio>
                {nivel}
              </span>
            )}
          </span>
          <span className="text-base leading-snug text-zinc-600">{m.descripcion}</span>
        </span>
        <span className="text-3xl font-semibold text-zinc-400" aria-hidden>
          ›
        </span>
      </span>
    </Pulsable>
  )
}

/** Ejercicio con candado (p. ej. Funciones hasta terminar la 5.1): punteado, vista previa gris y quieta; tiembla al tocarlo. */
function EjercicioBloqueado({ modo: m }) {
  const [ref, temblar] = useTemblor()
  return (
    <div ref={ref}>
      <Pulsable
        tipo="tarjeta"
        onClick={temblar}
        data-ejercicio-entrenar={m.id}
        data-modo-practica={m.id}
        data-bloqueado
        aria-label={`${m.nombre}: se abre al terminar la lección ${codigoLeccion(m.requiere)}`}
        className="flex w-full flex-col gap-3 rounded-[1.75rem] border-2 border-dashed border-zinc-300 p-3 text-left"
      >
        <span className="relative block opacity-45 grayscale">
          <VistaPrevia tipo={m.id} acento={m.acento} quieta />
        </span>
        <span className="flex items-center gap-3 px-1.5 pb-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-400 text-white" aria-hidden>
            <Candado className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-juego text-2xl font-semibold uppercase leading-tight tracking-wide text-zinc-500">{m.nombre}</span>
            <span className="text-base font-semibold text-zinc-500">Termina la {codigoLeccion(m.requiere)}</span>
          </span>
        </span>
      </Pulsable>
    </div>
  )
}
