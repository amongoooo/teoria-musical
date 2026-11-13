import { motion } from 'motion/react'
import { rutas } from '../router.js'
import { tinta } from '../ui/color.js'
import { itemLista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { Cuadrito } from './NavegadorModulos.jsx'
import { useRuta } from './rutaModulo.js'

/** Entrada a una ruta desde su práctica (#/ritmo, cuaderno de #/letras): su cuadrito, el nombre y «3/10 paradas». */
export default function EntradaRuta({ id }) {
  const { ruta, modulo, estado } = useRuta(id)
  return (
    <motion.div variants={itemLista}>
      <Pulsable
        href={rutas.ruta(id)}
        tipo="tarjeta"
        data-entrada-ruta={id}
        className="flex items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-3 pr-4 text-left"
        style={{ boxShadow: '0 5px 0 var(--color-zinc-200)' }}
      >
        <span className="grid size-20 shrink-0 place-items-center">
          <Cuadrito modulo={modulo} tam={60} hecho={estado.hechas === estado.total} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-juego text-lg uppercase tracking-wide text-zinc-800">{ruta.titulo}</span>
          <span className="font-dato text-base font-medium tabular-nums" style={{ color: tinta(modulo.acento) }}>
            {estado.hechas}/{estado.total} paradas
          </span>
        </span>
        <span className="text-2xl text-zinc-400" aria-hidden>
          ›
        </span>
      </Pulsable>
    </motion.div>
  )
}
