// Lección 2.3 — Figuras: de redonda a semicorchea (módulo 2 «Ritmo y groove»).
// Formato de los pasos: ver src/content/FORMATO.md (tipos `pulso`, `pianoroll` y sonidos `groove`).

/** Roll de batería: hi-hat, caja y bombo. */
const FILAS = ['hat', 'snare', 'kick']

const golpes = (nota, inicios, velocity) => inicios.map((inicio) => ({ nota, inicio, duracion: 1, ...(velocity ? { velocity } : {}) }))

/** Casillas por tiempo en los sonidos de figuras: 4 = cada casilla es una semicorchea. */
const PT = 4

/**
 * Sonido de figuras con metrónomo. `figuras` en tiempos (1 = negra, 0.5 = corchea…);
 * un número negativo es un **silencio** de esa duración. Antes suena un compás de clics
 * («1 2 3 4», o «1 2 3» con `compas: 3`) si `previa`. Las notas van recorriendo `notas`.
 */
function figuras(lista, { bpm = 90, notas = ['C4'], previa = true, compas = 4, etiqueta = 'Escuchar' } = {}) {
  const largo = lista.reduce((a, d) => a + Math.abs(d), 0)
  const cuenta = previa ? compas : 0
  const tiempos = cuenta + Math.ceil(largo)
  const eventos = Array.from({ length: tiempos }, (_, t) => ({ nota: 'click', inicio: t * PT, velocity: t % compas === 0 ? 0.9 : 0.45 }))
  let t = cuenta
  let k = 0
  for (const d of lista) {
    if (d > 0) {
      eventos.push({ nota: notas[k % notas.length], inicio: t * PT, duracion: d * PT, velocity: 0.8 })
      k += 1
    }
    t += Math.abs(d)
  }
  return { etiqueta, bpm, compases: 1, tiempos, porTiempo: PT, groove: eventos }
}

/** Hi-hat con `porTiempo` golpes en cada tiempo, sobre un clic de metrónomo (bombo en el 1). */
function hats(porTiempo, { bpm = 90, compases = 2, etiqueta = 'Escuchar' } = {}) {
  const casillas = 4 * PT
  const cada = PT / porTiempo
  return {
    etiqueta,
    bpm,
    compases,
    porTiempo: PT,
    groove: [
      { nota: 'kick', inicio: 0, velocity: 0.9 },
      ...[0, 1, 2, 3].map((t) => ({ nota: 'click', inicio: t * PT, velocity: t === 0 ? 0.8 : 0.4 })),
      ...Array.from({ length: casillas / cada }, (_, i) => ({ nota: 'hat', inicio: i * cada, velocity: i % porTiempo === 0 ? 0.7 : 0.45 })),
    ],
  }
}

const ESCALA = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

/** Pirámide de figuras para el Piano Roll: cada fila, una figura llenando el compás. */
const PIRAMIDE = {
  filas: ['C4', 'E4', 'G4', 'C5', 'E5'],
  nombres: { C4: 'Redonda', E4: 'Blanca', G4: 'Negra', C5: 'Corchea', E5: 'Semicorchea' },
  columnas: 16,
  porTiempo: 4,
  bpm: 70,
}
const NOTAS_PIRAMIDE = [
  { nota: 'C4', inicio: 0, duracion: 16 },
  ...[0, 8].map((inicio) => ({ nota: 'E4', inicio, duracion: 8 })),
  ...[0, 4, 8, 12].map((inicio) => ({ nota: 'G4', inicio, duracion: 4 })),
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((inicio) => ({ nota: 'C5', inicio, duracion: 2 })),
  ...Array.from({ length: 16 }, (_, inicio) => ({ nota: 'E5', inicio, duracion: 1, velocity: 0.55 })),
]

