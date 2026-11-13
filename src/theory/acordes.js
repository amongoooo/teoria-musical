// Acordes (Módulo 4): tríadas por terceras apiladas con Tonal.js (`Chord` + `Note.transpose`).
// Las notas van en notación inglesa con octava ('C4'); los nombres en español salen de theory/notas.js.
import { Chord, Note } from 'tonal'
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
