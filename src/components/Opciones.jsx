import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { setTema, useOpciones } from '../progress/opciones.js'
import Hoja from '../ui/Hoja.jsx'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import TuProgreso from './TuProgreso.jsx'

const TEMAS = [
  { id: 'claro', nombre: 'Claro', Icono: IconoSol },
  { id: 'oscuro', nombre: 'Oscuro', Icono: IconoLuna },
  { id: 'sistema', nombre: 'Automático', Icono: IconoAuto },
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
        className={`grid size-11 shrink-0 place-items-center rounded-full bg-zinc-200/70 text-zinc-700 ${className}`}
      >
        <IconoEngranaje />
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
      <h2 className="text-2xl font-bold tracking-tight">Opciones</h2>

      <section className="flex flex-col gap-3" aria-labelledby="opciones-apariencia">
        <h3 id="opciones-apariencia" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Apariencia
        </h3>
        <div role="radiogroup" aria-labelledby="opciones-apariencia" className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1">
          {TEMAS.map(({ id, nombre, Icono }) => {
            const activo = tema === id
            return (
              <Pulsable
                key={id}
                role="radio"
                aria-checked={activo}
                data-foco={activo ? true : undefined}
                onClick={() => setTema(id)}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-base font-semibold ${activo ? 'text-zinc-900' : 'text-zinc-600'}`}
              >
                {activo && (
                  <motion.span
                    layoutId="tema-activo"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-zinc-300"
                    transition={RESORTE.pulsar}
                    aria-hidden
                  />
                )}
                <span className="relative">
                  <Icono />
                </span>
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

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

function IconoEngranaje() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconoSol() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function IconoLuna() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function IconoAuto() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  )
}
