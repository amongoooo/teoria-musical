// Lección 5.3 — Cadencias.
// Plan aprobado: https://claude.ai/artifact/BSsYcLPWqhmxjSVvgjEprK (lista del módulo: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL)
// Cómo termina una frase, como la puntuación: auténtica V → I (punto final), plagal IV → I (amén), semicadencia … → V
// (coma) y rota V → vi (sorpresa). Reutiliza la P9 de la 5.2 (`resolver`) para la auténtica en tonalidades nuevas y el
// paso `clasificar` (O8) con cuatro cajas de cadencia (`CADENCIAS` de theory/acordes.js).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
import { Note } from 'tonal'
import { acordeDeGrado, cadenciaDe } from '../../theory/acordes.js'

/**
 * Voces como en la 5.1 y la 5.2: el bajo abajo y las de arriba moviéndose poco. El V7 va sin la 5.ª; así G7 → Am
 * mueve Si → Do, Fa → Mi y Sol → La (la única nota que cambia respecto de G7 → C).
 */
const VOZ_DO = {
  I: ['C3', 'C4', 'E4', 'G4'],
  ii: ['D3', 'D4', 'F4', 'A4'],
  IV: ['F3', 'C4', 'F4', 'A4'],
  iv: ['F3', 'C4', 'F4', 'Ab4'],
  V: ['G3', 'B3', 'D4', 'G4'],
  V7: ['G3', 'B3', 'F4', 'G4'],
  vi: ['A3', 'C4', 'E4', 'A4'],
}
/** Las voces de un grado en Do o en Sol (Sol = lo mismo una 4.ª más abajo). */
const voz = (rn, tono = 'C') => (tono === 'G' ? VOZ_DO[rn].map((n) => Note.transpose(n, '-4P')) : VOZ_DO[rn])
/** Una frase de acordes: frase(['I', 'V7', 'I']). */
const frase = (romanos, tono = 'C', etiqueta = 'Escuchar') => ({ etiqueta, notas: romanos.map((rn) => voz(rn, tono)), intervalo: 0.95, duracion: 0.9 })

const DO = (rn) => (rn === 'V7' ? 'G7' : rn === 'iv' ? 'Fm' : acordeDeGrado('C4', rn).cifrado)
const SOL = (rn) => (rn === 'V7' ? 'D7' : acordeDeGrado('G3', rn).cifrado)
/** Cifrado de una frase: 'C – F – G7 – C'. */
const cifras = (romanos, tono = 'C') => romanos.map(tono === 'G' ? SOL : DO).join(' – ')

/** Ronda de «¿Punto o coma?». */
const PUNTO_COMA = ['Punto · llega a casa', 'Coma · se queda en el V']
const puntoComa = (romanos, tono, explicacion) => ({
  pregunta: '¿Cómo termina la frase?',
  sonidos: [frase(romanos, tono)],
  opciones: PUNTO_COMA,
  ordenFijo: true,
  correcta: cadenciaDe(...romanos.slice(-2)) === 'semi' ? 1 : 0,
  explicacion,
})

/**
 * Ficha de «Ordena las cadencias»: los dos últimos acordes de una frase (G7 → C) y, debajo, sus grados (V7 – I). Suena
 * la frase entera (`frase`), así el final se oye en contexto. `nombre: false` = de oído (A, B, C…).
 */
const fichaCadencia = (frase4, tono = 'C', { nombre = true, detalle = true } = {}) => {
  const [a, b] = frase4.slice(-2)
  const de = tono === 'G' ? SOL : DO
  return {
    ...(nombre ? { nombre: `${de(a)} → ${de(b)}` } : {}),
    ...(nombre && detalle ? { detalle: `${a} – ${b}` } : {}),
    sonido: frase(frase4, tono),
    caja: cadenciaDe(a, b),
  }
}

const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })
/** G7 (sin la 5.ª) → C en el roll; la meta: G7 → Am (Sol pasa a La). */
const ROLL_G7 = ['B3', 'F4', 'G4'].map((n) => nota(n, 0))
const ROLL_INICIO = [...ROLL_G7, ...['C4', 'E4', 'G4'].map((n) => nota(n, 1))]
const ROLL_META = [...ROLL_G7, ...['C4', 'E4', 'A4'].map((n) => nota(n, 1))]

