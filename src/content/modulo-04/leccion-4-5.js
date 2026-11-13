// Lección 4.5 — Voicings.
// Las mismas notas de un acorde repartidas de otra forma: cerrado (todas dentro de una octava) y abierto (la 3.ª sube
// una octava); duplicar la fundamental; en el grave, solo la fundamental (lo anunciado en la 4.2); voicings que se
// mueven poco en I–V–vi–IV; y un adelanto de los acordes de cuatro notas (las séptimas, Módulo 5).
// Opción nueva de P8: `voicing: 'abierto'` (fundamental marcada; la 5.ª encima y la 3.ª una octava arriba, octava exacta).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Los acordes salen de src/theory/acordes.js (`triada`, `abierto`).
import { abierto, arpegioYAcorde, triada } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'

/** Las notas en español, de abajo arriba: 'Do · Sol · Mi'. */
const notasEs = (notas) => notas.map((n) => nombre(n, { octava: false })).join(' · ')
/** Las notas con su octava: 'Do3 · Sol3 · Mi4'. */
const notasOct = (notas) => notas.map((n) => nombre(n)).join(' · ')
/** Cerrado = la tríada tal cual; abierto = 1 · 5 · 3 una octava arriba. */
const cerrado = (raiz, tipo = 'mayor') => triada(raiz, tipo)
const abre = (raiz, tipo = 'mayor') => abierto(triada(raiz, tipo))

const bloque = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, modo: 'acorde', duracion: 1.8 })
/** De abajo arriba y luego juntas. */
const arpegio = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas: arpegioYAcorde(notas), intervalo: 0.38, duracion: 1.2 })
/** Varios acordes seguidos. */
const seguidos = (acordes, etiqueta = 'Escuchar', intervalo = 1) => ({ etiqueta, notas: acordes, intervalo, duracion: 0.95 })
const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** Cada acorde con su bajo debajo. */
const conBajo = (acordes, bajos) => acordes.map((a, i) => [bajos[i], ...a])

