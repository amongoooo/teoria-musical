// Lección 3.4 — La escala menor natural y la relativa.
// La fórmula T S T T S T T (La, Mi, Re y Sol menor), la relativa menor como 6.º grado de la mayor (misma armadura),
// el oído (¿mayor o menor?, ¿mayor o su relativa menor?) y la misma melodía en mayor y en menor.
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas de las escalas, los grados y las relativas salen de src/theory/escalas.js (Tonal.js `Scale`).
import {
  MAYOR,
  MENOR,
  armadura,
  escalaMayor,
  escalaMenor,
  melodia,
  nombresEscala,
  relativaMayor,
  relativaMenor,
} from '../../theory/escalas.js'
import { nombre } from '../../theory/notas.js'

/** Nombre en español de una nota sin octava ('F#' o 'F#4' → 'Fa♯'). */
const es = (n) => nombre(/\d/.test(n) ? n : `${n}4`, { octava: false })
/** Las notas de la menor de `tonica` en español: 'Mi · Fa♯ · Sol · …'. */
const menorEs = (tonica, octava = false) => nombresEscala(tonica, { tipo: 'minor', octava })

/** Sonido de una escala o melodía (lista de notas), a paso tranquilo. */
const sonar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.34, duracion: 0.55 })
const cantar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.4, duracion: 0.6 })

/** Melodías por grados (8 = la tónica arriba). La misma forma sirve en mayor y en menor. */
const ARCO = [1, 3, 5, 4, 3, 2, 1] // sube por la tríada y baja por pasos
const CUMBRE = [5, 6, 7, 8, 5, 3, 2, 1] // pasa por el 3.º, el 6.º y el 7.º: los que cambian

/** Ronda «¿mayor o menor?» con una escala o una melodía. */
const OPCIONES_COLOR = ['Mayor', 'Menor']
function color(notas, menor, explicacion, pregunta = '¿Mayor o menor?') {
  return { pregunta, sonidos: [cantar(notas)], opciones: OPCIONES_COLOR, correcta: menor ? 1 : 0, explicacion }
}

/** Ronda «¿mayor o su relativa menor?»: mismas notas, ¿dónde está la casa? */
function casa(mayor, menor, explicacion, pregunta = '¿Dónde está la casa?') {
  const rel = relativaMenor(mayor.tonica)
  return {
    pregunta,
    sonidos: [cantar(menor ? menor.notas : mayor.notas)],
    opciones: [`${es(mayor.tonica)} mayor`, `${es(rel)} menor`],
    correcta: menor ? 1 : 0,
    explicacion,
  }
}

/** Fila de la tabla de tonalidades menores: nombre, notas, alteraciones y su sonido. */
function tonalidadMenor(tonica, octava) {
  return {
    nombre: `${es(tonica)} menor`,
    texto: menorEs(tonica),
    dato: armadura(tonica, 'minor'),
    sonido: sonar(escalaMenor(`${tonica}${octava}`)),
  }
}

/** Fila de la tabla de relativas: la menor que sale del 6.º grado de cada mayor; suena la menor. */
function filaRelativa(mayor, octava) {
  const rel = relativaMenor(mayor)
  return {
    nombre: `${es(mayor)} mayor ↔ ${es(rel)} menor`,
    texto: `${es(rel)} es el 6.º de ${es(mayor)}`,
    dato: armadura(mayor),
    sonido: sonar(escalaMenor(`${rel}${octava}`)),
  }
}

const PIANO = { startOctave: 4, octaves: 2 }

