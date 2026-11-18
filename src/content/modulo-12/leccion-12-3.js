// Lección 12.3 (se ve como P1.3) — Hi-hats y rolls. Producción 1 «Beats en FL Studio».
// Propuesta aprobada: https://claude.ai/artifact/C11uGNnXRJFKmmSF8tth2S. Los hats como motor del trap: corcheas,
// semicorcheas y tresillos, la velocity (golpes suaves) y los ROLLS (un paso partido en 2 o en 3). Trae el PINCEL del
// Channel rack (Golpe · Suave · ×2 · ×3; theory/rack.js → PINCELES, `tipo` en el patrón) y abre en el árbol de géneros
// drill, jersey club y dubstep (`abre: '12.3'`).
import { CORCHEAS, GENEROS, SEMICORCHEAS, sonidoGenero, sonidoRack } from '../../theory/rack.js'

const { trap: TRAP, drill: DRILL } = GENEROS
const BPM = TRAP.bpm
const RAMAS = ['Trap', 'Drill', 'Jersey club', 'Dubstep']

/** Bombo y palmas del trap (lo fijo de casi todos los pasos). */
const BASE = { kick: TRAP.patron.kick, clap: TRAP.patron.clap }
/** Pasos impares: la «e» y la «a» de cada tiempo. */
const IMPARES = SEMICORCHEAS.filter((p) => p % 2 === 1)
const SUAVES = Object.fromEntries(IMPARES.map((p) => [p, 's']))

/** El trap con estos hats (y sus rolls o suaves). */
const trap = (hat, tipoHat) => ({ ...BASE, hat, ...(tipoHat ? { tipo: { hat: tipoHat } } : {}) })
const beat = (patron, etiqueta, opciones = {}) => sonidoRack(patron, { bpm: BPM, compases: 2, etiqueta, ...opciones })

/** El trap con hats en tresillos de corchea (3 por tiempo): caen fuera de la rejilla de 16, así que se añaden aparte. */
function conTresillos(bpm, etiqueta) {
  const s = sonidoRack(BASE, { bpm, compases: 2, etiqueta })
  for (let k = 0; k < 12; k++) s.groove.push({ nota: 'hat', inicio: (k * 4) / 3, velocity: k % 3 === 0 ? 0.7 : 0.55 })
  return s
}

/** Todos los hats con la misma fuerza (la «máquina»). */
function plano(sonido) {
  return { ...sonido, groove: sonido.groove.map((e) => (e.nota === 'hat' ? { ...e, velocity: 0.6 } : e)) }
}

const CUANTOS = ['2 por tiempo', '3 por tiempo', '4 por tiempo']
const ROLLS = ['Sin roll', 'Roll de 2', 'Roll de 3']

