import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRef } from 'react'
import CabeceraModulo from './components/CabeceraModulo.jsx'
import { useRuta } from './router.js'
import Importar from './pages/Importar.jsx'
import Inicio from './pages/Inicio.jsx'
import Leccion from './pages/Leccion.jsx'
import Modulo from './pages/Modulo.jsx'
import Oido from './pages/Oido.jsx'
import Ritmo from './pages/Ritmo.jsx'
import { RESORTE, profundidad, variantesPantalla } from './ui/movimiento.js'

function Pagina({ ruta }) {
  if (ruta.pagina === 'modulo') return <Modulo numero={ruta.id} />
  if (ruta.pagina === 'leccion') return <Leccion id={ruta.id} soloReto={ruta.reto} />
  if (ruta.pagina === 'oido') return <Oido modo={ruta.id} />
  if (ruta.pagina === 'ritmo') return <Ritmo modo={ruta.id} />
  if (ruta.pagina === 'importar') return <Importar codigo={ruta.id} />
  return <Inicio />
}

export default function App() {
  const ruta = useRuta()
  const clave = `${ruta.pagina}:${ruta.id ?? ''}${ruta.reto ? ':reto' : ''}`

  // Dirección: 1 = avanzar (entra por la derecha), -1 = volver.
  // Entre módulos (swipe de página o pestaña de Módulos): el siguiente entra por la derecha y el anterior por la izquierda.
  const anterior = useRef({ clave, ruta, prof: profundidad(ruta), dir: 1 })
  if (anterior.current.clave !== clave) {
    const prof = profundidad(ruta)
    const previa = anterior.current.ruta
    const entreModulos = ruta.pagina === 'modulo' && previa.pagina === 'modulo'
    const dir = entreModulos ? (Number(ruta.id) > Number(previa.id) ? 1 : -1) : prof >= anterior.current.prof ? 1 : -1
    anterior.current = { clave, ruta, prof, dir }
  }
  const dir = anterior.current.dir

  return (
    // reducedMotion="user": si el teléfono pide reducir movimiento, se quitan los
    // desplazamientos y solo quedan fundidos.
    <MotionConfig reducedMotion="user">
      {/* Cabecera de los módulos fuera de la transición: entre módulos se queda quieta (solo cambia la barra). */}
      <AnimatePresence initial={false} custom={dir}>
        {ruta.pagina === 'modulo' && (
          <motion.div
            key="cabecera-modulo"
            custom={dir}
            variants={variantesPantalla}
            initial="entra"
            animate="quieta"
            exit="sale"
            transition={{ ...RESORTE.pantalla, opacity: { duration: 0.18 } }}
          >
            <CabeceraModulo numero={ruta.id} />
          </motion.div>
        )}
      </AnimatePresence>
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
