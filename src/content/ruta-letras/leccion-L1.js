// Ruta de letras · L1 — Rima consonante y asonante.
// Lección corta (~5 min) que vive EN la ruta de letras (no en un módulo): `ruta: 'letras'` en lugar de `modulo`.
// Los versos son originales (escritos para la app) y se colorean con el motor de src/letras/ (como en #/letras).
// Formato: src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md

const TIPOS = ['Consonante', 'Asonante', 'No riman']

/** Ronda del quiz: dos palabras y qué rima hacen (0 consonante, 1 asonante, 2 no riman). */
const par = (a, b, correcta, explicacion) => ({ pregunta: `*${a}* y *${b}*`, opciones: TIPOS, correcta, explicacion })

export default {
  id: 'L1',
  ruta: 'letras',
  titulo: 'Rima consonante y asonante',
  subtitulo: 'Desde la vocal que suena fuerte',
  minutos: 5,
  resumen: [
    'Dos palabras riman si suenan igual **desde la vocal que suena más fuerte** hasta el final.',
    '**Consonante**: suena igual todo (vocales y consonantes): *corazón* · *razón*.',
    '**Asonante**: solo se repiten las vocales: *noche* · *golpe* (o‑e).',
    'En tu cuaderno, la consonante sale **rellena de color** y la asonante **subrayada**.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: '¿Cuándo riman dos palabras?',
      parrafos: [
        'Cuando suenan igual **desde la vocal que suena más fuerte** hasta el final.',
        'En *co-ra-zón* suena fuerte la última sílaba, **zón**; en *ra-zón*, también. Desde esa «ó» todo es igual: **‑ón**.',
      ],
      letra: { texto: 'Me late fuerte el corazón\ny no le encuentro la razón' },
    },
    {
      tipo: 'texto',
      titulo: 'Rima consonante',
      parrafos: [
        'Si se repite **todo** (vocales y consonantes), es **consonante**. Es la rima más fuerte: se oye enseguida.',
        '*calle* · *valle*, *amor* · *dolor*, *ciudad* · *verdad*.',
      ],
      letra: { texto: 'Te busqué por toda la ciudad\ny al final no hubo verdad' },
      nota: 'En tu cuaderno de letras, la consonante sale **rellena de color**.',
    },
    {
      tipo: 'texto',
      titulo: 'Rima asonante',
      parrafos: [
        'Si solo se repiten **las vocales**, es **asonante**: *no-che* y *gol-pe* comparten **o‑e** aunque las consonantes cambien.',
        'Es más suave y te deja muchas más palabras para elegir: en el rap y en las canciones se usa todo el tiempo.',
      ],
      letra: { texto: 'Camino solo por la noche\ncada paso suena como un golpe', leyenda: true },
    },
    {
      tipo: 'elegir',
      titulo: '¿Qué rima hacen?',
      rondas: [
        par('calle', 'valle', 0, 'Desde la «a» fuerte suena igual todo: **‑alle**.'),
        par('luna', 'duda', 1, 'Solo se repiten las vocales **u‑a**; las consonantes (n, d) cambian.'),
        par('amor', 'dolor', 0, 'Todo igual desde la «o» fuerte: **‑or**.'),
        par('fuego', 'cielo', 1, 'Comparten **e‑o** desde la vocal fuerte; lo demás cambia.'),
        par('mar', 'papel', 2, 'La vocal fuerte es distinta (**a** y **e**): no riman.'),
      ],
    },
    {
      tipo: 'marcar',
      titulo: 'Encuentra las rimas',
      rondas: [
        {
          pregunta: 'Toca las palabras que riman en **consonante** con *corazón*.',
          texto: 'Te escribo esta canción\ncon todo el corazón\nme sobra la razón\npero me falta amor',
          fijas: ['corazón'],
          correctas: ['canción', 'razón'],
          explicacion: '*canción* y *razón* acaban en **‑ón** como *corazón*. *Amor* solo comparte la «o»: es asonante.',
        },
        {
          pregunta: 'Ahora las que riman **solo en asonante** (o‑e) con *noche*.',
          texto: 'Cruzo la ciudad de noche\ncon tu nombre en el coche\ncada recuerdo es un golpe\ny la luna no responde',
          fijas: ['noche'],
          correctas: ['nombre', 'golpe', 'responde'],
          explicacion: '*nombre*, *golpe* y *responde* repiten **o‑e**. *Coche* repite todo (‑oche): esa es consonante.',
        },
      ],
    },
  ],
}
