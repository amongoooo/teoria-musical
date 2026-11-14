// Reproduce un "sonido" tal como se describe en el contenido de las lecciones:
//   { notas: ['C4', 'E4'], modo: 'secuencia' | 'acorde', velocidad: 0.8, intervalo: 0.45 }
//   En 'secuencia', un elemento puede ser un array para tocar varias notas a la vez:
//   { notas: [['C3', 'C4'], ['E3', 'E4']] }  (melodía doblada a la octava)
//   { frecuencia: 440, duracion: 1.2 }
//   { groove: 'basico', bpm: 90, compases: 2 }   (patrón de batería de theory/bateria.js)
//   { groove: [{ nota: 'click', inicio: 0 }, …], tiempos: 3, porTiempo: 2 }  (patrón propio)
// Solo suena UNO a la vez (pedido del usuario): tocar otro sonido para el que estaba sonando (engine.js → `programar`).
import { formaGroove } from '../theory/bateria.js'
import { playFrequency, programar, toneStop } from './engine.js'

/**
 * Los eventos de un sonido: [{ t, nota, duracion, velocidad, casilla?, compas? }] (t en segundos desde que empieza;
 * en un groove, `casilla` = casilla del compás y `compas` = vuelta). Frecuencias: [].
 */
export function eventosSonido(sonido, { retraso = 0 } = {}) {
  if (sonido.groove) {
    const { bpm = 90, compases = 2 } = sonido
    const forma = formaGroove(sonido.groove, sonido)
    const paso = 60 / bpm / forma.porTiempo
    return Array.from({ length: compases }, (_, c) =>
      forma.eventos.map((e) => ({
        nota: e.nota,
        t: retraso + (e.inicio + c * forma.casillas) * paso,
        duracion: Math.max(0.1, (e.duracion ?? 1) * paso * 0.95),
        velocidad: e.velocity ?? 0.8,
        casilla: e.inicio,
        compas: c,
      })),
    ).flat()
  }
  if (!sonido.notas) return []
  const { velocidad = 0.8, duracion = 0.9, intervalo = 0.45 } = sonido
  const lista = sonido.notas.map((n) => (Array.isArray(n) ? n : [n]))
  if (sonido.modo === 'acorde') return [{ nota: lista.flat(), t: retraso, duracion, velocidad }]
  return lista.map((notas, i) => ({ nota: notas.length === 1 ? notas[0] : notas, t: retraso + i * intervalo, duracion, velocidad }))
}

/**
 * Toca el sonido (y para el que estaba sonando). Devuelve su duración en segundos.
 *  - retraso: segundos de espera antes de empezar.
 *  - alSonar(evento, i): justo cuando se oye cada nota, acorde o golpe (ver `eventosSonido`), para encenderlo.
 *  - alParar(): al terminar o al cortarlo otro sonido.
 */
export function reproducir(sonido, { retraso = 0, alSonar, alParar } = {}) {
  if (sonido.frecuencia) {
    const dur = sonido.duracion ?? 1.2
    // La onda pura también es una reproducción: la corta (y la cortan) las demás.
    programar([{ t: 0, nota: [], duracion: dur }], {
      alParar: () => {
        toneStop()
        alParar?.()
      },
    })
    playFrequency(sonido.frecuencia, dur)
    return dur
  }
  return programar(eventosSonido(sonido, { retraso }), { alSonar, alParar }).duracion
}

/** Las notas de un evento como lista (['C4'] o ['C4', 'E4']; golpes incluidos). */
export const notasDe = (evento) => (Array.isArray(evento.nota) ? evento.nota : [evento.nota])

/**
 * Llama a `onNotas(notas, i)` justo cuando suena cada nota (o grupo) del sonido, para señalarla en el
 * teclado o en las casillas mientras suena. (Sin tocarlo: para cuando el sonido ya se pidió con `reproducir`.)
 * Devuelve una función que cancela lo que quede.
 */
export function seguirNotas(sonido, onNotas, opciones) {
  if (!sonido?.notas) return () => {}
  const timers = eventosSonido(sonido, opciones).map((e, i) => setTimeout(() => onNotas(notasDe(e), i), (0.15 + e.t) * 1000))
  return () => timers.forEach(clearTimeout)
}
