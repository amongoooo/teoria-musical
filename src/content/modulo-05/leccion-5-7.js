// Lección 5.7 — Análisis de canciones.
// Plan aprobado: https://claude.ai/artifact/V9Q8tet1BajDdwTbVjQBfE (lista del módulo: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL)
// El método completo en cuatro preguntas: ¿dónde está la casa?, ¿qué acordes suenan? (el bajo primero, luego mayor o
// menor), ¿qué número y qué función? y ¿cómo termina? (la cadencia de la A2.3). Junta el módulo: funciones (A2.1),
// cadencias (A2.3), loops (A2.4, A2.5) y la rejilla de compases (A2.5, A2.6).
// Piezas nuevas: «Analiza la rejilla» (O9, paso `analizar`: la rejilla por llenar con el número de cada compás) y
// `escuchar` en el roll (`copiar`: «Escuchar el original» para el dictado del bajo).
// Canciones reales SOLO como referencia, con título y artista (aprobado): suena la progresión con el piano de la app.
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { CADENCIAS, acordeDeGrado, cadenciaDe } from '../../theory/acordes.js'

/** Voces en Do mayor (como en la 5.4–5.6): el bajo abajo y arriba tres notas que se mueven poco. */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  iii: ['E3', 'B3', 'E4', 'G4'],
  IV: ['F2', 'C4', 'F4', 'A4'],
  V: ['G2', 'B3', 'D4', 'G4'],
  vi: ['A2', 'C4', 'E4', 'A4'],
}
/** Cada tonalidad mayor: su tónica (para el cifrado) y cuánto se mueven las voces de Do. */
const TONOS = {
  C: { tonica: 'C4', mover: null },
  G: { tonica: 'G3', mover: '-4P' },
  F: { tonica: 'F4', mover: '4P' },
  D: { tonica: 'D4', mover: '2M' },
  A: { tonica: 'A3', mover: '-3m' },
  Bb: { tonica: 'Bb3', mover: '-2M' },
  E: { tonica: 'E4', mover: '3M' },
}
/** La menor con el V mayor (E, con Sol♯: la sensible), como en la 5.4. */
const VOZ_LA_MENOR = {
  i: ['A2', 'C4', 'E4', 'A4'],
  iv: ['D3', 'D4', 'F4', 'A4'],
  V: ['E2', 'B3', 'E4', 'G#4'],
  VI: ['F2', 'C4', 'F4', 'A4'],
  VII: ['G2', 'B3', 'D4', 'G4'],
}
const CIFRA_LA_MENOR = { i: 'Am', iv: 'Dm', V: 'E', VI: 'F', VII: 'G' }

const voz = (rn, tono = 'C') => {
  if (tono === 'Am') return VOZ_LA_MENOR[rn]
  const { mover } = TONOS[tono]
  return mover ? VOZ_DO[rn].map((n) => Note.transpose(n, mover)) : VOZ_DO[rn]
}
/** 'C', 'Am'… (en La menor, los de la tabla). */
const cifra = (rn, tono = 'C') => (tono === 'Am' ? CIFRA_LA_MENOR[rn] : acordeDeGrado(TONOS[tono].tonica, rn).cifrado)
/** 'C – G – Am – F'. */
const cifras = (romanos, tono = 'C') => romanos.map((rn) => cifra(rn, tono)).join(' – ')

/** Una frase o un loop de acordes (`vueltas` = cuántas veces se repite). */
const frase = (romanos, tono = 'C', etiqueta = 'Escuchar', vueltas = 1) => ({
  etiqueta,
  notas: Array.from({ length: vueltas }, () => romanos.map((rn) => voz(rn, tono))).flat(),
  intervalo: 0.9,
  duracion: 0.85,
})

