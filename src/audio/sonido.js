// Reproduce un "sonido" tal como se describe en el contenido de las lecciones:
//   { notas: ['C4', 'E4'], modo: 'secuencia' | 'acorde', velocidad: 0.8 }
//   { frecuencia: 440, duracion: 1.2 }
import { playFrequency, playNotes } from './engine.js'

/** Toca el sonido y devuelve su duración en segundos. */
export function reproducir(sonido) {
  if (sonido.frecuencia) return playFrequency(sonido.frecuencia, sonido.duracion ?? 1.2)
  return playNotes(sonido.notas, {
    modo: sonido.modo,
    velocidad: sonido.velocidad,
    duracion: sonido.duracion,
  })
}
