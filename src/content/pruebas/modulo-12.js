// Prueba rápida «¿Ya lo sabes?» · banco de Producción 1 (módulo 12, «Beats en FL Studio»).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).
import { CORCHEAS, sinFila, sonidoGenero, sonidoRack } from '../../theory/rack.js'

const BOOM_BAP = { kick: [0, 7, 10], clap: [4, 12], hat: CORCHEAS, tom: [14] }
const POP = { kick: [0, 8], clap: [4, 12], hat: CORCHEAS }
const beat = (patron, etiqueta) => sonidoRack(patron, { bpm: 90, compases: 2, etiqueta })

export default {
  '12.1': [
    {
      pregunta: 'Primero el beat entero y luego con un hueco. **¿Qué le falta?**',
      sonidos: [beat(BOOM_BAP, 'El beat entero'), beat(sinFila(BOOM_BAP, 'kick'), 'Con un hueco')],
      opciones: ['El bombo', 'Las palmas', 'Los hats', 'La percusión'],
      correcta: 0,
      explicacion: 'Falta el **bombo**: el beat queda flotando, sin peso abajo.',
    },
    {
      pregunta: 'En un beat, ¿qué hacen la **caja o las palmas** en el 2 y el 4?',
      opciones: ['El backbeat: el golpe donde cae la cabeza', 'El peso de abajo del beat', 'La subdivisión: cuánta energía tiene', 'El adorno: un poco de color'],
      correcta: 0,
      explicacion: 'Es el **backbeat**. El peso es del bombo, la subdivisión de los hats y el adorno de la percusión.',
    },
    {
      pregunta: 'Las mismas palmas y hats. **¿En cuál el bombo es el del boom bap?**',
      sonidos: [beat(POP), beat(BOOM_BAP)],
      mezclar: true,
      correcta: 1,
      explicacion: 'El boom bap tiene el bombo **sincopado** (el 1, justo antes del 3 y a mitad del 3); el del pop cae recto en el 1 y el 3.',
    },
  ],
  '12.2': [
    {
      pregunta: '¿Qué género es?',
      sonidos: [sonidoGenero('dembow', { etiqueta: 'Escuchar el beat' })],
      opciones: ['Dembow', 'House', 'Boom bap', 'Trap'],
      correcta: 0,
      explicacion: 'Bombo en los cuatro tiempos y la caja en **3 + 3 + 2**: **dembow**. El house tiene el mismo bombo, pero la caja (o las palmas) en 2 y 4.',
    },
    {
      pregunta: 'En el **trap** a 140 BPM, ¿dónde cae la caja?',
      opciones: ['Solo en el 3: medio tiempo', 'En el 2 y el 4, como el pop', 'En los cuatro tiempos', 'En 3 + 3 + 2'],
      correcta: 0,
      explicacion: 'Una sola caja, en el **3**: por eso el trap a 140 se siente como 70.',
    },
    {
      pregunta: 'Con el mismo kit, **¿qué cambia** del house al dembow?',
      opciones: ['La caja: pasa a 3 + 3 + 2', 'El bombo: deja los cuatro tiempos', 'Solo el tempo', 'Los hats: pasan a semicorcheas'],
      correcta: 0,
      explicacion: 'El bombo en los cuatro tiempos es **el mismo**; cambia la **caja** (y el tempo baja de ~124 a ~95).',
    },
  ],
}
