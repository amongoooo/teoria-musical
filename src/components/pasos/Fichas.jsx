import { useState } from 'react'
import { reproducir } from '../../audio/sonido.js'
import Pulsable from '../../ui/Pulsable.jsx'
import { IconoPlay } from '../BotonSonido.jsx'
import Rich from '../Rich.jsx'

/**
 * Lista de fichas que suenan (p. ej. los intervalos con su canción de referencia).
 * fichas: { nombre: 'Intervalo', dato: 'Semitonos', filas: [{ nombre, texto, dato, sonido }] }
 * Cada fila entera es un botón: toca su sonido. El dato va a la derecha en DM Mono.
 */
export default function Fichas({ fichas }) {
  const [sonando, setSonando] = useState(null)

  const tocar = (i, sonido) => {
    setSonando(i)
    reproducir(sonido, { alParar: () => setSonando((x) => (x === i ? null : x)) })
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white">
      {(fichas.nombre || fichas.dato) && (
        <p className="flex justify-between gap-3 border-b border-zinc-200 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <span>{fichas.nombre}</span>
          <span>{fichas.dato}</span>
        </p>
      )}
      <ul className="flex flex-col divide-y divide-zinc-200">
        {fichas.filas.map((f, i) => (
          <li key={i}>
            <Pulsable
              tipo="tarjeta"
              onClick={() => tocar(i, f.sonido)}
              aria-label={`Escuchar ${f.nombre}`}
              className={`flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                sonando === i ? 'bg-sky-50' : 'bg-white'
              }`}
            >
              <IconoPlay sonando={sonando === i} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-lg font-semibold leading-snug text-zinc-900">{f.nombre}</span>
                {f.texto && (
                  <span className="text-base leading-snug text-zinc-500">
                    <Rich>{f.texto}</Rich>
                  </span>
                )}
              </span>
              {f.dato != null && (
                <span className="shrink-0 font-dato text-2xl font-medium tabular-nums text-zinc-700">{f.dato}</span>
              )}
            </Pulsable>
          </li>
        ))}
      </ul>
    </section>
  )
}
