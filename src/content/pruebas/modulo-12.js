// Prueba rápida «¿Ya lo sabes?» · banco de Producción 1 (módulo 12, «Beats en FL Studio»).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).
import { CORCHEAS, GENEROS, SEMICORCHEAS, sinFila, sonidoGenero, sonidoRack } from '../../theory/rack.js'

const BOOM_BAP = { kick: [0, 7, 10], clap: [4, 12], hat: CORCHEAS, tom: [14] }
const POP = { kick: [0, 8], clap: [4, 12], hat: CORCHEAS }
const beat = (patron, etiqueta) => sonidoRack(patron, { bpm: 90, compases: 2, etiqueta })
/** El trap de la P1.3 con estos rolls en los hats. */
const trapRoll = (tipoHat, etiqueta) =>
  sonidoRack({ ...GENEROS.trap.patron, hat: SEMICORCHEAS, tipo: { hat: tipoHat } }, { bpm: GENEROS.trap.bpm, compases: 2, etiqueta })

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
  ],  '12.3': [
    {
      pregunta: 'Dos trap con un roll al final del compás. **¿En cuál el roll es de 3 (tresillo)?**',
      sonidos: [trapRoll({ 14: 2, 15: 2 }), trapRoll({ 14: 3, 15: 3 })],
      mezclar: true,
      correcta: 1,
      explicacion: 'El de **3** galopa (ta-ka-ta); el de 2 suena a redoble recto.',
    },
    {
      pregunta: 'En FL Studio, ¿cómo haces un **roll de 2** (fusas) en los hats?',
      opciones: [
        'En el Piano roll del hat, con el Snap en «1/2 step»',
        'En el Channel rack, tocando dos veces el mismo paso',
        'Subiendo el tempo del proyecto al doble',
        'Con la perilla de Swing del Channel rack',
      ],
      correcta: 0,
      explicacion: 'El Channel rack no parte pasos: el roll se dibuja en el **Piano roll** con el Snap en «1/2 step» (×2) o «1/3 step» (×3).',
    },
    {
      pregunta: '¿Qué género es?',
      sonidos: [sonidoGenero('drill', { etiqueta: 'Escuchar el beat' })],
      opciones: ['Drill', 'Trap', 'Boom bap', 'Dubstep'],
      correcta: 0,
      explicacion: 'Hats en **3 + 3 + 2** con rolls de tresillo: **drill**. El trap los lleva rectos, en semicorcheas.',
    },
  ],
}
