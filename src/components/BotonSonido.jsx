import { useEffect, useMemo, useState } from 'react'
import { pararProgramado } from '../audio/engine.js'
import { notasDe, reproducir } from '../audio/sonido.js'
import { esPercusion } from '../theory/bateria.js'
import { Reproducir } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import { VerSonido, partesSonido, useVistaSonido } from './VerSonido.jsx'

/**
 * Botón grande que reproduce un sonido del contenido y se ilumina mientras suena. Solo suena uno a la vez: tocar otro
 * sonido para este (y se apaga).
 * onNotas(notas, i): opcional, se llama justo cuando suena cada nota (o grupo), para señalarla en el teclado
 * o en las casillas mientras suena (pedido del usuario).
 * ver: en los pasos para APRENDER (texto y siente), debajo sale lo que suena (VerSonido: metrónomo, pads, teclado u
 * onda) y se enciende al sonar. En las preguntas no (delataría la respuesta). `color` = el de la lección.
 */
export default function BotonSonido({ sonido, etiqueta, className = '', onPlay, onNotas, ver = false, color = 'var(--color-zinc-900)' }) {
  const [sonando, setSonando] = useState(false)
  const { vista, alSonar, alParar, encender, setPulso } = useVistaSonido(sonido)
  const partes = useMemo(() => (ver ? partesSonido(sonido) : null), [ver, sonido])

  // Al salir del paso, si sigue sonando, se para.
  useEffect(
    () => () => {
      if (sonandoGlobal.yo === sonido) pararProgramado()
    },
    [sonido],
  )

  const tocar = () => {
    setSonando(true)
    sonandoGlobal.yo = sonido
    reproducir(sonido, {
      alSonar: (e, i) => {
        alSonar(e)
        const tonos = notasDe(e).filter((n) => !esPercusion(n))
        if (onNotas && tonos.length) onNotas(tonos, i)
      },
      alParar: () => {
        setSonando(false)
        alParar()
      },
    })
    onPlay?.()
  }

  const boton = (
    <Pulsable
      onClick={tocar}
      data-sonando={sonando || undefined}
      className={`flex min-h-14 items-center gap-3 rounded-2xl border px-5 py-3 text-left text-base font-medium transition-colors duration-200 ${
        sonando ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-800'
      } ${ver ? 'w-full' : className}`}
    >
      <IconoPlay sonando={sonando} />
      <span>{etiqueta ?? sonido.etiqueta ?? 'Escuchar'}</span>
    </Pulsable>
  )
  if (!ver) return boton
  return (
    <div className={`flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-3 ${className}`} data-boton-sonido-ver>
      {boton}
      <VerSonido sonido={sonido} partes={partes} vista={vista} color={color} sonando={sonando} encender={encender} setPulso={setPulso} />
    </div>
  )
}

/** El último sonido pedido desde un botón (para pararlo si su botón desaparece). */
const sonandoGlobal = { yo: null }

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
