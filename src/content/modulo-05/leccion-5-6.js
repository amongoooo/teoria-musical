// Lección 5.6 — Ritmo armónico.
// Plan aprobado: https://claude.ai/artifact/1MKSzMQVTy4c3rXHaCqiN8 (lista del módulo: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL)
// Cada cuánto cambia el acorde (uno cada 2 compases, uno por compás, dos por compás, uno por tiempo) y cómo cambia la
// energía, con el MISMO loop de la A2.4 (C – G – Am – F) sobre el MISMO beat: así lo único que cambia es la velocidad
// de la armonía. El pre-coro que acelera y el acorde que se ADELANTA medio tiempo (una síncopa, R1.4).
// Piezas nuevas: `conBeat` (theory/bateria.js: acordes con su bajo sobre la batería, en un solo sonido), la rejilla de
// compases con BLOQUES que duran lo que dura el acorde y `versiones` (components/Rejilla.jsx), y «Toca en cada cambio»
// (`pulso` con `toques` = los cambios de acorde). Sin canciones reales: se nombran géneros.
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { acordeDeGrado } from '../../theory/acordes.js'
import { cambiosAcordes, conBeat } from '../../theory/bateria.js'

/** Voces en Do mayor (como en la 5.4 y la 5.5): el bajo abajo y arriba tres notas que se mueven poco. */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  IV: ['F2', 'C4', 'F4', 'A4'],
  V: ['G2', 'B3', 'D4', 'G4'],
  vi: ['A2', 'C4', 'E4', 'A4'],
}
/** Cada tonalidad: su tónica (para el cifrado) y cuánto se mueven las voces de Do. */
const TONOS = { C: { tonica: 'C4', mover: null }, G: { tonica: 'G3', mover: '-4P' } }

const voz = (rn, tono = 'C') => (TONOS[tono].mover ? VOZ_DO[rn].map((n) => Note.transpose(n, TONOS[tono].mover)) : VOZ_DO[rn])
/** 'C', 'Am'… */
const cifra = (rn, tono = 'C') => acordeDeGrado(TONOS[tono].tonica, rn).cifrado
/** 'C – G – Am – F'. */
const cifras = (romanos, tono = 'C') => romanos.map((rn) => cifra(rn, tono)).join(' – ')

/** Un acorde para la rejilla y para `conBeat`: cifrado, grado, notas (con el bajo) y cuántos tiempos dura. */
const acorde = (rn, tiempos, { tono = 'C', adelanto = 0 } = {}) => ({
  cifrado: cifra(rn, tono),
  grado: rn,
  notas: voz(rn, tono),
  tiempos,
  ...(adelanto ? { adelanto } : {}),
})
/** Un loop: los grados, todos con la misma duración (`veces` = cuántas veces seguidas). */
const loop = (romanos, tiempos, { veces = 1, ...op } = {}) =>
  Array.from({ length: veces }, () => romanos.map((rn) => acorde(rn, tiempos, op))).flat()
/** Una frase con duraciones distintas: [['I', 8], ['vi', 8], …]. */
const frase = (lista, op) => lista.map(([rn, tiempos]) => acorde(rn, tiempos, op))

const POP = ['I', 'V', 'vi', 'IV'] // C – G – Am – F (A2.4)
const MENOR = ['vi', 'IV', 'I', 'V'] // Am – F – C – G

/** Las cuatro velocidades, en orden (no se barajan: tienen orden natural). */
const CADA = ['Cada 2 compases', 'Cada compás', 'Dos por compás', 'Cada tiempo']
const cadaCuanto = (acordes, beat, correcta, explicacion) => ({
  pregunta: '¿Cada cuánto cambia el acorde?',
  sonidos: [conBeat(acordes, beat)],
  opciones: CADA,
  ordenFijo: true,
  correcta,
  explicacion,
})

