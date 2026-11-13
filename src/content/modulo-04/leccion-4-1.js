// Lección 4.1 — Tríadas por terceras apiladas.
// Nota sí, nota no: fundamental, 3.ª y 5.ª; mayor (3M + 3m), menor (3m + 3M), disminuido (3m + 3m) y aumentado
// (3M + 3M); el cifrado (C, Cm, C°, C+). Interacción nueva: P8 «Construir un acorde» (`tocar` → `acorde`).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas de cada acorde salen de src/theory/acordes.js (Tonal.js `Chord`).
import { arpegioYAcorde, cifrado, nombreAcorde, triada } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'

/** Las notas del acorde en español: 'Re · Fa♯ · La'. */
const notasEs = (raiz, tipo) => triada(raiz, tipo).map((n) => nombre(n, { octava: false })).join(' · ')

/** Sonido del acorde: de una en una y luego juntas. */
const arpegio = (raiz, tipo, etiqueta = 'Escuchar') => ({ etiqueta, notas: arpegioYAcorde(triada(raiz, tipo)), intervalo: 0.4, duracion: 1.2 })
/** Solo el acorde, las tres a la vez. */
const bloque = (raiz, tipo, etiqueta = 'Escuchar') => ({ etiqueta, notas: triada(raiz, tipo), modo: 'acorde', duracion: 1.6 })

/** Ronda «¿mayor o menor?» con el arpegio y el acorde. */
function color(raiz, tipo, explicacion) {
  return { pregunta: '¿Mayor o menor?', sonidos: [arpegio(raiz, tipo)], opciones: ['Mayor', 'Menor'], correcta: tipo === 'menor' ? 1 : 0, explicacion }
}

/** Fila de las fichas: nombre, notas, terceras y su sonido. */
const TERCERAS = { mayor: '4 + 3', menor: '3 + 4', dis: '3 + 3', aum: '4 + 4' }
function ficha(raiz, tipo, dato = TERCERAS[tipo]) {
  const n = nombreAcorde(raiz, tipo)
  return { nombre: `${n[0].toUpperCase()}${n.slice(1)}`, texto: notasEs(raiz, tipo), dato, sonido: arpegio(raiz, tipo) }
}

/** Pareja de «Empareja el acorde». */
function pareja(raiz, tipo, sonido = arpegio) {
  const n = nombreAcorde(raiz, tipo).split(' ').pop()
  return { sonido: sonido(raiz, tipo), nombre: `${n[0].toUpperCase()}${n.slice(1)}`, detalle: `${notasEs(raiz, tipo)} · ${TERCERAS[tipo]}` }
}

const PIANO = { startOctave: 4, octaves: 2 }
/** Piano Roll de una octava, solo teclas blancas. */
const OCTAVA = { rango: ['C4', 'C5'], soloBlancas: true }
const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })

