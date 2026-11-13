// Ruta de letras · L4 — Multis (rimas multisilábicas, como en el rap).
// Vive en la ruta de letras (`ruta: 'letras'`). «multi N» = cuántas vocales seguidas comparten dos versos al final
// (lo calcula el motor de src/letras/analisis.js, como en el cuaderno). Versos originales.
// Formato: src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md

/** Ronda «¿cuál hace multi con…?»: la correcta es la única con multi (las otras solo riman al final). */
const multi = (verso, opciones, correcta, explicacion) => ({
  pregunta: `¿Cuál hace **multi** con *${verso}*?`,
  opciones,
  correcta,
  explicacion,
})

export default {
  id: 'L4',
  ruta: 'letras',
  titulo: 'Multis',
  subtitulo: 'Rimas de varias sílabas',
  minutos: 5,
  resumen: [
    'Una **multi** (rima multisilábica) repite **las vocales de varias sílabas seguidas** al final de dos versos.',
    'Se cuentan las vocales: *o-tro pla-ne-ta* y *si-go la me-ta* comparten **o‑a‑e‑a** → multi 4.',
    'Las consonantes pueden cambiar: lo que se oye es la música de las vocales.',
    'Para escribir una: saca las vocales de tu frase y busca otras palabras con las mismas.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Rimar con más de una palabra',
      parrafos: [
        'En una rima normal se repite el final de **una palabra**. En una **multi** se repiten las vocales de **varias sílabas seguidas**, aunque sean de palabras distintas.',
        '*o-tro pla-ne-ta* → **o‑a‑e‑a** · *si-go la me-ta* → **o‑a‑e‑a**. Comparten 4 vocales: **multi 4**.',
      ],
      letra: { texto: 'Tengo la mente en otro planeta\nnadie me frena, sigo la meta', multis: true },
    },
    {
      tipo: 'texto',
      titulo: 'Cuanto más larga, más pega',
      parrafos: [
        '*pren-do la luz de la lu-na* y *bus-co la cruz en la tum-ba*: desde *-do* y *-co* las vocales son las mismas, **o‑a‑u‑e‑a‑u‑a**. ¡Multi 7!',
        'Las consonantes cambian (luz / cruz, luna / tumba); el oído escucha las vocales y siente que todo rima.',
      ],
      letra: { texto: 'Prendo la luz de la luna\nbusco la cruz en la tumba', multis: true },
    },
    {
      tipo: 'elegir',
      titulo: 'Encuentra la multi',
      rondas: [
        multi(
          'Tengo la mente en otro planeta',
          ['todo me cuesta', 'nadie me frena, sigo la meta', 'nadie me espera'],
          1,
          '*sigo la meta* repite **o‑a‑e‑a**. Las otras solo comparten **e‑a** al final: riman, pero no son multi.',
        ),
        multi(
          'Salgo a la calle sin miedo',
          ['todo lo puedo', 'sigo en el juego', 'vengo del valle sin dueño'],
          2,
          '*del valle sin dueño* repite las vocales de *la calle sin miedo*: **a‑e‑i‑e‑o**, multi 5.',
        ),
        multi(
          'Prendo la luz de la luna',
          ['busco la cruz en la tumba', 'siempre me busca', 'sigo sin una'],
          0,
          '**o‑a‑u‑e‑a‑u‑a**: siete vocales seguidas iguales. Las otras solo se parecen en la última palabra.',
        ),
      ],
    },
    {
      tipo: 'texto',
      titulo: 'Cómo escribir una',
      parrafos: [
        '1. Escribe tu verso y saca **las vocales del final**: *luz de la luna* → u‑e‑a‑u‑a.',
        '2. Busca palabras con esas vocales: *cruz en la tumba*, *me ayuda*…',
        '3. Pruébalo en tu cuaderno: junto al verso sale **multi N**. En la ficha de cada palabra están sus rimas del diccionario.',
      ],
    },
  ],
}
