import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import ChannelRack from '../components/ChannelRack.jsx'
import { guardarCaja, leerCaja } from '../progress/caja.js'
import { FILAS_BASICAS, PATRONES, normalizar } from '../theory/rack.js'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { BotonInicio } from '../ui/Volver.jsx'

const ACENTO = 'var(--color-produccion)'
const BPM_MIN = 60
const BPM_MAX = 180

/** Para empezar: el beat de la P1.1, el del pop o vacío. */
const INICIOS = [
  { id: 'boomBap', nombre: 'Boom bap', patron: PATRONES.boomBap },
  { id: 'pop', nombre: 'Pop', patron: PATRONES.pop },
  { id: 'vacio', nombre: 'Vacío', patron: {} },
]

/**
 * CAJA DE RITMOS (#/caja; herramienta del área Producción, se abre con la P1.1): el Channel rack libre. El patrón y el
 * tempo se guardan en el dispositivo (progress/caja.js).
 */
export default function CajaRitmos() {
  const [datos, setDatos] = useState(leerCaja)
  const [mudas, setMudas] = useState([])
  useEffect(() => guardarCaja(datos), [datos])

  const tempo = (d) => setDatos((x) => ({ ...x, bpm: Math.min(BPM_MAX, Math.max(BPM_MIN, x.bpm + d)) }))

  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 pt-4 pb-14 sm:pt-8" data-caja-ritmos>
      <motion.header variants={itemLista} className="flex items-center gap-3">
        <BotonInicio />
        <h1 className="font-titulo text-3xl font-bold tracking-tight">Caja de ritmos</h1>
      </motion.header>

      <motion.div variants={itemLista}>
        <ChannelRack
          filas={FILAS_BASICAS}
          patron={datos.patron}
          onCambio={(patron) => setDatos((x) => ({ ...x, patron }))}
          mudas={mudas}
          onMudas={setMudas}
          bpm={datos.bpm}
          color={ACENTO}
          extra={
            <div className="flex items-center gap-1" role="group" aria-label="Tempo">
              <Pulsable onClick={() => tempo(-5)} disabled={datos.bpm <= BPM_MIN} aria-label="Más lento" className="grid size-11 place-items-center rounded-full bg-zinc-100 text-2xl font-semibold text-zinc-700 disabled:text-zinc-400">
                −
              </Pulsable>
              <span className="min-w-[5.5rem] text-center font-dato text-base font-medium tabular-nums text-zinc-700" data-bpm={datos.bpm}>
                {datos.bpm} BPM
              </span>
              <Pulsable onClick={() => tempo(5)} disabled={datos.bpm >= BPM_MAX} aria-label="Más rápido" className="grid size-11 place-items-center rounded-full bg-zinc-100 text-2xl font-semibold text-zinc-700 disabled:text-zinc-400">
                +
              </Pulsable>
            </div>
          }
        />
      </motion.div>

      <motion.section variants={itemLista} className="flex flex-col gap-3" aria-label="Empezar con">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Empezar con</h2>
        <div className="flex flex-wrap gap-2">
          {INICIOS.map((i) => (
            <Pulsable
              key={i.id}
              onClick={() => setDatos((x) => ({ ...x, patron: normalizar(i.patron) }))}
              data-inicio={i.id}
              className="min-h-11 rounded-full border-2 border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-800"
            >
              {i.nombre}
            </Pulsable>
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}
