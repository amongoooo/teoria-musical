// Lección 3.3 — La escala mayor.
// La fórmula T T S T T T S (adelantada en la 3.1) en varias tonalidades (Do, Sol, Re, Fa), sus alteraciones,
// los grados (tónica, dominante, sensible…) y el oído: ¿escala mayor u otra cosa?, ¿termina en casa?
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas de las escalas y los grados salen de src/theory/escalas.js (Tonal.js `Scale`).
import {
  GRADOS,
  MAYOR,
  armadura,
  escalaCambiada,
  escalaMayor,
  grado,
  nombresEscala,
  ordinal,
} from '../../theory/escalas.js'
import { nombre } from '../../theory/notas.js'

/** Nombre en español de una nota sin octava ('F#' o 'F#4' → 'Fa♯'). */
const es = (n) => nombre(/\d/.test(n) ? n : `${n}4`, { octava: false })
/** Nombre en español del grado `n` de la escala mayor de `tonica`: gradoEs('D', 7) → 'Do♯'. */
const gradoEs = (tonica, n) => es(grado(tonica, n))

/** Sonido de una escala (lista de notas), a paso tranquilo. */
const sonar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.34, duracion: 0.55 })

/** Ronda «¿escala mayor u otra cosa?»: `cambio` = { grado, semitonos } o null si es mayor. */
const OPCIONES_MAYOR = ['Escala mayor', 'Otra cosa']
function mayorONo(tonica, cambio, explicacion, { bajando = false } = {}) {
  const notas = cambio ? escalaCambiada(tonica, cambio, { bajando }) : escalaMayor(tonica, { bajando })
  return {
    pregunta: bajando ? '¿Es una escala mayor? (baja)' : '¿Es una escala mayor?',
    sonidos: [sonar(notas)],
    opciones: OPCIONES_MAYOR,
    correcta: cambio ? 1 : 0,
    explicacion,
  }
}

/** Ronda «¿termina en casa?»: la escala de `tonica` cortada en `notas` notas. */
const OPCIONES_CASA = ['Termina en casa', 'Se queda colgada']
function casa(tonica, cuantas, explicacion, { bajando = false } = {}) {
  const notas = escalaMayor(tonica, { bajando }).slice(0, cuantas)
  return {
    pregunta: bajando ? '¿Dónde se para? (baja)' : '¿Dónde se para?',
    sonidos: [sonar(notas)],
    opciones: OPCIONES_CASA,
    correcta: cuantas === 8 ? 0 : 1,
    explicacion,
  }
}

/** Fila de la tabla de tonalidades: nombre, notas, alteraciones y su sonido. */
function tonalidad(tonica) {
  return {
    nombre: `${es(tonica)} mayor`,
    texto: nombresEscala(tonica),
    dato: armadura(tonica),
    sonido: sonar(escalaMayor(tonica)),
  }
}

/** Fila de la tabla de grados (en Do mayor): nombre del grado, su papel y la nota; suena desde la tónica. */
const PAPEL = [
  'La casa: donde todo reposa',
  'Justo encima de la tónica',
  'Decide el color: mayor o menor',
  'Se aleja de casa',
  'La más fuerte tras la tónica',
  'Encima de la dominante',
  'A un semitono de casa: tira hacia ella',
]
function filaGrado(n) {
  const notas = escalaMayor('C4')
  const sonido =
    n === 1
      ? { notas: ['C4'], duracion: 1 }
      : n === 7
        ? { notas: ['C4', 'B4', 'C5'], intervalo: 0.55, duracion: 0.8 }
        : { notas: ['C4', notas[n - 1]], intervalo: 0.6, duracion: 0.9 }
  return { nombre: `${ordinal(n)} · ${GRADOS[n - 1]}`, texto: PAPEL[n - 1], dato: es(notas[n - 1]), sonido }
}

const PIANO = { startOctave: 4, octaves: 2 }

