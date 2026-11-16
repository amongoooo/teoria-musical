// Prueba rápida «¿Ya lo sabes?» · banco del módulo 5 (Armonía funcional y progresiones).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).

// Las mismas voces que la lección 5.1: el bajo abajo y las de arriba moviéndose poco.
const VOZ = {
  I: ['C3', 'C4', 'E4', 'G4'],
  IV: ['F3', 'C4', 'F4', 'A4'],
  V: ['G3', 'B3', 'D4', 'G4'],
  vi: ['A3', 'C4', 'E4', 'A4'],
}
const dos = (a, b) => ({ notas: [a, b], modo: 'acorde', duracion: 1.4 })
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
}
