// Lección 4.4 — Inversiones y bajo.
// Las mismas tres notas con otra abajo: estado fundamental, 1.ª inversión (la 3.ª en el bajo) y 2.ª (la 5.ª en el
// bajo); el cifrado con barra (C/E, C/G); conducir las voces moviéndolas poco (C – G/B – Am) y el bajo aparte.
// Opción nueva de P8: `inversion: 1 | 2` (la tecla marcada es el BAJO y las otras van encima; casillas de abajo arriba).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las inversiones salen de src/theory/acordes.js (`inversion`, `cifradoInversion`).
import { arpegioYAcorde, cifradoInversion, inversion, triada } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'

/** Las notas en español, de abajo arriba: 'Mi · Sol · Do'. */
const notasEs = (notas) => notas.map((n) => nombre(n, { octava: false })).join(' · ')
/** Un acorde ya colocado: acorde('C4', 'mayor', 1) → ['E4', 'G4', 'C5'] (C/E). */
const acorde = (raiz, tipo, inv = 0) => inversion(triada(raiz, tipo), inv)
const bajoDe = (raiz, tipo, inv) => nombre(acorde(raiz, tipo, inv)[0], { octava: false })

const bloque = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, modo: 'acorde', duracion: 1.6 })
/** De abajo arriba y luego juntas: la primera que suena es el bajo. */
const arpegio = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas: arpegioYAcorde(notas), intervalo: 0.4, duracion: 1.1 })
/** Varios acordes seguidos. */
const seguidos = (acordes, etiqueta = 'Escuchar', intervalo = 0.95) => ({ etiqueta, notas: acordes, intervalo, duracion: 0.9 })
const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** Con el bajo en la octava 2: cada acorde + su fundamental abajo. */
const conBajo = (acordes, bajos) => acordes.map((a, i) => [bajos[i], ...a])

// C – G – Am saltando (todo en estado fundamental) y con inversiones (el bajo baja Do, Si, La).
const SALTANDO = [acorde('C4', 'mayor'), acorde('G3', 'mayor'), acorde('A3', 'menor')]
const CAMINANDO = [acorde('C4', 'mayor'), ['B3', 'D4', 'G4'], acorde('A3', 'menor')]
// La del gancho: C – G – Am – F, saltando o con inversiones.
const GANCHO_SALTA = [acorde('C4', 'mayor'), acorde('G4', 'mayor'), acorde('A4', 'menor'), acorde('F4', 'mayor')]
const GANCHO_CAMINA = [acorde('C4', 'mayor'), ['B3', 'D4', 'G4'], acorde('A3', 'menor'), ['A3', 'C4', 'F4']]

/** Ronda «¿qué nota está en el bajo?»: el acorde de abajo arriba; opciones = sus tres notas. */
function bajo(raiz, tipo, inv, explicacion) {
  const notas = triada(raiz, tipo)
  const partes = ['fundamental', '3.ª', '5.ª']
  return {
    pregunta: `${nombre(raiz, { octava: false })} ${tipo}, de abajo arriba. ¿Qué nota está en el bajo?`,
    sonidos: [arpegio(acorde(raiz, tipo, inv))],
    opciones: notas.map((n, i) => `${nombre(n, { octava: false })} (${partes[i]})`),
    correcta: inv,
    explicacion,
  }
}

/** Ronda «Lee el roll»: un acorde invertido en un roll de 6 filas y sus tres cifrados. */
function leeRoll(raiz, tipo, inv, rango, explicacion) {
  const notas = acorde(raiz, tipo, inv)
  return {
    pregunta: '¿Qué acorde es?',
    roll: { rango, soloBlancas: true, columnas: 4, porTiempo: 1, bpm: 70, notas: notas.map((n) => nota(n, 0, 4)) },
    opciones: [0, 1, 2].map((k) => cifradoInversion(raiz, tipo, k)),
    correcta: inv,
    explicacion,
  }
}

/** Ronda «¿cuál tiene el bajo que camina?»: la misma progresión saltando y con inversiones. */
function camina(saltando, caminando, explicacion) {
  return { pregunta: '¿Cuál tiene el **bajo que camina**, nota a nota?', sonidos: [seguidos(caminando), seguidos(saltando)], correcta: 0, mezclar: true, explicacion }
}

const PIANO = { startOctave: 4, octaves: 2 }
const PIANO_BAJO = { startOctave: 3, octaves: 2 }

