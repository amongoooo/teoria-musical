import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRef } from 'react'
import { useRuta } from './router.js'
import Inicio from './pages/Inicio.jsx'
import Leccion from './pages/Leccion.jsx'
import Modulo from './pages/Modulo.jsx'
import Oido from './pages/Oido.jsx'
import { RESORTE, profundidad, variantesPantalla } from './ui/movimiento.js'

function Pagina({ ruta }) {
  if (ruta.pagina === 'modulo') return <Modulo numero={ruta.id} />
  if (ruta.pagina === 'leccion') return <Leccion id={ruta.id} />
  if (ruta.pagina === 'oido') return <Oido modo={ruta.id} />
  return <Inicio />
}

export default function App() {
  const ruta = useRuta()
  const clave = `${ruta.pagina}:${ruta.id ?? ''}`

  // Dirección: 1 = avanzar (entra por la derecha), -1 = volver.
  const anterior = useRef({ clave, prof: profundidad(ruta), dir: 1 })
  if (anterior.current.clave !== clave) {
    const prof = profundidad(ruta)
    anterior.current = { clave, prof, dir: prof >= anterior.current.prof ? 1 : -1 }
  }
  const dir = anterior.current.dir

  return (
    // reducedMotion="user": si el teléfono pide reducir movimiento, se quitan los
    // desplazamientos y solo quedan fundidos.
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={clave}
          custom={dir}
          variants={variantesPantalla}
          initial="entra"
          animate="quieta"
          exit="sale"
          transition={{ ...RESORTE.pantalla, opacity: { duration: 0.18 } }}
        >
          <Pagina ruta={ruta} />
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
