// Lección 3.7 — Menor armónica y melódica.
// La menor natural no tiene sensible: la armónica sube el 7.º (T S T T S T½ S) y deja un salto de tono y medio entre
// el 6.º y el 7.º; la melódica sube también el 6.º (T S T T T T S) y, en la versión clásica, baja como la natural.
// El acorde de Mi mayor → La menor suena solo de oído (se construye en el Módulo 4).
// Plan aprobado: https://claude.ai/artifact/3FXN7SLTPq292ixGtrpKpq
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas salen de src/theory/escalas.js (Tonal.js `Scale`: 'harmonic minor', 'melodic minor').
import {
  GRADOS_ARMONICA,
  GRADOS_MELODICA,
  MENOR_ARMONICA,
  MENOR_MELODICA,
  escalaArmonica,
  escalaMayor,
  escalaMelodica,
  escalaMenor,
  grado,
  melodia,
  melodicaClasica,
  nombresEscala,
} from '../../theory/escalas.js'
import { nombre } from '../../theory/notas.js'

/** Nombre en español de una nota sin octava ('F#' o 'F#4' → 'Fa♯'). */
const es = (n) => nombre(/\d/.test(n) ? n : `${n}4`, { octava: false })
/** Las notas de una menor en español: 'La · Si · Do · …' (tipo de Tonal: 'minor', 'harmonic minor', 'melodic minor'). */
const notasEs = (tonica, tipo, octava = false) => nombresEscala(tonica, { tipo, octava })
/** La sensible de una menor (el 7.º de la armónica): sensible('E') → 'D#'. */
const sensible = (tonica) => grado(tonica, 7, 'harmonic minor')

/** Sonido de una escala o melodía (lista de notas), a paso tranquilo. */
const sonar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.34, duracion: 0.55 })
const cantar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.4, duracion: 0.6 })
/** Acordes uno tras otro (cada uno, un array de notas a la vez). */
const acordes = (lista, etiqueta) => ({ etiqueta, notas: lista, intervalo: 0.9, duracion: 1.1 })

/** Los acordes del final: el 5.º grado (menor en la natural, mayor con la sensible) → la tónica. */
const AM = ['A3', 'C4', 'E4']
const EM = ['E3', 'G3', 'B3']
const E = ['E3', 'G#3', 'B3']

/** La frase del gancho: la misma, con el penúltimo Sol natural o Sol♯. */
const frase = (septimo) => ['E4', 'A4', 'C5', 'B4', 'A4', 'B4', septimo, 'A4']

/** Melodía por grados que pasa por el 6.º y el 7.º subiendo (8 = la tónica arriba; 0 = el 7.º de abajo). */
const SUBIDA = [5, 6, 7, 8, 5, 3, 2, 0, 1]

/** Ronda «¿natural o armónica?». */
const OPCIONES_NA = ['Natural', 'Armónica']
function naturalOArmonica(notas, armonica, explicacion, pregunta = '¿Natural o armónica?') {
  return { pregunta, sonidos: [sonar(notas)], opciones: OPCIONES_NA, correcta: armonica ? 1 : 0, explicacion }
}

/** Ronda «¿cuál de las tres?» (siempre subiendo: bajando, la melódica clásica es igual a la natural). */
const OPCIONES_TRES = ['Natural', 'Armónica', 'Melódica']
function cualDeLasTres(notas, correcta, explicacion) {
  return { pregunta: '¿Cuál de las tres menores?', sonidos: [sonar(notas)], opciones: OPCIONES_TRES, correcta, explicacion }
}

/** Final de un compás en La menor armónica para el Piano Roll (casillas de medio tiempo). */
const FINAL = [
  { nota: 'A3', inicio: 0, duracion: 1 },
  { nota: 'E3', inicio: 1, duracion: 1 },
  { nota: 'F3', inicio: 2, duracion: 1 },
  { nota: 'E3', inicio: 3, duracion: 1 },
  { nota: 'F3', inicio: 4, duracion: 1 },
  { nota: 'G#3', inicio: 5, duracion: 1 },
  { nota: 'A3', inicio: 6, duracion: 2 },
]

const PIANO = { startOctave: 4, octaves: 2 }