/** Ronda de «Toca en cada cambio»: el loop suena sobre el beat y se toca cuando cambia el acorde. */
const tocaCambios = (acordes, beat, extra) => {
  const s = conBeat(acordes, beat)
  return {
    bpm: beat.bpm,
    groove: s.groove,
    tiempos: s.tiempos,
    porTiempo: s.porTiempo,
    toques: cambiosAcordes(acordes),
    boton: 'Toca cuando cambia el acorde',
    ayuda: 'Cambios a tiempo',
    ...extra,
  }
}

// ——— Pre-coros: uno que acelera y otro que no; los dos llegan al mismo coro ———
const ACELERA = [['IV', 4], ['V', 4], ['IV', 2], ['V', 2], ['vi', 2], ['V', 2], ['I', 4]]
const IGUAL = [['IV', 8], ['V', 8], ['I', 4]]

const nota = (n, inicio, duracion) => ({ nota: n, inicio, duracion })
/** El loop en el roll, dos acordes por compás (para «Lee el roll»). */
const ROLL_DOS = [
  ...['C4', 'E4', 'G4'].map((n) => nota(n, 0, 2)),
  ...['D4', 'G4', 'B4'].map((n) => nota(n, 2, 2)),
  ...['C4', 'E4', 'A4'].map((n) => nota(n, 4, 2)),
  ...['C4', 'F4', 'A4'].map((n) => nota(n, 6, 2)),
]

