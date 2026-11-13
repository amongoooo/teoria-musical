// Registro del contenido: módulos + lecciones disponibles.
// Para añadir una lección: crea su archivo en src/content/modulo-XX/ y regístrala aquí.
import { getOpciones } from '../progress/opciones.js'
import { MODULOS } from './modulos.js'
import { RUTAS } from './rutas.js'
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
import leccion34 from './modulo-03/leccion-3-4.js'
import leccion35 from './modulo-03/leccion-3-5.js'
import leccion41 from './modulo-04/leccion-4-1.js'
import leccion42 from './modulo-04/leccion-4-2.js'
import leccion43 from './modulo-04/leccion-4-3.js'
import leccion44 from './modulo-04/leccion-4-4.js'
// Lecciones que viven DENTRO de una ruta (no en un módulo): llevan `ruta` en lugar de `modulo`.
import letrasL1 from './ruta-letras/leccion-L1.js'
import letrasL2 from './ruta-letras/leccion-L2.js'
import letrasL3 from './ruta-letras/leccion-L3.js'
import letrasL4 from './ruta-letras/leccion-L4.js'
import letrasL5 from './ruta-letras/leccion-L5.js'

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
  [leccion34.id]: leccion34,
  [leccion35.id]: leccion35,
  [leccion41.id]: leccion41,
  [leccion42.id]: leccion42,
  [leccion43.id]: leccion43,
  [leccion44.id]: leccion44,
  [letrasL1.id]: letrasL1,
  [letrasL2.id]: letrasL2,
  [letrasL3.id]: letrasL3,
  [letrasL4.id]: letrasL4,
  [letrasL5.id]: letrasL5,
}

export { MODULOS }

export function getModulo(numero) {
  return MODULOS.find((m) => m.numero === Number(numero)) ?? null
}

/** Contenido completo de una lección (o null si aún no existe). */
export function getLeccion(id) {
  return LECCIONES[id] ?? null
}

/** Color de una lección: el de su módulo o, si vive en una ruta, el de la ruta. */
export function acentoLeccion(id) {
  const l = LECCIONES[id]
  if (l?.ruta) return RUTAS[l.ruta]?.acento
  return getModulo(l?.modulo ?? Number(String(id).split('.')[0]))?.acento
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
 * En modo administrador (Opciones → Administrador) no se bloquea ninguna: las bloqueadas pasan a 'nueva'.
 */
export function estadoLeccion(id, progreso) {
  if (!leccionDisponible(id)) return 'proximamente'
  const p = progreso.lecciones[id]
  if (p?.completada) return 'hecha'
  if (p?.paso > 0) return 'empezada'
  const anterior = leccionAnterior(id)
  if (!anterior || progreso.lecciones[anterior.id]?.completada || getOpciones().admin) return 'nueva'
  return 'bloqueada'
}

/** La lección anterior dentro del mismo módulo (o null si es la primera). */
export function leccionAnterior(id) {
  const modulo = MODULOS.find((m) => m.lecciones.some((l) => l.id === id))
  const i = modulo?.lecciones.findIndex((l) => l.id === id) ?? -1
  return i > 0 ? modulo.lecciones[i - 1] : null
}
