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
      <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" />
      </svg>
    </Pulsable>
  )
}