export default {
  id: '12.3',
  modulo: 12,
  titulo: 'Hi-hats y rolls',
  subtitulo: 'El motor del trap: subdivisión, velocity y rolls',
  minutos: 12,
  resumen: [
    'Con el mismo tempo, los hats deciden la **energía**: corcheas (2 por tiempo), **tresillos** (3) o **semicorcheas** (4).',
    'La **velocity** les da mano: la «e» y la «a» más **suaves** y el hat respira; todos iguales suenan a máquina.',
    'Un **roll** parte un paso en golpes más rápidos que la rejilla: **×2** (fusas, 1/32) redobla; **×3** (tresillo, 1/24) galopa. Suelen ir al final del compás, para llevar al 1.',
    'El **drill** pone los hats en **3 + 3 + 2** con rolls de tresillo: tropiezan a propósito.',
    'En FL Studio, el roll se dibuja en el **Piano roll** del hat con el Snap en «1/2 step» o «1/3 step», y la velocity en la franja de abajo.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'El hat marca la energía',
      parrafos: [
        'El mismo trap a **140**, tres veces. Solo cambian los **hats**.',
        'Dos por tiempo (**corcheas**), tres (**tresillos**) o cuatro (**semicorcheas**): el tempo es el mismo y la energía no.',
      ],
      sonidos: [beat(trap(CORCHEAS), 'Corcheas'), conTresillos(BPM, 'Tresillos'), beat(trap(SEMICORCHEAS), 'Semicorcheas')],
    },

    {
      tipo: 'elegir',
      titulo: '¿Cuántos por tiempo?',
      rondas: [
        {
          pregunta: 'Cuenta los hats de cada tiempo. **¿Cuántos son?**',
          sonidos: [conTresillos(110, 'Escuchar')],
          opciones: CUANTOS,
          correcta: 1,
          explicacion: '**Tres** por tiempo: tresillos. Galopan, como el «1 y a» de un caballo.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [beat(trap(SEMICORCHEAS), 'Escuchar', { bpm: 110 })],
          opciones: CUANTOS,
          correcta: 2,
          explicacion: '**Cuatro**: semicorcheas, el «1 e y a». El motor del trap.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [beat(trap(CORCHEAS), 'Escuchar', { bpm: 110 })],
          opciones: CUANTOS,
          correcta: 0,
          explicacion: '**Dos**: corcheas, el «1 y». Más tranquilo, aunque el tempo sea el mismo.',
        },
      ],
    },

    {
      tipo: 'siente',
      titulo: 'Máquina o mano',
      lados: [
        {
          etiqueta: 'Todos iguales',
          emociones: 'Rígido, una ametralladora',
          ejemplos: 'Los 16 hats con la misma fuerza.',
          sonido: plano(beat(trap(SEMICORCHEAS), 'Escuchar')),
        },
        {
          etiqueta: 'La «e» y la «a» suaves',
          emociones: 'Respira, suena tocado a mano',
          ejemplos: 'Los mismos hats con dos fuerzas.',
          sonido: beat(trap(SEMICORCHEAS, SUAVES), 'Escuchar'),
        },
      ],
      nota: 'Mismos pasos, otra **velocity**: la fuerza de cada golpe (la viste en la R1.5). En los hats se nota muchísimo.',
    },

    {
      tipo: 'rack',
      titulo: 'Hats con mano',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: BPM, patron: trap(SEMICORCHEAS), fijas: ['kick', 'clap'], pinceles: true },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Elige el pincel **Suave** y toca los hats punteados: la **«e»** y la **«a»** de cada tiempo.',
        patron: { hat: SEMICORCHEAS, tipo: { hat: SUAVES } },
        guia: true,
        pista: 'Cada tiempo tiene 4 pasos: van suaves el 2.º y el 4.º de cada grupo.',
        explicacion: 'Fuertes en el tiempo y la «y», **suaves** en la «e» y la «a». Dale a Reproducir: el hat respira.',
      },
    },

    {
      tipo: 'texto',
      titulo: '¿Qué es un roll?',
      parrafos: [
        'Un **roll** parte un paso en golpes más rápidos que la rejilla. El hat «tiembla» y empuja hacia lo que viene.',
        '**×2**: dos golpes en un paso (fusas, 1/32). Suena a **redoble**. **×3**: tres golpes (tresillo de semicorchea, 1/24). Suena a **galope**.',
        'Casi siempre van al **final del compás**: llevan al 1.',
      ],
      sonidos: [
        beat(trap(SEMICORCHEAS), 'Sin roll'),
        beat(trap(SEMICORCHEAS, { 14: 2, 15: 2 }), 'Roll de 2 al final'),
        beat(trap(SEMICORCHEAS, { 14: 3, 15: 3 }), 'Roll de 3 al final'),
      ],
      nota: 'Un roll suena **creciendo**: cada golpe un poco más fuerte que el anterior.',
    },

    {
      tipo: 'rack',
      titulo: 'Tu primer roll',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: BPM, patron: trap(SEMICORCHEAS), fijas: ['kick', 'clap'], pinceles: true },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Elige **×2** y toca los **dos últimos** hats: el roll que lleva al 1.',
        patron: { hat: SEMICORCHEAS, tipo: { hat: { 14: 2, 15: 2 } } },
        guia: true,
        explicacion: 'Roll ×2 en los pasos **15 y 16**: cuatro golpes rapidísimos justo antes del 1. El remate más usado del trap.',
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Roll de 2 o de 3?',
      rondas: [
        {
          pregunta: 'Escucha el final del compás. **¿Qué roll es?**',
          sonidos: [beat(trap(SEMICORCHEAS, { 14: 3, 15: 3 }), 'Escuchar')],
          opciones: ROLLS,
          ordenFijo: true,
          correcta: 2,
          explicacion: 'De **3**: galopa (ta-ka-ta, ta-ka-ta).',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [beat(trap(SEMICORCHEAS, { 6: 2, 7: 2, 14: 2, 15: 2 }), 'Escuchar')],
          opciones: ROLLS,
          ordenFijo: true,
          correcta: 1,
          explicacion: 'De **2**, y dos veces: antes del 3 y antes del 1. Suena a redoble, recto.',
        },
        {
          pregunta: '¿Y aquí?',
          sonidos: [beat(trap(SEMICORCHEAS, SUAVES), 'Escuchar')],
          opciones: ROLLS,
          ordenFijo: true,
          correcta: 0,
          explicacion: '**Sin roll**: semicorcheas con la «e» y la «a» suaves. Nada se sale de la rejilla.',
        },
      ],
    },

    {
      tipo: 'rack',
      titulo: 'Escucha y copia el roll',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: BPM, patron: trap(SEMICORCHEAS), fijas: ['kick', 'clap'], pinceles: true },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Escucha el original: tiene **dos rolls**. Ponlos de oído.',
        patron: { hat: SEMICORCHEAS, tipo: { hat: { 7: 3, 15: 2 } } },
        escuchar: true,
        pista: 'Uno justo antes del 3 y otro justo antes del 1. El primero galopa.',
        explicacion: 'Un roll **×3** en el paso **8** (antes del 3) y uno **×2** en el **16** (antes del 1).',
      },
    },

    {
      tipo: 'siente',
      titulo: 'Del trap al drill',
      lados: [
        {
          etiqueta: 'Trap',
          emociones: 'Corre recto, sin parar',
          ejemplos: 'Hats en semicorcheas.',
          sonido: sonidoGenero('trap', { etiqueta: 'Escuchar' }),
        },
        {
          etiqueta: 'Drill',
          emociones: 'Tropieza, frío, amenaza',
          ejemplos: 'Hats en 3 + 3 + 2 con rolls de tresillo.',
          sonido: sonidoGenero('drill', { etiqueta: 'Escuchar' }),
        },
      ],
      nota: 'El drill es un hijo del trap: mismo medio tiempo, otros **hats**. Los pone en **3 + 3 + 2**, el tresillo de la R1.4.',
    },

    {
      tipo: 'rack',
      titulo: 'Programa los hats del drill',
      rack: {
        filas: ['kick', 'clap', 'hat'],
        bpm: DRILL.bpm,
        patron: { kick: DRILL.patron.kick, clap: DRILL.patron.clap, hat: SEMICORCHEAS },
        fijas: ['kick', 'clap'],
        pinceles: true,
      },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'El bombo y las palmas del drill ya están. Escucha el original y **cambia los hats**.',
        patron: { hat: DRILL.patron.hat, tipo: DRILL.patron.tipo },
        escuchar: true,
        pista: 'En cada mitad del compás, 3 + 3 + 2: tres hats, y el tercero es un roll ×3. Con el pincel Golpe, arrastra para borrar los que sobran.',
        explicacion: 'Hats en los pasos **1, 4, 7** y **9, 12, 15**, con un roll **×3** en el 7 y el 15: 3 + 3 + 2 en cada mitad.',
      },
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué rama es?',
      rondas: [
        {
          pregunta: '¿Qué género es?',
          sonidos: [sonidoGenero('drill', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 1,
          explicacion: 'Hats en 3 + 3 + 2 con rolls de tresillo: **drill**, hijo del trap.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [sonidoGenero('jersey', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 2,
          explicacion: 'El bombo en **ráfagas** al final del compás, con un roll de bombo: **jersey club**, hijo del house.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [sonidoGenero('dubstep', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 3,
          explicacion: 'Medio tiempo, hats en corcheas con **tresillos** que lo arrastran: **dubstep**, nieto del house por el UK garage.',
        },
        {
          pregunta: '¿Y este?',
          sonidos: [sonidoGenero('trap', { etiqueta: 'Escuchar el beat' })],
          opciones: RAMAS,
          correcta: 0,
          explicacion: 'Una sola caja en el 3 y hats que corren rectos en semicorcheas: **trap**.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'En FL Studio',
      parrafos: [
        'El Channel rack de FL **no parte pasos**: el roll se dibuja en el **Piano roll** del hat (clic derecho en el canal › *Piano roll*).',
        'Cambia el **Snap** (el imán de arriba) a **«1/2 step»** para un roll ×2 o a **«1/3 step»** para uno ×3, y dibuja las notas. También puedes dibujar una nota larga y partirla con *Tools › Chop*.',
        'La **velocity** está en la franja de abajo del Piano roll: dibuja una **rampa** que sube en cada roll. En el Channel rack, el **Graph editor** enseña la velocity de cada paso.',
      ],
      sonidos: [beat(trap(SEMICORCHEAS, { ...SUAVES, 7: 3, 14: 2, 15: 2 }), 'Escuchar: suaves y rolls')],
      nota: 'Aquí el pincel es un atajo: en FL, **×2** = Snap «1/2 step» y **×3** = «1/3 step».',
    },

    {
      tipo: 'rack',
      titulo: 'Tu fila de hats',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: BPM, patron: BASE, fijas: ['kick', 'clap'], pinceles: true },
      objetivo: {
        tipo: 'libre',
        instruccion: 'El bombo y las palmas del trap ya están. Haz **tus hats**: al menos **un roll** y **un golpe suave**.',
        golpes: 12,
        rolls: 1,
        suaves: 1,
        mensaje: 'Dale a Reproducir y cámbialo hasta que te guste. No hay respuesta correcta.',
      },
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: 4 compases de hats',
      minutos: 20,
      objetivo: 'Programar una fila de hats de trap con velocity y rolls que cambie a lo largo de 4 compases.',
      pasos: [
        'Proyecto a **140**: Kick en **1, 8 y 12**, Clap en el **9** y el Hat en los **16** pasos. Haz el patrón de **4 compases**.',
        'Abre el **Piano roll** del Hat y baja la **velocity** de la «e» y la «a» (los pasos pares) a la mitad.',
        'Al final del **compás 2**, cambia el Snap a «1/2 step» y haz un roll **×2** en los pasos 15 y 16.',
        'En el **compás 4**, con el Snap en «1/3 step», haz un roll **×3** antes del 3. Dibuja una rampa de velocity que suba.',
        'Al final del **compás 4**, borra los dos últimos hats: un **hueco** justo antes de volver al 1. El silencio también empuja.',
      ],
      consejo: 'Menos es más: un roll por compás, o cada dos, se oye mejor que rolls en todas partes.',
      reflexion: '¿Dónde se oyó mejor el roll: antes del 3 o antes del 1? ¿Qué cambió al bajar la velocity?',
    },
  ],
}
