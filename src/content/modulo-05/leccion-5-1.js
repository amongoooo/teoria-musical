// Lección 5.1 — Funciones: tónica, subdominante, dominante.
// Plan aprobado: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL
// Los 7 acordes de una tonalidad mayor hacen uno de tres trabajos: T = casa (I, vi, iii), S = salir (IV, ii),
// D = tensión (V, vii°). Los de una familia comparten dos notas con su jefe: por eso pueden reemplazarlo.
// La frase básica de la armonía: T → S → D → T.
// Piezas nuevas: `texto` con `funciones` (L9, mapa de funciones) y el paso `clasificar` (O8).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { FUNCIONES, acordeDeGrado, arpegioYAcorde, funcionDe, notasComunes } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'

/** Las notas en español: 'Re · Fa · La'. */
const notasEs = (notas) => notas.map((n) => nombre(n, { octava: false })).join(' · ')
const pcEs = (pcs) => pcs.map((p) => nombre(`${p}4`, { octava: false })).join(' y ')

/**
 * Voces de cada grado en Do mayor, con el bajo (la fundamental) abajo y las de arriba moviéndose poco (como en la 4.5):
 * así cada acorde suena a su función y la frase se oye de una pieza.
 */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  iii: ['E3', 'B3', 'E4', 'G4'],
  IV: ['F3', 'C4', 'F4', 'A4'],
  V: ['G3', 'B3', 'D4', 'G4'],
  vi: ['A3', 'C4', 'E4', 'A4'],
  'vii°': ['B2', 'B3', 'D4', 'F4'],
}
/** Las voces de un grado en Do o en Sol (Sol = lo mismo una 4.ª más abajo). */
const voz = (rn, tono = 'C') => (tono === 'G' ? VOZ_DO[rn].map((n) => Note.transpose(n, '-4P')) : VOZ_DO[rn])
/** Una frase de acordes: frase(['I', 'IV', 'V', 'I']). */
const frase = (romanos, tono = 'C', etiqueta = 'Escuchar') => ({ etiqueta, notas: romanos.map((rn) => voz(rn, tono)), intervalo: 0.95, duracion: 0.9 })
/** El I y luego otro grado (para oír su función desde la casa). */
const desdeCasa = (rn, tono = 'C', etiqueta = 'Escuchar') => (rn === 'I' ? { etiqueta, notas: arpegioYAcorde(voz('I', tono).slice(1)), intervalo: 0.3, duracion: 1.1 } : frase(['I', rn], tono, etiqueta))

const DO = (rn) => acordeDeGrado('C4', rn)
const SOL = (rn) => acordeDeGrado('G3', rn)
/** Cifrado de una frase: 'C – F – G – C'. */
const cifras = (romanos, de = DO) => romanos.map((rn) => de(rn).cifrado).join(' – ')

const FUNCION_TEXTO = { T: 'En casa · T', S: 'Afuera · S', D: 'Tensa · D' }
const OPCIONES_FRASE = Object.values(FUNCION_TEXTO)
/** Ronda de «¿Dónde se quedó la frase?»: la función del último acorde. */
function dondeQuedo(romanos, tono, explicacion) {
  const f = funcionDe(romanos.at(-1))
  return {
    pregunta: '¿Dónde se quedó la frase?',
    sonidos: [frase(romanos, tono)],
    opciones: OPCIONES_FRASE,
    ordenFijo: true,
    correcta: Object.keys(FUNCION_TEXTO).indexOf(f),
    explicacion,
  }
}

/** Ficha de «Ordena la familia». `nombre` = false → de oído (A, B, C…). */
const fichaDe = (rn, tono, { nombre: conNombre = true, detalle = true } = {}) => {
  const a = tono === 'G' ? SOL(rn) : DO(rn)
  return {
    ...(conNombre ? { nombre: a.cifrado } : {}),
    ...(conNombre && detalle ? { detalle: rn } : {}),
    sonido: desdeCasa(rn, tono),
    caja: funcionDe(rn),
  }
}

