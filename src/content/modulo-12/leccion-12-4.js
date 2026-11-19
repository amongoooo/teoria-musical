// Lección 12.4 (se ve como P1.4) — El 808: el bombo que canta. Producción 1 «Beats en FL Studio».
// Propuesta aprobada: https://claude.ai/artifact/XMnFwLjZLG7f8GjQUdnF4d («sí, todo como recomiendas»). El 808 como bombo
// largo con NOTA: afinarlo a la tónica y a la fundamental de cada acorde, su cola (el largo de la nota) que no pisa el
// siguiente bombo, el GLIDE (nota slide) y dos ramas nuevas del árbol: reggaetón y phonk (`abre: '12.4'`). Trae la
// voz del 808 (audio/bateria.js → nota808, una octava más arriba que en FL para que se oiga en el celular), el
// Piano roll del 808 (S2: `roll.instrumento: '808'`, fila del bombo, fondo y pincel Nota · Slide) y el cencerro.
import { CORCHEAS, GENEROS, con808, fondoRoll, notasRoll808, sonidoGenero, sonidoRack } from '../../theory/rack.js'

const { trap: TRAP } = GENEROS
const BPM = TRAP.bpm
/** El trap de la P1.2: bombo en 1, la «a» del 2 y la «a» del 3; palmas en el 3; hats en semicorcheas. */
const BEAT = TRAP.patron
const BOMBO = BEAT.kick
/** Un beat más tranquilo para seguir acordes: el bombo solo en el 1 y el 808 todo el compás. */
const BEAT_LARGO = { kick: [0], clap: [8], hat: CORCHEAS }

// Acordes de La menor (i – VI – III – VII, el loop de la A2.4), en el registro del piano.
const AM = ['A3', 'C4', 'E4']
const F = ['F3', 'A3', 'C4']
const C = ['G3', 'C4', 'E4']
const G = ['G3', 'B3', 'D4']
const LOOP = [
  { nombre: 'Am', texto: 'La menor · i', notas: AM, bajo: 'A2', dato: 'La' },
  { nombre: 'F', texto: 'Fa mayor · VI', notas: F, bajo: 'F2', dato: 'Fa' },
  { nombre: 'C', texto: 'Do mayor · III', notas: C, bajo: 'C3', dato: 'Do' },
  { nombre: 'G', texto: 'Sol mayor · VII', notas: G, bajo: 'G2', dato: 'Sol' },
]

/** El 808 con cada bombo del trap, en `nota`; `ultima` cambia la última nota (y `slide` la desliza). */
const conBombo = (nota, { ultima = nota, slide = false } = {}) => [
  { nota, paso: 0, pasos: 7 },
  { nota, paso: 7, pasos: 4 },
  { nota: ultima, paso: 11, pasos: 5, ...(slide ? { slide: true } : {}) },
]
const LINEA = conBombo('A2')
/** Un compás de La menor sobre el trap. */
const ACORDE_AM = [{ notas: AM, paso: 0, pasos: 16 }]
const sobreAm = (linea, etiqueta) => con808(BEAT, linea, { bpm: BPM, acordes: ACORDE_AM, etiqueta })
const trap808 = (linea, etiqueta, opciones = {}) => con808(BEAT, linea, { bpm: BPM, etiqueta, ...opciones })

/** El loop entero: un compás por acorde, el 808 en la fundamental todo el compás. */
const LINEA_LOOP = LOOP.map((a, i) => ({ nota: a.bajo, paso: i * 16, pasos: 16 }))
const ACORDES_LOOP = LOOP.map((a, i) => ({ notas: a.notas, paso: i * 16, pasos: 16 }))
const loop = (etiqueta) => con808(BEAT_LARGO, LINEA_LOOP, { bpm: BPM, acordes: ACORDES_LOOP, vueltas: 1, etiqueta })

/** El Piano roll del 808: un compás en semicorcheas, Mi2–Do3, con la fila del bombo y el trap de fondo. */
const ROLL = {
  instrumento: '808',
  rango: ['E2', 'C3'],
  columnas: 16,
  porTiempo: 4,
  compas: 4,
  bpm: BPM,
  bombo: BOMBO,
  fondo: fondoRoll(BEAT),
}

const ENCAJA = ['Encaja: la tónica', 'Encaja, pero no es la tónica', 'Choca']
const GLIDES = ['Sin glide', 'Glide que sube', 'Glide que baja']
const RAMAS = ['Reggaetón', 'Phonk', 'Trap', 'Dembow']

