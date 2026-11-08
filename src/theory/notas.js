// Utilidades básicas de notas (sin dependencias).
// Notación científica: C4 = Do central (MIDI 60), A4 = 440 Hz.

const SEMITONOS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const ESPANOL = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' }

/** 'C#4' -> { letra: 'C', alteracion: 1, octava: 4 } */
export function parseNota(nota) {
  const m = /^([A-G])(#|b)?(-?\d+)$/.exec(nota)
  if (!m) throw new Error(`Nota no válida: ${nota}`)
  return { letra: m[1], alteracion: m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, octava: Number(m[3]) }
}

/** Número MIDI de una nota ('C4' -> 60). */
export function midi(nota) {
  const { letra, alteracion, octava } = parseNota(nota)
  return (octava + 1) * 12 + SEMITONOS[letra] + alteracion
}

/** Frecuencia en Hz (afinación La4 = 440 Hz). */
export function frecuencia(nota) {
  return 440 * 2 ** ((midi(nota) - 69) / 12)
}

/** Nombre en español: 'C#4' -> 'Do♯4'. */
export function nombre(nota, { octava = true } = {}) {
  const { letra, alteracion, octava: o } = parseNota(nota)
  const alt = alteracion === 1 ? '♯' : alteracion === -1 ? '♭' : ''
  return `${ESPANOL[letra]}${alt}${octava ? o : ''}`
}

/** Hz redondeados para mostrar: 261.63 -> '262 Hz'. */
export function hz(valor) {
  return `${Math.round(valor)} Hz`
}

/** Positivo si `a` es más aguda que `b`, negativo si es más grave, 0 si igual. */
export function compararAltura(a, b) {
  return midi(a) - midi(b)
}
