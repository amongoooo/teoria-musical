// Estadísticas y racha del Entrenamiento de ritmo: misma forma que el de oído (entrenamiento.js), datos aparte.
import { crearEntrenamiento } from './entrenamiento.js'

export const tiendaRitmo = crearEntrenamiento('teoria-musical:ritmo:v1')

// ---------------------------------------------------------------------------
// Retraso del dispositivo (teléfono, auriculares bluetooth): si los toques caen todos igual de desplazados, se toma
// como retraso y se descuenta. Vive solo en memoria (depende de por dónde suena HOY), compartido por los dos modos.
// ---------------------------------------------------------------------------

/** Retraso máximo que se compensa solo (segundos). */
const MAX_AJUSTE = 0.2
const MUESTRAS = 6

let compensacion = 0
let ultimos = []

export function compensacionActual() {
  return compensacion
}

/**
 * Apunta el error bruto de un toque (segundos respecto a su golpe, sin compensar) y devuelve la compensación, que
 * cambia cuando los últimos 6 toques caen juntos (`margen` marca cuánto de juntos y cuánto de lejos del centro).
 */
export function apuntarError(bruto, margen) {
  ultimos = [...ultimos, bruto].slice(-MUESTRAS)
  if (ultimos.length < MUESTRAS) return compensacion
  const orden = [...ultimos].sort((a, b) => a - b)
  const mediana = (orden[MUESTRAS / 2 - 1] + orden[MUESTRAS / 2]) / 2
  const juntos = orden[MUESTRAS - 1] - orden[0] < Math.min(0.15, Math.max(0.08, margen * 1.5))
  const lejos = Math.abs(mediana - compensacion) > Math.max(0.025, margen * 0.6)
  if (juntos && lejos && Math.abs(mediana) <= MAX_AJUSTE) compensacion = mediana
  return compensacion
}
