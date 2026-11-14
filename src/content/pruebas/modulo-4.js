// Prueba rápida «¿Ya lo sabes?» · banco del módulo 4 (Acordes).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).
import { abierto, inversion, triada } from '../../theory/acordes.js'

const bloque = (notas) => ({ etiqueta: 'Escuchar', notas, modo: 'acorde', duracion: 1.6 })
const nota = (n, inicio, duracion) => ({ nota: n, inicio, duracion })
/** Un acorde en el roll, de una sola columna larga (para leer qué nota va abajo). */
const roll = (notas, rango) => ({ rango, soloBlancas: true, columnas: 4, porTiempo: 1, bpm: 70, notas: notas.map((n) => nota(n, 0, 4)) })

const MAYOR_MENOR = ['**Mayor**', '**Menor**']

export default {
  '4.1': [
    {
      pregunta: '**Do – Mi♭ – Sol♭** es un acorde…',
      opciones: ['Mayor', 'Menor', 'Disminuido', 'Aumentado'],
      correcta: 2,
      explicacion: 'Dos **3.as menores** apiladas (Do → Mi♭ → Sol♭): **disminuido**, el más tenso.',
    },
    {
      pregunta: 'Una tríada **mayor** se apila con…',
      opciones: ['3.ª mayor + 3.ª menor', '3.ª menor + 3.ª mayor', 'Dos 3.as mayores'],
      correcta: 0,
      explicacion: 'Abajo la **3.ª mayor** (Do → Mi) y encima una **3.ª menor** (Mi → Sol). Al revés sería menor; dos mayores, aumentado.',
    },
    {
      pregunta: '¿Cómo se cifra **Fa♯ menor**?',
      opciones: ['F♯', 'F♯m', 'F♯dim'],
      correcta: 1,
      explicacion: 'La **m** minúscula después de la letra = menor: **F♯m**. Sin nada es mayor; *dim*, disminuido.',
    },
  ],
  '4.2': [
    {
      pregunta: '¿Mayor o menor?',
      sonidos: [bloque(triada('A3', 'menor'))],
      opciones: MAYOR_MENOR,
      correcta: 1,
      explicacion: 'La – Do – Mi: la 3.ª es **menor**. Suena más oscuro, más íntimo.',
    },
    {
      pregunta: 'Abajo, en el grave: ¿mayor o menor?',
      sonidos: [bloque(triada('D3', 'mayor'))],
      opciones: MAYOR_MENOR,
      correcta: 0,
      explicacion: 'Re – Fa♯ – La: **mayor**, abierto y luminoso aunque suene grave.',
    },
    {
      pregunta: '¿Cuál es el **menor**?',
      sonidos: [bloque(triada('F4', 'mayor')), bloque(triada('F4', 'menor'))],
      correcta: 1,
      mezclar: true,
      explicacion: 'Solo cambia la 3.ª: La (mayor) o **La♭** (menor). El menor suena más apagado.',
    },
  ],
  '4.3': [
    {
      pregunta: 'En **Do mayor**, **Am** es el grado…',
      opciones: ['ii', 'iii', 'vi'],
      correcta: 2,
      explicacion: 'Do, Re, Mi, Fa, Sol, **La**: el 6.º grado. En minúscula porque es menor: **vi**.',
    },
    {
      pregunta: 'En **Sol mayor**, el **V** es…',
      opciones: ['C', 'D', 'Em'],
      correcta: 1,
      explicacion: 'Sol, La, Si, Do, **Re**: el 5.º grado, mayor. **D**.',
    },
    {
      pregunta: 'En una tonalidad mayor, el acorde del **7.º grado** es…',
      opciones: ['Mayor', 'Menor', 'Disminuido'],
      correcta: 2,
      explicacion: 'Con las notas de la escala, sobre el 7.º salen dos 3.as menores: **disminuido** (vii°).',
    },
  ],
  '4.4': [
    {
      pregunta: '¿Qué acorde es?',
      roll: roll(inversion(triada('C4', 'mayor'), 1), ['C4', 'D5']),
      opciones: ['C', 'C/E', 'C/G'],
      correcta: 1,
      explicacion: 'Son Do, Mi y Sol, pero abajo está **Mi**: 1.ª inversión, **C/E**.',
    },
    {
      pregunta: '**G/B** quiere decir…',
      opciones: ['Sol mayor con **Si en el bajo**', 'Sol y Si, sin más notas', 'Si mayor sobre Sol'],
      correcta: 0,
      explicacion: 'Lo de la izquierda es el acorde (G = Sol mayor) y lo de después de la barra, **la nota del bajo** (Si).',
    },
    {
      pregunta: '¿Qué acorde es?',
      roll: roll(inversion(triada('F3', 'mayor'), 2), ['C4', 'A4']),
      opciones: ['F', 'F/A', 'F/C'],
      correcta: 2,
      explicacion: 'Fa, La y Do con **Do abajo**: 2.ª inversión, **F/C**.',
    },
  ],
  '4.5': [
    {
      pregunta: '¿Cuál está **abierto**?',
      sonidos: [bloque(['C3', 'E3', 'G3']), bloque(abierto(['C3', 'E3', 'G3']))],
      correcta: 1,
      mezclar: true,
      explicacion: 'En el abierto la 3.ª (Mi) sube una octava: las notas se separan y el grave queda **limpio**.',
    },
    {
      pregunta: 'En el **grave**, lo más seguro es tocar…',
      opciones: ['Solo la **fundamental** (o con su 5.ª)', 'La **3.ª y la 5.ª** juntas', 'El acorde **cerrado** completo'],
      correcta: 0,
      explicacion: 'Abajo las notas juntas se embarran. La **fundamental** sola (u octavas y 5.as) deja el grave claro.',
    },
    {
      pregunta: '¿Cerrado o abierto?',
      roll: roll(abierto(['C3', 'E3', 'G3']), ['C3', 'F4']),
      opciones: ['**Cerrado**: notas juntas', '**Abierto**: notas separadas'],
      correcta: 1,
      explicacion: 'Do3, Sol3 y Mi4: la 3.ª está **una octava arriba**. Es un voicing **abierto**.',
    },
  ],
}
