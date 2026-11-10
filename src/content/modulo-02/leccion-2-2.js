// Lección 2.2 — Compás y tiempos fuertes (módulo 2 «Ritmo y groove»).
// Formato de los pasos: ver src/content/FORMATO.md (tipos `pulso`, `pianoroll` y sonidos `groove`).

/** Roll de batería: hi-hat, caja y bombo. */
const FILAS = ['hat', 'snare', 'kick']

const golpes = (nota, inicios, velocity) => inicios.map((inicio) => ({ nota, inicio, duracion: 1, ...(velocity ? { velocity } : {}) }))

/** Beat en 3/4 (6 casillas): bombo en el 1, caja en 2 y 3, hi-hat en cada corchea. */
const BEAT_34 = [...golpes('kick', [0]), ...golpes('snare', [2, 4]), ...golpes('hat', [0, 1, 2, 3, 4, 5])]

/** Trap a medio tiempo en corcheas: bombo en el 1 y en la «y» del 2, caja en el 3. */
const TRAP = [...golpes('kick', [0, 3]), ...golpes('snare', [4]), ...golpes('hat', [0, 1, 2, 3, 4, 5, 6, 7])]

/** Beat básico (como en la 2.1) para enseñar «1 y 2 y». */
const BEAT_BASICO = [...golpes('kick', [0, 4]), ...golpes('snare', [2, 6]), ...golpes('hat', [0, 1, 2, 3, 4, 5, 6, 7])]

/**
 * Golpes de metrónomo que NO empiezan en el 1: el primer golpe cae en el tiempo `desde`
 * de un compás de `tiempos`. El tiempo fuerte suena más agudo (y con bombo si `bombo`).
 */
function clics({ tiempos, desde, total, bombo = false, bpm = 100 }) {
  return {
    etiqueta: 'Escuchar',
    bpm,
    compases: 1,
    tiempos: total,
    groove: Array.from({ length: total }, (_, i) => {
      const fuerte = (desde - 1 + i) % tiempos === 0
      return { nota: fuerte && bombo ? ['click', 'kick'] : 'click', inicio: i * 2, velocity: fuerte ? 1 : 0.5 }
    }),
  }
}

/** Vals al piano que empieza en el tiempo `desde`: bajo en el 1, acorde en 2 y 3. */
function valsDesde(desde, total) {
  return {
    etiqueta: 'Escuchar',
    bpm: 150,
    compases: 1,
    tiempos: total,
    groove: Array.from({ length: total }, (_, i) =>
      (desde - 1 + i) % 3 === 0
        ? { nota: 'C3', inicio: i * 2, duracion: 2, velocity: 0.9 }
        : { nota: ['E4', 'G4'], inicio: i * 2, duracion: 1.5, velocity: 0.45 },
    ),
  }
}

const GOLPES = ['1.er golpe', '2.º golpe', '3.er golpe', '4.º golpe']
const COMPASES = ['**4/4**: se cuenta «1 2 3 4»', '**3/4**: se cuenta «1 2 3»']
const MITAD = ['**Medio tiempo**: caja solo en el 3', '**Normal**: caja en 2 y 4']