export default {
  id: '3.7',
  modulo: 3,
  titulo: 'Menor armónica y melódica',
  subtitulo: 'El 7.º que sube para llegar a casa',
  minutos: 14,
  resumen: [
    'La menor natural no tiene **sensible**: su 7.º está a **un tono** de casa (Sol → La) y llega flojo.',
    'La **menor armónica** sube el **7.º** un semitono: La · Si · Do · Re · Mi · Fa · **Sol♯**. Fórmula **T S T T S T½ S**, grados 1 · 2 · ♭3 · 4 · 5 · ♭6 · 7. Con la sensible, el acorde del 5.º se vuelve mayor (Mi mayor → La menor).',
    'Entre el 6.º y el 7.º de la armónica queda un salto de **tono y medio** (Fa → Sol♯): el sonido «árabe», flamenco o de película.',
    'La **menor melódica** sube también el **6.º** para quitar ese salto: La · Si · Do · Re · Mi · **Fa♯** · **Sol♯** (T S T T T T S). En la versión clásica, **al bajar vuelve a la natural**.',
    'Natural = melancólica y tranquila; armónica = dramática, con tensión que resuelve; melódica = más suave, entre menor y mayor.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído: el mismo final con Sol o con Sol♯
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'La misma frase en **La menor**, con dos finales distintos.',
      rondas: [
        {
          pregunta: '¿Cuál llega a casa con **más fuerza**?',
          sonidos: [cantar(frase('G#4')), cantar(frase('G4'))],
          correcta: 0,
          mezclar: true,
          explicacion:
            'La que pasa por **Sol♯**: está a **un semitono** de La y «tira» hacia casa. Es la **sensible**. Con **Sol** (a un tono) la frase llega, pero sin ese empujón.',
        },
      ],
    },

    // 1 · L2 — El 7.º que sube: la menor armónica
    {
      tipo: 'texto',
      titulo: 'El 7.º que sube',
      parrafos: [
        'En **Do mayor**, Si → Do es un **semitono**: la sensible empuja hacia casa. En **La menor natural**, Sol → La es **un tono**: no empuja igual.',
        'La solución: subir el 7.º un semitono, **Sol → Sol♯**. Así sale la **menor armónica**: La · Si · Do · Re · Mi · Fa · **Sol♯**.',
        'Se llama así por la **armonía**: con Sol♯, el acorde del 5.º grado se vuelve **mayor** (Mi · Sol♯ · Si) y lleva a La menor con mucha más fuerza. Escucha los dos finales:',
      ],
      sonidos: [
        sonar(escalaMenor('A3'), 'La menor natural'),
        sonar(escalaArmonica('A3'), 'La menor armónica'),
        acordes([EM, AM], 'Mi menor → La menor'),
        acordes([E, AM], 'Mi mayor → La menor'),
      ],
      nota: 'En inglés: **harmonic minor**. Los acordes se construyen en el **Módulo 4**; por ahora basta con oír la diferencia.',
    },

    // 2 · P6 — Toca La menor armónica (con los grados)
    {
      tipo: 'tocar',
      titulo: 'Toca La menor armónica',
      intro: 'Empiezas en **La** (marcado). Fíjate en el **T½** del final: entre Fa y Sol♯ hay que **saltar dos teclas**.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'A4',
            pasos: MENOR_ARMONICA,
            grados: GRADOS_ARMONICA,
            titulo: '¡La menor armónica!',
            mensaje: `${notasEs('A', 'harmonic minor', true)}. El **Sol♯** queda a un semitono de casa: la sensible.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · L2 — El salto de tono y medio
    {
      tipo: 'texto',
      titulo: 'El salto de tono y medio',
      parrafos: [
        'Al subir el Sol, entre **Fa** y **Sol♯** quedan **3 semitonos**. Son notas vecinas de nombre (Fa, Sol), pero suenan más lejos: es una **2.ª aumentada**.',
        'Ese salto es lo más reconocible de la armónica: el sonido **«árabe»**, del **flamenco** o de la música de **película de misterio**.',
      ],
      sonidos: [
        cantar(['E4', 'F4', 'G#4', 'A4'], 'Mi · Fa · Sol♯ · La'),
        cantar(['A4', 'G#4', 'F4', 'E4', 'F4', 'G#4', 'A4'], 'Ida y vuelta'),
        sonar(escalaArmonica('A3', { bajando: true }), 'La armónica bajando'),
      ],
    },

    // 4 · O2 — ¿Natural o armónica?
    {
      tipo: 'elegir',
      titulo: '¿Natural o armónica?',
      intro: 'Escucha el final de cada escala: ¿hay salto antes de llegar a casa?',
      rondas: [
        naturalOArmonica(escalaArmonica('A3'), true, `**Armónica**: ${notasEs('A', 'harmonic minor')}. Se oye el salto Fa → Sol♯ y el semitono hasta La.`),
        naturalOArmonica(escalaMenor('E4', { bajando: true }), false, `**Natural**, bajando: ${notasEs('E', 'minor')}. Todo por pasos, sin salto: Mi → **Re** es un tono.`),
        naturalOArmonica(escalaArmonica('D4', { bajando: true }), true, `**Armónica**, bajando: Re → **Do♯** (semitono) y luego el salto **Do♯ → Si♭**.`),
        naturalOArmonica(
          melodia('A3', [1, 3, 5, 6, 5, 4, 3, 2, 0, 1], 'harmonic minor'),
          true,
          'Una melodía en **La menor armónica**: antes del final baja a **Sol♯** y sube un semitono a La.',
          '¿Natural o armónica? (melodía)',
        ),
        naturalOArmonica(
          melodia('E4', [1, 2, 3, 4, 5, 4, 3, 2, 0, 1], 'minor'),
          false,
          'Una melodía en **Mi menor natural**: antes del final pasa por **Re**, a un tono de Mi.',
          '¿Natural o armónica? (melodía)',
        ),
      ],
    },

    // 5 · P7 — Encuentra la sensible (un semitono por debajo de la tónica)
    {
      tipo: 'tocar',
      titulo: 'Encuentra la sensible',
      intro: 'La tónica está marcada. En la **menor armónica**, la sensible está **un semitono por debajo**.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          {
            desde: 'A4',
            intervalo: '2m',
            direccion: 'baja',
            grado: 'la sensible',
            pista: 'La tecla de al lado, hacia la izquierda: la **negra** entre Sol y La.',
            mensaje: `La sensible de La menor es **${es(sensible('A'))}**.`,
          },
          {
            desde: 'E4',
            intervalo: '2m',
            direccion: 'baja',
            grado: 'la sensible',
            pista: 'Un semitono por debajo de Mi: la **negra** entre Re y Mi.',
            mensaje: `La sensible de Mi menor es **${es(sensible('E'))}**: en la natural sería Re.`,
          },
          {
            desde: 'D4',
            intervalo: '2m',
            direccion: 'baja',
            grado: 'la sensible',
            pista: 'Un semitono por debajo de Re: la **negra** entre Do y Re.',
            mensaje: `La sensible de Re menor es **${es(sensible('D'))}**: en la natural sería Do.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 6 · L2 — La menor melódica
    {
      tipo: 'texto',
      titulo: 'La menor melódica',
      parrafos: [
        'El salto Fa → Sol♯ es difícil de **cantar**. La **menor melódica** lo quita subiendo también el **6.º**: La · Si · Do · Re · Mi · **Fa♯** · **Sol♯**.',
        'Al **bajar** ya no hace falta la sensible, así que en la versión clásica vuelve a la **natural**: Sol y Fa otra vez.',
      ],
      sonidos: [
        sonar(melodicaClasica('A3'), 'Melódica: sube y baja'),
        sonar(escalaArmonica('A3'), 'Armónica, para comparar'),
      ],
      nota: 'En inglés: **melodic minor**. En el **jazz** se usa igual al subir y al bajar.',
    },

    // 7 · P6 — Toca La menor melódica (con los grados)
    {
      tipo: 'tocar',
      titulo: 'Toca La menor melódica',
      intro: 'Ahora sin salto: **T S T T T T S**.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'A4',
            pasos: MENOR_MELODICA,
            grados: GRADOS_MELODICA,
            titulo: '¡La menor melódica!',
            mensaje: `${notasEs('A', 'melodic minor', true)}. Solo el **Do** (♭3) la separa de **La mayor**.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 8 · L2 — Las tres menores (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Las tres menores',
      parrafos: ['Las tres empiezan igual: **La · Si · Do · Re · Mi**. Solo cambian el **6.º** y el **7.º**. Toca cada fila:'],
      fichas: {
        nombre: 'La menor',
        dato: 'Suben',
        filas: [
          { nombre: 'Natural', texto: 'Fa · Sol', dato: 0, sonido: sonar(escalaMenor('A3')) },
          { nombre: 'Armónica', texto: 'Fa · Sol♯ (sube el 7.º)', dato: 1, sonido: sonar(escalaArmonica('A3')) },
          { nombre: 'Melódica', texto: 'Fa♯ · Sol♯ (suben el 6.º y el 7.º)', dato: 2, sonido: sonar(escalaMelodica('A3')) },
        ],
      },
    },

    // 9 · O2 — ¿Cuál de las tres? (siempre subiendo)
    {
      tipo: 'elegir',
      titulo: '¿Cuál de las tres?',
      intro: 'Todas **suben**. Escucha las últimas notas: ¿salto, dos notas altas o ninguna?',
      rondas: [
        cualDeLasTres(escalaMelodica('A3'), 2, `**Melódica**: ${notasEs('A', 'melodic minor')}. Sube derecho hasta casa, sin salto, con Fa♯ y Sol♯.`),
        cualDeLasTres(escalaArmonica('E4'), 1, `**Armónica**: ${notasEs('E', 'harmonic minor')}. El salto **Do → Re♯** delata la sensible.`),
        cualDeLasTres(escalaMenor('D4'), 0, `**Natural**: ${notasEs('D', 'minor')}. Llega a Re desde **Do**, a un tono.`),
        cualDeLasTres(escalaMelodica('G3'), 2, `**Melódica**: ${notasEs('G', 'melodic minor')}. Mi y Fa♯ suben suaves hasta Sol.`),
        cualDeLasTres(escalaArmonica('D4'), 1, `**Armónica**: ${notasEs('D', 'harmonic minor')}. Si♭ → **Do♯**, el salto de tono y medio.`),
      ],
    },

    // 10 · P6 — Ahora sin grados: Mi armónica y Re melódica
    {
      tipo: 'tocar',
      titulo: 'Ahora sin grados',
      intro: 'Las mismas fórmulas en otras tónicas, sin ayuda.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'E4',
            pasos: MENOR_ARMONICA,
            titulo: '¡Mi menor armónica!',
            mensaje: `${notasEs('E', 'harmonic minor', true)}. La sensible es **Re♯**.`,
          },
          {
            desde: 'D4',
            pasos: MENOR_MELODICA,
            titulo: '¡Re menor melódica!',
            mensaje: `${notasEs('D', 'melodic minor', true)}. Suben el 6.º (**Si**) y el 7.º (**Do♯**).`,
          },
        ],
      },
      piano: { ...PIANO, showLabels: false },
    },

    // 11 · L2 — La misma melodía en las tres menores
    {
      tipo: 'texto',
      titulo: 'La misma melodía, tres colores',
      parrafos: [
        'La misma melodía en **La menor**, pasando por el 6.º y el 7.º. Solo cambian esas dos notas.',
        'Toca cada fila:',
      ],
      fichas: {
        nombre: 'La menor',
        dato: '7.º',
        filas: [
          { nombre: 'Natural', texto: 'Tranquila, sin prisa', dato: 'Sol', sonido: cantar(melodia('A3', SUBIDA, 'minor')) },
          { nombre: 'Armónica', texto: 'Con salto y tensión', dato: 'Sol♯', sonido: cantar(melodia('A3', SUBIDA, 'harmonic minor')) },
          { nombre: 'Melódica', texto: 'Sube suave, más luminosa', dato: 'Sol♯', sonido: cantar(melodia('A3', SUBIDA, 'melodic minor')) },
        ],
      },
    },

    // 12 · R2 — Escribe el final con sensible
    {
      tipo: 'pianoroll',
      titulo: 'Escribe el final',
      intro: 'Un compás en **La menor armónica** que termina con la sensible. Las notas punteadas son la guía.',
      roll: { rango: ['E3', 'A3'], columnas: 8, porTiempo: 2, bpm: 90 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: FINAL,
        instruccion: 'Copia el final: **La · Mi · Fa · Mi · Fa · Sol♯ · La** (larga).',
        pista: 'Cada fila es un semitono. **Sol♯** está justo debajo de **La**; el último La dura **dos** casillas.',
        explicacion: 'Fa → **Sol♯** es el salto de tono y medio y Sol♯ → La, el semitono que llega a casa. Pulsa **Reproducir**.',
      },
    },

    // 13 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué grado sube la menor **armónica**?',
          opciones: ['El 3.º', 'El 6.º', 'El 7.º'],
          correcta: 2,
          explicacion: 'El **7.º**: así queda a un semitono de casa y se vuelve **sensible** (Sol → Sol♯ en La menor).',
        },
        {
          pregunta: '¿Cuál tiene un salto de **tono y medio**?',
          opciones: ['La natural', 'La armónica', 'La melódica'],
          correcta: 1,
          explicacion: 'La **armónica**, entre el 6.º y el 7.º (Fa → Sol♯). La melódica lo quita subiendo también el 6.º.',
        },
        {
          pregunta: 'En la versión clásica, ¿qué hace la melódica al **bajar**?',
          opciones: ['Repite las mismas notas', 'Vuelve a la natural', 'Se vuelve armónica'],
          correcta: 1,
          explicacion: 'Vuelve a la **natural**: al bajar no hace falta la sensible. En el jazz, en cambio, se usa igual en los dos sentidos.',
        },
        {
          pregunta: '¿Cuál es la sensible de **Re menor**?',
          opciones: ['Do', 'Do♯', 'Si♭'],
          correcta: 1,
          explicacion: `**${es(sensible('D'))}**: un semitono por debajo de Re. En la natural sería Do, a un tono.`,
        },
        {
          pregunta: '¿Qué notas suben en **Mi menor melódica**?',
          opciones: ['Do♯ y Re♯', 'Fa♯ y Sol♯', 'Solo Re♯'],
          correcta: 0,
          explicacion: `El 6.º y el 7.º: **Do♯** y **Re♯**. ${notasEs('E', 'melodic minor')}. Solo Re♯ sería la armónica.`,
        },
      ],
    },

    // 14 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma melodía en La menor, con el 7.º natural o con sensible.',
      lados: [
        {
          etiqueta: 'Menor natural',
          emociones: 'Melancólica, tranquila, sin prisa por llegar',
          ejemplos: '«Losing My Religion» (R.E.M.), mucho lo-fi, baladas y reguetón de tono oscuro.',
          sonido: cantar(melodia('A3', SUBIDA, 'minor'), 'Escuchar la natural'),
        },
        {
          etiqueta: 'Menor armónica',
          emociones: 'Dramática, exótica, con tensión que resuelve',
          ejemplos: 'El flamenco, la música de Medio Oriente, «Para Elisa» (el Sol♯ antes de volver a La), trap y drill oscuros, bandas sonoras.',
          sonido: cantar(melodia('A3', SUBIDA, 'harmonic minor'), 'Escuchar la armónica'),
        },
      ],
      nota: 'La **melódica** suena más suave, entre menor y mayor: muy usada en el **jazz** y en la música clásica.',
    },

    // 15 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: el final con sensible',
      minutos: 15,
      objetivo: 'Escribir una melodía en A menor natural y darle un final con sensible cambiando una sola nota.',
      pasos: [
        'Abre el **Piano roll** de un piano. Si tu versión lo trae, activa el **resaltado de escala** en **A Minor**.',
        'Escribe una melodía de **4 compases** que termine en **A** (alrededor de **A4**, nuestro La3) y que pase por **G** antes de llegar.',
        'Selecciónala (**Ctrl + A**) y duplícala con **Ctrl + B**.',
        'En la copia, sube cada **G** una fila: **G#**. Si usas el resaltado, cámbialo a **Harmonic minor**.',
        'Extra: en otro canal, debajo del último compás pon el acorde **E · G# · B** y después **A · C · E**.',
      ],
      consejo: 'Si cambias también cada **F** por **F#** en las partes que suben, tienes la **melódica**.',
      reflexion: '¿Qué cambió al llegar a casa en la segunda versión? ¿Cuál va mejor con un beat oscuro?',
    },
  ],
}
