// Lección 12.2 (se ve como P1.2) — El groove de cada género. Producción 1 «Beats en FL Studio».
// Propuesta aprobada: https://claude.ai/artifact/L51wET3sh5LHPupPka3K9B (pasos) y https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE
// (el rack que cambia de género y el árbol de géneros). La P1.1 enseñó QUÉ PAPEL juega cada sonido; aquí, con el mismo
// kit, qué hace que algo suene a pop, boom bap, trap, house o dembow: el tempo, dónde cae el bombo y dónde cae la caja.
// Son los troncos del árbol de géneros (theory/rack.js → GENEROS) más el trap. La lección se ordena por parecidos:
// house → dembow (mismo bombo), pop → boom bap (misma caja), boom bap → trap (medio tiempo).
import { CORCHEAS, CUATRO, GENEROS, SEMICORCHEAS, sonidoGenero, sonidoRack } from '../../theory/rack.js'

const TRONCOS = ['pop', 'boomBap', 'trap', 'house', 'dembow']
const { pop: POP, boomBap: BOOM_BAP, trap: TRAP, house: HOUSE, dembow: DEMBOW } = GENEROS

/** «¿Qué género es?»: una ronda por género, con su sonido y cuatro opciones (se barajan). */
const ronda = (id, opciones, explicacion) => ({
  pregunta: '¿Qué género es?',
  sonidos: [sonidoGenero(id, { etiqueta: 'Escuchar el beat' })],
  opciones,
  correcta: 0,
  explicacion,
})

