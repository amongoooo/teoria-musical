// Escalas y grados (lección 3.3 en adelante), con Tonal.js `Scale`.
// Notación científica como en el resto de la app: 'C4' = Do central, 'F#4', 'Bb3'.
import { Key, Note, Scale } from 'tonal'
import { nombre } from './notas.js'

/** La fórmula de la escala mayor: T T S T T T S. */
export const MAYOR = ['T', 'T', 'S', 'T', 'T', 'T', 'S']

/** La fórmula de la escala menor natural: T S T T S T T (la mayor empezada en su 6.º grado). */
export const MENOR = ['T', 'S', 'T', 'T', 'S', 'T', 'T']

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
export const escalaMenor = (tonica, opciones) => escala(tonica, 'minor', opciones)

/** Tónica de la relativa menor de una mayor (su 6.º grado), sin octava: relativaMenor('G') → 'E'. */
export const relativaMenor = (tonica) => grado(tonica, 6)

/** Tónica de la relativa mayor de una menor (su 3.er grado), sin octava: relativaMayor('D') → 'F'. */
export const relativaMayor = (tonica) => grado(tonica, 3, 'minor')

/**
 * Melodía con grados de una escala (con octava): melodia('C4', [5, 6, 7, 8]) → ['G4', 'A4', 'B4', 'C5'].
 * 8 = la tónica una octava arriba; 0 o negativos bajan de la tónica (0 = 7.º de abajo, −1 = 6.º de abajo…).
 */
export function melodia(tonica, grados, tipo = 'major') {
  const grado = Scale.degrees(`${tonica} ${tipo}`)
  return grados.map((n) => grado(n > 0 ? n : n - 1))
}

/** Nota del grado `n` (1–7) de la escala de `tonica` (mayor si no se dice `tipo`) (sin octava): grado('D', 7) → 'C#'. */
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

// ——— Tonalidad y círculo de quintas (lección 3.5), con Tonal `Key` ———

/**
 * Las 12 tonalidades mayores del círculo de quintas, en el sentido del reloj desde Do (arriba):
 * cada una, una 5.ª justa por encima de la anterior. Abajo se encuentran los dos lados: Fa♯ = Sol♭.
 * El lado izquierdo se escribe con bemoles (Re♭, La♭, Mi♭, Si♭, Fa), como se usa en la práctica.
 */
export const CIRCULO = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

/** Armadura de una mayor con Tonal `Key`: { cantidad: 3, signo: '♯', notas: ['F#', 'C#', 'G#'] } (en el orden en que aparecen). */
export function armaduraMayor(tonica) {
  const k = Key.majorKey(Note.pitchClass(tonica))
  const cantidad = Math.abs(k.alteration)
  const signo = k.alteration > 0 ? '♯' : k.alteration < 0 ? '♭' : ''
  // Orden de los sostenidos (Fa Do Sol Re La Mi Si) y de los bemoles (Si Mi La Re Sol Do Fa).
  const orden = k.alteration >= 0 ? ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'] : ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']
  return { cantidad, signo, notas: orden.slice(0, cantidad) }
}

/** Dominante (5.º) y subdominante (4.º) de una mayor: las dos vecinas en el círculo. */
export const dominante = (tonica) => grado(tonica, 5)
export const subdominante = (tonica) => grado(tonica, 4)

/**
 * Las mismas notas «pasadas» a la armadura de otra mayor: cada letra toma la alteración que tiene en esa escala,
 * sin moverse de su sitio. conArmadura(['C4', 'F4', 'G4'], 'G') → ['C4', 'F#4', 'G4'] (en Sol mayor solo cambia el Fa).
 */
export function conArmadura(notas, tonica) {
  const escalaDestino = Scale.get(`${Note.pitchClass(tonica)} major`).notes
  return notas.map((n) => {
    const { letter, oct } = Note.get(n)
    const destino = escalaDestino.find((d) => d[0] === letter)
    return `${destino}${oct}`
  })
}

// ——— Explorador del círculo de quintas (#/circulo) ———

/** Las 7 notas (sin octava) de una tonalidad: notasTonalidad('G') → ['G', 'A', 'B', 'C', 'D', 'E', 'F#']. */
export const notasTonalidad = (tonica, menor = false) => Scale.get(`${Note.pitchClass(tonica)} ${menor ? 'minor' : 'major'}`).notes

/**
 * Qué notas cambian al pasar de una escala a otra (por sonido, no por nombre: Fa♯ = Sol♭).
 * notasQueCambian(notas de Do, notas de Sol) → { salen: ['F'], entran: ['F#'] }. Entre vecinas del círculo,
 * una sola: a la dominante sube el 4.º grado medio tono; a la subdominante baja el 7.º.
 */
export function notasQueCambian(de, a) {
  const cromaA = a.map(Note.chroma)
  const cromaDe = de.map(Note.chroma)
  return { salen: de.filter((n) => !cromaA.includes(Note.chroma(n))), entran: a.filter((n) => !cromaDe.includes(Note.chroma(n))) }
}
