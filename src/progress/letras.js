// Cuaderno de letras (entrenamiento de letras): las letras que pegas o escribes, solo en este dispositivo
// (`teoria-musical:letras:v1`; no viajan en el código de «Tu progreso»).
// { version: 1, letras: [{ id, titulo, texto, creada, editada }] }  (editada/creada = Date.now())
import { useSyncExternalStore } from 'react'

const CLAVE = 'teoria-musical:letras:v1'
const VACIO = { version: 1, letras: [] }
let cache = null
const oyentes = new Set()

function leer() {
  if (cache) return cache
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    cache = d && Array.isArray(d.letras) ? { ...VACIO, ...d } : VACIO
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
    // Modo privado o sin espacio: sigue en memoria.
  }
  oyentes.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE) return
    cache = null
    oyentes.forEach((fn) => fn())
  })
}

const suscribir = (fn) => {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

/** Hook: { letras } (la más reciente primero). */
export function useCuaderno() {
  return useSyncExternalStore(suscribir, leer, leer)
}

export function getLetra(id) {
  return leer().letras.find((l) => l.id === id) ?? null
}

/** Crea una letra y devuelve su id. */
export function nuevaLetra({ titulo = '', texto = '' } = {}) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const ahora = Date.now()
  escribir({ ...leer(), letras: [{ id, titulo, texto, creada: ahora, editada: ahora }, ...leer().letras] })
  return id
}

export function guardarLetra(id, cambios) {
  const e = leer()
  const letras = e.letras.map((l) => (l.id === id ? { ...l, ...cambios, editada: Date.now() } : l))
  // La que se edita sube arriba.
  letras.sort((a, b) => b.editada - a.editada)
  escribir({ ...e, letras })
}

export function borrarLetra(id) {
  const e = leer()
  escribir({ ...e, letras: e.letras.filter((l) => l.id !== id) })
}

/** Título que se muestra: el escrito o, si no hay, el primer verso. */
export function tituloDe(letra) {
  return letra.titulo?.trim() || letra.texto.split('\n').find((v) => v.trim())?.trim() || 'Sin título'
}
