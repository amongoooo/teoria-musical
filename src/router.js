// Navegación mínima por hash (#/modulo/1, #/leccion/1.1).
// El hash funciona en GitHub Pages sin configurar nada (no hay 404 al recargar).
import { useEffect, useState } from 'react'

function parse(hash) {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (partes[0] === 'modulo' && partes[1]) return { pagina: 'modulo', id: partes[1] }
  if (partes[0] === 'leccion' && partes[1]) return { pagina: 'leccion', id: partes[1] }
  return { pagina: 'inicio' }
}

export function useRuta() {
  const [ruta, setRuta] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRuta(parse(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return ruta
}

export const rutas = {
  inicio: () => '#/',
  modulo: (numero) => `#/modulo/${numero}`,
  leccion: (id) => `#/leccion/${id}`,
}

export function navegar(href) {
  window.location.hash = href.replace(/^#/, '')
}
