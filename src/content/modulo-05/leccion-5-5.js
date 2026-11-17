// Lección 5.5 — I–vi–IV–V, ii–V–I y blues.
// Plan aprobado: https://claude.ai/artifact/LqW8UUP3JcQ1h9tsFKbP2T (lista del módulo: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL)
// Tres progresiones de tres épocas: el loop de los años 50 (I–vi–IV–V, los acordes del loop pop de la 5.4 en otro
// orden), el ii–V–I del jazz (S → D → T con el bajo por quintas) con las séptimas que faltaban (m7 y maj7: P8 con
// `tipo: 'm7' | 'maj7'` y `romano: 'ii7' | 'Imaj7'`; las notas guía en el roll) y el blues de 12 compases (I7, IV7 y V7,
// todos de 7.ª de dominante) en la REJILLA de compases nueva (L10: `texto` con `rejilla`). Abre el nivel 5 de Acordes.
// Canciones reales SOLO como referencia, con título y artista (aprobado): suena la progresión con el piano de la app.
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { acordeDeGrado, arpegioYAcorde, triada } from '../../theory/acordes.js'

/**
 * Voces en Do mayor: el bajo abajo y arriba tres notas que se mueven poco (como en la 5.4).
 * Con séptima, las del ii–V–I: Dm7 (Do · Fa · La) → G7 (Si · Fa · Sol) → Cmaj7 (Si · Mi · Sol): la 7.ª de cada uno
 * baja medio tono a la 3.ª del siguiente.
 */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  IV: ['F2', 'C4', 'F4', 'A4'],
  V: ['G2', 'B3', 'D4', 'G4'],
  vi: ['A2', 'C4', 'E4', 'A4'],
  ii7: ['D3', 'C4', 'F4', 'A4'],
  V7: ['G2', 'B3', 'F4', 'G4'],
  Imaj7: ['C3', 'B3', 'E4', 'G4'],
}

/** Cada tonalidad de la lección: su tónica (para el cifrado) y cuánto se mueven las voces de Do. */
const TONOS = {
  C: { tonica: 'C4', mover: null },
  F: { tonica: 'F4', mover: '4P' },
  G: { tonica: 'G3', mover: '-4P' },
  D: { tonica: 'D4', mover: '2M' },
  A: { tonica: 'A3', mover: '-3m' },
  Ab: { tonica: 'Ab3', mover: '-3M' },
}

/** Las voces de un grado en una tonalidad: voz('vi', 'G') → Em con el bajo en Mi. */
function voz(rn, tono = 'C') {
  const { mover } = TONOS[tono]
  return mover ? VOZ_DO[rn].map((n) => Note.transpose(n, mover)) : VOZ_DO[rn]
}

/** El cifrado de un grado: cifra('vi', 'G') → 'Em'; cifra('ii7', 'F') → 'Gm7'. */
const cifra = (rn, tono = 'C') => acordeDeGrado(TONOS[tono].tonica, rn).cifrado
/** 'C – Am – F – G'. */
const cifras = (romanos, tono = 'C') => romanos.map((rn) => cifra(rn, tono)).join(' – ')

/** Una frase o un loop de acordes (`vueltas` = cuántas veces se repite). */
const loop = (romanos, tono = 'C', etiqueta = 'Escuchar', vueltas = 1) => ({
  etiqueta,
  notas: Array.from({ length: vueltas }, () => romanos.map((rn) => voz(rn, tono))).flat(),
  intervalo: 0.85,
  duracion: 0.8,
})

const CINCUENTA = ['I', 'vi', 'IV', 'V']
const POP = ['I', 'V', 'vi', 'IV']
const IIVI = ['ii', 'V', 'I']
const IIVI7 = ['ii7', 'V7', 'Imaj7']