export default {
  id: '3.4',
  modulo: 3,
  titulo: 'La escala menor natural y la relativa',
  subtitulo: 'Las mismas notas, otra casa',
  minutos: 15,
  resumen: [
    'La **escala menor natural** sigue la fórmula **T S T T S T T**. Los semitonos caen entre el **2.º y el 3.º** grado y entre el **5.º y el 6.º**.',
    'Comparada con la mayor de la misma tónica, tiene **bajados el 3.º, el 6.º y el 7.º**. El 3.º menor es el que más se oye: oscurece todo.',
    'Cada mayor tiene una **relativa menor**: empieza en su **6.º grado** (una 3.ª menor por debajo) y usa **las mismas notas y la misma armadura**. Do mayor ↔ **La menor**, Sol ↔ **Mi**, Fa ↔ **Re**, Re ↔ **Si**.',
    'Con las mismas notas, lo que decide si suena mayor o menor es **la casa**: la nota en la que la melodía empieza, se apoya y termina.',
    'Para pasar una melodía a menor sin cambiar de casa, **baja el 3.º, el 6.º y el 7.º** un semitono.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Las dos escalas empiezan en **La**. Una es la mayor que ya conoces; la otra, nueva.',
      rondas: [
        {
          pregunta: '¿Cuál suena más **oscura**, más melancólica?',
          sonidos: [sonar(escalaMenor('A3')), sonar(escalaMayor('A3'))],
          correcta: 0,
          mezclar: true,
          explicacion:
            'La oscura es **La menor**: solo teclas blancas desde La. La otra, **La mayor**, necesita Do♯, Fa♯ y Sol♯. Hoy aprendes la fórmula de la menor.',
        },
      ],
    },

    // 1 · L2 — La fórmula de la escala menor natural
    {
      tipo: 'texto',
      titulo: 'La fórmula menor',
      parrafos: [
        'La **escala menor natural** también tiene 7 notas y la 8.ª repite la primera. Cambia el orden de los pasos: **T S T T S T T**.',
        'Ahora los semitonos caen entre la **2.ª y la 3.ª** nota y entre la **5.ª y la 6.ª**. Por eso la 3.ª queda **menor** (3 semitonos sobre la tónica), como en los intervalos de la 3.2.',
        'Desde **La** sale con solo teclas blancas, igual que la mayor desde Do.',
      ],
      sonidos: [sonar(escalaMenor('A3'), 'La menor, subiendo'), sonar(escalaMenor('A3', { bajando: true }), 'La menor, bajando')],
      nota: 'En inglés: **natural minor**. En FL Studio la verás como **Minor** (o **Aeolian**, «eólico») en el resaltado de escalas del Piano roll.',
    },

    // 2 · P6 — Seguir la fórmula desde La (con los grados)
    {
      tipo: 'tocar',
      titulo: 'Toca La menor',
      intro: 'Empiezas en **La** (marcado). **T** salta una tecla; **S** va a la de al lado. Fíjate en dónde caen las **S**.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'A4',
            pasos: MENOR,
            grados: true,
            titulo: '¡La menor!',
            mensaje: `${menorEs('A', true)}. Los semitonos, **Si–Do** (2.º–3.º) y **Mi–Fa** (5.º–6.º): los mismos de Do mayor, en otro lugar de la fórmula.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · L2 — Tonalidades menores (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Otras tónicas menores',
      parrafos: [
        'Como en la mayor, la tónica da nombre a la escala: desde Mi, **Mi menor**. Y la regla de oro sigue: **cada letra una vez**.',
        'Toca cada fila para oírla. Fíjate en las alteraciones: **Mi menor** lleva Fa♯ (como Sol mayor) y **Re menor**, Si♭ (como Fa mayor). Enseguida verás por qué.',
      ],
      fichas: {
        nombre: 'Tonalidad',
        dato: 'Alteraciones',
        filas: [tonalidadMenor('A', 3), tonalidadMenor('E', 4), tonalidadMenor('D', 4)],
      },
    },

    // 4 · P6 — Seguir la fórmula desde Mi y Re (con nombres)
    {
      tipo: 'tocar',
      titulo: 'Mi menor y Re menor',
      intro: 'La misma fórmula, otra tónica. ¿En qué paso aparece la **negra**?',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'E4',
            pasos: MENOR,
            grados: true,
            titulo: '¡Mi menor!',
            mensaje: `${menorEs('E', true)}. El 2.º grado es **Fa♯**: de Mi a Fa habría un semitono y ahí la fórmula pide un **tono**.`,
          },
          {
            desde: 'D4',
            pasos: MENOR,
            grados: true,
            titulo: '¡Re menor!',
            mensaje: `${menorEs('D', true)}. El 6.º es **Si♭**: de La al 6.º la fórmula pide un **semitono**.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 5 · O2 — ¿Mayor o menor? (escalas)
    {
      tipo: 'elegir',
      titulo: '¿Mayor o menor?',
      intro: 'Escucha la escala entera. Lo que más delata a la menor es el **3.º grado**, el de la 3.ª nota.',
      rondas: [
        color(escalaMenor('A3'), true, `**La menor**: ${menorEs('A')}. De La a Do hay una **3.ª menor**.`, '¿Mayor o menor? (escala)'),
        color(escalaMayor('C4'), false, '**Do mayor**: T T S T T T S. De Do a Mi hay una **3.ª mayor**: luminosa.', '¿Mayor o menor? (escala)'),
        color(escalaMenor('C4'), true, `**Do menor**: ${menorEs('C')}. La misma tónica que la anterior, pero con Mi♭, La♭ y Si♭.`, '¿Mayor o menor? (escala)'),
        color(escalaMenor('E4', { bajando: true }), true, `**Mi menor**, bajando. Al final, Sol → Fa♯ → Mi: la 3.ª menor sigue ahí.`, '¿Mayor o menor? (baja)'),
        color(escalaMayor('G3', { bajando: true }), false, '**Sol mayor**, bajando. Termina con Si → La → Sol: una **3.ª mayor** sobre la tónica.', '¿Mayor o menor? (baja)'),
      ],
    },

    // 6 · L2 — La relativa menor (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'La relativa menor',
      parrafos: [
        '**Do mayor** y **La menor** usan exactamente las mismas notas: las teclas blancas. Son **relativas**: comparten notas y **armadura** (sus alteraciones).',
        'La relativa menor empieza en el **6.º grado** de la mayor (una **6.ª mayor** por encima de la tónica) o, lo que es lo mismo, una **3.ª menor por debajo**. Y al revés: la relativa mayor está en el **3.er grado** de la menor.',
        'Toca cada fila: cada menor suena con las mismas teclas que su mayor.',
      ],
      fichas: {
        nombre: 'Relativas',
        dato: 'Armadura',
        filas: [filaRelativa('C', 3), filaRelativa('G', 4), filaRelativa('F', 4), filaRelativa('D', 3)],
      },
      sonidos: [sonar(escalaMayor('C4'), 'Do mayor'), sonar(escalaMenor('A3'), 'La menor')],
    },

    // 7 · P7 — Encuentra la relativa: subir una 6.ª mayor (6.º grado) o bajar una 3.ª menor
    {
      tipo: 'tocar',
      titulo: 'Encuentra la relativa',
      intro: 'Dos caminos llevan a la relativa menor: **subir una 6.ª mayor** (al 6.º grado) o **bajar una 3.ª menor**. Llegan a la misma nota.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          {
            desde: 'C4',
            intervalo: '6M',
            direccion: 'sube',
            pista: 'Cuenta 6 notas de Do mayor: Do, Re, Mi, Fa, Sol, **La**.',
            mensaje: `Es el 6.º grado: Do mayor ↔ **${es(relativaMenor('C'))} menor**.`,
          },
          {
            desde: 'D4',
            intervalo: '6M',
            direccion: 'sube',
            pista: `Cuenta 6 notas de Re mayor: Re, Mi, Fa♯, Sol, La, **${es(relativaMenor('D'))}**.`,
            mensaje: `Re mayor ↔ **${es(relativaMenor('D'))} menor**: las dos con Fa♯ y Do♯.`,
          },
          {
            desde: 'G4',
            intervalo: '3m',
            direccion: 'baja',
            pista: 'Hacia la izquierda desde Sol: Fa♯, Fa, **Mi**.',
            mensaje: `El otro camino, más corto: Sol mayor ↔ **${es(relativaMenor('G'))} menor**, las dos con Fa♯.`,
          },
          {
            desde: 'F4',
            intervalo: '3m',
            direccion: 'baja',
            pista: 'Desde Fa: Mi, Mi♭, **Re**.',
            mensaje: `Fa mayor ↔ **${es(relativaMenor('F'))} menor**: las dos con Si♭.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 8 · O2 — ¿Mayor o su relativa menor? (mismas notas, otra casa)
    {
      tipo: 'elegir',
      titulo: '¿La mayor o su relativa?',
      intro: 'Las dos opciones usan **las mismas notas**. Escucha dónde **empieza y termina**: esa es la casa.',
      rondas: [
        casa(
          { tonica: 'C', notas: melodia('C4', ARCO) },
          null,
          'Empieza y termina en **Do**, y sube por Do-Mi-Sol: **Do mayor**.',
        ),
        casa(
          { tonica: 'C' },
          { notas: melodia('A3', ARCO, 'minor') },
          'La misma forma, con las mismas teclas blancas, pero la casa es **La** (La-Do-Mi): **La menor**.',
        ),
        casa(
          { tonica: 'G' },
          { notas: escalaMenor('E4') },
          `Es la escala de **Mi menor** (${menorEs('E')}): las notas de Sol mayor, pero de Mi a Mi.`,
          '¿Qué escala es?',
        ),
        casa(
          { tonica: 'F', notas: melodia('F4', CUMBRE) },
          null,
          'Termina bajando a **Fa**, con La (3.ª mayor) de camino: **Fa mayor**.',
        ),
        casa(
          { tonica: 'F' },
          { notas: melodia('D4', CUMBRE, 'minor') },
          'Las notas de Fa mayor (con Si♭), pero todo cae en **Re**: **Re menor**.',
        ),
      ],
    },

    // 9 · P6 — Seguir la fórmula sin nombres (Re menor y una nueva: Sol menor)
    {
      tipo: 'tocar',
      titulo: 'Ahora sin nombres',
      intro: 'Las teclas ya no dicen su nombre. La segunda es nueva: confía en la fórmula **T S T T S T T**.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'D4',
            pasos: MENOR,
            grados: true,
            titulo: '¡Re menor, de memoria!',
            mensaje: `${menorEs('D', true)}. Solo una negra: **Si♭**.`,
          },
          {
            desde: 'G4',
            pasos: MENOR,
            grados: true,
            titulo: '¡Sol menor!',
            mensaje: `${menorEs('G', true)}. Dos bemoles, **Si♭** y **Mi♭**: es la relativa de **${es(relativaMayor('G'))} mayor**, su 3.er grado.`,
          },
        ],
      },
      piano: { ...PIANO, showLabels: false },
    },

    // 10 · L2 — La misma melodía en mayor y en menor
    {
      tipo: 'texto',
      titulo: 'La misma melodía, en menor',
      parrafos: [
        'Hay dos formas de pasar una melodía a menor. **Paralela**: misma casa, pero con el **3.º, el 6.º y el 7.º bajados** un semitono (Do mayor → Do menor). Es la que más se usa al producir.',
        '**Relativa**: mismas teclas, pero llevando la casa al 6.º grado (Do mayor → La menor).',
        'Toca cada fila: la misma forma de melodía en las tres versiones.',
      ],
      fichas: {
        nombre: 'Versión',
        dato: 'Casa',
        filas: [
          { nombre: 'Do mayor', texto: 'La original', dato: 'Do', sonido: cantar(melodia('C4', CUMBRE)) },
          { nombre: 'Do menor', texto: 'Paralela: Mi♭, La♭ y Si♭', dato: 'Do', sonido: cantar(melodia('C4', CUMBRE, 'minor')) },
          { nombre: 'La menor', texto: 'Relativa: las mismas teclas blancas', dato: 'La', sonido: cantar(melodia('A3', CUMBRE, 'minor')) },
        ],
      },
      nota: 'Comparada con la mayor de su misma tónica, la menor natural tiene **tres grados bajados**: 3.º, 6.º y 7.º. Por eso Do menor lleva **3 bemoles**.',
    },

    // 11 · O2 — Afina el oído: ¿la melodía es mayor o menor?
    {
      tipo: 'elegir',
      titulo: 'Afina el oído',
      intro: 'Ahora son **melodías**, no escalas. Pon atención a la **3.ª nota de la escala** cuando aparezca.',
      rondas: [
        color(melodia('C4', CUMBRE, 'minor'), true, 'Menor: **Do menor**. Baja por Mi♭ antes de llegar a Do.', '¿Mayor o menor? (melodía)'),
        color(melodia('D4', ARCO), false, 'Mayor: **Re mayor**. Sube por Re-**Fa♯**-La: 3.ª mayor.', '¿Mayor o menor? (melodía)'),
        color(melodia('E4', ARCO, 'minor'), true, 'Menor: **Mi menor**. Sube por Mi-**Sol**-Si: 3.ª menor.', '¿Mayor o menor? (melodía)'),
        color(melodia('G3', CUMBRE), false, 'Mayor: **Sol mayor**. El 6.º y el 7.º (Mi, Fa♯) suenan brillantes antes de volver.', '¿Mayor o menor? (melodía)'),
        color(melodia('D4', CUMBRE, 'minor'), true, 'Menor: **Re menor**. Arriba pasa por **Si♭** y **Do**, y al bajar, por **Fa**: 3.ª menor.', '¿Mayor o menor? (melodía)'),
      ],
    },

    // 12 · O3 — Comprueba la idea (calculado con Tonal)
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cuál es la fórmula de la escala menor natural?',
          opciones: [MAYOR.join(' '), MENOR.join(' '), 'T S T T T S T'],
          correcta: 1,
          explicacion: '**T S T T S T T**: los semitonos van entre el 2.º y el 3.º y entre el 5.º y el 6.º. (La primera es la mayor.)',
        },
        {
          pregunta: '¿Cuál es la relativa menor de **Sol mayor**?',
          opciones: [`${es(relativaMenor('G'))} menor`, 'Si menor', 'Re menor'],
          correcta: 0,
          explicacion: `**${es(relativaMenor('G'))} menor**: el 6.º grado de Sol mayor (Sol La Si Do Re **Mi**). Las dos con Fa♯.`,
        },
        {
          pregunta: '¿Cuál es la relativa mayor de **Re menor**?',
          opciones: ['Re mayor', 'La mayor', `${es(relativaMayor('D'))} mayor`],
          correcta: 2,
          explicacion: `**${es(relativaMayor('D'))} mayor**: el 3.er grado de Re menor, una 3.ª menor por encima de Re. Las dos con Si♭.`,
        },
        {
          pregunta: '¿Cuántas alteraciones tiene **Mi menor**?',
          opciones: ['Ninguna', 'Una: Fa♯', 'Dos: Fa♯ y Do♯'],
          correcta: 1,
          explicacion: `Una: **Fa♯** (${armadura('E', 'minor')}), la misma armadura que su relativa, Sol mayor.`,
        },
        {
          pregunta: 'Para pasar una melodía de **Do mayor** a **Do menor**…',
          opciones: ['Bajas el 3.º, el 6.º y el 7.º', 'Empiezas en La', 'Bajas todas las notas'],
          correcta: 0,
          explicacion: `Mi → **Mi♭**, La → **La♭**, Si → **Si♭**: ${menorEs('C')}. Empezar en La sería cambiar a la **relativa** (La menor).`,
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente? Mismas notas, otra casa
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Las mismas teclas blancas, con la casa en Do o en La.',
      lados: [
        {
          etiqueta: 'Do mayor',
          emociones: 'Luminosa, abierta, segura',
          ejemplos: '«Himno de la alegría», «Cumpleaños feliz», mucho pop y canciones infantiles.',
          sonido: cantar(melodia('C4', ARCO), 'Escuchar en Do mayor'),
        },
        {
          etiqueta: 'La menor',
          emociones: 'Melancólica, íntima, seria',
          ejemplos: '«Para Elisa» de Beethoven (en La menor), «Greensleeves», mucho trap y reguetón de tono oscuro.',
          sonido: cantar(melodia('A3', ARCO, 'minor'), 'Escuchar en La menor'),
        },
      ],
      nota: `En la menor natural el 7.º (Sol en La menor) está a **un tono** de casa: no «tira» tanto como la sensible de la mayor. Las menores **armónica** y **melódica** lo arreglan (lección 3.7).`,
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: la misma melodía en mayor y en menor',
      minutos: 15,
      objetivo: 'Escribir una melodía en mayor, pasarla a su paralela menor y después a la relativa menor, y comparar cómo se sienten.',
      pasos: [
        'Abre el **Piano roll** de un piano. Escribe una melodía de **8 notas** en **C mayor** (solo filas blancas, alrededor de **C5**, nuestro Do4) que empiece y termine en **C**.',
        'Selecciónalas todas (**Ctrl + A**) y duplícalas con **Ctrl + B**: la copia aparece justo a continuación.',
        'En la copia, baja **una fila** (un semitono) cada **E**, **A** y **B**: ahora es **C menor** (FL llama a esas notas **D#**, **G#** y **A#**: son nuestros Mi♭, La♭ y Si♭).',
        'Escucha las dos versiones seguidas: la casa no cambió, solo el color.',
        'Extra: escribe una tercera versión en **A menor**, la relativa: otra vez solo filas blancas, pero que empiece y termine en **A** y que se apoye en **A**, **C** y **E**.',
      ],
      consejo: 'Si tu versión trae el **resaltado de escala** del Piano roll, cambia de **C Major** a **C Minor**: las filas que cambian son justo las del 3.º, el 6.º y el 7.º.',
      reflexion: '¿Cuál de las tres versiones te gustó más para un beat? ¿Notaste que la relativa (A menor) se siente menor aunque use las mismas teclas que C mayor?',
    },
  ],
}
