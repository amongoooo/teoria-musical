import Pulsable from './Pulsable.jsx'

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
