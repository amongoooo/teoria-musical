import { useState } from 'react'
import { getReto, guardarReto, useProgreso } from '../../progress/progreso.js'
import Nota from '../pasos/Nota.jsx'
import Rich from '../Rich.jsx'

/**
 * "Reto en FL Studio": instrucciones paso a paso, casilla "Lo hice"
 * y una nota de reflexión. Se guarda en el progreso (retos[leccionId]).
 * Es opcional: se puede continuar la lección y hacerlo después.
 */
export default function RetoFL({ paso, leccionId }) {
  useProgreso() // re-render cuando cambia el progreso
  const reto = getReto(leccionId) ?? {}
  const [marcados, setMarcados] = useState(() => new Set())
  const [nota, setNota] = useState(reto.nota ?? '')

  const alternar = (i) =>
    setMarcados((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
        <span className="rounded-full bg-orange-100 px-3 py-1.5 text-orange-800">FL Studio</span>
        {paso.minutos && <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">~{paso.minutos} min</span>}
        {reto.hecho && <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">✓ Hecho</span>}
      </div>

      {paso.objetivo && (
        <p className="text-lg leading-relaxed text-zinc-600">
          <span className="font-semibold text-zinc-900">Objetivo: </span>
          <Rich>{paso.objetivo}</Rich>
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {paso.pasos.map((texto, i) => {
          const ok = marcados.has(i)
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => alternar(i)}
                aria-pressed={ok}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-base leading-relaxed transition ${
                  ok ? 'border-emerald-200 bg-emerald-50 text-zinc-500' : 'border-zinc-200 bg-white text-zinc-700'
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    ok ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {ok ? '✓' : i + 1}
                </span>
                <span>
                  <Rich>{texto}</Rich>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {paso.consejo && <Nota titulo="Ojo">{paso.consejo}</Nota>}

      {paso.reflexion && (
        <label className="flex flex-col gap-2">
          <span className="text-base font-semibold text-zinc-800">{paso.reflexion}</span>
          <textarea
            value={nota}
            onChange={(e) => {
              setNota(e.target.value)
              guardarReto(leccionId, { nota: e.target.value })
            }}
            rows={3}
            placeholder="Escribe aquí tu reflexión (se guarda sola)"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none focus:border-zinc-400"
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => guardarReto(leccionId, { hecho: !reto.hecho })}
        className={`min-h-14 rounded-2xl border-2 px-5 text-lg font-semibold transition active:scale-[0.99] ${
          reto.hecho ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-zinc-900 bg-white text-zinc-900'
        }`}
      >
        {reto.hecho ? '✓ ¡Reto hecho!' : 'Lo hice'}
      </button>
      <p className="-mt-3 text-center text-sm text-zinc-500">Puedes continuar y hacer el reto más tarde.</p>
    </div>
  )
}
