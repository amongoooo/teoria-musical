import { useEffect, useRef, useState } from 'react'
import { reproducir, seguirNotas } from '../audio/sonido.js'
import { Reproducir } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'

/**
 * Botón grande que reproduce un sonido del contenido y se ilumina mientras suena.
 * onNotas(notas, i): opcional, se llama justo cuando suena cada nota (o grupo), para señalarla en el teclado
 * o en las casillas mientras suena (pedido del usuario).
 */
export default function BotonSonido({ sonido, etiqueta, className = '', onPlay, onNotas }) {
  const [sonando, setSonando] = useState(false)
  const timer = useRef(null)
  const cancelar = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      cancelar.current?.()
    },
    [],
  )

  const tocar = () => {
    const dur = reproducir(sonido)
    cancelar.current?.()
    if (onNotas) cancelar.current = seguirNotas(sonido, onNotas)
    onPlay?.()
    setSonando(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSonando(false), dur * 1000)
  }

  return (
    <Pulsable
      onClick={tocar}
      className={`flex min-h-14 items-center gap-3 rounded-2xl border px-5 py-3 text-left text-base font-medium transition-colors duration-200 ${
        sonando ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-800'
      } ${className}`}
    >
      <IconoPlay sonando={sonando} />
      <span>{etiqueta ?? sonido.etiqueta ?? 'Escuchar'}</span>
    </Pulsable>
  )
}

export function IconoPlay({ sonando }) {
  return (
    <span
      aria-hidden
      className={`grid size-9 shrink-0 place-items-center rounded-full ${
        sonando ? 'animate-pulse bg-sky-500 text-blanco' : 'bg-zinc-900 text-white'
      }`}
    >
      <Reproducir className="size-[18px]" />
    </span>
  )
}