export default {
  id: '3.3',
  modulo: 3,
  titulo: 'La escala mayor',
  subtitulo: 'Una fórmula, todas las tonalidades',
  minutos: 15,
  resumen: [
    'La **escala mayor** sigue la fórmula **T T S T T T S** desde cualquier nota. Los semitonos caen entre el **3.º y el 4.º** grado y entre el **7.º y la octava**.',
    'La nota de partida es la **tónica** y le da nombre: **Sol mayor**, **Re mayor**… Cada letra sale **una sola vez**, así que nunca se mezclan ♯ y ♭.',
    'Alteraciones: **Do** ninguna · **Sol** Fa♯ · **Re** Fa♯ y Do♯ · **Fa** Si♭.',
    'Los **grados** numeran las notas desde la tónica. Mandan tres: **tónica** (1.º, casa), **dominante** (5.º) y **sensible** (7.º, a un semitono de casa).',
    'De oído, la mayor suena **luminosa y completa**; si cambia un solo paso, el oído lo nota.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Las dos escalas empiezan en **Sol** y solo cambian **una nota**.',
      rondas: [
        {
          pregunta: '¿Cuál suena «completa», como el Do-Re-Mi de siempre?',
          sonidos: [sonar(escalaMayor('G3')), sonar(escalaCambiada('G3', { grado: 7, semitonos: -1 }))],
          correcta: 0,
          mezclar: true,
          explicacion:
            'La completa usa **Fa♯**: la penúltima nota queda a **un semitono** de Sol y «tira» hacia casa. Con Fa se pierde ese tirón. Es la **escala mayor**.',
        },
      ],
    },

    // 1 · L2 — La fórmula de la escala mayor
    {
      tipo: 'texto',
      titulo: 'Una fórmula para todas',
      parrafos: [
        'La **escala mayor** es la del **Do-Re-Mi**: 7 notas distintas y la 8.ª, que es la primera una octava más arriba.',
        'Sus pasos siguen siempre la fórmula **T T S T T T S** (T = tono, S = semitono). Los dos semitonos caen entre la **3.ª y la 4.ª** nota y entre la **7.ª y la 8.ª**.',
        'Desde **Do** salen solo teclas blancas. Desde cualquier otra nota, la fórmula te dirá qué negras usar.',
      ],
      sonidos: [sonar(escalaMayor('C4'), 'Do mayor, subiendo'), sonar(escalaMayor('C4', { bajando: true }), 'Do mayor, bajando')],
      nota: 'En inglés: **major scale**. En FL Studio la verás como **Major** (o **Ionian**) en el resaltado de escalas del Piano roll.',
    },

    // 2 · P6 — Seguir la fórmula desde Do (repaso, con los grados debajo)
    {
      tipo: 'tocar',
      titulo: 'Toca Do mayor',
      intro: 'Empiezas en **Do** (marcado). **T** salta una tecla; **S** va a la de al lado. Debajo, el **grado** de cada nota.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'C4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡Do mayor!',
            mensaje: 'Do · Re · Mi · Fa · Sol · La · Si · Do. Los semitonos, **Mi–Fa** (3.º–4.º) y **Si–Do** (7.º–8.º), caen donde no hay negras.',
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · L2 — Tonalidades: la tónica da el nombre; cada letra una vez
    {
      tipo: 'texto',
      titulo: 'Otra tónica, otra tonalidad',
      parrafos: [
        'La nota de partida es la **tónica** y da nombre a la escala: desde Sol, **Sol mayor**. Su conjunto de notas es la **tonalidad** de Sol mayor.',
        'Regla de oro: **cada letra sale una vez**, en orden. Por eso Sol mayor usa **Fa♯** (no Sol♭) y Fa mayor usa **Si♭** (no La♯): nunca se mezclan ♯ y ♭.',
        'Toca cada fila para oírla: suenan igual de «mayores», solo más agudas o más graves.',
      ],
      fichas: {
        nombre: 'Tonalidad',
        dato: 'Alteraciones',
        filas: ['C4', 'G4', 'D4', 'F4'].map(tonalidad),
      },
    },

    // 4 · P6 — Seguir la fórmula desde Sol y Re (con nombres)
    {
      tipo: 'tocar',
      titulo: 'Sol mayor y Re mayor',
      intro: 'La misma fórmula. Fíjate en qué paso necesitas una **negra**.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'G4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡Sol mayor!',
            mensaje: `${nombresEscala('G', { octava: true })}. El 7.º grado es **Fa♯**: de Mi a Fa habría un semitono y ahí la fórmula pide un **tono**.`,
          },
          {
            desde: 'D4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡Re mayor!',
            mensaje: `${nombresEscala('D', { octava: true })}. Dos negras: **Fa♯** (3.º) y **Do♯** (7.º). Cada una cae justo antes de un semitono.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 5 · O2 — ¿Escala mayor u otra cosa? (cambios grandes, desde Do y Sol)
    {
      tipo: 'elegir',
      titulo: '¿Mayor u otra cosa?',
      intro: 'Escucha la escala entera. Si **un solo paso** no sigue la fórmula, ya no es mayor.',
      rondas: [
        mayorONo('C4', null, 'Es **Do mayor**: T T S T T T S. Suena luminosa y llega a casa con el semitono **Si–Do**.'),
        mayorONo(
          'C4',
          { grado: 3, semitonos: -1 },
          'Otra cosa: el **3.º grado** bajó a **Mi♭**. Fíjate cómo se oscurece: la 3.ª decide el color (mayor o menor, como en la 3.2).',
        ),
        mayorONo(
          'G4',
          null,
          `Es **Sol mayor**: ${nombresEscala('G')}. Con **Fa♯** la fórmula se cumple y suena igual de «mayor» que Do.`,
        ),
        mayorONo(
          'C4',
          { grado: 7, semitonos: -1 },
          'Otra cosa: el **7.º** bajó a **Si♭**. De Si♭ a Do hay un **tono**, así que al final no hay semitono que «tire» hacia casa.',
        ),
      ],
    },

    // 6 · L2 — Los grados (fichas de Do mayor)
    {
      tipo: 'texto',
      titulo: 'Los grados de la escala',
      parrafos: [
        'Cada nota de la escala es un **grado**, numerado desde la tónica: 1.º, 2.º… hasta el 7.º. La 8.ª ya es otra vez la tónica.',
        `Los números valen en **cualquier tonalidad**: el 5.º de Do es ${gradoEs('C', 5)}; el 5.º de Re es ${gradoEs('D', 5)}.`,
        'Mandan tres: la **tónica** (casa), la **dominante** (5.º) y la **sensible** (7.º), que está a un semitono de casa y pide resolver. Toca cada fila (en Do mayor):',
      ],
      fichas: {
        nombre: 'Grado',
        dato: 'En Do',
        filas: [1, 2, 3, 4, 5, 6, 7].map(filaGrado),
      },
    },

    // 7 · O2 — ¿Termina en casa?
    {
      tipo: 'elegir',
      titulo: '¿Termina en casa?',
      intro: 'La escala se para en algún grado. ¿Llega a la **tónica** o se queda colgada?',
      rondas: [
        casa('C4', 7, 'Colgada: se para en **Si**, la **sensible** (7.º). Está a un semitono de Do y el oído pide ese último paso.'),
        casa('G4', 8, 'En casa: termina en **Sol**, la **tónica** de Sol mayor. Reposa.'),
        casa('C4', 5, 'Colgada: se para en **Sol**, la **dominante** (5.º). Suena firme, pero todavía no es casa.'),
        casa('D4', 8, 'En casa: baja hasta **Re**, la tónica de Re mayor.', { bajando: true }),
        casa('F4', 7, `Colgada: baja y se para en **${gradoEs('F', 2)}**, el 2.º grado de Fa mayor. Le falta un paso para volver a Fa.`, { bajando: true }),
      ],
    },

    // 8 · P6 — Seguir la fórmula desde Fa y Re (sin nombres)
    {
      tipo: 'tocar',
      titulo: 'Ahora sin nombres',
      intro: 'Las teclas ya no dicen su nombre. Confía en la fórmula: **T** salta una tecla, **S** va a la de al lado.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'F4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡Fa mayor!',
            mensaje: `${nombresEscala('F', { octava: true })}. El 4.º grado es **Si♭**: de La a Si habría un tono y la fórmula pide un **semitono**.`,
          },
          {
            desde: 'D4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡Re mayor, sin ayuda!',
            mensaje: `${nombresEscala('D', { octava: true })}. **Fa♯** y **Do♯**, de memoria.`,
          },
        ],
      },
      piano: { ...PIANO, showLabels: false },
    },

    // 9 · O3 — Encuentra el grado (calculado con Tonal)
    {
      tipo: 'elegir',
      titulo: 'Encuentra el grado',
      rondas: [
        {
          pregunta: '¿Cuál es la **dominante** (5.º) de Sol mayor?',
          opciones: [gradoEs('G', 4), gradoEs('G', 5), gradoEs('G', 6)],
          correcta: 1,
          explicacion: `Cuenta 5 desde Sol: Sol (1) · La · Si · Do · **${gradoEs('G', 5)}** (5).`,
        },
        {
          pregunta: '¿Cuál es la **sensible** (7.º) de Re mayor?',
          opciones: ['Do', gradoEs('D', 7), 'Si'],
          correcta: 1,
          explicacion: `**${gradoEs('D', 7)}**: a un semitono de Re. Con Do quedaría un tono y no «tiraría» hacia casa.`,
        },
        {
          pregunta: '¿Cuál es el **4.º grado** de Fa mayor?',
          opciones: [gradoEs('F', 4), 'Si', 'Do'],
          correcta: 0,
          explicacion: `**${gradoEs('F', 4)}**. De La (3.º) al 4.º la fórmula pide un **semitono**, y de La a Si habría un tono.`,
        },
        {
          pregunta: 'En Do mayor, ¿qué grado es **Sol**?',
          opciones: ['El 4.º (subdominante)', 'El 5.º (dominante)', 'El 6.º'],
          correcta: 1,
          explicacion: 'Do (1) · Re (2) · Mi (3) · Fa (4) · **Sol (5)**: la **dominante**. Siempre está a una **5.ª justa** de la tónica.',
        },
      ],
    },

    // 10 · R2 — Escribir Re mayor en el Piano Roll (sin guía)
    {
      tipo: 'pianoroll',
      titulo: 'Escríbela en el Piano Roll',
      intro: 'Cada fila es un **semitono**: un **tono** = saltar 2 filas.',
      roll: { rango: ['D4', 'D5'], columnas: 8, porTiempo: 2, bpm: 100 },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Dibuja **Re mayor** subiendo: una nota por casilla, de **Re4** a **Re5**.',
        notas: escalaMayor('D4').map((nota, i) => ({ nota, inicio: i, duracion: 1 })),
        pista: 'T = 2 filas, S = 1 fila. Re mayor lleva **Fa♯** y **Do♯**.',
        explicacion: `${nombresEscala('D', { octava: true })}. En FL es igual: **cuenta filas**. Pulsa **Reproducir** para oírla.`,
      },
    },

    // 11 · O2 — ¿Escala mayor u otra cosa? (más fino: otras tónicas y bajando)
    {
      tipo: 'elegir',
      titulo: 'Afina el oído',
      intro: 'Más difícil: otras tónicas, escalas que bajan y cambios de **un semitono**.',
      rondas: [
        mayorONo('D4', null, `Es **Re mayor**, bajando desde Re. Sus notas: ${nombresEscala('D')}. Al revés también se reconoce.`, { bajando: true }),
        mayorONo(
          'F4',
          { grado: 4, semitonos: 1 },
          'Otra cosa: el **4.º** subió a **Si** (en Fa mayor es Si♭). Suena «flotante»: de La a Si queda un tono donde la fórmula pide un semitono.',
        ),
        mayorONo(
          'D4',
          { grado: 3, semitonos: -1 },
          'Otra cosa: el **3.º** es **Fa** en lugar de Fa♯. Con la 3.ª menor la escala se oscurece.',
        ),
        mayorONo('F4', null, `Es **Fa mayor**: ${nombresEscala('F')}. Con Si♭ la fórmula se cumple.`),
        mayorONo(
          'G4',
          { grado: 7, semitonos: -1 },
          'Otra cosa: el **7.º** es **Fa** en lugar de Fa♯. Bajando cuesta más oírlo: falta el semitono que da brillo junto a la tónica.',
          { bajando: true },
        ),
      ],
    },

    // 12 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cuál es la fórmula de la escala mayor?',
          opciones: ['T T S T T T S', 'T S T T S T T', 'T T T T T T'],
          correcta: 0,
          explicacion: '**T T S T T T S**: los semitonos van entre el 3.º y el 4.º y entre el 7.º y la octava. (La de solo tonos es la de **tonos enteros** de la 3.1.)',
        },
        {
          pregunta: '¿Por qué Sol mayor usa Fa♯ y no Sol♭?',
          opciones: ['Porque suena distinto', 'Porque cada letra sale una sola vez', 'Porque las escalas solo usan ♯'],
          correcta: 1,
          explicacion: 'Fa♯ y Sol♭ son la **misma tecla**, pero Sol ya está (es la tónica). Cada letra va **una vez**: Sol La Si Do Re Mi **Fa♯**.',
        },
        {
          pregunta: '¿Qué grado está a un semitono de la tónica y «tira» hacia ella?',
          opciones: ['La dominante (5.º)', 'La sensible (7.º)', 'La mediante (3.º)'],
          correcta: 1,
          explicacion: 'La **sensible**. Por eso una melodía que se para en el 7.º suena colgada.',
        },
        {
          pregunta: '¿Cuántas alteraciones tiene Re mayor?',
          opciones: ['Ninguna', `Una (${gradoEs('D', 3)})`, `Dos (${gradoEs('D', 3)} y ${gradoEs('D', 7)})`],
          correcta: 2,
          explicacion: `Dos sostenidos: **${gradoEs('D', 3)}** y **${gradoEs('D', 7)}**. Sol mayor tiene uno (Fa♯) y Fa mayor un bemol (Si♭).`,
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente? (adelanto de la menor, 3.4)
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma tónica, Do, con dos fórmulas distintas.',
      lados: [
        {
          etiqueta: 'Escala mayor',
          emociones: 'Luminosa, alegre, estable',
          ejemplos: '«Do-Re-Mi» (de «Sonrisas y lágrimas»), «Cumpleaños feliz», el «Himno de la alegría». Pop, himnos, canciones infantiles.',
          sonido: sonar(escalaMayor('C4'), 'Escuchar Do mayor'),
        },
        {
          etiqueta: 'Escala menor',
          emociones: 'Melancólica, íntima, seria',
          ejemplos: 'Baladas tristes, trap oscuro, bandas sonoras de suspenso. Bajan el 3.º, el 6.º y el 7.º.',
          sonido: sonar(['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'], 'Escuchar Do menor'),
        },
      ],
      nota: 'La menor tiene su propia fórmula (**T S T T S T T**): la verás en la **lección 3.4**.',
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: escalas mayores en el Piano Roll',
      minutos: 15,
      objetivo: 'Escribir la escala mayor en varias tonalidades contando filas y usarla en una melodía.',
      pasos: [
        'Abre el **Piano roll** de un piano. Desde **C5** (nuestro Do4), dibuja la fórmula **T T S T T T S** subiendo: una nota por casilla. Solo filas blancas.',
        'En el compás siguiente, escribe **G mayor** desde G4 contando filas (T = 2, S = 1). Comprueba que aparece **F#**.',
        'Haz lo mismo con **D mayor** (F# y C#) y **F mayor** (A#, que es nuestro **Si♭**: FL lo llama con sostenido).',
        'Si tu versión lo trae, activa el **resaltado de escala** del Piano roll (busca *Scale highlighting* en el menú del Piano roll) y elige la tonalidad: las filas de la escala se marcan.',
        'Escribe una melodía de **8 notas** usando solo notas de **D mayor** y termina en **D**. Luego cámbiala para que termine en **C#** y escucha cómo se queda colgada.',
      ],
      consejo: 'Si te pierdes, dibuja la escala de Do y súbela con **Shift + ↑** (un semitono por pulsación): la fórmula se mantiene y aparecen solas las negras de la nueva tonalidad.',
      reflexion: '¿En qué tonalidad te resultó más cómodo escribir? ¿Notaste el tirón de la sensible al final de tu melodía?',
    },
  ],
}
