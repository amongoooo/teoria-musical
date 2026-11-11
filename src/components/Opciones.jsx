import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { setTema, useOpciones } from '../progress/opciones.js'
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

/**
 * Botón redondo de Opciones (engranaje, 44 px) que abre una hoja inferior con los ajustes.
 * Apariencia (Claro / Oscuro / Automático, que sigue al teléfono) y Tu progreso (pasarlo a otro dispositivo).
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
  const { tema } = useOpciones()
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-titulo text-2xl font-bold tracking-tight">Opciones</h2>

      <section className="flex flex-col gap-3" aria-labelledby="opciones-apariencia">
        <h3 id="opciones-apariencia" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Apariencia
        </h3>
        <div role="radiogroup" aria-labelledby="opciones-apariencia" className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1">
          {TEMAS.map(({ id, nombre }) => {
            const activo = tema === id
            return (
              <Pulsable
                key={id}
                role="radio"
                aria-checked={activo}
                data-foco={activo ? true : undefined}
                onClick={() => setTema(id)}
                className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-base font-semibold ${activo ? 'text-zinc-900' : 'text-zinc-600'}`}
              >
                {activo && (
                  <motion.span
                    layoutId="tema-activo"
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
        <p className="text-base text-zinc-600">
          {tema === 'sistema' ? 'Sigue el modo claro u oscuro de tu teléfono.' : tema === 'oscuro' ? 'Fondo oscuro, más cómodo de noche.' : 'Fondo claro, como siempre.'}
        </p>
      </section>

      <TuProgreso onCerrar={onCerrar} />
    </div>
  )
}