export default {
  id: '12.4',
  modulo: 12,
  titulo: 'El 808: el bombo que canta',
  subtitulo: 'Un bombo largo con nota: afinarlo, su cola y el glide',
  minutos: 14,
  resumen: [
    'El **808** es un bombo largo con **nota**: golpea como un bombo y se queda sonando como un bajo.',
    'Va **afinado**: a la **tónica** o a la **fundamental de cada acorde**. Medio tono al lado y choca.',
    'Su **cola** es el largo de la nota: que se apague antes del siguiente bombo, o los graves se hacen **barro**.',
    'El **glide** (slide) lo desliza de una nota a otra sin volver a golpear. Mejor al final de la frase.',
    '**Reggaetón** = dembow + un 808 que sigue los acordes. **Phonk** = trap + **cencerro** + un 808 **saturado**.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'El bombo que canta',
      parrafos: [
        'El **bombo** es un golpe: suena y se acaba. El **808** también golpea, pero se queda sonando: tiene **nota** y **cola**.',
        'Se llama así por la caja de ritmos **Roland TR-808** (1980): su bombo largo y grave se volvió el bajo del hip hop, el trap y el reggaetón.',
      ],
      sonidos: [
        sonidoRack({ kick: [0] }, { bpm: BPM, compases: 1, etiqueta: 'El bombo' }),
        con808(null, [{ nota: 'A2', paso: 0, pasos: 8 }], { bpm: BPM, vueltas: 1, etiqueta: 'El 808' }),
        con808({ kick: [0] }, [{ nota: 'A2', paso: 0, pasos: 8 }], { bpm: BPM, vueltas: 1, etiqueta: 'Los dos juntos' }),
      ],
      nota: 'Aquí el 808 suena **una octava más arriba** que en FL Studio, para que se oiga en la bocina del celular. Con audífonos se siente mejor.',
    },

    {
      tipo: 'siente',
      titulo: '¿Bombo o 808?',
      lados: [
        {
          etiqueta: 'Sin 808',
          emociones: 'Seco, vacío abajo',
          ejemplos: 'El trap de la P1.2: solo batería.',
          sonido: sonidoRack(BEAT, { bpm: BPM, compases: 2, etiqueta: 'Escuchar' }),
        },
        {
          etiqueta: 'Con 808',
          emociones: 'Lleno, pesa, retumba',
          ejemplos: 'El mismo beat con un 808 en cada bombo.',
          sonido: trap808(LINEA, 'Escuchar'),
        },
      ],
      nota: 'En el trap, el 808 casi siempre **golpea junto con el bombo**: el bombo pone el ataque y el 808, el cuerpo.',
    },

    {
      tipo: 'texto',
      titulo: 'Tiene nota',
      parrafos: [
        'Sobre un acorde de **La menor**, el 808 en **La** encaja. El mismo 808 en **La♯**, medio tono arriba, **choca**: suena sucio.',
        'La regla: el 808 va en la **tónica** (la casa) o en la **fundamental de cada acorde**, como el bajo de la A1.4.',
      ],
      sonidos: [sobreAm(LINEA, '808 en La'), sobreAm(conBombo('A#2'), '808 en La♯')],
    },

    {
      tipo: 'elegir',
      titulo: '¿Encaja o choca?',
      rondas: [
        {
          pregunta: 'Un acorde de La menor con su 808. **¿Cómo queda?**',
          sonidos: [sobreAm(conBombo('A#2'), 'Escuchar')],
          opciones: ENCAJA,
          ordenFijo: true,
          correcta: 2,
          explicacion: '**Choca**: el 808 está en La♯, medio tono arriba de la tónica.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [sobreAm(LINEA, 'Escuchar')],
          opciones: ENCAJA,
          ordenFijo: true,
          correcta: 0,
          explicacion: 'En **La**, la tónica: el 808 y el acorde suenan como una sola cosa.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [sobreAm(conBombo('E2'), 'Escuchar')],
          opciones: ENCAJA,
          ordenFijo: true,
          correcta: 1,
          explicacion: 'En **Mi**, la 5.ª del acorde: encaja, pero se siente en el aire, sin casa.',
        },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Tu primer 808',
      roll: ROLL,
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Dibuja el 808 en **La**, con cada **bombo**: cada nota dura hasta el siguiente golpe.',
        notas: notasRoll808(LINEA),
        fantasma: true,
        explicacion: 'Cada nota empieza **con el bombo** y dura hasta el siguiente: los dos golpean juntos y el 808 llena el hueco. Dale a Reproducir.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'La cola',
      parrafos: [
        'La **cola** es lo que el 808 se queda sonando. En FL Studio, la cola es **el largo de la nota** en el Piano roll.',
        'Si la cola pisa el siguiente bombo, los dos graves se mezclan: **barro**. Lo normal es que se apague justo antes del siguiente golpe.',
      ],
      sonidos: [
        trap808([{ nota: 'A2', paso: 0, pasos: 2 }], 'Corta'),
        trap808([{ nota: 'A2', paso: 0, pasos: 7 }], 'Hasta el siguiente bombo'),
        trap808([{ nota: 'A2', paso: 0, pasos: 16 }], 'Larga: pisa los bombos'),
      ],
      nota: 'En el Piano roll, la cola que pisa un bombo se tacha en **oro**.',
    },

    {
      tipo: 'pianoroll',
      titulo: 'Que respire',
      roll: { ...ROLL, notas: [{ nota: 'A2', inicio: 0, duracion: 11 }, { nota: 'A2', inicio: 11, duracion: 5 }] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'La primera nota pisa el **segundo bombo**. **Recórtala**: arrastra su final hasta justo antes de ese golpe.',
        notas: [{ nota: 'A2', inicio: 0, duracion: 7 }, { nota: 'A2', inicio: 11, duracion: 5 }],
        pista: 'Toca la nota y, sin soltar, lleva el dedo a la izquierda hasta que desaparezca el oro.',
        explicacion: 'Ahora la cola se apaga justo antes del bombo y los dos suenan limpios.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'El 808 sigue los acordes',
      parrafos: [
        'El loop **Am – F – C – G** (i – VI – III – VII de La menor, el de la A2.4). El 808 toca la **fundamental** de cada acorde: La, Fa, Do y Sol.',
        'Así el 808 es el **bajo** de la canción: cambia de nota cuando cambia el acorde.',
      ],
      fichas: {
        nombre: 'Acorde',
        dato: '808',
        filas: LOOP.map((a) => ({
          nombre: a.nombre,
          texto: a.texto,
          dato: a.dato,
          sonido: con808(BEAT_LARGO, [{ nota: a.bajo, paso: 0, pasos: 16 }], { bpm: BPM, acordes: [{ notas: a.notas, paso: 0, pasos: 16 }], vueltas: 1 }),
        })),
      },
      sonidos: [loop('Am – F – C – G con su 808')],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Escucha y copia el 808',
      roll: {
        instrumento: '808',
        rango: ['E2', 'C3'],
        columnas: 16,
        porTiempo: 1,
        compas: 4,
        bpm: BPM,
        bombo: [0, 4, 8, 12],
        fondo: [...fondoRoll(BEAT_LARGO, { compases: 4, porTiempo: 1 }), ...LOOP.map((a, i) => ({ nota: a.notas, inicio: i * 4, duracion: 4, velocity: 0.38 }))],
      },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Escucha el original y dibuja el 808: **una nota por compás**, en la fundamental de cada acorde.',
        escuchar: loop('Escuchar el original'),
        notas: LOOP.map((a, i) => ({ nota: a.bajo, inicio: i * 4, duracion: 4 })),
        pista: 'La primera es la tónica, **La**. Los acordes son Am – F – C – G.',
        explicacion: '**La, Fa, Do y Sol**: la fundamental de cada acorde, un compás entero cada una.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'El 808 que se desliza',
      parrafos: [
        'Un **glide** (o *slide*) hace que el 808 **se deslice** de una nota a otra en lugar de volver a golpear: la nota se dobla.',
        'Va mejor **al final de la frase**, empujando hacia el 1. Uno por compás basta.',
      ],
      sonidos: [trap808(conBombo('A2', { ultima: 'C3' }), 'Sin glide'), trap808(conBombo('A2', { ultima: 'C3', slide: true }), 'Con glide')],
      roll: { ...ROLL, notas: notasRoll808(conBombo('A2', { ultima: 'C3', slide: true })) },
      nota: 'En el roll, la nota **slide** lleva un triangulito, como en FL Studio, y una rampa desde la nota de antes.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Con glide o sin glide?',
      rondas: [
        {
          pregunta: 'Escucha la última nota del 808. **¿Qué hace?**',
          sonidos: [trap808(conBombo('A2', { ultima: 'C3', slide: true }), 'Escuchar')],
          opciones: GLIDES,
          ordenFijo: true,
          correcta: 1,
          explicacion: 'Se **desliza hacia arriba**, de La a Do, sin volver a golpear.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [trap808(conBombo('A2', { ultima: 'E2' }), 'Escuchar')],
          opciones: GLIDES,
          ordenFijo: true,
          correcta: 0,
          explicacion: '**Sin glide**: la última nota vuelve a golpear, más grave.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [trap808(conBombo('A2', { ultima: 'E2', slide: true }), 'Escuchar')],
          opciones: GLIDES,
          ordenFijo: true,
          correcta: 2,
          explicacion: 'Se **desliza hacia abajo**, de La a Mi: el 808 se cae.',
        },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Haz un glide',
      roll: { ...ROLL, slide: true, notas: notasRoll808(conBombo('A2', { ultima: 'C3' })) },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Elige el pincel **Slide** y toca la **última nota**: el 808 se desliza de La a Do.',
        notas: notasRoll808(conBombo('A2', { ultima: 'C3', slide: true })),
        fantasma: true,
        explicacion: 'La última nota ya no golpea: el 808 sube deslizándose de La a Do. Dale a Reproducir.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Dos ramas nuevas',
      parrafos: [
        'El **reggaetón** es un hijo del dembow: la misma caja en 3 + 3 + 2, con un **808 que sigue los acordes** y hats más llenos.',
        'El **phonk** es un hijo del trap: suma un **cencerro** y un 808 **saturado**. La saturación le añade armónicos agudos: por eso se oye hasta en una bocina chica.',
      ],
      sonidos: [
        sonidoGenero('dembow', { etiqueta: 'Dembow' }),
        sonidoGenero('reggaeton', { etiqueta: 'Reggaetón' }),
        sonidoGenero('trap', { etiqueta: 'Trap' }),
        sonidoGenero('phonk', { etiqueta: 'Phonk' }),
      ],
      nota: 'Al terminar esta lección, reggaetón y phonk se abren en el **árbol de géneros** (Entrenar › Ritmo).',
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué rama es?',
      rondas: [
        {
          pregunta: '¿Qué género es?',
          sonidos: [sonidoGenero('phonk', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 1,
          explicacion: 'El **cencerro** y el 808 saturado: **phonk**, hijo del trap.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [sonidoGenero('reggaeton', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 0,
          explicacion: 'La caja en 3 + 3 + 2 con un **808** que cambia de nota: **reggaetón**.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [sonidoGenero('dembow', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 3,
          explicacion: 'La caja en 3 + 3 + 2, **sin 808**: el **dembow**, el tronco.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [sonidoGenero('trap', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 2,
          explicacion: 'Medio tiempo con hats en semicorcheas, **sin cencerro ni 808**: **trap**.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'En FL Studio',
      parrafos: [
        'Carga un sample de **808** en un canal y comprueba su nota: en el *Channel settings*, **clic derecho** en el teclado de abajo › *Set root note*.',
        'Dibújalo en el **Piano roll** del canal. La cola es **el largo de la nota**; activa ***Cut itself*** para que cada nota corte a la anterior.',
        'El glide: la herramienta **Slide** del Piano roll (las notas salen con su triangulito) o el modo **Porta** del canal. Para saturarlo, un ***Fruity Soft Clipper*** o el ***Distructor***.',
      ],
      sonidos: [sonidoGenero('phonk', { etiqueta: 'Escuchar: 808 saturado con glide' })],
      nota: 'En FL el 808 suele ir **una octava más abajo** que aquí (Do1, La1): en audífonos o en un buen bafle retumba.',
    },

    {
      tipo: 'pianoroll',
      titulo: 'Tu 808',
      roll: { ...ROLL, slide: true, fondo: [...fondoRoll(BEAT), { nota: AM, inicio: 0, duracion: 16, velocity: 0.38 }] },
      objetivo: {
        tipo: 'libre',
        instruccion: 'El trap y el acorde de **La menor** ya suenan. Haz **tu 808**: al menos **4 notas** y **un glide**.',
        cantidad: 4,
        slides: 1,
        mensaje: 'Dale a Reproducir y cámbialo hasta que te guste. Si una cola pisa un bombo, la verás en oro.',
      },
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: 4 compases de trap con 808',
      minutos: 20,
      objetivo: 'Escribir un 808 afinado que siga los acordes, con la cola recortada y un glide.',
      pasos: [
        'Proyecto a **140** en **La menor**: Kick en **1, 8 y 12**, Clap en el **9** y el Hat en los **16** pasos. Patrón de **4 compases**.',
        'Pon los acordes **Am – F – C – G** (un compás cada uno) con cualquier piano o pad.',
        'Carga un **808**, comprueba su nota (*Set root note*) y dibuja en el Piano roll la **fundamental** de cada acorde con cada bombo.',
        'Recorta cada nota para que la cola se apague **antes del siguiente bombo**. Activa *Cut itself*.',
        'Al final del **compás 4**, haz un **slide** hacia la nota del primer acorde. Y súmale un saturador suave.',
      ],
      consejo: 'Escúchalo en el celular y en audífonos: si en el celular no se oye, satúralo un poco más.',
      reflexion: '¿Qué cambia al quitar el glide? ¿Y con el 808 una octava más arriba?',
    },
  ],
}
