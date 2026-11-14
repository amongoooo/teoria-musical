// Prueba rápida «¿Ya lo sabes?» · banco del módulo 2 (Ritmo y groove).
// 3 preguntas por lección (la prueba toma una al azar). Formato: rondas de `elegir` (src/content/FORMATO.md).

const PT = 4 // casillas por tiempo de los patrones propios (semicorcheas)

/** Hi-hat con `porTiempo` golpes en cada tiempo, sobre un clic (bombo en el 1). Como en la 2.3. */
function hats(porTiempo, bpm = 90) {
  const cada = PT / porTiempo
  return {
    etiqueta: 'Escuchar',
    bpm,
    compases: 2,
    porTiempo: PT,
    groove: [
      { nota: 'kick', inicio: 0, velocity: 0.9 },
      ...[0, 1, 2, 3].map((t) => ({ nota: 'click', inicio: t * PT, velocity: t === 0 ? 0.8 : 0.4 })),
      ...Array.from({ length: (4 * PT) / cada }, (_, i) => ({ nota: 'hat', inicio: i * cada, velocity: i % porTiempo === 0 ? 0.7 : 0.45 })),
    ],
  }
}

/** Do → Fa con un clic más fuerte en cada 1; el Fa llega en el 1 o se adelanta a la «y» del 4. Como en la 2.4. */
function acordes(anticipado, bpm = 92) {
  const fa = anticipado ? 7 : 8
  const acorde = (notas, inicio, duracion) => notas.map((n) => ({ nota: n, inicio, duracion, velocity: n.endsWith('2') || n.endsWith('3') ? 0.75 : 0.5 }))
  return {
    etiqueta: 'Escuchar',
    bpm,
    compases: 2,
    tiempos: 8,
    porTiempo: 2,
    groove: [
      ...Array.from({ length: 8 }, (_, t) => ({ nota: 'click', inicio: t * 2, velocity: t % 4 === 0 ? 0.55 : 0.3 })),
      ...acorde(['C3', 'E4', 'G4', 'C5'], 0, fa),
      ...acorde(['F2', 'F4', 'A4', 'C5'], fa, 16 - fa),
    ],
  }
}

/** Palmas en corcheas (`casillas`: 0 = el 1, 1 = la «y» del 1…) sobre un clic suave en cada tiempo. */
function palmas(casillas, bpm = 90) {
  return {
    etiqueta: 'Escuchar',
    bpm,
    compases: 2,
    tiempos: 4,
    porTiempo: 2,
    groove: [
      ...[0, 1, 2, 3].map((t) => ({ nota: 'click', inicio: t * 2, velocity: t === 0 ? 0.55 : 0.3 })),
      ...casillas.map((inicio) => ({ nota: 'clap', inicio, velocity: 0.85 })),
    ],
  }
}

const COMPASES = ['**4/4**: cuenta «1 2 3 4»', '**3/4**: cuenta «1 2 3»']
const FIGURAS = ['**Negras**: 1 por tiempo', '**Corcheas**: 2 por tiempo', '**Semicorcheas**: 4 por tiempo']
const RECTO_O_SWING = ['**Recto**: corcheas iguales', '**Con swing**: «largo-corto»']

