import Rich from '../Rich.jsx'

/** Recuadro de "dato curioso" o aclaración. */
export default function Nota({ children, titulo = 'Dato' }) {
  return (
    <aside className="rounded-2xl bg-zinc-100 px-5 py-4 text-base leading-relaxed text-zinc-600">
      <span className="mr-1 font-semibold text-zinc-800">{titulo}:</span>
      <Rich>{children}</Rich>
    </aside>
  )
}