/** Beat básico en 16 pasos (como el Channel rack): bombo 1 y 9, caja 5 y 13, hi-hat en corcheas. */
const RACK = [...golpes('kick', [0, 8]), ...golpes('snare', [4, 12]), ...golpes('hat', [0, 2, 4, 6, 8, 10, 12, 14])]

/** Medio compás con hi-hat en semicorcheas: bombo en el 1, caja en el 2. */
const SEMIS = [...golpes('kick', [0]), ...golpes('snare', [4]), ...golpes('hat', [0, 1, 2, 3, 4, 5, 6, 7])]

/** Figuras para dibujar: blanca de Do, negra de Mi y dos corcheas de Sol (cada casilla = corchea). */
const DIBUJO = [
  { nota: 'C4', inicio: 0, duracion: 4 },
  { nota: 'E4', inicio: 4, duracion: 2 },
  { nota: 'G4', inicio: 6, duracion: 1 },
  { nota: 'G4', inicio: 7, duracion: 1 },
]

/** Clic en cada tiempo con hi-hat suave en semicorcheas: guía para tocar «1 e y a». */
const GUIA_SEMIS = [
  ...[0, 1, 2, 3].map((t) => ({ nota: 'click', inicio: t * 4, velocity: t === 0 ? 1 : 0.6 })),
  ...Array.from({ length: 16 }, (_, i) => ({ nota: 'hat', inicio: i, velocity: i % 4 === 0 ? 0.5 : 0.25 })),
]

const FIGURAS = ['**Redonda**: 4 tiempos', '**Blanca**: 2 tiempos', '**Negra**: 1 tiempo', '**Corchea**: medio tiempo']
const POR_TIEMPO = ['**1** por tiempo (negras)', '**2** por tiempo (corcheas)', '**4** por tiempo (semicorcheas)']
const TIEMPOS = ['Tiempo 1', 'Tiempo 2', 'Tiempo 3', 'Tiempo 4']