export default {
  id: '4.1',
  modulo: 4,
  titulo: 'Tríadas por terceras apiladas',
  subtitulo: 'Nota sí, nota no',
  minutos: 13,
  resumen: [
    'Una **tríada** son tres notas apiladas por **terceras**: nota sí, nota no (Do-Mi-Sol). Se llaman **fundamental**, **3.ª** y **5.ª**.',
    '**Mayor** = 3.ª mayor + 3.ª menor (4 + 3 semitonos). **Menor** = 3.ª menor + 3.ª mayor (3 + 4). La 5.ª no cambia: solo se mueve **la nota del medio**.',
    '**Disminuido** = dos 3.as menores (Si-Re-Fa, con el tritono): inquieto. **Aumentado** = dos 3.as mayores (Do-Mi-Sol♯).',
    'Cifrado: **C**, **Cm**, **C°**, **C+**. En FL Studio, la herramienta **Stamp** del Piano roll dibuja un acorde de un toque.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos grupos de tres notas, sonando a la vez.',
      rondas: [
        {
          pregunta: '¿Cuál suena más **redondo**, como un acorde de canción?',
          sonidos: [bloque('C4', 'mayor'), { notas: ['C4', 'D4', 'E4'], modo: 'acorde', duracion: 1.6 }],
          correcta: 0,
          mezclar: true,
          explicacion:
            'El redondo es **Do · Mi · Sol**: entre nota y nota **se salta una** (Re y Fa). El otro, Do · Re · Mi, choca porque son vecinas. Hoy armas acordes saltando notas.',
        },
      ],
    },

    // 1 · L3 — Un acorde: nota sí, nota no (texto + roll)
    {
      tipo: 'texto',
      titulo: 'Nota sí, nota no',
      parrafos: [
        'Un **acorde** son varias notas sonando a la vez. El más común, la **tríada**, tiene tres.',
        'Se arma **saltando una nota** de la escala: desde Do, salta Re y cae en **Mi**; salta Fa y cae en **Sol**.',
        'Cada salto es una **3.ª** (como en la 3.2): una tríada son **terceras apiladas**. En el roll se ven una encima de otra, como un muñeco de nieve.',
      ],
      roll: {
        ...OCTAVA,
        notas: [nota('C4', 0), nota('E4', 1), nota('G4', 2), nota('C4', 4, 4), nota('E4', 4, 4), nota('G4', 4, 4)],
      },
      nota: 'Las notas de una tríada se llaman por su lugar: la **fundamental** (la que le da nombre), la **3.ª** y la **5.ª**.',
    },

    // 2 · P8 — Apila terceras (solo blancas, sin guía de terceras)
    {
      tipo: 'tocar',
      titulo: 'Apila terceras',
      intro: 'Nota sí, nota no, solo con teclas blancas.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'C4', tipo: 'mayor', guia: false, titulo: '¡Do · Mi · Sol!', mensaje: 'La tríada más famosa: **Do mayor**.' },
          { raiz: 'F4', tipo: 'mayor', guia: false, titulo: '¡Fa · La · Do!', mensaje: 'Saltaste Sol y Si: **Fa mayor**.' },
          {
            raiz: 'A4',
            tipo: 'menor',
            guia: false,
            titulo: '¡La · Do · Mi!',
            mensaje: '**La menor**. Suena distinta a las otras dos: ahora verás por qué.',
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · L2 — Mayor y menor: el orden de las terceras (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Mayor y menor',
      parrafos: [
        'Saltando notas salen dos tipos de 3.ª: **mayor** (4 semitonos) o **menor** (3). El orden en que se apilan decide el acorde.',
        '**Mayor** = 3.ª mayor abajo + 3.ª menor arriba (**4 + 3**). **Menor** = al revés: 3.ª menor + 3.ª mayor (**3 + 4**).',
        'De la fundamental a la 5.ª siempre hay **7 semitonos** (una 5.ª justa): solo se mueve **la nota del medio**.',
      ],
      fichas: {
        nombre: 'Acorde',
        dato: 'Terceras',
        filas: [ficha('C4', 'mayor'), ficha('C4', 'menor'), ficha('F4', 'mayor'), ficha('A3', 'menor')],
      },
    },

    // 4 · P8 — Construye mayores (con la guía 3M / 3m)
    {
      tipo: 'tocar',
      titulo: 'Construye mayores',
      intro: 'Mayor: **3M** abajo (4 semitonos) y **3m** arriba (3).',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'C4', tipo: 'mayor', mensaje: `${notasEs('C4', 'mayor')}: 4 + 3 semitonos.` },
          {
            raiz: 'D4',
            tipo: 'mayor',
            pista: 'Cuenta 4 teclas desde Re, también las negras.',
            mensaje: `${notasEs('D4', 'mayor')}. Con Fa natural la 3.ª sería **menor** (3 semitonos): la mayor pide **Fa♯**.`,
          },
          {
            raiz: 'E4',
            tipo: 'mayor',
            pista: 'Cuenta 4 teclas desde Mi, también las negras.',
            mensaje: `${notasEs('E4', 'mayor')}. Otra vez la 3.ª mayor cae en una negra: **Sol♯**.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 5 · P8 — Construye menores
    {
      tipo: 'tocar',
      titulo: 'Construye menores',
      intro: 'Menor: **3m** abajo (3 semitonos) y **3M** arriba (4).',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'D4', tipo: 'menor', mensaje: `${notasEs('D4', 'menor')}: todo teclas blancas.` },
          { raiz: 'E4', tipo: 'menor', mensaje: `${notasEs('E4', 'menor')}. Compáralo con Mi mayor: solo cambió Sol♯ → **Sol**.` },
          {
            raiz: 'C4',
            tipo: 'menor',
            pista: 'Desde Do, 3 teclas: Do♯, Re, **Mi♭**.',
            mensaje: `${notasEs('C4', 'menor')}. Bajas la 3.ª de Do mayor un semitono y ya es menor.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 6 · O2 — ¿Mayor o menor? (primer contacto: la 4.2 lo entrena a fondo)
    {
      tipo: 'elegir',
      titulo: '¿Mayor o menor?',
      intro: 'Primero suenan de una en una y luego juntas. Fíjate en el primer salto.',
      rondas: [
        color('C4', 'mayor', `**Do mayor**: ${notasEs('C4', 'mayor')}. De Do a Mi suben **4 semitonos**.`),
        color('A3', 'menor', `**La menor**: ${notasEs('A3', 'menor')}. De La a Do suben **3 semitonos**.`),
        color('G3', 'mayor', `**Sol mayor**: ${notasEs('G3', 'mayor')}. Sol → Si, una 3.ª mayor.`),
        color('D4', 'menor', `**Re menor**: ${notasEs('D4', 'menor')}. Re → Fa, una 3.ª menor.`),
      ],
    },

    // 7 · L2 — Disminuido y aumentado (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Disminuido y aumentado',
      parrafos: [
        'Quedan dos combinaciones. **Dos 3.as menores** (3 + 3) = acorde **disminuido**: la 5.ª queda a 6 semitonos, el **tritono**. Con solo teclas blancas sale en **Si**.',
        '**Dos 3.as mayores** (4 + 4) = acorde **aumentado**. Se usa poco y casi siempre de paso.',
      ],
      fichas: {
        nombre: 'Acorde',
        dato: 'Terceras',
        filas: [ficha('B3', 'dis'), ficha('C4', 'dis'), ficha('C4', 'aum')],
      },
    },

    // 8 · P8 — Los dos raros
    {
      tipo: 'tocar',
      titulo: 'Los otros dos',
      intro: 'Disminuido: **3m + 3m**. Aumentado: **3M + 3M**.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          {
            raiz: 'B4',
            tipo: 'dis',
            mensaje: `${notasEs('B4', 'dis')}: dos 3.as menores. De Si a Fa, el **tritono**: por eso suena inquieto.`,
          },
          {
            raiz: 'C4',
            tipo: 'aum',
            pista: 'Desde Mi, 4 teclas más: Fa, Fa♯, Sol, **Sol♯**.',
            mensaje: `${notasEs('C4', 'aum')}: dos 3.as mayores. Ninguna nota se siente casa.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 9 · O6 — Empareja el acorde
    {
      tipo: 'emparejar',
      titulo: 'Empareja el acorde',
      intro: 'Los cuatro tipos sobre la misma fundamental.',
      rondas: [
        {
          pregunta: 'Desde Do',
          parejas: [pareja('C4', 'mayor'), pareja('C4', 'menor'), pareja('C4', 'dis'), pareja('C4', 'aum')],
          explicacion: 'Solo cambian la 3.ª y la 5.ª: **Mi o Mi♭**, **Sol, Sol♭ o Sol♯**.',
        },
        {
          pregunta: 'Desde Sol, solo el acorde',
          parejas: [pareja('G3', 'mayor', bloque), pareja('G3', 'menor', bloque), pareja('G3', 'dis', bloque)],
          explicacion: 'El **mayor** abre, el **menor** se recoge y el **disminuido** se tensa.',
        },
      ],
    },

    // 10 · L2 — El cifrado (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Cómo se escriben',
      parrafos: [
        'En canciones, tutoriales y en FL Studio, los acordes se escriben con la **letra** de la fundamental (C = Do, D = Re… como en el Piano roll) y una marca:',
        'Mayor, solo la letra: **C**. Menor, con m: **Cm**. Disminuido: **C°** (o Cdim). Aumentado: **C+** (o Caug).',
      ],
      fichas: {
        nombre: 'Acorde',
        dato: 'Cifrado',
        filas: [
          ficha('C4', 'mayor', cifrado('C4', 'mayor')),
          ficha('C4', 'menor', cifrado('C4', 'menor')),
          ficha('B3', 'dis', cifrado('B3', 'dis')),
          ficha('C4', 'aum', cifrado('C4', 'aum')),
          ficha('F#4', 'menor', cifrado('F#4', 'menor')),
        ],
      },
      nota: 'En el **Piano roll** de FL, la herramienta **Stamp** (sello) dibuja un acorde entero de un toque: eliges **Major**, **Minor**, **Dim** o **Aug** y tocas la fila de la fundamental.',
    },

    // 11 · P8 — Lee el cifrado (teclas sin nombre)
    {
      tipo: 'tocar',
      titulo: 'Lee el cifrado',
      intro: 'Sin nombres en las teclas: solo la letra y la marca.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'E4', tipo: 'menor', cifrado: true, mensaje: `**Em** = Mi menor: ${notasEs('E4', 'menor')}.` },
          { raiz: 'G4', tipo: 'mayor', cifrado: true, mensaje: `**G** = Sol mayor: ${notasEs('G4', 'mayor')}.` },
          { raiz: 'D4', tipo: 'menor', cifrado: true, mensaje: `**Dm** = Re menor: ${notasEs('D4', 'menor')}.` },
        ],
      },
      piano: { ...PIANO, showLabels: false },
    },

    // 12 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cómo se arma una tríada?',
          opciones: ['Nota sí, nota no: terceras apiladas', 'Tres notas seguidas de la escala', 'Una octava y una 5.ª'],
          correcta: 0,
          explicacion: 'Saltando una nota de la escala cada vez: **fundamental, 3.ª y 5.ª**.',
        },
        {
          pregunta: '¿Qué terceras tiene un acorde **mayor**, de abajo arriba?',
          opciones: ['3.ª mayor + 3.ª menor', '3.ª menor + 3.ª mayor', 'Dos 3.as mayores'],
          correcta: 0,
          explicacion: '**4 + 3** semitonos. Al revés (3 + 4) es menor; dos mayores, aumentado.',
        },
        {
          pregunta: '¿Qué nota cambia entre **Do mayor** y **Do menor**?',
          opciones: ['La 3.ª: Mi → Mi♭', 'La 5.ª: Sol → Sol♭', 'La fundamental'],
          correcta: 0,
          explicacion: 'Solo **la nota del medio**: la fundamental y la 5.ª son las mismas.',
        },
        {
          pregunta: '¿Qué notas tiene **Dm**?',
          opciones: [notasEs('D4', 'mayor'), notasEs('D4', 'menor'), 'Re · Fa · La♭'],
          correcta: 1,
          explicacion: `**Dm** = Re menor: ${notasEs('D4', 'menor')}. Con Fa♯ sería **D** (Re mayor).`,
        },
        {
          pregunta: '¿Cuál tiene **dos 3.as menores**?',
          opciones: ['Disminuido', 'Aumentado', 'Menor'],
          correcta: 0,
          explicacion: `El **disminuido** (3 + 3), como Si° = ${notasEs('B3', 'dis')}. El aumentado son dos mayores (4 + 4).`,
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente? Estable o inquieto
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Una 3.ª encima de otra; cambia el tipo y cambia todo.',
      lados: [
        {
          etiqueta: 'Mayor',
          emociones: 'Estable, luminoso, en casa',
          ejemplos: 'El acorde con el que empiezan y terminan miles de canciones de pop.',
          sonido: bloque('C4', 'mayor', 'Escuchar Do mayor'),
        },
        {
          etiqueta: 'Disminuido',
          emociones: 'Inquieto, tenso, pide moverse',
          ejemplos: 'El «algo va a pasar» del cine de suspenso. En el pop sale de paso, casi nunca para quedarse.',
          sonido: bloque('B3', 'dis', 'Escuchar Si disminuido'),
        },
      ],
      nota: 'El **menor** queda en medio: tan estable como el mayor, pero más íntimo. Lo comparas a fondo en la 4.2.',
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tus primeros acordes',
      minutos: 15,
      objetivo: 'Escribir cuatro tríadas en el Piano roll y oír cómo cambia el acorde al mover una sola nota.',
      pasos: [
        'Abre el **Piano roll** de un piano. Cada acorde va a durar **un compás**.',
        'Dibuja **C** en el compás 1 (**C5 · E5 · G5**: nuestro Do4-Mi4-Sol4), **F** en el 2 (F5 · A5 · C6), **G** en el 3 (G5 · B5 · D6) y **Am** en el 4 (A5 · C6 · E6).',
        'Reprodúcelo en bucle: cuatro acordes, solo filas blancas, nota sí, nota no.',
        'En el compás 1, baja **E5** una fila (a **D#5**, nuestro Mi♭): ahora es **Cm**. Escucha cómo cambia todo el loop.',
        'Comprueba con la herramienta **Stamp** (sello): elige **Major** o **Minor**, toca la fila de la fundamental y compara con lo que dibujaste.',
      ],
      consejo: 'Si dos notas chocan, revisa que entre una y otra haya **una fila blanca saltada**.',
      reflexion: '¿Qué cambió al pasar C a Cm? ¿Cuál de los cuatro acordes te suena más a «casa»?',
    },
  ],
}
