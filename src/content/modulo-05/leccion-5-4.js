// Lección 5.4 — Las progresiones pop.
// Plan aprobado: https://claude.ai/artifact/5y8ppYbWa9MwyVdc2Bh31n (lista del módulo: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL)
// El loop de cuatro acordes: I–V–vi–IV y sus ROTACIONES (el mismo loop empezando en otro acorde), I–IV–V (con el V que
// vuelve al IV: D → S, lo que prometía la 5.1) y, en menor, i–VI–III–VII e i–iv–v (sin sensible: loops que giran sin
// cerrarse, lo que prometía la 5.2 del trap y el reguetón). Sin piezas nuevas: P8 con `romano` (también en menor),
// Emparejar, Escucha y elige y el roll con filas propias para escribir el bajo (Producción).
// Canciones reales SOLO como referencia, con título y artista (aprobado): suena la progresión con el piano de la app.
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { acordeDeGrado, cifrado } from '../../theory/acordes.js'

/**
 * Voces en Do mayor (y en La menor, que usa los mismos acordes): el bajo abajo y arriba tres notas que se mueven poco.
 * I–V–vi–IV arriba: Do·Mi·Sol → Si·Re·Sol → Do·Mi·La → Do·Fa·La (como en la A1.5). `E` = el V mayor de La menor.
 */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  iii: ['E3', 'B3', 'E4', 'G4'],
  IV: ['F2', 'C4', 'F4', 'A4'],
  V: ['G2', 'B3', 'D4', 'G4'],
  vi: ['A2', 'C4', 'E4', 'A4'],
  E: ['E3', 'B3', 'E4', 'G#4'],
}
/** Los grados de la menor natural, con las voces de su relativa mayor (i = vi, III = I…); V = el V mayor (armónica). */
const MENOR = { i: 'vi', III: 'I', iv: 'ii', v: 'iii', VI: 'IV', VII: 'V', V: 'E' }

/** Cada tonalidad de la lección: su tónica (para el cifrado), si es menor y cuánto se mueven las voces de Do / La. */
const TONOS = {
  C: { tonica: 'C4', menor: false, mover: null },
  G: { tonica: 'G3', menor: false, mover: '-4P' },
  D: { tonica: 'D4', menor: false, mover: '2M' },
  A: { tonica: 'A3', menor: false, mover: '-3m' },
  Am: { tonica: 'A3', menor: true, mover: null },
  Em: { tonica: 'E4', menor: true, mover: '-4P' },
  Bm: { tonica: 'B3', menor: true, mover: '2M' },
}

/** Las voces de un grado en una tonalidad: voz('vi', 'G') → Em con el bajo en Mi. */
function voz(rn, tono = 'C') {
  const t = TONOS[tono]
  const notas = VOZ_DO[t.menor ? MENOR[rn] : rn]
  return t.mover ? notas.map((n) => Note.transpose(n, t.mover)) : notas
}

/** El cifrado de un grado: cifra('vi', 'G') → 'Em'; en menor, 'V' = el V mayor (E en La menor). */
function cifra(rn, tono = 'C') {
  const t = TONOS[tono]
  if (t.menor && rn === 'V') return cifrado(acordeDeGrado(t.tonica, 'v', { menor: true }).raiz, 'mayor')
  return acordeDeGrado(t.tonica, rn, { menor: t.menor }).cifrado
}
/** 'C – G – Am – F'. */
const cifras = (romanos, tono = 'C') => romanos.map((rn) => cifra(rn, tono)).join(' – ')
/** 'I–V–vi–IV'. */
const nums = (romanos) => romanos.join('–')

/** Una frase o un loop de acordes (`vueltas` = cuántas veces se repite). */
const loop = (romanos, tono = 'C', etiqueta = 'Escuchar', vueltas = 1) => ({
  etiqueta,
  notas: Array.from({ length: vueltas }, () => romanos.map((rn) => voz(rn, tono))).flat(),
  intervalo: 0.85,
  duracion: 0.8,
})

const POP = ['I', 'V', 'vi', 'IV']
/** Las cuatro rotaciones de I–V–vi–IV: empieza en el I, el V, el vi y el IV. */
const ROTACIONES = [0, 1, 2, 3].map((k) => [...POP.slice(k), ...POP.slice(0, k)])

