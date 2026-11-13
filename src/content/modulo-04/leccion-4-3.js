// Lección 4.3 — Acordes diatónicos y números romanos.
// Apilando terceras solo con las notas de una escala mayor salen 7 acordes (mayor, menor, menor, mayor, mayor, menor,
// disminuido); se nombran con números romanos (I ii iii IV V vi vii°), que sirven en cualquier tonalidad.
// Opciones nuevas de P8: `revelar` («Apila sobre Re con las notas de Do mayor»: no dice el tipo) y `romano`
// («Construye el vi de Do mayor»: no viene ninguna nota).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Los acordes de cada tonalidad salen de src/theory/acordes.js (`diatonicos`, Tonal `Key`).
import { acordeDeGrado, arpegioYAcorde, diatonicos, nombreAcorde, triada } from '../../theory/acordes.js'
import { escalaMayor } from '../../theory/escalas.js'
import { nombre } from '../../theory/notas.js'
import { Note } from 'tonal'

const Mayus = (t) => `${t[0].toUpperCase()}${t.slice(1)}`
/** Las notas del acorde en español: 'Re · Fa · La'. */
const notasEs = (notas) => notas.map((n) => nombre(n, { octava: false })).join(' · ')

const DO = diatonicos('C4')
const SOL = diatonicos('G3')
/** El acorde de un grado: g(DO, 'vi') → { raiz: 'A4', tipo: 'menor', notas, cifrado }. */
const g = (tonalidad, romano) => tonalidad.find((a) => a.romano === romano)

/** Las mismas notas una octava más abajo (el V, para que no salte por encima del I). */
const octavaAbajo = (notas) => notas.map((n) => Note.transpose(n, '-8P'))
const bloque = (notas, etiqueta = 'Escuchar') => ({ etiqueta, notas, modo: 'acorde', duracion: 1.6 })
/** Varios acordes seguidos (cada uno, las tres notas a la vez). */
const seguidos = (acordes, etiqueta = 'Escuchar', intervalo = 0.95) => ({ etiqueta, notas: acordes.map((a) => a.notas ?? a), intervalo, duracion: 0.9 })
/** Una progresión por números romanos en una tonalidad: prog('C4', ['I', 'V', 'vi', 'IV']). */
const prog = (tonica, romanos) => romanos.map((rn) => acordeDeGrado(tonica, rn))
const cifras = (acordes) => acordes.map((a) => a.cifrado).join(' – ')

/** Fila de las fichas que suenan. */
const ficha = (a, dato = a.cifrado) => ({
  nombre: Mayus(nombreAcorde(a.raiz, a.tipo)),
  texto: notasEs(a.notas),
  dato,
  sonido: { etiqueta: 'Escuchar', notas: arpegioYAcorde(a.notas), intervalo: 0.35, duracion: 1.1 },
})

/** Ronda «¿mayor o menor?» dentro de Do: primero el I (la casa) y luego el acorde. */
function enDo(romano, explicacion) {
  const a = g(DO, romano)
  return {
    pregunta: 'Primero Do mayor, la casa. ¿El segundo es mayor o menor?',
    sonidos: [seguidos([g(DO, 'I'), a], 'Escuchar', 1.1)],
    opciones: ['Mayor', 'Menor'],
    correcta: a.tipo === 'menor' ? 1 : 0,
    explicacion,
  }
}

/** Ronda «¿IV o V?»: suena el I y luego el IV o el V (el V, en la octava de abajo para que no salte). */
function cuartoOQuinto(tonica, romano, explicacion) {
  const casa = acordeDeGrado(tonica, 'I')
  const a = acordeDeGrado(tonica, romano)
  const notas = romano === 'V' ? octavaAbajo(a.notas) : a.notas
  return {
    pregunta: `En ${nombre(tonica, { octava: false })} mayor: después del I, ¿suena el **IV** o el **V**?`,
    sonidos: [seguidos([casa, notas], 'Escuchar', 1.1)],
    opciones: ['IV', 'V'],
    correcta: romano === 'IV' ? 0 : 1,
    explicacion,
  }
}

/** Pareja de «Empareja en Sol»: suena el I (la casa) y luego el grado. */
const pareja = (romano, detalle) => {
  const a = g(SOL, romano)
  return { sonido: seguidos([g(SOL, 'I'), a], 'Escuchar', 1.0), nombre: romano, detalle: `${a.cifrado} · ${notasEs(a.notas)}${detalle ? ` · ${detalle}` : ''}` }
}

