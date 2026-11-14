// Navegación mínima por hash (#/, #/aprender, #/aprender/biblioteca, #/practicar, #/herramientas, #/modulo/1, #/curso, #/curso/bloque/2, #/leccion/1.1, #/leccion/1.1/reto, #/oido/intervalos, #/ritmo/seguir,
// #/letras/vocabulario/repaso).
// El hash funciona en GitHub Pages sin configurar nada (no hay 404 al recargar).
import { useEffect, useState } from 'react'

function parse(hash) {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (partes[0] === 'modulo' && partes[1]) return { pagina: 'modulo', id: partes[1] }
  if (partes[0] === 'leccion' && partes[1]) return { pagina: 'leccion', id: partes[1], reto: partes[2] === 'reto', guiada: partes[2] === 'guiada' }
  if (partes[0] === 'importar') return { pagina: 'importar', id: partes[1] ?? '' }
  if (partes[0] === 'oido') return { pagina: 'oido', id: partes[1] ?? null }
  if (partes[0] === 'ritmo') return { pagina: 'ritmo', id: partes[1] ?? null }
  if (partes[0] === 'letras' && partes[1] === 'vocabulario') return { pagina: 'vocabulario', id: partes[2] ?? null }
  if (partes[0] === 'circulo') return { pagina: 'circulo' }
  if (partes[0] === 'piano') return { pagina: 'piano' }
  if (partes[0] === 'ruta' && partes[1]) return { pagina: 'ruta', id: partes[1] }
  if (partes[0] === 'curso') return { pagina: 'curso', id: partes[1] === 'bloque' && partes[2] ? partes[2] : null }
  if (partes[0] === 'prueba' && partes[1]) return { pagina: 'prueba', id: partes.slice(1).join('/') }
  if (partes[0] === 'letras') return { pagina: 'letras', id: partes[1] ?? null }
  // Las 4 pestañas (fase 3 del rediseño): Inicio · Aprender [Rutas | Biblioteca] · Practicar · Herramientas.
  if (partes[0] === 'aprender') return { pagina: 'aprender', id: partes[1] === 'biblioteca' ? 'biblioteca' : null }
  if (partes[0] === 'practicar') return { pagina: 'practicar' }
  if (partes[0] === 'herramientas') return { pagina: 'herramientas' }
  return { pagina: 'inicio' }
}

export function useRuta() {
  const [ruta, setRuta] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      const nueva = parse(window.location.hash)
      // El origen de una lección solo vale mientras se va de la Biblioteca a ella (o a sus prerrequisitos).
      if (nueva.pagina !== 'leccion' && nueva.pagina !== 'aprender' && nueva.pagina !== 'prueba') origenLeccion = null
      setRuta(nueva)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return ruta
}

export const rutas = {
  inicio: () => '#/',
  /** Pestaña Aprender: Rutas (sin vista) o Biblioteca (las lecciones del catálogo por área y nivel). */
  aprender: (vista) => (vista === 'biblioteca' ? '#/aprender/biblioteca' : '#/aprender'),
  practicar: () => '#/practicar',
  herramientas: () => '#/herramientas',
  modulo: (numero) => `#/modulo/${numero}`,
  leccion: (id) => `#/leccion/${id}`,
  /** La lección abierta desde una ruta o el Curso completo: el orden ya lo marca el camino, así que no avisa
   *  «Antes te conviene» (prerrequisitos suaves de content/catalogo.js). */
  leccionGuiada: (id) => `#/leccion/${id}/guiada`,
  /** Abre la lección directamente en su reto de FL Studio (al terminar vuelve al módulo). */
  reto: (id) => `#/leccion/${id}/reto`,
  /** Explorador del círculo de quintas. */
  circulo: () => '#/circulo',
  /** Piano libre (antes estaba al final de Inicio). */
  piano: () => '#/piano',
  /** Una ruta de curso (se ve igual que un módulo). */
  ruta: (id) => `#/ruta/${id}`,
  /** Curso completo (las tres rutas a la par, en bloques) y un bloque abierto como camino de islas. */
  curso: () => '#/curso',
  bloque: (n) => `#/curso/bloque/${n}`,
  /** Prueba rápida «¿Ya lo sabes?»: 'modulo/3', 'ruta/acordes/triadas' o 'leccion/4.1' (lo que pide; content/pruebas/). */
  prueba: (id) => `#/prueba/${id}`,
  importar: (codigo) => `#/importar/${codigo}`,
  oido: (modo) => (modo ? `#/oido/${modo}` : '#/oido'),
  ritmo: (modo) => (modo ? `#/ritmo/${modo}` : '#/ritmo'),
  /** Cuaderno de letras; con id, una letra. */
  letras: (id) => (id ? `#/letras/${id}` : '#/letras'),
  /** Vocabulario de letras; con modo (repaso, significado, sinonimos, verso), el entrenador. */
  vocabulario: (modo) => (modo ? `#/letras/vocabulario/${modo}` : '#/letras/vocabulario'),
}

export function navegar(href) {
  window.location.hash = href.replace(/^#/, '')
}

/**
 * De dónde se abrió una lección (pestaña Aprender › Biblioteca): su ✕ vuelve ahí en lugar de a su módulo o ruta.
 * Solo mientras la app esté abierta; se olvida al abrir otra lección desde otro lugar.
 */
let origenLeccion = null
export const marcarOrigenLeccion = (id, href) => {
  origenLeccion = { id, href }
}
export const origenDeLeccion = (id) => (origenLeccion?.id === id ? origenLeccion.href : null)
