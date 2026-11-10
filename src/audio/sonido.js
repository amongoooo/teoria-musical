// Reproduce un "sonido" tal como se describe en el contenido de las lecciones:
//   { notas: ['C4', 'E4'], modo: 'secuencia' | 'acorde', velocidad: 0.8, intervalo: 0.45 }
//   En 'secuencia', un elemento puede ser un array para tocar varias notas a la vez:
//   { notas: [['C3', 'C4'], ['E3', 'E4']] }  (melodía doblada a la octava)
//   { frecuencia: 440, duracion: 1.2 }
//   { groove: 'basico', bpm: 90, compases: 2 }   (patrón de batería de theory/bateria.js)
//   { groove: [{ nota: 'click', inicio: 0 }, …], tiempos: 3, porTiempo: 2 }  (patrón propio)
// `retraso` (segundos) en el segundo argumento retrasa el inicio.
import { formaGroove } from '../theory/bateria.js'
import { playFrequency, playNotes, playPattern } from './engine.js'

/** Toca el sonido y devuelve su duración en segundos. */
export function reproducir(sonido, { retraso = 0 } = {}) {
  if (sonido.groove) return tocarGroove(sonido)
  if (sonido.frecuencia) return playFrequency(sonido.frecuencia, sonido.duracion ?? 1.2)
  return playNotes(sonido.notas, {
    modo: sonido.modo,
    velocidad: sonido.velocidad,
    duracion: sonido.duracion,
    intervalo: sonido.intervalo,
    retraso,
  })
}

/** Toca `compases` vueltas de un groove a `bpm`. */
function tocarGroove({ groove, bpm = 90, compases = 2, tiempos, porTiempo }) {
  const forma = formaGroove(groove, { tiempos, porTiempo })
  const todos = Array.from({ length: compases }, (_, c) => forma.eventos.map((e) => ({ ...e, inicio: e.inicio + c * forma.casillas }))).flat()
  return playPattern(todos, { paso: 60 / bpm / forma.porTiempo })
}
