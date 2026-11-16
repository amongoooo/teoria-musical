// Registro del contenido: módulos + lecciones disponibles.
// Para añadir una lección: crea su archivo en src/content/modulo-XX/ y regístrala aquí.
import { getOpciones } from '../progress/opciones.js'
import { AREAS_CONOCIMIENTO } from './areas.js'
import { infoLeccion } from './catalogo.js'
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
import leccion36 from './modulo-03/leccion-3-6.js'
import leccion37 from './modulo-03/leccion-3-7.js'
import leccion41 from './modulo-04/leccion-4-1.js'
import leccion42 from './modulo-04/leccion-4-2.js'
import leccion43 from './modulo-04/leccion-4-3.js'
import leccion44 from './modulo-04/leccion-4-4.js'
import leccion45 from './modulo-04/leccion-4-5.js'
import leccion51 from './modulo-05/leccion-5-1.js'
// Lecciones de la ruta de letras: llevan `ruta: 'letras'` y también `modulo: 11` (el Módulo de Letras).
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
  [leccion36.id]: leccion36,
  [leccion37.id]: leccion37,
  [leccion41.id]: leccion41,
  [leccion42.id]: leccion42,
  [leccion43.id]: leccion43,
  [leccion44.id]: leccion44,
  [leccion45.id]: leccion45,
  [leccion51.id]: leccion51,
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

// ---------------------------------------------------------------------------
// NÚMEROS POR ÁREA (pedido del usuario, 2026-11-16). Por dentro nada cambia (`numero` 1–11 y los ids '4.1', 'L3' de
// las lecciones, que usan las URLs y el progreso); lo que se VE es el número del módulo dentro de su área
// («Armonía 2») y el código de cada lección con la inicial del área («A2.1»). Dentro del camino de un módulo, las
// islas muestran solo su posición (1, 2, 3…): el color ya dice el área.
// ---------------------------------------------------------------------------

/** Inicial de cada área en los códigos de lección: M Melodía, R Ritmo, A Armonía, L Letras, P Producción. */
export const LETRA_AREA = { melodia: 'M', ritmo: 'R', armonia: 'A', letras: 'L', produccion: 'P' }

/** Los módulos en el orden de las áreas (Ritmo, Melodía, Armonía, Letras, Producción) y, dentro, por número. */
export const MODULOS_POR_AREA = Object.keys(AREAS_CONOCIMIENTO).flatMap((a) => MODULOS.filter((m) => m.area === a))

/** El número de un módulo dentro de su área (Acordes, el 4 de antes, es Armonía 1). Con un módulo de ruta o bloque, su `numero`. */
export function numeroEnArea(m) {
  if (!MODULOS.includes(m)) return m?.numero
  return MODULOS.filter((x) => x.area === m.area).indexOf(m) + 1
}

/** Cómo se llama un módulo: «Armonía 2» (o el `nombre` de una ruta o un bloque presentados como módulo). */
export const nombreModulo = (m) => m?.nombre ?? `${AREAS_CONOCIMIENTO[m?.area]?.nombre ?? 'Módulo'} ${numeroEnArea(m)}`

/** El módulo al que pertenece una lección (o null). */
export const moduloDeLeccion = (id) => MODULOS.find((m) => m.lecciones.some((l) => l.id === id)) ?? null

/** La posición de una lección dentro de su módulo: 1, 2, 3… (o null). */
export function posicionLeccion(id) {
  const m = moduloDeLeccion(id)
  return m ? m.lecciones.findIndex((l) => l.id === id) + 1 : null
}

/** El código que se VE de una lección fuera de su módulo: '5.1' → 'A2.1', 'L3' → 'L1.3' (si no está en un módulo, su id). */
export function codigoLeccion(id) {
  const m = moduloDeLeccion(id)
  return m ? `${LETRA_AREA[m.area]}${numeroEnArea(m)}.${posicionLeccion(id)}` : String(id)
}

/**
 * El módulo de al lado (dir = 1 o -1) para deslizar entre módulos, en el orden por área: el siguiente CON lecciones,
 * saltando los que aún no tienen. null si no hay más.
 */
export function moduloVecino(numero, dir) {
  const i = MODULOS_POR_AREA.findIndex((m) => m.numero === Number(numero))
  for (let j = i + dir; j >= 0 && j < MODULOS_POR_AREA.length; j += dir) if (moduloDisponible(MODULOS_POR_AREA[j])) return MODULOS_POR_AREA[j]
  return null
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

/**
 * PRERREQUISITOS SUAVES (content/catalogo.js): los directos de una lección que existen y aún no están hechos
 * (una saltada con «¿Ya lo sabes?» cuenta como hecha). Lista de ids; vacía si no falta nada.
 */
export function faltanRequisitos(id, progreso) {
  return (infoLeccion(id)?.requiere ?? []).filter((r) => leccionDisponible(r) && !progreso.lecciones[r]?.completada)
}