export default {
  id: '5.6',
  modulo: 5,
  titulo: 'Ritmo armónico',
  subtitulo: 'Cada cuánto cambia el acorde',
  minutos: 15,
  resumen: [
    'El **ritmo armónico** es cada cuánto cambia el acorde. No es el tempo: un beat rápido puede tener la armonía lenta.',
    '**Lento** (un acorde cada 2 compases) deja espacio; **rápido** (dos por compás o más) empuja.',
    'Un pre-coro **acelera** el cambio de acordes para que el coro se sienta como una llegada.',
    'Un acorde puede **adelantarse** medio tiempo al compás, en la «y» del 4: una síncopa que empuja hacia delante.',
  ],
  pasos: [
    // 0 · O5 — Gancho: el mismo loop sobre el mismo beat, a dos velocidades
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Mismo beat, mismos acordes.',
      rondas: [
        {
          pregunta: '¿Cuál **empuja** más?',
          sonidos: [conBeat(loop(POP, 4)), conBeat(loop(POP, 2, { veces: 2 }))],
          correcta: 1,
          mezclar: true,
          explicacion: `Los dos son **${cifras(POP)}** a 90 BPM. En uno el acorde cambia cada compás; en el que empuja, **dos veces por compás**. Eso es el ritmo armónico.`,
        },
      ],
    },

    // 1 · L10 — Dos velocidades a la vez (rejilla con bloques sobre el beat)
    {
      tipo: 'texto',
      titulo: 'Dos velocidades a la vez',
      parrafos: [
        'El **tempo** dice qué tan rápido va el pulso. El **ritmo armónico**, cada cuánto cambia el acorde.',
        `Aquí, **${cifras(POP)}** con un acorde por compás: el beat late cuatro veces y el acorde cambia una.`,
      ],
      rejilla: (() => {
        const acordes = loop(POP, 4)
        return { acordes, sonido: conBeat(acordes, { vueltas: 2, etiqueta: 'Escuchar sobre el beat' }) }
      })(),
    },

    // 2 · L10 con versiones — Lento, normal, rápido
    {
      tipo: 'texto',
      titulo: 'Lento, normal, rápido',
      parrafos: ['Los mismos ocho compases, el mismo beat. Cambia cuánto dura cada acorde: **lento deja espacio, rápido empuja**.'],
      rejilla: {
        versiones: [
          { nombre: 'Lento', acordes: loop(POP, 8), etiqueta: 'Un acorde cada 2 compases' },
          { nombre: 'Normal', acordes: loop(POP, 4, { veces: 2 }), etiqueta: 'Un acorde por compás' },
          { nombre: 'Rápido', acordes: loop(POP, 2, { veces: 4 }), etiqueta: 'Dos acordes por compás' },
        ].map((v) => ({ ...v, sonido: conBeat(v.acordes) })),
      },
    },

    // 3 · O2 — ¿Cada cuánto cambia?
    {
      tipo: 'elegir',
      titulo: '¿Cada cuánto cambia?',
      intro: 'Cuenta los tiempos con la caja: cae en el 2 y en el 4.',
      rondas: [
        cadaCuanto(loop(POP, 4, { tono: 'G' }), { bpm: 90 }, 1, `En Sol: **${cifras(POP, 'G')}**, un acorde en cada compás.`),
        cadaCuanto(loop(MENOR, 8), { groove: 'trap', bpm: 140 }, 0, `**${cifras(MENOR)}** sobre un trap a 140 BPM: cada acorde dura **2 compases**. El beat corre, la armonía no.`),
        cadaCuanto(loop(['I', 'IV'], 2, { veces: 4 }), { groove: 'boomBap', bpm: 90 }, 2, '**C – F** con boom bap: cambia en el 1 y en el 3, **dos veces por compás**.'),
        cadaCuanto(loop(['I', 'IV', 'V', 'IV'], 1, { veces: 3 }), { bpm: 100 }, 3, `**${cifras(['I', 'IV', 'V', 'IV'])}**: un acorde en **cada tiempo**. Es lo más rápido que se suele usar.`),
      ],
    },

    // 4 · T1 con acordes — Toca en cada cambio
    {
      tipo: 'pulso',
      titulo: 'Toca en cada cambio',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          tocaCambios(loop(POP, 4), { bpm: 90 }, { pregunta: 'Un acorde por compás', meta: 6, mensaje: 'Cambia en el **1** de cada compás.' }),
          tocaCambios(loop(POP, 2), { bpm: 90 }, { pregunta: 'Dos por compás', meta: 8, visual: false, mensaje: 'Cambia en el **1** y en el **3**.' }),
          tocaCambios(loop(MENOR, 8), { groove: 'trap', bpm: 140 }, { pregunta: 'Uno cada 2 compases', meta: 4, visual: false, mensaje: 'A 140 BPM y aun así espera **8 tiempos** para cambiar.' }),
        ],
      },
    },

    // 5 · L2 — Tempo rápido, armonía lenta
    {
      tipo: 'texto',
      titulo: 'Tempo rápido, armonía lenta',
      parrafos: [
        'El trap va a **140 BPM** y suena tranquilo: sus acordes duran 2 compases o más.',
        'Un boom bap a **90 BPM** con dos acordes por compás se siente más movido. La energía no la da solo el tempo: también **cada cuánto cambia la armonía**.',
      ],
      sonidos: [
        conBeat(loop(MENOR, 8), { groove: 'trap', bpm: 140, etiqueta: 'Trap · un acorde cada 2 compases' }),
        conBeat(loop(MENOR, 2, { veces: 2 }), { groove: 'boomBap', bpm: 90, etiqueta: 'Boom bap · dos por compás' }),
      ],
      nota: 'En el trap y el R&B la armonía va lenta: deja espacio a la voz y al 808.',
    },

    // 6 · R2 — Dobla el ritmo armónico (el bajo del loop en 2 compases)
    {
      tipo: 'pianoroll',
      titulo: 'Dobla el ritmo armónico',
      roll: { filas: ['C3', 'A2', 'G2', 'F2'], columnas: 8, porTiempo: 1, compas: 4, bpm: 90, notas: [] },
      objetivo: {
        tipo: 'copiar',
        notas: [nota('C3', 0, 2), nota('G2', 2, 2), nota('A2', 4, 2), nota('F2', 6, 2)],
        instruccion: `El bajo de **${cifras(POP)}**, dos acordes por compás: **Do, Sol, La, Fa**, dos tiempos cada uno.`,
        pista: 'Toca la casilla donde empieza cada nota y arrastra a la derecha para alargarla a dos tiempos.',
        explicacion: 'Pulsa **Reproducir**: el loop entero cabe en **2 compases**. Mismos acordes, el doble de rápido.',
      },
    },

    // 7 · L10 mixta — El pre-coro acelera
    {
      tipo: 'texto',
      titulo: 'El pre-coro acelera',
      parrafos: [
        'En una canción, el ritmo armónico cambia por partes. El verso va lento; el pre-coro **acelera**: un acorde por compás y luego dos.',
        'Esa prisa hace que el coro se sienta como **una llegada**.',
      ],
      rejilla: (() => {
        const acordes = frase([['I', 8], ['vi', 8], ['IV', 4], ['V', 4], ['IV', 2], ['V', 2], ['vi', 2], ['V', 2], ['I', 4], ['V', 4], ['vi', 4], ['IV', 4]])
        return { acordes, sonido: conBeat(acordes, { bpm: 100, etiqueta: 'Verso, pre-coro y coro' }) }
      })(),
    },

    // 8 · O1 — ¿Cuál prepara el coro?
    {
      tipo: 'elegir',
      titulo: '¿Cuál prepara el coro?',
      intro: 'Dos pre-coros que llegan al mismo coro.',
      rondas: [
        {
          pregunta: '¿Cuál te lleva **con más prisa** al coro?',
          sonidos: [conBeat(frase(ACELERA), { bpm: 100 }), conBeat(frase(IGUAL), { bpm: 100 })],
          correcta: 0,
          mezclar: true,
          explicacion: 'El que **acelera**: F y G de un compás, luego dos acordes por compás. El otro se queda en dos compases por acorde.',
        },
        {
          pregunta: 'En Sol: ¿cuál te lleva **con más prisa** al coro?',
          sonidos: [conBeat(frase(ACELERA, { tono: 'G' }), { bpm: 100 }), conBeat(frase(IGUAL, { tono: 'G' }), { bpm: 100 })],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['IV', 'V', 'IV', 'V', 'vi', 'V'], 'G')}**: cada vez más seguido, hasta llegar a **G**.`,
        },
      ],
    },

    // 9 · L10 adelanto — El acorde que se adelanta
    {
      tipo: 'texto',
      titulo: 'El acorde que se adelanta',
      parrafos: [
        'En el pop, el reguetón y el house, el acorde nuevo suele llegar **medio tiempo antes**: en la «y» del 4 del compás anterior.',
        'Es una **síncopa** (R1.4): empuja hacia delante sin cambiar el tempo. La batería no cambia.',
      ],
      rejilla: {
        versiones: [
          { nombre: 'A tiempo', acordes: loop(POP, 4), etiqueta: 'Cambia en el 1' },
          { nombre: 'Adelantado', acordes: loop(POP, 4, { adelanto: 0.5 }), etiqueta: 'Cambia en la «y» del 4' },
        ].map((v) => ({ ...v, sonido: conBeat(v.acordes, { vueltas: 2 }) })),
      },
    },

    // 10 · O1 — ¿Cuál se adelanta?
    {
      tipo: 'elegir',
      titulo: '¿Cuál se adelanta?',
      intro: 'El mismo loop dos veces. Fíjate en el bombo del 1.',
      rondas: [
        {
          pregunta: '¿En cuál llega **antes** el acorde?',
          sonidos: [conBeat(loop(POP, 4, { adelanto: 0.5 })), conBeat(loop(POP, 4))],
          correcta: 0,
          mezclar: true,
          explicacion: 'En el adelantado, G, Am y F suenan **antes** del bombo del 1. En el otro, justo con él.',
        },
        {
          pregunta: 'Con dembow: ¿en cuál llega **antes** el acorde?',
          sonidos: [conBeat(loop(MENOR, 4, { adelanto: 0.5 }), { groove: 'dembow', bpm: 95 }), conBeat(loop(MENOR, 4), { groove: 'dembow', bpm: 95 })],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(MENOR)}** con cada cambio medio tiempo antes: así suenan muchos pianos de reguetón.`,
        },
        {
          pregunta: 'Solo con el metrónomo: ¿en cuál llega **antes**?',
          sonidos: [conBeat(loop(POP, 4, { tono: 'G', adelanto: 0.5 }), { groove: 'click' }), conBeat(loop(POP, 4, { tono: 'G' }), { groove: 'click' })],
          correcta: 0,
          mezclar: true,
          explicacion: 'El acorde cae **entre** el clic del 4 y el del 1. En el otro cae con el clic fuerte.',
        },
      ],
    },

    // 11 · O4 + O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'Lee el roll: ¿cada cuánto cambia el acorde?',
          roll: { rango: ['C4', 'C5'], soloBlancas: true, columnas: 8, porTiempo: 1, compas: 4, bpm: 90, notas: ROLL_DOS },
          opciones: CADA,
          ordenFijo: true,
          correcta: 2,
          explicacion: `**${cifras(POP)}** en 2 compases: cada acorde dura **dos tiempos**, dos por compás.`,
        },
        {
          pregunta: 'El **ritmo armónico** es…',
          opciones: ['Cada cuánto cambia el acorde', 'Qué tan rápido va el beat', 'Cuántos acordes tiene el loop', 'El ritmo del bajo'],
          correcta: 0,
          explicacion: 'Cada cuánto cambia el acorde. El tempo es otra cosa: un trap a 140 puede cambiar de acorde cada 2 compases.',
        },
        {
          pregunta: 'Para que el pre-coro **empuje** hacia el coro…',
          opciones: ['Los acordes cambian más seguido', 'Sube el tempo', 'Se quita la batería', 'Se queda en un solo acorde'],
          correcta: 0,
          explicacion: 'Se **acelera el ritmo armónico**: el tempo sigue igual y la armonía se mueve más rápido.',
        },
        {
          pregunta: 'Un acorde que llega en la «y» del 4, antes del compás, está…',
          opciones: ['Adelantado: es una síncopa', 'Tarde', 'Fuera de tempo', 'En una cadencia rota'],
          correcta: 0,
          explicacion: 'Llega medio tiempo **antes** del 1: una síncopa (R1.4) que empuja.',
        },
      ],
    },

    // 12 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'El mismo loop, lento y rápido.',
      lados: [
        {
          etiqueta: 'Lento',
          emociones: 'Espacio, flotar',
          ejemplos: 'Trap, R&B, baladas: deja cantar.',
          sonido: conBeat(loop(MENOR, 8), { groove: 'trap', bpm: 140, etiqueta: 'Escuchar el lento' }),
        },
        {
          etiqueta: 'Rápido',
          emociones: 'Prisa, empuje',
          ejemplos: 'Pre-coros, rock, funk: dan ganas de moverse.',
          sonido: conBeat(loop(POP, 2, { veces: 2 }), { bpm: 110, etiqueta: 'Escuchar el rápido' }),
        },
      ],
      nota: 'Una canción no tiene un solo ritmo armónico: lo cambia por partes para subir y bajar la energía.',
    },

    // 13 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: el mismo loop a tres velocidades',
      minutos: 20,
      objetivo: 'Hacer tres versiones del mismo loop (lenta, rápida y adelantada) y ordenarlas como verso, pre-coro y coro.',
      pasos: [
        'A **140 BPM**, en el **Piano roll**, escribe **C – G – Am – F** con un acorde cada 2 compases (8 compases) y el bajo en otro canal.',
        'Clona el patrón (**Clone pattern**) y haz la versión rápida: **dos acordes por compás**.',
        'En un tercer patrón, con el **Snap** en «1/2 beat», adelanta cada acorde **medio tiempo** y alarga el anterior hasta ahí.',
        'En el **Playlist**: verso con el lento, pre-coro con el rápido y el coro con el adelantado.',
      ],
      consejo: 'Deja la batería igual en las tres partes: así se oye que la energía la mueve la armonía.',
      reflexion: '¿En cuál cabe mejor una voz? ¿Cuál te pide moverte?',
    },
  ],
}
