// Acordes (Módulo 4): tríadas por terceras apiladas con Tonal.js (`Chord` + `Note.transpose`).
// Las notas van en notación inglesa con octava ('C4'); los nombres en español salen de theory/notas.js.
import { Chord, Key, Note, Scale } from 'tonal'
import { nombre } from './notas.js'

/**
 * Las cuatro tríadas. `tonal` = tipo de acorde de Tonal; `terceras` = semitonos de la 3.ª de abajo y la de arriba;
 * `cifrado` = lo que se escribe tras la letra (C, Cm, C°, C+).
 */
export const TRIADAS = {
  mayor: { tonal: 'M', nombre: 'mayor', terceras: [4, 3], cifrado: '', siente: 'luminoso y estable' },
  menor: { tonal: 'm', nombre: 'menor', terceras: [3, 4], cifrado: 'm', siente: 'íntimo y melancólico' },
  dis: { tonal: 'dim', nombre: 'disminuido', terceras: [3, 3], cifrado: '°', siente: 'inquieto, tenso' },
  aum: { tonal: 'aug', nombre: 'aumentado', terceras: [4, 4], cifrado: '+', siente: 'suspendido, como un sueño' },
}

/** Nombre de una 3.ª por sus semitonos. */
export const TERCERA = { 3: { corto: '3m', nombre: '3.ª menor' }, 4: { corto: '3M', nombre: '3.ª mayor' } }

/** Notas de la tríada en estado fundamental: triada('D4', 'mayor') → ['D4', 'F#4', 'A4']. */
export function triada(raiz, tipo = 'mayor') {
  const { intervals } = Chord.getChord(TRIADAS[tipo].tonal, Note.pitchClass(raiz))
  return intervals.map((iv) => Note.simplify(Note.transpose(raiz, iv)))
}

/** Arpegio (las tres de una en una) y luego las tres a la vez: para el sonido de una lección. */
export const arpegioYAcorde = (notas) => [...notas, notas]

/** «Re mayor», «Si disminuido» (sin octava). */
export function nombreAcorde(raiz, tipo = 'mayor') {
  return `${nombre(/\d/.test(raiz) ? raiz : `${raiz}4`, { octava: false })} ${TRIADAS[tipo].nombre}`
}

/** Cifrado americano: cifrado('D4', 'menor') → 'Dm'; 'F#4' mayor → 'F♯'; 'Bb3' → 'B♭'. */
export function cifrado(raiz, tipo = 'mayor') {
  const letra = Note.pitchClass(raiz).replace('#', '♯').replace(/b$/, '♭')
  return `${letra}${TRIADAS[tipo].cifrado}`
}

/** Tipo de tríada por las semitonos de sus terceras ([4, 3] → 'mayor'), o null. */
export function tipoPorTerceras(abajo, arriba) {
  return Object.keys(TRIADAS).find((t) => TRIADAS[t].terceras[0] === abajo && TRIADAS[t].terceras[1] === arriba) ?? null
}

// ——— Acordes de la tonalidad e inversiones (lecciones 4.3 y 4.4), con Tonal `Key` ———

/** Números romanos de las tríadas de una tonalidad: mayúscula = mayor, minúscula = menor, ° = disminuido. */
export const ROMANOS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
export const ROMANOS_MENOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']

/** Tipo de tríada a partir del nombre de Tonal ('Dm' → 'menor', 'Bdim' → 'dis', 'G' → 'mayor'). */
function tipoDeTonal(nombreTonal) {
  const { quality } = Chord.get(nombreTonal)
  return { Major: 'mayor', Minor: 'menor', Diminished: 'dis', Augmented: 'aum' }[quality] ?? 'mayor'
}

/**
 * Las 7 tríadas de una tonalidad (Tonal `Key`), del I al vii°: diatonicos('C4') →
 * [{ grado: 1, romano: 'I', raiz: 'C4', tipo: 'mayor', notas: ['C4', 'E4', 'G4'], cifrado: 'C' }, …, { grado: 7, romano: 'vii°', raiz: 'B4', tipo: 'dis', … }].
 * Con octava en la tónica, cada raíz sube desde ella por la escala; sin octava, se usa la 4. `menor` = la menor natural.
 */
export function diatonicos(tonica, { menor = false } = {}) {
  const tonicaOct = /\d/.test(tonica) ? tonica : `${tonica}4`
  const pc = Note.pitchClass(tonicaOct)
  const triadas = menor ? Key.minorKey(pc).natural.triads : Key.majorKey(pc).triads
  const romanos = menor ? ROMANOS_MENOR : ROMANOS
  const escala = Scale.degrees(`${tonicaOct} ${menor ? 'minor' : 'major'}`)
  return triadas.map((t, i) => {
    const raiz = Note.simplify(escala(i + 1))
    const tipo = tipoDeTonal(t)
    return { grado: i + 1, romano: romanos[i], raiz, tipo, notas: triada(raiz, tipo), cifrado: cifrado(raiz, tipo) }
  })
}

/** El acorde de un número romano en una tonalidad: acordeDeGrado('G3', 'vi') → { raiz: 'E4', tipo: 'menor', … }. */
export function acordeDeGrado(tonica, romano, opciones) {
  return diatonicos(tonica, opciones).find((a) => a.romano === romano) ?? null
}

/**
 * Inversión de un acorde: las `n` notas de abajo suben una octava.
 * inversion(['C4', 'E4', 'G4'], 1) → ['E4', 'G4', 'C5'] (1.ª: la 3.ª en el bajo); 2 → ['G4', 'C5', 'E5'] (la 5.ª en el bajo).
 */
export function inversion(notas, n = 0) {
  const k = ((n % notas.length) + notas.length) % notas.length
  return [...notas.slice(k), ...notas.slice(0, k).map((x) => Note.transpose(x, '8P'))]
}

/** Nombre de cada inversión. */
export const INVERSIONES = ['estado fundamental', '1.ª inversión', '2.ª inversión']

/** Cifrado con barra: cifradoInversion('C4', 'mayor', 1) → 'C/E'; con 0, 'C'. */
export function cifradoInversion(raiz, tipo = 'mayor', n = 0) {
  if (!n) return cifrado(raiz, tipo)
  const bajo = Note.pitchClass(triada(raiz, tipo)[n]).replace('#', '♯').replace(/b$/, '♭')
  return `${cifrado(raiz, tipo)}/${bajo}`
}

/** Nombre corto de los intervalos que se apilan en un acorde (por semitonos): 3 → '3m', 4 → '3M', 5 → '4J'. */
export const APILADO = { 3: { corto: '3m', nombre: '3.ª menor' }, 4: { corto: '3M', nombre: '3.ª mayor' }, 5: { corto: '4J', nombre: '4.ª justa' }, 6: { corto: '4A', nombre: '4.ª aumentada' } }
