// Lección 2.4 — Síncopa y anticipación (módulo 2 «Ritmo y groove»).
// Formato de los pasos: ver src/content/FORMATO.md (tipos `pulso`, `pianoroll` y sonidos `groove`).

const golpes = (nota, inicios, velocity) => inicios.map((inicio) => ({ nota, inicio, duracion: 1, ...(velocity ? { velocity } : {}) }))

/** Roll de batería de 16 casillas (semicorcheas): hi-hat, caja y bombo. */
const FILAS = ['hat', 'snare', 'kick']

/** Mismo contenido que los grooves `basico`, `dembow` y `bounce` (theory/bateria.js), para dibujarlos en el roll. */
const HATS_16 = golpes('hat', [0, 2, 4, 6, 8, 10, 12, 14])
const DEMBOW = [...golpes('kick', [0, 4, 8, 12]), ...golpes('snare', [3, 6, 11, 14]), ...HATS_16]
const BOUNCE = [...golpes('kick', [0, 7, 10]), ...golpes('snare', [4, 12]), ...HATS_16]

/**
 * Patrón en corcheas con un clic suave en cada tiempo (así se oye dónde cae el pulso).
 * `eventos` en casillas de corchea (0 = el 1, 1 = la «y» del 1, 2 = el 2…).
 */
function conClic(eventos, { bpm = 90, compases = 2, tiempos = 4, etiqueta = 'Escuchar' } = {}) {
  const clic = Array.from({ length: tiempos }, (_, t) => ({ nota: 'click', inicio: t * 2, velocity: t === 0 ? 0.55 : 0.3 }))
  return { etiqueta, bpm, compases, tiempos, porTiempo: 2, groove: [...clic, ...eventos] }
}

const palmas = (inicios) => inicios.map((inicio) => ({ nota: 'clap', inicio, velocity: 0.9 }))

/** Melodía corta (corcheas) en el piano; `[nota, inicio, duración]`. */
const melodia = (lista) => lista.map(([nota, inicio, duracion]) => ({ nota, inicio, duracion, velocity: 0.8 }))

