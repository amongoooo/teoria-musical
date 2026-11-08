import { useRuta } from './router.js'
import Inicio from './pages/Inicio.jsx'
import Leccion from './pages/Leccion.jsx'
import Modulo from './pages/Modulo.jsx'

export default function App() {
  const ruta = useRuta()
  if (ruta.pagina === 'modulo') return <Modulo key={ruta.id} numero={ruta.id} />
  if (ruta.pagina === 'leccion') return <Leccion key={ruta.id} id={ruta.id} />
  return <Inicio />
}
