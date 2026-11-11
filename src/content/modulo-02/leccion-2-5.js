// Lección 2.5 — Swing, groove y velocity (cierra el módulo 2 «Ritmo y groove»).
// Formato de los pasos: ver src/content/FORMATO.md (tipos `pulso`, `pianoroll` y sonidos `groove`).
import { GROOVES, SWING, conSwing, humanizar } from '../../theory/bateria.js'

const golpes = (nota, inicios, velocity) => inicios.map((inicio) => ({ nota, inicio, duracion: 1, ...(velocity ? { velocity } : {}) }))

/** Corcheas con swing de tresillo, en tiempos: 1, «y» (a 2/3), 2, «y»… */
const CORCHEAS_SWING = [0, 1, 2, 3].flatMap((t) => [t, t + 2 / 3])

/** Clic suave en cada tiempo (corcheas: 2 casillas por tiempo). */
const CLIC = Array.from({ length: 4 }, (_, t) => ({ nota: 'click', inicio: t * 2, velocity: t === 0 ? 0.5 : 0.3 }))

/** Hi-hat en corcheas (8 casillas): fuertes en los tiempos, más suaves en las «y». */
const HATS_8 = Array.from({ length: 8 }, (_, inicio) => ({ nota: 'hat', inicio, duracion: 1, velocity: inicio % 2 ? 0.5 : 0.8 }))

/** Melodía en corcheas (una nota por casilla) con clic; `swing` retrasa las «y». */
function melodia(notas, { swing = false, bpm = 90 } = {}) {
  const eventos = notas.map((nota, inicio) => ({ nota, inicio, duracion: 1, velocity: inicio % 2 ? 0.55 : 0.8 }))
  return { etiqueta: 'Escuchar', bpm, compases: 2, groove: [...CLIC, ...(swing ? conSwing(eventos) : eventos)] }
}
const FRASE = ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'E4']

/** Un groove como sonido (los de semicorcheas necesitan `porTiempo: 4`). */
const sonido = (groove, etiqueta, { bpm = 90, compases = 2, porTiempo } = {}) => ({ etiqueta, groove, bpm, compases, ...(porTiempo ? { porTiempo } : {}) })

/** El tiempo partido en tres (12 casillas): el tresillo entero y el swing (la 1.ª y la 3.ª de cada tiempo). */
const CLIC_TRES = Array.from({ length: 4 }, (_, t) => ({ nota: 'click', inicio: t * 3, duracion: 1, velocity: t === 0 ? 0.5 : 0.3 }))
const TRESILLO_HATS = golpes('hat', Array.from({ length: 12 }, (_, i) => i)).map((e) => ({ ...e, velocity: e.inicio % 3 ? 0.4 : 0.8 }))
const SWING_HATS = TRESILLO_HATS.filter((e) => e.inicio % 3 !== 1)

/** Beat básico «a máquina» y humanizado (pequeñas variaciones de tiempo y fuerza). */
const MAQUINA = GROOVES.basico.map((e) => ({ ...e, velocity: e.nota === 'hat' ? 0.6 : e.velocity }))
const HUMANO = humanizar(GROOVES.basico, { tiempo: 0.05, fuerza: 0.12, semilla: 11 })
const DEMASIADO = humanizar(GROOVES.basico, { tiempo: 0.35, fuerza: 0.45, semilla: 5 })
const HATS_HUMANOS = humanizar(HATS_8, { tiempo: 0.14, fuerza: 0.18, semilla: 3 })

const RECTO_O_SWING = ['**Recto**: corcheas iguales', '**Con swing**: «largo-corto»']