export default {
  id: '12.2',
  modulo: 12,
  titulo: 'El groove de cada género',
  subtitulo: 'Pop, boom bap, trap, house y dembow con el mismo kit',
  minutos: 15,
  resumen: [
    'Con el **mismo kit**, el género lo deciden tres cosas: el **tempo**, dónde cae el **bombo** y dónde cae la **caja**.',
    '**Pop** (~118): bombo en 1 y 3, caja en 2 y 4, el *backbeat*. **Boom bap** (~90): el mismo, con el bombo sincopado.',
    '**House** (~124): bombo en los cuatro tiempos (*four on the floor*) y el **hat abierto** en cada «y». **Dembow** (~95): el mismo bombo, con la caja en **3 + 3 + 2**.',
    '**Trap** (~140): **medio tiempo**, una sola caja en el 3; se siente como 70. Para saber el tempo, cuenta los hats, no la caja.',
    'Casi todo lo que suena hoy es una **rama** de estos: cambia una o dos cosas y nace otro género.',
  ],
  pasos: [
    {
      tipo: 'generos',
      titulo: 'Cinco géneros, un kit',
      intro: 'Los **mismos sonidos**, cinco géneros. Toca cada uno y fíjate en lo que cambia.',
      generos: TRONCOS,
      minimo: 3,
      tituloBien: '¡Mismo kit, otro género!',
      mensaje: 'Cambian tres cosas: el **tempo**, dónde cae el **bombo** y dónde cae la **caja**.',
    },

    // ---- House ----
    {
      tipo: 'rack',
      titulo: 'Four on the floor',
      rack: { filas: ['kick', 'clap'], bpm: HOUSE.bpm, patron: { clap: HOUSE.patron.clap }, fijas: ['clap'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Las palmas ya están. Pon el **bombo en los cuatro tiempos**.',
        patron: { kick: CUATRO },
        guia: true,
        explicacion: 'Bombo en los pasos **1, 5, 9 y 13**: el *four on the floor* del house, el disco y casi toda la música de baile.',
      },
    },

    {
      tipo: 'rack',
      titulo: 'El hat abierto',
      rack: { filas: ['kick', 'clap', 'ohat'], bpm: HOUSE.bpm, patron: { kick: CUATRO, clap: HOUSE.patron.clap }, fijas: ['kick', 'clap'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Fila nueva: el **hat abierto** (*Open hat* en FL). Ponlo en cada **«y»**, justo entre bombo y bombo.',
        patron: { ohat: HOUSE.patron.ohat },
        pista: 'Cada tiempo tiene 4 pasos: la «y» es el tercero de cada grupo.',
        explicacion: 'Hat abierto en los pasos **3, 7, 11 y 15**: el «tss» entre bombo y bombo. Con eso ya es house.',
      },
    },

    // ---- Dembow: el mismo bombo, otra caja ----
    {
      tipo: 'siente',
      titulo: 'Del house al dembow',
      lados: [
        {
          etiqueta: 'Caja en el 2 y el 4',
          emociones: 'Recto, para bailar sin parar',
          ejemplos: 'El bombo del house, a 95.',
          sonido: sonidoRack({ kick: CUATRO, snare: [4, 12], hat: CORCHEAS }, { bpm: DEMBOW.bpm, compases: 2, etiqueta: 'Escuchar' }),
        },
        {
          etiqueta: 'Caja del dembow',
          emociones: 'Cojea, empuja, pide perreo',
          ejemplos: 'El dembow y el reguetón.',
          sonido: sonidoGenero('dembow', { etiqueta: 'Escuchar' }),
        },
      ],
      nota: 'El bombo es **el mismo** en los dos. Lo que cambia el género es la **caja**.',
    },

    {
      tipo: 'rack',
      titulo: 'Escucha y copia la caja del dembow',
      rack: { filas: ['kick', 'snare', 'hat'], bpm: DEMBOW.bpm, patron: { kick: CUATRO, hat: CORCHEAS }, fijas: ['kick', 'hat'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Escucha el original y pon la **caja** de oído. Son **cuatro** golpes.',
        patron: { snare: DEMBOW.patron.snare },
        escuchar: true,
        pista: 'En cada mitad del compás, 3 + 3 + 2, como el tresillo de la R1.4: el bombo hace el primer golpe y la caja los otros dos.',
        explicacion: 'Caja en los pasos **4, 7, 12 y 15**: la «a» del 1 y la «y» del 2, y lo mismo en el 3 y el 4. Con el bombo, **3 + 3 + 2**.',
      },
    },

    // ---- Del pop al boom bap: la misma caja, otro bombo ----
    {
      tipo: 'rack',
      titulo: 'Del pop al boom bap',
      rack: { filas: ['kick', 'snare', 'hat'], bpm: BOOM_BAP.bpm, patron: POP.patron, fijas: ['snare', 'hat'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Está puesto el **pop**. Escucha el boom bap y **mueve solo el bombo** hasta que suene igual.',
        patron: { kick: BOOM_BAP.patron.kick },
        escuchar: true,
        pista: 'El 1 se queda. Los otros dos caen fuera de los tiempos, entre el 2 y el 3.',
        explicacion: 'Bombo en los pasos **1, 8 y 11**. Cambió una sola fila y ya es otro género: así nacen casi todos.',
      },
    },

    // ---- Trap: medio tiempo ----
    {
      tipo: 'siente',
      titulo: 'Medio tiempo',
      lados: [
        {
          etiqueta: 'Caja en el 2 y el 4',
          emociones: 'Frenético, corre sin parar',
          ejemplos: 'El trap con la caja de siempre.',
          sonido: sonidoRack({ ...TRAP.patron, clap: [4, 12] }, { bpm: TRAP.bpm, compases: 2, etiqueta: 'Escuchar' }),
        },
        {
          etiqueta: 'Caja solo en el 3',
          emociones: 'Pesado, se arrastra, aunque los hats corren',
          ejemplos: 'El trap de verdad: medio tiempo.',
          sonido: sonidoGenero('trap', { etiqueta: 'Escuchar' }),
        },
      ],
      nota: 'Los dos van a **140**. Con la caja a la mitad, el cuerpo lo siente como 70: la misma idea que «tempo rápido, armonía lenta» de la A2.6.',
    },

    {
      tipo: 'rack',
      titulo: 'Pon la caja del trap',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: TRAP.bpm, patron: { kick: TRAP.patron.kick, hat: SEMICORCHEAS }, fijas: ['kick', 'hat'] },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'El bombo y los hats ya están. El trap lleva **una sola caja** por compás. ¿Dónde va?',
        patron: { clap: TRAP.patron.clap },
        pista: 'Medio tiempo: la caja cae a la mitad del compás.',
        explicacion: 'En el paso **9**, el tiempo **3**. A 140 suena como un «2 y 4» a 70.',
      },
    },

    {
      tipo: 'elegir',
      titulo: 'El tempo engaña',
      rondas: [
        {
          pregunta: 'Dos géneros. **¿Cuál tiene más BPM?**',
          sonidos: [sonidoGenero('trap'), sonidoGenero('boomBap')],
          mezclar: true,
          correcta: 0,
          explicacion: 'El **trap**: 140 contra 90. Se siente lento porque la caja va a medio tiempo. Para saber el tempo, cuenta los **hats**, no la caja.',
        },
      ],
    },

    // ---- Todo junto ----
    {
      tipo: 'elegir',
      titulo: '¿Qué género es?',
      rondas: [
        ronda('house', ['House', 'Dembow', 'Pop', 'Trap'], 'Bombo en los cuatro tiempos y el **hat abierto** en la «y»: **house**.'),
        ronda('trap', ['Trap', 'Boom bap', 'House', 'Dembow'], 'Una sola caja, en el 3, y hats que corren: **trap**.'),
        ronda('dembow', ['Dembow', 'House', 'Pop', 'Boom bap'], 'Bombo en los cuatro tiempos, pero la caja en **3 + 3 + 2**: **dembow**.'),
        ronda('boomBap', ['Boom bap', 'Pop', 'Trap', 'Dembow'], 'Caja en 2 y 4 y el bombo que rebota fuera de los tiempos: **boom bap**.'),
        ronda('pop', ['Pop', 'Boom bap', 'House', 'Trap'], 'Bombo recto en el 1 y el 3, caja en el 2 y el 4: **pop**.'),
      ],
    },

    {
      tipo: 'rack',
      titulo: 'Copia el trap entero',
      rack: { filas: ['kick', 'clap', 'hat'], bpm: TRAP.bpm },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Todo de oído: **bombo**, **caja** y **hats**.',
        patron: TRAP.patron,
        escuchar: true,
        pista: 'Empieza por lo fácil: la caja (una sola) y los hats (arrastra el dedo por toda la fila). El bombo, al final: son tres.',
        explicacion: 'Caja en el **3** (paso 9), hats en los **16** pasos y el bombo en los pasos **1, 8 y 12**.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'En FL Studio',
      parrafos: [
        'El tempo es del **proyecto**, arriba en el número de BPM: pop **~118**, boom bap **~90**, house **~124**, dembow **~95** y trap **~140**.',
        'El **hat abierto** no viene en el proyecto nuevo: busca uno en el **Browser** (en *Packs › Drums*, los hats que dicen *Open*) y arrástralo al Channel rack.',
        'El trap se programa **a 140 con la caja en el paso 9**, no a 70: así caben los hats en semicorcheas y los rolls de la P1.3.',
        'Casi todo lo que escuchas hoy es una **rama** de estos cinco: el lo-fi sale del boom bap, el reguetón del dembow, el techno del house.',
      ],
      sonidos: TRONCOS.map((id) => sonidoGenero(id, { etiqueta: `${GENEROS[id].nombre} · ${GENEROS[id].bpm}` })),
      nota: 'Para probar géneros rápido, haz **un patrón por género** (Pattern 1, 2, 3…) con el mismo kit y cambia de uno a otro con el selector de patrones.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: un kit, cinco géneros',
      minutos: 20,
      objetivo: 'Programar el mismo kit en cinco patrones y oír qué cambia de un género a otro.',
      pasos: [
        'Proyecto nuevo con **Kick, Clap, Snare y Hat**. Añade un **hat abierto** desde el Browser.',
        '**Pattern 1 · Pop** a 118: Kick en **1 y 9**, Snare en **5 y 13**, Hat en los pasos impares.',
        '**Pattern 2 · Boom bap** a 90: clona el pop y mueve el Kick a **1, 8 y 11**.',
        '**Pattern 3 · House** a 124: Kick en **1, 5, 9 y 13**, Clap en **5 y 13** y el hat abierto en **3, 7, 11 y 15**.',
        '**Pattern 4 · Dembow** a 95: Kick como el house, Snare en **4, 7, 12 y 15** y Hat en los impares.',
        '**Pattern 5 · Trap** a 140: Clap solo en el **9**, Hat en los **16** pasos y Kick en **1, 8 y 12**.',
      ],
      consejo: 'El tempo es del proyecto, no del patrón: cámbialo cada vez que pases de uno a otro.',
      reflexion: '¿Con qué género te quedarías para tu primer beat? ¿Qué fila cambiaste más veces?',
    },
  ],
}
