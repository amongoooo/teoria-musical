// Distancias entre notas: semitonos, tonos y fórmulas de pasos (con Tonal.js).
// Notación científica como en el resto de la app: 'C4' = Do central, 'F#4', 'Bb3'.
import { Interval, Note } from 'tonal'

/** Un paso de la fórmula: 'S' = semitono (2.ª menor), 'T' = tono (2.ª mayor). */
const INTERVALO = { S: '2m', T: '2M' }
export const SEMITONOS_PASO = { S: 1, T: 2 }

/**
 * Nota a un semitono o un tono de `nota`, hacia arriba (`dir` = 1) o hacia abajo (-1).
 * Con `simplificar` (por defecto) evita nombres raros: Fa♯ − semitono = Fa (no Mi♯).
 */
export function pasoDesde(nota, paso, dir = 1, { simplificar = true } = {}) {
  const intervalo = (dir < 0 ? '-' : '') + INTERVALO[paso]
  const destino = Note.transpose(nota, intervalo)
  return simplificar ? Note.simplify(destino) : destino
}

/**
 * Aplica una fórmula de pasos desde una nota: formula('C4', ['T','T','S']) → ['C4','D4','E4','F4'].
 * Cada paso avanza una letra (2.ª), así los nombres salen como en una escala: desde Sol, Fa♯ (no Sol♭).
 */
export function formula(inicio, pasos) {
  const notas = [inicio]
  for (const p of pasos) notas.push(Note.transpose(notas[notas.length - 1], INTERVALO[p]))
  return notas
}

/** Semitonos de `a` a `b` (positivo si `b` es más aguda). */
export function semitonos(a, b) {
  return Note.midi(b) - Note.midi(a)
}

/** ¿Misma tecla? (Do♯4 y Re♭4 lo son). */
export function mismaTecla(a, b) {
  return Note.midi(a) === Note.midi(b)
}

/** Nombre de una distancia en semitonos: 1 → 'un semitono', 2 → 'un tono', 3 → 'tono y medio'… */
export function nombreDistancia(n) {
  const s = Math.abs(n)
  if (s === 0) return 'la misma nota'
  if (s === 1) return 'un semitono'
  if (s === 2) return 'un tono'
  const tonos = Math.floor(s / 2)
  const medio = s % 2 === 1
  if (tonos === 1 && medio) return 'tono y medio'
  return `${tonos} tonos${medio ? ' y medio' : ''}`
}

/** Las notas entre `a` y `b` (sin incluirlas), con sostenidos o bemoles según `b`. */
export function entre(a, b) {
  const ma = Note.midi(a)
  const mb = Note.midi(b)
  const dir = mb > ma ? 1 : -1
  const usarBemoles = Note.get(b).acc === 'b'
  const fn = usarBemoles ? Note.fromMidi : Note.fromMidiSharps
  const notas = []
  for (let m = ma + dir; m !== mb; m += dir) notas.push(fn(m))
  return notas
}

/** Intervalo de Tonal de `a` a `b` ('2m', '2M', '3m'…); útil para depurar contenido. */
export function intervalo(a, b) {
  return Interval.distance(a, b)
}
