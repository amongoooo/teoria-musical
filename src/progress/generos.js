// ÁRBOL DE GÉNEROS (Entrenar › Ritmo; propuesta aprobada: https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE): qué
// pruebas pasó cada género. localStorage `teoria-musical:generos:v1` = { pruebas: { rock: 5 } }, donde cada número es
// una suma de bits: 1 = Escúchalo, 2 = Reconócelo, 4 = Prográmalo (7 = dominado). Viaja con «Tu progreso» (`g`) y se
// combina con un O de bits: lo pasado en cualquier dispositivo cuenta.
import { useSyncExternalStore } from 'react'
import { GENEROS } from '../theory/rack.js'

const CLAVE = 'teoria-musical:generos:v1'

/** Las tres pruebas y su bit. */
export const PRUEBAS = { escucha: 1, reconoce: 2, programa: 4 }
export const TODAS = 7

const VACIO = { pruebas: {} }
let cache = null
const oyentes = new Set()

/** Solo géneros que existen y bits válidos. */
export function revisarGeneros(pruebas) {
  const fuera = {}
  if (!pruebas || typeof pruebas !== 'object') return fuera
  for (const [id, b] of Object.entries(pruebas)) if (GENEROS[id] && Number.isInteger(b) && b > 0) fuera[id] = b & TODAS
  return fuera
}

export function leerGeneros() {
  if (cache) return cache
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE))
    cache = { pruebas: revisarGeneros(d?.pruebas) }
  } catch {
    cache = VACIO
  }
  return cache
}

function escribir(next) {
  cache = next
  try {
    localStorage.setItem(CLAVE, JSON.stringify(next))
  } catch {
    // Sin almacenamiento (modo privado): vale mientras la app esté abierta.
  }
  oyentes.forEach((fn) => fn())
}

function subscribe(fn) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

/** Hook: { pruebas } (se vuelve a pintar al pasar una prueba). */
export const usarGeneros = () => useSyncExternalStore(subscribe, leerGeneros, leerGeneros)

/** Los bits de un género. */
export const bitsDe = (id, estado = leerGeneros()) => estado.pruebas[id] ?? 0
export const pasoPrueba = (id, prueba, estado = leerGeneros()) => Boolean(bitsDe(id, estado) & PRUEBAS[prueba])
export const dominado = (id, estado = leerGeneros()) => (bitsDe(id, estado) & TODAS) === TODAS

/** ¿Cuántos géneros hay y cuántos dominaste? */
export function cuentaGeneros(estado = leerGeneros()) {
  const ids = Object.keys(GENEROS)
  return { total: ids.length, dominados: ids.filter((id) => dominado(id, estado)).length }
}

/** Marca una prueba como pasada. Devuelve true si con ella el género quedó dominado (antes no lo estaba). */
export function marcarPrueba(id, prueba) {
  const e = leerGeneros()
  const antes = bitsDe(id, e)
  const ahora = antes | PRUEBAS[prueba]
  if (ahora === antes) return false
  escribir({ ...e, pruebas: { ...e.pruebas, [id]: ahora } })
  return ahora === TODAS && antes !== TODAS
}

/** Combina lo de dos dispositivos (O de bits). */
export function combinarGeneros(a = {}, b = {}) {
  const r = { ...revisarGeneros(a) }
  for (const [id, bits] of Object.entries(revisarGeneros(b))) r[id] = (r[id] ?? 0) | bits
  return r
}

/** Guarda lo ya combinado (importar «Tu progreso»). */
export function importarGeneros(pruebas) {
  escribir({ ...leerGeneros(), pruebas: revisarGeneros(pruebas) })
}

/** Borra todo (para las pruebas). */
export function reiniciarGeneros() {
  escribir({ pruebas: {} })
}
