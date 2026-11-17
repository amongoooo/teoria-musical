// Prueba rápida «¿Ya lo sabes?» · banco del módulo 5 (Armonía funcional y progresiones).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).
import { conBeat } from '../../theory/bateria.js'

// Las mismas voces que la lección 5.1: el bajo abajo y las de arriba moviéndose poco.
const VOZ = {
  I: ['C3', 'C4', 'E4', 'G4'],
  IV: ['F3', 'C4', 'F4', 'A4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  V: ['G3', 'B3', 'D4', 'G4'],
  V7: ['G3', 'B3', 'F4', 'G4'],
  vi: ['A3', 'C4', 'E4', 'A4'],
}
// Para la 5.4: las mismas voces que la lección (bajo en la octava 2) y La menor con el V mayor (E, con Sol♯).
const VOZ_LOOP = {
  C: ['C3', 'C4', 'E4', 'G4'],
  G: ['G2', 'B3', 'D4', 'G4'],
  Am: ['A2', 'C4', 'E4', 'A4'],
  F: ['F2', 'C4', 'F4', 'A4'],
  Dm: ['D3', 'D4', 'F4', 'A4'],
  Em: ['E3', 'B3', 'E4', 'G4'],
  E: ['E3', 'B3', 'E4', 'G#4'],
}
// Para la 5.5: el ii–V–I con séptimas, con las notas guía de la lección.
const VOZ_SEPTIMAS = { Dm7: ['D3', 'C4', 'F4', 'A4'], G7: ['G2', 'B3', 'F4', 'G4'], Cmaj7: ['C3', 'B3', 'E4', 'G4'] }
const loop = (acordes) => ({ etiqueta: 'Escuchar', notas: acordes.map((a) => VOZ_LOOP[a]), intervalo: 0.85, duracion: 0.8 })
const septimas = (acordes) => ({ etiqueta: 'Escuchar', notas: acordes.map((a) => VOZ_SEPTIMAS[a]), intervalo: 0.95, duracion: 0.9 })
const dos = (a, b) => ({ notas: [a, b], modo: 'acorde', duracion: 1.4 })
// Para la 5.6: el loop de la lección sobre el beat (conBeat), un acorde por compás o dos, a tiempo o adelantado.
const VOZ_POP = [['C3', 'C4', 'E4', 'G4'], ['G2', 'B3', 'D4', 'G4'], ['A2', 'C4', 'E4', 'A4'], ['F2', 'C4', 'F4', 'A4']]
const pop = (tiempos, { veces = 1, adelanto = 0 } = {}) =>
  Array.from({ length: veces }, () => VOZ_POP.map((notas) => ({ notas, tiempos, adelanto }))).flat()
// Para la 5.7: frases en Fa y en La mayor (el bajo abajo, como en la lección).
const VOZ_57 = {
  Bb: ['Bb2', 'D4', 'F4', 'Bb4'],
  C: ['C3', 'C4', 'E4', 'G4'],
  F: ['F2', 'C4', 'F4', 'A4'],
  A: ['A2', 'C#4', 'E4', 'A4'],
  E: ['E2', 'B3', 'E4', 'G#4'],
  'F#m': ['F#2', 'C#4', 'F#4', 'A4'],
  D: ['D3', 'D4', 'F#4', 'A4'],
}
const acordes57 = (lista) => ({ etiqueta: 'Escuchar', notas: lista.map((a) => VOZ_57[a]), intervalo: 0.9, duracion: 0.85 })
const frase = (romanos) => ({ etiqueta: 'Escuchar', notas: romanos.map((rn) => VOZ[rn]), intervalo: 0.95, duracion: 0.9 })

export default {
  '5.1': [
    {
      pregunta: 'La frase se detiene. ¿En qué **función** se quedó?',
      sonidos: [frase(['I', 'vi', 'IV', 'V'])],
      opciones: ['Tónica', 'Subdominante', 'Dominante'],
      ordenFijo: true,
      correcta: 2,
      explicacion: '**C – Am – F – G**: se queda en **G**, el V. Tensión que pide volver a casa.',
    },
    {
      pregunta: 'En Do mayor, ¿qué acorde puede hacer el **trabajo de F** (el IV)?',
      opciones: ['Dm', 'G', 'Em', 'Am'],
      correcta: 0,
      explicacion: '**Dm** (Re · Fa · La) comparte Fa y La con F: los dos son de **subdominante**.',
    },
    {
      pregunta: 'En **Sol mayor**, ¿cuál es de **dominante**?',
      opciones: ['D', 'C', 'Em', 'Am'],
      correcta: 0,
      explicacion: 'El V de Sol es **D** (Re · Fa♯ · La). C y Am son de subdominante; Em, de tónica.',
    },
  ],
  '5.2': [
    {
      pregunta: 'Al resolver **G7 → C**, ¿adónde va el **Fa**?',
      opciones: ['Mi', 'Sol', 'Fa♯', 'Do'],
      correcta: 0,
      explicacion: 'Fa es la **7.ª** de G7: baja medio tono, a **Mi**. La sensible, Si, sube a Do.',
    },
    {
      pregunta: '¿Cuál es el **V7** de **Sol mayor**?',
      opciones: ['D7', 'G7', 'C7', 'A7'],
      correcta: 0,
      explicacion: 'El V de Sol es Re: **D7** = Re · Fa♯ · La · Do.',
    },
    {
      pregunta: '¿Cuál es el **tritono**?',
      sonidos: [dos('B3', 'F4'), dos('C4', 'G4'), dos('C4', 'F4')],
      correcta: 0,
      mezclar: true,
      explicacion: '**Si–Fa**: 6 semitonos, el intervalo más inestable. Do–Sol y Do–Fa suenan estables.',
    },
  ],
  '5.3': [
    {
      pregunta: '¿Qué **cadencia** cierra la frase?',
      sonidos: [frase(['I', 'IV', 'V7', 'vi'])],
      opciones: ['Auténtica', 'Plagal', 'Semicadencia', 'Rota'],
      ordenFijo: true,
      correcta: 3,
      explicacion: '**C – F – G7 – Am**: el V7 prometía C y llegó Am, el vi. Cadencia **rota**.',
    },
    {
      pregunta: '¿Cuál termina en **semicadencia**?',
      sonidos: [frase(['I', 'vi', 'ii', 'V']), frase(['I', 'vi', 'V', 'I']), frase(['I', 'vi', 'IV', 'I'])],
      correcta: 0,
      mezclar: true,
      explicacion: '**C – Am – Dm – G**: se queda en el V, como una coma. Las otras llegan a casa (auténtica y plagal).',
    },
    {
      pregunta: 'En **Fa mayor**, ¿cuál es la cadencia **plagal**?',
      opciones: ['B♭ → F', 'C7 → F', 'C7 → Dm', 'Gm → C'],
      correcta: 0,
      explicacion: 'El IV de Fa es **B♭**: B♭ → F es plagal. C7 → F es auténtica, C7 → Dm rota y Gm → C, semicadencia.',
    },
  ],
  '5.4': [
    {
      pregunta: '¿Qué **loop** suena?',
      sonidos: [loop(['C', 'G', 'Am', 'F'])],
      opciones: ['I–V–vi–IV', 'vi–IV–I–V', 'I–IV–V–IV', 'I–vi–IV–V'],
      correcta: 0,
      explicacion: '**C – G – Am – F**: empieza en casa y pasa por el V, el vi y el IV. El loop más usado del pop.',
    },
    {
      pregunta: '¿En cuál el penúltimo acorde **pide volver** a casa?',
      sonidos: [loop(['Am', 'Dm', 'E', 'Am']), loop(['Am', 'Dm', 'Em', 'Am'])],
      correcta: 0,
      mezclar: true,
      explicacion: '**Am – Dm – E – Am**: E lleva Sol♯, la sensible, que sube a La. Con Em (i–iv–v) no hay sensible: el loop gira sin cerrarse.',
    },
    {
      pregunta: 'Con la casa en **La**, Am – F – C – G es…',
      opciones: ['i–VI–III–VII', 'i–iv–v', 'I–V–vi–IV', 'i–VII–VI–V'],
      correcta: 0,
      explicacion: 'Desde La: Am = **i**, F = **VI**, C = **III** y G = **VII** (sin sensible). Los mismos acordes que vi–IV–I–V de Do.',
    },
  ],
  '5.5': [
    {
      pregunta: '¿Qué **progresión** suena?',
      sonidos: [septimas(['Dm7', 'G7', 'Cmaj7'])],
      opciones: ['ii–V–I', 'I–vi–IV–V', 'I–IV–V', 'vi–IV–I–V'],
      correcta: 0,
      explicacion: '**Dm7 – G7 – Cmaj7**: subdominante, dominante y casa (S → D → T), con el bajo por quintas. El ii–V–I del jazz.',
    },
    {
      pregunta: '¿Qué acordes usa el **blues de 12 compases** en Do?',
      opciones: ['C7, F7 y G7', 'C, F y G', 'Cmaj7, Dm7 y G7', 'C, Am, F y G'],
      correcta: 0,
      explicacion: 'El I7, el IV7 y el V7, **todos de 7.ª de dominante**: C7 (con Si♭) y F7 (con Mi♭) se salen de Do mayor. Esa es la nota blue.',
    },
    {
      pregunta: '¿Cuál es el **ii–V–I** de **Sol mayor**?',
      opciones: ['Am7 – D7 – Gmaj7', 'Dm7 – G7 – Cmaj7', 'Em7 – A7 – Dmaj7', 'Am7 – D7 – G7'],
      correcta: 0,
      explicacion: 'En Sol: el ii es **Am7**, el V7 es **D7** y el I con séptima mayor es **Gmaj7**.',
    },
  ],
  '5.6': [
    {
      pregunta: '¿Cada cuánto cambia el **acorde**?',
      sonidos: [conBeat(pop(2, { veces: 2 }))],
      opciones: ['Cada 2 compases', 'Cada compás', 'Dos por compás', 'Cada tiempo'],
      ordenFijo: true,
      correcta: 2,
      explicacion: '**C – G – Am – F** en 2 compases: cambia en el 1 y en el 3, **dos veces por compás**.',
    },
    {
      pregunta: '¿En cuál llega el acorde **antes** del compás?',
      sonidos: [conBeat(pop(4, { adelanto: 0.5 })), conBeat(pop(4))],
      correcta: 0,
      mezclar: true,
      explicacion: 'En el adelantado, cada acorde llega en la «y» del 4, **medio tiempo antes** del bombo del 1: una síncopa.',
    },
    {
      pregunta: 'Para que el pre-coro **empuje** hacia el coro…',
      opciones: ['Los acordes cambian más seguido', 'Sube el tempo', 'Se quita la batería', 'Se queda en un solo acorde'],
      correcta: 0,
      explicacion: 'Se **acelera el ritmo armónico**: el beat sigue igual y la armonía se mueve más rápido. El coro se siente como una llegada.',
    },
  ],
  '5.7': [
    {
      pregunta: '¿Dónde está la **casa**?',
      sonidos: [acordes57(['Bb', 'C', 'F', 'F'])],
      opciones: ['F', 'B♭', 'C', 'Dm'],
      correcta: 0,
      explicacion: '**B♭ – C – F**: empieza fuera, pero C apunta a **F** y ahí descansa. Es el IV–V–I de Fa mayor.',
    },
    {
      pregunta: '¿Qué **números** tiene este loop?',
      sonidos: [acordes57(['A', 'E', 'F#m', 'D', 'A'])],
      opciones: ['I–V–vi–IV', 'I–vi–IV–V', 'vi–IV–I–V', 'I–IV–V–IV'],
      correcta: 0,
      explicacion: '**A – E – F♯m – D** en La mayor: casa, el V, el vi menor y el IV. El loop pop, como en «Someone Like You».',
    },
    {
      pregunta: '«Hallelujah» (Leonard Cohen): **G → Am** en Do mayor. ¿Qué **cadencia** es?',
      opciones: ['Auténtica', 'Plagal', 'Semicadencia', 'Rota'],
      ordenFijo: true,
      correcta: 3,
      explicacion: 'El V va al **vi** en vez de al I: una cadencia **rota**. La letra la llama «the minor fall».',
    },
  ],
}