export default {
  id: '2.2',
  modulo: 2,
  titulo: 'Compás y tiempos fuertes',
  subtitulo: '4/4, 3/4, «1 y 2 y» y el medio tiempo',
  minutos: 14,
  resumen: [
    'Los tiempos se agrupan en **compases**. El primero de cada compás es el **tiempo fuerte** (el «1»).',
    '**4/4**: 4 tiempos por compás (pop, rock, hip hop, reguetón, electrónica). **3/4**: 3 tiempos, el vals («um-pa-pa»).',
    'En 4/4 el 1 es fuerte, el 3 semifuerte y el 2 y el 4 débiles; la caja del pop acentúa justo los débiles (*backbeat*).',
    'Para contar corcheas se dice «**1 y 2 y 3 y 4 y**»: los números caen en el pulso y la «y» justo en medio (contratiempo).',
    'El **trap** va a ~140 BPM pero se siente a 70: la caja cae solo en el **tiempo 3** (**medio tiempo**).',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'El compás: tiempos en grupos',
      parrafos: [
        'En la lección anterior contaste «**1**, 2, 3, 4, **1**, 2, 3, 4…». Cada grupo de tiempos es un **compás**.',
        'El primer tiempo de cada compás es el **tiempo fuerte**: el «1», donde todo parece «empezar de nuevo». El metrónomo lo marca más agudo.',
        'No siempre se agrupan de 4 en 4. Escucha un compás de **4** tiempos y otro de **3**.',
      ],
      sonidos: [
        { etiqueta: 'Grupos de 4: «1 2 3 4»', groove: 'click', bpm: 100, compases: 3 },
        { etiqueta: 'Grupos de 3: «1 2 3»', groove: 'click3', bpm: 100, compases: 4 },
      ],
      nota: 'En FL Studio, las líneas más marcadas del Piano Roll y de la Playlist son el inicio de cada compás, y los números de arriba cuentan compases.',
    },

    {
      tipo: 'pulso',
      titulo: 'Toca solo en el 1',
      intro: 'Pulsa **Empezar**, cuenta por dentro y toca el botón **solo en el tiempo fuerte** (la casilla con aro).',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'En 4/4: toca en cada «1»',
            bpm: 100,
            groove: 'click',
            cada: 4,
            meta: 4,
            contar: 'tiempos',
            ayuda: 'Toca en el 1',
            boton: 'Toca aquí en el 1',
            mensaje: 'Entre un 1 y el siguiente hay **4 tiempos**.',
          },
          {
            pregunta: 'En 3/4: toca en cada «1»',
            bpm: 110,
            groove: 'click3',
            cada: 3,
            meta: 4,
            contar: 'tiempos',
            visual: false,
            ayuda: 'Toca en el 1',
            boton: 'Toca aquí en el 1',
            mensaje: 'En 3/4 el 1 vuelve antes: cada **3 tiempos**.',
          },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: '4/4 y 3/4',
      parrafos: [
        'El compás se escribe como una fracción. El número de **arriba** dice **cuántos tiempos** tiene cada compás; el de **abajo**, qué figura dura un tiempo (el 4 = una negra; lo verás en la próxima lección).',
        '**4/4** es el compás de casi todo: pop, rock, hip hop, reguetón, house, trap. Por eso FL Studio empieza en 4/4.',
        '**3/4** es el compás del **vals**: un golpe grave en el 1 y dos más ligeros, «**um**-pa-pa». También lo usan baladas y algunas canciones folk.',
      ],
      sonidos: [
        { etiqueta: '4/4: «um-pa, um-pa»', groove: 'marchaPiano', bpm: 110, compases: 3 },
        { etiqueta: '3/4: «um-pa-pa»', groove: 'valsPiano', bpm: 150, compases: 4 },
      ],
      nota: 'Truco para reconocerlo: busca el golpe grave (el bajo o el bombo) y cuenta cuántos tiempos pasan hasta el siguiente.',
    },

    {
      tipo: 'elegir',
      titulo: '¿4/4 o 3/4?',
      intro: 'Escucha y cuenta desde el golpe más fuerte.',
      rondas: [
        {
          pregunta: '¿En qué compás va este metrónomo?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'click3', bpm: 100, compases: 4 }],
          opciones: COMPASES,
          correcta: 1,
          explicacion: 'El clic agudo vuelve cada **3** golpes: «**1** 2 3, **1** 2 3».',
        },
        {
          pregunta: '¿Y este piano?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'marchaPiano', bpm: 110, compases: 3 }],
          opciones: COMPASES,
          correcta: 0,
          explicacion: 'Bajo, acorde, bajo, acorde: «**1** 2 3 4». El bajo suena en el 1 y en el 3, así que el grupo es de **4**.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'valsPiano', bpm: 150, compases: 4 }],
          opciones: COMPASES,
          correcta: 1,
          explicacion: 'Un bajo y dos acordes: «**um**-pa-pa». Es un **vals**, en 3/4.',
        },
        {
          pregunta: '¿En qué compás va este beat?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'vals', bpm: 110, compases: 4 }],
          opciones: COMPASES,
          correcta: 1,
          explicacion: 'El bombo suena cada **3** tiempos (con la caja en 2 y 3): es un beat en **3/4**.',
        },
        {
          pregunta: '¿Y este otro?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'basico', bpm: 95, compases: 3 }],
          opciones: COMPASES,
          correcta: 0,
          explicacion: 'Es el beat básico de la lección 2.1: bombo en 1 y 3, caja en 2 y 4. **4/4**.',
        },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Un beat en 3/4',
      intro: 'Este Piano Roll tiene un compás de **3 tiempos**. Rellena los contornos: **bombo** en el 1, **caja** en 2 y 3 y **hi-hat** en todas las casillas.',
      roll: { filas: FILAS, columnas: 6, porTiempo: 2, compas: 3, bpm: 110 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: BEAT_34,
        explicacion: 'Pulsa **Reproducir**: un bombo y dos cajas, «**um**-pa-pa». Es el mismo vals del piano, pero con batería.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Tiempos fuertes y débiles',
      parrafos: [
        'Dentro del compás no todos los tiempos pesan igual. En **4/4**: el **1** es **fuerte**, el **3** es **semifuerte** y el **2** y el **4** son **débiles**. En **3/4**: el 1 fuerte, el 2 y el 3 débiles.',
        'Por eso el **bombo** suele ir en 1 y 3: refuerza los tiempos fuertes.',
        'Y la **caja** en 2 y 4 hace lo contrario: golpea los débiles. Ese «contragolpe» (*backbeat*) es lo que da ganas de aplaudir y mover el cuerpo.',
      ],
      sonidos: [
        { etiqueta: 'Metrónomo: el 1 más fuerte', groove: 'click', bpm: 100, compases: 2 },
        { etiqueta: 'Beat: caja en los débiles', groove: 'basico', bpm: 100, compases: 2 },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Marca el compás con la fuerza',
      intro: 'Aquí hay **2 compases** de 4/4, un clic por tiempo y todos igual de suaves. En el carril **Vel.**, sube la velocity de cada **1** (casi hasta arriba) y deja los demás bajos.',
      roll: {
        filas: ['click'],
        columnas: 8,
        porTiempo: 1,
        compas: 4,
        bpm: 100,
        velocity: true,
        notas: golpes('click', [0, 1, 2, 3, 4, 5, 6, 7], 0.45),
      },
      objetivo: {
        tipo: 'velocity',
        fuertes: [0, 4],
        explicacion: 'Pulsa **Reproducir**: ahora se oye dónde empieza cada compás. Eso hace el metrónomo de FL Studio con su primer clic.',
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Dónde está el tiempo fuerte?',
      intro: 'La música no siempre empieza en el 1. Escucha y cuenta los golpes desde el primero: **¿en cuál cae el primer tiempo fuerte?**',
      rondas: [
        {
          pregunta: 'El tiempo fuerte suena con bombo. ¿En qué golpe cae el primero?',
          sonidos: [clics({ tiempos: 4, desde: 4, total: 9, bombo: true })],
          opciones: GOLPES,
          correcta: 1,
          explicacion: 'Empezaba en el tiempo 4: «4 | **1** 2 3 4 | **1**». Ese golpe antes del primer 1 se llama **anacrusa** (en inglés, *pickup*).',
        },
        {
          pregunta: 'Ahora sin bombo: solo el clic más agudo marca el 1.',
          sonidos: [clics({ tiempos: 4, desde: 2, total: 11 })],
          opciones: GOLPES,
          correcta: 3,
          explicacion: 'Empezaba en el tiempo 2: «2 3 4 | **1** 2 3 4 | **1**». Tres golpes de anacrusa antes del tiempo fuerte.',
        },
        {
          pregunta: 'Este va en 3/4. ¿En qué golpe cae el primer 1?',
          sonidos: [clics({ tiempos: 3, desde: 2, total: 8 })],
          opciones: GOLPES,
          correcta: 2,
          explicacion: 'Empezaba en el tiempo 2: «2 3 | **1** 2 3 | **1** 2 3».',
        },
        {
          pregunta: 'Un vals al piano. ¿En qué golpe suena el primer tiempo fuerte?',
          sonidos: [valsDesde(3, 8)],
          opciones: GOLPES,
          correcta: 1,
          explicacion: 'Empieza con un acorde («pa») y el **bajo** llega en el 2.º golpe: ese es el 1. «3 | **1** 2 3 | **1** 2 3». Muchas canciones arrancan así, con una anacrusa.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Contar «1 y 2 y»',
      parrafos: [
        'Para contar lo que pasa **entre** tiempo y tiempo, los músicos dividen cada tiempo en dos y dicen «**1 y 2 y 3 y 4 y**».',
        'Los **números** caen en el pulso; la «**y**» cae justo **en medio**, a contratiempo.',
        'Mira el hi-hat del beat básico: cada golpe es un número o una «y». En el Piano Roll, las casillas sueltas entre los números son las «y».',
      ],
      roll: { filas: FILAS, columnas: 8, porTiempo: 2, bpm: 80, notas: BEAT_BASICO },
      sonidos: [{ etiqueta: 'Cuenta en voz alta con él', groove: 'basico', bpm: 80, compases: 4 }],
      nota: 'Cuenta en voz alta: suena tonto, pero es el truco de todos los bateristas para no perderse.',
    },

    {
      tipo: 'pulso',
      titulo: 'Toca «1 y 2 y»',
      intro: 'Ahora tocas el doble de rápido que el pulso: en cada número **y** en cada «y».',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Toca en los números y en las «y»',
            bpm: 75,
            groove: 'click',
            cada: 0.5,
            meta: 12,
            contar: 'y',
            ayuda: 'Toca «1 y 2 y»',
            boton: '«1 y 2 y 3 y 4 y»',
            mensaje: 'Eso son **corcheas**: dos toques por tiempo, como el hi-hat del beat básico.',
          },
          {
            pregunta: 'Ahora solo en las «y»',
            bpm: 80,
            groove: 'click',
            cada: 1,
            desfase: 0.5,
            meta: 8,
            contar: 'y',
            ayuda: 'Toca solo en la «y»',
            boton: 'Toca en la «y»',
            mensaje: 'Tocar en la «y» es tocar **a contratiempo**. Es la base de la síncopa, que verás en la lección 2.4.',
          },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: 'El medio tiempo del trap',
      parrafos: [
        'El **trap** suele ir a **130–150 BPM**, pero se siente lento y pesado. ¿Por qué?',
        'Porque la **caja** (o las palmas) no cae en 2 y 4, sino **solo en el tiempo 3**: un golpe por compás. Eso se llama **medio tiempo** (*half-time*): el cuerpo lo siente como si fuera a la **mitad** del tempo, ~70 BPM.',
        'Mientras tanto, los **hi-hats** van rapidísimos (semicorcheas y redobles) y mantienen la energía de los 140 BPM. Ese contraste es el sonido del trap.',
      ],
      sonidos: [
        { etiqueta: '140 BPM, caja en 2 y 4', groove: 'trapNormal', bpm: 140, compases: 2 },
        { etiqueta: '140 BPM, medio tiempo', groove: 'trap', bpm: 140, compases: 2 },
      ],
      nota: 'Cuenta «**1** 2 **3** 4» con el segundo: la caja llega en el **3**. Si cuentas lento, a 70, la caja vuelve a caer en el 2 y el 4.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Medio tiempo o normal?',
      intro: 'Todos van al mismo tempo, **140 BPM**. Fíjate en la caja.',
      rondas: [
        {
          pregunta: '¿Dónde va la caja?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'trap', bpm: 140, compases: 3 }],
          opciones: MITAD,
          correcta: 0,
          explicacion: 'Una caja por compás, en el **3**: medio tiempo. Por eso suena pesado aunque los hi-hats vuelen.',
        },
        {
          pregunta: '¿Y en este?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'basico', bpm: 140, compases: 3 }],
          opciones: MITAD,
          correcta: 1,
          explicacion: 'Caja en **2 y 4**: el beat básico a 140 BPM. Suena mucho más agitado.',
        },
        {
          pregunta: '¿Y en este?',
          sonidos: [{ etiqueta: 'Escuchar', groove: 'trapNormal', bpm: 140, compases: 3 }],
          opciones: MITAD,
          correcta: 1,
          explicacion: 'Mismos hi-hats y bombo que el trap, pero con la caja en **2 y 4**: la sensación se duplica.',
        },
      ],
    },

    {
      tipo: 'pulso',
      titulo: 'Toca con la caja',
      intro: 'Suena un trap a 140 BPM. Toca el botón **solo cuando suene la caja**, en el tiempo **3**.',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Toca con la caja del trap',
            bpm: 140,
            groove: 'trap',
            cada: 4,
            desfase: 2,
            meta: 4,
            contar: 'tiempos',
            ayuda: 'Toca con la caja (tiempo 3)',
            boton: 'Toca con la caja',
            mensaje: 'Una caja cada 4 tiempos a 140 BPM es lo mismo que una cada 2 tiempos a **70**: medio tiempo.',
          },
        ],
      },
    },

    {
      tipo: 'pianoroll',
      titulo: 'Tu beat de trap',
      intro: 'Rellena los contornos: **bombo** en el 1 y en la «y» del 2, **caja** solo en el **3** y **hi-hat** en todas las casillas.',
      roll: { filas: FILAS, columnas: 8, porTiempo: 2, bpm: 140 },
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: TRAP,
        explicacion: 'Pulsa **Reproducir**: 140 BPM, pero con la caja en el 3 se siente a medio tiempo. En FL, los hi-hats irían aún más rápidos (semicorcheas).',
      },
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué indica el 3 de un compás de 3/4?',
          opciones: ['Que hay 3 tiempos en cada compás', 'Que va a 3 BPM', 'Que el tiempo fuerte es el 3'],
          correcta: 0,
          explicacion: 'El número de **arriba** cuenta los **tiempos por compás**: 3/4 = 3 tiempos («1 2 3»).',
        },
        {
          pregunta: 'En 4/4, ¿cuál es el tiempo fuerte?',
          opciones: ['El 1', 'El 2', 'El 4'],
          correcta: 0,
          explicacion: 'El **1** es el fuerte; el 3, semifuerte; el 2 y el 4, débiles (ahí va la caja del beat básico).',
        },
        {
          pregunta: 'Al contar «1 y 2 y 3 y 4 y», ¿dónde cae cada «y»?',
          opciones: ['Justo en medio de dos tiempos', 'En el tiempo fuerte', 'Al final del compás'],
          correcta: 0,
          explicacion: 'La «y» divide el tiempo en dos: cae **a contratiempo**, entre un número y el siguiente.',
        },
        {
          pregunta: 'Un trap a 140 BPM con la caja solo en el 3 se siente como si fuera a…',
          opciones: ['70 BPM', '140 BPM', '280 BPM'],
          correcta: 0,
          explicacion: 'Con la caja a **medio tiempo** el cuerpo siente la mitad: **70 BPM**, aunque el proyecto esté a 140.',
        },
        {
          pregunta: 'En el Channel rack de FL (16 pasos por compás), ¿en qué paso va la caja del medio tiempo?',
          opciones: ['En el paso 5', 'En el paso 9', 'En el paso 13'],
          correcta: 1,
          explicacion: 'Cada tiempo son 4 pasos: tiempo 1 = paso 1, tiempo 2 = paso 5, **tiempo 3 = paso 9**, tiempo 4 = paso 13.',
        },
      ],
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: medio tiempo y 3/4',
      minutos: 20,
      objetivo: 'Programar un beat de trap a medio tiempo, compararlo con la caja en 2 y 4 y pasar un beat a 3/4.',
      pasos: [
        'Proyecto nuevo a **140 BPM**. En el **Channel rack** pon un **Kick**, un **Clap** (o Snare) y un **Hat**.',
        'Medio tiempo: **kick** en los pasos **1** y **8**, **clap** solo en el paso **9** (tiempo 3) y **hat** en todos los pasos impares (1, 3, 5…).',
        'Dale a Play con el **metrónomo** activado y cuenta en voz alta «**1** y 2 y **3** y 4 y»: el clap cae en el 3.',
        'Ahora mueve el clap a los pasos **5** y **13** (2 y 4). Escucha la diferencia y vuelve a dejarlo en el 9.',
        'Para el 3/4: abre **Options → Project general settings** y en **Time signature** pon **3** tiempos por compás. El Channel rack pasa a tener **12 pasos**.',
        'En un patrón nuevo: **kick** en el paso 1, **snare** en 5 y 9, **hat** en los impares. Baja el tempo a **110** y escucha tu «um-pa-pa».',
      ],
      consejo: 'Con 16 pasos por compás, cada tiempo son 4 pasos: tiempo 1 = paso 1, tiempo 2 = paso 5, tiempo 3 = paso 9, tiempo 4 = paso 13.',
      reflexion: '¿Qué cambió en la energía al pasar la caja del 2 y 4 al 3? ¿Y cómo se sintió el beat en 3/4?',
    },
  ],
}