export default {
  id: '2.3',
  modulo: 2,
  titulo: 'Figuras: de redonda a semicorchea',
  subtitulo: 'Cuánto dura cada nota (y cada silencio)',
  minutos: 15,
  resumen: [
    'Las **figuras** dicen cuánto dura una nota contando tiempos. En 4/4: **redonda** 4, **blanca** 2, **negra** 1, **corchea** ½ y **semicorchea** ¼.',
    'Cada figura dura **la mitad** que la anterior: 1 redonda = 2 blancas = 4 negras = 8 corcheas = 16 semicorcheas.',
    'Cada figura tiene su **silencio**, que dura lo mismo. En el Piano Roll, un silencio es una casilla vacía.',
    'El **4 de abajo** en 4/4 dice qué figura vale un tiempo: la **negra** (la redonda partida en 4).',
    'El **Channel rack** tiene **16 pasos** porque un compás de 4/4 tiene 16 semicorcheas: 4 tiempos × 4. Los tiempos caen en los pasos **1, 5, 9 y 13**.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Cuánto dura una nota',
      parrafos: [
        'Hasta ahora contaste **tiempos**. Para saber cuánto dura una nota, la música usa **figuras**: cada una dura un número de tiempos.',
        'La figura que dura **un tiempo** se llama **negra**. Si tocas una nota en cada clic del metrónomo, estás tocando negras.',
        'En el Piano Roll se ve clarísimo: la **longitud** de la barra es su duración. Aquí, cada negra ocupa un tiempo entero.',
      ],
      roll: {
        filas: ['C4', 'click'],
        columnas: 8,
        porTiempo: 2,
        bpm: 90,
        notas: [...[0, 2, 4, 6].map((inicio) => ({ nota: 'C4', inicio, duracion: 2 })), ...golpes('click', [0, 2, 4, 6], 0.6)],
      },
      sonidos: [figuras([1, 1, 1, 1], { notas: ['C4', 'E4', 'G4', 'C5'], etiqueta: 'Cuatro negras' })],
      nota: 'En el sonido, primero suena un compás de clics («1 2 3 4») para que entres en el pulso.',
    },

    {
      tipo: 'texto',
      titulo: 'Redonda, blanca y negra',
      parrafos: [
        'Cada figura dura **el doble** que la siguiente:',
        '**Redonda** = 4 tiempos: llena un compás de 4/4 entero. **Blanca** = 2 tiempos: caben 2 en el compás. **Negra** = 1 tiempo: caben 4.',
        'Escúchalas con el metrónomo y cuenta en voz alta: la redonda suena «1 2 3 4» sin soltarse; la blanca, «1 2» y otra «3 4».',
      ],
      sonidos: [
        figuras([4], { notas: ['C4'], etiqueta: 'Redonda (4 tiempos)' }),
        figuras([2, 2], { notas: ['C4', 'E4'], etiqueta: 'Dos blancas (2 + 2)' }),
        figuras([1, 1, 1, 1], { notas: ['C4', 'E4', 'G4', 'C5'], etiqueta: 'Cuatro negras (1 + 1 + 1 + 1)' }),
      ],
      nota: 'Los nombres vienen de cómo se dibujan en la partitura: la redonda es un círculo hueco, la blanca un círculo hueco con palito y la negra un círculo relleno con palito.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué figura suena?',
      intro: 'Tras el compás de clics, suena un compás entero de **la misma figura**. Cuenta cuántos tiempos dura cada nota.',
      rondas: [
        {
          pregunta: '¿Qué figura llena este compás?',
          sonidos: [figuras([2, 2], { notas: ['E4', 'C4'] })],
          opciones: FIGURAS,
          correcta: 1,
          explicacion: 'Dos notas, cada una de **2 tiempos**: «1 2» y «3 4». Son **blancas**.',
        },
        {
          pregunta: '¿Y esta?',
          sonidos: [figuras([1, 1, 1, 1], { notas: ['G4', 'E4', 'D4', 'C4'] })],
          opciones: FIGURAS,
          correcta: 2,
          explicacion: 'Una nota en cada clic: **negras**, de **1 tiempo**.',
        },
        {
          pregunta: '¿Y esta?',
          sonidos: [figuras([4], { notas: ['G3'] })],
          opciones: FIGURAS,
          correcta: 0,
          explicacion: 'Una sola nota que aguanta los **4 tiempos**: una **redonda**.',
        },
        {
          pregunta: '¿Y esta?',
          sonidos: [figuras([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], { notas: ESCALA })],
          opciones: FIGURAS,
          correcta: 3,
          explicacion: 'Dos notas por cada clic: «1 y 2 y…». Son **corcheas**, de **medio tiempo** (las verás ahora).',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Corcheas y semicorcheas',
      parrafos: [
        'Partiendo la negra en dos salen las **corcheas** (½ tiempo): las que contaste en la lección anterior con «**1 y** 2 y».',
        'Partiendo la corchea en dos salen las **semicorcheas** (¼ de tiempo): **4 por tiempo**. Se cuentan «**1 e y a**, **2 e y a**…» (del inglés «one-e-and-a»).',
        'Mira la pirámide: cada fila llena el **mismo compás** con el doble de notas que la de arriba. 1 redonda = 2 blancas = 4 negras = 8 corcheas = **16 semicorcheas**.',
      ],
      roll: { ...PIRAMIDE, notas: NOTAS_PIRAMIDE },
      sonidos: [hats(2, { bpm: 80, etiqueta: 'Hi-hat en corcheas' }), hats(4, { bpm: 80, etiqueta: 'Hi-hat en semicorcheas' })],
      nota: 'Las semicorcheas son los hi-hats rápidos del trap, del reguetón y del house. Pulsa **Reproducir** en la pirámide: todas las filas terminan juntas.',
    },

    {
      tipo: 'pulso',
      titulo: 'De lento a rápido',
      intro: 'Toca la misma figura en bucle. Cada ronda, la figura dura **la mitad**: blancas, negras, corcheas y semicorcheas.',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Blancas: toca en el 1 y en el 3',
            bpm: 90,
            groove: 'click',
            cada: 2,
            meta: 4,
            contar: 'tiempos',
            ayuda: 'Toca blancas',
            boton: 'Blanca (cada 2 tiempos)',
            mensaje: 'Una **blanca** dura **2 tiempos**: un toque cada dos clics.',
          },
          {
            pregunta: 'Negras: toca en cada tiempo',
            bpm: 90,
            groove: 'click',
            cada: 1,
            meta: 6,
            contar: 'tiempos',
            ayuda: 'Toca negras',
            boton: 'Negra (cada tiempo)',
            mensaje: 'Una **negra** = **1 tiempo**: un toque por clic.',
          },
          {
            pregunta: 'Corcheas: «1 y 2 y»',
            bpm: 80,
            groove: 'click',
            cada: 0.5,
            meta: 10,
            contar: 'y',
            ayuda: 'Toca corcheas',
            boton: '«1 y 2 y»',
            mensaje: 'Dos **corcheas** por tiempo, como el hi-hat del beat básico.',
          },
          {
            pregunta: 'Semicorcheas: «1 e y a»',
            bpm: 60,
            groove: GUIA_SEMIS,
            porTiempo: 4,
            cada: 0.25,
            meta: 12,
            contar: 'e',
            visual: false,
            ayuda: 'Toca semicorcheas',
            boton: '«1 e y a 2 e y a»',
            mensaje: '¡**Cuatro** toques por tiempo! Eso son **semicorcheas**: cada paso del Channel rack de FL.',
          },
        ],
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Cuántas notas por tiempo?',
      intro: 'Suena un hi-hat sobre el metrónomo (con un bombo en el 1). Cuenta cuántos golpes de hi-hat caben **entre clic y clic**.',
      rondas: [
        {
          pregunta: '¿Cuántos golpes de hi-hat por tiempo?',
          sonidos: [hats(2, { bpm: 90 })],
          opciones: POR_TIEMPO,
          correcta: 1,
          explicacion: '«**1** y **2** y»: dos golpes por tiempo, **corcheas**.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [hats(4, { bpm: 75 })],
          opciones: POR_TIEMPO,
          correcta: 2,
          explicacion: '«**1** e y a **2** e y a»: cuatro golpes por tiempo, **semicorcheas**.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [hats(1, { bpm: 100 })],
          opciones: POR_TIEMPO,
          correcta: 0,
          explicacion: 'El hi-hat cae junto con cada clic: **negras**.',
        },
        {
          pregunta: 'Este va más rápido (130 BPM). ¿Cuántos por tiempo?',
          sonidos: [hats(2, { bpm: 130 })],
          opciones: POR_TIEMPO,
          correcta: 1,
          explicacion: 'Aunque suene rápido, entre clic y clic hay **2** golpes: **corcheas**. La figura se mide contra el pulso, no contra el reloj.',
        },
        {
          pregunta: 'Y este va lento (60 BPM). ¿Cuántos por tiempo?',
          sonidos: [hats(4, { bpm: 60 })],
          opciones: POR_TIEMPO,
          correcta: 2,
          explicacion: 'A 60 BPM no suena tan rápido, pero entre clic y clic hay **4** golpes: **semicorcheas**.',
        },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Dibuja las figuras',
      intro: 'Aquí **cada casilla es una corchea** (2 por tiempo). Dibuja una **blanca** de Do, una **negra** de Mi y **dos corcheas** de Sol. Toca una casilla y **arrastra a la derecha** para alargar la nota.',
      roll: { filas: ['G4', 'E4', 'C4'], columnas: 8, porTiempo: 2, bpm: 90 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: DIBUJO,
        pista: 'La blanca ocupa **4 casillas** (2 tiempos), la negra **2** y cada corchea **1**.',
        explicacion: 'Pulsa **Reproducir**: 2 + 1 + ½ + ½ = **4 tiempos**, un compás justo de 4/4.',
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué ritmo suena?',
      intro: 'Tras los clics de entrada suena un compás con **figuras distintas**. Elige el orden correcto.',
      rondas: [
        {
          pregunta: '¿En qué orden van las figuras?',
          sonidos: [figuras([1, 1, 2], { notas: ['C4', 'E4', 'G4'] })],
          opciones: ['Negra · negra · blanca', 'Blanca · negra · negra', 'Negra · blanca · negra'],
          correcta: 0,
          explicacion: 'Dos notas cortas (1 + 1) y una larga (2): **negra, negra, blanca**.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [figuras([2, 1, 1], { notas: ['G4', 'E4', 'C4'] })],
          opciones: ['Negra · negra · blanca', 'Blanca · negra · negra', 'Negra · blanca · negra'],
          correcta: 1,
          explicacion: 'Primero una nota larga que aguanta «1 2» y después dos de un tiempo: **blanca, negra, negra**.',
        },
        {
          pregunta: 'Ahora con corcheas. ¿Cuál es?',
          sonidos: [figuras([1, 0.5, 0.5, 2], { notas: ['C4', 'D4', 'E4', 'G4'] })],
          opciones: ['Corchea · corchea · negra · blanca', 'Negra · corchea · corchea · blanca', 'Blanca · corchea · corchea · negra'],
          correcta: 1,
          explicacion: '«**1**, **2** y, **3** 4»: una negra, dos corcheas en el tiempo 2 y una blanca que aguanta el 3 y el 4.',
        },
        {
          pregunta: '¿Y esta?',
          sonidos: [figuras([0.5, 0.5, 1, 0.5, 0.5, 1], { notas: ['E4', 'E4', 'G4', 'E4', 'E4', 'C4'] })],
          opciones: ['Negra · negra · negra · negra', 'Corchea · corchea · negra (dos veces)', 'Negra · corchea · corchea (dos veces)'],
          correcta: 1,
          explicacion: '«**1** y **2**, **3** y **4**»: dos corcheas rápidas y una negra, y otra vez. Un ritmo de canción infantil.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Los silencios',
      parrafos: [
        'El silencio también se cuenta. Cada figura tiene su **silencio**, que dura exactamente lo mismo: silencio de **redonda** (4 tiempos), de **blanca** (2), de **negra** (1), de **corchea** (½) y de **semicorchea** (¼).',
        'Un silencio **no es una pausa para descansar**: el pulso sigue y tú sigues contando por dentro.',
        'En el Piano Roll es facilísimo: un silencio es una **casilla vacía**. Aquí hay negras con un silencio de negra en el tiempo 3.',
      ],
      roll: {
        filas: ['C4', 'click'],
        columnas: 8,
        porTiempo: 2,
        bpm: 90,
        notas: [...[0, 2, 6].map((inicio) => ({ nota: 'C4', inicio, duracion: 2 })), ...golpes('click', [0, 2, 4, 6], 0.6)],
      },
      sonidos: [
        figuras([1, 1, -1, 1], { notas: ['C4', 'E4', 'G4'], etiqueta: 'Silencio de negra en el 3' }),
        figuras([1, -2, 1], { notas: ['C4', 'G4'], etiqueta: 'Silencio de blanca (2 y 3)' }),
      ],
      nota: 'Muchos de los mejores grooves son silencios bien puestos: el hueco antes de que vuelva el bombo es lo que da ganas de moverse.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Dónde está el silencio?',
      intro: 'Suenan negras con un **silencio**. Cuenta «1 2 3 4» con los clics y encuentra el hueco.',
      rondas: [
        {
          pregunta: '¿En qué tiempo está el silencio?',
          sonidos: [figuras([1, -1, 1, 1], { notas: ['C4', 'E4', 'G4'] })],
          opciones: TIEMPOS,
          correcta: 1,
          explicacion: '«1, **—**, 3, 4»: el silencio de negra cae en el **tiempo 2**.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [figuras([1, 1, 1, -1], { notas: ['G4', 'E4', 'C4'] })],
          opciones: TIEMPOS,
          correcta: 3,
          explicacion: '«1, 2, 3, **—**»: el silencio cae en el **tiempo 4**, y el compás siguiente empieza en el 1.',
        },
        {
          pregunta: 'Ojo: aquí el silencio va al principio.',
          sonidos: [figuras([-1, 1, 1, 1], { notas: ['E4', 'G4', 'C5'] })],
          opciones: TIEMPOS,
          correcta: 0,
          explicacion: 'La primera nota llega en el 2: «**—**, 2, 3, 4». Empezar después del 1 es muy común en melodías y raps.',
        },
        {
          pregunta: '¿Cuánto dura este silencio?',
          sonidos: [figuras([1, -2, 1], { notas: ['C4', 'C5'] })],
          opciones: ['Silencio de negra (1 tiempo)', 'Silencio de blanca (2 tiempos)', 'Silencio de redonda (4 tiempos)'],
          correcta: 1,
          explicacion: '«1, **— —**, 4»: el hueco ocupa el 2 y el 3, **2 tiempos**. Es un silencio de **blanca**.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'El 4 de «4/4»',
      parrafos: [
        'En la lección anterior viste que el número de **arriba** dice **cuántos tiempos** tiene el compás.',
        'El de **abajo** dice **qué figura vale un tiempo**. Es un número de partes de la redonda: **4** = la redonda partida en 4 = la **negra**.',
        'Así que **4/4** = cuatro negras por compás, y **3/4** = tres negras por compás. Si abajo hubiera un **8**, el tiempo sería la **corchea** (como en 6/8); con un **2**, la **blanca**.',
      ],
      sonidos: [
        figuras([1, 1, 1, 1, 1, 1, 1, 1], { previa: false, notas: ['C4', 'E4', 'G4', 'E4'], etiqueta: '4/4: cuatro negras (dos compases)' }),
        figuras([1, 1, 1, 1, 1, 1], { compas: 3, previa: false, notas: ['C4', 'E4', 'G4'], etiqueta: '3/4: tres negras (dos compases)' }),
      ],
      nota: 'En FL Studio lo verás en **Time signature**: 4 arriba (tiempos por compás) y 4 abajo (la negra como tiempo).',
    },

    {
      tipo: 'texto',
      titulo: 'Los 16 pasos del Channel rack',
      parrafos: [
        'El **Channel rack** de FL Studio tiene **16 pasos** por compás. ¿Por qué 16? Porque un compás de 4/4 tiene **4 tiempos × 4 semicorcheas = 16**. Cada paso es una **semicorchea**.',
        'Los pasos van en grupos de 4 (FL los pinta en dos colores alternos): cada grupo es **un tiempo**. Los tiempos caen en los pasos **1, 5, 9 y 13**.',
        'Este es el beat básico en 16 pasos: bombo en 1 y 9, caja en 5 y 13 y hi-hat en los pasos impares, que son las **corcheas**.',
      ],
      roll: { filas: FILAS, columnas: 16, porTiempo: 4, bpm: 90, notas: RACK },
      nota: 'Regla rápida: **negras** = un paso de cada 4 (1, 5, 9, 13); **corcheas** = uno de cada 2 (impares); **semicorcheas** = todos.',
    },

    {
      tipo: 'pianoroll',
      titulo: 'Hi-hat en semicorcheas',
      intro: 'Este roll es **medio compás**: 2 tiempos de **4 pasos**, como los 8 primeros del Channel rack. Rellena los contornos: **bombo** en el 1, **caja** en el 2 y **hi-hat** en **todas** las casillas.',
      roll: { filas: FILAS, columnas: 8, porTiempo: 4, bpm: 85 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: SEMIS,
        explicacion: 'Pulsa **Reproducir**: 4 hi-hats por tiempo, «**1** e y a **2** e y a». En el Channel rack serían los pasos 1 a 8 encendidos.',
      },
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cuántas negras caben en una redonda?',
          opciones: ['2', '4', '8'],
          correcta: 1,
          explicacion: 'La redonda dura **4 tiempos** y la negra **1**: caben **4**.',
        },
        {
          pregunta: 'En 4/4, ¿cuántas semicorcheas hay en un tiempo?',
          opciones: ['2', '4', '16'],
          correcta: 1,
          explicacion: 'Un tiempo (una negra) = 2 corcheas = **4 semicorcheas**: «**1** e y a».',
        },
        {
          pregunta: 'En este Piano Roll cada casilla es una corchea. ¿Qué figura es la nota?',
          roll: { filas: ['C4'], columnas: 8, porTiempo: 2, bpm: 90, notas: [{ nota: 'C4', inicio: 0, duracion: 4 }] },
          opciones: ['Negra', 'Blanca', 'Redonda'],
          correcta: 1,
          explicacion: 'Ocupa **4 casillas** de corchea = **2 tiempos**: una **blanca**.',
        },
        {
          pregunta: '¿Qué indica el 4 de abajo en 4/4?',
          opciones: ['Que la negra vale un tiempo', 'Que hay 4 compases', 'Que va a 4 BPM'],
          correcta: 0,
          explicacion: 'Abajo va la figura que cuenta como un tiempo: 4 = la redonda partida en 4 = la **negra**.',
        },
        {
          pregunta: '¿Cuánto dura un silencio de blanca?',
          opciones: ['Medio tiempo', '1 tiempo', '2 tiempos'],
          correcta: 2,
          explicacion: 'Un silencio dura lo mismo que su figura: la blanca, **2 tiempos**.',
        },
        {
          pregunta: '¿Por qué el Channel rack de FL tiene 16 pasos?',
          opciones: ['4 tiempos × 4 semicorcheas', 'Porque hay 16 instrumentos', 'Porque va a 16 BPM'],
          correcta: 0,
          explicacion: 'Un compás de 4/4 = **4 tiempos × 4 semicorcheas = 16 pasos**. Cada paso, una semicorchea.',
        },
      ],
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: del paso a la figura',
      minutos: 20,
      objetivo: 'Programar hi-hats en negras, corcheas y semicorcheas en el Channel rack, y escribir las figuras en el Piano Roll.',
      pasos: [
        'Proyecto nuevo a **90 BPM**. En el **Channel rack**: **kick** en los pasos **1** y **9**, **clap** (o snare) en **5** y **13**.',
        '**Hat en negras**: enciende los pasos **1, 5, 9 y 13**. Dale a Play y cuenta «1 2 3 4».',
        '**Hat en corcheas**: añade los pasos impares que faltan (3, 7, 11, 15). Cuenta «1 y 2 y».',
        '**Hat en semicorcheas**: enciende los **16 pasos**. Cuenta «1 e y a». Escucha cómo sube la energía en cada versión.',
        'Abre el **Piano Roll** de un piano. En el selector de rejilla (el **imán**, *Snap*) elige **Bar** y dibuja una **redonda** en el compás 1.',
        'Con *Snap* en **Beat** dibuja **2 blancas** en el compás 2 y **4 negras** en el 3; con **1/2 beat**, **8 corcheas** en el compás 4. Reproduce: la pirámide de figuras, pero tuya.',
      ],
      consejo: 'En el Piano Roll de FL, *Snap* **Step** = semicorchea, **1/2 beat** = corchea, **Beat** = negra y **Bar** = un compás (en 4/4, una redonda).',
      reflexion: '¿Qué versión del hi-hat te gustó más para un beat? ¿Notaste que las semicorcheas suenan más rápidas sin cambiar el tempo?',
    },
  ],
}
