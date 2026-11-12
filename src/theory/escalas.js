// Escalas y grados (lección 3.3 en adelante), con Tonal.js `Scale`.
// Notación científica como en el resto de la app: 'C4' = Do central, 'F#4', 'Bb3'.
import { Note, Scale } from 'tonal'
import { nombre } from './notas.js'

/** La fórmula de la escala mayor: T T S T T T S. */
export const MAYOR = ['T', 'T', 'S', 'T', 'T', 'T', 'S']

/** Nombre de cada grado de la escala (1.º → 7.º). */
export const GRADOS = ['Tónica', 'Supertónica', 'Mediante', 'Subdominante', 'Dominante', 'Superdominante', 'Sensible']

/** Ordinal corto para frases: 1 → '1.º', 3 → '3.º'. */
export const ordinal = (n) => `${n}.º`

/**
 * Las 8 notas de una escala (de la tónica a su octava), con octava: escalaMayor('G3') → ['G3', 'A3', …, 'F#4', 'G4'].
 * `tipo` = nombre de Tonal ('major', 'minor'…). Con `bajando`, de la octava a la tónica.
 */
export function escala(tonica, tipo = 'major', { bajando = false } = {}) {
  const grado = Scale.degrees(`${tonica} ${tipo}`)
  const notas = [1, 2, 3, 4, 5, 6, 7, 8].map(grado)
  return bajando ? notas.reverse() : notas
}

export const escalaMayor = (tonica, opciones) => escala(tonica, 'major', opciones)

/** Nota del grado `n` (1–7) de la escala mayor de `tonica` (sin octava): grado('D', 7) → 'C#'. */
export function grado(tonica, n, tipo = 'major') {
  return Note.pitchClass(Scale.degrees(`${Note.pitchClass(tonica)} ${tipo}`)(n))
}

/** Las notas alteradas (♯ o ♭) de la escala mayor de `tonica`: alteraciones('D') → ['F#', 'C#']. */
export function alteraciones(tonica, tipo = 'major') {
  return Scale.get(`${Note.pitchClass(tonica)} ${tipo}`).notes.filter((n) => Note.get(n).acc)
}

/** Armadura en texto corto: 0 → '0', ['F#', 'C#'] → '2♯', ['Bb'] → '1♭'. */
export function armadura(tonica, tipo = 'major') {
  const alt = alteraciones(tonica, tipo)
  if (!alt.length) return '0'
  return `${alt.length}${Note.get(alt[0]).acc === '#' ? '♯' : '♭'}`
}

/** La escala en español, sin octava: 'Re · Mi · Fa♯ · …' (sin repetir la octava si `octava` es false). */
export function nombresEscala(tonica, { tipo = 'major', octava = false, separador = ' · ' } = {}) {
  const notas = escala(`${Note.pitchClass(tonica)}4`, tipo)
  return (octava ? notas : notas.slice(0, 7)).map((n) => nombre(n, { octava: false })).join(separador)
}

/**
 * La escala mayor con un grado cambiado (para el oído: «¿mayor u otra cosa?»).
 * cambio = { grado: 4, semitonos: 1 } sube el 4.º un semitono (también en la octava si es la tónica).
 */
export function escalaCambiada(tonica, { grado: g, semitonos = 1 }, opciones) {
  const notas = escalaMayor(tonica, opciones)
  const bajando = opciones?.bajando
  return notas.map((n, i) => {
    const num = bajando ? 8 - i : i + 1
    const deEsteGrado = num === g || (g === 1 && num === 8)
    return deEsteGrado ? Note.fromMidi(Note.midi(n) + semitonos) : n
  })
}
