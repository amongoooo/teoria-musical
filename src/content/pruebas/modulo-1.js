// Prueba rápida «¿Ya lo sabes?» · banco del módulo 1 (Sonido, notas y teclado).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).
// Van al nivel del FINAL de la lección y con 3+ opciones (o dos sonidos parecidos): que no se adivinen.

const OCTAVA = { rango: ['C4', 'C5'], soloBlancas: true }
const nota = (n, inicio, duracion = 2) => ({ nota: n, inicio, duracion })
const MISMA = ['La **misma nota**, una octava arriba', 'Una **nota distinta**']

export default {
  '1.1': [
    {
      pregunta: '¿Cuál es **más aguda**?',
      sonidos: [{ notas: ['E4'], duracion: 1 }, { notas: ['F4'], duracion: 1 }],
      correcta: 1,
      mezclar: true,
      mostrarNotas: true,
      explicacion: 'Fa vibra más rápido que Mi (349 Hz contra 330 Hz): un solo semitono, pero **más agudo**.',
    },
    {
      pregunta: 'Una nota vibra a **440 Hz**. ¿A cuánto vibra la misma nota **una octava más arriba**?',
      opciones: ['220 Hz', '660 Hz', '880 Hz'],
      correcta: 2,
      explicacion: 'Subir una octava es **doblar** la frecuencia: 440 × 2 = **880 Hz**.',
    },
    {
      pregunta: '¿Cuál es **más grave**?',
      sonidos: [{ frecuencia: 330, duracion: 1, etiqueta: 'A' }, { frecuencia: 311, duracion: 1, etiqueta: 'B' }],
      correcta: 1,
      mezclar: true,
      explicacion: 'Menos vibraciones por segundo, más grave: **311 Hz** está por debajo de 330 Hz.',
    },
  ],
  '1.2': [
    {
      pregunta: '¿Cuántas notas **distintas** hay antes de que se repita la primera, una octava arriba?',
      opciones: ['7', '8', '12'],
      correcta: 2,
      explicacion: 'Contando blancas y negras hay **12**: Do, Do♯, Re, Re♯, Mi, Fa, Fa♯, Sol, Sol♯, La, La♯, Si. La 13.ª ya es Do otra vez.',
    },
    {
      pregunta: 'Escucha. ¿Es la misma nota en otra octava, o una nota distinta?',
      sonidos: [{ notas: ['C4', 'B4'], intervalo: 0.7, duracion: 0.8 }],
      opciones: MISMA,
      correcta: 1,
      explicacion: 'Es **Do y Si**: casi una octava, pero le falta un semitono. La octava (Do → Do) suena como la misma nota «más arriba».',
    },
    {
      pregunta: '¿Cuántos **semitonos** hay de Do4 a Do5?',
      opciones: ['8', '10', '12'],
      correcta: 2,
      explicacion: 'Una octava son **12 semitonos**: las 12 notas, una tecla tras otra.',
    },
  ],
  '1.3': [
    {
      pregunta: '¿Qué **otro nombre** tiene **Re♯**?',
      opciones: ['Mi♭', 'Do♯', 'Mi♯'],
      correcta: 0,
      explicacion: 'Re♯ (Re un semitono arriba) es la misma tecla negra que **Mi♭** (Mi un semitono abajo).',
    },
    {
      pregunta: 'Entre **Mi y Fa**, ¿hay una tecla negra?',
      opciones: ['Sí: Mi♯', 'No: están a un semitono', 'Sí: Fa♭'],
      correcta: 1,
      explicacion: 'Mi–Fa (y Si–Do) son blancas **pegadas**: entre ellas solo hay un semitono, sin tecla negra.',
    },
    {
      pregunta: '**Sol♭** es la misma tecla que…',
      opciones: ['Fa♯', 'Sol♯', 'La♭'],
      correcta: 0,
      explicacion: 'Sol bajado un semitono cae en la negra que hay entre Fa y Sol: **Fa♯**.',
    },
  ],
  '1.4': [
    {
      pregunta: '¿Qué nota **dura más**?',
      roll: { ...OCTAVA, notas: [nota('E4', 0, 2), nota('D4', 2, 1), nota('A4', 3, 5)] },
      opciones: ['Mi', 'Re', 'La'],
      correcta: 2,
      explicacion: 'La duración es el **largo** del rectángulo: el de **La** ocupa 5 casillas.',
    },
    {
      pregunta: '¿Cuántas notas suenan **a la vez** al principio?',
      roll: { ...OCTAVA, notas: [nota('D4', 0, 4), nota('F4', 0, 4), nota('A4', 0, 4), nota('E4', 4, 4)] },
      opciones: ['1', '2', '3'],
      correcta: 2,
      explicacion: 'Re, Fa y La empiezan en la **misma columna**: suenan juntas (un acorde de 3 notas).',
    },
    {
      pregunta: '¿Qué nota suena **al final**?',
      roll: { ...OCTAVA, notas: [nota('G4', 0), nota('C5', 2), nota('E4', 4), nota('F4', 6)] },
      opciones: ['Sol', 'Do', 'Mi', 'Fa'],
      correcta: 3,
      explicacion: 'El roll se lee de **izquierda a derecha**: la última columna es la de **Fa**.',
    },
  ],
}