/** «Do», «Re»… (el tono de una canción, a la derecha de su ficha). */
const TONO_ES = { C: 'Do', G: 'Sol', D: 'Re', A: 'La' }
/** Una canción de referencia: título, artista con su progresión y su tono (suena con el piano de la app). */
const cancion = (titulo, artista, romanos, tono) => ({
  nombre: titulo,
  texto: `${artista} · ${cifras(romanos, tono)}`,
  dato: TONO_ES[tono],
  sonido: loop(romanos, tono, titulo, 2),
})

/** Ronda de «Empareja la rotación». */
const pareja = (romanos, tono, nombre, detalle) => ({ sonido: loop(romanos, tono), nombre, detalle })

/** Ronda de «¿Qué loop suena?»: las cuatro opciones con su nombre. */
const LOOPS = ['I–V–vi–IV', 'vi–IV–I–V', 'I–IV–V–IV', 'i–iv–v']
const queLoop = (romanos, tono, correcta, explicacion) => ({
  pregunta: '¿Qué loop suena?',
  sonidos: [loop(romanos, tono)],
  opciones: LOOPS,
  correcta,
  explicacion,
})

const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** Am – F – C – G con voces cercanas (una casilla cada uno) y, abajo, el bajo en la fundamental. */
const ARRIBA = [['A3', 'C4', 'E4'], ['A3', 'C4', 'F4'], ['G3', 'C4', 'E4'], ['G3', 'B3', 'D4']]
const BAJO = ['A2', 'F2', 'C3', 'G2']
const ROLL_ACORDES = ARRIBA.flatMap((a, i) => a.map((n) => nota(n, i)))
const ROLL_META = [...ROLL_ACORDES, ...BAJO.map((n, i) => nota(n, i))]