const PIANO = { startOctave: 4, octaves: 2 }
const I_V_VI_IV_DO = prog('C4', ['I', 'V', 'vi', 'IV'])
const I_V_VI_IV_SOL = prog('G3', ['I', 'V', 'vi', 'IV'])
const nota = (n, inicio, duracion = 1) => ({ nota: n, inicio, duracion })

export default {
  id: '4.3',
  modulo: 4,
  titulo: 'Acordes diatónicos y números romanos',
  subtitulo: 'Los 7 acordes de una tonalidad',
  minutos: 14,
  resumen: [
    'Apilando terceras **solo con las notas de la escala** salen 7 acordes: los **diatónicos** de la tonalidad. Suenan «de la familia».',
    'En cualquier tonalidad mayor el patrón es el mismo: **mayor, menor, menor, mayor, mayor, menor, disminuido**.',
    'Se nombran con **números romanos** por su grado: **I ii iii IV V vi vii°** (mayúscula = mayor, minúscula = menor, ° = disminuido).',
    'Los números no dependen de la tonalidad: **I–V–vi–IV** es C – G – Am – F en Do y G – D – Em – C en Sol.',
    'El **I** es la casa; el **V** pide volver a ella; el **IV** se abre. En menor: **i ii° III iv v VI VII**.',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Tres acordes seguidos. Solo cambia el del medio.',
      rondas: [
        {
          pregunta: '¿Cuál suena **de una sola pieza**, sin una nota extraña?',
          sonidos: [seguidos([g(DO, 'I'), g(DO, 'IV'), g(DO, 'V')]), seguidos([g(DO, 'I'), triada('F#4', 'mayor'), g(DO, 'V')])],
          correcta: 0,
          mezclar: true,
          explicacion:
            'El de una pieza es **C – F – G**: todas sus notas son de **Do mayor**. En el otro, **F♯** (Fa♯ · La♯ · Do♯) trae tres notas que no están en la escala. Hoy ves qué acordes «son de la familia».',
        },
      ],
    },

    // 1 · L3 — Solo con las notas de la escala (roll + sonidos)
    {
      tipo: 'texto',
      titulo: 'Solo con las notas de la escala',
      parrafos: [
        'Toma las 7 notas de **Do mayor** (solo teclas blancas) y apila terceras sobre cada una: nota sí, nota no, **sin salirte de la escala**.',
        'Salen **7 acordes**, uno por grado. Se llaman **diatónicos**: los acordes de la tonalidad. Por eso suenan a familia.',
      ],
      roll: {
        rango: ['C4', 'F5'],
        soloBlancas: true,
        columnas: 7,
        porTiempo: 1,
        bpm: 70,
        notas: DO.flatMap((a, i) => a.notas.map((n) => nota(n, i))),
      },
      sonidos: [
        { etiqueta: 'La escala de Do mayor', notas: escalaMayor('C4'), intervalo: 0.3, duracion: 0.4 },
        seguidos(DO, 'Los 7 acordes', 0.75),
      ],
    },

    // 2 · P8 — Apila sobre cada grado (`revelar`: no se dice el tipo)
    {
      tipo: 'tocar',
      titulo: 'Apila sobre cada grado',
      intro: 'Solo teclas blancas. El tipo de acorde lo descubres al terminar.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { raiz: 'D4', tipo: 'menor', revelar: true, tonalidad: 'C', mensaje: `${notasEs(g(DO, 'ii').notas)}: salió **menor**. De Re a Fa hay solo 3 semitonos.` },
          { raiz: 'F4', tipo: 'mayor', revelar: true, tonalidad: 'C', mensaje: `${notasEs(g(DO, 'IV').notas)}: **mayor**, como Do.` },
          { raiz: 'A4', tipo: 'menor', revelar: true, tonalidad: 'C', mensaje: `${notasEs(g(DO, 'vi').notas)}: **menor**. La menor es la relativa de Do (3.4).` },
          {
            raiz: 'B4',
            tipo: 'dis',
            revelar: true,
            tonalidad: 'C',
            mensaje: `${notasEs(g(DO, 'vii°').notas)}: **disminuido**, dos 3.as menores. El único de la familia.`,
          },
        ],
      },
      piano: PIANO,
    },

    // 3 · L2 — Los 7 acordes de Do (fichas que suenan)
    {
      tipo: 'texto',
      titulo: 'Los 7 acordes de Do',
      parrafos: [
        'Como la escala mezcla tonos y semitonos, unas terceras salen mayores y otras menores. El resultado tiene un orden fijo:',
        '**mayor, menor, menor, mayor, mayor, menor, disminuido**. Tres mayores (sobre Do, Fa y Sol), tres menores (Re, Mi y La) y un disminuido (Si).',
      ],
      fichas: { nombre: 'Acorde', dato: 'Cifrado', filas: DO.map((a) => ficha(a)) },
      nota: 'Ese orden es igual en **todas** las tonalidades mayores: si sabes la escala, sabes sus 7 acordes.',
    },

    // 4 · O2 — ¿Mayor o menor? dentro de Do
    {
      tipo: 'elegir',
      titulo: '¿Mayor o menor?',
      intro: 'Todos los acordes son de Do mayor.',
      rondas: [
        enDo('ii', `**Dm**, el ii: ${notasEs(g(DO, 'ii').notas)}. Menor.`),
        enDo('IV', `**F**, el IV: ${notasEs(g(DO, 'IV').notas)}. Mayor.`),
        enDo('vi', `**Am**, el vi: ${notasEs(g(DO, 'vi').notas)}. Menor: la sombra de la casa.`),
        enDo('V', `**G**, el V: ${notasEs(g(DO, 'V').notas)}. Mayor, y pide volver a Do.`),
        enDo('iii', `**Em**, el iii: ${notasEs(g(DO, 'iii').notas)}. Menor.`),
      ],
    },

    // 5 · L2 — Números romanos
    {
      tipo: 'texto',
      titulo: 'Números romanos',
      parrafos: [
        'En lugar de decir «Re menor en Do», los músicos dicen **ii**: el acorde del **2.º grado**. Mayúscula = mayor, minúscula = menor, **°** = disminuido.',
        'En mayor: **I ii iii IV V vi vii°**. Lo bueno: los números **no dependen de la tonalidad**: el V de Do es G, el de Sol es D, y los dos hacen lo mismo.',
      ],
      fichas: { nombre: 'Acorde', dato: 'Grado', filas: DO.map((a) => ficha(a, a.romano)) },
    },

    // 6 · P8 — Construye el grado (`romano`: no viene ninguna nota)
    {
      tipo: 'tocar',
      titulo: 'Construye el grado',
      intro: 'Cuenta los grados desde **Do** y apila. Las tres notas.',
      objetivo: {
        tipo: 'acorde',
        rondas: [
          { romano: 'IV', tonalidad: 'C4', mensaje: `El IV de Do es **F**: ${notasEs(g(DO, 'IV').notas)}.` },
          { romano: 'vi', tonalidad: 'C4', mensaje: `El vi de Do es **Am**: ${notasEs(g(DO, 'vi').notas)}. Minúscula: menor.` },
          { romano: 'V', tonalidad: 'C4', mensaje: `El V de Do es **G**: ${notasEs(g(DO, 'V').notas)}.` },
        ],
      },
      piano: PIANO,
    },

    // 7 · L2 — I–V–vi–IV en Do y en Sol
    {
      tipo: 'texto',
      titulo: 'La progresión de cuatro acordes',
      parrafos: [
        `**I – V – vi – IV** es la progresión más usada del pop: en Do, **${cifras(I_V_VI_IV_DO)}**.`,
        `En Sol mayor los mismos números dan **${cifras(I_V_VI_IV_SOL)}**: otros acordes, la misma sensación. Así se cambia una canción de tonalidad.`,
      ],
      sonidos: [seguidos(I_V_VI_IV_DO, `En Do: ${cifras(I_V_VI_IV_DO)}`), seguidos(I_V_VI_IV_SOL, `En Sol: ${cifras(I_V_VI_IV_SOL)}`)],
      nota: 'En **Sol mayor** el vii° es **F♯°**: la escala de Sol tiene Fa♯, y sus acordes también.',
    },

    // 8 · O6 — Empareja grado y acorde en Sol
    {
      tipo: 'emparejar',
      titulo: 'Empareja en Sol',
      intro: 'Cada sonido empieza en **G**, el I, y luego va a un grado.',
      rondas: [
        {
          pregunta: 'En Sol mayor',
          parejas: [pareja('I', 'se queda en casa'), pareja('V'), pareja('vi'), pareja('vii°')],
          explicacion: 'El **I** no se mueve; el **V** es mayor y se va; el **vi** es menor; el **vii°**, tenso.',
        },
      ],
    },

    // 9 · O2 — ¿IV o V?
    {
      tipo: 'elegir',
      titulo: '¿IV o V?',
      intro: 'Los dos son mayores. El V pide volver a casa; el IV se abre, sin prisa.',
      rondas: [
        cuartoOQuinto('C4', 'V', '**G**, el V: se queda colgado, con ganas de volver a C.'),
        cuartoOQuinto('C4', 'IV', '**F**, el IV: se abre y descansa un poco, sin prisa por volver.'),
        cuartoOQuinto('G3', 'IV', 'En Sol, el IV es **C**: la misma apertura.'),
        cuartoOQuinto('G3', 'V', 'En Sol, el V es **D**: otra vez, tensión que pide volver a G.'),
      ],
    },

    // 10 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué son los acordes **diatónicos**?',
          opciones: ['Los que se arman solo con las notas de la escala', 'Los que tienen dos notas', 'Los acordes disminuidos'],
          correcta: 0,
          explicacion: 'Terceras apiladas **sin salirse de la escala**: 7, uno por grado.',
        },
        {
          pregunta: 'En una tonalidad mayor, ¿de qué tipo es el **vi**?',
          opciones: ['Menor', 'Mayor', 'Disminuido'],
          correcta: 0,
          explicacion: 'Minúscula = menor. En Do, el vi es **Am**.',
        },
        {
          pregunta: '¿Cuál es el **V** de Sol mayor?',
          opciones: ['D', 'C', 'Em'],
          correcta: 0,
          explicacion: `Sol, La, Si, Do, **Re**: el 5.º grado. Su acorde: **D** (${notasEs(g(SOL, 'V').notas)}).`,
        },
        {
          pregunta: '**I–V–vi–IV** en Do es…',
          opciones: [cifras(I_V_VI_IV_DO), 'C – F – Dm – G', 'C – G – A – F'],
          correcta: 0,
          explicacion: `**${cifras(I_V_VI_IV_DO)}**. El vi va en minúscula: Am, no A.`,
        },
        {
          pregunta: '¿Qué grado da el acorde **disminuido**?',
          opciones: ['El vii°', 'El iii', 'El IV'],
          correcta: 0,
          explicacion: 'El **7.º**: en Do, **B°** (Si · Re · Fa), con el tritono.',
        },
      ],
    },

    // 11 · L5 — ¿Qué se siente? I contra V
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Dos acordes mayores de la misma familia.',
      lados: [
        {
          etiqueta: 'I',
          emociones: 'En casa, reposo, final',
          ejemplos: 'Con el I empiezan y terminan casi todas las canciones.',
          sonido: bloque(g(DO, 'I').notas, 'Escuchar C, el I'),
        },
        {
          etiqueta: 'V',
          emociones: 'Tensión, espera, «falta algo»',
          ejemplos: 'El acorde justo antes del estribillo o del final: pide volver al I.',
          sonido: bloque(octavaAbajo(g(DO, 'V').notas), 'Escuchar G, el V'),
        },
      ],
      nota: 'En una tonalidad **menor** el patrón cambia: **i ii° III iv v VI VII**. En La menor: Am, B°, C, Dm, Em, F, G (los mismos acordes que Do, empezando en La).',
    },

    // 12 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: I–V–vi–IV en dos tonalidades',
      minutos: 15,
      objetivo: 'Escribir la progresión I–V–vi–IV en Do y pasarla a Sol sin cambiar la sensación.',
      pasos: [
        `En el **Piano roll**, escribe **${cifras(I_V_VI_IV_DO)}**, un acorde por compás, solo con filas blancas: **C5-E5-G5**, **G5-B5-D6**, **A5-C6-E6**, **F5-A5-C6** (nombres de FL).`,
        'Ponlo en bucle: ese es el I–V–vi–IV.',
        'Duplica el patrón (**Clone pattern**). En el nuevo, selecciona todo (**Ctrl + A**) y súbelo **7 semitonos** (**Shift + ↑** siete veces): ahora está en **Sol**.',
        `Comprueba que dice **${cifras(I_V_VI_IV_SOL)}**: mismos números, otros acordes.`,
        'Pon un patrón detrás del otro en el Playlist y escucha el cambio de tonalidad.',
      ],
      consejo: 'Si un acorde suena raro, revisa que todas sus notas estén en la escala: en Sol, el Fa siempre es **Fa♯**.',
      reflexion: '¿Se siente igual la progresión en Sol? ¿Cuál de los cuatro acordes te suena más a «casa»?',
    },
  ],
}
