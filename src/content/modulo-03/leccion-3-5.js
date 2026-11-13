// Lección 3.5 — Grados, tonalidad y círculo de quintas.
// Los grados con nombre (tónica, dominante, subdominante, sensible…) al oído y en el teclado; la tonalidad y su
// armadura; el círculo de quintas (un ♯ más por cada 5.ª arriba, un ♭ más por cada 5.ª abajo) con las relativas por
// dentro; y las tonalidades vecinas (una sola nota distinta).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// La teoría sale de src/theory/escalas.js (Tonal.js `Scale` y `Key`).
import {
  GRADOS,
  MAYOR,
  armaduraMayor,
  conArmadura,
  dominante,
  escalaMayor,
  grado,
  melodia,
  nombresEscala,
  relativaMenor,
  subdominante,
} from '../../theory/escalas.js'
import { nombre } from '../../theory/notas.js'

/** Nombre en español de una nota sin octava ('F#' o 'F#4' → 'Fa♯'). */
const es = (n) => nombre(/\d/.test(n) ? n : `${n}4`, { octava: false })
/** Armadura en palabras: '3♯ (Fa♯, Do♯ y Sol♯)'. */
function armadura(tonica) {
  const a = armaduraMayor(tonica)
  if (!a.cantidad) return 'sin alteraciones'
  const notas = a.notas.map(es)
  const lista = notas.length > 1 ? `${notas.slice(0, -1).join(', ')} y ${notas.at(-1)}` : notas[0]
  return `${a.cantidad}${a.signo} (${lista})`
}
/** La alteración nueva al llegar a esa tonalidad (la última de su armadura). */
const nueva = (tonica) => es(armaduraMayor(tonica).notas.at(-1))

const cantar = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, intervalo: 0.4, duracion: 0.6 })

/** Melodías por grados (0 = el 7.º por debajo de la tónica). */
const FIN_TONICA = [1, 3, 5, 3, 2, 1]
const FIN_DOMINANTE = [1, 2, 3, 1, 4, 6, 5]
const FIN_SENSIBLE = [1, 3, 5, 3, 2, 1, 0]
const OPCIONES_FIN = ['En la tónica (1.º)', 'En la dominante (5.º)', 'En la sensible (7.º)']

/** Ronda «¿en qué grado termina?». */
function fin(tonica, grados, correcta, explicacion) {
  return {
    pregunta: `¿En qué grado termina? (${es(tonica)} mayor)`,
    sonidos: [cantar(melodia(tonica, grados))],
    opciones: OPCIONES_FIN,
    correcta,
    explicacion,
  }
}

/** Fila de la tabla de grados de Do mayor: suena Do y luego ese grado. */
const QUE_HACE = [
  'la casa: todo reposa aquí',
  'justo encima de la tónica',
  'decide si suena mayor o menor',
  'una 5.ª por debajo de la tónica',
  'la más fuerte después de la tónica',
  'encima de la dominante',
  'a un semitono de casa: pide resolver',
]
const filaGrado = (n) => {
  const nota = `${grado('C', n)}4`
  return {
    nombre: GRADOS[n - 1],
    texto: `**${es(nota)}** · ${QUE_HACE[n - 1]}`,
    dato: n,
    sonido: n === 1 ? cantar(['C4', 'C5']) : { notas: ['C4', nota], intervalo: 0.55, duracion: 0.8 },
  }
}

/** Melodía que pasa por el 4.º y el 7.º (las notas que cambian al ir a una vecina). */
const VIAJE = [1, 3, 5, 7, 8, 7, 6, 4, 3, 2, 1]
const viaje = (tonica, destino, etiqueta) => {
  const notas = melodia(tonica, VIAJE)
  return cantar(destino ? conArmadura(notas, destino) : notas, etiqueta)
}

const PIANO = { startOctave: 4, octaves: 2 }

