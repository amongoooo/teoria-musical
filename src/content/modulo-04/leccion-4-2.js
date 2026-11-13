// Lección 4.2 — ¿Mayor o menor? Entrenamiento de oído.
// Mayor y menor comparten fundamental y 5.ª: decide la 3.ª. Del arpegio al acorde solo, de una fundamental a
// muchas, del registro medio a los extremos y del acorde suelto a la progresión (C – Am – F – G).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas de cada acorde salen de src/theory/acordes.js (Tonal.js `Chord`).
import { arpegioYAcorde, cifrado, nombreAcorde, triada } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'

/** Las notas del acorde en español: 'Re · Fa♯ · La'. */
const notasEs = (raiz, tipo) => triada(raiz, tipo).map((n) => nombre(n, { octava: false })).join(' · ')
/** «Re menor» con mayúscula. */
const Nombre = (raiz, tipo) => {
  const n = nombreAcorde(raiz, tipo)
  return `${n[0].toUpperCase()}${n.slice(1)}`
}

const arpegio = (raiz, tipo, etiqueta = 'Escuchar') => ({ etiqueta, notas: arpegioYAcorde(triada(raiz, tipo)), intervalo: 0.4, duracion: 1.2 })
const bloque = (raiz, tipo, etiqueta = 'Escuchar') => ({ etiqueta, notas: triada(raiz, tipo), modo: 'acorde', duracion: 1.8 })

/** Ronda «¿mayor o menor?» con un sonido (arpegio o bloque). */
function color(sonido, raiz, tipo, explicacion, pregunta = '¿Mayor o menor?') {
  return { pregunta, sonidos: [sonido(raiz, tipo)], opciones: ['Mayor', 'Menor'], correcta: tipo === 'menor' ? 1 : 0, explicacion }
}

/** Una progresión: [['C4', 'mayor'], ['A3', 'menor'], …] → los acordes uno tras otro. */
function progresion(acordes, etiqueta = 'Escuchar') {
  return { etiqueta, notas: acordes.map(([r, t]) => triada(r, t)), intervalo: 0.95, duracion: 0.9 }
}
const cifras = (acordes) => acordes.map(([r, t]) => cifrado(r, t))

/** Ronda «¿cuál de los cuatro es menor?». */
function cualMenor(acordes, explicacion) {
  const i = acordes.findIndex(([, t]) => t === 'menor')
  return { pregunta: '¿Cuál de los cuatro es **menor**?', sonidos: [progresion(acordes)], opciones: ['1.º', '2.º', '3.º', '4.º'], correcta: i, explicacion }
}

/** Pareja de «Mayor, menor o disminuido». */
const pareja = (raiz, tipo, sonido) => ({
  sonido: sonido(raiz, tipo),
  nombre: nombreAcorde(raiz, tipo).split(' ').pop().replace(/^./, (c) => c.toUpperCase()),
  detalle: `${notasEs(raiz, tipo)}`,
})

const PIANO = { startOctave: 4, octaves: 2 }

const C_AM_F_G = [['C4', 'mayor'], ['A3', 'menor'], ['F3', 'mayor'], ['G3', 'mayor']]
const C_A_F_G = [['C4', 'mayor'], ['A3', 'mayor'], ['F3', 'mayor'], ['G3', 'mayor']]

