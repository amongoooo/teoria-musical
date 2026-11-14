import { motion } from 'motion/react'
import { TarjetaCirculo, TarjetaFlow, TarjetaPiano } from '../components/Tarjetas.jsx'
import { herramientaAbierta } from '../content/rutas.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { itemLista, lista } from '../ui/movimiento.js'

/**
 * Pestaña HERRAMIENTAS (fase 3 del rediseño; maqueta aprobada: https://claude.ai/artifact/6EWwNQ4puh3mtiT1T8Pfne): el
 * Piano libre (abierto desde el principio), el Círculo de quintas (se abre con la 3.5) y el Flow (con la 2.4). Cada
 * herramienta nueva entra aquí, con el color de su área; las que usan algo que enseña una lección van punteadas con
 * candado hasta hacerla.
 */
export default function Herramientas() {
  const progreso = useProgreso()
  const { admin } = useOpciones()
  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 px-5 pt-6 pb-36 sm:pt-8"
    >
      <motion.h1 variants={itemLista} className="mb-1 font-titulo text-4xl font-extrabold tracking-tight">
        Herramientas
      </motion.h1>
      <motion.div variants={itemLista}>
        <TarjetaPiano />
      </motion.div>
      <motion.div variants={itemLista}>
        <TarjetaCirculo abierta={herramientaAbierta('circulo', progreso, admin)} />
      </motion.div>
      <motion.div variants={itemLista}>
        <TarjetaFlow abierta={herramientaAbierta('flow', progreso, admin)} />
      </motion.div>
    </motion.main>
  )
}