export default {
  id: '3.5',
  modulo: 3,
  titulo: 'Grados, tonalidad y círculo de quintas',
  subtitulo: 'Cada nota tiene un papel; cada tonalidad, su lugar',
  minutos: 15,
  resumen: [
    'Cada nota de la escala es un **grado** con nombre: **tónica** (1.º, la casa), **subdominante** (4.º), **dominante** (5.º, la más fuerte después de la tónica) y **sensible** (7.º, a un semitono de casa, pide resolver).',
    'Una **tonalidad** es una escala con su casa. Sus alteraciones fijas son la **armadura**: Sol mayor lleva Fa♯; Fa mayor, Si♭.',
    'En el **círculo de quintas**, cada paso en el sentido del reloj sube una **5.ª justa** y suma **un ♯** (la nueva sensible); al revés, suma **un ♭** (el nuevo 4.º grado). Abajo se encuentran: Fa♯ = Sol♭.',
    'Las **relativas menores** van por dentro, con la misma armadura. Las **vecinas** del círculo (dominante y subdominante) cambian **una sola nota**: pasar a ellas suena natural.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído: una melodía termina en casa y la otra se queda colgada
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Las dos melodías están en **Do mayor** y son casi iguales. Solo cambia la última nota.',
      rondas: [
        {
          pregunta: '¿Cuál suena **terminada**?',
          sonidos: [cantar(melodia('C4', [1, 3, 5, 4, 3, 2, 1])), cantar(melodia('C4', [1, 3, 5, 4, 3, 2, 0]))],
          correcta: 0,
          mezclar: true,
          explicacion:
            'La terminada acaba en **Do**, la tónica. La otra se queda en **Si**, a un semitono de casa: pide un paso más. Cada nota de la escala tiene un papel, y hoy les ponemos nombre.',
        },
      ],
    },

    // 1 · L2 — Los grados tienen nombre (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Los grados tienen nombre',
      parrafos: [
        'Cada nota de la escala tiene un número, su **grado**, y un nombre que dice qué papel juega.',
        'Los que más se usan: la **tónica** (1.º, la casa), la **dominante** (5.º, la que más empuja hacia casa), la **subdominante** (4.º) y la **sensible** (7.º), que está a un semitono de la tónica y pide resolver.',
      ],
      fichas: {
        nombre: 'Grado en Do mayor',
        dato: 'N.º',
        filas: [1, 2, 3, 4, 5, 6, 7].map(filaGrado),
      },
      nota: 'La tónica da nombre a todo: en **Sol mayor**, Sol es la tónica, Re la dominante y **Fa♯** la sensible.',
    },

    // 2 · O2 — ¿En qué grado termina?
    {
      tipo: 'elegir',
      titulo: '¿Dónde se queda?',
      intro: 'Cada melodía empieza en la tónica. Escucha **la última nota**: ¿reposa, pregunta o se queda colgada?',
      rondas: [
        fin('C4', FIN_SENSIBLE, 2, 'Termina en **Si**, la sensible: se queda colgada a un semitono de Do.'),
        fin('G3', FIN_TONICA, 0, 'Termina en **Sol**, la tónica: reposo total.'),
        fin('D4', FIN_DOMINANTE, 1, `Termina en **${es(dominante('D'))}**, la dominante: suena a pregunta, a «continuará».`),
        fin('F4', FIN_SENSIBLE, 2, `Termina en **${es(grado('F', 7))}**, la sensible de Fa: cae medio tono por debajo de casa y se queda ahí.`),
        fin('A3', FIN_DOMINANTE, 1, `Termina en **${es(dominante('A'))}**, la dominante de La: está a una 5.ª y no se siente final.`),
      ],
    },

    // 3 · P7 — Encuentra el grado en el teclado (con el nombre del grado)
    {
      tipo: 'tocar',
      titulo: 'Encuentra el grado',
      intro: 'La tónica está marcada. Cuenta por su escala mayor hasta el grado que se pide.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          {
            desde: 'C4',
            intervalo: '5P',
            direccion: 'sube',
            grado: 'la dominante',
            pista: 'Cuenta 5 notas de Do mayor: Do, Re, Mi, Fa, **Sol**.',
            mensaje: `La dominante de Do es **${es(dominante('C'))}**.`,
          },
          {
            desde: 'D4',
            intervalo: '4P',
            direccion: 'sube',
            grado: 'la subdominante',
            pista: `Cuenta 4 notas de Re mayor: Re, Mi, Fa♯, **${es(subdominante('D'))}**.`,
            mensaje: `La subdominante de Re es **${es(subdominante('D'))}**.`,
          },
          {
            desde: 'G4',
            intervalo: '2m',
            direccion: 'baja',
            grado: 'la sensible',
            pista: 'La sensible está **un semitono por debajo** de la tónica: la tecla de al lado, hacia la izquierda.',
            mensaje: `La sensible de Sol es **${es(grado('G', 7))}**: por eso Sol mayor lleva un sostenido.`,
          },
          {
            desde: 'E4',
            intervalo: '3M',
            direccion: 'sube',
            grado: 'la mediante',
            pista: `Cuenta 3 notas de Mi mayor: Mi, Fa♯, **${es(grado('E', 3))}**.`,
            mensaje: `La mediante de Mi es **${es(grado('E', 3))}**: una 3.ª mayor, por eso suena mayor.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 4 · L7 — Tonalidad, armadura y el círculo (lado de los sostenidos)
    {
      tipo: 'texto',
      titulo: 'El círculo de quintas',
      parrafos: [
        'Una **tonalidad** es una escala con su casa: «Sol mayor» = la escala mayor de Sol, con Sol de tónica. Sus alteraciones fijas son la **armadura**.',
        `Desde **Do** (sin alteraciones), sube una **5.ª justa**: llegas a **Sol**, con ${armadura('G')}. Otra 5.ª: **Re**, ${armadura('D')}. Cada paso en el sentido del reloj suma **un sostenido**, y el nuevo es siempre la **sensible** de la nueva tonalidad.`,
      ],
      circulo: { menores: false, inicial: 'G', resaltar: ['G', 'D', 'A', 'E', 'B', 'F#'] },
      nota: 'Orden de los sostenidos: **Fa Do Sol Re La Mi Si**. Cada uno, una 5.ª por encima del anterior.',
    },

    // 5 · P7 — Gira el círculo en el teclado: subir una 5.ª (o una 4.ª, al revés)
    {
      tipo: 'tocar',
      titulo: 'Gira el círculo',
      intro: 'Cada paso del círculo es una **5.ª justa**: 7 semitonos hacia arriba.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          {
            desde: 'C4',
            intervalo: '5P',
            direccion: 'sube',
            pista: 'Cuenta 5 notas desde Do: Do, Re, Mi, Fa, **Sol**.',
            mensaje: `Do → **Sol**: ${armadura('G')}.`,
          },
          {
            desde: 'D4',
            intervalo: '5P',
            direccion: 'sube',
            pista: 'Cuenta 5 notas de Re mayor: Re, Mi, Fa♯, Sol, **La**.',
            mensaje: `Re → **La**: ${armadura('A')}. Se suma **${nueva('A')}**.`,
          },
          {
            desde: 'E4',
            intervalo: '5P',
            direccion: 'sube',
            pista: 'Cuenta 5 notas de Mi mayor: Mi, Fa♯, Sol♯, La, **Si**.',
            mensaje: `Mi → **Si**: ${armadura('B').split(' ')[0]}. Se suma **${nueva('B')}**.`,
          },
          {
            desde: 'F4',
            intervalo: '4P',
            direccion: 'sube',
            pista: 'Cuenta 4 notas de Fa mayor: Fa, Sol, La, **Si♭**.',
            mensaje: `Una 4.ª arriba = una 5.ª abajo: es girar el círculo **al revés**. Fa (1♭) → **Si♭**, ${armadura('Bb')}.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 6 · P6 — Seguir la fórmula en las siguientes del círculo: La y Mi mayor
    {
      tipo: 'tocar',
      titulo: 'La y Mi mayor',
      intro: 'Dos pasos más en el círculo, con la fórmula mayor **T T S T T T S**. Cuenta las teclas negras.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'A4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡La mayor!',
            mensaje: `${nombresEscala('A', { octava: true })}. **${armadura('A')}**: la nueva, **${nueva('A')}**, es su sensible.`,
          },
          {
            desde: 'E4',
            pasos: MAYOR,
            grados: true,
            titulo: '¡Mi mayor!',
            mensaje: `${nombresEscala('E', { octava: true })}. **${armaduraMayor('E').cantidad}♯**: se suma **${nueva('E')}**, un semitono debajo de Mi.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 7 · L7 — El lado de los bemoles
    {
      tipo: 'texto',
      titulo: 'El lado de los bemoles',
      parrafos: [
        `Al revés del reloj, cada paso **baja una 5.ª** (o sube una 4.ª) y suma **un bemol**: **Fa** (1♭), **Si♭** (2♭), **Mi♭** (3♭)… El bemol nuevo es siempre el **4.º grado**, la subdominante, de la nueva tonalidad.`,
        'Abajo los dos lados se encuentran: **Fa♯ mayor** (6♯) suena igual que **Sol♭ mayor** (6♭). Es la misma tonalidad escrita de dos maneras: son **enarmónicas**.',
      ],
      circulo: { menores: false, inicial: 'Eb', resaltar: ['F', 'Bb', 'Eb', 'Ab', 'Db'] },
      nota: 'Orden de los bemoles: **Si Mi La Re Sol Do Fa**, el de los sostenidos al revés.',
    },

    // 8 · O7 — Encuentra en el círculo (mayores)
    {
      tipo: 'circulo',
      titulo: 'Encuentra en el círculo',
      rondas: [
        {
          pregunta: '¿Qué tonalidad mayor tiene **2 sostenidos**?',
          correcta: 'D',
          explicacion: `Do (0) → Sol (1♯) → **Re**: dos pasos a la derecha. ${armadura('D')}.`,
        },
        {
          pregunta: '¿Y cuál tiene **3 bemoles**?',
          correcta: 'Eb',
          explicacion: `Do → Fa → Si♭ → **Mi♭**: tres pasos a la izquierda. ${armadura('Eb')}.`,
        },
        {
          pregunta: '¿Cuál es la **dominante** de Re mayor?',
          correcta: 'A',
          resaltar: ['D'],
          explicacion: `La dominante está una 5.ª arriba: **un paso a la derecha**. Re → **${es(dominante('D'))}**.`,
        },
        {
          pregunta: '¿Y la **subdominante** de Mi♭ mayor?',
          correcta: 'Ab',
          resaltar: ['Eb'],
          explicacion: `La subdominante está una 5.ª abajo: **un paso a la izquierda**. Mi♭ → **${es(subdominante('Eb'))}**.`,
        },
        {
          pregunta: '¿Qué tonalidad lleva **Fa♯, Do♯, Sol♯ y Re♯**?',
          correcta: 'E',
          explicacion: `Cuatro sostenidos: **Mi mayor**. El último, **${nueva('E')}**, es su sensible.`,
        },
      ],
    },

    // 9 · L7 — Las relativas, por dentro; las vecinas
    {
      tipo: 'texto',
      titulo: 'Relativas y vecinas',
      parrafos: [
        `Por dentro va la **relativa menor** de cada mayor (su 6.º grado, lección 3.4), con **la misma armadura**: Do ↔ ${es(relativaMenor('C'))} menor, Sol ↔ ${es(relativaMenor('G'))} menor, Fa ↔ ${es(relativaMenor('F'))} menor.`,
        'Las **vecinas** de una tonalidad (a cada lado y por dentro) comparten casi todas sus notas. Por eso una canción en Do pasa con naturalidad a Sol o a Fa, y suena lejos si salta al otro lado del círculo.',
      ],
      circulo: { menores: true, inicial: 'C', resaltar: ['G', 'F', 'Am', 'Em', 'Dm'] },
    },

    // 10 · O7 — Encuentra en el círculo (menores y relativas)
    {
      tipo: 'circulo',
      titulo: 'Busca la relativa',
      intro: 'Ahora el círculo muestra las armaduras. La menor está justo debajo de su relativa mayor.',
      rondas: [
        {
          pregunta: '¿Qué tonalidad menor tiene **1 sostenido**?',
          correcta: 'Em',
          armaduras: true,
          explicacion: `1♯ es Sol mayor; por dentro, **${es(relativaMenor('G'))} menor**.`,
        },
        {
          pregunta: 'La relativa menor de **Si♭ mayor**',
          correcta: 'Gm',
          armaduras: true,
          resaltar: ['Bb'],
          explicacion: `Justo debajo de Si♭: **${es(relativaMenor('Bb'))} menor**, ${armadura('Bb')}.`,
        },
        {
          pregunta: '¿Qué tonalidad menor tiene **3 sostenidos**?',
          correcta: 'F#m',
          armaduras: true,
          explicacion: `Debajo de La mayor (3♯): **${es(relativaMenor('A'))} menor**.`,
        },
        {
          pregunta: 'La relativa **mayor** de **Do menor**',
          correcta: 'Eb',
          anillo: 'mayor',
          menores: true,
          armaduras: true,
          resaltar: ['Cm'],
          explicacion: `Por fuera de Do menor: **Mi♭ mayor**. Las dos con ${armadura('Eb')}.`,
        },
      ],
    },

    // 11 · O2 — ¿Vecina o lejana? La misma melodía con la armadura de otra tonalidad
    {
      tipo: 'elegir',
      titulo: '¿Vecina o lejana?',
      intro: 'Escucha la original y sus dos versiones. Cada una usa la armadura de otra tonalidad.',
      rondas: [
        {
          pregunta: '¿Cuál se mudó a una tonalidad **vecina**?',
          sonidos: [viaje('C4', null, 'Original'), viaje('C4', 'G', 'Versión A'), viaje('C4', 'E', 'Versión B')],
          opciones: ['La versión A', 'La versión B'],
          correcta: 0,
          explicacion: `A tiene la armadura de **Sol mayor**, la vecina: solo cambia **Fa → Fa♯**. B tiene la de **Mi mayor**, a cuatro pasos: cambian cuatro notas (${armadura('E').split('(')[1].slice(0, -1)}).`,
        },
        {
          pregunta: '¿Y aquí? ¿Cuál es la **vecina**?',
          sonidos: [viaje('C4', null, 'Original'), viaje('C4', 'Ab', 'Versión A'), viaje('C4', 'F', 'Versión B')],
          opciones: ['La versión A', 'La versión B'],
          correcta: 1,
          explicacion: '**B** tiene la armadura de **Fa mayor**, la otra vecina: solo **Si → Si♭**. A tiene la de **La♭ mayor**, con cuatro bemoles: suena mucho más lejos.',
        },
        {
          pregunta: 'Ahora desde **Sol mayor**. ¿Cuál es la **vecina**?',
          sonidos: [viaje('G3', null, 'Original'), viaje('G3', 'D', 'Versión A'), viaje('G3', 'Bb', 'Versión B')],
          opciones: ['La versión A', 'La versión B'],
          correcta: 0,
          explicacion: '**A** tiene la armadura de **Re mayor**, la dominante de Sol: solo **Do → Do♯**. B tiene la de **Si♭ mayor**, a tres pasos al otro lado: cambian tres notas.',
        },
      ],
    },

    // 12 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cuál es la **dominante** de Fa mayor?',
          opciones: ['Do', 'Si♭', 'Sol'],
          correcta: 0,
          explicacion: `**${es(dominante('F'))}**: el 5.º grado de Fa (Fa, Sol, La, Si♭, **Do**), su vecina a la derecha en el círculo.`,
        },
        {
          pregunta: '¿Cuántos sostenidos tiene **La mayor**?',
          opciones: ['2', '3', '4'],
          correcta: 1,
          explicacion: `Tres: ${armadura('A').split('(')[1].slice(0, -1)}. Do → Sol → Re → **La**: tres pasos.`,
        },
        {
          pregunta: 'En el sentido del reloj, cada paso del círculo…',
          opciones: ['Sube una 5.ª y suma un ♯', 'Sube una 4.ª y suma un ♭', 'Sube un tono'],
          correcta: 0,
          explicacion: 'Sube una **5.ª justa** y suma **un sostenido**. Al revés (una 4.ª arriba, o una 5.ª abajo), suma un bemol.',
        },
        {
          pregunta: '¿Qué grado es la **sensible**?',
          opciones: ['El 5.º', 'El 7.º', 'El 4.º'],
          correcta: 1,
          explicacion: 'El **7.º**: a un semitono de la tónica, por eso «tira» hacia casa. El 5.º es la dominante y el 4.º, la subdominante.',
        },
        {
          pregunta: '¿Qué tonalidad tiene la misma armadura que **Re mayor**?',
          opciones: ['Re menor', `${es(relativaMenor('D'))} menor`, 'La mayor'],
          correcta: 1,
          explicacion: `**${es(relativaMenor('D'))} menor**, su relativa (el 6.º grado), justo debajo en el círculo. Re menor es su **paralela**: misma casa, otra armadura.`,
        },
      ],
    },

    // 13 · L5 — ¿Qué se siente? Reposo y tensión
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma melodía en Do mayor: una termina en la tónica, la otra un paso después, en la sensible.',
      lados: [
        {
          etiqueta: 'En la tónica',
          emociones: 'Reposo, final, llegar a casa',
          ejemplos: 'El final de casi cualquier canción; la última nota de un coro.',
          sonido: cantar(melodia('C4', [5, 4, 3, 2, 3, 2, 1]), 'Termina en Do'),
        },
        {
          etiqueta: 'En la sensible',
          emociones: 'Tensión, pregunta, «continuará»',
          ejemplos: 'El final de un verso justo antes del coro; un loop que nunca termina de resolver.',
          sonido: cantar(melodia('C4', [5, 4, 3, 2, 3, 2, 1, 0]), 'Termina en Si'),
        },
      ],
      nota: 'En el módulo 4 verás que con los acordes pasa lo mismo: el acorde de la **dominante** pide volver al de la **tónica**.',
    },

    // 14 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: múdate a la tonalidad vecina',
      minutos: 15,
      objetivo: 'Escribir una melodía en Do mayor y llevarla a sus dos vecinas del círculo cambiando una sola nota.',
      pasos: [
        'Abre el **Piano roll** de un piano y escribe una melodía de **8 notas** en **C mayor** (solo filas blancas, alrededor de **C5**, nuestro Do4) que pase por **F** y por **B** y que termine en **C**.',
        'Selecciónala (**Ctrl + A**) y duplícala con **Ctrl + B**.',
        'En la copia, sube cada **F** una fila (a **F#**) y cambia la última nota a **G**: ahora está en **G mayor**, la dominante.',
        'Duplica otra vez la original. En esta copia, baja cada **B** una fila (a **A#**, nuestro Si♭) y termina en **F**: es **F mayor**, la subdominante.',
        'Escucha las tres seguidas: con una sola nota distinta, la casa se movió un paso en el círculo.',
      ],
      consejo: 'Si tu versión trae el **resaltado de escala** del Piano roll, cambia la escala a **G Major** y a **F Major**: verás que entre una y otra solo se mueve una fila.',
      reflexion: '¿Cuál de las dos vecinas te sonó más brillante, Sol o Fa? ¿Notaste que la melodía se mudó de casa aunque casi todas las notas son iguales?',
    },
  ],
}
