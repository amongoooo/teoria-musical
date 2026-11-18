// Caja de ritmos (#/caja): recuerda el patrón y el tempo (solo en este dispositivo; no viaja con «Tu progreso»).
import { PATRONES, normalizar } from '../theory/rack.js'

const CLAVE = 'teoria-musical:caja:v1'

/** { patron, bpm } guardados; el boom bap de la P1.1 a 90 BPM si no hay nada. */
export function leerCaja() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE))
    if (d?.patron) return { patron: normalizar(d.patron), bpm: Number(d.bpm) || 90 }
  } catch {
    // Sin almacenamiento: empieza con el ejemplo.
  }
  return { patron: normalizar(PATRONES.boomBap), bpm: 90 }
}

export function guardarCaja(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // Sin almacenamiento (modo privado): se pierde al salir.
  }
}