const TIPOS = ['Auténtica', 'Plagal', 'Semicadencia', 'Rota']

export default {
  id: '5.3',
  modulo: 5,
  titulo: 'Cadencias',
  subtitulo: 'Cómo termina una frase',
  minutos: 15,
  resumen: [
    'Una **cadencia** es cómo termina una frase: sus dos últimos acordes. Funciona como la puntuación.',
    '**Auténtica** (V → I): punto final, la más fuerte. Con **V7** todavía más.',
    '**Plagal** (IV → I): el «amén», llega a casa sin tensión.',
    '**Semicadencia** (… → V): una coma, la frase queda abierta. **Rota** (V → vi): el V promete casa y llega el vi.',
  ],
  pasos: [
    // 0 · O5 — Gancho: pregunta o respuesta
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Dos frases de cuatro acordes.',
      rondas: [
        {
          pregunta: '¿Cuál suena a **pregunta**?',
          sonidos: [frase(['I', 'vi', 'IV', 'V']), frase(['I', 'vi', 'V', 'I'])],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['I', 'vi', 'IV', 'V'])}** se queda en el V: pregunta. **${cifras(['I', 'vi', 'V', 'I'])}** llega a casa: respuesta. Cómo termina una frase tiene nombre: **cadencia**.`,
        },
      ],
    },

    // 1 · L2 — Punto y coma
    {
      tipo: 'texto',
      titulo: 'Punto y coma',
      parrafos: [
        'Una **cadencia** es cómo termina una frase: sus **dos últimos acordes**. Funciona como la puntuación de un texto.',
        'Si la frase llega al **I**, es un **punto**: terminó. Si se queda en el **V**, es una **coma**: la **semicadencia**. La frase queda abierta y pide otra que la conteste.',
      ],
      sonidos: [
        frase(['I', 'IV', 'V', 'I'], 'C', `${cifras(['I', 'IV', 'V', 'I'])} · punto`),
        frase(['I', 'IV', 'ii', 'V'], 'C', `${cifras(['I', 'IV', 'ii', 'V'])} · coma`),
      ],
    },

    // 2 · O2 — ¿Punto o coma?
    {
      tipo: 'elegir',
      titulo: '¿Punto o coma?',
      rondas: [
        puntoComa(['I', 'IV', 'V', 'I'], 'C', `**${cifras(['I', 'IV', 'V', 'I'])}**: termina en C, el I. Punto.`),
        puntoComa(['I', 'vi', 'ii', 'V'], 'C', `**${cifras(['I', 'vi', 'ii', 'V'])}**: se queda en G, el V. Coma: una semicadencia.`),
        puntoComa(['I', 'vi', 'IV', 'V'], 'G', `En Sol: **${cifras(['I', 'vi', 'IV', 'V'], 'G')}**. Se queda en D, el V de Sol: coma.`),
        puntoComa(['vi', 'ii', 'V', 'I'], 'G', `En Sol: **${cifras(['vi', 'ii', 'V', 'I'], 'G')}**. Llega a G, la casa: punto.`),
      ],
    },

    // 3 · L2 — Auténtica: V → I
    {
      tipo: 'texto',
      titulo: 'Auténtica: V → I',
      parrafos: [
        'El punto más fuerte es la **cadencia auténtica**: **V → I**. La sensible sube a la tónica y, con **V7**, el tritono se cierra (lo viste en la A2.2).',
        'Es el final de casi toda la música clásica, de los himnos y de muchas baladas.',
      ],
      sonidos: [
        frase(['V', 'I'], 'C', 'G → C'),
        frase(['V7', 'I'], 'C', 'G7 → C'),
        frase(['I', 'IV', 'V7', 'I'], 'C', cifras(['I', 'IV', 'V7', 'I'])),
      ],
      nota: 'Si además el I llega con el bajo y la voz de arriba en la tónica (Do), se llama **auténtica perfecta**: el final más cerrado que hay.',
    },

    // 4 · P9 — Cierra con una auténtica (resolver, en tonalidades nuevas)
    {
      tipo: 'tocar',
      titulo: 'Cierra con una auténtica',
      pista: 'La sensible **sube** medio tono y la 7.ª **baja**: muévete lo mínimo desde cada nota en oro.',
      objetivo: {
        tipo: 'resolver',
        rondas: [
          { raiz: 'A3', mensaje: '**Do♯ → Re** y **Sol → Fa♯**: **A7 → D**, la cadencia auténtica de **Re mayor**.' },
          { raiz: 'Bb3', mensaje: '**Re → Mi♭** y **La♭ → Sol**: **B♭7 → E♭**, la auténtica de **Mi♭ mayor**. Con bemoles, igual.' },
          { raiz: 'B3', menor: true, mensaje: '**Re♯ → Mi** y **La → Sol** (baja un tono): **B7 → Em**, la auténtica de **Mi menor**.' },
        ],
      },
      piano: { startOctave: 3, octaves: 3 },
    },

    // 5 · L2 — Plagal: IV → I
    {
      tipo: 'texto',
      titulo: 'Plagal: IV → I',
      parrafos: [
        'La **cadencia plagal** llega a casa desde el **IV**: **F → C**. Es el «amén» de los himnos.',
        'No hay sensible ni tritono: Do ya estaba en F y se queda. Por eso llega **sin tensión**, como un suspiro.',
      ],
      sonidos: [
        frase(['IV', 'I'], 'C', 'F → C · plagal'),
        frase(['V7', 'I'], 'C', 'G7 → C · auténtica'),
        frase(['I', 'IV', 'I'], 'C', 'C – F – C · el amén'),
        frase(['iv', 'I'], 'C', 'Fm → C · con el IV menor'),
      ],
      nota: 'En gospel, soul y pop se usa mucho con el **IV menor** (**Fm → C**): La♭ baja a Sol y suena nostálgico.',
    },

    // 6 · O1 — ¿Cuál es el amén?
    {
      tipo: 'elegir',
      titulo: '¿Auténtica o plagal?',
      rondas: [
        {
          pregunta: '¿Cuál es el **amén** (plagal)?',
          sonidos: [frase(['I', 'vi', 'IV', 'I']), frase(['I', 'vi', 'V', 'I'])],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['I', 'vi', 'IV', 'I'])}**: llega desde F, sin tensión. La otra llega desde G: auténtica.`,
        },
        {
          pregunta: 'En Sol: ¿cuál es la **plagal**?',
          sonidos: [frase(['I', 'vi', 'IV', 'I'], 'G'), frase(['I', 'vi', 'V7', 'I'], 'G')],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['I', 'vi', 'IV', 'I'], 'G')}**: C → G, el IV de Sol a casa. La otra llega desde D7.`,
        },
        {
          pregunta: 'Solo el final: ¿cuál es la **auténtica**?',
          sonidos: [frase(['V7', 'I']), frase(['IV', 'I'])],
          correcta: 0,
          mezclar: true,
          explicacion: '**G7 → C**: la sensible sube y el tritono se cierra. F → C llega más suave.',
        },
      ],
    },

    // 7 · L2 — Rota: V → vi
    {
      tipo: 'texto',
      titulo: 'Rota: V → vi',
      parrafos: [
        'En la **cadencia rota**, el V promete la casa y llega el **vi**: **G7 → Am**. Una sorpresa (también se llama «de engaño»).',
        'Funciona porque Am es de la familia de la tónica (A2.1): comparte **Do y Mi** con C. La sensible sube a Do igual que siempre; solo **Sol pasa a La**.',
      ],
      sonidos: [
        frase(['I', 'IV', 'V7', 'I'], 'C', `${cifras(['I', 'IV', 'V7', 'I'])} · auténtica`),
        frase(['I', 'IV', 'V7', 'vi'], 'C', `${cifras(['I', 'IV', 'V7', 'vi'])} · rota`),
      ],
    },

    // 8 · R2 — Rompe la cadencia
    {
      tipo: 'pianoroll',
      titulo: 'Rompe la cadencia',
      intro: 'Aquí está **G7 → C**, una auténtica.',
      roll: {
        rango: ['B3', 'A4'],
        soloBlancas: true,
        columnas: 2,
        porTiempo: 1,
        bpm: 50,
        notas: ROLL_INICIO,
      },
      objetivo: {
        tipo: 'copiar',
        notas: ROLL_META,
        instruccion: 'Conviértela en una **rota** (G7 → **Am**) cambiando **una sola nota** del segundo acorde.',
        pista: '**Am** es La · Do · Mi: ya tiene Do y Mi. ¿Qué nota de C sobra?',
        explicacion: 'Sol → La y ya es **Am**: la sensible llegó a Do y Fa a Mi, como siempre, pero la casa cambió. Eso es la sorpresa.',
      },
    },

    // 9 · O1 — ¿Final o sorpresa?
    {
      tipo: 'elegir',
      titulo: '¿Final o sorpresa?',
      rondas: [
        {
          pregunta: '¿En cuál te **engaña**?',
          sonidos: [frase(['I', 'IV', 'V7', 'vi']), frase(['I', 'IV', 'V7', 'I'])],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['I', 'IV', 'V7', 'vi'])}**: después de G7 llega Am, no C. Una cadencia rota.`,
        },
        {
          pregunta: 'En Sol: ¿en cuál te **engaña**?',
          sonidos: [frase(['I', 'ii', 'V7', 'vi'], 'G'), frase(['I', 'ii', 'V7', 'I'], 'G')],
          correcta: 0,
          mezclar: true,
          explicacion: `**${cifras(['I', 'ii', 'V7', 'vi'], 'G')}**: D7 promete G y llega Em, el vi de Sol.`,
        },
        {
          pregunta: 'Solo el final: ¿cuál **cierra**?',
          sonidos: [frase(['V7', 'I']), frase(['V7', 'vi'])],
          correcta: 0,
          mezclar: true,
          explicacion: '**G7 → C**: punto final. G7 → Am suena a «todavía no».',
        },
      ],
    },

    // 10 · O8 — Ordena las cadencias (clasificar con cuatro cajas)
    {
      tipo: 'clasificar',
      titulo: 'Ordena las cadencias',
      cajas: ['autentica', 'plagal', 'semi', 'rota'],
      ayuda: 'Toca un final y luego su caja',
      rondas: [
        {
          pregunta: 'Finales en **Do mayor**',
          fichas: [
            fichaCadencia(['I', 'IV', 'V7', 'I']),
            fichaCadencia(['I', 'vi', 'IV', 'I']),
            fichaCadencia(['I', 'IV', 'ii', 'V']),
            fichaCadencia(['I', 'IV', 'V7', 'vi']),
            fichaCadencia(['I', 'vi', 'IV', 'V']),
            fichaCadencia(['I', 'ii', 'V', 'I']),
          ],
          explicacion: '**Auténtica**: G7 → C, G → C · **Plagal**: F → C · **Semicadencia**: Dm → G, F → G · **Rota**: G7 → Am.',
        },
        {
          pregunta: 'Ahora en **Sol mayor**, sin números',
          fichas: [
            fichaCadencia(['I', 'IV', 'V7', 'I'], 'G', { detalle: false }),
            fichaCadencia(['I', 'vi', 'IV', 'I'], 'G', { detalle: false }),
            fichaCadencia(['I', 'vi', 'ii', 'V'], 'G', { detalle: false }),
            fichaCadencia(['I', 'IV', 'V7', 'vi'], 'G', { detalle: false }),
            fichaCadencia(['I', 'vi', 'IV', 'V'], 'G', { detalle: false }),
          ],
          explicacion: '**Auténtica**: D7 → G · **Plagal**: C → G · **Semicadencia**: Am → D, C → D · **Rota**: D7 → Em.',
        },
        {
          pregunta: 'De oído: escucha cómo termina cada frase',
          fichas: [
            fichaCadencia(['I', 'vi', 'V7', 'I'], 'C', { nombre: false }),
            fichaCadencia(['I', 'vi', 'IV', 'I'], 'C', { nombre: false }),
            fichaCadencia(['I', 'vi', 'ii', 'V'], 'C', { nombre: false }),
            fichaCadencia(['I', 'ii', 'V7', 'vi'], 'C', { nombre: false }),
          ],
          explicacion: 'Una de cada una: **G7 → C** (auténtica), **F → C** (plagal), **Dm → G** (semicadencia) y **G7 → Am** (rota).',
        },
      ],
    },

    // 11 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué cadencia es **G → Am** en Do mayor?',
          opciones: TIPOS,
          ordenFijo: true,
          correcta: 3,
          explicacion: 'V → vi: **rota**. El V prometía C y llegó Am.',
        },
        {
          pregunta: '¿Cuál deja la frase **abierta**, como una coma?',
          opciones: TIPOS,
          ordenFijo: true,
          correcta: 2,
          explicacion: 'La **semicadencia**: la frase se queda en el V y pide continuar.',
        },
        {
          pregunta: 'En **Sol mayor**, ¿cuál es una cadencia **auténtica**?',
          opciones: ['D7 → G', 'C → G', 'D7 → Em', 'Am → D'],
          correcta: 0,
          explicacion: '**D7 → G**: el V7 de Sol a su casa. C → G es plagal, D7 → Em rota y Am → D, semicadencia.',
        },
        {
          pregunta: '¿Qué nota distingue **G7 → Am** de **G7 → C**?',
          opciones: ['Sol → La', 'Si → Do', 'Fa → Mi', 'Ninguna'],
          correcta: 0,
          explicacion: 'Si → Do y Fa → Mi pasan en las dos. Solo cambia **Sol → La**: con eso, C se vuelve Am.',
        },
      ],
    },

    // 12 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma frase, dos finales.',
      lados: [
        {
          etiqueta: 'Auténtica',
          emociones: 'Alivio: punto final',
          ejemplos: 'El último acorde de una canción, cuando todo se resuelve.',
          sonido: frase(['I', 'IV', 'V7', 'I'], 'C', `Escuchar ${cifras(['I', 'IV', 'V7', 'I'])}`),
        },
        {
          etiqueta: 'Rota',
          emociones: '«Todavía no»: sorpresa, la historia sigue',
          ejemplos: 'Un coro que parece terminar y vuelve a empezar.',
          sonido: frase(['I', 'IV', 'V7', 'vi'], 'C', `Escuchar ${cifras(['I', 'IV', 'V7', 'vi'])}`),
        },
      ],
      nota: 'Muchas baladas usan la rota para **alargar el último coro**: suena a final, llega el vi y repiten una vez más antes del punto.',
    },

    // 13 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: pregunta y respuesta',
      minutos: 15,
      objetivo: 'Escribir dos frases de 4 compases: la primera termina en coma (semicadencia) y la segunda en punto (auténtica); luego probar la rota y la plagal.',
      pasos: [
        'En el **Piano roll**, un acorde por compás: **C – Am – F – G** (frase 1, termina en coma) y **C – Am – G7 – C** (frase 2, termina en punto).',
        'Voces que se muevan poco: G7 = **B4-F5-G5** y C = **C5-E5-G5** (nombres de FL). En otro canal, el **bajo** con la fundamental en la octava 3.',
        'Clona el patrón (**Clone pattern**) y cambia el último C por **Am** (G5 → A5, bajo A2): una **rota**.',
        'Clona otra vez y termina con **F → C** en lugar de G7 → C: una **plagal**.',
      ],
      consejo: 'Si la semicadencia no suena a pregunta, alarga el G un compás más: la coma se nota cuando el V se queda sonando.',
      reflexion: '¿Cuál de los tres finales (auténtica, rota o plagal) le queda mejor a tu canción? ¿Y si los pones en orden: rota, y luego auténtica?',
    },
  ],
}
