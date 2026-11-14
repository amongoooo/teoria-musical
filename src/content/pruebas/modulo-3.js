// Prueba rápida «¿Ya lo sabes?» · banco del módulo 3 (Intervalos y escalas).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` y, en la 3.5, de `circulo`
// (con `tipo: 'circulo'`). Ver src/content/FORMATO.md.
import { escalaArmonica, escalaCambiada, escalaMayor, escalaMelodica, escalaMenor, pentaMayor } from '../../theory/escalas.js'

/** Una escala de una en una. */
const escala = (notas) => ({ etiqueta: 'Escuchar', notas, intervalo: 0.34, duracion: 0.5 })
/** Dos notas: una tras otra y luego juntas. */
const dos = (a, b) => ({ etiqueta: 'Escuchar', notas: [a, b, [a, b]], intervalo: 0.75, duracion: 0.9 })

const PASOS = ['**Semitono**', '**Tono**', '**Tono y medio**']
const INTERVALOS = ['3.ª menor', '3.ª mayor', '4.ª justa', '5.ª justa']
const MAYOR_U_OTRA = ['**Escala mayor**', '**Otra cosa**: algo suena raro']
const MENORES = ['Menor **natural**', 'Menor **armónica**', 'Menor **melódica**']

export default {
  '3.1': [
    {
      pregunta: '¿Semitono, tono o tono y medio?',
      sonidos: [dos('E4', 'F4')],
      opciones: PASOS,
      correcta: 0,
      explicacion: 'Mi → Fa son teclas **pegadas**: un **semitono**, el paso más pequeño.',
    },
    {
      pregunta: '¿Y este paso?',
      sonidos: [dos('A4', 'B4')],
      opciones: PASOS,
      correcta: 1,
      explicacion: 'La → Si salta una tecla negra (La♯): dos semitonos = **un tono**.',
    },
    {
      pregunta: 'De **Si a Do** hay…',
      opciones: PASOS,
      correcta: 0,
      explicacion: 'Si y Do son blancas pegadas, sin negra en medio: **un semitono** (como Mi–Fa).',
    },
  ],
  '3.2': [
    {
      pregunta: '¿Qué intervalo es?',
      sonidos: [dos('D4', 'F4')],
      opciones: INTERVALOS,
      correcta: 0,
      explicacion: 'Re → Fa: **3 semitonos**, una **3.ª menor**. Íntima, más oscura que la mayor.',
    },
    {
      pregunta: '¿Y este?',
      sonidos: [dos('C4', 'G4')],
      opciones: INTERVALOS,
      correcta: 3,
      explicacion: 'Do → Sol: **7 semitonos**, la **5.ª justa**. Hueca y firme, como «Estrellita».',
    },
    {
      pregunta: '¿Y este?',
      sonidos: [dos('A3', 'D4')],
      opciones: INTERVALOS,
      correcta: 2,
      explicacion: 'La → Re: **5 semitonos**, la **4.ª justa**. Como el arranque de «La cucaracha».',
    },
  ],
  '3.3': [
    {
      pregunta: '¿Es una escala mayor?',
      sonidos: [escala(escalaCambiada('C4', { grado: 7, semitonos: -1 }))],
      opciones: MAYOR_U_OTRA,
      correcta: 1,
      explicacion: 'La 7.ª está **un semitono abajo** (Si♭): al final no «empuja» hacia Do. No es la escala mayor.',
    },
    {
      pregunta: '¿Y esta?',
      sonidos: [escala(escalaMayor('G3'))],
      opciones: MAYOR_U_OTRA,
      correcta: 0,
      explicacion: 'Sol mayor, con su Fa♯: **T T S T T T S**. Es la escala mayor.',
    },
    {
      pregunta: 'La fórmula de la escala mayor es…',
      opciones: ['T T S T T T S', 'T S T T S T T', 'T T T S T T S'],
      correcta: 0,
      explicacion: '**T T S T T T S**: los semitonos van del 3.º al 4.º y del 7.º al 8.º. (T S T T S T T es la menor natural).',
    },
  ],
  '3.4': [
    {
      pregunta: '¿Cuál es la **relativa menor** de **Fa mayor**?',
      opciones: ['Re menor', 'La menor', 'Fa menor'],
      correcta: 0,
      explicacion: 'La relativa menor empieza en el **6.º grado**: Fa, Sol, La, Si♭, Do, **Re**. Re menor (mismas notas, con Si♭).',
    },
    {
      pregunta: '¿Mayor o menor?',
      sonidos: [escala(escalaMenor('E4'))],
      opciones: ['**Mayor**', '**Menor**'],
      correcta: 1,
      explicacion: 'Mi menor natural: la 3.ª es **menor** (Mi → Sol) y suena más oscura.',
    },
    {
      pregunta: 'La relativa menor empieza en el … grado de la escala mayor.',
      opciones: ['3.º', '5.º', '6.º'],
      correcta: 2,
      explicacion: 'En el **6.º**: Do mayor → La menor. Usan las mismas notas.',
    },
  ],
  '3.5': [
    {
      tipo: 'circulo',
      pregunta: 'Toca la tonalidad mayor que tiene **3 sostenidos**.',
      correcta: 'A',
      anillo: 'mayor',
      explicacion: 'Cada paso a la derecha en el círculo suma un ♯: Sol (1), Re (2), **La (3)**: Fa♯, Do♯, Sol♯.',
    },
    {
      pregunta: '¿Cuál es la **dominante** (el 5.º grado) de **Re mayor**?',
      opciones: ['Sol', 'La', 'Si'],
      correcta: 1,
      explicacion: 'Re, Mi, Fa♯, Sol, **La**: el 5.º grado. En el círculo, la vecina de la derecha.',
    },
    {
      tipo: 'circulo',
      pregunta: 'Toca la tonalidad mayor que tiene **2 bemoles**.',
      correcta: 'Bb',
      anillo: 'mayor',
      explicacion: 'Hacia la izquierda se suman bemoles: Fa (1♭), **Si♭ (2♭)**: Si♭ y Mi♭.',
    },
  ],
  '3.6': [
    {
      pregunta: '¿Qué dos grados **quita** la pentatónica mayor?',
      opciones: ['El 4.º y el 7.º', 'El 2.º y el 6.º', 'El 3.º y el 7.º'],
      correcta: 0,
      explicacion: 'Quita el **4.º y el 7.º**, los dos que forman semitono: por eso nunca choca. Queda 1 2 3 5 6.',
    },
    {
      pregunta: 'Si tocas **solo las teclas negras**, suena…',
      opciones: ['Una **pentatónica**', 'Una **escala mayor**', 'Una **menor armónica**'],
      correcta: 0,
      explicacion: 'Las 5 negras forman la **pentatónica** de Fa♯ mayor (o de Re♯ menor).',
    },
    {
      pregunta: '¿Cuántas notas **distintas** tiene esta escala?',
      sonidos: [escala(pentaMayor('C4'))],
      opciones: ['5', '6', '7'],
      correcta: 0,
      explicacion: 'Do, Re, Mi, Sol, La (y Do arriba): **5 notas**. Es la pentatónica de Do mayor.',
    },
  ],
  '3.7': [
    {
      pregunta: '¿Qué menor es? (subiendo)',
      sonidos: [escala(escalaArmonica('A3'))],
      opciones: MENORES,
      correcta: 1,
      explicacion: 'El salto de **tono y medio** (Fa → Sol♯) antes de llegar arriba es la marca de la **armónica**.',
    },
    {
      pregunta: '¿Y esta? (subiendo)',
      sonidos: [escala(escalaMelodica('D4'))],
      opciones: MENORES,
      correcta: 2,
      explicacion: 'Empieza menor y luego sube **como una mayor** (6.º y 7.º altos, sin salto raro): la **melódica**.',
    },
    {
      pregunta: 'En **La menor armónica**, ¿qué nota sube un semitono?',
      opciones: ['Sol → Sol♯', 'Fa → Fa♯', 'Do → Do♯'],
      correcta: 0,
      explicacion: 'Sube el **7.º grado**: Sol → **Sol♯**, la sensible que empuja hacia La.',
    },
  ],
}
