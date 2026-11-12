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

function PanelOpciones({ onCerrar }) {
  const { tema, vidrio, octavas } = useOpciones()
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-titulo text-2xl font-bold tracking-tight">Opciones</h2>

      <section className="flex flex-col gap-3" aria-labelledby="opciones-apariencia">
        <h3 id="opciones-apariencia" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Apariencia
        </h3>
        <Segmentado opciones={TEMAS} valor={tema} onCambiar={setTema} etiqueta="opciones-apariencia" capa="tema-activo" foco />
        <p className="text-base text-zinc-600">
          {tema === 'sistema' ? 'Sigue el modo claro u oscuro de tu teléfono.' : tema === 'oscuro' ? 'Fondo oscuro, más cómodo de noche.' : 'Fondo claro, como siempre.'}
        </p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="opciones-vidrio">
        <h3 id="opciones-vidrio" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Vidrio
        </h3>
        <Segmentado opciones={VIDRIOS} valor={vidrio} onCambiar={setVidrio} etiqueta="opciones-vidrio" capa="vidrio-activo" />
        <p className="text-base text-zinc-600">
          {vidrio === 'opaco'
            ? 'Las barras y los botones que flotan son sólidos: más contraste y menos trabajo para el teléfono.'
            : 'Las barras y los botones que flotan dejan ver la lección desenfocada por detrás.'}
        </p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="opciones-octavas">
        <h3 id="opciones-octavas" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Barra de octavas del piano
        </h3>
        <Segmentado opciones={OCTAVAS} valor={octavas} onCambiar={setOctavas} etiqueta="opciones-octavas" capa="octavas-activo" />
        <p className="text-base text-zinc-600">
          {octavas === 'teclas'
            ? 'Las octavas van de aguda a grave (5 · 4 · 3): deslizar a la derecha arrastra el teclado y trae las notas graves.'
            : 'Las octavas van de grave a aguda (3 · 4 · 5): deslizar a la derecha mueve la vista hacia las notas agudas.'}
        </p>
      </section>

      <TuProgreso onCerrar={onCerrar} />
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
