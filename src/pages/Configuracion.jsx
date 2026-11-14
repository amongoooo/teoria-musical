import { motion } from 'motion/react'
import { PanelOpciones } from '../components/Opciones.jsx'
import { itemLista, lista } from '../ui/movimiento.js'

/**
 * Pestaña CONFIGURACIÓN (pedido del usuario: la tuerquita en la barra de abajo): las mismas Opciones de la hoja
 * (components/Opciones.jsx → PanelOpciones), como página. Fuera de las pestañas, el engrane de las cabeceras sigue
 * abriendo la hoja.
 */
export default function Configuracion() {
  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      data-configuracion
      className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pt-6 pb-36 sm:pt-8"
    >
      <motion.div variants={itemLista}>
        <PanelOpciones titulo="Configuración" />
      </motion.div>
    </motion.main>
  )
}
