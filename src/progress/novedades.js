// Qué novedades ya vio el usuario (botón ⓘ de Inicio): solo en este dispositivo.
import { useCallback, useSyncExternalStore } from 'react'
import { NOVEDADES } from '../content/novedades.js'

const CLAVE = 'teoria-musical:novedades:v1'
const oyentes = new Set()

function leerVisto() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE))?.visto ?? null
  } catch {
    return null
  }
}

/** ¿Hay una novedad que aún no se abrió? */
export function hayNovedad() {
  return Boolean(NOVEDADES[0]) && leerVisto() !== NOVEDADES[0].id
}

/** Marca como vista la más reciente. */
export function marcarVistas() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ visto: NOVEDADES[0]?.id ?? null }))
  } catch {
    // Sin almacenamiento: el puntito puede volver a salir; no pasa nada.
  }
  oyentes.forEach((f) => f())
}

const suscribir = (f) => {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

/** [hay novedad sin ver, marcar como vistas]. */
export function useNovedades() {
  const nueva = useSyncExternalStore(suscribir, hayNovedad, () => false)
  return [nueva, useCallback(marcarVistas, [])]
}
