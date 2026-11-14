// Lección 3.6 — Pentatónicas.
// La pentatónica mayor (la mayor sin el 4.º ni el 7.º: T T T½ T T½) y la menor (la menor natural sin el 2.º ni el 6.º:
// T½ T T T½ T), por qué no chocan (no tienen semitonos), las teclas negras, la relativa y el oído (¿cinco o siete?,
// ¿dónde está la casa?, ¿se coló una nota?). Plan aprobado: https://claude.ai/artifact/1fWczUEx7tjSZFAyfUZF12
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas salen de src/theory/escalas.js (Tonal.js `Scale`: 'major pentatonic', 'minor pentatonic').
import {
  GRADOS_PENTA_MAYOR,
  GRADOS_PENTA_MENOR,
  PENTA_MAYOR,
  PENTA_MENOR,
  alteraciones,
  escalaMayor,
  melodia,
  nombresEscala,
  pentaMayor,
  pentaMenor,
} from '../../theory/escalas.js'

/** Las notas de una pentatónica en español: 'Do · Re · Mi · Sol · La' (con la octava si `octava`). */
const pentaEs = (tonica, menor = false, octava = false) =>
  nombresEscala(tonica, { tipo: menor ? 'minor pentatonic' : 'major pentatonic', octava })

/** Sonido de una escala o melodía (lista de notas), a paso tranquilo. */
const sonar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.34, duracion: 0.55 })
const cantar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.4, duracion: 0.6 })

/** Una melodía sobre el acorde de Do: el acorde suena debajo de cada nota (así se oye si choca). */
const ACORDE_DO = ['C3', 'G3', 'E4']
const sobreDo = (notas, etiqueta = 'Escuchar') => ({
  etiqueta,
  notas: notas.map((n) => [...ACORDE_DO, n]),
  intervalo: 0.42,
  duracion: 0.6,
})

/** Ronda «¿cinco o siete?»: una pentatónica o una escala completa. */
const OPCIONES_CUANTAS = ['Pentatónica (5 notas)', 'Escala completa (7)']
function cuantas(notas, penta, explicacion, pregunta = '¿Cuántas notas distintas tiene?') {
  return { pregunta, sonidos: [sonar(notas)], opciones: OPCIONES_CUANTAS, correcta: penta ? 0 : 1, explicacion }
}

/** Ronda «¿dónde está la casa?»: las mismas 5 notas, con la casa en la mayor o en su relativa menor. */
function casa(mayor, relativa, notas, menor, explicacion) {
  return {
    pregunta: '¿Dónde está la casa?',
    sonidos: [cantar(notas)],
    opciones: [`${mayor} pentatónica mayor`, `${relativa} pentatónica menor`],
    correcta: menor ? 1 : 0,
    explicacion,
  }
}

/** Ronda «¿se coló una nota?»: una melodía sobre el acorde de Do. */
const OPCIONES_COLADA = ['Solo pentatónica', 'Se coló una nota']
function colada(notas, intrusa, explicacion) {
  return { pregunta: '¿Se coló una nota de fuera?', sonidos: [sobreDo(notas)], opciones: OPCIONES_COLADA, correcta: intrusa ? 1 : 0, explicacion }
}

/** Fila de la tabla de pentatónicas mayores: nombre, notas, cuántas teclas negras usa y su sonido. */
function filaPenta(tonica) {
  return {
    nombre: `${pentaEs(tonica).split(' · ')[0]} pentatónica`,
    texto: pentaEs(tonica),
    dato: alteraciones(tonica, 'major pentatonic').length,
    sonido: sonar(pentaMayor(`${tonica}4`)),
  }
}