/** Mensaje de «Encuentra las notas en común». */
const comun = (rn, jefe) => {
  const a = DO(rn)
  const j = DO(jefe)
  const f = FUNCIONES[funcionDe(rn)]
  return `**${a.cifrado}**: ${notasEs(a.notas)}. Comparte **${pcEs(notasComunes(a.notas, j.notas))}** con **${j.cifrado}**: por eso es de ${f.nombre.toLowerCase()}.`
}

const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** I–IV–V–I en el roll, un acorde por casilla, con las voces de arriba. */
const ROLL_INICIO = ['I', 'IV', 'V', 'I'].flatMap((rn, i) => voz(rn).slice(1).map((n) => nota(n, i)))
const ROLL_META = ['I', 'ii', 'V', 'I'].flatMap((rn, i) => voz(rn).slice(1).map((n) => nota(n, i)))

export default {
  id: '5.1',
  modulo: 5,
  titulo: 'Funciones: tónica, subdominante, dominante',
  subtitulo: 'Cada acorde tiene un trabajo',
  minutos: 13,
  resumen: [
    'Cada acorde tiene una **función**: **tónica** (casa, reposo), **subdominante** (salir, abrirse) o **dominante** (tensión, pide volver).',
    'En mayor: **T** = I, vi, iii · **S** = IV, ii · **D** = V, vii°.',
    'Los de una familia comparten **dos notas** con el acorde principal (I, IV o V): por eso pueden reemplazarlo.',
    'La frase básica de la armonía es **T → S → D → T**: salir de casa, tensarse y volver.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído: los mismos 4 acordes en distinto orden
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Los mismos cuatro acordes, en distinto orden.',
      rondas: [
        {
          pregunta: '¿Cuál **termina en casa**?',
          sonidos: [frase(['I', 'IV', 'V', 'I']), frase(['I', 'IV', 'I', 'V'])],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['I', 'IV', 'V', 'I'])}** termina en casa; **${cifras(['I', 'IV', 'I', 'V'])}** se queda colgado en G. No cambió ningún acorde, cambió el orden: cada acorde tiene un **trabajo**.`,
        },
      ],
    },

    // 1 · L2 — Cada acorde tiene un trabajo (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Cada acorde tiene un trabajo',
      parrafos: [
        'En una tonalidad, los acordes hacen uno de **tres trabajos**. Se llaman **funciones** y cada una tiene un acorde principal:',
        '**Tónica (T)**, el **I**: la casa, el reposo. **Subdominante (S)**, el **IV**: sale de casa, se abre. **Dominante (D)**, el **V**: tensión, pide volver.',
      ],
      fichas: {
        nombre: 'En Do mayor',
        dato: 'Función',
        filas: [
          { nombre: 'C · el I', texto: 'Casa: aquí todo descansa', dato: 'T', sonido: desdeCasa('I') },
          { nombre: 'F · el IV', texto: 'Sale de casa, sin prisa', dato: 'S', sonido: desdeCasa('IV') },
          { nombre: 'G · el V', texto: 'Tensión: pide volver a C', dato: 'D', sonido: desdeCasa('V') },
        ],
      },
    },

    // 2 · O2 — ¿Dónde se quedó la frase?
    {
      tipo: 'elegir',
      titulo: '¿Dónde se quedó la frase?',
      intro: 'Cada frase se detiene en un acorde. ¿Cómo se siente ese final?',
      rondas: [
        dondeQuedo(['vi', 'IV', 'V', 'I'], 'C', `**${cifras(['vi', 'IV', 'V', 'I'])}**: termina en **C**, la casa.`),
        dondeQuedo(['I', 'vi', 'IV', 'V'], 'C', `**${cifras(['I', 'vi', 'IV', 'V'])}**: se queda en **G**, el V. Pide volver.`),
        dondeQuedo(['I', 'V', 'vi', 'IV'], 'C', `**${cifras(['I', 'V', 'vi', 'IV'])}**: se queda en **F**, el IV. Abierto, sin prisa.`),
        dondeQuedo(['I', 'vi', 'IV', 'V'], 'G', `En Sol: **${cifras(['I', 'vi', 'IV', 'V'], SOL)}**. Se queda en **D**, el V de Sol.`),
        dondeQuedo(['I', 'V', 'vi', 'IV'], 'G', `En Sol: **${cifras(['I', 'V', 'vi', 'IV'], SOL)}**. Se queda en **C**, el IV de Sol.`),
      ],
    },

    // 3 · L9 — Las tres familias (mapa de funciones)
    {
      tipo: 'texto',
      titulo: 'Las tres familias',
      parrafos: [
        'Los otros cuatro acordes no se quedan fuera: cada uno se une a la familia con la que **comparte dos de sus tres notas**. Por eso puede hacer el mismo trabajo.',
      ],
      funciones: { tonalidad: 'C4' },
      nota: 'El **iii** es el más ambiguo: comparte dos notas con el I y dos con el V. Casi siempre hace de tónica débil.',
    },

    // 4 · P8 — Encuentra las notas en común (con `romano`)
    {
      tipo: 'tocar',
      titulo: 'Construye a los parientes',
      intro: 'Cuenta los grados desde **Do** y apila. Las tres notas.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { romano: 'vi', tonalidad: 'C4', mensaje: comun('vi', 'I') },
          { romano: 'ii', tonalidad: 'C4', mensaje: comun('ii', 'IV') },
          { romano: 'vii°', tonalidad: 'C4', mensaje: comun('vii°', 'V') },
        ],
      },
      piano: { startOctave: 4, octaves: 2 },
    },

    // 5 · O8 — Ordena la familia (clasificar)
    {
      tipo: 'clasificar',
      titulo: 'Ordena la familia',
      cajas: ['T', 'S', 'D'],
      rondas: [
        {
          pregunta: 'Los 7 acordes de **Do mayor**',
          fichas: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'].map((rn) => fichaDe(rn, 'C')),
          explicacion: '**T**: C, Am, Em · **S**: F, Dm · **D**: G, B°.',
        },
        {
          pregunta: 'Ahora en **Sol mayor**, sin números',
          fichas: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'].map((rn) => fichaDe(rn, 'G', { detalle: false })),
          explicacion: `**T**: G, Em, Bm · **S**: C, Am · **D**: D, F♯°. Mismos números que en Do, otros acordes.`,
        },
        {
          pregunta: 'De oído: primero suena **C**, la casa',
          fichas: ['IV', 'V', 'vi', 'ii'].map((rn) => fichaDe(rn, 'C', { nombre: false })),
          explicacion: 'Eran **F** (S), **G** (D), **Am** (T) y **Dm** (S). El que se queda cerca de casa es tónica; el que pide volver, dominante.',
        },
      ],
    },

    // 6 · L2 — La frase: T → S → D → T
    {
      tipo: 'texto',
      titulo: 'La frase: T → S → D → T',
      parrafos: [
        'Salir de casa, alejarse, tensarse y volver: **T → S → D → T** es la frase básica de la armonía.',
        'Como cada familia tiene varios acordes, la misma frase se puede decir de muchas maneras:',
      ],
      sonidos: [
        frase(['I', 'IV', 'V', 'I'], 'C', `${cifras(['I', 'IV', 'V', 'I'])} · I–IV–V–I`),
        frase(['I', 'ii', 'V', 'I'], 'C', `${cifras(['I', 'ii', 'V', 'I'])} · I–ii–V–I`),
        frase(['vi', 'IV', 'V', 'I'], 'C', `${cifras(['vi', 'IV', 'V', 'I'])} · vi–IV–V–I`),
      ],
      nota: 'En el pop también se usa **D → S** (V–IV): suena más relajado, menos «clásico». Lo verás en la 5.4.',
    },

    // 7 · R2 — Cambia una sola nota
    {
      tipo: 'pianoroll',
      titulo: 'Cambia una sola nota',
      intro: `Aquí está **${cifras(['I', 'IV', 'V', 'I'])}**.`,
      roll: {
        rango: ['B3', 'A4'],
        soloBlancas: true,
        columnas: 4,
        porTiempo: 1,
        bpm: 60,
        notas: ROLL_INICIO,
      },
      objetivo: {
        tipo: 'copiar',
        notas: ROLL_META,
        instruccion: `Convierte el segundo acorde (**F**) en **Dm** cambiando **una sola nota**.`,
        pista: `**Dm** es ${notasEs(DO('ii').notas)}: ya tiene Fa y La. ¿Qué nota de F sobra?`,
        explicacion: `Do → Re y ya es **Dm**: **${cifras(['I', 'ii', 'V', 'I'])}**. Fa y La se quedaron: por eso Dm puede hacer el trabajo de F.`,
      },
    },

    // 8 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'En Do mayor, ¿qué función tiene **Am**?',
          opciones: ['Tónica', 'Subdominante', 'Dominante'],
          ordenFijo: true,
          correcta: 0,
          explicacion: `Am (${notasEs(DO('vi').notas)}) comparte **Do y Mi** con C: es de la familia de la casa.`,
        },
        {
          pregunta: '¿Cuál puede reemplazar a **F** sin cambiar su trabajo?',
          opciones: ['Dm', 'G', 'Em'],
          correcta: 0,
          explicacion: '**Dm** comparte Fa y La con F: los dos son de subdominante.',
        },
        {
          pregunta: 'En **Sol mayor**, ¿cuál es de **dominante**?',
          opciones: ['D', 'C', 'Em'],
          correcta: 0,
          explicacion: `Sol, La, Si, Do, **Re**: el V de Sol es **D** (${notasEs(SOL('V').notas)}). C es el IV y Em, el vi.`,
        },
        {
          pregunta: '¿Cuál sigue **T → S → D → T**?',
          opciones: [cifras(['I', 'ii', 'V', 'I']), cifras(['I', 'V', 'ii', 'I']), cifras(['I', 'vi', 'iii', 'I'])],
          correcta: 0,
          explicacion: `**${cifras(['I', 'ii', 'V', 'I'])}**: C (T), Dm (S), G (D), C (T).`,
        },
      ],
    },

    // 9 · L5 — ¿Qué se siente? S contra D
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Los dos salen de casa, pero no igual.',
      lados: [
        {
          etiqueta: 'Subdominante',
          emociones: 'Salir, abrirse, un viaje sin prisa',
          ejemplos: 'El acorde que abre un pre-coro o que suena en el «amén» de los himnos.',
          sonido: frase(['I', 'IV'], 'C', 'Escuchar C → F'),
        },
        {
          etiqueta: 'Dominante',
          emociones: '«Ya casi»: tensión que pide volver',
          ejemplos: 'El acorde justo antes del coro o del final.',
          sonido: frase(['I', 'V'], 'C', 'Escuchar C → G'),
        },
      ],
      nota: 'Por eso la frase va **T → S → D → T**: primero te alejas tranquilo, luego se tensa, y al volver se siente el descanso.',
    },

    // 10 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: las funciones a color',
      minutos: 15,
      objetivo: 'Escribir T → S → D → T con un color por función, con su bajo, y cambiar el IV por el ii moviendo una nota.',
      pasos: [
        'En el **Piano roll**, elige un **color de nota** para cada función (el selector de color, arriba a la izquierda, antes de dibujar).',
        `Escribe **${cifras(['I', 'IV', 'V', 'I'])}**, un acorde por compás, con voces que se muevan poco: **C5-E5-G5**, **C5-F5-A5**, **B4-D5-G5**, **C5-E5-G5** (nombres de FL). T, S, D y T, cada uno con su color.`,
        'En otro canal, el **bajo**: la fundamental de cada acorde dos octavas abajo (**C3**, **F3**, **G3**, **C3**).',
        `Clona el patrón (**Clone pattern**) y cambia el F por **Dm** moviendo una sola nota (C5 → D5): **${cifras(['I', 'ii', 'V', 'I'])}**. Cambia también el bajo (F3 → D3).`,
        'Pon los dos patrones seguidos en el Playlist y escúchalos.',
      ],
      consejo: 'Si una función no se siente, revisa el bajo: es lo que más dice qué acorde suena.',
      reflexion: 'Cambia el último C por **Am**. ¿Se siente terminado? (Eso tiene nombre: lo verás en la 5.3.)',
    },
  ],
}
