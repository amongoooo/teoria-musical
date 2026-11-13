import { motion } from 'motion/react'
import { buscarRimas, useDiccionario } from '../letras/rimasDiccionario.js'
import Pulsable from '../ui/Pulsable.jsx'

/**
 * Rimas de una palabra en el diccionario (las ~45 000 palabras más usadas): consonantes en píldoras negras y
 * asonantes en píldoras punteadas, como «En esta letra riman». Con `onPalabra`, cada píldora abre esa palabra.
 */
export default function RimasDiccionario({ palabra, max = 24, onPalabra }) {
  const d = useDiccionario()
  const { consonantes, asonantes } = buscarRimas(d, palabra, max)
  return (
    <section className="flex flex-col gap-3" data-rimas-diccionario={d ? 'listo' : 'cargando'}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Rimas en el diccionario</h3>
      {!d ? (
        <div className="flex flex-wrap gap-2" aria-label="Cargando el diccionario">
          {[64, 88, 56, 96, 72, 60].map((w, i) => (
            <span key={i} className="h-9 animate-pulse rounded-full bg-zinc-100" style={{ width: w }} />
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
          {!consonantes.length && !asonantes.length && <p className="text-base text-zinc-500">No hay rimas en la lista.</p>}
          <Grupo titulo="Consonante" palabras={consonantes} estilo="bg-zinc-900 text-white" onPalabra={onPalabra} />
          <Grupo titulo="Asonante" palabras={asonantes} estilo="border-2 border-dashed border-zinc-300 text-zinc-700" onPalabra={onPalabra} />
        </motion.div>
      )}
    </section>
  )
}

function Grupo({ titulo, palabras, estilo, onPalabra }) {
  if (!palabras.length) return null
  return (
    <div className="flex flex-col gap-2">
      <span className="text-base font-semibold text-zinc-700">{titulo}</span>
      <div className="flex flex-wrap gap-2">
        {palabras.map((p) =>
          onPalabra ? (
            <Pulsable key={p} onClick={() => onPalabra(p)} data-rima={p} className={`min-h-11 rounded-full px-3.5 text-base font-medium ${estilo}`}>
              {p}
            </Pulsable>
          ) : (
            <span key={p} data-rima={p} className={`rounded-full px-3 py-1.5 text-base font-medium ${estilo}`}>
              {p}
            </span>
          ),
        )}
      </div>
    </div>
  )
}
