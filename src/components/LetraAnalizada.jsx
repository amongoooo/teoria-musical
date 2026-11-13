import { Fragment, useMemo } from 'react'
import { analizar } from '../letras/analisis.js'

// La letra analizada (colores de rima, esquema, sílabas y multis). La usan la pestaña «Analizar» de cada letra
// (pages/Letras.jsx) y las lecciones de la ruta de letras (paso `texto` con `letra`, ver content/FORMATO.md).

/** Cómo se pinta cada familia: consonante = relleno suave; asonante = subrayado punteado (siempre con su color). */
export function estiloFamilia(f) {
  if (!f?.color) return {}
  const c = `var(--color-rima-${f.color})`
  if (f.tipo === 'consonante') return { backgroundColor: `var(--color-rima-${f.color}-suave)`, color: `var(--color-rima-${f.color}-tinta)` }
  return { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: c, textDecorationThickness: '3px', textUnderlineOffset: '5px' }
}

/** Leyenda: qué es cada marca (enseña la diferencia entre las dos rimas). */
export function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-zinc-600">
      <span>
        <span className="rounded-md px-1 font-semibold" style={estiloFamilia({ tipo: 'consonante', color: 1 })}>
          corazón · razón
        </span>{' '}
        consonante
      </span>
      <span>
        <span className="font-semibold" style={estiloFamilia({ tipo: 'asonante', color: 2 })}>
          noche · golpe
        </span>{' '}
        asonante
      </span>
    </div>
  )
}

/**
 * Una estrofa en su tarjeta: la letra del esquema a la izquierda de cada verso, las sílabas a la derecha y «multi N».
 * `esquema`, `silabas` y `multis` = qué se muestra (en una lección, solo lo que ya se enseñó).
 */
export function Estrofa({ estrofa, familias, porPalabra = false, onPalabra, esquema = true, silabas = true, multis = true, colores = true }) {
  const letras = estrofa.versos.map((v) => v.letra).join('')
  const columnas = `${esquema ? '1.5rem_' : ''}minmax(0,1fr)${silabas ? '_2rem' : ''}`
  return (
    <section className="flex flex-col gap-1 rounded-3xl border border-zinc-200 bg-white p-4" data-estrofa data-esquema={letras}>
      {esquema && (
        <div className="mb-1 flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <span>Esquema</span>
          <span className="font-dato text-base font-medium tracking-[0.2em] text-zinc-700">{letras}</span>
        </div>
      )}
      {estrofa.versos.map((v, i) => {
        const fin = v.palabras.at(-1)
        const f = fin && colores ? familias[fin.familia] : null
        return (
          <div key={i} className="grid items-baseline gap-2 py-1" style={{ gridTemplateColumns: columnas.replaceAll('_', ' ') }} data-verso data-silabas={v.silabas}>
            {esquema && (
              <span className="font-dato text-base font-medium" style={{ color: f?.color ? `var(--color-rima-${f.color}-tinta)` : 'var(--color-zinc-500)' }}>
                {v.letra}
              </span>
            )}
            <p className="text-lg leading-relaxed text-zinc-900">
              <Verso verso={v} familias={colores ? familias : []} porPalabra={porPalabra} onPalabra={onPalabra} />
              {multis && v.multi > 0 && (
                <span className="ml-2 inline-block rounded-full bg-zinc-100 px-2 align-middle font-dato text-sm font-medium text-zinc-600" data-multi={v.multi}>
                  multi {v.multi}
                </span>
              )}
            </p>
            {silabas && (
              <span className="text-right font-dato text-base font-medium tabular-nums text-zinc-500" aria-label={`${v.silabas} sílabas`}>
                {v.silabas}
              </span>
            )}
          </div>
        )
      })}
    </section>
  )
}

/** El verso con cada palabra pintada según su familia (tocable si hay `onPalabra`); las sinalefas se ven como «‿». */
export function Verso({ verso, familias, porPalabra, onPalabra }) {
  const partes = []
  let cursor = 0
  verso.palabras.forEach((p, i) => {
    const entre = verso.texto.slice(cursor, p.inicio)
    if (entre) {
      const liga = !porPalabra && verso.sinalefas.includes(i) && /^\s+$/.test(entre)
      partes.push(
        liga ? (
          <span key={`e${i}`} className="text-zinc-400" data-sinalefa>
            ‿
          </span>
        ) : (
          <Fragment key={`e${i}`}>{entre}</Fragment>
        ),
      )
    }
    const f = p.familia !== null ? familias[p.familia] : null
    const props = {
      'data-palabra': p.texto,
      'data-familia': f?.color ?? undefined,
      'data-tipo-rima': f?.tipo,
      style: estiloFamilia(f),
    }
    partes.push(
      onPalabra ? (
        <button key={`p${i}`} type="button" onClick={() => onPalabra(p.texto)} className="rounded-md px-0.5 active:bg-zinc-100" {...props}>
          {p.texto}
        </button>
      ) : (
        <span key={`p${i}`} className="rounded-md px-0.5" {...props}>
          {p.texto}
        </span>
      ),
    )
    cursor = p.fin
  })
  if (cursor < verso.texto.length) partes.push(<Fragment key="fin">{verso.texto.slice(cursor)}</Fragment>)
  return partes
}

/**
 * Una letra corta ya analizada, para las lecciones: `letra` = { texto, esquema, silabas, multis, colores, leyenda }
 * (todo en false salvo los colores, que vienen por defecto; se enciende lo que la lección ya enseñó).
 */
export default function LetraAnalizada({ letra }) {
  const { texto, esquema = false, silabas = false, multis = false, colores = true, leyenda = false } = letra
  const analisis = useMemo(() => analizar(texto), [texto])
  return (
    <div className="flex flex-col gap-3" data-letra-analizada>
      {analisis.estrofas.map((e, i) => (
        // Sin sílabas tampoco se ven las sinalefas («‿»): eso llega con la lección de sílabas.
        <Estrofa key={i} estrofa={e} familias={analisis.familias} porPalabra={!silabas} esquema={esquema} silabas={silabas} multis={multis} colores={colores} />
      ))}
      {leyenda && <Leyenda />}
    </div>
  )
}
