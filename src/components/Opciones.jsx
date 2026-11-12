import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { desbloquearAdmin, salirAdmin } from '../progress/admin.js'
import { setGesto, setOctavas, setTema, setVidrio, useOpciones } from '../progress/opciones.js'
import Hoja from '../ui/Hoja.jsx'
import { RESORTE, SUBE } from '../ui/movimiento.js'
import { Bombilla, Check, Opciones as IconoOpciones } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import TuProgreso from './TuProgreso.jsx'

const TEMAS = [
  { id: 'claro', nombre: 'Claro' },
  { id: 'oscuro', nombre: 'Oscuro' },
  { id: 'sistema', nombre: 'Automático' },
]

const VIDRIOS = [
  { id: 'desenfoque', nombre: 'Desenfoque' },
  { id: 'opaco', nombre: 'Opaco' },
]

const OCTAVAS = [
  { id: 'vista', nombre: 'Mover la vista' },
  { id: 'teclas', nombre: 'Mover las teclas' },
]

const GESTOS = [
  { id: 'pagina', nombre: 'Normal' },
  { id: 'invertido', nombre: 'Invertir el gesto' },
]

/**
 * Botón redondo de Opciones (engranaje, 44 px) que abre una hoja inferior con los ajustes.
 * Apariencia (Claro / Oscuro / Automático, que sigue al teléfono), Vidrio (Desenfoque / Opaco), Barra de octavas
 * (Mover la vista / Mover las teclas: sentido del deslizador de octavas del piano), Gesto del botón de las lecciones
 * (Normal / Invertir el gesto), Tu progreso
 * (pasarlo a otro dispositivo) y Administrador (con PIN: todas las lecciones abiertas y saltar entre pasos).
 */
export default function BotonOpciones({ className = '' }) {
  const [abierta, setAbierta] = useState(false)
  const cerrar = useCallback(() => setAbierta(false), [])
  return (
    <>
      <Pulsable
        onClick={() => setAbierta(true)}
        aria-label="Opciones"
        aria-haspopup="dialog"
        className={`grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO} ${className}`}
      >
        <IconoOpciones className="size-6" />
      </Pulsable>
      <Hoja abierta={abierta} onCerrar={cerrar} etiqueta="Opciones">
        <PanelOpciones onCerrar={cerrar} />
      </Hoja>
    </>
  )
}

// Pedido del usuario: la hoja ordenada por grupos, como los Ajustes de iOS: un título corto por grupo y,
// debajo, una tarjeta con sus filas (nombre · control · una frase corta de qué hace).
const NOTA_TEMA = {
  claro: 'Fondo claro.',
  oscuro: 'Fondo oscuro, más cómodo de noche.',
  sistema: 'Sigue el modo claro u oscuro de tu teléfono.',
}
const NOTA_VIDRIO = {
  desenfoque: 'Las barras que flotan dejan ver la lección desenfocada.',
  opaco: 'Barras sólidas: más contraste y menos trabajo para el teléfono.',
}
const NOTA_OCTAVAS = {
  vista: 'Octavas 3 · 4 · 5: deslizar a la derecha lleva la vista a las agudas.',
  teclas: 'Octavas 5 · 4 · 3: deslizar a la derecha arrastra el teclado y trae las graves.',
}
const NOTA_GESTO = {
  pagina: 'Como pasar una página: desliza el botón de abajo hacia la izquierda para el paso siguiente y hacia la derecha para volver.',
  invertido: 'Hacia la derecha, el paso siguiente; hacia la izquierda, el anterior (las flechitas apuntan hacia donde deslizas).',
}

function PanelOpciones({ onCerrar }) {
  const { tema, vidrio, octavas, gesto } = useOpciones()
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        {/* Versión de la app (pedido del usuario): v.1.AA.MM.DD.HHMM de cuando se publicó (vite.config.js). */}
        <p className="font-dato text-sm font-medium tabular-nums text-zinc-500" data-version-app>
          {__VERSION_APP__}
        </p>
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Opciones</h2>
      </div>

      <Grupo titulo="Pantalla" id="opciones-pantalla">
        <Fila titulo="Apariencia" id="opciones-apariencia" nota={NOTA_TEMA[tema]}>
          <Segmentado opciones={TEMAS} valor={tema} onCambiar={setTema} etiqueta="opciones-apariencia" capa="tema-activo" foco />
        </Fila>
        <Fila titulo="Vidrio" id="opciones-vidrio" nota={NOTA_VIDRIO[vidrio]}>
          <Segmentado opciones={VIDRIOS} valor={vidrio} onCambiar={setVidrio} etiqueta="opciones-vidrio" capa="vidrio-activo" />
        </Fila>
      </Grupo>

      <Grupo titulo="Piano" id="opciones-piano">
        <Fila titulo="Barra de octavas" id="opciones-octavas" nota={NOTA_OCTAVAS[octavas]}>
          <Segmentado opciones={OCTAVAS} valor={octavas} onCambiar={setOctavas} etiqueta="opciones-octavas" capa="octavas-activo" />
        </Fila>
      </Grupo>

      <Grupo titulo="Lecciones" id="opciones-lecciones">
        <Fila titulo="Gesto del botón" id="opciones-gesto" nota={NOTA_GESTO[gesto]}>
          <Segmentado opciones={GESTOS} valor={gesto} onCambiar={setGesto} etiqueta="opciones-gesto" capa="gesto-activo" />
        </Fila>
      </Grupo>

      <TuProgreso onCerrar={onCerrar} />

      <Grupo titulo="Administrador" id="opciones-admin">
        <ModoAdmin />
      </Grupo>
    </div>
  )
}

