// Batería: nombres de los sonidos de percusión y patrones (grooves) de ejemplo.
// En el Piano Roll y en los sonidos, una «nota» puede ser 'kick', 'snare', 'hat', 'clap' o 'click'.
import { midi } from './notas.js'

export const PERCUSION = { kick: 'Bombo', snare: 'Caja', hat: 'Hi-hat', clap: 'Palmas', click: 'Clic' }

export const esPercusion = (n) => typeof n === 'string' && n in PERCUSION

/** Clave para comparar notas: el nombre si es percusión; si no, el número MIDI (así Db4 = C#4). */
export const claveNota = (n) => (esPercusion(n) ? n : midi(n))

/**
 * Patrones de 1 compás de 4 tiempos en casillas de corchea (8 casillas, 2 por tiempo).
 * velocity opcional (0–1).
 */
export const GROOVES = {
  // Metrónomo: un clic por tiempo, el primero más fuerte.
  click: [0, 2, 4, 6].map((inicio) => ({ nota: 'click', inicio, velocity: inicio === 0 ? 1 : 0.6 })),
  // Beat básico: bombo en 1 y 3, caja en 2 y 4, hi-hat en cada corchea.
  basico: [
    ...[0, 4].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    ...[2, 6].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.85 })),
    ...Array.from({ length: 8 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 2 ? 0.45 : 0.7 })),
  ],
  // Solo bombo en cada tiempo (estilo house, «four on the floor»).
  bombo: [0, 2, 4, 6].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
}