export default {
  id: '2.5',
  modulo: 2,
  titulo: 'Swing, groove y velocity',
  subtitulo: 'Corcheas con swing, acentos, ghost notes y humanizar',
  minutos: 15,
  resumen: [
    'Con **swing**, las corcheas dejan de ser iguales: la del tiempo dura más y la de la **«y» se retrasa** («largo-corto»). En el swing clásico, la «y» cae en la **3.ª parte** de un tiempo partido en tres (un tresillo).',
    'El **Swing** del **Channel rack** de FL Studio retrasa los **pasos pares** (2, 4, 6…: las «e» y las «a» de las semicorcheas). Cuanto más lo subes, más se retrasan.',
    'El **groove** es la sensación que te hace mover la cabeza. Sale de **pequeñas variaciones de tiempo** (milisegundos antes o después) y de **fuerza** (velocity).',
    'En los hi-hats, la **velocity** da vida: **acentos** en los tiempos, más suave en las «y» y muy suave en las «e» y las «a». Las **ghost notes** son golpes de caja muy suaves entre los fuertes: se sienten más que se oyen.',
    '**Humanizar** es mover un poquito el tiempo y la fuerza de las notas para que no suenen a máquina. Con poco basta: si te pasas, suena descuadrado.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Corcheas rectas y con swing',
      parrafos: [
        'Hasta ahora, las corcheas partían cada tiempo en **dos mitades iguales**: «**1** y **2** y». Se llaman corcheas **rectas**.',
        'Con **swing**, la primera dura **más** y la segunda **menos**: la «y» llega **un poco tarde**. Suena «**largo**-corto, **largo**-corto», como un caminar con balanceo.',
        'Es el sonido del jazz, el blues, el shuffle… y de muchísimo hip hop y house. Escucha el mismo beat de las dos maneras.',
      ],
      roll: { filas: ['hat', 'click'], columnas: 8, porTiempo: 2, bpm: 85, notas: [...CLIC.map((e) => ({ ...e, duracion: 1 })), ...conSwing(HATS_8)] },
      sonidos: [sonido('basico', 'Recto', { bpm: 85 }), sonido('shuffle', 'Con swing', { bpm: 85 })],
      nota: 'En el roll: las hi-hats de las **«y»** están **corridas a la derecha** de su línea. Eso es el swing: llegan tarde a propósito.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Recto o con swing?',
      intro: 'Fíjate en las notas **entre** los clics: ¿caen justo en la mitad o llegan un poco tarde?',
      rondas: [
        {
          pregunta: '¿Cómo van estas corcheas?',
          sonidos: [sonido('shuffle', 'Escuchar', { bpm: 85 })],
          opciones: RECTO_O_SWING,
          correcta: 1,
          explicacion: 'Las hi-hats de las «y» llegan tarde: «**largo**-corto». Es el **shuffle**, el beat básico con swing.',
        },
        {
          pregunta: '¿Y estas?',
          sonidos: [sonido('basico', 'Escuchar', { bpm: 85 })],
          opciones: RECTO_O_SWING,
          correcta: 0,
          explicacion: 'Todas a la misma distancia: «1 y 2 y», corcheas **rectas**.',
        },
        {
          pregunta: '¿Y esta melodía?',
          sonidos: [melodia(FRASE, { swing: true })],
          opciones: RECTO_O_SWING,
          correcta: 1,
          explicacion: 'Cada par de notas suena «**largo**-corto»: la segunda se retrasa. **Swing**.',
        },
        {
          pregunta: 'Más rápido. ¿Recto o con swing?',
          sonidos: [melodia(FRASE, { bpm: 105 })],
          opciones: RECTO_O_SWING,
          correcta: 0,
          explicacion: 'Todas las notas duran lo mismo: corcheas **rectas**, aunque vayan más rápido.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'El swing es un tresillo escondido',
      parrafos: [
        'Parte cada tiempo en **tres** partes iguales: «**1** · · **2** · ·». Eso es un **tresillo** de corcheas.',
        'El swing clásico toca **la 1.ª y la 3.ª** de cada tres y se salta la del medio: la «y» cae en la **tercera parte** del tiempo, no en la mitad.',
        'Escucha el tresillo entero y luego sin la nota del medio: ya es swing. Cuéntalo «**1** · y **2** · y».',
      ],
      roll: { filas: ['hat', 'click'], columnas: 12, porTiempo: 3, bpm: 85, notas: [...CLIC_TRES, ...SWING_HATS] },
      sonidos: [
        sonido([...CLIC_TRES, ...TRESILLO_HATS], 'Tresillo entero', { bpm: 85, porTiempo: 3 }),
        sonido([...CLIC_TRES, ...SWING_HATS], 'Sin la del medio = swing', { bpm: 85, porTiempo: 3 }),
      ],
      nota: 'Aquí cada tiempo tiene **3 casillas**. La hi-hat de la «y» está en la tercera: por eso con swing llega «tarde».',
    },

    {
      tipo: 'pulso',
      titulo: 'Toca con swing',
      intro: 'Primero corcheas rectas, luego con swing. En la segunda, la «y» va en la **última casilla** de cada tiempo: «**1** · **y**».',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          {
            pregunta: 'Corcheas rectas: «1 y 2 y»',
            bpm: 80,
            groove: 'basico',
            cada: 0.5,
            meta: 10,
            contar: 'y',
            ayuda: 'Toca «1 y 2 y»',
            boton: '1 y 2 y',
            mensaje: 'Ahora el mismo número de toques, pero con balanceo.',
          },
          {
            pregunta: 'Con swing: «1 · y 2 · y»',
            bpm: 80,
            groove: 'shuffle',
            toques: CORCHEAS_SWING,
            meta: 10,
            contar: 'swing',
            ayuda: 'Toca «largo-corto»',
            boton: '1 · y  2 · y',
            mensaje: 'Eso es el swing: la «y» espera un poquito y el ritmo se balancea.',
          },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: 'El Swing del Channel rack',
      parrafos: [
        'En **FL Studio**, arriba del **Channel rack** hay una perilla llamada **Swing**. Retrasa los **pasos pares** (2, 4, 6…), es decir, las «**e**» y las «**a**» de las semicorcheas.',
        'Con la perilla al mínimo, todo va recto. Al subirla, esos pasos se retrasan cada vez más: el beat empieza a **balancearse**. Es lo que da su sabor a mucho hip hop y house.',
        'Escucha un beat de hip hop con hi-hats en semicorcheas, sin y con swing.',
      ],
      roll: { filas: ['hat', 'snare', 'kick'], columnas: 16, porTiempo: 4, bpm: 90, notas: GROOVES.boomBapSwing },
      sonidos: [sonido('boomBap', 'Sin swing'), sonido('boomBapSwing', 'Con swing')],
      nota: 'En el roll, las hi-hats de las «e» y las «a» están corridas a la derecha. El Swing del Channel rack afecta a los **pasos** del Channel rack, no a las notas del Piano Roll.',
    },

    {
      tipo: 'pulso',
      titulo: 'Gira la perilla del swing',
      intro: 'El mismo beat con **más o menos swing**. Toca cada opción y fíjate en cuándo empieza a balancearse.',
      objetivo: {
        tipo: 'explorar',
        porTiempo: 4,
        minimo: 3,
        elige: 'Elige cuánto swing',
        prueba: 'Prueba 3 cantidades de swing',
        tituloBien: 'Mismo beat, otro balanceo.',
        mensaje: 'No hay una cantidad «correcta»: **poco** swing suena relajado; el de **tresillo**, a shuffle; **mucho**, a saltitos. Se elige de oído.',
        tempos: [
          { titulo: 'Recto', genero: 'Sin swing', bpm: 90, groove: GROOVES.boomBap },
          { titulo: 'Suave', genero: 'Un poco', bpm: 90, groove: conSwing(GROOVES.boomBap, 0.15) },
          { titulo: 'Tresillo', genero: 'Swing clásico', bpm: 90, groove: conSwing(GROOVES.boomBap, SWING) },
          { titulo: 'Exagerado', genero: 'Casi a saltitos', bpm: 90, groove: conSwing(GROOVES.boomBap, 0.5) },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: 'Qué es el groove',
      parrafos: [
        'El **groove** es esa sensación que te hace mover la cabeza sin pensarlo. No es una nota ni un ritmo concreto: es **cómo** se toca.',
        'Sale de **pequeñas variaciones**: de **tiempo** (algunos golpes unos milisegundos antes o después, como el swing) y de **fuerza** (unos golpes más fuertes y otros más suaves: la **velocity**).',
        'Una caja de ritmos sin ajustar toca todo exacto y con la misma fuerza: suena **rígida**. Escucha el mismo beat a máquina y con groove (acentos, swing y unos golpes muy suaves).',
      ],
      sonidos: [sonido('boomBapPlano', 'A máquina'), sonido(humanizar(GROOVES.boomBapGhostSwing, { tiempo: 0.04, fuerza: 0.06, semilla: 2 }), 'Con groove', { porTiempo: 4 })],
    },

    {
      tipo: 'texto',
      titulo: 'Velocity: hi-hats con vida',
      parrafos: [
        'Las hi-hats suenan sin parar, así que su **velocity** decide mucho. Si todas tienen la misma, suenan a **metralleta**.',
        'Un patrón clásico: **fuertes** en los tiempos, **medias** en las «y» y **muy suaves** en las «e» y las «a». Así se oye el pulso dentro de las semicorcheas.',
        'Mira el carril **Vel.** de abajo: las barras altas son los **acentos**.',
      ],
      roll: { filas: ['hat'], columnas: 8, porTiempo: 4, bpm: 90, velocity: true, notas: GROOVES.boomBap.filter((e) => e.nota === 'hat' && e.inicio < 8) },
      sonidos: [sonido('boomBapPlano', 'Todas iguales'), sonido('boomBap', 'Con acentos')],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Dale vida a las hi-hats',
      intro: 'Estas 8 hi-hats (2 tiempos en semicorcheas) tienen todas la misma fuerza. **Sube** las de los tiempos y las «y» (casillas con línea y del medio) y **baja** las «e» y las «a».',
      roll: {
        filas: ['hat'],
        columnas: 8,
        porTiempo: 4,
        bpm: 90,
        velocity: true,
        notas: Array.from({ length: 8 }, (_, inicio) => ({ nota: 'hat', inicio, duracion: 1, velocity: 0.6 })),
      },
      objetivo: {
        tipo: 'velocity',
        fuertes: [0, 2, 4, 6],
        explicacion: 'Pulsa **Reproducir**: «**1** e **y** a **2** e **y** a». Las suaves rellenan y las fuertes marcan el pulso.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Ghost notes: golpes fantasma',
      parrafos: [
        'Las **ghost notes** (notas fantasma) son golpes de **caja muy suaves** entre los golpes fuertes. Casi no se oyen por separado, pero **se sienten**: rellenan el hueco y hacen que el beat ruede.',
        'Los bateristas de funk, R&B y hip hop las tocan todo el rato. En el Piano Roll son notas de caja con la **velocity muy baja** (más o menos 20–40 de 127).',
      ],
      roll: {
        filas: ['snare', 'kick'],
        columnas: 8,
        porTiempo: 4,
        bpm: 90,
        velocity: true,
        notas: [...golpes('kick', [0, 6], 0.95), ...golpes('snare', [4], 0.9), ...golpes('snare', [3, 7], 0.2)],
      },
      sonidos: [sonido('boomBap', 'Sin ghost notes'), sonido('boomBapGhost', 'Con ghost notes')],
      nota: 'Ojo: en el Piano Roll de FL Studio, «ghost notes» también se llama a las **notas grises de otros canales** que se ven de fondo. No tiene nada que ver.',
    },

    {
      tipo: 'pianoroll',
      titulo: 'Programa las ghost notes',
      intro: 'Todo tiene la misma fuerza. Deja **fuertes** el bombo y la caja del 2, y baja **mucho** las dos cajas de las «a» para que sean ghost notes.',
      roll: {
        filas: ['snare', 'kick'],
        columnas: 8,
        porTiempo: 4,
        bpm: 90,
        velocity: true,
        notas: [...golpes('kick', [0, 6], 0.6), ...golpes('snare', [4, 3, 7], 0.6)],
      },
      objetivo: {
        tipo: 'velocity',
        fuertes: [0, 4, 6],
        maxSuave: 0.33,
        explicacion: 'Pulsa **Reproducir**: la caja del 2 manda y las ghost notes casi ni se oyen, pero el beat ya no está vacío.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Humanizar',
      parrafos: [
        'Un músico nunca toca dos golpes exactamente igual. **Humanizar** es imitarlo: mover cada nota **unos milisegundos** antes o después y cambiar un poco su **velocity**, al azar.',
        'Mira el roll con atención: las hi-hats se corren **un pelín** de sus líneas y cada una tiene una fuerza distinta. Con poco basta: si te pasas, en lugar de sonar humano suena **descuadrado**.',
      ],
      roll: { filas: ['hat'], columnas: 8, porTiempo: 2, bpm: 90, velocity: true, notas: HATS_HUMANOS },
      sonidos: [sonido(MAQUINA, 'A máquina'), sonido(HUMANO, 'Humanizado'), sonido(DEMASIADO, 'Demasiado')],
      nota: 'En FL Studio puedes humanizar a mano: en el Piano Roll, arrastra notas con **Alt** pulsado (así se mueven sin la rejilla) y cambia un poco su velocity en el carril de abajo.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Qué le da vida?',
      intro: 'Escucha con atención las hi-hats y la caja.',
      rondas: [
        {
          pregunta: '¿Cómo son estas hi-hats?',
          sonidos: [sonido('boomBapPlano', 'Escuchar')],
          opciones: ['**Todas iguales**, a máquina', '**Con acentos**: unas fuertes y otras suaves'],
          correcta: 0,
          explicacion: 'Todas suenan con la misma fuerza: una metralleta. Les falta **velocity**.',
        },
        {
          pregunta: '¿Y estas?',
          sonidos: [sonido('boomBap', 'Escuchar')],
          opciones: ['**Todas iguales**, a máquina', '**Con acentos**: unas fuertes y otras suaves'],
          correcta: 1,
          explicacion: 'Fuertes en los tiempos, medias en las «y» y suaves en las «e» y las «a»: **acentos**.',
        },
        {
          pregunta: '¿Tiene ghost notes?',
          sonidos: [sonido('boomBapGhost', 'Escuchar')],
          opciones: ['**Sí**: hay golpes de caja muy suaves entre los fuertes', '**No**: la caja solo suena en 2 y 4'],
          correcta: 0,
          explicacion: 'Entre las cajas del 2 y el 4 hay golpecitos muy suaves: **ghost notes**.',
        },
        {
          pregunta: '¿Cuál está humanizado (sin pasarse)?',
          sonidos: [sonido(MAQUINA, 'Escuchar'), sonido(HUMANO, 'Escuchar')],
          mezclar: true,
          correcta: 1,
          explicacion: 'El humanizado varía un poco la fuerza y el tiempo de cada golpe: suena menos rígido, pero sigue a tiempo.',
        },
      ],
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué es el swing?',
          opciones: ['Tocar las corcheas «largo-corto»: la «y» se retrasa', 'Tocar más rápido al final del compás', 'Subir la velocity de la caja'],
          correcta: 0,
          explicacion: 'Con swing, la primera corchea dura más y la de la **«y» llega tarde**.',
        },
        {
          pregunta: 'En el swing clásico (de tresillo), la «y» cae…',
          opciones: ['En la 3.ª parte del tiempo partido en tres', 'Justo en la mitad del tiempo', 'Antes del tiempo'],
          correcta: 0,
          explicacion: 'Tiempo en tres partes («**1** · y»): se tocan la 1.ª y la 3.ª.',
        },
        {
          pregunta: 'El Swing del Channel rack de FL Studio retrasa…',
          opciones: ['Los pasos pares (las «e» y las «a»)', 'Todos los pasos por igual', 'Solo el bombo'],
          correcta: 0,
          explicacion: 'Retrasa los pasos **2, 4, 6…**: las «e» y las «a» de las semicorcheas.',
        },
        {
          pregunta: '¿Qué es una ghost note?',
          opciones: ['Un golpe muy suave (velocity baja) entre los golpes fuertes', 'Una nota que no suena', 'Un golpe fuera de tiempo'],
          correcta: 0,
          explicacion: 'Suena, pero **muy flojito**: se siente más que se oye.',
        },
        {
          pregunta: 'Humanizar es…',
          opciones: ['Variar un poco, al azar, el tiempo y la fuerza de las notas', 'Poner todas las notas justo en la rejilla', 'Bajar el tempo'],
          correcta: 0,
          explicacion: 'Lo contrario de cuantizar: pequeñas imperfecciones para que no suene a máquina. **Con poco basta**.',
        },
      ],
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: del beat a máquina al groove',
      minutos: 20,
      objetivo: 'Darle groove a un beat de hip hop con swing, acentos en las hi-hats, ghost notes y un poco de humanización.',
      pasos: [
        'Proyecto nuevo a **90 BPM**. En el **Channel rack**: **kick** en los pasos **1, 9 y 11**; **snare** en **5 y 13**; **hat** en los **16** pasos. Escúchalo: así suena «a máquina».',
        'Sube poco a poco la perilla **Swing** de arriba del Channel rack. Escucha cómo las hi-hats empiezan a balancearse y quédate con la cantidad que te haga mover la cabeza.',
        'Dale **velocity** a las hi-hats (en el *Graph editor* del Channel rack o en el carril de velocity del Piano Roll): fuertes en **1, 5, 9 y 13**, medias en **3, 7, 11 y 15** y muy suaves en el resto.',
        'Añade **ghost notes**: caja en los pasos **8, 10 y 16** con la velocity **muy baja** (más o menos 20–40 de 127).',
        'Humaniza un poco: en el Piano Roll, mueve alguna nota con **Alt** pulsado (sin rejilla) y varía ligeramente la velocity. Poco: que siga sonando a tiempo.',
        'Compara: guarda una copia del patrón a máquina (sin swing, todo igual) y escucha las dos versiones seguidas.',
      ],
      consejo: 'Si no sabes cuánto swing poner, súbelo hasta que suene exagerado y luego bájalo un poco: suele quedar en un buen punto.',
      reflexion: '¿Qué cambió más la sensación: el swing, los acentos de las hi-hats o las ghost notes?',
    },
  ],
}