/** Dos acordes (Do y Fa) en 2 compases; el Fa cambia en el 1 del 2.º compás o se adelanta a la «y» del 4. */
function acordes({ anticipado, bpm = 92 }) {
  const fa = anticipado ? 7 : 8
  const acorde = (notas, inicio, duracion) => notas.map((nota) => ({ nota, inicio, duracion, velocity: nota.endsWith('2') || nota.endsWith('3') ? 0.75 : 0.5 }))
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

const SOBRE_O_SINCOPA = ['**Sobre el tiempo**: todo cae en los números', '**Sincopado**: acentos entre los tiempos']
const A_TIEMPO = ['**A tiempo**: cambia justo en el 1', '**Se adelanta**: cambia en la «y» del 4']
const RITMOS = ['**Beat básico** (caja en 2 y 4)', '**Dembow** (reguetón)', '**Bounce** (hip hop)']

export default {
  id: '2.4',
  modulo: 2,
  titulo: 'Síncopa y anticipación',
  subtitulo: 'Acentos a contratiempo, ligaduras, tresillo, dembow y bounce',
  minutos: 15,
  resumen: [
    'Una **síncopa** es un acento donde no se espera: **entre los tiempos** (en la «y» o en la «a») o en un tiempo débil, mientras el tiempo fuerte se queda **sin golpe nuevo**.',
    'Una **ligadura** une dos notas: la que empieza a contratiempo **se queda sonando** sobre el tiempo siguiente. En el Piano Roll es simplemente una nota más larga que cruza la línea del tiempo.',
    'La **anticipación** es una síncopa muy común: la nota o el acorde llega **una corchea antes** del 1 (en la «y» del 4) y se queda sonando sobre él.',
    'El **tresillo** agrupa las 8 corcheas en **3 + 3 + 2**: suena en el **1**, la **«y» del 2** y el **4**. Es la base de muchos ritmos latinos.',
    'El **dembow** del reguetón: bombo en cada tiempo y caja en la **«a» del 1** y la **«y» del 2** (pasos 4, 7, 12 y 15 del Channel rack). El **bounce** del hip hop adelanta el bombo a la «a» del 2 y la «y» del 3.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Qué es una síncopa',
      parrafos: [
        'Hasta ahora casi todo caía **en los números**: «**1** y **2** y **3** y **4** y». El oído lo espera así y se siente estable.',
        'Una **síncopa** rompe esa expectativa: el acento cae **entre los tiempos** (en una «y») o en un tiempo débil, y el tiempo fuerte que venía después **no recibe golpe nuevo**.',
        'Escucha las palmas sobre el mismo clic: primero en cada tiempo y luego sincopadas. La segunda **empuja** hacia delante: eso es lo que hace que la música dé ganas de moverse.',
      ],
      sonidos: [
        { ...conClic(palmas([0, 2, 4, 6])), etiqueta: 'Palmas en los tiempos' },
        { ...conClic(palmas([0, 3, 5])), etiqueta: 'Palmas sincopadas' },
      ],
      roll: { filas: ['clap', 'click'], columnas: 8, porTiempo: 2, bpm: 90, notas: [...golpes('click', [0, 2, 4, 6], 0.4), ...golpes('clap', [0, 3, 5])] },
      nota: 'En el roll: las palmas sincopadas caen en el **1**, la **«y» del 2** y la **«y» del 3**. El 3 y el 4 se quedan sin palmas.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Sobre el tiempo o sincopado?',
      intro: 'El clic suave marca los tiempos. Fíjate en si lo demás cae **con** el clic o **entre** los clics.',
      rondas: [
        {
          pregunta: '¿Cómo van estas palmas?',
          sonidos: [conClic(palmas([1, 3, 5, 7]))],
          opciones: SOBRE_O_SINCOPA,
          correcta: 1,
          explicacion: 'Todas caen en las **«y»**, justo entre clic y clic: a contratiempo. Es la síncopa más simple.',
        },
        {
          pregunta: '¿Y esta melodía?',
          sonidos: [conClic(melodia([['C4', 0, 2], ['E4', 2, 2], ['G4', 4, 2], ['E4', 6, 2]]))],
          opciones: SOBRE_O_SINCOPA,
          correcta: 0,
          explicacion: 'Cada nota empieza con un clic: **1, 2, 3, 4**. Nada cae entre los tiempos.',
        },
        {
          pregunta: '¿Y esta?',
          sonidos: [conClic(melodia([['C4', 0, 1], ['E4', 1, 2], ['G4', 3, 3], ['E4', 6, 2]]))],
          opciones: SOBRE_O_SINCOPA,
          correcta: 1,
          explicacion: 'El Mi y el Sol empiezan en las «y» (del 1 y del 2) y se quedan sonando sobre el tiempo siguiente: **síncopa**.',
        },
        {
          pregunta: '¿Y estas palmas?',
          sonidos: [conClic(palmas([0, 3, 6]))],
          opciones: SOBRE_O_SINCOPA,
          correcta: 1,
          explicacion: 'Caen en el 1, la **«y» del 2** y el 4: el 2 y el 3 se quedan sin palmas. Este ritmo tiene nombre (el **tresillo**) y lo verás enseguida.',
        },
      ],
    },

    {
      tipo: 'pulso',
      titulo: 'Toca a contratiempo',
      intro: 'Toca en las casillas con aro. Cuenta «**1** y 2 **y**» en voz alta: el segundo toque cae en la **«y» del 2**, no en un número.',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Toca en el 1 y en la «y» del 2',
            bpm: 80,
            groove: 'click',
            toques: [0, 1.5],
            meta: 6,
            contar: 'y',
            ayuda: 'Toca «1… y del 2»',
            boton: '1 · «y» del 2',
            mensaje: 'Tocaste un golpe **entre** dos tiempos y dejaste el 3 en silencio: una síncopa.',
          },
          {
            pregunta: 'Ahora en la «y» del 1 y en el 3',
            bpm: 80,
            groove: 'click',
            toques: [0.5, 2],
            meta: 6,
            contar: 'y',
            visual: false,
            ayuda: 'Toca «y del 1… 3»',
            boton: '«y» del 1 · 3',
            mensaje: 'Empezar en una «y» cuesta más: el cuerpo quiere tocar en el 1. Con práctica sale solo.',
          },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: 'Ligaduras: notas que cruzan el tiempo',
      parrafos: [
        'En una partitura, cuando una nota empieza a contratiempo y sigue sonando sobre el tiempo siguiente, se escribe con una **ligadura**: dos figuras unidas por un arco que suenan como **una sola nota larga**.',
        'En el **Piano Roll** no hace falta nada especial: es una nota que **empieza en una «y» y cruza la línea del tiempo**.',
        'Mira el **Sol**: empieza en la «y» del 2 y dura hasta el 4. En el 3 **no suena nada nuevo**; el golpe que esperabas ya llegó antes. Eso es lo que se siente como síncopa.',
      ],
      roll: {
        rango: ['C4', 'C5'],
        soloBlancas: true,
        columnas: 8,
        porTiempo: 2,
        bpm: 90,
        notas: melodia([['C4', 0, 2], ['E4', 2, 1], ['G4', 3, 3], ['E4', 6, 2]]),
      },
      sonidos: [
        { ...conClic(melodia([['C4', 0, 2], ['E4', 2, 2], ['G4', 4, 2], ['E4', 6, 2]])), etiqueta: 'Sin síncopa' },
        { ...conClic(melodia([['C4', 0, 2], ['E4', 2, 1], ['G4', 3, 3], ['E4', 6, 2]])), etiqueta: 'Con el Sol ligado' },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Dibuja la síncopa',
      intro: 'Rellena los contornos. El **Sol** empieza en la **«y» del 2**: toca esa casilla y **arrastra** hasta el 4 para que cruce el tiempo 3.',
      roll: { rango: ['C4', 'C5'], soloBlancas: true, columnas: 8, porTiempo: 2, bpm: 90 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: melodia([['C4', 0, 2], ['E4', 2, 1], ['G4', 3, 3], ['E4', 6, 2]]),
        pista: 'El Sol ocupa **3 casillas**: la «y» del 2, el 3 y la «y» del 3.',
        explicacion: 'Pulsa **Reproducir**: el Sol llega antes de lo esperado y se queda sonando sobre el 3. Una nota ligada.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'La anticipación',
      parrafos: [
        'La síncopa más usada en pop, R&B y reguetón es la **anticipación**: el cambio de acorde (o la nota de la melodía) llega **una corchea antes** de su sitio, en la **«y» del 4**, y se queda sonando sobre el 1 del compás siguiente.',
        'El cambio es el mismo; solo se adelanta medio tiempo. Pero suena con mucho más impulso, como si la música no pudiera esperar.',
        'Escucha dos acordes, **Do** y **Fa**, con un clic más fuerte en cada 1.',
      ],
      sonidos: [
        { ...acordes({ anticipado: false }), etiqueta: 'El Fa llega en el 1' },
        { ...acordes({ anticipado: true }), etiqueta: 'El Fa se adelanta' },
      ],
      nota: 'En FL Studio, para anticipar un acorde basta con arrastrar sus notas **una corchea a la izquierda** en el Piano Roll (con el *Snap* en «1/2 beat») y alargarlas hasta el final.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Llega a tiempo o se adelanta?',
      intro: 'Escucha el cambio de acorde y fíjate en el clic fuerte del 1.',
      rondas: [
        {
          pregunta: '¿Cuándo cambia el acorde?',
          sonidos: [acordes({ anticipado: true })],
          opciones: A_TIEMPO,
          correcta: 1,
          explicacion: 'El Fa entra **antes** del clic fuerte, en la «y» del 4: **anticipación**.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [acordes({ anticipado: false })],
          opciones: A_TIEMPO,
          correcta: 0,
          explicacion: 'El Fa entra **con** el clic fuerte: cambia justo en el 1.',
        },
        {
          pregunta: 'Más rápido. ¿Cuándo cambia?',
          sonidos: [acordes({ anticipado: true, bpm: 110 })],
          opciones: A_TIEMPO,
          correcta: 1,
          explicacion: 'A 110 BPM la anticipación es más corta, pero se nota igual: el acorde **llega antes** que el 1.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'El tresillo: 3 + 3 + 2',
      parrafos: [
        'Agrupa las 8 corcheas de un compás de 4/4 así: **3 + 3 + 2**. Los golpes caen en el **1**, en la **«y» del 2** y en el **4**.',
        'Es el **tresillo**, un ritmo que llegó de África a Cuba y de ahí a medio mundo: está en el reguetón, el dancehall, el pop latino y muchísimo pop actual (piensa en bajos y sintes que «saltan»).',
        'Cuenta «**1** 2 3 **4** 5 6 **7** 8» mientras suena: los golpes caen en el 1, el 4 y el 7 de esas 8 corcheas.',
      ],
      roll: {
        filas: ['kick', 'click'],
        columnas: 8,
        porTiempo: 2,
        bpm: 95,
        notas: [...golpes('click', [0, 2, 4, 6], 0.4), ...golpes('kick', [0, 3, 6])],
      },
      sonidos: [{ ...conClic(golpes('kick', [0, 3, 6], 0.95), { bpm: 95, compases: 4 }), etiqueta: 'Tresillo con bombo' }],
    },

    {
      tipo: 'pulso',
      titulo: 'Toca el tresillo',
      intro: 'Con el clic de fondo, toca **3 + 3 + 2**: en el 1, la «y» del 2 y el 4.',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Toca el tresillo',
            bpm: 85,
            groove: 'click',
            toques: [0, 1.5, 3],
            meta: 9,
            contar: 'y',
            ayuda: 'Toca 3 + 3 + 2',
            boton: '1 · «y» del 2 · 4',
            mensaje: 'Ese «tum… tum… tum-» es el corazón del reguetón. Ahora lo verás en el dembow.',
          },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: 'El dembow del reguetón',
      parrafos: [
        'El **dembow** mezcla dos cosas: un **bombo en cada tiempo** (estable, como el house) y una **caja sincopada** en la **«a» del 1** y la **«y» del 2** (y lo mismo en 3 y 4).',
        'Si juntas bombo y caja en la primera mitad, sale el tresillo que acabas de tocar: «**bum** · · **cha** · · **cha** ·». Ese contraste entre el bombo firme y la caja que se adelanta es el sonido del reguetón.',
        'Aquí cada casilla es una **semicorchea**: cuenta «**1** e y **a** 2 e **y** a».',
      ],
      roll: { filas: FILAS, columnas: 16, porTiempo: 4, bpm: 95, notas: DEMBOW },
      sonidos: [{ etiqueta: 'Dembow a 95 BPM', groove: 'dembow', bpm: 95, compases: 4 }],
      nota: 'En el **Channel rack** (16 pasos): bombo en los pasos 1, 5, 9 y 13; caja en los pasos **4, 7, 12 y 15**.',
    },

    {
      tipo: 'pulso',
      titulo: 'Toca con la caja del dembow',
      intro: 'Suena el dembow. Toca **solo con la caja**: en la «a» del 1 y la «y» del 2 (y lo mismo en 3 y 4).',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Toca con la caja',
            bpm: 90,
            groove: 'dembow',
            toques: [0.75, 1.5, 2.75, 3.5],
            meta: 8,
            contar: 'e',
            ayuda: 'Toca con la caja',
            boton: 'Toca con la caja',
            mensaje: 'Si se te escapa, piensa en el tresillo: «**bum** · · **cha** · · **cha** ·», dos veces por compás.',
          },
        ],
      },
    },

    {
      tipo: 'pianoroll',
      titulo: 'Programa el dembow',
      intro: 'Este roll tiene **2 tiempos** en semicorcheas (medio compás; al reproducirlo se repite). Rellena: **bombo** en el 1 y el 2, **caja** en la «a» del 1 y la «y» del 2.',
      roll: { filas: ['snare', 'kick'], columnas: 8, porTiempo: 4, bpm: 95 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: [...golpes('kick', [0, 4]), ...golpes('snare', [3, 6])],
        explicacion: 'Pulsa **Reproducir**: «bum · · cha bum · cha ·». Repetido, es el dembow entero.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'El bounce del hip hop',
      parrafos: [
        'El hip hop deja la **caja en 2 y 4**, firme, y sincopa el **bombo**: además del 1, uno se adelanta a la **«a» del 2** y otro cae en la **«y» del 3**.',
        'Ese bombo que «rebota» entre los tiempos es el **bounce**: hace que la cabeza se mueva aunque el tempo sea lento (85–95 BPM). Compáralo con el beat básico, donde el bombo cae justo en 1 y 3.',
      ],
      roll: { filas: FILAS, columnas: 16, porTiempo: 4, bpm: 88, notas: BOUNCE },
      sonidos: [
        { etiqueta: 'Beat básico', groove: 'basico', bpm: 88, compases: 2 },
        { etiqueta: 'Bounce', groove: 'bounce', bpm: 88, compases: 2 },
      ],
      nota: 'En el Channel rack: bombo en los pasos 1, **8** y **11**; caja en 5 y 13. El trap de la lección 2.2 también sincopa el bombo (pasos 1, 8 y 12).',
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué ritmo es?',
      intro: 'Fíjate en dónde va la caja y en si el bombo cae en los tiempos o entre ellos.',
      rondas: [
        {
          pregunta: '¿Qué ritmo suena?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'dembow', bpm: 95, compases: 3 }],
          opciones: RITMOS,
          correcta: 1,
          explicacion: 'Bombo en cada tiempo y la caja sincopada («bum · · cha · · cha ·»): **dembow**.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'bounce', bpm: 88, compases: 3 }],
          opciones: RITMOS,
          correcta: 2,
          explicacion: 'Caja en 2 y 4, pero el bombo rebota entre los tiempos: **bounce**.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'basico', bpm: 90, compases: 3 }],
          opciones: RITMOS,
          correcta: 0,
          explicacion: 'Bombo en 1 y 3, caja en 2 y 4, nada sincopado: el **beat básico**.',
        },
        {
          pregunta: 'Más rápido. ¿Cuál es?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'dembow', bpm: 105, compases: 3 }],
          opciones: RITMOS,
          correcta: 1,
          explicacion: 'Aunque vaya más rápido, la caja sigue cayendo en la «a» del 1 y la «y» del 2: **dembow**.',
        },
      ],
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué es una síncopa?',
          opciones: ['Un acento entre los tiempos o en un tiempo débil, donde no se espera', 'Tocar más rápido que el pulso', 'Un silencio al final del compás'],
          correcta: 0,
          explicacion: 'La síncopa **desplaza el acento**: cae en una «y» (o en una «a») y el tiempo fuerte siguiente se queda sin golpe nuevo.',
        },
        {
          pregunta: 'Una anticipación es…',
          opciones: ['Una nota o acorde que llega una corchea antes del 1 y se queda sonando sobre él', 'Una nota que llega tarde', 'Subir el tempo poco a poco'],
          correcta: 0,
          explicacion: 'Se **adelanta** a la «y» del 4 y queda **ligada** sobre el 1.',
        },
        {
          pregunta: 'El tresillo (3 + 3 + 2) suena en…',
          opciones: ['El 1, la «y» del 2 y el 4', 'El 1, el 2 y el 3', 'Solo en las «y»'],
          correcta: 0,
          explicacion: 'Corcheas 1, 4 y 7 de las 8 del compás: el **1**, la **«y» del 2** y el **4**.',
        },
        {
          pregunta: 'En el dembow, ¿dónde va la caja en la primera mitad del compás?',
          opciones: ['En la «a» del 1 y la «y» del 2', 'En el 2 y el 4', 'Solo en el 3'],
          correcta: 0,
          explicacion: '«**1** e y **a** 2 e **y** a»: la caja cae en la **a** del 1 y la **y** del 2.',
        },
        {
          pregunta: 'En el Channel rack (16 pasos), ¿en qué pasos va la caja del dembow?',
          opciones: ['4, 7, 12 y 15', '5 y 13', '1, 5, 9 y 13'],
          correcta: 0,
          explicacion: 'Cada tiempo son 4 pasos: la «a» del 1 es el paso **4** y la «y» del 2 el paso **7**; en la segunda mitad, **12** y **15**.',
        },
      ],
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: dembow, bounce y anticipación',
      minutos: 20,
      objetivo: 'Programar un dembow y un bounce en el Channel rack y anticipar un cambio de acorde en el Piano Roll.',
      pasos: [
        'Proyecto nuevo a **95 BPM**. En el **Channel rack** pon un **Kick**, un **Snare** y un **Hat**.',
        'Dembow: **kick** en los pasos **1, 5, 9 y 13**; **snare** en **4, 7, 12 y 15**; **hat** en los impares. Dale a Play y cuenta «1 e y a».',
        'En un patrón nuevo, a **88 BPM**: bounce con **kick** en **1, 8 y 11**, **snare** en **5 y 13** y **hat** en los impares. Compáralo con el kick en 1 y 9.',
        'Abre un **piano** en el Piano Roll: un acorde de **Do** (C5 E5 G5) durante el compás 1 y uno de **Fa** (F5 A5 C6) durante el compás 2.',
        'Pon el *Snap* en **1/2 beat**, selecciona el acorde de Fa y arrástralo **una corchea a la izquierda** (a la «y» del 4 del compás 1). Alarga su final para que siga hasta el final del compás 2.',
        'Escucha el cambio con y sin anticipación encima del dembow.',
      ],
      consejo: 'Con 16 pasos por compás: la «e» de cada tiempo es el paso siguiente al número, la «y» el segundo y la «a» el tercero (tiempo 1: pasos 1-2-3-4).',
      reflexion: '¿Qué cambió en la energía al anticipar el acorde? ¿Cuál de los dos ritmos (dembow o bounce) te dio más ganas de moverte?',
    },
  ],
}
