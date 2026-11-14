import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import BarraPestanas, { indicePestana } from './components/BarraPestanas.jsx'
import CabeceraModulo from './components/CabeceraModulo.jsx'
import MetaCumplida, { acentoPractica } from './components/MetaCumplida.jsx'
import { useMedirMetas } from './components/rutaModulo.js'
import { marcarCumplida, soltarMeta, useMetaGuiada } from './progress/metaGuiada.js'
import Aprender from './pages/Aprender.jsx'
import Herramientas from './pages/Herramientas.jsx'
import Practicar from './pages/Practicar.jsx'
import Circulo from './pages/Circulo.jsx'
import PianoLibre from './pages/PianoLibre.jsx'
import Ruta from './pages/Ruta.jsx'
import Curso from './pages/Curso.jsx'
import { ORDEN_RUTAS } from './content/rutas.js'
import { useRuta } from './router.js'
import Importar from './pages/Importar.jsx'
import Inicio from './pages/Inicio.jsx'
import Leccion from './pages/Leccion.jsx'
import Letras from './pages/Letras.jsx'
import Modulo from './pages/Modulo.jsx'
import Oido from './pages/Oido.jsx'
import Prueba from './pages/Prueba.jsx'
import Ritmo from './pages/Ritmo.jsx'
import Vocabulario from './pages/Vocabulario.jsx'
import { RESORTE, profundidad, variantesPantalla } from './ui/movimiento.js'

function Pagina({ ruta }) {
  if (ruta.pagina === 'modulo') return <Modulo numero={ruta.id} />
  if (ruta.pagina === 'leccion') return <Leccion id={ruta.id} soloReto={ruta.reto} guiada={ruta.guiada} />
  if (ruta.pagina === 'oido') return <Oido modo={ruta.id} />
  if (ruta.pagina === 'ritmo') return <Ritmo modo={ruta.id} />
  if (ruta.pagina === 'letras') return <Letras id={ruta.id} />
  if (ruta.pagina === 'vocabulario') return <Vocabulario modo={ruta.id} />
  if (ruta.pagina === 'circulo') return <Circulo />
  if (ruta.pagina === 'piano') return <PianoLibre />
  if (ruta.pagina === 'ruta') return <Ruta id={ruta.id} />
  if (ruta.pagina === 'curso') return <Curso bloque={ruta.id} />
  if (ruta.pagina === 'prueba') return <Prueba id={ruta.id} />
  if (ruta.pagina === 'importar') return <Importar codigo={ruta.id} />
  if (ruta.pagina === 'aprender') return <Aprender vista={ruta.id} />
  if (ruta.pagina === 'practicar') return <Practicar />
  if (ruta.pagina === 'herramientas') return <Herramientas />
  return <Inicio />
}

/**
 * Entre rutas, las rutas dan la vuelta (de la última se pasa a la primera): la de al lado hacia delante entra por la
 * derecha y la de al lado hacia atrás por la izquierda, también al cruzar la vuelta.
 */
function direccionRuta(de, a) {
  const n = ORDEN_RUTAS.length
  const d = (ORDEN_RUTAS.indexOf(a) - ORDEN_RUTAS.indexOf(de) + n) % n
  return d === 1 ? 1 : d === n - 1 ? -1 : ORDEN_RUTAS.indexOf(a) > ORDEN_RUTAS.indexOf(de) ? 1 : -1
}

/** Páginas de práctica donde vale una meta guiada (entrenadores de oído, ritmo y vocabulario, con sus paneles). */
const PAGINAS_PRACTICA = ['oido', 'ritmo', 'vocabulario']

/**
 * Mide la meta guiada mientras se practica (aparte, para que lo que cambia en cada respuesta no vuelva a pintar la
 * página): al cumplirse, la marca y App cambia el entrenador por «¡Meta cumplida!».
 */
function VigilaMeta({ guia }) {
  const { meta } = useMedirMetas()
  const m = meta(guia.parada, guia.practica)
  useEffect(() => {
    if (m.valor >= m.meta) marcarCumplida()
  }, [m.valor, m.meta])
  return null
}

