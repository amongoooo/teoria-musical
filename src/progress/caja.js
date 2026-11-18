// Caja de ritmos (#/caja): recuerda el patrón, el tempo y el swing (solo en este dispositivo; no viaja con «Tu progreso»).
import { FILAS_CAJA, PATRONES, normalizar } from '../theory/rack.js'

const CLAVE = 'teoria-musical:caja:v1'

/** { patron, bpm, swing } guardados; el boom bap de la P1.1 a 90 BPM si no hay nada. */
export function leerCaja() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE))
    if (d?.patron) return { patron: normalizar(d.patron, FILAS_CAJA), bpm: Number(d.bpm) || 90, swing: Math.max(0, Math.min(1, Number(d.swing) || 0)) }
  } catch {
    // Sin almacenamiento: empieza con el ejemplo.
  }
  return { patron: normalizar(PATRONES.boomBap, FILAS_CAJA), bpm: 90, swing: 0 }
}

export function guardarCaja(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // Sin almacenamiento (modo privado): se pierde al salir.
  }
}
