// ÁRBOL DE GÉNEROS (propuesta aprobada: https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE; pedido del usuario: «que se
// pueda ir masterizando por las ramas padres y se vayan desbloqueando ramas hijas»). Los géneros viven en
// theory/rack.js → GENEROS; aquí, cómo se arma el árbol y cuándo se abre cada rama. Sin React: lo usan la página
// (pages/Generos.jsx), la Caja de ritmos, la XP y las pruebas de node.
import { FILAS_RACK, GENEROS } from './rack.js'

/** Los cuatro troncos, en el orden en que se ven (un tronco a la vez en el celular). */
export const TRONCOS = ['pop', 'boomBap', 'house', 'dembow']

/** Los géneros de un tronco, por filas del árbol: [[pop], [rock, funk]]. */
export function nivelesDe(tronco) {
  const lista = Object.values(GENEROS).filter((g) => g.tronco === tronco)
  const n = Math.max(...lista.map((g) => g.nivel)) + 1
  return Array.from({ length: n }, (_, k) => lista.filter((g) => g.nivel === k).map((g) => g.id))
}

/** Hijos de un género (los que lo tienen entre sus padres, de cualquier tronco). */
export const hijosDe = (id) => Object.values(GENEROS).filter((g) => g.padres?.includes(id)).map((g) => g.id)

/** Nombre corto (para los nodos del árbol). */
export const nombreCorto = (id) => GENEROS[id].corto ?? GENEROS[id].nombre

const leccionHecha = (progreso, id) => Boolean(progreso?.lecciones?.[id]?.completada)

/**
 * Estado de un género en el árbol:
 *  - 'dominado': pasó las tres pruebas (✓ verde).
 *  - 'abierto': se puede practicar (los de `abre` al terminar su lección: P1.2 y P1.3; los demás al dominar a sus padres).
 *  - 'leccion': sus padres están dominados, pero hace falta además una lección («Se abre con la P1.4»).
 *  - 'bloqueado': falta dominar a su padre (o a sus dos padres).
 * `domina(id)` dice si un género está dominado (progress/generos.js). En modo administrador, todo abierto.
 */
export function estadoGenero(id, { domina, progreso, admin = false }) {
  const g = GENEROS[id]
  if (domina(id)) return 'dominado'
  if (admin) return 'abierto'
  if (g.abre) return leccionHecha(progreso, g.abre) ? 'abierto' : 'bloqueado'
  if (!g.padres?.every(domina)) return 'bloqueado'
  if (g.leccion && !leccionHecha(progreso, g.leccion)) return 'leccion'
  return 'abierto'
}

/** ¿Se puede tocar y practicar? (abierto o dominado). */
export const generoAbierto = (estado) => estado === 'abierto' || estado === 'dominado'

/**
 * Las opciones de «Reconócelo»: el género, sus padres y sus hermanos (hijos de los mismos padres); en un tronco, los
 * otros troncos. Como mucho 4 (primero los padres).
 */
export function opcionesReconoce(id) {
  const g = GENEROS[id]
  const otros = g.padres
    ? [...g.padres, ...g.padres.flatMap(hijosDe)]
    : TRONCOS
  return [id, ...[...new Set(otros)].filter((x) => x !== id)].slice(0, 4)
}

/** Rondas de «Reconócelo» y cuántas hay que acertar. */
export const RONDAS_RECONOCE = 5
export const PARA_PASAR = 4

/**
 * Las 5 rondas de «Reconócelo»: el género buscado sale al menos 2 veces y cada opción al menos una (si caben), en
 * orden al azar y sin el mismo dos veces seguidas cuando se puede. `azar` para pruebas.
 */
export function rondasReconoce(id, azar = Math.random) {
  const opciones = opcionesReconoce(id)
  const lista = [id, ...opciones]
  while (lista.length < RONDAS_RECONOCE) lista.push(opciones[Math.floor(azar() * opciones.length)])
  const base = lista.slice(0, RONDAS_RECONOCE)
  let rondas = base
  // Al azar, sin el mismo dos veces seguidas (se baraja otra vez si quedan juntos; casi siempre sale a la primera).
  for (let intento = 0; intento < 40; intento++) {
    rondas = [...base]
    for (let i = rondas.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1))
      ;[rondas[i], rondas[j]] = [rondas[j], rondas[i]]
    }
    if (rondas.every((x, i) => i === 0 || x !== rondas[i - 1])) break
  }
  return rondas
}

/** De qué patrón se parte al programarlo: el de su primer padre (en un tronco, de cero). */
export const patronDePartida = (id) => (GENEROS[id].padres ? GENEROS[GENEROS[id].padres[0]].patron : {})

/** Las filas del rack para un género y sus padres (en el orden de FILAS_RACK). */
export function filasDeGenero(id) {
  const ids = [id, ...(GENEROS[id].padres ?? [])]
  return Object.keys(FILAS_RACK).filter((f) => ids.some((x) => GENEROS[x].patron[f]?.length))
}

/**
 * Los géneros que se abren al dominar este (para el destello en oro). Los que abre una lección (`abre`: el trap con la
 * P1.2; drill, jersey club y dubstep con la P1.3) no dependen del padre: no cuentan.
 */
export function seAbrenCon(id, { domina, progreso, admin = false }) {
  return hijosDe(id).filter((h) => !GENEROS[h].abre && estadoGenero(h, { domina, progreso, admin }) === 'abierto')
}