export default {
  id: '5.4',
  modulo: 5,
  titulo: 'Las progresiones pop',
  subtitulo: 'Cuatro acordes en bucle',
  minutos: 15,
  resumen: [
    'Un **loop** de cuatro acordes repetido es la base de mucha música pop: **I–V–vi–IV** es el más usado.',
    'Una **rotación** es el mismo loop empezando en otro acorde: cambia cuál se siente como casa (vi–IV–I–V suena a menor).',
    '**I–IV–V** usa solo los tres jefes; en **I–IV–V–IV** el V vuelve al IV y no cierra.',
    'En menor, **i–VI–III–VII** e **i–iv–v** no tienen sensible: giran sin terminar, como en el trap y el reguetón.',
  ],
  pasos: [
    // 0 · O5 — Gancho: los mismos acordes, otro comienzo
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos loops de cuatro acordes.',
      rondas: [
        {
          pregunta: '¿Cuál suena más **triste**?',
          sonidos: [loop(ROTACIONES[2]), loop(POP)],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(ROTACIONES[2])}** y **${cifras(POP)}** son **los mismos cuatro acordes**. Solo cambió dónde empieza el loop: si empieza en Am, suena a menor.`,
        },
      ],
    },

    // 1 · L2 — Cuatro acordes en bucle (fichas con canciones de referencia)
    {
      tipo: 'texto',
      titulo: 'Cuatro acordes en bucle',
      parrafos: [
        'Muchísimas canciones repiten **cuatro acordes** de principio a fin: un **loop**. El más famoso es **I–V–vi–IV**: casa, tensión, pariente de casa, salir… y vuelta a empezar.',
        `En Do es **${cifras(POP)}**. Estas canciones lo usan (toca cada una: suena su progresión).`,
      ],
      fichas: {
        nombre: 'Canción',
        dato: 'Tono',
        filas: [
          cancion('Let It Be', 'The Beatles', POP, 'C'),
          cancion('No Woman, No Cry', 'Bob Marley', POP, 'C'),
          cancion('With or Without You', 'U2', POP, 'D'),
          cancion('Someone Like You', 'Adele', POP, 'A'),
        ],
      },
      nota: 'En el beat, el loop se queda igual y lo que cambia es todo lo demás: la batería, la melodía, la letra. Por eso funciona tan bien.',
    },

    // 2 · P8 — Construye el loop en Re (romano, sin nota dada)
    {
      tipo: 'tocar',
      titulo: 'Construye el loop en Re',
      pista: 'Cuenta los grados desde **Re** por la escala de Re mayor (Fa♯ y Do♯) y apila nota sí, nota no.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { romano: 'I', tonalidad: 'D4', mensaje: '**D**: Re · Fa♯ · La. La casa.' },
          { romano: 'V', tonalidad: 'D4', mensaje: '**A**: La · Do♯ · Mi. La tensión.' },
          { romano: 'vi', tonalidad: 'D4', mensaje: '**Bm**: Si · Re · Fa♯. El pariente menor de la casa.' },
          { romano: 'IV', tonalidad: 'D4', mensaje: `**G**: Sol · Si · Re. Ya tienes **${cifras(POP, 'D')}**: el loop de *With or Without You*.` },
        ],
      },
      piano: { startOctave: 4, octaves: 2 },
    },

    // 3 · L2 — Gira el loop (rotaciones)
    {
      tipo: 'texto',
      titulo: 'Gira el loop',
      parrafos: [
        'Una **rotación** es el mismo loop empezando en otro acorde. Como se repite, el acorde con el que arranca se siente como **casa**.',
        `Si empieza en el **vi** (**${cifras(ROTACIONES[2])}**), suena a menor: es el loop de *Zombie* (The Cranberries, ${cifras(ROTACIONES[2], 'G')}) y de *Despacito* (Luis Fonsi, ${cifras(ROTACIONES[2], 'D')}).`,
      ],
      sonidos: ROTACIONES.map((r) => loop(r, 'C', `${nums(r)} · ${cifras(r)}`)),
    },

    // 4 · O6 — Empareja la rotación
    {
      tipo: 'emparejar',
      titulo: 'Empareja la rotación',
      intro: 'Escucha cada loop y toca cómo empieza.',
      rondas: [
        {
          pregunta: 'En Do: ¿con qué acorde empieza?',
          parejas: ROTACIONES.map((r) => pareja(r, 'C', `Empieza en ${cifra(r[0])}`, `${cifras(r)} · ${nums(r)}`)),
          explicacion: 'Los cuatro son **C, G, Am y F**. El que empieza en **Am** suena a menor; el que empieza en **F**, abierto, en el aire.',
        },
        {
          pregunta: 'En Sol, con números',
          parejas: ROTACIONES.map((r) => pareja(r, 'G', nums(r), cifras(r, 'G'))),
          explicacion: `En Sol, el loop es **${cifras(POP, 'G')}**. Cada rotación arranca en un acorde distinto: G (I), D (V), Em (vi) o C (IV).`,
        },
      ],
    },

    // 5 · L2 — Tres acordes: I–IV–V
    {
      tipo: 'texto',
      titulo: 'Tres acordes: I–IV–V',
      parrafos: [
        'Con los tres jefes de la A2.1 (**T, S y D**) y nada más se tocan miles de canciones de rock, folk, cumbia y blues: **I–IV–V**.',
        'En el loop **I–IV–V–IV**, el V no va a casa: **vuelve al IV** (D → S). Suena relajado, sin final, y el loop sigue girando.',
        'Así suenan *La Bamba* (Ritchie Valens, C – F – G) y *Twist and Shout* (The Beatles, D – G – A).',
      ],
      sonidos: [
        loop(['I', 'IV', 'V', 'I'], 'C', `${cifras(['I', 'IV', 'V', 'I'])} · cierra`),
        loop(['I', 'IV', 'V', 'IV'], 'C', `${cifras(['I', 'IV', 'V', 'IV'])} · loop`, 2),
        loop(['I', 'IV', 'V', 'IV'], 'D', `${cifras(['I', 'IV', 'V', 'IV'], 'D')} · en Re`, 2),
      ],
    },

    // 6 · L2 — En menor: i–VI–III–VII
    {
      tipo: 'texto',
      titulo: 'En menor: i–VI–III–VII',
      parrafos: [
        `**${cifras(['i', 'VI', 'III', 'VII'], 'Am')}** son los acordes de vi–IV–I–V en Do, pero con la casa en **La**: la relativa menor (M2.4). Se numeran desde La: **i–VI–III–VII**.`,
        'En lugar del V va el **VII**: G, sin la sensible (Sol, no Sol♯). No jala hacia casa: el loop gira sin cerrarse y suena épico, nostálgico.',
      ],
      sonidos: [
        loop(['i', 'VI', 'III', 'VII'], 'Am', `${cifras(['i', 'VI', 'III', 'VII'], 'Am')} · loop`, 2),
        loop(['VII', 'i'], 'Am', 'G → Am · sin sensible'),
        loop(['V', 'i'], 'Am', 'E → Am · con Sol♯'),
      ],
    },

    // 7 · P8 — Construye el loop en Mi menor (romano en menor)
    {
      tipo: 'tocar',
      titulo: 'Construye el loop en Mi menor',
      pista: 'Mi menor tiene un solo sostenido, **Fa♯**. Cuenta los grados desde **Mi** y apila nota sí, nota no.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { romano: 'i', tonalidad: 'E4', menor: true, mensaje: '**Em**: Mi · Sol · Si. La casa, en menor.' },
          { romano: 'VI', tonalidad: 'E4', menor: true, mensaje: '**C**: Do · Mi · Sol. Comparte Mi y Sol con la casa.' },
          { romano: 'III', tonalidad: 'E4', menor: true, mensaje: '**G**: Sol · Si · Re. La relativa mayor de Mi menor.' },
          { romano: 'VII', tonalidad: 'E4', menor: true, mensaje: `**D**: Re · Fa♯ · La, sin Re♯. Ya tienes **${cifras(['i', 'VI', 'III', 'VII'], 'Em')}**: el loop de *Zombie*.` },
        ],
      },
      piano: { startOctave: 4, octaves: 2 },
    },

    // 8 · L2 — i–iv–v: el loop que no termina
    {
      tipo: 'texto',
      titulo: 'i–iv–v: el loop que no termina',
      parrafos: [
        `**${cifras(['i', 'iv', 'v'], 'Am')}**: los tres acordes menores de La menor. El **v menor** tiene Sol, no Sol♯: no hay sensible y no pide volver.`,
        'Por eso tantos loops de **trap** y **reguetón** suenan circulares y oscuros: nunca llegan a un punto final, y encima se puede rapear sin parar.',
        'Si el v se vuelve **V mayor** (E, con Sol♯, de la menor armónica de la M2.7), la frase sí pide volver a casa.',
      ],
      sonidos: [
        loop(['i', 'iv', 'v'], 'Am', `${cifras(['i', 'iv', 'v'], 'Am')} · loop`, 2),
        loop(['i', 'iv', 'v', 'i'], 'Am', `${cifras(['i', 'iv', 'v', 'i'], 'Am')} · con v menor`),
        loop(['i', 'iv', 'V', 'i'], 'Am', `${cifras(['i', 'iv', 'V', 'i'], 'Am')} · con V mayor`),
      ],
    },

    // 9 · O1 — ¿Cuál pide volver?
    {
      tipo: 'elegir',
      titulo: '¿Cuál pide volver?',
      rondas: [
        {
          pregunta: '¿En cuál el penúltimo acorde **pide volver** a casa?',
          sonidos: [loop(['i', 'iv', 'V', 'i'], 'Am'), loop(['i', 'iv', 'v', 'i'], 'Am')],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['i', 'iv', 'V', 'i'], 'Am')}**: E lleva Sol♯, la sensible, que sube a La. Con Em no hay sensible y la llegada es más suave.`,
        },
        {
          pregunta: 'En Mi menor: ¿cuál **pide volver**?',
          sonidos: [loop(['i', 'iv', 'V', 'i'], 'Em'), loop(['i', 'iv', 'v', 'i'], 'Em')],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['i', 'iv', 'V', 'i'], 'Em')}**: B lleva Re♯, la sensible de Mi. Bm tiene Re: no jala.`,
        },
        {
          pregunta: 'Solo el final: ¿cuál **cierra** más?',
          sonidos: [loop(['V', 'i'], 'Am'), loop(['VII', 'i'], 'Am')],
          correcta: 0,
          mezclar: true,
          explicacion: '**E → Am**: Sol♯ sube a La, un punto final. **G → Am** llega sin tensión: el VII de los loops que no terminan.',
        },
      ],
    },

    // 10 · O2 — ¿Qué loop suena?
    {
      tipo: 'elegir',
      titulo: '¿Qué loop suena?',
      intro: 'Fíjate en el primer acorde (¿mayor o menor?) y en cuántos acordes tiene.',
      rondas: [
        queLoop(POP, 'C', 0, `**${cifras(POP)}**: empieza en casa, mayor, y pasa por el vi. I–V–vi–IV.`),
        queLoop(ROTACIONES[2], 'G', 1, `En Sol: **${cifras(ROTACIONES[2], 'G')}**. Empieza en el vi, menor: vi–IV–I–V.`),
        queLoop(['I', 'IV', 'V', 'IV'], 'C', 2, `**${cifras(['I', 'IV', 'V', 'IV'])}**: solo los tres jefes, y el V vuelve al IV.`),
        queLoop(['i', 'iv', 'v'], 'Am', 3, `**${cifras(['i', 'iv', 'v'], 'Am')}**: tres acordes, todos menores. i–iv–v.`),
      ],
    },

    // 11 · R2 — Escribe el bajo del loop (Producción)
    {
      tipo: 'pianoroll',
      titulo: 'Escribe el bajo del loop',
      roll: {
        filas: ['F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'C3', 'A2', 'G2', 'F2'],
        columnas: 4,
        porTiempo: 1,
        bpm: 70,
        notas: ROLL_ACORDES,
      },
      objetivo: {
        tipo: 'copiar',
        notas: ROLL_META,
        instruccion: `Arriba está **${cifras(['i', 'VI', 'III', 'VII'], 'Am')}**. Dibuja abajo la **fundamental** de cada acorde.`,
        pista: 'El bajo toca la **letra del acorde**: Am → La, F → Fa…',
        explicacion: 'Pulsa **Reproducir**: **La · Fa · Do · Sol** abajo y los acordes casi quietos arriba. Así se arma el loop de un beat.',
      },
    },

    // 12 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué es una **rotación** de un loop?',
          opciones: ['Los mismos acordes, empezando en otro', 'El mismo loop en otra tonalidad', 'Los acordes en inversión', 'El loop al revés'],
          correcta: 0,
          explicacion: 'Rotar = empezar en otro acorde del loop: **C – G – Am – F** rotado desde Am es **Am – F – C – G**.',
        },
        {
          pregunta: 'Con la casa en **La**, Am – F – C – G es…',
          opciones: ['i–VI–III–VII', 'i–iv–v', 'I–V–vi–IV', 'i–VII–VI–V'],
          correcta: 0,
          explicacion: 'Desde La: Am = **i**, F = **VI**, C = **III**, G = **VII**. Con la casa en Do sería vi–IV–I–V.',
        },
        {
          pregunta: '¿Por qué **i–iv–v** suena circular?',
          opciones: ['El v menor no tiene sensible', 'Tiene solo tres acordes', 'Va más lento', 'Todos son mayores'],
          correcta: 0,
          explicacion: 'Em tiene **Sol**, no Sol♯: nada jala hacia La. El loop puede girar para siempre.',
        },
        {
          pregunta: 'En **Sol mayor**, I–V–vi–IV es…',
          opciones: [cifras(POP, 'G'), cifras(['I', 'IV', 'V', 'IV'], 'G'), cifras(ROTACIONES[2], 'G'), cifras(['I', 'vi', 'IV', 'V'], 'G')],
          correcta: 0,
          explicacion: `**${cifras(POP, 'G')}**: el I es G, el V es D, el vi es Em y el IV es C.`,
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Dos loops, dos mundos.',
      lados: [
        {
          etiqueta: 'I–V–vi–IV',
          emociones: 'Luminoso, de estadio: todos cantan',
          ejemplos: 'El coro de un himno pop.',
          sonido: loop(POP, 'C', `Escuchar ${cifras(POP)}`, 2),
        },
        {
          etiqueta: 'i–iv–v',
          emociones: 'Oscuro, gira sin final',
          ejemplos: 'Un beat de trap para rapear encima.',
          sonido: loop(['i', 'iv', 'v'], 'Am', `Escuchar ${cifras(['i', 'iv', 'v'], 'Am')}`, 2),
        },
      ],
      nota: 'Un mismo loop cambia de carácter con lo que le pongas encima: I–V–vi–IV lento y con piano es una balada; rápido y con guitarras, un himno.',
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu loop de 4 compases',
      minutos: 20,
      objetivo: 'Armar un loop de 4 compases en menor con acordes, bajo y batería, y probar una rotación y el i–iv–v.',
      pasos: [
        'En el **Piano roll**, **Am – F – C – G**, un acorde por compás, con voces cercanas: A4-C5-E5 · A4-C5-F5 · G4-C5-E5 · G4-B4-D5 (nombres de FL).',
        'En otro canal, el **bajo** con la fundamental: **A3 · F3 · C4 · G3** (nombres de FL).',
        'En el **Channel rack**, un beat de **trap** o de **dembow** a 90–100 BPM.',
        'Clona el patrón (**Clone pattern**) y gíralo: que empiece en **F**. Clona otra vez y prueba **Am – Dm – Em – Am**.',
      ],
      consejo: 'Si el loop suena demasiado quieto, deja los acordes igual y cambia solo el ritmo del bajo: el loop es la base, el movimiento va encima.',
      reflexion: '¿Cuál de los tres loops te pide escribirle letra? ¿Por qué?',
    },
  ],
}
