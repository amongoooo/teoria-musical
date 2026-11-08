import { useEffect, useRef, useState } from 'react'
import { reproducir } from '../audio/sonido.js'

/** Botón grande que reproduce un sonido del contenido y se ilumina mientras suena. */
export default function BotonSonido({ sonido, etiqueta, className = '', onPlay }) {
  const [sonando, setSonando] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const tocar = () => {
    const dur = reproducir(sonido)
    onPlay?.()
    setSonando(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSonando(false), dur * 1000)
  }

  return (
    <button
      type="button"
      onClick={tocar}
      className={`flex min-h-14 items-center gap-3 rounded-2xl border px-5 py-3 text-left text-base font-medium transition active:scale-[0.98] ${
        sonando ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-800'
      } ${className}`}
    >
      <IconoPlay sonando={sonando} />
      <span>{etiqueta ?? sonido.etiqueta ?? 'Escuchar'}</span>
    </button>
  )
}

export function IconoPlay({ sonando }) {
  return (
    <span
      aria-hidden
      className={`grid size-9 shrink-0 place-items-center rounded-full text-sm ${
        sonando ? 'animate-pulse bg-sky-500 text-white' : 'bg-zinc-900 text-white'
      }`}
    >
      ▶
    </span>
  )
}
