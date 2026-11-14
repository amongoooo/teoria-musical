// Distancias entre notas: semitonos, tonos y fórmulas de pasos (con Tonal.js).
// Notación científica como en el resto de la app: 'C4' = Do central, 'F#4', 'Bb3'.
import { Interval, Note } from 'tonal'

/**
 * Un paso de la fórmula: 'S' = semitono (2.ª menor), 'T' = tono (2.ª mayor),
 * 'T½' = tono y medio (3.ª menor, 3 semitonos: el salto de las pentatónicas, 3.6; avanza dos letras: Mi → Sol).
 */
const INTERVALO = { S: '2m', T: '2M', 'T½': '3m' }
export const SEMITONOS_PASO = { S: 1, T: 2, 'T½': 3 }

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

// ——— Intervalos con nombre (lección 3.2) ———
// Los `id` son los nombres de Tonal: número + calidad (m = menor, M = mayor, P = justa, A = aumentada).
// El tritono es la 4.ª aumentada ('4A'): 6 semitonos = 3 tonos.

/** Los intervalos simples, de la 2.ª menor a la octava, con su nombre en español. */
export const INTERVALOS = [
  { id: '2m', nombre: '2.ª menor', corto: '2.ª m' },
  { id: '2M', nombre: '2.ª mayor', corto: '2.ª M' },
  { id: '3m', nombre: '3.ª menor', corto: '3.ª m' },
  { id: '3M', nombre: '3.ª mayor', corto: '3.ª M' },
  { id: '4P', nombre: '4.ª justa', corto: '4.ª J' },
  { id: '4A', nombre: 'Tritono', corto: 'Tritono' },
  { id: '5P', nombre: '5.ª justa', corto: '5.ª J' },
  { id: '6m', nombre: '6.ª menor', corto: '6.ª m' },
  { id: '6M', nombre: '6.ª mayor', corto: '6.ª M' },
  { id: '7m', nombre: '7.ª menor', corto: '7.ª m' },
  { id: '7M', nombre: '7.ª mayor', corto: '7.ª M' },
  { id: '8P', nombre: 'Octava', corto: 'Octava' },
].map((i) => ({ ...i, semitonos: Interval.get(i.id).semitones }))

const POR_ID = Object.fromEntries(INTERVALOS.map((i) => [i.id, i]))
const POR_SEMITONOS = Object.fromEntries(INTERVALOS.map((i) => [i.semitonos, i]))

/** Datos de un intervalo por su id de Tonal ('3M') o por sus semitonos (4). */
export function datosIntervalo(idOSemitonos) {
  if (typeof idOSemitonos === 'number') return POR_SEMITONOS[Math.abs(idOSemitonos)] ?? null
  return POR_ID[idOSemitonos] ?? null
}

/** Nombre en español: '3M' → '3.ª mayor'; también con semitonos (4 → '3.ª mayor', 0 → 'unísono'). */
export function nombreIntervalo(idOSemitonos) {
  if (idOSemitonos === 0) return 'unísono'
  return datosIntervalo(idOSemitonos)?.nombre ?? `${Math.abs(idOSemitonos)} semitonos`
}

/** Con artículo, para frases: 'una 3.ª mayor', 'un tritono', 'una octava'. */
export function conArticulo(idOSemitonos) {
  const n = nombreIntervalo(idOSemitonos)
  return `${n === 'Tritono' ? 'un' : 'una'} ${n.charAt(0).toLowerCase()}${n.slice(1)}`
}

/**
 * Nota a un intervalo de `nota`, hacia arriba (`dir` = 1) o hacia abajo (-1): notaIntervalo('D4', '3M') → 'F#4'.
 * Simplifica los nombres raros (Si + tritono = Mi♯ → Fa).
 */
export function notaIntervalo(nota, id, dir = 1) {
  return Note.simplify(Note.transpose(nota, (dir < 0 ? '-' : '') + id))
}