/** «Do», «Re»… (el tono de una canción, a la derecha de su ficha). */
const TONO_ES = { C: 'Do', G: 'Sol', D: 'Re', A: 'La', F: 'Fa', Ab: 'La♭' }
/** Una canción de referencia: título, artista con su progresión y su tono (suena con el piano de la app). */
const cancion = (titulo, artista, romanos, tono, vueltas = 2) => ({
  nombre: titulo,
  texto: `${artista} · ${cifras(romanos, tono)}`,
  dato: TONO_ES[tono],
  sonido: loop(romanos, tono, titulo, vueltas),
})

// ——— El blues de 12 compases en Do: C7, F7 y G7, cada voz moviéndose un paso (Mi → Mi♭ → Re…) ———
const BLUES_VOZ = {
  I7: ['C3', 'E4', 'G4', 'Bb4'],
  IV7: ['F2', 'Eb4', 'F4', 'A4'],
  V7: ['G2', 'D4', 'F4', 'B4'],
}
const BLUES = ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7']
/** El blues hasta el compás `hasta` (incluido): un acorde por compás. */
const blues = (hasta = 12, etiqueta = 'Escuchar') => ({
  etiqueta,
  notas: BLUES.slice(0, hasta).map((g) => BLUES_VOZ[g]),
  intervalo: 0.75,
  duracion: 0.7,
})
const bluesFicha = (titulo, artista) => ({ nombre: titulo, texto: `${artista} · blues de 12 compases`, dato: 'Do', sonido: blues(12, titulo) })

/** Un acorde de séptima en arpegio y luego junto (para reconocerlo de oído). */
const septima = (raiz, tipo) => ({ etiqueta: 'Escuchar', notas: arpegioYAcorde(triada(raiz, tipo)), intervalo: 0.4, duracion: 1.2 })
const SABORES = ['Séptima mayor (maj7)', 'Menor séptima (m7)', 'Séptima de dominante (7)']

/** Ronda de «¿Qué progresión suena?»: las cuatro opciones con su nombre. */
const PROGRESIONES = ['I–vi–IV–V', 'I–V–vi–IV', 'ii–V–I', 'I–IV–V–IV']
const queProgresion = (romanos, tono, correcta, explicacion) => ({
  pregunta: '¿Qué progresión suena?',
  sonidos: [loop(romanos, tono)],
  opciones: PROGRESIONES,
  ordenFijo: true,
  correcta,
  explicacion,
})

const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** Las notas guía del ii–V–I: el bajo y la voz de abajo vienen; arriba se dibuja la otra (Do · Si · Si). */
const GUIA_BAJO = ['D3', 'G2', 'C3']
const GUIA_ABAJO = ['F3', 'F3', 'E3']
const GUIA_ARRIBA = ['C4', 'B3', 'B3']
const ROLL_DADO = [...GUIA_BAJO, ...GUIA_ABAJO].map((n, i) => nota(n, i % 3))
const ROLL_META = [...ROLL_DADO, ...GUIA_ARRIBA.map((n, i) => nota(n, i))]

