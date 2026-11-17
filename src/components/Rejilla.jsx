import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { pararProgramado } from '../audio/engine.js'
import { reproducir } from '../audio/sonido.js'
import { funcionDe } from '../theory/acordes.js'
import { oscuro, tinta } from '../ui/color.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import BotonSonido from './BotonSonido.jsx'
import { fondoFuncion } from './MapaFunciones.jsx'

/**
 * «Rejilla de compases» (L10, lección 5.5): una forma de canción en filas de 4 compases (el blues de 12 compases).
 * Cada casilla lleva su número, el cifrado en grande y el grado; su fondo es el de su función (T · S · D, como el mapa
 * de la A2.1: el grado sin la séptima dice cuál). Al tocar Escuchar, cada compás se ENCIENDE cuando suena (color lleno y
 * crece un poco); tocar una casilla toca solo ese compás.
 * rejilla: { compases: [{ cifrado: 'C7', grado: 'I7' }…], sonido: { notas: [un acorde por compás…], intervalo, duracion },
 *   etiqueta: 'Escuchar los 12 compases' }
 */
export default function Rejilla({ rejilla, color }) {
  const [actual, setActual] = useState(-1)
  const [suelto, setSuelto] = useState(null)
  const { compases, sonido } = rejilla
  const encendido = suelto ?? actual

  useEffect(() => () => suelto != null && pararProgramado(), [suelto])

  const tocarCompas = (i) => {
    setActual(-1)
    setSuelto(i)
    const acorde = sonido.notas[i]
    reproducir({ notas: [acorde], duracion: Math.max(0.9, sonido.duracion ?? 0.9) }, { alParar: () => setSuelto((x) => (x === i ? null : x)) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-3" data-rejilla-compases>
      <BotonSonido
        sonido={sonido}
        etiqueta={rejilla.etiqueta}
        className="w-full"
        onPlay={() => setSuelto(null)}
        onNotas={(_, i) => setActual(i)}
        onParar={() => setActual(-1)}
      />
      <div className="grid grid-cols-4 gap-1.5" role="list">
        {compases.map((c, i) => {
          const f = funcionDe(c.grado.replace(/maj7|7$/, '')) ?? 'T'
          const on = encendido === i
          return (
            <Pulsable
              key={i}
              tipo="tarjeta"
              role="listitem"
              onClick={() => tocarCompas(i)}
              aria-label={`Compás ${i + 1}: ${c.cifrado}, el ${c.grado}`}
              data-compas={i + 1}
              data-suena={on ? '' : undefined}
              className="min-w-0"
            >
              <motion.span
                animate={{ scale: on ? 1.06 : 1 }}
                transition={RESORTE.pulsar}
                className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-1 pb-1.5 pt-1 transition-colors duration-150"
                style={{
                  background: on ? oscuro(color) : fondoFuncion(color, f),
                  borderColor: on ? oscuro(color) : 'transparent',
                }}
              >
                <span className={`self-start pl-1 font-dato text-xs leading-none ${on ? 'text-blanco' : 'text-zinc-500'}`}>{i + 1}</span>
                <span className={`font-titulo text-xl font-extrabold leading-tight ${on ? 'text-blanco' : ''}`} style={on ? undefined : { color: tinta(color) }}>
                  {c.cifrado}
                </span>
                <span className={`font-dato text-xs leading-none ${on ? 'text-blanco' : 'text-zinc-600'}`}>{c.grado}</span>
              </motion.span>
            </Pulsable>
          )
        })}
      </div>
    </div>
  )
}
