// Lección 12.1 (se ve como P1.1) — Anatomía de un beat. Abre Producción 1 «Beats en FL Studio».
// Plan aprobado: https://claude.ai/artifact/EqP6ik7JikQGsfGUnek2uT (sección 05).
// Ritmo 1 ya enseña DÓNDE va cada golpe; aquí la pregunta es QUÉ PAPEL juega cada sonido, quitando y poniendo capas en
// el Channel rack táctil (paso `rack`, S1; theory/rack.js).
import { CORCHEAS, SEMICORCHEAS, sinFila, sonidoRack } from '../../theory/rack.js'

/** El boom bap de la lección: bombo sincopado (1, la «a» del 2, la «y» del 3), palmas en 2 y 4, hats en corcheas, una percusión. */
const BOOM_BAP = { kick: [0, 7, 10], clap: [4, 12], hat: CORCHEAS, tom: [14] }
/** El mismo kit con el bombo del pop (1 y 3). */
const POP = { kick: [0, 8], clap: [4, 12], hat: CORCHEAS }
/** El beat del dictado final (más lento): bombo en 1, la «y» del 2 y la «y» del 3. */
const DICTADO = { kick: [0, 6, 10], clap: [4, 12], hat: CORCHEAS }

const RACK = { filas: ['kick', 'clap', 'hat', 'tom'], bpm: 90 }

const beat = (patron, etiqueta, opciones = {}) => sonidoRack(patron, { bpm: 90, compases: 2, etiqueta, ...opciones })

/** «¿Qué le falta?»: el beat entero y luego el mismo sin una fila. */
const hueco = (fila) => [beat(BOOM_BAP, 'El beat entero'), beat(sinFila(BOOM_BAP, fila), 'Con un hueco')]
const PIEZAS = ['El bombo', 'Las palmas', 'Los hats', 'La percusión']

