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

/**
 * Cuándo suena cada nota de un sonido de notas: [{ notas: ['C4'], t }] (t en segundos desde que se pide,
 * con el mismo reparto que playNotes: 0,05 s de margen + retraso; en 'secuencia', una cada `intervalo`
 * (0,45 por defecto) y un elemento array suena a la vez; en 'acorde', todas juntas). Grooves y frecuencias: [].
 */
export function notasEnElTiempo(sonido, { retraso = 0 } = {}) {
  if (!sonido?.notas) return []
  const t0 = 0.05 + retraso
  const lista = sonido.notas.map((n) => (Array.isArray(n) ? n : [n]))
  if (sonido.modo === 'acorde') return [{ notas: lista.flat(), t: t0 }]
  return lista.map((notas, i) => ({ notas, t: t0 + i * (sonido.intervalo ?? 0.45) }))
}

/**
 * Llama a `onNotas(notas, i)` justo cuando suena cada nota (o grupo) del sonido, para señalarla en el
 * teclado o en las casillas mientras suena. Devuelve una función que cancela lo que quede.
 */
export function seguirNotas(sonido, onNotas, opciones) {
  const timers = notasEnElTiempo(sonido, opciones).map(({ notas, t }, i) => setTimeout(() => onNotas(notas, i), t * 1000))
  return () => timers.forEach(clearTimeout)
}