export default {
  id: '4.4',
  modulo: 4,
  titulo: 'Inversiones y bajo',
  subtitulo: 'Las mismas notas, otra abajo',
  minutos: 14,
  resumen: [
    'Un acorde sigue siendo el mismo aunque cambie el orden: lo que cambia es **la nota de abajo**, el **bajo**.',
    '**Estado fundamental**: la fundamental abajo (C). **1.ª inversión**: la 3.ª abajo (**C/E**). **2.ª inversión**: la 5.ª abajo (**C/G**).',
    'El cifrado con barra dice el acorde y, tras la barra, **la nota del bajo**.',
    'Con inversiones las voces se mueven poco (**C – G/B – Am**: el bajo camina Do, Si, La) y la progresión suena suave.',
    'En producción, el **bajo** suele ir aparte, grave, en la fundamental; encima, los acordes invertidos para que se muevan poco.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Los mismos cuatro acordes: C – G – Am – F.',
      rondas: [
        {
          pregunta: '¿Cuál suena más **suave**, como si las notas caminaran?',
          sonidos: [seguidos(GANCHO_CAMINA), seguidos(GANCHO_SALTA)],
          correcta: 0,
          mezclar: true,
          explicacion:
            'El suave usa **inversiones**: cada acorde con otra nota abajo, así casi nada se mueve. En el otro, los cuatro acordes saltan enteros de un sitio a otro.',
        },
      ],
    },

    // 1 · L3 — Las tres posiciones de Do (roll)
    {
      tipo: 'texto',
      titulo: 'La misma familia, otra abajo',
      parrafos: [
        '**Do · Mi · Sol** es Do mayor en cualquier orden. Si subes la nota de abajo una octava, sigue siendo Do mayor, pero **suena distinto**: cambió el **bajo**.',
        '**Estado fundamental**: Do abajo. **1.ª inversión**: Mi (la 3.ª) abajo. **2.ª inversión**: Sol (la 5.ª) abajo.',
      ],
      roll: {
        rango: ['C4', 'E5'],
        soloBlancas: true,
        columnas: 6,
        porTiempo: 1,
        bpm: 60,
        notas: [0, 1, 2].flatMap((k) => acorde('C4', 'mayor', k).map((n) => nota(n, k * 2, 2))),
      },
      sonidos: [arpegio(acorde('C4', 'mayor', 0), 'Fundamental'), arpegio(acorde('C4', 'mayor', 1), '1.ª inversión'), arpegio(acorde('C4', 'mayor', 2), '2.ª inversión')],
    },

    // 2 · P8 — Construye la inversión (`inversion`: la marcada es el bajo)
    {
      tipo: 'tocar',
      titulo: 'Construye la inversión',
      intro: 'La tecla marcada es el **bajo**: las otras dos van **encima**.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'C4', tipo: 'mayor', inversion: 1, mensaje: `${notasEs(acorde('C4', 'mayor', 1))}: **1.ª inversión**, la 3.ª en el bajo.` },
          { raiz: 'C4', tipo: 'mayor', inversion: 2, mensaje: `${notasEs(acorde('C4', 'mayor', 2))}: **2.ª inversión**, la 5.ª en el bajo.` },
          {
            raiz: 'A3',
            tipo: 'menor',
            inversion: 1,
            cifrado: true,
            mensaje: `**Am/C** = ${notasEs(acorde('A3', 'menor', 1))}: La menor con Do en el bajo.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · L2 — El cifrado con barra (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'La barra dice el bajo',
      parrafos: [
        'Para escribir una inversión se pone el acorde, una **barra** y la nota del bajo: **C/E** = «Do mayor con Mi en el bajo».',
        'Fíjate en los intervalos: en la 1.ª y la 2.ª inversión aparece una **4.ª justa** (5 semitonos) entre dos notas. Es la fundamental, que subió.',
      ],
      fichas: {
        nombre: 'Posición',
        dato: 'Cifrado',
        filas: [0, 1, 2].map((k) => ({
          nombre: ['Fundamental', '1.ª inversión', '2.ª inversión'][k],
          texto: notasEs(acorde('C4', 'mayor', k)),
          dato: cifradoInversion('C4', 'mayor', k),
          sonido: arpegio(acorde('C4', 'mayor', k)),
        })),
      },
    },

    // 4 · O2 — ¿Qué nota está en el bajo?
    {
      tipo: 'elegir',
      titulo: '¿Qué nota está en el bajo?',
      intro: 'Suena de abajo arriba: la primera es el bajo.',
      rondas: [
        bajo('C4', 'mayor', 1, `**C/E**: ${notasEs(acorde('C4', 'mayor', 1))}. Mi abajo: 1.ª inversión.`),
        bajo('C4', 'mayor', 0, `**C**: ${notasEs(acorde('C4', 'mayor', 0))}. Do abajo: estado fundamental.`),
        bajo('C4', 'mayor', 2, `**C/G**: ${notasEs(acorde('C4', 'mayor', 2))}. Sol abajo: 2.ª inversión.`),
        bajo('G3', 'mayor', 1, `**G/B**: ${notasEs(acorde('G3', 'mayor', 1))}. Si, la 3.ª de Sol, abajo.`),
      ],
    },

    // 5 · O4 — Lee el roll
    {
      tipo: 'elegir',
      titulo: 'Lee el roll',
      intro: 'Busca la nota de **abajo**: ella dice la inversión.',
      rondas: [
        leeRoll('F4', 'mayor', 1, ['A4', 'F5'], `Abajo está **La**, la 3.ª de Fa: **F/A**.`),
        leeRoll('G3', 'mayor', 2, ['D4', 'B4'], `Abajo está **Re**, la 5.ª de Sol: **G/D**.`),
        leeRoll('A3', 'menor', 2, ['E4', 'C5'], `Abajo está **Mi**, la 5.ª de La: **Am/E**. Las notas son La · Do · Mi: La menor.`),
      ],
    },

    // 6 · L3 — Conducir las voces: C – G/B – Am
    {
      tipo: 'texto',
      titulo: 'Mover las voces lo menos posible',
      parrafos: [
        'Para pasar de un acorde a otro, mueve cada nota **a la más cercana** del siguiente. Es la **conducción de voces**.',
        `De C a G, en vez de saltar, usa **G/B**: Do baja a Si, Mi baja a Re y Sol se queda. Luego **Am**: Si baja a La. El bajo **camina**: ${['C4', 'B3', 'A3'].map((n) => nombre(n, { octava: false })).join(', ')}.`,
      ],
      roll: {
        rango: ['A3', 'G4'],
        soloBlancas: true,
        columnas: 6,
        porTiempo: 1,
        bpm: 60,
        notas: CAMINANDO.flatMap((a, i) => a.map((n) => nota(n, i * 2, 2))),
      },
      sonidos: [seguidos(CAMINANDO, 'C – G/B – Am'), seguidos(SALTANDO, 'C – G – Am, saltando')],
    },

    // 7 · P8 — Encadena (inversiones en la octava 3)
    {
      tipo: 'tocar',
      titulo: 'Encadena',
      intro: 'Acordes que caen cerca del anterior. Lee el cifrado: tras la barra, el bajo.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'G3', tipo: 'mayor', inversion: 1, cifrado: true, mensaje: `**G/B** = ${notasEs(acorde('G3', 'mayor', 1))}: justo debajo de Do mayor.` },
          { raiz: 'F3', tipo: 'mayor', inversion: 1, cifrado: true, mensaje: `**F/A** = ${notasEs(acorde('F3', 'mayor', 1))}: sigue bajando desde Am.` },
          { raiz: 'C3', tipo: 'mayor', inversion: 2, cifrado: true, mensaje: `**C/G** = ${notasEs(acorde('C3', 'mayor', 2))}: Sol abajo, en la 2.ª inversión.` },
        ],
      },
      piano: PIANO_BAJO,
    },

    // 8 · O1 — ¿Cuál tiene el bajo que camina?
    {
      tipo: 'elegir',
      titulo: '¿Cuál camina?',
      intro: 'La misma progresión dos veces: saltando o con inversiones.',
      rondas: [
        camina(SALTANDO, CAMINANDO, 'Con **G/B** el bajo baja Do, **Si**, La. Saltando, el bajo va Do, Sol, La.'),
        camina(
          [acorde('F3', 'mayor'), acorde('C4', 'mayor'), acorde('D4', 'menor')],
          [acorde('F3', 'mayor'), ['E3', 'G3', 'C4'], acorde('D3', 'menor')],
          'F – **C/E** – Dm: el bajo baja Fa, **Mi**, Re, nota a nota.',
        ),
        camina(
          [acorde('G3', 'mayor'), acorde('D4', 'mayor'), acorde('E4', 'menor')],
          [acorde('G3', 'mayor'), ['F#3', 'A3', 'D4'], acorde('E3', 'menor')],
          'En Sol: G – **D/F♯** – Em. El bajo baja Sol, **Fa♯**, Mi.',
        ),
      ],
    },

    // 9 · L2 — El bajo aparte
    {
      tipo: 'texto',
      titulo: 'El bajo aparte',
      parrafos: [
        'En un beat, el **bajo** (un 808 o un bajo synth) suele ir **solo y grave**, en la octava 2, tocando la **fundamental** de cada acorde.',
        'Encima, los acordes van **invertidos** para moverse poco. El oído oye el acorde «sobre» el bajo: aunque arriba esté invertido, abajo manda la fundamental.',
      ],
      sonidos: [
        seguidos(CAMINANDO, 'Solo los acordes'),
        seguidos(conBajo(CAMINANDO, ['C2', 'G2', 'A2']), '+ el bajo en la fundamental'),
        seguidos(conBajo(CAMINANDO, ['C2', 'B1', 'A1']), '+ el bajo que camina'),
      ],
      nota: 'Regla de producción: **pocas notas en el grave**. Dos notas a menos de una 5.ª en la octava 2 se embarran.',
    },

    // 10 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué cambia en una inversión?',
          opciones: ['Qué nota queda abajo', 'Las notas del acorde', 'El tipo de acorde'],
          correcta: 0,
          explicacion: 'Las tres notas son las mismas; cambia **el bajo**.',
        },
        {
          pregunta: '¿Qué significa **C/E**?',
          opciones: ['Do mayor con Mi en el bajo', 'Do mayor y luego Mi mayor', 'Do menor con Mi'],
          correcta: 0,
          explicacion: 'Tras la barra va **la nota del bajo**: Do mayor en 1.ª inversión.',
        },
        {
          pregunta: 'En la **2.ª inversión**, ¿qué nota está abajo?',
          opciones: ['La 5.ª', 'La 3.ª', 'La fundamental'],
          correcta: 0,
          explicacion: `La **5.ª**: Do mayor en 2.ª inversión = ${notasEs(acorde('C4', 'mayor', 2))}.`,
        },
        {
          pregunta: `¿Cuál es **G/B**?`,
          opciones: [notasEs(acorde('G3', 'mayor', 1)), notasEs(acorde('G3', 'mayor', 0)), 'Si · Re · Fa♯'],
          correcta: 0,
          explicacion: `Sol mayor con **${bajoDe('G3', 'mayor', 1)}** en el bajo. Si · Re · Fa♯ sería Si menor.`,
        },
        {
          pregunta: '¿Para qué sirven las inversiones en una progresión?',
          opciones: ['Para que las voces se muevan poco y suene suave', 'Para cambiar de tonalidad', 'Para que los acordes sean menores'],
          correcta: 0,
          explicacion: 'Cada nota va **a la más cercana**: es la conducción de voces.',
        },
      ],
    },

    // 11 · L5 — ¿Qué se siente? Fundamental contra 2.ª inversión
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Do mayor, dos posiciones.',
      lados: [
        {
          etiqueta: 'Fundamental',
          emociones: 'Firme, apoyado, final',
          ejemplos: 'Con la fundamental abajo, el acorde «pisa el suelo»: así terminan las canciones.',
          sonido: bloque(['C3', ...acorde('C4', 'mayor')], 'Escuchar C'),
        },
        {
          etiqueta: '2.ª inversión',
          emociones: 'Flotando, de paso, sin apoyo',
          ejemplos: 'Con la 5.ª abajo suena en el aire: se usa de paso, camino a otro acorde.',
          sonido: bloque(['G3', ...acorde('C4', 'mayor', 2)], 'Escuchar C/G'),
        },
      ],
      nota: 'La **1.ª inversión** queda en medio: más ligera que la fundamental, pero estable. Es la más usada para que el bajo camine.',
    },

    // 12 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: inversiones y un bajo',
      minutos: 15,
      objetivo: 'Pasar una progresión de saltos a inversiones que se muevan poco y añadirle un bajo aparte.',
      pasos: [
        'En el **Piano roll** escribe **C – G – Am – F**, un acorde por compás, todos en estado fundamental: **C5-E5-G5**, **G5-B5-D6**, **A5-C6-E6**, **F5-A5-C6** (nombres de FL).',
        'Invierte el **G**: selecciona su nota de arriba (**D6**) y bájala una octava con **Ctrl + ↓**. Ahora es **G/D**, más cerca del C.',
        'Haz lo mismo con **Am** (baja **C6** y **E6**: queda C5-E5-A5) y con **F** (baja solo **C6**: queda C5-F5-A5). Mira cómo casi todas las notas se quedan quietas.',
        'En **otra pista** (un bajo o un 808), escribe solo la **fundamental** de cada acorde en la octava 3 de FL (nuestra 2): **C3, G3, A3, F3**.',
        'Escucha con y sin el bajo. Prueba también un bajo que camine: **C3, B2, A2, F2**.',
      ],
      consejo: 'Si una inversión suena hueca, revisa que no falte ninguna de las tres notas: solo cambia el orden.',
      reflexion: '¿Qué versión de los acordes suena más suave? ¿Cuál de los dos bajos te gustó más?',
    },
  ],
}