export default function App() {
  const ruta = useRuta()
  const guia = useMetaGuiada()
  const enPractica = PAGINAS_PRACTICA.includes(ruta.pagina)
  // La meta guiada se olvida al salir de la práctica (volver a la ruta, a Inicio…).
  const antes = useRef(ruta.pagina)
  useEffect(() => {
    if (PAGINAS_PRACTICA.includes(antes.current) && !enPractica) soltarMeta()
    antes.current = ruta.pagina
  }, [ruta.pagina, enPractica])
  const metaCumplida = guia?.cumplida && enPractica
  // Rutas | Biblioteca son la misma página (el selector se desliza): sin transición de pantalla entre ellas.
  const clave = metaCumplida ? 'meta-cumplida' : ruta.pagina === 'aprender' ? 'aprender' : `${ruta.pagina}:${ruta.id ?? ''}${ruta.reto ? ':reto' : ''}`

  // Dirección: 1 = avanzar (entra por la derecha), -1 = volver.
  // Entre módulos (swipe de página o pestaña de Módulos): el siguiente entra por la derecha y el anterior por la izquierda.
  const anterior = useRef({ clave, ruta, prof: profundidad(ruta), dir: 1 })
  if (anterior.current.clave !== clave) {
    const prof = profundidad(ruta)
    const previa = anterior.current.ruta
    const entreModulos = ruta.pagina === 'modulo' && previa.pagina === 'modulo'
    const entreRutas = ruta.pagina === 'ruta' && previa.pagina === 'ruta'
    // Entre bloques del curso: el siguiente entra por la derecha y el anterior por la izquierda (sin vuelta).
    const entreBloques = ruta.pagina === 'curso' && previa.pagina === 'curso' && ruta.id && previa.id
    // Entre pestañas: la de la derecha entra por la derecha.
    const entrePestanas = indicePestana(ruta.pagina) >= 0 && indicePestana(previa.pagina) >= 0
    const dir = entrePestanas
      ? indicePestana(ruta.pagina) > indicePestana(previa.pagina) ? 1 : -1
      : entreModulos || entreBloques
      ? Number(ruta.id) > Number(previa.id) ? 1 : -1
      : entreRutas
        ? direccionRuta(previa.id, ruta.id)
        : prof >= anterior.current.prof ? 1 : -1
    anterior.current = { clave, ruta, prof, dir }
  }
  const dir = anterior.current.dir

  return (
    // reducedMotion="user": si el teléfono pide reducir movimiento, se quitan los
    // desplazamientos y solo quedan fundidos.
    <MotionConfig reducedMotion="user">
      {/* Cabecera de los módulos fuera de la transición: entre módulos se queda quieta (solo cambia la barra). */}
      <AnimatePresence initial={false} custom={dir}>
        {(ruta.pagina === 'modulo' || ruta.pagina === 'ruta' || ruta.pagina === 'curso') && (
          <motion.div
            key="cabecera-modulo"
            custom={dir}
            variants={variantesPantalla}
            initial="entra"
            animate="quieta"
            exit="sale"
            transition={{ ...RESORTE.pantalla, opacity: { duration: 0.18 } }}
          >
            {ruta.pagina === 'curso' ? (
              <CabeceraModulo curso bloque={ruta.id} />
            ) : ruta.pagina === 'ruta' ? (
              <CabeceraModulo ruta={ruta.id} />
            ) : (
              <CabeceraModulo numero={ruta.id} />
            )}
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
          {metaCumplida ? <MetaCumplida guia={guia} acento={acentoPractica(guia.practica)} /> : <Pagina ruta={ruta} />}
        </motion.div>
      </AnimatePresence>
      {guia && enPractica && !guia.cumplida && <VigilaMeta guia={guia} />}
      {/* Las 4 pestañas (fase 3 del rediseño): fuera de la transición, se quedan quietas al cambiar de pestaña. */}
      <AnimatePresence initial={false}>{indicePestana(ruta.pagina) >= 0 && <BarraPestanas key="pestanas" ruta={ruta} />}</AnimatePresence>
    </MotionConfig>
  )
}
