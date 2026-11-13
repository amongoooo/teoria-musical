// Navegación mínima por hash (#/modulo/1, #/leccion/1.1, #/leccion/1.1/reto, #/oido/intervalos, #/ritmo/seguir).
// El hash funciona en GitHub Pages sin configurar nada (no hay 404 al recargar).
import { useEffect, useState } from 'react'

function parse(hash) {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (partes[0] === 'modulo' && partes[1]) return { pagina: 'modulo', id: partes[1] }
  if (partes[0] === 'leccion' && partes[1]) return { pagina: 'leccion', id: partes[1], reto: partes[2] === 'reto' }
  if (partes[0] === 'importar') return { pagina: 'importar', id: partes[1] ?? '' }
  if (partes[0] === 'oido') return { pagina: 'oido', id: partes[1] ?? null }
  if (partes[0] === 'ritmo') return { pagina: 'ritmo', id: partes[1] ?? null }
  if (partes[0] === 'letras') return { pagina: 'letras', id: partes[1] ?? null }
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
  /** Abre la lección directamente en su reto de FL Studio (al terminar vuelve al módulo). */
  reto: (id) => `#/leccion/${id}/reto`,
  importar: (codigo) => `#/importar/${codigo}`,
  oido: (modo) => (modo ? `#/oido/${modo}` : '#/oido'),
  ritmo: (modo) => (modo ? `#/ritmo/${modo}` : '#/ritmo'),
  /** Cuaderno de letras; con id, una letra. */
  letras: (id) => (id ? `#/letras/${id}` : '#/letras'),
}

export function navegar(href) {
  window.location.hash = href.replace(/^#/, '')
}