/** Ronda de «Analiza la rejilla»: un compás por acorde, la casa (el primero) ya puesta. */
const analisis = (romanos, tono, { pregunta, etiqueta = 'Escuchar', explicacion, pista }) => {
  const compases = romanos.map((rn) => ({ cifrado: cifra(rn, tono), grado: rn, notas: voz(rn, tono) }))
  return {
    pregunta,
    compases,
    dados: [0],
    sonido: { etiqueta, notas: compases.map((c) => c.notas), intervalo: 0.9, duracion: 0.85 },
    explicacion,
    ...(pista ? { pista } : {}),
  }
}

/** Ronda de «Encuentra la casa»: las opciones son los acordes que suenan (sin repetir); la casa, el I. */
const casa = (romanos, tono, explicacion) => {
  const opciones = [...new Set(romanos.map((rn) => cifra(rn, tono)))]
  return {
    pregunta: '¿Dónde está la **casa**?',
    sonidos: [frase(romanos, tono)],
    opciones,
    correcta: opciones.indexOf(cifra(tono === 'Am' ? 'i' : 'I', tono)),
    explicacion,
  }
}

/**
 * Una canción con cómo termina: título, artista y los dos últimos acordes (suena la frase entera). `caja` = la cadencia,
 * si no se deduce de los dos últimos grados (en menor: VI → V es una semicadencia).
 */
const final = (titulo, artista, romanos, tono, caja) => {
  const [a, b] = romanos.slice(-2)
  const c = CADENCIAS[caja ?? cadenciaDe(a, b)]
  return {
    nombre: titulo,
    texto: `${artista} · ${cifra(a, tono)} → ${cifra(b, tono)}: **${c.nombre.toLowerCase()}**${c.id === 'semi' ? ', pide volver' : ''}`,
    dato: c.formula,
    sonido: frase(romanos, tono, titulo),
  }
}

/** Ficha de oído de «¿Qué cadencia es?»: una frase entera; su caja, la de sus dos últimos grados. */
const fichaOido = (romanos, tono) => ({ sonido: frase(romanos, tono), caja: cadenciaDe(...romanos.slice(-2)) })

const POP = ['I', 'V', 'vi', 'IV']
const LET_IT_BE = ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'I']
const HALLELUJAH = ['I', 'IV', 'V', 'vi']
const JACK = ['i', 'VII', 'VI', 'V']
const TIPOS = ['Auténtica', 'Plagal', 'Semicadencia', 'Rota']

const nota = (n, inicio, duracion) => ({ nota: n, inicio, duracion })
/** El loop del dictado: Am – F – C – G (vi–IV–I–V), dos tiempos cada uno a 90 BPM (como el roll). */
const DICTADO = ['vi', 'IV', 'I', 'V']
const BAJO_DICTADO = [nota('A2', 0, 2), nota('F2', 2, 2), nota('C3', 4, 2), nota('G2', 6, 2)]
const DOS_TIEMPOS = 60 / 90 * 2

