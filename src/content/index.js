// Registro del contenido: módulos + lecciones disponibles.
// Para añadir una lección: crea su archivo en src/content/modulo-XX/ y regístrala aquí.
import { MODULOS } from './modulos.js'
import leccion11 from './modulo-01/leccion-1-1.js'
import leccion12 from './modulo-01/leccion-1-2.js'
import leccion13 from './modulo-01/leccion-1-3.js'
import leccion14 from './modulo-01/leccion-1-4.js'
import leccion21 from './modulo-02/leccion-2-1.js'

const LECCIONES = {
  [leccion11.id]: leccion11,
  [leccion12.id]: leccion12,
  [leccion13.id]: leccion13,
  [leccion14.id]: leccion14,
  [leccion21.id]: leccion21,
}

export { MODULOS }

export function getModulo(numero) {
  return MODULOS.find((m) => m.numero === Number(numero)) ?? null
}

/** Contenido completo de una lección (o null si aún no existe). */
export function getLeccion(id) {
  return LECCIONES[id] ?? null
}

export function leccionDisponible(id) {
  return Boolean(LECCIONES[id])
}

/** Un módulo está abierto si tiene al menos una lección disponible. */
export function moduloDisponible(modulo) {
  return modulo.lecciones.some((l) => leccionDisponible(l.id))
}

/** Lista plana de lecciones disponibles, en orden del curso. */
export function leccionesDisponibles() {
  return MODULOS.flatMap((m) => m.lecciones.filter((l) => leccionDisponible(l.id)).map((l) => ({ ...l, modulo: m })))
}
