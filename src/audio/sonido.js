// Reproduce un "sonido" tal como se describe en el contenido de las lecciones:
//   { notas: ['C4', 'E4'], modo: 'secuencia' | 'acorde', velocidad: 0.8, intervalo: 0.45 }
//   En 'secuencia', un elemento puede ser un array para tocar varias notas a la vez:
//   { notas: [['C3', 'C4'], ['E3', 'E4']] }  (melodía doblada a la octava)
//   { frecuencia: 440, duracion: 1.2 }
import { playFrequency, playNotes } from './engine.js'

/** Toca el sonido y devuelve su duración en segundos. */
export function reproducir(sonido) {
  if (sonido.frecuencia) return playFrequency(sonido.frecuencia, sonido.duracion ?? 1.2)
  return playNotes(sonido.notas, {
    modo: sonido.modo,
    velocidad: sonido.velocidad,
    duracion: sonido.duracion,
    intervalo: sonido.intervalo,
  })
}
