// Lección 3.2 — Los intervalos y su carácter.
// Pasa de «contar semitonos» (3.1) a NOMBRAR la distancia: 2.ª m/M, 3.ª m/M, 4.ª J, tritono, 5.ª J, 6.ª m/M,
// 7.ª m/M y octava, cada uno con una canción de referencia y su carácter. Interacción nueva: O6 «Emparejar».
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Los nombres, semitonos y notas de cada intervalo salen de src/theory/intervalos.js (Tonal.js).
import { datosIntervalo, nombreIntervalo, notaIntervalo } from '../../theory/intervalos.js'
import { nombre } from '../../theory/notas.js'

/** Nombre en español sin octava: 'F#4' → 'Fa♯'. */
const es = (n) => nombre(n, { octava: false })
const semis = (id) => datosIntervalo(id).semitonos
const plural = (n) => `${n} semitono${n === 1 ? '' : 's'}`

/** Sonido de un intervalo desde `desde`: melódico (sube o baja) o armónico (a la vez). */
function intervalo(desde, id, { dir = 1, juntas = false, etiqueta } = {}) {
  const otra = notaIntervalo(desde, id, dir)
  if (juntas) return { etiqueta, notas: [desde, otra], modo: 'acorde', duracion: 1.6 }
  return { etiqueta, notas: [desde, otra], intervalo: 0.7, duracion: 1.1 }
}

/** «Do → Mi · 4 semitonos» (para las fichas y el detalle al emparejar). */
function detalle(desde, id, dir = 1) {
  return `${es(desde)} → ${es(notaIntervalo(desde, id, dir))} · ${plural(semis(id))}`
}

/** Canción de referencia de cada intervalo (subiendo, salvo que se diga). */
const CANCION = {
  '2m': '«Tiburón» (el tema de la película)',
  '2M': '«Cumpleaños feliz» («Cum-ple-»)',
  '3m': '«Hey Jude» (bajando)',
  '3M': '«When the Saints Go Marching In» («Oh, when the»)',
  '4P': '«La cucaracha» y la marcha nupcial',
  '4A': '«Los Simpson» (el comienzo del tema)',
  '5P': '«Estrellita, ¿dónde estás?» y «Star Wars»',
  '6m': '«The Entertainer» (el salto tras el arranque)',
  '6M': '«My Bonnie Lies Over the Ocean»',
  '7m': '«Star Trek» (la serie original)',
  '7M': '«Don’t Know Why» (Norah Jones)',
  '8P': '«Somewhere Over the Rainbow» («Some-where»)',
}

/** Una fila de la tabla: nombre, canción, semitonos y su sonido desde Do. */
function ficha(id, desde = 'C4') {
  return { nombre: nombreIntervalo(id), texto: CANCION[id], dato: semis(id), sonido: intervalo(desde, id) }
}

/** Una pareja para «Emparejar»: el sonido y su nombre. */
function pareja(desde, id, dir = 1) {
  return { sonido: intervalo(desde, id, { dir }), nombre: nombreIntervalo(id), detalle: detalle(desde, id, dir) }
}

/** Ronda «¿qué intervalo suena?» con opciones de nombre. */
function queIntervalo(desde, id, opciones, explicacion, { dir = 1, juntas = false } = {}) {
  return {
    pregunta: dir < 0 ? '¿Qué intervalo suena? (baja)' : juntas ? '¿Qué intervalo suena? (a la vez)' : '¿Qué intervalo suena?',
    sonidos: [intervalo(desde, id, { dir, juntas, etiqueta: 'Escuchar' })],
    opciones: opciones.map(nombreIntervalo),
    correcta: opciones.indexOf(id),
    explicacion,
  }
}

