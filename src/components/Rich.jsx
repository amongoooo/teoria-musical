/** Texto con **negritas** sencillas (sin Markdown completo). */
export default function Rich({ children }) {
  const partes = String(children).split(/(\*\*[^*]+\*\*)/g)
  return partes.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-zinc-900">
        {p.slice(2, -2)}
      </strong>
    ) : (
      p
    ),
  )
}
