/** Texto con **negritas** y *cursivas* sencillas (sin Markdown completo). */
export default function Rich({ children }) {
  const partes = String(children).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
  return partes.map((p, i) => {
    if (p.length > 4 && p.startsWith('**') && p.endsWith('**'))
      return (
        <strong key={i} className="font-semibold text-zinc-900">
          {p.slice(2, -2)}
        </strong>
      )
    if (p.length > 2 && p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
    return p
  })
}
