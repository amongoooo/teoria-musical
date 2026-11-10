import Pulsable from './Pulsable.jsx'

/** Enlace "‹ Atrás" de la parte de arriba: área táctil de 44 px y se hunde al tocarlo. */
export default function Volver({ href, children }) {
  return (
    <Pulsable
      href={href}
      className="-ml-3 inline-flex min-h-11 min-w-11 items-center gap-1 self-start rounded-full px-3 text-base font-medium text-zinc-600 active:bg-zinc-200"
    >
      <span aria-hidden className="text-xl leading-none">‹</span>
      {children}
    </Pulsable>
  )
}
