// Registro del contenido: módulos + lecciones disponibles.
// Para añadir una lección: crea su archivo en src/content/modulo-XX/ y regístrala aquí.
import { MODULOS } from './modulos.js'
import leccion11 from './modulo-01/leccion-1-1.js'
import leccion12 from './modulo-01/leccion-1-2.js'
import leccion13 from './modulo-01/leccion-1-3.js'
import leccion14 from './modulo-01/leccion-1-4.js'
import leccion21 from './modulo-02/leccion-2-1.js'
import leccion22 from './modulo-02/leccion-2-2.js'
import leccion23 from './modulo-02/leccion-2-3.js'
import leccion24 from './modulo-02/leccion-2-4.js'
import leccion25 from './modulo-02/leccion-2-5.js'
import leccion31 from './modulo-03/leccion-3-1.js'
import leccion32 from './modulo-03/leccion-3-2.js'
import leccion33 from './modulo-03/leccion-3-3.js'

const LECCIONES = {
  [leccion11.id]: leccion11,
  [leccion12.id]: leccion12,
  [leccion13.id]: leccion13,
  [leccion14.id]: leccion14,
  [leccion21.id]: leccion21,
  [leccion22.id]: leccion22,
  [leccion23.id]: leccion23,
  [leccion24.id]: leccion24,
  [leccion25.id]: leccion25,
  [leccion31.id]: leccion31,
  [leccion32.id]: leccion32,
  [leccion33.id]: leccion33,
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

/**
 * Estado de una lección en el camino del módulo:
 *  'proximamente' (aún sin contenido) · 'hecha' · 'empezada' · 'nueva' (desbloqueada) · 'bloqueada'.
 * Desbloqueo progresivo DENTRO de cada módulo: la primera lección siempre está abierta y
 * cada una se abre al completar la anterior (o si ya se empezó). Entre módulos no se bloquea
 * (el usuario ya sabe algo de música y puede saltar al módulo que quiera).
 */
export function estadoLeccion(id, progreso) {
  if (!leccionDisponible(id)) return 'proximamente'
  const p = progreso.lecciones[id]
  if (p?.completada) return 'hecha'
  if (p?.paso > 0) return 'empezada'
  const anterior = leccionAnterior(id)
  if (!anterior || progreso.lecciones[anterior.id]?.completada) return 'nueva'
  return 'bloqueada'
}

/** La lección anterior dentro del mismo módulo (o null si es la primera). */
export function leccionAnterior(id) {
  const modulo = MODULOS.find((m) => m.lecciones.some((l) => l.id === id))
  const i = modulo?.lecciones.findIndex((l) => l.id === id) ?? -1
  return i > 0 ? modulo.lecciones[i - 1] : null
}