export default {
  id: '5.5',
  modulo: 5,
  titulo: 'I–vi–IV–V, ii–V–I y blues',
  subtitulo: 'Tres progresiones, tres épocas',
  minutos: 18,
  resumen: [
    '**I–vi–IV–V**, el de los años 50, usa los acordes del loop pop en otro orden y termina en el **V**: pide volver.',
    '**ii–V–I** es **S → D → T**: el bajo salta por quintas y es la cadencia del jazz.',
    'Hay tres séptimas: **maj7** (suave), **m7** (relajado) y **7** (tensión). En el ii–V–I, cada 7.ª baja a la 3.ª del siguiente.',
    'El **blues de 12 compases** usa I7, IV7 y V7, todos de **7.ª de dominante**: su nota blue no está en la escala.',
  ],
  pasos: [
    // 0 · O1 — Gancho: los mismos acordes, con y sin séptima
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos versiones de la misma frase.',
      rondas: [
        {
          pregunta: '¿Cuál suena más a **jazz**?',
          sonidos: [loop(IIVI7), loop(IIVI)],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(IIVI7)}** y **${cifras(IIVI)}** son los mismos acordes. El primero lleva una nota más encima de cada uno: **la 7.ª**.`,
        },
      ],
    },

    // 1 · L2 — El de los años 50 (fichas con canciones de referencia)
    {
      tipo: 'texto',
      titulo: 'El de los años 50',
      parrafos: [
        `**I–vi–IV–V** (**${cifras(CINCUENTA)}**) es el loop del doo-wop y de las baladas. Son los acordes del I–V–vi–IV de la A2.4, en otro orden.`,
        'Termina en el **V**: una semicadencia (A2.3). Al repetir, **V → I** cierra como una auténtica, así que cada cuatro compases hay un punto final.',
        'Toca cada canción: suena su progresión.',
      ],
      fichas: {
        nombre: 'Canción',
        dato: 'Tono',
        filas: [
          cancion('Stand by Me', 'Ben E. King', CINCUENTA, 'A'),
          cancion('Every Breath You Take', 'The Police', CINCUENTA, 'A'),
          cancion('Perfect', 'Ed Sheeran', CINCUENTA, 'Ab'),
        ],
      },
    },

    // 2 · O1 — ¿El de los 50 o el pop?
    {
      tipo: 'elegir',
      titulo: '¿El de los 50 o el pop?',
      intro: 'Los dos empiezan en casa. Fíjate en el segundo acorde: ¿mayor o menor?',
      rondas: [
        {
          pregunta: '¿Cuál es **I–vi–IV–V**?',
          sonidos: [loop(CINCUENTA), loop(POP)],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(CINCUENTA)}**: el segundo es **Am**, menor. En **${cifras(POP)}** el segundo es G, mayor.`,
        },
        {
          pregunta: 'En Sol: ¿cuál es **I–vi–IV–V**?',
          sonidos: [loop(CINCUENTA, 'G'), loop(POP, 'G')],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(CINCUENTA, 'G')}**: después de casa viene **Em**, el vi. En el otro, D, el V.`,
        },
        {
          pregunta: '¿Cuál termina **pidiendo volver**?',
          sonidos: [loop(CINCUENTA), loop(['I', 'IV', 'V', 'I'])],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(CINCUENTA)}** se queda en **G**, el V: una coma que pide la vuelta. ${cifras(['I', 'IV', 'V', 'I'])} ya llegó a casa.`,
        },
      ],
    },

    // 3 · L2 — ii–V–I: S → D → T
    {
      tipo: 'texto',
      titulo: 'ii–V–I: S → D → T',
      parrafos: [
        `**${cifras(IIVI)}**: un acorde de cada función de la A2.1, en orden. **Subdominante** (salir), **dominante** (tensión) y **tónica** (casa).`,
        'El bajo salta por **quintas**: Re → Sol → Do, como al girar el círculo de la M2.5 hacia la casa. Es la cadencia del jazz.',
        'Así suena en estas canciones, ya con séptimas (en un momento las construyes):',
      ],
      sonidos: [
        loop(IIVI, 'C', `${cifras(IIVI)} · en Do`),
        loop(IIVI, 'F', `${cifras(IIVI, 'F')} · en Fa`),
        loop(IIVI, 'G', `${cifras(IIVI, 'G')} · en Sol`),
      ],
      fichas: {
        nombre: 'Canción',
        dato: 'Tono',
        filas: [cancion('Fly Me to the Moon', 'Frank Sinatra', IIVI7, 'C'), cancion('Autumn Leaves', 'Nat King Cole', IIVI7, 'G')],
      },
    },

    // 4 · L2 — Los tres sabores de la séptima
    {
      tipo: 'texto',
      titulo: 'Los tres sabores de la séptima',
      parrafos: [
        'A cada acorde del ii–V–I se le apila **una 3.ª más** (nota sí, nota no por la escala). Salen tres tipos de séptima:',
      ],
      fichas: {
        nombre: 'Acorde',
        dato: 'Grado',
        filas: [
          { nombre: 'Dm7 · menor séptima', texto: 'Re · Fa · La · Do (3m 3M 3m). Relajado, cálido.', dato: 'ii7', sonido: septima('D4', 'm7') },
          { nombre: 'G7 · séptima de dominante', texto: 'Sol · Si · Re · Fa (3M 3m 3m). Tensión que pide resolver (A2.2).', dato: 'V7', sonido: septima('G3', 'dom7') },
          { nombre: 'Cmaj7 · séptima mayor', texto: 'Do · Mi · Sol · Si (3M 3m 3M). Suave, soñador.', dato: 'Imaj7', sonido: septima('C4', 'maj7') },
        ],
      },
      nota: 'Se escriben con el nombre del acorde y su séptima: **Dm7**, **G7**, **Cmaj7**. «7» a secas es siempre la de dominante.',
    },

    // 5 · P8 — Construye las séptimas (raíz dada; m7, dom7, maj7)
    {
      tipo: 'tocar',
      titulo: 'Construye las séptimas',
      pista: 'Apila terceras: nota sí, nota no por las teclas blancas. Si te pasas una, cuenta los semitonos de la guía.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'D4', tipo: 'm7', mensaje: '**Dm7**: Re · Fa · La · Do. El ii, relajado.' },
          { raiz: 'G3', tipo: 'dom7', mensaje: '**G7**: Sol · Si · Re · Fa. El V, con tensión.' },
          { raiz: 'C4', tipo: 'maj7', mensaje: `**Cmaj7**: Do · Mi · Sol · Si. Ya tienes **${cifras(IIVI7)}**.` },
        ],
      },
      piano: { startOctave: 3, octaves: 2 },
    },

    // 6 · O2 — ¿Qué séptima suena?
    {
      tipo: 'elegir',
      titulo: '¿Qué séptima suena?',
      intro: 'Primero en arpegio, luego junto.',
      rondas: [
        {
          pregunta: '¿Qué séptima es?',
          sonidos: [septima('C4', 'maj7')],
          opciones: SABORES,
          ordenFijo: true,
          correcta: 0,
          explicacion: '**Cmaj7**: la 7.ª (Si) queda a medio tono de la octava. Brilla, suave.',
        },
        {
          pregunta: '¿Qué séptima es?',
          sonidos: [septima('A3', 'm7')],
          opciones: SABORES,
          ordenFijo: true,
          correcta: 1,
          explicacion: '**Am7**: La · Do · Mi · Sol. Menor, pero sin drama: relajado.',
        },
        {
          pregunta: '¿Qué séptima es?',
          sonidos: [septima('F3', 'dom7')],
          opciones: SABORES,
          ordenFijo: true,
          correcta: 2,
          explicacion: '**F7**: Fa · La · Do · Mi♭. Mayor con un roce que pide moverse. Ahora se abre el **nivel 5 de Acordes** en Oído.',
        },
      ],
    },

    // 7 · P8 — El ii–V–I de Fa (romano con séptima, sin nota dada)
    {
      tipo: 'tocar',
      titulo: 'El ii–V–I de Fa',
      pista: 'Fa mayor tiene un bemol, **Si♭**. Cuenta los grados desde **Fa** y apila cuatro notas, nota sí, nota no.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { romano: 'ii7', tonalidad: 'F4', mensaje: '**Gm7**: Sol · Si♭ · Re · Fa. Subdominante.' },
          { romano: 'V7', tonalidad: 'F4', mensaje: '**C7**: Do · Mi · Sol · Si♭. Dominante.' },
          { romano: 'Imaj7', tonalidad: 'F4', mensaje: `**Fmaj7**: Fa · La · Do · Mi. Ya tienes **${cifras(IIVI7, 'F')}**.` },
        ],
      },
      piano: { startOctave: 4, octaves: 2 },
    },

    // 8 · R2 — Las séptimas caen (notas guía en el roll)
    {
      tipo: 'pianoroll',
      titulo: 'Las séptimas caen',
      roll: {
        filas: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'G2'],
        columnas: 3,
        porTiempo: 1,
        bpm: 60,
        notas: ROLL_DADO,
      },
      objetivo: {
        tipo: 'copiar',
        notas: ROLL_META,
        instruccion: `Abajo, el bajo de **${cifras(IIVI7)}** y una voz. Dibuja arriba la otra: **Do**, la 7.ª de Dm7, y adónde va.`,
        pista: 'Do baja medio tono a **Si** (la 3.ª de G7), y Si se queda en Cmaj7 (ahí es la 7.ª).',
        explicacion: 'Pulsa **Reproducir**: dos voces, y en cada cambio se mueve **una sola**, medio tono abajo. La 3.ª y la 7.ª son las **notas guía**: así tocan los pianistas de jazz.',
      },
    },

    // 9 · L10 — El blues de 12 compases (rejilla que se enciende)
    {
      tipo: 'texto',
      titulo: 'El blues de 12 compases',
      parrafos: [
        'Tres filas de cuatro compases con **I7**, **IV7** y **V7**. Todos son de **7.ª de dominante**: rompen la regla de la tonalidad, y por eso suena a blues.',
        'El último compás (el V7) es el **turnaround**: la vuelta al principio.',
      ],
      rejilla: {
        etiqueta: 'Escuchar los 12 compases',
        compases: BLUES.map((g) => ({ grado: g, cifrado: cifra(g) })),
        sonido: blues(12),
      },
      fichas: {
        nombre: 'Canción',
        dato: 'Tono',
        filas: [bluesFicha('Johnny B. Goode', 'Chuck Berry'), bluesFicha('Hound Dog', 'Elvis Presley'), bluesFicha('Pride and Joy', 'Stevie Ray Vaughan')],
      },
    },

    // 10 · P8 — Los acordes del blues (dom7 con raíz dada)
    {
      tipo: 'tocar',
      titulo: 'Los acordes del blues',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'C4', tipo: 'dom7', mensaje: '**C7**: Do · Mi · Sol · **Si♭**. Si♭ no está en Do mayor: es la **nota blue**.' },
          { raiz: 'F3', tipo: 'dom7', mensaje: '**F7**: Fa · La · Do · **Mi♭**. Otra nota fuera de Do mayor.' },
          { raiz: 'G3', tipo: 'dom7', mensaje: '**G7**: Sol · Si · Re · Fa. El único de los tres que sí está en Do mayor.' },
        ],
      },
      piano: { startOctave: 3, octaves: 2 },
    },

    // 11 · O2 — ¿Adónde fue? (el blues hasta que cambia)
    {
      tipo: 'elegir',
      titulo: '¿Adónde fue?',
      intro: 'Suena el blues hasta que cambia de acorde.',
      rondas: [
        {
          pregunta: 'Compás 5: ¿a qué acorde fue?',
          sonidos: [blues(5)],
          opciones: ['C7', 'F7', 'G7'],
          ordenFijo: true,
          correcta: 1,
          explicacion: 'Cuatro compases de **C7** y luego **F7**, el IV7: la segunda fila empieza saliendo de casa.',
        },
        {
          pregunta: 'Compás 9: ¿a qué acorde fue?',
          sonidos: [blues(9)],
          opciones: ['C7', 'F7', 'G7'],
          ordenFijo: true,
          correcta: 2,
          explicacion: 'La tercera fila empieza con **G7**, el V7: la tensión más alta del blues.',
        },
        {
          pregunta: 'Compás 10: ¿a qué acorde fue?',
          sonidos: [blues(10)],
          opciones: ['C7', 'F7', 'G7'],
          ordenFijo: true,
          correcta: 1,
          explicacion: 'De **G7** baja a **F7**: el V vuelve al IV, como en el I–IV–V–IV de la A2.4. Luego C7 y el turnaround.',
        },
      ],
    },

    // 12 · O2 — ¿Qué progresión suena?
    {
      tipo: 'elegir',
      titulo: '¿Qué progresión suena?',
      intro: 'Fíjate en el primer acorde y en cuántos acordes tiene.',
      rondas: [
        queProgresion(CINCUENTA, 'C', 0, `**${cifras(CINCUENTA)}**: casa, el vi menor, el IV y termina en el V.`),
        queProgresion(POP, 'G', 1, `En Sol: **${cifras(POP, 'G')}**. Después de casa viene el V, mayor.`),
        queProgresion(IIVI7, 'F', 2, `En Fa: **${cifras(IIVI7, 'F')}**. Tres acordes, empieza fuera de casa y llega a ella.`),
        queProgresion(['I', 'IV', 'V', 'IV'], 'D', 3, `En Re: **${cifras(['I', 'IV', 'V', 'IV'], 'D')}**. Solo los tres jefes, y el V vuelve al IV.`),
      ],
    },

    // 13 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'En funciones, **ii–V–I** es…',
          opciones: ['S → D → T', 'T → S → D', 'D → S → T', 'S → T → D'],
          correcta: 0,
          explicacion: 'El ii es de **subdominante**, el V de **dominante** y el I es la **tónica**: salir, tensión, casa.',
        },
        {
          pregunta: 'El ii–V–I de **Sol mayor** es…',
          opciones: ['Am7 – D7 – Gmaj7', 'Dm7 – G7 – Cmaj7', 'Em7 – A7 – Dmaj7', 'Am7 – D7 – G7'],
          correcta: 0,
          explicacion: 'En Sol: el ii es **Am7**, el V7 es **D7** y el I con séptima mayor es **Gmaj7**.',
        },
        {
          pregunta: '¿Qué tienen en común los acordes del **blues**?',
          opciones: ['Todos son de 7.ª de dominante', 'Todos son menores', 'Todos tienen séptima mayor', 'Todos están en Do mayor'],
          correcta: 0,
          explicacion: 'C7, F7 y G7: los tres son **mayores con 7.ª menor**. Por eso C7 y F7 se salen de Do mayor.',
        },
        {
          pregunta: 'I–vi–IV–V termina en el V: ¿qué cadencia es?',
          opciones: ['Semicadencia', 'Auténtica', 'Plagal', 'Rota'],
          ordenFijo: true,
          correcta: 0,
          explicacion: 'Acabar en el V es una **semicadencia**: una coma. Al repetir, V → I sí cierra.',
        },
      ],
    },

    // 14 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Dos mundos con séptimas.',
      lados: [
        {
          etiqueta: 'ii–V–I',
          emociones: 'Elegante, nocturno',
          ejemplos: 'Un bar de jazz, un piano a media luz.',
          sonido: loop(IIVI7, 'C', `Escuchar ${cifras(IIVI7)}`, 2),
        },
        {
          etiqueta: 'Blues',
          emociones: 'Crudo, con fuerza',
          ejemplos: 'De aquí salió el rock and roll.',
          sonido: blues(12, 'Escuchar el blues'),
        },
      ],
      nota: 'El blues y el jazz se mezclan: muchos blues cambian los compases 9 y 10 por un **ii–V** (Dm7 – G7).',
    },

    // 15 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu blues de 12 compases',
      minutos: 20,
      objetivo: 'Armar un blues de 12 compases con acordes, bajo y batería con swing, y probar la versión de jazz con su ii–V.',
      pasos: [
        'En el **Piano roll**, la rejilla del blues en Do, un acorde por compás: **C7** (C5-E5-G5-A#5), **F7** (F4-A4-C5-D#5) y **G7** (G4-B4-D5-F5) (nombres de FL).',
        'En otro canal, el **bajo** con la fundamental de cada compás: **C4 · F3 · G3** (nombres de FL).',
        'En el **Channel rack**, un beat a **90 BPM** y sube el **Swing** del patrón (R1.5).',
        'Clona el patrón (**Clone pattern**) y cambia los compases 9 y 10 por **Dm7 – G7**: el blues de jazz.',
      ],
      consejo: 'Si los acordes suenan pesados, quita la fundamental de la mano derecha: el bajo ya la toca. Quedan las notas guía.',
      reflexion: '¿Cuál de las dos versiones te pide cantar encima? ¿Por qué?',
    },
  ],
}
