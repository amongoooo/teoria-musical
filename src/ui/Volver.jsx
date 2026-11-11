import { Inicio } from './Iconos.jsx'
import Pulsable from './Pulsable.jsx'
import { rutas } from '../router.js'

/** Enlace "‹ Atrás" de la parte de arriba: área táctil de 44 px y se hunde al tocarlo. */
export default function Volver({ href, children }) {
  return (
    <Pulsable
      href={href}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1 self-start rounded-full bg-zinc-200/70 px-4 text-base font-medium text-zinc-700 transition-colors duration-200 active:bg-zinc-300"
    >
      <span aria-hidden className="text-xl leading-none">‹</span>
      {children}
    </Pulsable>
  )
}

/** Botón para volver a Inicio: una casita en un círculo gris de 44 px (más chico que «‹ Inicio»). */
export function BotonInicio() {
  return (
    <Pulsable
      href={rutas.inicio()}
      aria-label="Inicio"
      className="grid size-11 shrink-0 place-items-center self-start rounded-full bg-zinc-200/70 text-zinc-700 transition-colors duration-200 active:bg-zinc-300"
    >
      <Inicio className="size-[22px]" />
    </Pulsable>
  )
}
