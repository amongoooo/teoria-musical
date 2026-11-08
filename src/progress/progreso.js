// Progreso del usuario guardado en localStorage (sin cuentas ni servidor).
//
// Forma de los datos:
// {
//   version: 1,
//   lecciones: {
//     '1.1': { paso: 3, completada: true, fecha: '2026-11-08', aciertos: 8, total: 10 }
//   },
//   retos: {
//     '1.1': { hecho: true, fecha: '2026-11-08', nota: 'Al subir se siente…' }
//   }
// }
import { useSyncExternalStore } from 'react'

const CLAVE = 'teoria-musical:progreso:v1'
const VACIO = { version: 1, lecciones: {}, retos: {} }

let cache = null
const listeners = new Set()

function leer() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(CLAVE)
    const data = raw ? JSON.parse(raw) : null
    cache = data && typeof data === 'object' ? { ...VACIO, ...data } : VACIO
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
    // Modo privado o almacenamiento lleno: seguimos en memoria.
  }
  listeners.forEach((fn) => fn())
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

// Si el progreso cambia en otra pestaña, refrescamos.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE) return
    cache = null
    listeners.forEach((fn) => fn())
  })
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Hook: devuelve todo el progreso y se actualiza solo. */
export function useProgreso() {
  return useSyncExternalStore(subscribe, leer, leer)
}

export function getProgreso() {
  return leer()
}

export function getLeccion(id) {
  return leer().lecciones[id] ?? null
}

/** Guarda en qué paso va el usuario (para continuar donde lo dejó). */
export function guardarPaso(id, paso) {
  const p = leer()
  const actual = p.lecciones[id] ?? {}
  if (actual.paso === paso) return
  escribir({ ...p, lecciones: { ...p.lecciones, [id]: { ...actual, paso } } })
}

/** Marca una lección como completada con sus aciertos. */
export function completarLeccion(id, { aciertos = 0, total = 0 } = {}) {
  const p = leer()
  const actual = p.lecciones[id] ?? {}
  escribir({
    ...p,
    lecciones: {
      ...p.lecciones,
      [id]: { ...actual, paso: 0, completada: true, fecha: hoy(), aciertos, total },
    },
  })
}

export function estaCompletada(id) {
  return Boolean(leer().lecciones[id]?.completada)
}

export function getReto(id) {
  return leer().retos[id] ?? null
}

/** Guarda el reto de FL Studio de una lección (hecho y nota de reflexión). */
export function guardarReto(id, cambios) {
  const p = leer()
  const actual = p.retos[id] ?? {}
  const next = { ...actual, ...cambios }
  if (cambios.hecho && !actual.hecho) next.fecha = hoy()
  escribir({ ...p, retos: { ...p.retos, [id]: next } })
}

/** Borra todo el progreso (útil para pruebas). */
export function reiniciarProgreso() {
  escribir(VACIO)
}
