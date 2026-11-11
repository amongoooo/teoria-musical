// Estadísticas y racha del Entrenamiento de oído, en localStorage.
//
// Forma de los datos:
// {
//   version: 1,
//   dias: { '2026-11-10': { segundos: 312, respuestas: 40, aciertos: 31 } },
//   mejorRacha: 5,
//   modos: {
//     intervalos: {
//       nivel: 3, nivelMax: 3, ventana: [true, false, …],   // últimas respuestas en el nivel actual
//       aciertos: 80, total: 100, racha: 4, mejorRacha: 12,  // racha = aciertos seguidos
//       items: { '3M': { a: 20, t: 24 } },
//       ajustes: { direccion: 'sube' }
//     }
//   }
// }
import { useSyncExternalStore } from 'react'

const CLAVE = 'teoria-musical:oido:v1'
const VACIO = { version: 1, dias: {}, mejorRacha: 0, modos: {} }

/** Minutos diarios recomendados. */
export const META_SEGUNDOS = 5 * 60
/** Para subir de nivel: ACIERTOS_PARA_SUBIR de las últimas TAMANO_VENTANA respuestas. */
export const TAMANO_VENTANA = 10
export const ACIERTOS_PARA_SUBIR = 8
/** Tiempo máximo que cuenta por respuesta (si te distraes, no suma de más). */
const MAX_SEGUNDOS_POR_RESPUESTA = 25
const DIAS_GUARDADOS = 120

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

/** Hook: todo el estado del entrenamiento de oído. */
export function useOido() {
  return useSyncExternalStore(subscribe, leer, leer)
}

// Fecha LOCAL (no UTC): la racha cambia a medianoche del usuario.
function fecha(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

export function hoy() {
  return fecha()
}

function diaAnterior(f) {
  const [y, m, d] = f.split('-').map(Number)
  return fecha(new Date(y, m - 1, d - 1))
}

/** Datos de hoy: { segundos, respuestas, aciertos }. */
export function datosDeHoy(estado = leer()) {
  return estado.dias[hoy()] ?? { segundos: 0, respuestas: 0, aciertos: 0 }
}

/**
 * Racha: días seguidos con práctica (al menos una respuesta). Si hoy aún no
 * practicaste, la racha de ayer sigue viva hasta medianoche.
 */
export function rachaActual(estado = leer()) {
  let dia = hoy()
  if (!estado.dias[dia]?.respuestas) dia = diaAnterior(dia)
  let n = 0
  while (estado.dias[dia]?.respuestas) {
    n++
    dia = diaAnterior(dia)
  }
  return n
}

/** Los últimos `n` días (del más antiguo a hoy) con sus datos. */
export function ultimosDias(n = 7, estado = leer()) {
  const lista = []
  let dia = hoy()
  for (let i = 0; i < n; i++) {
    lista.unshift({ fecha: dia, ...(estado.dias[dia] ?? { segundos: 0, respuestas: 0, aciertos: 0 }) })
    dia = diaAnterior(dia)
  }
  return lista
}

const MODO_VACIO = { nivel: 1, nivelMax: 1, ventana: [], aciertos: 0, total: 0, racha: 0, mejorRacha: 0, items: {}, ajustes: {} }

export function datosModo(id, estado = leer()) {
  return { ...MODO_VACIO, ...(estado.modos[id] ?? {}) }
}

function guardarModo(id, cambios) {
  const e = leer()
  escribir({ ...e, modos: { ...e.modos, [id]: { ...datosModo(id, e), ...cambios } } })
}

/** Elegir nivel a mano (solo hasta el máximo alcanzado). Reinicia la ventana. */
export function elegirNivel(id, nivel) {
  const m = datosModo(id)
  guardarModo(id, { nivel: Math.max(1, Math.min(nivel, m.nivelMax)), ventana: [] })
}

export function guardarAjustes(id, ajustes) {
  guardarModo(id, { ajustes: { ...datosModo(id).ajustes, ...ajustes } })
}

// Reloj de práctica: cuenta el tiempo entre respuestas (con tope).
let ultimoEvento = null

/** Llamar al empezar una sesión de práctica. */
export function empezarSesion() {
  ultimoEvento = Date.now()
}

/**
 * Registra una respuesta. Devuelve { subio, nuevoNivel, metaCumplida }:
 *  - subio: true si con esta respuesta se pasa al siguiente nivel
 *  - metaCumplida: true si con esta respuesta se llega a los 5 minutos de hoy
 */
export function registrarRespuesta(id, { item, bien, niveles }) {
  const e = leer()
  const m = datosModo(id, e)
  const ahora = Date.now()
  const segundos = ultimoEvento ? Math.min((ahora - ultimoEvento) / 1000, MAX_SEGUNDOS_POR_RESPUESTA) : 5
  ultimoEvento = ahora

  // Día
  const f = hoy()
  const dia = e.dias[f] ?? { segundos: 0, respuestas: 0, aciertos: 0 }
  const nuevoDia = {
    segundos: Math.round((dia.segundos + segundos) * 10) / 10,
    respuestas: dia.respuestas + 1,
    aciertos: dia.aciertos + (bien ? 1 : 0),
  }
  const metaCumplida = dia.segundos < META_SEGUNDOS && nuevoDia.segundos >= META_SEGUNDOS
  const dias = { ...e.dias, [f]: nuevoDia }
  const fechas = Object.keys(dias).sort()
  fechas.slice(0, Math.max(0, fechas.length - DIAS_GUARDADOS)).forEach((k) => delete dias[k])

  // Modo
  const ventana = [...m.ventana, bien].slice(-TAMANO_VENTANA)
  const racha = bien ? m.racha + 1 : 0
  const it = m.items[item] ?? { a: 0, t: 0 }
  let nivel = m.nivel
  let subio = false
  if (nivel < niveles && ventana.filter(Boolean).length >= ACIERTOS_PARA_SUBIR) {
    nivel += 1
    subio = true
  }
  const modo = {
    ...m,
    nivel,
    nivelMax: Math.max(m.nivelMax, nivel),
    ventana: subio ? [] : ventana,
    aciertos: m.aciertos + (bien ? 1 : 0),
    total: m.total + 1,
    racha,
    mejorRacha: Math.max(m.mejorRacha, racha),
    items: { ...m.items, [item]: { a: it.a + (bien ? 1 : 0), t: it.t + 1 } },
  }

  const next = { ...e, dias, modos: { ...e.modos, [id]: modo } }
  next.mejorRacha = Math.max(e.mejorRacha ?? 0, rachaActual(next))
  escribir(next)
  return { subio, nuevoNivel: nivel, metaCumplida }
}

export function getOido() {
  return leer()
}

/** Reemplaza todo el estado de oído (lo usa la importación, ya combinado). */
export function importarOido(datos) {
  const next = { ...VACIO, ...datos, version: 1 }
  next.mejorRacha = Math.max(next.mejorRacha ?? 0, rachaActual(next))
  escribir(next)
}

/** Borra todas las estadísticas de oído. */
export function reiniciarOido() {
  escribir(VACIO)
}
