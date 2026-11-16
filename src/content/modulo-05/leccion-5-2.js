// Lección 5.2 — Tensión y resolución.
// Plan aprobado: https://claude.ai/artifact/PrVeVdmDs9NCf3NwTDjBT7 (lista del módulo: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL)
// Por qué el V pide volver, en tres capas: la sensible (sube a la tónica), la 7.ª del V7 (baja) y el tritono que forman,
// que al resolver se cierra en la 3.ª del acorde de casa (Si–Fa → Do–Mi).
// Piezas nuevas: P8 con séptima (`tipo: 'dom7'`, cuatro casillas) y P9 «Resuelve la tensión» (objetivo `resolver`).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { acordeDeGrado, arpegioYAcorde, triada } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'

/** Las notas en español: 'Sol · Si · Re · Fa'. */
const notasEs = (notas) => notas.map((n) => nombre(n, { octava: false })).join(' · ')

/**
 * Voces como en la 5.1: el bajo abajo y las de arriba moviéndose poco. El V7 va sin la 5.ª (lo más común): así cada
 * voz llega al I con el paso más corto (Si → Do, Fa → Mi, Sol se queda).
 */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  IV: ['F3', 'C4', 'F4', 'A4'],
  V: ['G3', 'B3', 'D4', 'G4'],
  V7: ['G3', 'B3', 'F4', 'G4'],
}
/** Las voces de un grado en Do o en Sol (Sol = lo mismo una 4.ª más abajo). */
const voz = (rn, tono = 'C') => (tono === 'G' ? VOZ_DO[rn].map((n) => Note.transpose(n, '-4P')) : VOZ_DO[rn])
/** Una frase de acordes: frase(['I', 'V7', 'I']). */
const frase = (romanos, tono = 'C', etiqueta = 'Escuchar') => ({ etiqueta, notas: romanos.map((rn) => voz(rn, tono)), intervalo: 0.95, duracion: 0.9 })
/** Dos notas a la vez (un intervalo armónico). */
const juntas = (a, b, etiqueta) => ({ notas: [a, b], modo: 'acorde', duracion: 1.4, ...(etiqueta ? { etiqueta } : {}) })
/** Dos notas a la vez que pasan a otras dos (cómo se mueve el tritono). */
const pasa = (de, a, etiqueta) => ({ notas: [de, a], intervalo: 1.1, duracion: 1.1, ...(etiqueta ? { etiqueta } : {}) })

const G7 = triada('G3', 'dom7')
const DO_MAYOR = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']

const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** G7 sin la 5.ª (Si · Fa · Sol) en la primera casilla; la meta: C (Do · Mi · Sol) en la segunda. */
const ROLL_G7 = ['B3', 'F4', 'G4'].map((n) => nota(n, 0))
const ROLL_META = [...ROLL_G7, ...['C4', 'E4', 'G4'].map((n) => nota(n, 1))]