export default {
  '2.1': [
    {
      pregunta: '¿Cuál va **más rápido**?',
      sonidos: [
        { groove: 'basico', bpm: 92, compases: 2 },
        { groove: 'basico', bpm: 104, compases: 2 },
      ],
      correcta: 1,
      mezclar: true,
      explicacion: 'Es el mismo beat a **92 y 104 BPM**: más pulsos por minuto, más rápido.',
    },
    {
      pregunta: '**120 BPM** son…',
      opciones: ['1 pulso por segundo', '2 pulsos por segundo', '120 pulsos por segundo'],
      correcta: 1,
      explicacion: 'BPM = pulsos por **minuto**. 120 ÷ 60 s = **2 por segundo** (60 BPM sería 1 por segundo).',
    },
    {
      pregunta: 'Más o menos, ¿a qué tempo va este clic?',
      sonidos: [{ groove: 'click', bpm: 60, compases: 2 }],
      opciones: ['60 BPM', '90 BPM', '120 BPM'],
      correcta: 0,
      explicacion: 'Un clic **por segundo**, como un reloj: **60 BPM**.',
    },
  ],
  '2.2': [
    {
      pregunta: '¿En cuánto cuenta este beat?',
      sonidos: [{ groove: 'vals', bpm: 150, compases: 4 }],
      opciones: COMPASES,
      correcta: 1,
      explicacion: 'Un golpe fuerte y dos suaves: «**1** 2 3, **1** 2 3». Es un vals, en **3/4**.',
    },
    {
      pregunta: '¿Y este?',
      sonidos: [{ groove: 'basico', bpm: 95, compases: 2 }],
      opciones: COMPASES,
      correcta: 0,
      explicacion: 'Bombo en el 1 y caja en el 2 y el 4: «**1** 2 3 4». **4/4**, el de casi todo el pop.',
    },
    {
      pregunta: 'En un compás de 4/4, ¿cuál es el tiempo **más fuerte**?',
      opciones: ['El 1', 'El 2', 'El 4'],
      correcta: 0,
      explicacion: 'El **1** abre el compás: es el más fuerte. (La caja suele ir en el 2 y el 4, pero el apoyo es el 1).',
    },
  ],
  '2.3': [
    {
      pregunta: '¿Qué figura toca el **hi-hat**?',
      sonidos: [hats(2)],
      opciones: FIGURAS,
      correcta: 1,
      explicacion: 'Dos golpes en cada tiempo: «1 y 2 y»: **corcheas**.',
    },
    {
      pregunta: '¿Y aquí?',
      sonidos: [hats(4)],
      opciones: FIGURAS,
      correcta: 2,
      explicacion: 'Cuatro golpes por tiempo: «1 e y a»: **semicorcheas**.',
    },
    {
      pregunta: '¿Cuántas **corcheas** caben en una **blanca**?',
      opciones: ['2', '4', '8'],
      correcta: 1,
      explicacion: 'Una blanca dura 2 tiempos y cada corchea medio tiempo: **4 corcheas**.',
    },
  ],
  '2.4': [
    {
      pregunta: '¿Cuándo cambia el acorde?',
      sonidos: [acordes(true)],
      opciones: ['**A tiempo**: justo en el 1', '**Se adelanta**: en la «y» del 4', '**Tarde**: en el 2'],
      correcta: 1,
      explicacion: 'El Fa entra **antes** del clic fuerte, en la «y» del 4: es una **anticipación**.',
    },
    {
      pregunta: '¿Dónde caen las **palmas**?',
      sonidos: [palmas([1, 3, 5, 7])],
      opciones: ['**En los tiempos** (1 2 3 4)', '**Entre los tiempos** (en las «y»)', '**Solo en el 1**'],
      correcta: 1,
      explicacion: 'Cada palma cae justo entre dos clics, en la «y»: un ritmo **sincopado**, a contratiempo.',
    },
    {
      pregunta: 'Una **anticipación** es…',
      opciones: [
        'Un cambio que llega **medio tiempo antes** de su sitio',
        'Un cambio que llega **tarde**',
        'Tocar **más fuerte** el 1',
      ],
      correcta: 0,
      explicacion: 'El acorde (o la nota) se adelanta una corchea, a la «y» del 4, y sigue sonando sobre el 1.',
    },
  ],
  '2.5': [
    {
      pregunta: '¿Cuál tiene **swing**?',
      sonidos: [
        { groove: 'basico', bpm: 90, compases: 2 },
        { groove: 'shuffle', bpm: 90, compases: 2 },
      ],
      correcta: 1,
      mezclar: true,
      explicacion: 'En el de swing los hi-hats van «**largo**-corto»: la segunda corchea de cada tiempo se retrasa.',
    },
    {
      pregunta: '¿Recto o con swing?',
      sonidos: [{ groove: 'boomBapSwing', bpm: 88, compases: 2 }],
      opciones: RECTO_O_SWING,
      correcta: 1,
      explicacion: 'Las semicorcheas de en medio llegan un poco tarde: es el **Swing** del Channel rack.',
    },
    {
      pregunta: 'La **velocity** sirve para…',
      opciones: [
        'Cambiar el **tempo**',
        'Dar a cada nota su **fuerza**: acentos y *ghost notes*',
        'Mover las notas **fuera de la rejilla**',
      ],
      correcta: 1,
      explicacion: 'La velocity es **qué tan fuerte** se toca cada nota. Con ella el groove respira: golpes fuertes y otros casi fantasma.',
    },
  ],
}