export default {
  id: '5.7',
  modulo: 5,
  titulo: 'Análisis de canciones',
  subtitulo: 'El método en cuatro preguntas',
  minutos: 17,
  resumen: [
    'Para analizar una canción: **casa → acordes → número y función → cadencia**.',
    'La **casa** es donde descansa la frase, no siempre el primer acorde.',
    'Los acordes se sacan **por el bajo** (la fundamental) y luego se decide si son mayores o menores.',
    'Los mismos acordes con **otra casa** cambian de número y de sentimiento.',
  ],
  pasos: [
    // 0 · O5 — Gancho: la frase empieza fuera de casa
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Una frase de cuatro acordes.',
      rondas: [
        {
          pregunta: '¿Dónde **descansa** la frase?',
          sonidos: [frase(['IV', 'V', 'I', 'I'])],
          opciones: ['F', 'G', 'C'],
          correcta: 2,
          explicacion: `**${cifras(['IV', 'V', 'I', 'I'])}**: empezó en F, pero descansó en **C**. La casa no es el primer acorde: es donde la música se queda tranquila. Hoy aprendes a analizar cualquier canción.`,
        },
      ],
    },

    // 1 · L10 — El método en cuatro preguntas (Let It Be ya analizada)
    {
      tipo: 'texto',
      titulo: 'El método en cuatro preguntas',
      parrafos: [
        '**1.** ¿Dónde está la casa? **2.** ¿Qué acordes suenan? **3.** ¿Qué número y qué función tiene cada uno? **4.** ¿Cómo termina?',
        'Así queda **«Let It Be»** (The Beatles) después de las cuatro: cada compás con su número y el color de su función.',
      ],
      rejilla: {
        etiqueta: 'Escuchar «Let It Be»',
        compases: LET_IT_BE.map((rn) => ({ cifrado: cifra(rn), grado: rn })),
        sonido: frase(LET_IT_BE),
      },
    },

    // 2 · L2 — 1 · ¿Dónde está la casa?
    {
      tipo: 'texto',
      titulo: '1 · ¿Dónde está la casa?',
      parrafos: [
        'La **casa** es el acorde donde la frase descansa. Tres pistas: la frase suele **terminar** en ella, el V te **apunta** a ella y, si tarareas una nota que cierre, esa es la casa.',
        'Muchas canciones empiezan **fuera** de casa:',
      ],
      sonidos: [
        frase(['vi', 'IV', 'V', 'I'], 'C', `${cifras(['vi', 'IV', 'V', 'I'])} · empieza en Am`),
        frase(['ii', 'V', 'I'], 'C', `${cifras(['ii', 'V', 'I'])} · empieza en Dm`),
        { etiqueta: 'El loop y luego solo Do', notas: [...POP.map((rn) => voz(rn)), 'C4'], intervalo: 0.9, duracion: 0.85 },
      ],
      nota: '**«Despacito»** (Luis Fonsi) usa **Bm – G – D – A**: ¿Si menor o Re mayor? Depende de dónde descanse. La canción se queda en Bm, así que la casa es **Si menor**.',
    },

    // 3 · O2 — Encuentra la casa
    {
      tipo: 'elegir',
      titulo: 'Encuentra la casa',
      intro: 'Las opciones son los acordes que suenan.',
      rondas: [
        casa(['ii', 'V', 'I', 'I'], 'G', `**${cifras(['ii', 'V', 'I', 'I'], 'G')}**: D apunta a **G** y ahí se queda. La casa es Sol.`),
        casa(['IV', 'V', 'I', 'I'], 'F', `**${cifras(['IV', 'V', 'I', 'I'], 'F')}**: empieza en B♭ y descansa en **F**.`),
        casa(['vi', 'ii', 'V', 'I'], 'D', `**${cifras(['vi', 'ii', 'V', 'I'], 'D')}**: empieza en un menor, pero la frase llega a **D**. La casa es Re mayor.`),
        casa(['iv', 'V', 'i', 'i'], 'Am', `**${cifras(['iv', 'V', 'i', 'i'], 'Am')}**: E (con Sol♯, la sensible) pide **Am**. La casa es menor: La menor.`),
      ],
    },

    // 4 · L2 — 2 · El bajo primero
    {
      tipo: 'texto',
      titulo: '2 · El bajo primero',
      parrafos: [
        'Para sacar los acordes de oído, escucha primero **el bajo**: casi siempre toca la **fundamental**, la nota que da nombre al acorde.',
        'Con el bajo ya tienes la letra de cada acorde. Luego solo falta decidir: **¿mayor o menor?**',
      ],
      sonidos: [
        frase(DICTADO, 'C', `${cifras(DICTADO)} · completo`),
        { etiqueta: 'Solo el bajo: La · Fa · Do · Sol', notas: DICTADO.map((rn) => voz(rn)[0]), intervalo: 0.9, duracion: 0.85 },
        { etiqueta: 'Sin el bajo', notas: DICTADO.map((rn) => voz(rn).slice(1)), intervalo: 0.9, duracion: 0.85 },
      ],
    },

    // 5 · R2 — Saca el bajo (dictado con «Escuchar el original»)
    {
      tipo: 'pianoroll',
      titulo: 'Saca el bajo',
      roll: { filas: ['C3', 'A2', 'G2', 'F2'], columnas: 8, porTiempo: 1, compas: 4, bpm: 90, notas: [] },
      objetivo: {
        tipo: 'copiar',
        notas: BAJO_DICTADO,
        escuchar: { etiqueta: 'Escuchar el original', notas: DICTADO.map((rn) => voz(rn)), intervalo: DOS_TIEMPOS, duracion: DOS_TIEMPOS - 0.08 },
        instruccion: 'Escucha el original y dibuja **el bajo**: una nota por acorde, dos tiempos cada una.',
        pista: 'Empieza en **La**. El tercero es el más agudo.',
        explicacion: `**La · Fa · Do · Sol**: el bajo de **${cifras(DICTADO)}**. Con él ya tienes la letra de cada acorde.`,
      },
    },

    // 6 · O2 — ¿Mayor o menor?
    {
      tipo: 'elegir',
      titulo: '¿Mayor o menor?',
      intro: 'Ya tienes el bajo. Ahora, el color de cada acorde.',
      rondas: [
        {
          pregunta: 'El bajo hace **La · Fa · Do · Sol**. ¿Qué acordes son?',
          sonidos: [frase(DICTADO)],
          opciones: ['Am – F – C – G', 'A – F – C – G', 'Am – Fm – C – Gm', 'A – Fm – C – G'],
          correcta: 0,
          explicacion: '**Am – F – C – G**: el primero es **menor** (oscuro) y los otros tres, mayores. Son los acordes de Do mayor.',
        },
        {
          pregunta: 'El bajo hace **Mi · Do · Sol · Re**. ¿Qué acordes son?',
          sonidos: [frase(DICTADO, 'G')],
          opciones: ['Em – C – G – D', 'E – C – G – D', 'Em – Cm – G – Dm', 'Em – C – Gm – D'],
          correcta: 0,
          explicacion: '**Em – C – G – D**: el mismo dibujo una 4.ª más abajo. Son los acordes de Sol mayor.',
        },
      ],
    },

    // 7 · L9 — 3 · Cuenta desde la casa
    {
      tipo: 'texto',
      titulo: '3 · Cuenta desde la casa',
      parrafos: [
        'Con la casa y los acordes, se cuenta por la escala: la casa es el **I** y cada acorde toma el número de su fundamental. **Mayúscula** = mayor, **minúscula** = menor.',
        'El número dice la función (A2.1): **T** casa, **S** salir, **D** tensión. En Sol mayor:',
      ],
      funciones: { tonalidad: 'G3' },
    },

    // 8 · O9 — Analiza la rejilla
    {
      tipo: 'analizar',
      titulo: 'Analiza la rejilla',
      pista: 'Toca un compás para oírlo solo. Busca su bajo y cuenta desde la casa: Do = I, Re = ii, Mi = iii, Fa = IV…',
      rondas: [
        analisis(['I', 'vi', 'IV', 'V'], 'C', {
          pregunta: 'En **Do mayor**',
          explicacion: `**${cifras(['I', 'vi', 'IV', 'V'])}** = **I–vi–IV–V**, el de los años 50 (A2.5). Termina en el V: pide volver.`,
        }),
        analisis(POP, 'G', {
          pregunta: 'En **Sol mayor**',
          explicacion: `**${cifras(POP, 'G')}** = **I–V–vi–IV**, el loop pop (A2.4).`,
        }),
        analisis(LET_IT_BE, 'C', {
          pregunta: '**«Let It Be»** · The Beatles · en Do',
          etiqueta: 'Escuchar «Let It Be»',
          explicacion: 'Primero el loop pop **I–V–vi–IV**; luego **I–V–IV–I**, que cierra con **F → C**: una plagal, el «amén».',
        }),
        analisis(HALLELUJAH, 'C', {
          pregunta: '**«Hallelujah»** · Leonard Cohen · en Do',
          etiqueta: 'Escuchar «Hallelujah»',
          explicacion: 'La letra lo canta: «the fourth, the fifth, the minor fall»: **IV**, **V** y el **vi** menor. **G → Am** es una cadencia rota.',
        }),
      ],
    },

    // 9 · L2 — 4 · ¿Cómo termina?
    {
      tipo: 'texto',
      titulo: '4 · ¿Cómo termina?',
      parrafos: ['La última pregunta: los dos últimos acordes de la frase dicen **la cadencia** (A2.3). Toca cada canción: suena su final.'],
      fichas: {
        nombre: 'Canción',
        dato: 'Cadencia',
        filas: [
          final('Stand by Me', 'Ben E. King', ['I', 'vi', 'IV', 'V', 'I'], 'A'),
          final('Let It Be', 'The Beatles', ['I', 'V', 'IV', 'I'], 'C'),
          final('Hit the Road Jack', 'Ray Charles', JACK, 'Am', 'semi'),
          final('Hallelujah', 'Leonard Cohen', HALLELUJAH, 'C'),
        ],
      },
      nota: 'Las canciones suenan aquí con el piano de la app y en un tono cómodo; lo que importa es la progresión.',
    },

    // 10 · O8 — ¿Qué cadencia es? (de oído, en tonalidades nuevas)
    {
      tipo: 'clasificar',
      titulo: '¿Qué cadencia es?',
      cajas: ['autentica', 'plagal', 'semi', 'rota'],
      rondas: [
        {
          pregunta: 'De oído: escucha cómo termina cada frase',
          fichas: [
            fichaOido(['I', 'IV', 'V', 'I'], 'D'),
            fichaOido(['I', 'vi', 'IV', 'I'], 'Bb'),
            fichaOido(['I', 'vi', 'ii', 'V'], 'E'),
            fichaOido(['I', 'IV', 'V', 'vi'], 'F'),
          ],
          explicacion: `**Auténtica**: ${cifras(['V', 'I'], 'D')} · **Plagal**: ${cifras(['IV', 'I'], 'Bb')} · **Semicadencia**: ${cifras(['ii', 'V'], 'E')} · **Rota**: ${cifras(['V', 'vi'], 'F')}.`,
        },
      ],
    },

    // 11 · O2 — El método completo sobre una canción
    {
      tipo: 'elegir',
      titulo: 'El método completo',
      intro: '«Hit the Road Jack» (Ray Charles), en La menor. Las cuatro preguntas sobre el mismo sonido.',
      rondas: [
        {
          pregunta: '**1.** ¿Dónde está la **casa**?',
          sonidos: [frase(JACK, 'Am', 'Escuchar', 2)],
          opciones: ['Am', 'G', 'F', 'E'],
          correcta: 0,
          explicacion: 'Todo vuelve a **Am**: la casa es **La menor**. E no descansa, pide volver.',
        },
        {
          pregunta: '**2.** ¿Qué hace el **bajo**?',
          sonidos: [frase(JACK, 'Am', 'Escuchar', 2)],
          opciones: ['Baja: La · Sol · Fa · Mi', 'Sube: La · Si · Do · Re', 'Baja: La · Fa · Re · Mi', 'Se queda en La'],
          correcta: 0,
          explicacion: 'Baja paso a paso: **La · Sol · Fa · Mi**. Son los acordes **Am – G – F – E**.',
        },
        {
          pregunta: '**3.** ¿Qué **números** tiene?',
          sonidos: [frase(JACK, 'Am', 'Escuchar', 2)],
          opciones: ['i–VII–VI–V', 'i–iv–v–i', 'vi–V–IV–III', 'i–VI–III–VII'],
          correcta: 0,
          explicacion: 'Desde La: Am = **i**, G = **VII**, F = **VI** y E = **V**. El E es **mayor**, con Sol♯: una dominante de verdad (A2.4).',
        },
        {
          pregunta: '**4.** ¿Cómo **termina** cada vuelta?',
          sonidos: [frase(JACK, 'Am', 'Escuchar', 2)],
          opciones: TIPOS,
          ordenFijo: true,
          correcta: 2,
          explicacion: 'Se queda en **E**, el V: una **semicadencia**. Por eso el loop no para: cada vuelta pide la siguiente.',
        },
      ],
    },

    // 12 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'La **casa** de una canción es…',
          opciones: ['El acorde donde descansa la frase', 'Siempre el primer acorde', 'El acorde que más se repite', 'El acorde más grave'],
          correcta: 0,
          explicacion: 'Donde la frase **descansa**. Muchas canciones empiezan fuera de casa, como «Despacito» o un loop que empieza en el vi.',
        },
        {
          pregunta: 'Para sacar los acordes de oído, empiezas por…',
          opciones: ['El bajo', 'La melodía de la voz', 'La batería', 'El acorde más agudo'],
          correcta: 0,
          explicacion: 'El **bajo** casi siempre toca la fundamental: te da la letra de cada acorde. Luego, ¿mayor o menor?',
        },
        {
          pregunta: 'En **La mayor**, F♯m es el…',
          opciones: ['vi: tónica', 'ii: subdominante', 'iii: tónica', 'V: dominante'],
          correcta: 0,
          explicacion: 'La · Si · Do♯ · Re · Mi · **Fa♯**: el 6.º grado, menor. El **vi** es de la familia de la casa (T).',
        },
        {
          pregunta: '«Hallelujah»: **G → Am** en Do. ¿Qué cadencia es?',
          opciones: TIPOS,
          ordenFijo: true,
          correcta: 3,
          explicacion: 'El V va al **vi** en vez de al I: una **rota**. La letra la llama «the minor fall».',
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Los mismos cuatro acordes, otra casa.',
      lados: [
        {
          etiqueta: 'Casa mayor',
          emociones: 'Luz, himno',
          ejemplos: `${cifras(POP, 'G')}: sale, se aleja y vuelve a G.`,
          sonido: frase([...POP, ...POP, 'I'], 'G', `Escuchar ${cifras(POP, 'G')}`),
        },
        {
          etiqueta: 'Casa menor',
          emociones: 'Nostalgia, fuerza',
          ejemplos: '«Zombie» (The Cranberries): Em – C – G – D, con la casa en Em.',
          sonido: frase(['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V', 'vi'], 'G', `Escuchar ${cifras(['vi', 'IV', 'I', 'V'], 'G')}`),
        },
      ],
      nota: 'La casa cambia el número de cada acorde: en Sol mayor, Em es el **vi**; en Mi menor, es el **i**.',
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: analiza una canción que te guste',
      minutos: 25,
      objetivo: 'Sacar los acordes de 4 u 8 compases de una canción, ponerles número y función y nombrar cómo termina la frase.',
      pasos: [
        'Arrastra la canción al **Playlist** y busca su tempo con el **tap tempo** (clic derecho en el tempo).',
        'En el **Piano roll** de un canal nuevo, saca **el bajo** de 4 u 8 compases tocando encima del audio.',
        'Encuentra **la casa** y escribe los acordes encima del bajo (¿mayor o menor?).',
        'Ponle a cada patrón su número romano en el nombre (p. ej. «I–V–vi–IV») y anota la **cadencia** del final.',
      ],
      consejo: 'Baja el volumen de la canción a la mitad: así oyes si tu bajo y tus acordes coinciden con los suyos.',
      reflexion: '¿Qué cadencia usa el coro? ¿Cada cuánto cambia el acorde?',
    },
  ],
}