export default {
  id: '5.2',
  modulo: 5,
  titulo: 'Tensión y resolución',
  subtitulo: 'Por qué el V pide volver',
  minutos: 15,
  resumen: [
    'La **sensible** (el 7.º grado) está a un semitono de la tónica: quiere **subir**.',
    '**V7** = el V con una 7.ª menor encima (**G7** = Sol · Si · Re · Fa). La 7.ª, el 4.º grado, quiere **bajar**.',
    'La sensible y la 7.ª forman un **tritono** (6 semitonos), el intervalo más inestable.',
    'Al resolver, el tritono se cierra: **Si → Do** y **Fa → Mi**, el corazón del acorde de casa.',
  ],
  pasos: [
    // 0 · O5 — Gancho: C → G contra C → G7
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Los dos salen de casa hacia el V.',
      rondas: [
        {
          pregunta: '¿Cuál **pide más** volver a casa?',
          sonidos: [frase(['I', 'V']), frase(['I', 'V7'])],
          correcta: 1,
          mezclar: true,
          explicacion: 'El que termina en **G7**: tiene una nota más, **Fa**, y la tensión crece. Hoy ves por qué.',
        },
      ],
    },

    // 1 · L2 — La sensible quiere subir
    {
      tipo: 'texto',
      titulo: 'La sensible quiere subir',
      parrafos: [
        'En **G** (Sol · Si · Re), el **Si** está a un solo semitono de **Do**. Es la **sensible**, el 7.º grado (la conociste en la M2.7): tan cerca de casa que quiere llegar.',
        'Por eso el V pide volver: lleva dentro la nota que más quiere subir a la tónica.',
      ],
      sonidos: [
        { notas: DO_MAYOR, intervalo: 0.35, duracion: 0.9, etiqueta: 'La escala se queda en Si' },
        { notas: [...DO_MAYOR, 'C5'], intervalo: 0.35, duracion: 0.9, etiqueta: 'La escala llega a Do' },
        frase(['V', 'I'], 'C', 'G → C · Si sube a Do'),
      ],
    },

    // 2 · P7 — ¿Adónde va la sensible?
    {
      tipo: 'tocar',
      titulo: '¿Adónde va la sensible?',
      pista: 'La sensible sube **medio tono**: la tecla de al lado, a la derecha.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          { desde: 'F#4', intervalo: '2m', direccion: 'sube', mensaje: 'Fa♯ es la sensible de **Sol mayor**: sube a Sol, su tónica.' },
          { desde: 'C#4', intervalo: '2m', direccion: 'sube', mensaje: 'Do♯ es la sensible de **Re mayor**: sube a Re.' },
          {
            desde: 'B3',
            intervalo: '2m',
            direccion: 'sube',
            pista: 'Do está justo a la derecha de Si, en la octava siguiente.',
            mensaje: 'Si → Do: la sensible de **Do mayor** llega a casa.',
          },
        ],
      },
      piano: { startOctave: 3, octaves: 2 },
    },

    // 3 · L2 — Añade la 7.ª: G7
    {
      tipo: 'texto',
      titulo: 'Añade la 7.ª: G7',
      parrafos: [
        'Encima de G, una 3.ª menor más: **Fa**. Eso es **G7**, la **dominante con séptima** (Sol · Si · Re · Fa).',
        'Fa es el **4.º grado** de Do y está a un semitono de **Mi**: quiere **bajar**. Ahora el V tiene dos notas que tiran hacia casa.',
      ],
      sonidos: [
        { notas: arpegioYAcorde(triada('G3', 'mayor')), intervalo: 0.4, duracion: 1.2, etiqueta: 'G' },
        { notas: arpegioYAcorde(G7), intervalo: 0.4, duracion: 1.2, etiqueta: 'G7' },
        frase(['V7', 'I'], 'C', 'G7 → C'),
      ],
      nota: 'El «7» solo quiere decir esta séptima (menor) sobre un acorde mayor. En la escala mayor, solo el V la tiene. En menor, el V7 sale de la menor armónica: **E7 → Am**, con la sensible Sol♯ de la M2.7.',
    },

    // 4 · P8 con séptima — Construye el V7
    {
      tipo: 'tocar',
      titulo: 'Construye el V7',
      pista: 'Apila **terceras**: una mayor y dos menores (3M · 3m · 3m).',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'G3', tipo: 'dom7', cifrado: true, mensaje: `**G7** = ${notasEs(G7)}: la tríada de G y, encima, Fa.` },
          { raiz: 'D4', tipo: 'dom7', cifrado: true, mensaje: `**D7** = ${notasEs(triada('D4', 'dom7'))}: el V7 de **Sol mayor**.` },
          {
            romano: 'V7',
            tonalidad: 'F4',
            mensaje: `El V de Fa mayor es Do: **C7** = ${notasEs(acordeDeGrado('F4', 'V7').notas)}. La 7.ª es **Si♭**, el 4.º grado de Fa.`,
          },
        ],
      },
      piano: { startOctave: 3, octaves: 3 },
    },

    // 5 · L3 — El tritono
    {
      tipo: 'texto',
      titulo: 'El tritono',
      parrafos: [
        '**Si** y **Fa** están a **6 semitonos**: tres tonos, la mitad exacta de la octava. Es el **tritono**, el intervalo más inestable (el «4A» de la M2.2).',
        'En G7, la sensible y la 7.ª forman un tritono. Al resolver se **cierra**: Si sube a **Do** y Fa baja a **Mi**. Do–Mi es el corazón del acorde de casa.',
      ],
      roll: {
        rango: ['B3', 'F4'],
        soloBlancas: true,
        columnas: 4,
        porTiempo: 1,
        bpm: 60,
        notas: [nota('B3', 0, 2), nota('F4', 0, 2), nota('C4', 2, 2), nota('E4', 2, 2)],
      },
      sonidos: [juntas('B3', 'F4', 'El tritono: Si + Fa'), pasa(['B3', 'F4'], ['C4', 'E4'], 'Se cierra: Do + Mi')],
      nota: '**B°** (Si · Re · Fa) tiene el mismo tritono. Por eso en la A2.1 era de dominante.',
    },

    // 6 · O1 — ¿Cuál es el tritono?
    {
      tipo: 'elegir',
      titulo: '¿Cuál es el tritono?',
      intro: 'Dos notas a la vez. Una de las tres parejas no descansa.',
      rondas: [
        {
          pregunta: '¿Cuál es el **tritono**?',
          sonidos: [juntas('B3', 'F4'), juntas('C4', 'G4'), juntas('C4', 'F4')],
          correcta: 0,
          mezclar: true,
          explicacion: '**Si–Fa**: 6 semitonos, el tritono. Do–Sol (5.ª justa) y Do–Fa (4.ª justa) suenan estables.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [juntas('F3', 'B3'), juntas('E3', 'A3'), juntas('D3', 'A3')],
          correcta: 0,
          mezclar: true,
          explicacion: '**Fa–Si**: el mismo tritono al revés. Mi–La es una 4.ª justa y Re–La, una 5.ª justa.',
        },
        {
          pregunta: '¿Cuál es el **tritono**?',
          sonidos: [juntas('C4', 'F#4'), juntas('C4', 'G4'), juntas('D4', 'G4')],
          correcta: 0,
          mezclar: true,
          explicacion: '**Do–Fa♯**: 6 semitonos. Es el tritono de D7, el V7 de Sol (con Do y Fa♯).',
        },
      ],
    },

    // 7 · P9 — Resuelve la tensión
    {
      tipo: 'tocar',
      titulo: 'Resuelve la tensión',
      pista: 'Desde cada nota en oro, muévete lo mínimo: la sensible **sube** y la 7.ª **baja**.',
      objetivo: {
        tipo: 'resolver',
        rondas: [
          { raiz: 'G3' },
          { raiz: 'D4' },
          { raiz: 'C4' },
          { raiz: 'A3', menor: true, mensaje: '**Do♯ → Re** (sube medio tono) y **Sol → Fa** (baja un tono): en menor, la 7.ª baja un tono a la 3.ª menor de casa.' },
        ],
      },
      piano: { startOctave: 3, octaves: 3 },
    },

    // 8 · R2 — Escríbelo en el roll
    {
      tipo: 'pianoroll',
      titulo: 'Escríbelo en el roll',
      intro: 'Aquí está **G7** sin la 5.ª: Si · Fa · Sol.',
      roll: {
        rango: ['B3', 'G4'],
        soloBlancas: true,
        columnas: 2,
        porTiempo: 1,
        bpm: 50,
        notas: ROLL_G7,
      },
      objetivo: {
        tipo: 'copiar',
        notas: ROLL_META,
        instruccion: 'Dibuja **C** en la segunda casilla moviendo cada voz **lo mínimo**.',
        pista: 'Si sube medio tono, Fa baja medio tono y Sol ya está en C: se queda.',
        explicacion: 'Si → Do, Fa → Mi y Sol se queda: **C** = Do · Mi · Sol. Quitar la 5.ª del V7 (Re) es muy común: no aporta tensión.',
      },
    },

    // 9 · O1 — ¿Resuelve o no?
    {
      tipo: 'elegir',
      titulo: '¿Resuelve o no?',
      rondas: [
        {
          pregunta: '¿En cuál se **cierra** el tritono?',
          sonidos: [pasa(['B3', 'F4'], ['C4', 'E4']), pasa(['B3', 'F4'], ['A3', 'G4'])],
          correcta: 0,
          mezclar: true,
          explicacion: 'Si → Do y Fa → Mi: se cierra y descansa. En el otro, Si → La y Fa → Sol: se abre y la tensión sigue.',
        },
        {
          pregunta: 'En Sol: ¿en cuál se **cierra**?',
          sonidos: [pasa(['F#4', 'C5'], ['G4', 'B4']), pasa(['F#4', 'C5'], ['E4', 'D5'])],
          correcta: 0,
          mezclar: true,
          explicacion: 'Fa♯ → Sol y Do → Si: el tritono de D7 se cierra en Sol–Si, el corazón de G.',
        },
        {
          pregunta: '¿Cuál lleva la **séptima**?',
          sonidos: [frase(['I', 'V']), frase(['I', 'V7'])],
          correcta: 1,
          mezclar: true,
          explicacion: 'El de **G7**: el Fa arriba roza con el Sol y con el Si. Suena más tenso.',
        },
        {
          pregunta: 'En Sol: ¿cuál lleva la **séptima**?',
          sonidos: [frase(['I', 'V'], 'G'), frase(['I', 'V7'], 'G')],
          correcta: 1,
          mezclar: true,
          explicacion: 'El de **D7**: la 7.ª, Do, tira hacia Si.',
        },
      ],
    },

    // 10 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'En **G7**, ¿cuál es la **sensible**?',
          opciones: ['Si', 'Sol', 'Re', 'Fa'],
          correcta: 0,
          explicacion: '**Si**, la 3.ª de G7: está a un semitono de Do y sube a él.',
        },
        {
          pregunta: '¿Adónde va el **Fa** de G7 al resolver en C?',
          opciones: ['Mi', 'Sol', 'Fa♯', 'Do'],
          correcta: 0,
          explicacion: 'Fa es la **7.ª**: baja medio tono, a **Mi**, la 3.ª de C.',
        },
        {
          pregunta: '¿Cuál es el **V7** de **Sol mayor**?',
          opciones: ['D7', 'G7', 'C7', 'A7'],
          correcta: 0,
          explicacion: `Sol, La, Si, Do, **Re**: el V7 de Sol es **D7** (${notasEs(triada('D4', 'dom7'))}).`,
        },
        {
          pregunta: '¿Cuántos semitonos tiene el **tritono**?',
          opciones: ['4', '5', '6', '7'],
          correcta: 2,
          explicacion: '**6**: tres tonos, la mitad de la octava. 5 es la 4.ª justa y 7, la 5.ª justa.',
        },
      ],
    },

    // 11 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma frase, con final y sin él.',
      lados: [
        {
          etiqueta: 'G7 sin resolver',
          emociones: 'Suspenso: una pregunta en el aire',
          ejemplos: 'El acorde justo antes del coro, o una frase que se queda abierta.',
          sonido: frase(['I', 'IV', 'V7'], 'C', 'Escuchar C – F – G7'),
        },
        {
          etiqueta: 'G7 → C',
          emociones: 'Alivio: punto final',
          ejemplos: 'El final de un himno, de un bolero o de una canción clásica.',
          sonido: frase(['I', 'IV', 'V7', 'I'], 'C', 'Escuchar C – F – G7 – C'),
        },
      ],
      nota: 'Muchos loops de trap y reguetón evitan el V7 que resuelve: por eso suenan circulares, sin final. Lo verás en la A2.4.',
    },

    // 12 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: la tensión que se resuelve',
      minutos: 15,
      objetivo: 'Escribir C – F – G7 – C con voces que resuelven, compararlo con G sin séptima y oír cómo un final en G7 pide volver a empezar.',
      pasos: [
        'En el **Piano roll**, escribe **C – F – G7 – C**, un acorde por compás, con voces que se muevan poco: **C5-E5-G5**, **C5-F5-A5**, **B4-F5-G5**, **C5-E5-G5** (nombres de FL).',
        'Fíjate en la resolución: **B4 → C5** (la sensible sube) y **F5 → E5** (la 7.ª baja).',
        'En otro canal, el **bajo**: **C3**, **F3**, **G3**, **C3**.',
        'Clona el patrón (**Clone pattern**) y cambia G7 por **G** (cambia F5 por D5). Escucha los dos seguidos.',
      ],
      consejo: 'Si la resolución no se siente, revisa que la sensible esté arriba: la voz más aguda es la que más se oye.',
      reflexion: 'Haz un loop que termine en **G7** y ponlo a repetir. ¿Pide volver a empezar? ¿Y si termina en C?',
    },
  ],
}
