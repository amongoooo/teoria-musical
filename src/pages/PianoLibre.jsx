import { motion } from 'motion/react'
import Piano from '../components/Piano.jsx'
import { itemLista, lista } from '../ui/movimiento.js'
import { BotonInicio } from '../ui/Volver.jsx'

/** Piano libre (#/piano): antes iba al final de Inicio; ahora se abre desde su tarjetita en Herramientas. */
export default function PianoLibre() {
  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 pt-4 pb-14 sm:pt-8" data-piano-libre>
      <motion.header variants={itemLista} className="flex items-center gap-3">
        <BotonInicio />
        <h1 className="font-titulo text-3xl font-bold tracking-tight">Piano libre</h1>
      </motion.header>
      <motion.div variants={itemLista}>
        <Piano tecladoArriba />
      </motion.div>
    </motion.main>
  )
}