export default {
  id: '4.2',
  modulo: 4,
  titulo: '¿Mayor o menor? Entrenamiento de oído',
  subtitulo: 'Una sola nota cambia el color',
  minutos: 11,
  resumen: [
    'Mayor y menor comparten la **fundamental** y la **5.ª**: solo cambia la **3.ª**, un semitono.',
    'Para oírlo, escucha el **primer salto** del arpegio: **4 semitonos** = mayor, **3** = menor. Con práctica, el color se reconoce de golpe.',
    'El color no depende del registro: grave o agudo, un mayor sigue siendo mayor (en el grave, eso sí, se embarra).',
    'En una progresión como **C – Am – F – G**, el menor se siente como una sombra entre los mayores.',
    'Sigue entrenando en **Oído → Acordes** unos minutos al día.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos acordes sobre la misma fundamental.',
      rondas: [
        {
          pregunta: '¿Cuál suena más **íntimo**, más melancólico?',
          sonidos: [bloque('G3', 'menor'), bloque('G3', 'mayor')],
          correcta: 0,
          mezclar: true,
          explicacion: `El íntimo es **Sol menor** (${notasEs('G3', 'menor')}). El otro, **Sol mayor** (${notasEs('G3', 'mayor')}). Solo cambia una nota: hoy entrenas el oído para oírla.`,
        },
      ],
    },

    // 1 · L2 — Escucha la nota del medio
    {
      tipo: 'texto',
      titulo: 'Escucha la nota del medio',
      parrafos: [
        'Un acorde mayor y uno menor sobre la misma fundamental comparten **la fundamental y la 5.ª**. La única diferencia es la **3.ª**: un semitono.',
        'El truco: oye el acorde **de una en una** y fíjate en el primer salto. Si sube **4 semitonos** (3.ª mayor), es mayor; si sube **3** (3.ª menor), menor.',
        'Con práctica ya no hace falta: el color se reconoce de golpe, como reconoces una voz.',
      ],
      sonidos: [
        arpegio('C4', 'mayor', 'Do mayor'),
        arpegio('C4', 'menor', 'Do menor'),
        { etiqueta: 'Solo la 3.ª: Mi y Mi♭', notas: ['C4', 'E4', 'C4', 'Eb4'], intervalo: 0.55, duracion: 0.6 },
      ],
    },

    // 2 · O2 — Nivel 1: arpegio y luego el acorde, siempre sobre Do
    {
      tipo: 'elegir',
      titulo: 'De una en una',
      intro: 'Siempre sobre **Do**: primero el arpegio y luego el acorde.',
      rondas: [
        color(arpegio, 'C4', 'menor', `**Do menor**: Do → **Mi♭** sube 3 semitonos.`),
        color(arpegio, 'C4', 'mayor', `**Do mayor**: Do → **Mi** sube 4 semitonos.`),
        color(arpegio, 'C4', 'mayor', `**Do mayor** otra vez: el salto largo, luminoso.`),
        color(arpegio, 'C4', 'menor', `**Do menor**: el salto corto, la 3.ª menor.`),
      ],
    },

    // 3 · O2 — Nivel 2: solo el acorde, cada vez desde otra nota
    {
      tipo: 'elegir',
      titulo: 'Todo junto',
      intro: 'Ahora solo el acorde, y cada vez desde otra nota.',
      rondas: [
        color(bloque, 'D4', 'menor', `**Re menor**: ${notasEs('D4', 'menor')}.`),
        color(bloque, 'F3', 'mayor', `**Fa mayor**: ${notasEs('F3', 'mayor')}.`),
        color(bloque, 'A3', 'menor', `**La menor**: ${notasEs('A3', 'menor')}.`),
        color(bloque, 'E4', 'mayor', `**Mi mayor**: ${notasEs('E4', 'mayor')}. La 3.ª es una negra, Sol♯.`),
        color(bloque, 'B3', 'menor', `**Si menor**: ${notasEs('B3', 'menor')}.`),
      ],
    },

    // 4 · P8 — Escucha y construye (no se dice si es mayor o menor)
    {
      tipo: 'tocar',
      titulo: 'Escucha y construye',
      intro: 'Tienes la fundamental. Escucha el acorde y toca su 3.ª y su 5.ª.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'C4', tipo: 'menor', escuchar: true, mensaje: `${notasEs('C4', 'menor')}: era **Do menor**.` },
          { raiz: 'F4', tipo: 'mayor', escuchar: true, mensaje: `${notasEs('F4', 'mayor')}: era **Fa mayor**.` },
          { raiz: 'D4', tipo: 'mayor', escuchar: true, mensaje: `${notasEs('D4', 'mayor')}: era **Re mayor**, con Fa♯.` },
          { raiz: 'E4', tipo: 'menor', escuchar: true, mensaje: `${notasEs('E4', 'menor')}: era **Mi menor**.` },
        ],
      },
      piano: PIANO,
    },

    // 5 · O2 — Grave y agudo: el mismo color en cualquier registro
    {
      tipo: 'elegir',
      titulo: 'Grave y agudo',
      intro: 'El color no cambia con la altura.',
      rondas: [
        color(bloque, 'A2', 'menor', `**La menor**, muy grave. Abajo las terceras se embarran: por eso los productores dejan solo la fundamental en el grave (lo verás en la 4.5).`, '¿Mayor o menor? (grave)'),
        color(bloque, 'C5', 'mayor', `**Do mayor**, agudo: brillante como en una caja de música.`, '¿Mayor o menor? (agudo)'),
        color(bloque, 'E5', 'menor', `**Mi menor**, agudo: ${notasEs('E5', 'menor')}.`, '¿Mayor o menor? (agudo)'),
        color(bloque, 'G2', 'mayor', `**Sol mayor**, grave: ${notasEs('G2', 'mayor')}.`, '¿Mayor o menor? (grave)'),
      ],
    },

    // 6 · L2 — En una canción
    {
      tipo: 'texto',
      titulo: 'En una canción',
      parrafos: [
        `En una canción los acordes van seguidos. Esta progresión, **${cifras(C_AM_F_G).join(' – ')}**, suena en cientos de canciones, de los años 50 a hoy.`,
        'Tres son mayores y uno es menor: **Am**. Al oírla, el segundo acorde se siente como una nube que tapa el sol un momento.',
        'Escucha también la versión con **A** (La mayor): la nube desaparece y todo suena más brillante… y más raro.',
      ],
      sonidos: [progresion(C_AM_F_G, cifras(C_AM_F_G).join(' – ')), progresion(C_A_F_G, cifras(C_A_F_G).join(' – '))],
    },

    // 7 · O2 — ¿Cuál es el menor? (progresiones de cuatro acordes)
    {
      tipo: 'elegir',
      titulo: '¿Cuál es el menor?',
      intro: 'Cuatro acordes seguidos; solo uno es menor.',
      rondas: [
        cualMenor(
          [['C4', 'mayor'], ['G3', 'mayor'], ['A3', 'menor'], ['F3', 'mayor']],
          'C – G – **Am** – F: la progresión de «Let It Be» y de mil canciones más.',
        ),
        cualMenor(
          [['A3', 'menor'], ['F3', 'mayor'], ['C4', 'mayor'], ['G3', 'mayor']],
          '**Am** – F – C – G: los mismos acordes, pero empieza en el menor y todo se siente más melancólico.',
        ),
        cualMenor(
          [['G3', 'mayor'], ['E3', 'menor'], ['C4', 'mayor'], ['D4', 'mayor']],
          'G – **Em** – C – D: la misma idea que C – Am – F – G, en otra tonalidad.',
        ),
        cualMenor(
          [['D4', 'mayor'], ['A3', 'mayor'], ['B3', 'menor'], ['G3', 'mayor']],
          'D – A – **Bm** – G: igual que la primera, en Re.',
        ),
      ],
    },

    // 8 · O6 — Mayor, menor o disminuido
    {
      tipo: 'emparejar',
      titulo: 'Mayor, menor o disminuido',
      intro: 'El disminuido vuelve: dos 3.as menores.',
      rondas: [
        {
          pregunta: 'Desde Re, de una en una',
          parejas: [pareja('D4', 'mayor', arpegio), pareja('D4', 'menor', arpegio), pareja('D4', 'dis', arpegio)],
          explicacion: 'Solo cambian la 3.ª (**Fa♯ o Fa**) y, en el disminuido, también la 5.ª (**La♭**).',
        },
        {
          pregunta: 'Desde La, todo junto',
          parejas: [pareja('A3', 'mayor', bloque), pareja('A3', 'menor', bloque), pareja('A3', 'dis', bloque)],
          explicacion: 'El **mayor** abre, el **menor** se recoge y el **disminuido** se tensa.',
        },
      ],
    },

    // 9 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'Entre **Sol mayor** y **Sol menor**, ¿qué nota cambia?',
          opciones: ['Si → Si♭ (la 3.ª)', 'Re → Re♭ (la 5.ª)', 'Ninguna: cambia la octava'],
          correcta: 0,
          explicacion: `Sol mayor = ${notasEs('G3', 'mayor')}; Sol menor = ${notasEs('G3', 'menor')}. Solo la **3.ª**.`,
        },
        {
          pregunta: 'En un arpegio, ¿qué salto delata al **menor**?',
          opciones: ['De la fundamental a la 3.ª: 3 semitonos', 'De la fundamental a la 5.ª: 7 semitonos', 'De la 3.ª a la 5.ª: 3 semitonos'],
          correcta: 0,
          explicacion: 'La 5.ª está a 7 en los dos, y de la 3.ª a la 5.ª hay 3 semitonos en el **mayor**: el primer salto es la pista.',
        },
        {
          pregunta: '¿Cuántos acordes son menores en **C – Am – F – G**?',
          opciones: ['Uno: Am', 'Dos', 'Ninguno'],
          correcta: 0,
          explicacion: 'Solo **Am** (la m lo dice). C, F y G son mayores.',
        },
        {
          pregunta: '¿Cómo pasas **A** (La mayor) a **Am**?',
          opciones: ['Bajas la 3.ª: Do♯ → Do', 'Bajas la 5.ª: Mi → Mi♭', 'Subes la fundamental'],
          correcta: 0,
          explicacion: `A = ${notasEs('A3', 'mayor')}; Am = ${notasEs('A3', 'menor')}. Un semitono en la nota del medio.`,
        },
      ],
    },

    // 10 · L5 — ¿Qué se siente? Mayor y menor
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma fundamental, una nota de diferencia.',
      lados: [
        {
          etiqueta: 'Mayor',
          emociones: 'Estable, luminoso, abierto',
          ejemplos: 'El pop alegre, los himnos, «Cumpleaños feliz».',
          sonido: bloque('A3', 'mayor', `Escuchar ${Nombre('A3', 'mayor')}`),
        },
        {
          etiqueta: 'Menor',
          emociones: 'Íntimo, melancólico, serio',
          ejemplos: 'Mucho trap, reguetón y baladas giran alrededor de un acorde menor: Am, Em, Dm.',
          sonido: bloque('A3', 'menor', `Escuchar ${Nombre('A3', 'menor')}`),
        },
      ],
      nota: 'Sigue unos minutos al día en **Oído → Acordes**: el nivel 1 toca el arpegio y luego el acorde, como aquí; el 2, solo el acorde.',
    },

    // 11 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: mayor o menor, una nota',
      minutos: 15,
      objetivo: 'Escribir la progresión C – Am – F – G y oír cómo cambia al pasar un acorde de menor a mayor y al revés.',
      pasos: [
        'En el **Piano roll**, escribe **C – Am – F – G**, un acorde por compás: **C5-E5-G5**, **A4-C5-E5**, **F4-A4-C5** y **G4-B4-D5** (nombres de FL).',
        'Ponlo en bucle y escúchalo unas veces.',
        'En el compás 2 sube **C5** una fila (a **C#5**): ahora es **A**, La mayor. ¿Qué pasó con la nube?',
        'Devuélvelo y ahora baja **A4** en el compás 3 una fila (a **G#4**, nuestro La♭): ahora es **Fm**. Escucha cómo el final se vuelve dramático.',
        'Quédate con la versión que más te guste: es la base de un beat.',
      ],
      consejo: 'Para saber si un acorde es mayor o menor, cuenta las filas de la fundamental a la del medio: **4** = mayor, **3** = menor.',
      reflexion: '¿Qué versión te gustó más? ¿Pudiste oír el cambio de una sola nota antes de verlo?',
    },
  ],
}