/** Riff de La pentatónica menor para el Piano Roll (1 compás, en casillas de medio tiempo). */
const RIFF = [
  { nota: 'A3', inicio: 0, duracion: 1 },
  { nota: 'C4', inicio: 1, duracion: 1 },
  { nota: 'D4', inicio: 2, duracion: 2 },
  { nota: 'E4', inicio: 4, duracion: 1 },
  { nota: 'D4', inicio: 5, duracion: 1 },
  { nota: 'G3', inicio: 6, duracion: 1 },
  { nota: 'A3', inicio: 7, duracion: 1 },
]

const PIANO = { startOctave: 4, octaves: 2 }

export default {
  id: '3.6',
  modulo: 3,
  titulo: 'Pentatónicas',
  subtitulo: 'Cinco notas que nunca chocan',
  minutos: 13,
  resumen: [
    'La **pentatónica mayor** es la escala mayor **sin el 4.º ni el 7.º**: grados 1 · 2 · 3 · 5 · 6, fórmula **T T T½ T T½**. Do pentatónica: Do · Re · Mi · Sol · La.',
    'Quita justo las dos notas que formaban **semitono**. Sin semitonos no hay choques: por eso casi cualquier combinación suena bien sobre los acordes de la tonalidad.',
    'Las **5 teclas negras** forman **Fa♯ pentatónica mayor**: tocar solo las negras siempre suena bien.',
    'La **pentatónica menor** usa las mismas notas desde la **relativa** (el 6.º grado): La · Do · Re · Mi · Sol, fórmula **T½ T T T½ T**, grados 1 · ♭3 · 4 · 5 · ♭7. Es la menor natural sin el 2.º ni el 6.º.',
    'Con las mismas notas, otra vez manda **la casa**: donde la melodía se apoya y termina. La mayor suena abierta y sencilla; la menor, de **riff**: rock, blues y trap.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído: dos melodías sobre el acorde de Do
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos melodías sobre el **mismo acorde de Do**. Una usa la escala completa; la otra, solo **5 notas**.',
      rondas: [
        {
          pregunta: '¿Cuál **nunca choca** con el acorde?',
          sonidos: [
            sobreDo(['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'E5', 'C5']),
            sobreDo(['E5', 'F5', 'G5', 'F5', 'E5', 'F5', 'B4', 'C5']),
          ],
          correcta: 0,
          mezclar: true,
          explicacion:
            'La que no choca usa solo **Do · Re · Mi · Sol · La**. La otra se apoya en **Fa**, a un semitono del Mi del acorde, y pasa por **Si**: ahí se oye el roce. Esas 5 notas son la **pentatónica**.',
        },
      ],
    },

    // 1 · L2 — La pentatónica mayor: la mayor sin el 4.º y el 7.º
    {
      tipo: 'texto',
      titulo: 'Cinco notas',
      parrafos: [
        '«Penta» es **cinco**. La **pentatónica mayor** es la escala mayor **sin el 4.º ni el 7.º** grado: en Do, sin **Fa** y sin **Si**.',
        'Esas dos son las que formaban los **semitonos** (Mi–Fa y Si–Do). Sin ellos, no queda ningún semitono y ninguna nota roza a otra.',
        'Quedan los grados **1 · 2 · 3 · 5 · 6**. Donde faltaba una nota aparece un salto de **tono y medio** (3 semitonos): lo escribimos **T½**.',
      ],
      sonidos: [sonar(escalaMayor('C4'), 'Do mayor: 7 notas'), sonar(pentaMayor('C4'), 'Do pentatónica: 5 notas')],
      nota: 'En inglés: **major pentatonic**. En FL Studio búscala en el **resaltado de escalas** del Piano roll (el nombre exacto cambia según la versión: *Major pentatonic*, *Pentatonic major*…).',
    },

    // 2 · P6 — Seguir la fórmula desde Do (con los grados)
    {
      tipo: 'tocar',
      titulo: 'Toca Do pentatónica',
      intro: 'Empiezas en **Do** (marcado). **T** salta una tecla; **T½** salta **dos**. Debajo, el **grado** de cada nota.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'C4',
            pasos: PENTA_MAYOR,
            grados: GRADOS_PENTA_MAYOR,
            titulo: '¡Do pentatónica!',
            mensaje: `${pentaEs('C', false, true)}. Los saltos **T½** caen donde estaban **Fa** (Mi → Sol) y **Si** (La → Do).`,
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · O2 — ¿Cinco o siete?
    {
      tipo: 'elegir',
      titulo: '¿Cinco o siete?',
      intro: 'Escucha la escala entera. La pentatónica tiene **huecos**: dos saltos más grandes.',
      rondas: [
        cuantas(pentaMayor('C4'), true, `**Pentatónica**: ${pentaEs('C')}. Se oyen los dos saltos, Mi → Sol y La → Do.`),
        cuantas(escalaMayor('G3'), false, 'Escala **completa**: Sol mayor, 7 notas, todas por pasos (T o S). No hay saltos.'),
        cuantas(pentaMayor('D4', { bajando: true }), true, `**Pentatónica**, bajando: ${pentaEs('D')}. Al revés también se notan los huecos.`),
        cuantas(escalaMayor('F4', { bajando: true }), false, 'Escala **completa**: Fa mayor bajando, con sus 7 notas y el Si♭.'),
      ],
    },

    // 4 · L2 — Las teclas negras (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Las teclas negras',
      parrafos: [
        'Las **5 teclas negras** forman una pentatónica: **Fa♯ pentatónica mayor**. Por eso tocar solo las negras siempre suena bien.',
        'Y al revés: **Do**, **Fa** y **Sol** pentatónica usan solo blancas. En Sol mayor, la única negra es **Fa♯**, su 7.º grado… justo el que la pentatónica quita.',
        'Toca cada fila para oírla:',
      ],
      fichas: {
        nombre: 'Pentatónica',
        dato: 'Negras',
        filas: ['C', 'G', 'D', 'F#'].map(filaPenta),
      },
    },

    // 5 · P6 — Fa♯ (todas negras) y Sol (sin grados)
    {
      tipo: 'tocar',
      titulo: 'Fa♯ y Sol',
      intro: 'La misma fórmula, **T T T½ T T½**. Primero solo negras; después, sin ayuda de los grados.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'F#4',
            pasos: PENTA_MAYOR,
            grados: GRADOS_PENTA_MAYOR,
            titulo: '¡Las 5 negras!',
            mensaje: `${pentaEs('F#', false, true)}: todas las teclas negras, una tras otra.`,
          },
          {
            desde: 'G4',
            pasos: PENTA_MAYOR,
            titulo: '¡Sol pentatónica!',
            mensaje: `${pentaEs('G', false, true)}. Sin negras: el **Fa♯** de Sol mayor es su 7.º y la pentatónica lo salta.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 6 · L2 — La pentatónica menor (las mismas notas desde la relativa)
    {
      tipo: 'texto',
      titulo: 'La pentatónica menor',
      parrafos: [
        'Toca las notas de Do pentatónica empezando en **La**, su relativa (el 6.º grado, como en la 3.4): **La · Do · Re · Mi · Sol**. Es la **pentatónica menor**.',
        'Su fórmula es **T½ T T T½ T** y sus grados, **1 · ♭3 · 4 · 5 · ♭7**: la menor natural **sin el 2.º ni el 6.º**. Tampoco tiene semitonos.',
        'Es la escala de los **solos de rock y blues** y de muchas melodías de **trap**: escucha la escala y un riff con ella.',
      ],
      sonidos: [
        sonar(pentaMenor('A3'), 'La pentatónica menor'),
        { etiqueta: 'Un riff', notas: RIFF.map((n) => n.nota), intervalo: 0.26, duracion: 0.35 },
      ],
      nota: 'En inglés: **minor pentatonic**. Muchos guitarristas aprenden primero esta escala que cualquier otra.',
    },

    // 7 · P6 — La y Mi pentatónica menor
    {
      tipo: 'tocar',
      titulo: 'Toca la pentatónica menor',
      intro: 'Ahora la fórmula empieza con el salto: **T½ T T T½ T**.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'A4',
            pasos: PENTA_MENOR,
            grados: GRADOS_PENTA_MENOR,
            titulo: '¡La pentatónica menor!',
            mensaje: `${pentaEs('A', true, true)}. Las mismas teclas que Do pentatónica, con la casa en La.`,
          },
          {
            desde: 'E4',
            pasos: PENTA_MENOR,
            titulo: '¡Mi pentatónica menor!',
            mensaje: `${pentaEs('E', true, true)}: la relativa de Sol pentatónica, otra vez solo blancas.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 8 · O2 — ¿Dónde está la casa? (mismas notas, mayor o relativa menor)
    {
      tipo: 'elegir',
      titulo: '¿Dónde está la casa?',
      intro: 'Las mismas 5 notas. Escucha dónde **empieza, se apoya y termina** la melodía.',
      rondas: [
        casa('Do', 'La', melodia('C4', [1, 2, 3, 5, 6, 5, 3, 1]), false, 'Casa en **Do**: empieza y termina en Do y pasa por Mi y Sol. Suena abierta: **Do pentatónica mayor**.'),
        casa('Do', 'La', melodia('A3', [1, 3, 4, 5, 7, 5, 4, 3, 1], 'minor'), true, 'Casa en **La**: sale de La y vuelve a La. Las mismas teclas, pero suena a riff: **La pentatónica menor**.'),
        casa('Sol', 'Mi', melodia('E4', [1, 3, 4, 5, 4, 3, 1], 'minor'), true, 'Casa en **Mi**: la melodía gira alrededor de Mi y termina ahí. **Mi pentatónica menor**, la relativa de Sol.'),
        casa('Sol', 'Mi', melodia('G4', [1, 3, 5, 6, 5, 2, 1]), false, 'Casa en **Sol**: termina en Sol después de pasar por La. **Sol pentatónica mayor**.'),
      ],
    },

    // 9 · R2 — Escribe un riff en La pentatónica menor
    {
      tipo: 'pianoroll',
      titulo: 'Escribe un riff',
      intro: 'Un riff de un compás con **La pentatónica menor**. Las notas punteadas son la guía.',
      roll: { rango: ['G3', 'A4'], columnas: 8, porTiempo: 2, bpm: 95 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: RIFF,
        instruccion: 'Copia el riff: **La · Do · Re** (larga) **· Mi · Re · Sol · La**.',
        pista: 'Cada fila es un semitono. El Re dura **dos** casillas; el Sol está **abajo**, antes del último La.',
        explicacion: 'Usa las 5 notas de La pentatónica menor y termina con **Sol → La** (el ♭7 que sube a casa): un final típico de rock. Pulsa **Reproducir**.',
      },
    },

    // 10 · O2 — ¿Se coló una nota? (sobre el acorde de Do)
    {
      tipo: 'elegir',
      titulo: '¿Se coló una nota?',
      intro: 'Melodías en **Do pentatónica** sobre el acorde de Do. En algunas se cuela **Fa** o **Si**.',
      rondas: [
        colada(['E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'A5', 'G5'], false, `**Solo pentatónica**: ${pentaEs('C')}. Ninguna roza al acorde.`),
        colada(['E5', 'G5', 'F5', 'E5', 'D5', 'C5', 'D5', 'C5'], true, 'Se coló **Fa** (la 3.ª nota): queda a un semitono del **Mi** del acorde y roza.'),
        colada(['A5', 'G5', 'E5', 'D5', 'E5', 'G5', 'E5', 'C5'], false, '**Solo pentatónica**: La, Sol, Mi, Re, Do. Fluye sin tensión.'),
        colada(['G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'B4', 'C5'], true, 'Se coló **Si** (la penúltima): la sensible, a un semitono de Do. Da otro color y pide resolver.'),
      ],
    },

    // 11 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué grados de la escala mayor quita la pentatónica mayor?',
          opciones: ['El 4.º y el 7.º', 'El 3.º y el 6.º', 'El 2.º y el 5.º'],
          correcta: 0,
          explicacion: 'El **4.º** y el **7.º** (en Do, Fa y Si): las dos notas que formaban semitono. Quedan 1 · 2 · 3 · 5 · 6.',
        },
        {
          pregunta: '¿Por qué la pentatónica casi nunca choca?',
          opciones: ['Porque solo usa teclas negras', 'Porque no tiene semitonos', 'Porque se toca más lento'],
          correcta: 1,
          explicacion: 'No tiene **ningún semitono**: ninguna nota roza a la de al lado. Solo Fa♯ pentatónica usa las negras; Do pentatónica es toda blanca.',
        },
        {
          pregunta: '¿Cuál es la relativa menor de **Sol pentatónica mayor**?',
          opciones: ['La pentatónica menor', 'Mi pentatónica menor', 'Re pentatónica menor'],
          correcta: 1,
          explicacion: `**Mi**: el 6.º grado de Sol. ${pentaEs('E', true)}, las mismas notas que ${pentaEs('G')}.`,
        },
        {
          pregunta: '¿Cuál es la fórmula de la pentatónica **menor**?',
          opciones: ['T T T½ T T½', 'T½ T T T½ T', 'T S T T S T T'],
          correcta: 1,
          explicacion: '**T½ T T T½ T**: empieza con el salto (La → Do). La primera es la mayor; la última, la menor natural de 7 notas.',
        },
      ],
    },

    // 12 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Las mismas 5 teclas, con la casa en Do o en La.',
      lados: [
        {
          etiqueta: 'Pentatónica mayor',
          emociones: 'Abierta, sencilla, sin tensión',
          ejemplos: '«Amazing Grace», muchas canciones infantiles, folk y country.',
          sonido: cantar(melodia('C4', [1, 2, 3, 5, 6, 8, 6, 5, 3, 1]), 'Escuchar Do pentatónica'),
        },
        {
          etiqueta: 'Pentatónica menor',
          emociones: 'Con actitud, de riff, un poco rasposa',
          ejemplos: 'El solo de «Stairway to Heaven» (Led Zeppelin), riffs de blues y rock, melodías de trap.',
          sonido: { etiqueta: 'Escuchar La pentatónica menor', notas: RIFF.map((n) => n.nota), intervalo: 0.26, duracion: 0.35 },
        },
      ],
      nota: 'Un adelanto: si a La pentatónica menor le sumas **Mi♭**, la «nota blue», sale la **escala de blues**: La · Do · Re · Mi♭ · Mi · Sol.',
    },

    // 13 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: un riff pentatónico',
      minutos: 15,
      objetivo: 'Escribir un riff con La pentatónica menor sobre un beat y pasarlo a Do pentatónica mayor cambiando solo la casa.',
      pasos: [
        'Arma un loop de batería de **4 compases** (bombo, caja y hi-hat) en el Channel rack.',
        'Abre el **Piano roll** de un piano o un sintetizador. Si tu versión lo trae, activa el **resaltado de escala** en pentatónica menor de **A**.',
        'Escribe un riff de **2 compases** usando solo **A, C, D, E y G**. Empieza y termina en **A**.',
        'Selecciónalo (**Ctrl + A**) y duplícalo con **Ctrl + B**. En la copia, mueve las notas para que se apoye y termine en **C**: las mismas 5 notas, ahora C pentatónica mayor.',
        'Escucha las dos versiones sobre el beat.',
      ],
      consejo: 'Si te trabas, prueba solo con las **teclas negras** (F#, G#, A#, C#, D#): es Fa♯ pentatónica y cualquier orden suena bien.',
      reflexion: '¿Cuál de las dos versiones va mejor con tu beat? ¿Notaste que con las mismas notas cambió el carácter?',
    },
  ],
}