// I–V–vi–IV en Do: todos en estado fundamental (saltan) o con voicings cercanos (se mueven poco). Mismo bajo debajo.
const BAJO_DO = ['C2', 'G2', 'A2', 'F2']
const SALTA_DO = conBajo([cerrado('C4'), cerrado('G4'), cerrado('A4', 'menor'), cerrado('F4')], BAJO_DO)
const CERCA_DO = conBajo([['C4', 'E4', 'G4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'A4'], ['C4', 'F4', 'A4']], BAJO_DO)
// Y en Sol: G – D – Em – C.
const BAJO_SOL = ['G2', 'D2', 'E2', 'C2']
const SALTA_SOL = conBajo([cerrado('G3'), cerrado('D4'), cerrado('E4', 'menor'), cerrado('C4')], BAJO_SOL)
const CERCA_SOL = conBajo([['G3', 'B3', 'D4'], ['F#3', 'A3', 'D4'], ['G3', 'B3', 'E4'], ['G3', 'C4', 'E4']], BAJO_SOL)

/** Ronda «¿cerrado o abierto?». */
function cerradoOAbierto(raiz, tipo, esAbierto, explicacion) {
  const notas = esAbierto ? abre(raiz, tipo) : cerrado(raiz, tipo)
  return { pregunta: '¿Cerrado o abierto?', sonidos: [arpegio(notas)], opciones: ['Cerrado', 'Abierto'], correcta: esAbierto ? 1 : 0, explicacion }
}

/** Ronda «¿cuál suena más limpio?»: la tríada entera en el grave contra el bajo solo y el acorde arriba. */
function limpio(grave, bajo, arriba, explicacion) {
  return { pregunta: '¿Cuál suena más **limpio**?', sonidos: [bloque([bajo, ...arriba]), bloque(grave)], correcta: 0, mezclar: true, explicacion }
}

const PIANO = { startOctave: 3, octaves: 2 }

export default {
  id: '4.5',
  modulo: 4,
  titulo: 'Voicings',
  subtitulo: 'Las mismas notas, otro reparto',
  minutos: 15,
  resumen: [
    'Un **voicing** es cómo repartes las notas de un acorde: cuáles van abajo, cuáles arriba y en qué octava. El cifrado no cambia.',
    '**Cerrado**: las tres notas dentro de una octava (Do · Mi · Sol). **Abierto**: la 3.ª sube una octava (Do · Sol · Mi) y suena más amplio.',
    'Con cuatro voces se **duplica la fundamental** (o la 5.ª); la 3.ª doblada pesa.',
    'En el **grave**, solo la fundamental: las terceras abajo se embarran. El acorde va arriba.',
    'Elige los voicings para que las voces **se muevan poco** de un acorde al siguiente: la progresión suena fluida.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos veces **Do mayor**: Do, Mi y Sol, las mismas tres notas.',
      rondas: [
        {
          pregunta: '¿Cuál suena más **amplio**?',
          sonidos: [bloque(abre('C3')), bloque(cerrado('C4'))],
          correcta: 0,
          mezclar: true,
          explicacion: `El amplio reparte las notas: ${notasOct(abre('C3'))}, con aire en medio. El otro las junta: ${notasOct(cerrado('C4'))}.`,
        },
      ],
    },

    // 1 · L2 — Mismas notas, otra forma
    {
      tipo: 'texto',
      titulo: 'Mismas notas, otra forma',
      parrafos: [
        'Un **voicing** es cómo repartes las notas de un acorde en el teclado. Do mayor siempre es Do · Mi · Sol, pero puedes ponerlas juntas o separadas.',
        '**Cerrado**: las tres dentro de una octava. **Abierto**: la **3.ª sube una octava** y queda arriba de todo (a 16 semitonos de la fundamental: una **10.ª**).',
        'El cifrado no cambia: los dos son **C**.',
      ],
      sonidos: [arpegio(cerrado('C3'), 'Cerrado'), arpegio(abre('C3'), 'Abierto')],
    },

    // 2 · L3 — Míralo en el roll
    {
      tipo: 'texto',
      titulo: 'Míralo en el roll',
      parrafos: [
        'A la izquierda, **C cerrado**: tres filas seguidas de las teclas blancas. A la derecha, **C abierto**: Mi salta arriba y deja un hueco en medio.',
      ],
      roll: {
        rango: ['C3', 'G4'],
        soloBlancas: true,
        columnas: 4,
        porTiempo: 1,
        bpm: 60,
        notas: [...cerrado('C3').map((n) => nota(n, 0, 2)), ...abre('C3').map((n) => nota(n, 2, 2))],
      },
      sonidos: [seguidos([cerrado('C3'), abre('C3')], 'Cerrado y abierto', 1.4)],
    },

    // 3 · O2 — ¿Cerrado o abierto?
    {
      tipo: 'elegir',
      titulo: '¿Cerrado o abierto?',
      intro: 'Suena de abajo arriba y luego junto. Fíjate en el salto de la última nota.',
      rondas: [
        cerradoOAbierto('C3', 'mayor', true, `**Abierto**: ${notasEs(abre('C3'))}. Mi quedó arriba de todo.`),
        cerradoOAbierto('A3', 'menor', false, `**Cerrado**: ${notasEs(cerrado('A3', 'menor'))}, todas juntas.`),
        cerradoOAbierto('F3', 'mayor', true, `**Abierto**: ${notasEs(abre('F3'))}. La 3.ª de Fa, La, subió una octava.`),
        cerradoOAbierto('G3', 'mayor', false, `**Cerrado**: ${notasEs(cerrado('G3'))}, en una octava.`),
      ],
    },

    // 4 · P8 — Abre el acorde (`voicing: 'abierto'`)
    {
      tipo: 'tocar',
      titulo: 'Abre el acorde',
      intro: 'Encima de la fundamental va la **5.ª**, y la **3.ª** sube **una octava**. Aquí cuenta la octava.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'C3', tipo: 'mayor', voicing: 'abierto', mensaje: `${notasOct(abre('C3'))}: Mi subió una octava y dejó aire en medio.` },
          { raiz: 'D3', tipo: 'menor', voicing: 'abierto', mensaje: `${notasOct(abre('D3', 'menor'))}: Re menor abierto. Entre La y Fa, una **6.ª menor**.` },
          { raiz: 'G3', tipo: 'mayor', voicing: 'abierto', cifrado: true, mensaje: `**G** abierto = ${notasOct(abre('G3'))}.` },
        ],
      },
      piano: PIANO,
    },

    // 5 · L2 — Cuatro voces, tres notas
    {
      tipo: 'texto',
      titulo: 'Cuatro voces, tres notas',
      parrafos: [
        'Muchas veces el acorde se toca con **cuatro notas**: una se repite en otra octava. Es **duplicar**.',
        'Lo normal es duplicar la **fundamental** (o la 5.ª): el acorde suena lleno y firme. Si duplicas la **3.ª**, sobre todo en un acorde mayor, suena pesado.',
      ],
      sonidos: [bloque(['C3', 'G3', 'C4', 'E4'], 'La fundamental doblada'), bloque(['C3', 'E3', 'G3', 'E4'], 'La 3.ª doblada')],
      nota: 'Al tocar con las dos manos, la izquierda suele llevar la fundamental (y a veces su octava) y la derecha, el acorde.',
    },

    // 6 · L2 — En el grave, solo la fundamental
    {
      tipo: 'texto',
      titulo: 'En el grave, solo la fundamental',
      parrafos: [
        'En la 4.2 oíste que muy abajo las terceras **se embarran**: las notas graves vibran lento y dos a menos de una 5.ª se mezclan.',
        'El truco de los productores: abajo, **solo la fundamental**; el acorde, arriba. Las mismas tres notas, pero se oye claro.',
      ],
      sonidos: [bloque(cerrado('C2'), 'Todo en el grave'), bloque(['C2', ...cerrado('C4')], 'Fundamental abajo, acorde arriba')],
      nota: 'Regla rápida: por debajo de **Do3**, solo la fundamental (o su 5.ª o su octava). Nada de terceras.',
    },

    // 7 · O1 — ¿Cuál suena más limpio?
    {
      tipo: 'elegir',
      titulo: '¿Cuál suena más limpio?',
      intro: 'El mismo acorde, repartido de dos formas.',
      rondas: [
        limpio(cerrado('C2'), 'C2', cerrado('C4'), 'El limpio deja **solo Do** en el grave y Do · Mi · Sol arriba.'),
        limpio(cerrado('A1', 'menor'), 'A1', cerrado('A3', 'menor'), 'El limpio: **La** sola abajo y La · Do · Mi arriba. La tríada entera en el grave retumba.'),
        limpio(cerrado('F2'), 'F1', cerrado('F3'), 'El limpio: **Fa** solo en el grave y el acorde arriba.'),
      ],
    },

    // 8 · R2 — Escribe el voicing del productor
    {
      tipo: 'pianoroll',
      titulo: 'Escribe el voicing del productor',
      intro: 'Este roll tiene **solo las filas que vas a usar**. Rellena los contornos: el **bajo** abajo, en la fundamental, y el acorde arriba. Primero **C**, luego **Am**.',
      roll: { filas: ['A4', 'G4', 'E4', 'C4', 'C2', 'A1'], columnas: 8, porTiempo: 2, bpm: 80 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: [
          ...['C2', 'C4', 'E4', 'G4'].map((n) => nota(n, 0, 4)),
          ...['A1', 'C4', 'E4', 'A4'].map((n) => nota(n, 4, 4)),
        ],
        pista: 'Cada acorde ocupa **4 casillas**: toca la primera y arrastra a la derecha.',
        explicacion:
          'Pulsa **Reproducir**: el bajo salta de Do a La, pero arriba **Do y Mi se quedan quietas** y solo Sol sube a La. Así suena fluido.',
      },
    },

    // 9 · L2 — Voicings que se mueven poco
    {
      tipo: 'texto',
      titulo: 'Voicings que se mueven poco',
      parrafos: [
        'Junta todo: el **bajo** abajo, en la fundamental, y arriba los acordes con el voicing **más cercano** al anterior. Es lo de la 4.4, pero ahora el bajo va aparte.',
        `I–V–vi–IV en Do: arriba ${['Do · Mi · Sol', 'Si · Re · Sol', 'Do · Mi · La', 'Do · Fa · La'].join(' → ')}. Cada vez cambian **una o dos notas**, y poquito.`,
      ],
      roll: {
        rango: ['B3', 'A4'],
        soloBlancas: true,
        columnas: 8,
        porTiempo: 2,
        bpm: 80,
        notas: CERCA_DO.flatMap((a, i) => a.slice(1).map((n) => nota(n, i * 2, 2))),
      },
      sonidos: [seguidos(SALTA_DO, 'Saltando'), seguidos(CERCA_DO, 'Moviéndose poco')],
    },

    // 10 · O1 — ¿Cuál suena más fluido?
    {
      tipo: 'elegir',
      titulo: '¿Cuál suena más fluido?',
      intro: 'La misma progresión, con el mismo bajo.',
      rondas: [
        {
          pregunta: 'C – G – Am – F: ¿cuál suena más **fluido**?',
          sonidos: [seguidos(CERCA_DO), seguidos(SALTA_DO)],
          correcta: 0,
          mezclar: true,
          explicacion: 'El fluido elige voicings cercanos: **Sol** se queda en casi todos y las demás se mueven un paso.',
        },
        {
          pregunta: 'En Sol, G – D – Em – C: ¿cuál suena más **fluido**?',
          sonidos: [seguidos(CERCA_SOL), seguidos(SALTA_SOL)],
          correcta: 0,
          mezclar: true,
          explicacion: 'Arriba: Sol · Si · Re → Fa♯ · La · Re → Sol · Si · Mi → Sol · Do · Mi. Casi todo se queda.',
        },
      ],
    },

    // 11 · L2 — Un adelanto: cuatro notas
    {
      tipo: 'texto',
      titulo: 'Un adelanto: cuatro notas',
      parrafos: [
        'Si sobre una tríada apilas **otra 3.ª más**, sale un acorde de **cuatro notas distintas**: la **7.ª**.',
        `**Cmaj7** = ${notasEs(['C4', 'E4', 'G4', 'B4'])}. **Am7** = ${notasEs(['A3', 'C4', 'E4', 'G4'])}. Suenan más suaves y con color: R&B, neo soul, lo-fi.`,
      ],
      sonidos: [arpegio(['C3', 'E3', 'G3', 'B3'], 'Cmaj7'), arpegio(['A2', 'C3', 'E3', 'G3'], 'Am7'), seguidos([['C2', 'E3', 'G3', 'B3'], ['A1', 'G3', 'C4', 'E4']], 'Cmaj7 – Am7 con bajo', 1.6)],
      nota: 'Las séptimas tienen su propio módulo, el **5**. Por ahora, solo escúchalas.',
    },

    // 12 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué es un **voicing**?',
          opciones: ['Cómo se reparten las notas del acorde', 'Un acorde nuevo', 'El ritmo del acorde'],
          correcta: 0,
          explicacion: 'Las mismas notas, en otro orden u otra octava. El acorde sigue siendo el mismo.',
        },
        {
          pregunta: '¿Cambia el cifrado de C si lo tocas **abierto**?',
          opciones: ['No: sigue siendo C', 'Sí: pasa a C/E', 'Sí: pasa a Cm'],
          correcta: 0,
          explicacion: 'La fundamental sigue abajo: es **C**. La barra (C/E) solo sale si cambia el **bajo**.',
        },
        {
          pregunta: 'En el voicing abierto de una tríada, ¿qué nota sube una octava?',
          opciones: ['La 3.ª', 'La fundamental', 'La 5.ª'],
          correcta: 0,
          explicacion: `La **3.ª**: Do · Mi · Sol pasa a ${notasEs(abre('C3'))}.`,
        },
        {
          pregunta: 'Con cuatro voces, ¿qué nota se suele **duplicar**?',
          opciones: ['La fundamental', 'La 3.ª', 'Ninguna'],
          correcta: 0,
          explicacion: 'La fundamental (o la 5.ª). La 3.ª doblada pesa.',
        },
        {
          pregunta: '¿Qué va en el **grave**, en la octava 2?',
          opciones: ['Solo la fundamental', 'La tríada entera', 'La 3.ª'],
          correcta: 0,
          explicacion: 'Abajo, solo la fundamental. Las terceras graves se embarran.',
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Do mayor, dos repartos.',
      lados: [
        {
          etiqueta: 'Cerrado',
          emociones: 'Compacto, cercano, directo',
          ejemplos: 'Piano de balada, acordes de guitarra rítmica, stabs de house.',
          sonido: bloque(['C2', ...cerrado('C4')], 'Escuchar cerrado'),
        },
        {
          etiqueta: 'Abierto',
          emociones: 'Amplio, de película, con aire',
          ejemplos: 'Pads, cuerdas, intros de trap melódico.',
          sonido: bloque(['C2', ...abre('C3')], 'Escuchar abierto'),
        },
      ],
      nota: 'En un beat lleno conviene el **cerrado** (deja espacio); en una intro vacía luce el **abierto**.',
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu progresión con voicings',
      minutos: 15,
      objetivo: 'Escribir I–V–vi–IV con el bajo aparte y voicings que se muevan poco, y probar uno abierto.',
      pasos: [
        'En el **Piano roll** escribe **C – G – Am – F**, un acorde por compás, con estos voicings (nombres de FL): **C5-E5-G5**, **B4-D5-G5**, **C5-E5-A5**, **C5-F5-A5**.',
        'En **otra pista** (un bajo o un 808) escribe solo la **fundamental** en la octava 3 de FL (nuestra 2): **C3, G3, A3, F3**.',
        'Abre el **C**: selecciona su **E5** y súbelo una octava con **Ctrl + ↑** (queda C5-G5-E6). Escucha el cambio.',
        'Prueba a **duplicar** la fundamental: añade un **C4** debajo del primer acorde. ¿Más lleno?',
        'Por último, baja un acorde entero a la octava 3 de FL y escucha cómo se embarra con el bajo. Devuélvelo arriba.',
      ],
      consejo: 'Si un acorde suena «hueco» o «sucio», mira el grave: casi siempre sobra una nota abajo.',
      reflexion: '¿Te gustó más el C cerrado o el abierto? ¿En qué parte de una canción usarías cada uno?',
    },
  ],
}
