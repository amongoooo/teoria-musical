import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { setOctavas, setTema, setVidrio, useOpciones } from '../progress/opciones.js'
import Hoja from '../ui/Hoja.jsx'
import { RESORTE } from '../ui/movimiento.js'
import { Opciones as IconoOpciones } from '../ui/Iconos.jsx'
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

/**
 * Botón redondo de Opciones (engranaje, 44 px) que abre una hoja inferior con los ajustes.
 * Apariencia (Claro / Oscuro / Automático, que sigue al teléfono), Vidrio (Desenfoque / Opaco), Barra de octavas
 * (Mover la vista / Mover las teclas: sentido del deslizador de octavas del piano) y Tu progreso
 * (pasarlo a otro dispositivo).
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

function PanelOpciones({ onCerrar }) {
  const { tema, vidrio, octavas } = useOpciones()
  return (
    <div className="flex flex-col gap-7">
      <h2 className="font-titulo text-2xl font-bold tracking-tight">Opciones</h2>

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

      <TuProgreso onCerrar={onCerrar} />
    </div>
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
