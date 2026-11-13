// Vocabulario para letras (Parte 3 del plan «Ritmo y Letras»): lista curada por temas, escrita para la app.
// Cada palabra: { p, t, g, d, v, s, tema } (ver noche.js). Para sumar un tema: crea su archivo con 30 palabras y
// añádelo a TEMAS (id, nombre, color de rima para su ficha).
import amor from './amor.js'
import calle from './calle.js'
import dinero from './dinero.js'
import noche from './noche.js'

export const TEMAS = [
  { id: 'noche', nombre: 'Noche', palabras: noche },
  { id: 'calle', nombre: 'Calle', palabras: calle },
  { id: 'amor', nombre: 'Amor y desamor', palabras: amor },
  { id: 'dinero', nombre: 'Dinero', palabras: dinero },
]

/** Todas las palabras, cada una con su tema. */
export const VOCABULARIO = TEMAS.flatMap((t) => t.palabras.map((w) => ({ ...w, tema: t.id })))

const POR_PALABRA = new Map(VOCABULARIO.map((w) => [w.p, w]))

export function getPalabra(p) {
  return POR_PALABRA.get(p) ?? null
}

export function getTema(id) {
  return TEMAS.find((t) => t.id === id) ?? null
}

const TIPOS = { s: 'sustantivo', v: 'verbo', a: 'adjetivo' }
/** «sustantivo femenino», «verbo», «adjetivo». */
export function tipoDe(w) {
  if (w.t === 's') return `${TIPOS.s} ${w.g === 'f' ? 'femenino' : 'masculino'}`
  return TIPOS[w.t] ?? ''
}

/** Busca la palabra dentro del verso (sin importar mayúsculas): { antes, palabra, despues } o null. */
export function partirVerso(w) {
  const i = w.v.toLowerCase().indexOf(w.p.toLowerCase())
  if (i < 0) return null
  return { antes: w.v.slice(0, i), palabra: w.v.slice(i, i + w.p.length), despues: w.v.slice(i + w.p.length) }
}