// Melodías cortas de dominio público para oír el intervalo «dentro» de una canción.
const CUMPLEANOS = { etiqueta: '«Cumpleaños feliz»: 2.ª mayor', notas: ['G4', 'G4', 'A4', 'G4', 'C5', 'B4'], intervalo: 0.38, duracion: 0.5 }
const SANTOS = { etiqueta: '«When the Saints»: 3.ª mayor', notas: ['C4', 'E4', 'F4', 'G4'], intervalo: 0.42, duracion: 0.6 }
const CUCARACHA = { etiqueta: '«La cucaracha»: 4.ª justa', notas: ['C4', 'C4', 'C4', 'F4', 'A4'], intervalo: 0.24, duracion: 0.5 }
const ESTRELLITA = { etiqueta: '«Estrellita»: 5.ª justa', notas: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'], intervalo: 0.4, duracion: 0.5 }

export default {
  id: '3.2',
  modulo: 3,
  titulo: 'Los intervalos y su carácter',
  subtitulo: 'Ponerle nombre a la distancia',
  minutos: 15,
  resumen: [
    'Un **intervalo** es la distancia entre dos notas. Se nombra con un **número** (cuenta las letras: Do-Re-Mi = 3.ª) y un **apellido** (menor, mayor o justa).',
    'Por semitonos: **2.ª m** 1 · **2.ª M** 2 · **3.ª m** 3 · **3.ª M** 4 · **4.ª J** 5 · **tritono** 6 · **5.ª J** 7 · **6.ª m** 8 · **6.ª M** 9 · **7.ª m** 10 · **7.ª M** 11 · **octava** 12.',
    'Las **canciones de referencia** son el atajo para reconocerlos: «Cumpleaños feliz» (2.ª M), «Estrellita» (5.ª J), «Somewhere Over the Rainbow» (octava)…',
    '**Consonantes** (3.ª, 5.ª, octava): reposan. **Disonantes** (2.ª m, tritono, 7.ª M): tensión que pide moverse.',
    'La **3.ª** decide el color: **menor** = melancólica, **mayor** = luminosa. Es la base de los acordes del módulo 4.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Las dos tarjetas tocan dos notas a la vez, con Do abajo. Solo cambia la de arriba.',
      rondas: [
        {
          pregunta: '¿Cuál suena inquieta, como si pidiera moverse?',
          sonidos: [intervalo('C4', '4A', { juntas: true }), intervalo('C4', '5P', { juntas: true })],
          correcta: 0,
          mezclar: true,
          explicacion:
            '**Do + Fa♯** (el **tritono**) suena inestable: pide resolver. **Do + Sol** (la **5.ª justa**) reposa, hueca y firme. Cada distancia entre dos notas tiene su **carácter**: eso es esta lección.',
        },
      ],
    },

    // 1 · L2 — Qué es un intervalo y cómo se nombra
    {
      tipo: 'texto',
      titulo: 'Un nombre para cada distancia',
      parrafos: [
        'Un **intervalo** es la distancia entre dos notas. En la 3.1 la mediste en semitonos; ahora le vas a poner **nombre**.',
        'El nombre tiene un **número**: cuenta las letras de una nota a la otra, **incluyendo las dos**. Do-Re-Mi son 3 letras: de Do a Mi hay una **3.ª** (tercera).',
        'Y un **apellido**: **menor** o **mayor** según los semitonos (Do → Mi♭ es una 3.ª menor; Do → Mi, una 3.ª mayor). La 4.ª, la 5.ª y la octava se llaman **justas**.',
        'Si las notas suenan **una detrás de otra** es un intervalo **melódico**; si suenan **a la vez**, **armónico**.',
      ],
      sonidos: [
        intervalo('C4', '3M', { etiqueta: 'Melódico: Do → Mi' }),
        intervalo('C4', '3M', { juntas: true, etiqueta: 'Armónico: Do + Mi' }),
        intervalo('C4', '3m', { etiqueta: '3.ª menor: Do → Mi♭' }),
        intervalo('C4', '3M', { etiqueta: '3.ª mayor: Do → Mi' }),
      ],
      nota: 'En inglés se escriben con letras: **m3** (menor), **M3** (mayor), **P5** (justa, de *perfect*). Lo verás así en plugins y tutoriales.',
    },

    // 2 · O2 — ¿Menor o mayor? (la 3.ª decide el color)
    {
      tipo: 'elegir',
      titulo: '¿Tercera menor o mayor?',
      intro: 'Solo cambia un semitono. La menor suena más oscura; la mayor, más luminosa.',
      rondas: [
        queIntervalo('C4', '3M', ['3m', '3M'], '**Do → Mi**: 4 semitonos, **3.ª mayor**. Luminosa.'),
        queIntervalo('D4', '3m', ['3m', '3M'], '**Re → Fa**: 3 semitonos, **3.ª menor**. Más oscura.'),
        queIntervalo('G4', '3M', ['3m', '3M'], '**Sol + Si** a la vez: **3.ª mayor**. Suena abierta y alegre.', { juntas: true }),
        queIntervalo('A3', '3m', ['3m', '3M'], '**La + Do** a la vez: **3.ª menor**. Suena íntima, melancólica.', { juntas: true }),
      ],
    },

    // 3 · L2 — Segundas y terceras (fichas)
    {
      tipo: 'texto',
      titulo: 'Segundas y terceras',
      intro: 'Toca cada fila para oírla desde Do. La canción es tu atajo para reconocerla.',
      parrafos: [
        'Las **segundas** son los pasos de la 3.1: la **menor** es un semitono (roza) y la **mayor**, un tono (camina).',
        'Las **terceras** ya saltan. La **menor** (3 semitonos) suena **melancólica**; la **mayor** (4) suena **luminosa**. Esa diferencia de un solo semitono es la de los acordes menores y mayores.',
      ],
      fichas: { nombre: 'Intervalo', dato: 'Semitonos', filas: ['2m', '2M', '3m', '3M'].map((id) => ficha(id)) },
      sonidos: [CUMPLEANOS, SANTOS],
    },

    // 4 · O2 — ¿Segunda o tercera?
    {
      tipo: 'elegir',
      titulo: '¿Segunda o tercera?',
      intro: 'Piensa en la canción de cada una. Puedes escuchar las veces que quieras.',
      rondas: [
        queIntervalo('D4', '2M', ['2m', '2M', '3m', '3M'], '**Re → Mi**: un tono, **2.ª mayor**. Como «Cum-ple».'),
        queIntervalo('E4', '3M', ['2m', '2M', '3m', '3M'], '**Mi → Sol♯**: 4 semitonos, **3.ª mayor**. Luminosa, como «When the Saints».'),
        queIntervalo('A4', '3m', ['2m', '2M', '3m', '3M'], '**La → Do**: 3 semitonos, **3.ª menor**. Más oscura que la mayor.'),
        queIntervalo('B4', '2m', ['2m', '2M', '3m', '3M'], '**Si → Do**: un semitono, **2.ª menor**. Ese roce es el de «Tiburón».'),
        queIntervalo('C5', '3m', ['2m', '2M', '3m', '3M'], '**Do → La** bajando: **3.ª menor**. Es el «Hey Jude».', { dir: -1 }),
      ],
    },

    // 5 · L2 — Cuartas, tritono y quintas
    {
      tipo: 'texto',
      titulo: 'Cuarta, tritono y quinta',
      parrafos: [
        'La **4.ª justa** (5 semitonos) suena **abierta**, como un llamado: así arrancan «La cucaracha» y la marcha nupcial.',
        'La **5.ª justa** (7) es **hueca y estable**: la de «Estrellita» y «Star Wars». Tocada a la vez es el **power chord** del rock.',
        'Justo en medio, con **6 semitonos** (tres tonos, de ahí su nombre), el **tritono**: el más **inestable**. Lo llamaban «el diablo en la música» y con él empieza el tema de «Los Simpson».',
      ],
      fichas: { nombre: 'Intervalo', dato: 'Semitonos', filas: ['4P', '4A', '5P'].map((id) => ficha(id)) },
      sonidos: [CUCARACHA, ESTRELLITA],
    },

    // 6 · P7 — Construir un intervalo (con nombres)
    {
      tipo: 'tocar',
      titulo: 'Constrúyelos en el teclado',
      intro: 'Desde la nota marcada, toca la que forma el intervalo. Cuenta los semitonos (los saltos, no las teclas).',
      objetivo: {
        tipo: 'paso',
        rondas: [
          { desde: 'C4', intervalo: '5P', direccion: 'sube', pista: 'Desde Do, cuenta 7 saltos: llegas a **Sol**.' },
          { desde: 'D4', intervalo: '3M', direccion: 'sube', pista: 'Desde Re, 4 saltos llegan a una **negra**: Fa♯.' },
          { desde: 'E4', intervalo: '4P', direccion: 'sube', pista: 'Cuenta desde Mi: Fa, Fa♯, Sol, Sol♯, **La**.' },
          { desde: 'F4', intervalo: '4A', direccion: 'sube', pista: 'Son 3 tonos: Fa → Sol → La → **Si**.' },
          { desde: 'A4', intervalo: '3m', direccion: 'baja', pista: 'Hacia la izquierda desde La: Sol♯, Sol, **Fa♯**.' },
        ],
      },
      piano: { startOctave: 4, octaves: 1 },
    },

    // 7 · O6 — Emparejar (2.ª a 5.ª)
    {
      tipo: 'emparejar',
      titulo: 'Empareja sonido y nombre',
      intro: 'Escucha cada sonido y toca su nombre. Para quitar uno, tócalo.',
      rondas: [
        {
          pregunta: 'Desde Do, subiendo',
          parejas: [pareja('C4', '2M'), pareja('C4', '3M'), pareja('C4', '4P'), pareja('C4', '5P')],
          explicacion: 'De menor a mayor distancia: **2.ª M** (camina), **3.ª M** (luminosa), **4.ª J** (llamada) y **5.ª J** (hueca).',
        },
        {
          pregunta: 'Desde otras notas',
          parejas: [pareja('E4', '2m'), pareja('D4', '3m'), pareja('F4', '4A'), pareja('G4', '5P')],
          explicacion: 'La **2.ª m** roza, la **3.ª m** es melancólica, el **tritono** inquieta y la **5.ª J** reposa.',
        },
      ],
    },

    // 8 · L2 — Sextas, séptimas y octava
    {
      tipo: 'texto',
      titulo: 'Sextas, séptimas y la octava',
      parrafos: [
        'Las **sextas** son saltos grandes y **cantables**: la **menor** (8) es dulce y algo triste; la **mayor** (9), cálida.',
        'Las **séptimas** se quedan **a punto de llegar**: la **menor** (10) suena a blues y pide moverse; la **mayor** (11) está a un semitono de la octava y es muy tensa.',
        'La **octava** (12) es la misma nota más aguda: todo vuelve a empezar.',
      ],
      fichas: { nombre: 'Intervalo', dato: 'Semitonos', filas: ['6m', '6M', '7m', '7M', '8P'].map((id) => ficha(id)) },
      nota: 'Truco para los grandes: una **7.ª mayor** es una octava **menos un semitono**. Y si das la vuelta a un intervalo, los números suman 9: Do → La subiendo es una **6.ª mayor**; La → Do subiendo, una **3.ª menor** (6 + 3 = 9).',
    },

    // 9 · O6 — Emparejar (6.ª a octava y mezcla)
    {
      tipo: 'emparejar',
      titulo: 'Empareja los grandes',
      intro: 'Los saltos grandes se parecen más. Piensa en su canción.',
      rondas: [
        {
          pregunta: 'Desde Do, subiendo',
          parejas: [pareja('C4', '6m'), pareja('C4', '6M'), pareja('C4', '7m'), pareja('C4', '8P')],
          explicacion: '**6.ª m** dulce, **6.ª M** cálida («My Bonnie»), **7.ª m** pide moverse («Star Trek») y la **octava** es la misma nota más aguda.',
        },
        {
          pregunta: 'Mezcla de todo',
          parejas: [pareja('D4', '3M'), pareja('C4', '4A'), pareja('E4', '6M'), pareja('C4', '7M')],
          explicacion: 'La **7.ª M** casi llega a la octava; la **6.ª M** es más amplia que la 3.ª M; el **tritono** sigue sonando inquieto desde cualquier nota.',
        },
      ],
    },

    // 10 · O2 — ¿Qué intervalo suena? (de todo, también bajando y a la vez)
    {
      tipo: 'elegir',
      titulo: '¿Qué intervalo suena?',
      intro: 'Ahora de todo un poco, también bajando y a la vez.',
      rondas: [
        queIntervalo('G3', '8P', ['5P', '6M', '7M', '8P'], '**Sol → Sol**: 12 semitonos, la **octava**. «Some-where».'),
        queIntervalo('C4', '6M', ['4P', '5P', '6M', '7m'], '**Do → La**: 9 semitonos, **6.ª mayor**. Cálida y amplia.'),
        queIntervalo('G4', '3M', ['3m', '3M', '4P', '5P'], '**Sol → Mi♭** bajando: 4 semitonos, **3.ª mayor**. Es el «ta-ta-ta-taaa» de la Quinta de Beethoven.', { dir: -1 }),
        queIntervalo('D4', '5P', ['4P', '4A', '5P', '6m'], '**Re + La** a la vez: **5.ª justa**, el power chord. Hueca y firme.', { juntas: true }),
        queIntervalo('C4', '7m', ['6M', '7m', '7M', '8P'], '**Do → Si♭**: 10 semitonos, **7.ª menor**. Un semitono menos que la mayor, que casi toca la octava.'),
        queIntervalo('A3', '4A', ['4P', '4A', '5P', '3M'], '**La → Re♯**: 6 semitonos, el **tritono**. Inquieto, pide resolver.'),
      ],
    },

    // 11 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cuántos semitonos tiene una 5.ª justa?',
          opciones: ['5', '6', '7', '8'],
          correcta: 2,
          explicacion: 'Una **5.ª justa** son **7 semitonos** (Do → Sol). La 4.ª justa tiene 5 y el tritono, 6.',
        },
        {
          pregunta: 'De Do a Mi♭ hay…',
          opciones: ['Una 2.ª mayor', 'Una 3.ª menor', 'Una 3.ª mayor'],
          correcta: 1,
          explicacion: 'Do-Re-Mi = 3 letras: es una **3.ª**. Con 3 semitonos es **menor** (con Mi natural, 4, sería mayor).',
        },
        {
          pregunta: '¿Por qué el tritono se llama así?',
          opciones: ['Tiene tres notas', 'Mide tres tonos', 'Es la tercera nota de la escala'],
          correcta: 1,
          explicacion: '**Tri-tono**: 3 tonos = 6 semitonos, justo la mitad de la octava.',
        },
        {
          pregunta: 'En el Piano Roll, una 3.ª mayor hacia arriba son…',
          opciones: ['3 filas', '4 filas', '5 filas'],
          correcta: 1,
          explicacion: 'Cada fila es un semitono y la **3.ª mayor** tiene **4**: sube 4 filas.',
        },
        {
          pregunta: '¿Qué intervalo es el comienzo de «Somewhere Over the Rainbow»?',
          opciones: ['Una 5.ª justa', 'Una 7.ª mayor', 'Una octava'],
          correcta: 2,
          explicacion: '«Some-where» salta una **octava**: la misma nota, más aguda.',
        },
      ],
    },

    // 12 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Tocados a la vez, unos intervalos reposan y otros chocan.',
      lados: [
        {
          etiqueta: 'Consonantes',
          emociones: 'Reposo, estabilidad, hogar',
          ejemplos: '3.ª, 5.ª y octava. El power chord (5.ª), el final de una canción, los acordes que «cierran».',
          sonido: {
            etiqueta: 'Escuchar 3.ª, 5.ª y octava',
            notas: [['C4', 'E4'], ['C4', 'G4'], ['C4', 'C5']],
            intervalo: 0.9,
            duracion: 1.2,
          },
        },
        {
          etiqueta: 'Disonantes',
          emociones: 'Tensión, choque, ganas de moverse',
          ejemplos: '2.ª menor, tritono y 7.ª mayor. Suspenso, sirenas, el acorde justo antes del final.',
          sonido: {
            etiqueta: 'Escuchar 2.ª m, tritono y 7.ª M',
            notas: [['C4', 'C#4'], ['C4', 'F#4'], ['C4', 'B4']],
            intervalo: 0.9,
            duracion: 1.2,
          },
        },
      ],
      nota: 'La tensión no es mala: la música avanza **de la disonancia a la consonancia**. Un tritono que se resuelve en una 3.ª es el corazón de la cadencia más fuerte (lo verás en los acordes).',
    },

    // 13 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu tabla de intervalos',
      minutos: 15,
      objetivo: 'Construir los intervalos contando filas en el Piano roll y escribir un riff con su carácter.',
      pasos: [
        'Abre el **Piano roll** de un piano. Dibuja **C5** (nuestro Do4) y, a la vez, la nota **4 filas** más arriba (E5): una **3.ª mayor**. Escúchala.',
        'En los compases siguientes, deja C5 y cambia la de arriba: **3 filas** (3.ª m), **5** (4.ª J), **6** (tritono), **7** (5.ª J) y **12** (octava). Compara cuáles reposan y cuáles chocan.',
        'Haz un **power chord**: C4 + G4 (5.ª justa) y súbele una octava a la de abajo (C5). Cópialo en otras notas: es la base del rock y del trap oscuro.',
        'Escribe un riff de **4 notas** usando solo **4.ª y 5.ª**. Luego cambia una nota para formar un **tritono** y escucha cómo cambia el carácter.',
        'Prueba a tararear el comienzo de una canción que te guste y búscalo en el roll: ¿qué intervalo es el primer salto?',
      ],
      consejo: 'Para nombrar un intervalo en FL, cuenta **filas** (semitonos) y usa la tabla: 3 = 3.ª m, 4 = 3.ª M, 5 = 4.ª J, 6 = tritono, 7 = 5.ª J, 12 = octava.',
      reflexion: '¿Qué intervalo te gustó más? ¿Encontraste el primer salto de alguna canción tuya?',
    },
  ],
}
