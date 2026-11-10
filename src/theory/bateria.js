// Batería: nombres de los sonidos de percusión y patrones (grooves) de ejemplo.
// En el Piano Roll y en los sonidos, una «nota» puede ser 'kick', 'snare', 'hat', 'clap' o 'click'.
import { midi } from './notas.js'

export const PERCUSION = { kick: 'Bombo', snare: 'Caja', hat: 'Hi-hat', clap: 'Palmas', click: 'Clic' }

export const esPercusion = (n) => typeof n === 'string' && n in PERCUSION

/** Clave para comparar notas: el nombre si es percusión; si no, el número MIDI (así Db4 = C#4). */
export const claveNota = (n) => (esPercusion(n) ? n : midi(n))

/**
 * Patrones de 1 compás en casillas (por defecto 4 tiempos × 2 casillas = corcheas).
 * Los que tienen otro compás o resolución lo dicen en FORMA. velocity opcional (0–1).
 * Las «notas» pueden ser golpes de batería o notas de piano ('C3', 'E4'…).
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

  // --- Compás de 3/4 (6 casillas) ---
  // Metrónomo en 3: «1, 2, 3».
  click3: [0, 2, 4].map((inicio) => ({ nota: 'click', inicio, velocity: inicio === 0 ? 1 : 0.6 })),
  // Batería en 3/4: bombo en el 1, caja suave en 2 y 3, hi-hat en corcheas.
  vals: [
    { nota: 'kick', inicio: 0, velocity: 0.95 },
    ...[2, 4].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.5 })),
    ...Array.from({ length: 6 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 2 ? 0.35 : 0.6 })),
  ],
  // Vals al piano: bajo en el 1 y acorde en 2 y 3 («um-pa-pa»).
  valsPiano: [
    { nota: 'C3', inicio: 0, duracion: 2, velocity: 0.9 },
    ...[2, 4].flatMap((inicio) => ['E4', 'G4'].map((nota) => ({ nota, inicio, duracion: 1.5, velocity: 0.45 }))),
  ],
  // Marcha al piano en 4/4: bajo en 1 y 3, acorde en 2 y 4 («um-pa, um-pa»).
  marchaPiano: [
    { nota: 'C3', inicio: 0, duracion: 2, velocity: 0.9 },
    { nota: 'G2', inicio: 4, duracion: 2, velocity: 0.75 },
    ...[2, 6].flatMap((inicio) => ['E4', 'G4'].map((nota) => ({ nota, inicio, duracion: 1.5, velocity: 0.45 }))),
  ],

  // --- Trap a medio tiempo (16 casillas, semicorcheas) ---
  // Caja/palmas solo en el tiempo 3; hi-hats en semicorcheas con un redoble al final.
  trap: [
    ...[0, 7, 11].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    { nota: 'snare', inicio: 8, velocity: 0.95 },
    { nota: 'clap', inicio: 8, velocity: 0.8 },
    ...Array.from({ length: 16 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 4 === 0 ? 0.65 : inicio % 2 ? 0.3 : 0.45 })),
  ],
  // El mismo trap pero con la caja en 2 y 4 (como el beat básico): suena el doble de agitado.
  trapNormal: [
    ...[0, 7, 11].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    ...[4, 12].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.95 })),
    ...[4, 12].map((inicio) => ({ nota: 'clap', inicio, velocity: 0.8 })),
    ...Array.from({ length: 16 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 4 === 0 ? 0.65 : inicio % 2 ? 0.3 : 0.45 })),
  ],
}

/** Compás y resolución de los grooves que no son 4/4 en corcheas. */
const FORMA = {
  click3: { tiempos: 3 },
  vals: { tiempos: 3 },
  valsPiano: { tiempos: 3 },
  trap: { porTiempo: 4 },
  trapNormal: { porTiempo: 4 },
}

/**
 * Forma de un groove: { eventos, tiempos, porTiempo, casillas }.
 * `groove` es un nombre de GROOVES o una lista de eventos; `tiempos` y `porTiempo`
 * (opcionales) mandan sobre los del groove.
 */
export function formaGroove(groove, { tiempos, porTiempo } = {}) {
  const base = (typeof groove === 'string' && FORMA[groove]) || {}
  const t = tiempos ?? base.tiempos ?? 4
  const p = porTiempo ?? base.porTiempo ?? 2
  return { eventos: GROOVES[groove] ?? groove, tiempos: t, porTiempo: p, casillas: t * p }
}