/**
 * Modo administrador (pedido del usuario): bloqueado, pide el PIN; activo, lo dice con ✓ y deja salir.
 * Abre todas las lecciones del camino y, en una lección, la barra de pasos abre «Ir al paso».
 */
function ModoAdmin() {
  const { admin } = useOpciones()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [comprobando, setComprobando] = useState(false)

  if (admin) {
    return (
      <div className="flex flex-col gap-3 p-4" data-opcion="opciones-admin-activo">
        <p className="flex items-center gap-2 text-base font-semibold text-bien-tinta">
          <Check className="size-5" />
          Modo administrador activo
        </p>
        <p className="text-sm leading-snug text-zinc-500">
          Todas las lecciones están abiertas. En una lección, toca la barra de pasos de arriba para saltar a cualquier paso.
        </p>
        <Pulsable
          onClick={() => {
            salirAdmin()
            setPin('')
          }}
          className="min-h-12 rounded-2xl border-2 border-zinc-200 bg-white px-5 text-base font-semibold text-zinc-900"
        >
          Salir del modo administrador
        </Pulsable>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-2.5 p-4"
      data-opcion="opciones-admin"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!pin || comprobando) return
        setComprobando(true)
        const ok = await desbloquearAdmin(pin)
        setComprobando(false)
        setError(!ok)
        if (ok) setPin('')
      }}
    >
      <label htmlFor="pin-admin" className="text-base font-semibold text-zinc-900">
        Modo administrador
      </label>
      <div className="flex gap-2">
        <input
          id="pin-admin"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''))
            setError(false)
          }}
          placeholder="PIN"
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-zinc-200 bg-white px-4 font-dato text-base tracking-widest text-zinc-900 placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none"
        />
        <Pulsable
          type="submit"
          disabled={!pin || comprobando}
          className="min-h-12 shrink-0 rounded-2xl bg-zinc-900 px-5 text-base font-semibold text-white disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          Desbloquear
        </Pulsable>
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p key="error" {...SUBE} exit={{ opacity: 0 }} transition={RESORTE.suave} className="flex items-start gap-2 rounded-2xl bg-fijate-suave px-4 py-3 text-base text-fijate-tinta" role="alert">
            <Bombilla className="mt-0.5 size-5" />
            <span>Ese PIN no es. Revísalo e inténtalo otra vez.</span>
          </motion.p>
        )}
      </AnimatePresence>
      <p className="text-sm leading-snug text-zinc-500">Abre todas las lecciones y deja saltar entre los pasos. Pide un PIN.</p>
    </form>
  )
}

/** Grupo de opciones: título corto en versalitas y una tarjeta con sus filas separadas por una línea. */
function Grupo({ titulo, id, children }) {
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby={id}>
      <h3 id={id} className="px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {titulo}
      </h3>
      <div className="flex flex-col divide-y divide-zinc-200 rounded-3xl border border-zinc-200">{children}</div>
    </section>
  )
}

/** Fila de un grupo: nombre, control y una frase corta de qué hace la opción elegida. */
function Fila({ titulo, id, nota, children }) {
  return (
    <div className="flex flex-col gap-2.5 p-4" data-opcion={id}>
      <span id={id} className="text-base font-semibold text-zinc-900">
        {titulo}
      </span>
      {children}
      <p className="text-sm leading-snug text-zinc-500">{nota}</p>
    </div>
  )
}

/** Control segmentado (tipo iOS): la opción activa con fondo blanco que se desliza con un resorte. */
function Segmentado({ opciones, valor, onCambiar, etiqueta, capa, foco = false }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={etiqueta}
      className="grid gap-1 rounded-2xl bg-zinc-100 p-1"
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}
    >
      {opciones.map(({ id, nombre }) => {
        const activo = valor === id
        return (
          <Pulsable
            key={id}
            role="radio"
            aria-checked={activo}
            data-foco={foco && activo ? true : undefined}
            onClick={() => onCambiar(id)}
            className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-base font-semibold ${activo ? 'text-zinc-900' : 'text-zinc-600'}`}
          >
            {activo && (
              <motion.span
                layoutId={capa}
                className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-zinc-300"
                transition={RESORTE.pulsar}
                aria-hidden
              />
            )}
            <span className="relative">{nombre}</span>
          </Pulsable>
        )
      })}
    </div>
  )
}