export default {
  id: '12.1',
  modulo: 12,
  titulo: 'Anatomía de un beat',
  subtitulo: 'El papel de cada sonido en el Channel rack',
  minutos: 10,
  resumen: [
    'Un beat son **capas** que se repiten, y cada una tiene su papel: el **bombo** da el peso, la **caja o las palmas** golpean en el **2 y el 4** (el *backbeat*) y los **hats** son el motor.',
    'La **percusión** adorna: no sostiene el beat, le da color.',
    'El **bombo** decide el estilo: en el 1 y el 3 suena a pop; sincopado, a boom bap.',
    'Más pasos en los hats = **más energía**, aunque el tempo sea el mismo.',
    'En FL Studio, el **Channel rack** (F6) tiene una fila por sonido y **16 pasos** por compás: clic izquierdo enciende, derecho apaga, y la luz verde silencia el canal.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Un beat por dentro',
      parrafos: [
        'Escucha este beat de **boom bap**. Parece un solo sonido, pero son **cuatro** que se repiten cada compás.',
        'Cada sonido tiene un **papel**, como los músicos de una banda. Para oírlo hay que separarlos: quitar y poner **capas**.',
      ],
      sonidos: [beat(BOOM_BAP, 'Escuchar el beat')],
    },

    {
      tipo: 'rack',
      titulo: 'Escucha cada capa',
      intro: 'Este es el **Channel rack**: una fila por sonido y 16 pasos por compás.',
      rack: { ...RACK, patron: BOOM_BAP },
      objetivo: {
        tipo: 'capas',
        instruccion: 'Dale a **Reproducir** y toca las luces para silenciar sonidos, hasta oír **cada uno solo**.',
        mensaje: 'Solo, el bombo pesa; las palmas golpean; los hats corren; la percusión adorna. Juntos, un beat.',
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué le falta?',
      rondas: [
        {
          pregunta: 'Primero el beat entero y luego con un hueco. **¿Qué le falta?**',
          sonidos: hueco('hat'),
          opciones: PIEZAS,
          correcta: 2,
          explicacion: 'Faltan los **hats**: el beat sigue en pie, pero se siente vacío y lento. Son el motor.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: hueco('kick'),
          opciones: PIEZAS,
          correcta: 0,
          explicacion: 'Falta el **bombo**: todo queda flotando, sin peso abajo.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: hueco('clap'),
          opciones: PIEZAS,
          correcta: 1,
          explicacion: 'Faltan las **palmas** del 2 y el 4: sin ese golpe, la cabeza no sabe dónde caer.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Cada sonido, un papel',
      parrafos: [
        '**Bombo**: el peso. Marca el **1** y empuja desde abajo; dónde cae decide el estilo.',
        '**Caja o palmas**: el golpe del **2 y el 4**, el *backbeat*. Es donde la cabeza cae al moverse.',
        '**Hats**: el motor. Marcan la subdivisión (corcheas o semicorcheas) y dicen cuánta energía tiene el beat.',
        '**Percusión**: el adorno. Un golpe aquí y allá que le da color, sin sostener nada.',
      ],
      sonidos: [
        beat({ kick: BOOM_BAP.kick }, 'Solo el bombo'),
        beat({ clap: BOOM_BAP.clap }, 'Solo las palmas'),
        beat({ hat: BOOM_BAP.hat }, 'Solo los hats'),
      ],
      nota: 'En FL Studio, cada fila del Channel rack es un **canal**. El botón verde de cada canal lo silencia, igual que la luz de aquí.',
    },

    {
      tipo: 'rack',
      titulo: 'Pon el backbeat',
      rack: { ...RACK, filas: ['kick', 'clap'], patron: { kick: [0, 8] }, fijas: ['kick'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'El bombo ya está. Pon las **palmas** en el **2** y en el **4**.',
        patron: { clap: [4, 12] },
        pista: 'Cada grupo de 4 pasos es un tiempo: el 2 empieza en el segundo grupo.',
        explicacion: 'Palmas en los pasos **5 y 13**: el 2 y el 4. Es el backbeat de casi todo el pop, el hip hop y el rock.',
      },
    },

    {
      tipo: 'rack',
      titulo: 'Los hats, el motor',
      rack: { ...RACK, filas: ['kick', 'clap', 'hat'], patron: { kick: [0, 8], clap: [4, 12] }, fijas: ['kick', 'clap'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Pon los **hats en corcheas**: un paso sí y uno no, empezando en el 1. Puedes arrastrar el dedo por la fila.',
        patron: { hat: CORCHEAS },
        guia: true,
        explicacion: 'Ocho hats por compás, dos por tiempo: «1 y 2 y 3 y 4 y». Con eso el beat ya camina.',
      },
    },

    {
      tipo: 'siente',
      titulo: 'Mismo kit, otro beat',
      intro: 'Las mismas palmas y los mismos hats. Solo cambia el bombo.',
      lados: [
        {
          etiqueta: 'Bombo en el 1 y el 3',
          emociones: 'Recto, firme, para bailar sin pensar',
          ejemplos: 'El pop y el rock de radio.',
          sonido: beat(POP, 'Escuchar'),
        },
        {
          etiqueta: 'Bombo sincopado',
          emociones: 'Rebota, cabecea, tiene actitud',
          ejemplos: 'El boom bap del hip hop de los 90.',
          sonido: beat(BOOM_BAP, 'Escuchar'),
        },
      ],
      nota: 'Por eso los productores empiezan casi siempre por el **bombo**: es el que decide el estilo.',
    },

    {
      tipo: 'rack',
      titulo: 'Escucha y copia el bombo',
      rack: { ...RACK, filas: ['kick', 'clap', 'hat'], patron: { clap: [4, 12], hat: CORCHEAS }, fijas: ['clap', 'hat'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Escucha el original y pon el **bombo** de oído. Son **tres** golpes.',
        patron: { kick: BOOM_BAP.kick },
        escuchar: true,
        pista: 'El primero cae en el 1. Los otros dos caen entre el 2 y el 4, fuera de los tiempos.',
        explicacion: 'Bombo en el **1**, en la última semicorchea del **2** (paso 8) y a mitad del **3** (paso 11): el bombo del boom bap.',
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Cuál empuja más?',
      rondas: [
        {
          pregunta: 'El mismo beat al mismo tempo. **¿Cuál tiene más energía?**',
          sonidos: [beat({ ...POP, hat: CORCHEAS }), beat({ ...POP, hat: SEMICORCHEAS })],
          mezclar: true,
          correcta: 1,
          explicacion: 'Con los hats en **semicorcheas** (los 16 pasos) el beat corre más, aunque el tempo no cambió: más pasos = más energía.',
        },
      ],
    },

    {
      tipo: 'rack',
      titulo: 'Copia el beat entero',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: 80 },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Ahora todo de oído: **bombo**, **palmas** y **hats**.',
        patron: DICTADO,
        escuchar: true,
        pista: 'Empieza por lo fácil: las palmas en el 2 y el 4, y los hats en corcheas. El bombo, al final.',
        explicacion: 'Palmas en 2 y 4, hats en corcheas y el bombo en el **1** y a mitad del **2** y del **3** (pasos 1, 7 y 11).',
      },
    },

    {
      tipo: 'texto',
      titulo: 'En FL Studio',
      parrafos: [
        'Abre el **Channel rack** con **F6**. Un proyecto nuevo ya trae una fila por sonido: **Kick**, **Clap**, **Hat** y **Snare**.',
        'Cada fila tiene **16 pasos**, en grupos de 4 de distinto tono: uno por tiempo, como aquí. **Clic izquierdo** enciende un paso y **clic derecho** lo apaga; arrastrar pinta varios.',
        'La **luz verde** de la izquierda silencia el canal. El **tempo** se cambia arriba, en el número de BPM.',
        'Lo que programas es un **patrón**. Con **PAT** suena el patrón en bucle; con **SONG**, lo que pongas en la lista de reproducción (*Playlist*).',
      ],
      nota: 'Para cambiar un sonido, arrastra un sample del **Browser** (a la izquierda, en *Packs › Drums*) encima del nombre del canal.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu primer patrón',
      minutos: 15,
      objetivo: 'Programar un beat de un compás con cuatro capas y oír el papel de cada una.',
      pasos: [
        'Proyecto nuevo a **90 BPM**. Abre el **Channel rack** (F6) y deja el modo **PAT**.',
        '**Clap** en los pasos **5 y 13**; **Hat** en los pasos impares (1, 3, 5…).',
        '**Kick** en los pasos **1, 8 y 11**: el bombo del boom bap.',
        'Añade una percusión: arrastra un sample del **Browser** (*Packs › Drums › Percussion*) al Channel rack y ponle uno o dos golpes, por ejemplo en el paso **15**.',
        'Dale a reproducir y **silencia cada canal** con su luz verde, uno por uno. Escucha qué se pierde cada vez.',
      ],
      consejo: 'Si el beat suena vacío, casi siempre faltan hats. Si suena sin peso, revisa el bombo.',
      reflexion: '¿Qué capa te costó más quitar? ¿Cuál notaste menos al silenciarla?',
    },
  ],
}
