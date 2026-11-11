// Lección 3.1 — Tono y semitono (abre el módulo 3 «Intervalos y escalas»).
// Repasa el semitono y el tono de la 1.3 y los convierte en la REGLA para medir: contar semitonos,
// escala cromática y de tonos enteros, y la primera fórmula T T S T T T S (adelanto de la escala mayor).
// Formato de los pasos: ver src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md
// Las notas de las fórmulas y escalas salen de src/theory/intervalos.js (Tonal.js).
import { Note } from 'tonal'
import { formula } from '../../theory/intervalos.js'

/** Aplica una fórmula de pasos y deja los nombres simples (Si♯ → Do), para sonar. */
const escala = (inicio, pasos) => formula(inicio, pasos).map((n) => Note.simplify(n))
const T6 = ['T', 'T', 'T', 'T', 'T', 'T']
const MAYOR = ['T', 'T', 'S', 'T', 'T', 'T', 'S']

/** Escala cromática: `n` semitonos desde `inicio` (con sostenidos), hacia arriba o hacia abajo. */
const cromatica = (inicio, n, dir = 1) =>
  Array.from({ length: n + 1 }, (_, i) => Note.fromMidiSharps(Note.midi(inicio) + dir * i))

/** Dos notas en el Piano Roll, una detrás de otra (para contar filas). */
const dosNotas = (a, b) => [
  { nota: a, inicio: 0, duracion: 2 },
  { nota: b, inicio: 2, duracion: 2 },
]

/** Ronda «¿cuántos semitonos?» leyendo el roll. */
const OPCIONES_FILAS = ['1 semitono', '2 semitonos (un tono)', '3 semitonos (tono y medio)', '4 semitonos (dos tonos)']
function cuentaFilas(a, b, rango, semis, explicacion) {
  return {
    pregunta: '¿Cuántos semitonos hay de la primera nota a la segunda?',
    roll: { rango, columnas: 4, porTiempo: 1, bpm: 80, notas: dosNotas(a, b) },
    opciones: OPCIONES_FILAS,
    correcta: semis - 1,
    explicacion,
  }
}

/** Ronda «¿semitono, tono o tono y medio?» de oído. */
function distanciaDeOido(a, b, semis, explicacion) {
  return {
    pregunta: '¿Qué distancia hay entre las dos notas?',
    sonidos: [{ etiqueta: 'Escuchar', notas: [a, b], intervalo: 0.6 }],
    opciones: ['Un semitono', 'Un tono', 'Tono y medio'],
    correcta: semis - 1,
    explicacion,
  }
}

/** Ronda «¿cromática o de tonos enteros?». */
function queEscala(notas, esCromatica, explicacion) {
  return {
    pregunta: '¿Qué escala suena?',
    sonidos: [{ etiqueta: 'Escuchar', notas, intervalo: 0.26 }],
    opciones: ['Cromática (solo semitonos)', 'De tonos enteros (solo tonos)'],
    correcta: esCromatica ? 0 : 1,
    explicacion,
  }
}

/** Ronda «¿qué pasos suenan?» con tres notas. */
const OPCIONES_PASOS = ['Tono + tono', 'Tono + semitono', 'Semitono + tono']
function quePasos(notas, correcta, explicacion) {
  return {
    pregunta: 'Tres notas que suben. ¿Qué pasos dan?',
    sonidos: [{ etiqueta: 'Escuchar', notas, intervalo: 0.55 }],
    opciones: OPCIONES_PASOS,
    correcta,
    explicacion,
  }
}

export default {
  id: '3.1',
  modulo: 3,
  titulo: 'Tono y semitono',
  subtitulo: 'La regla para medir la música',
  minutos: 13,
  resumen: [
    'El **semitono** (S) es el paso más pequeño: de una tecla a la de al lado. El **tono** (T) son **dos semitonos**.',
    'Para medir, **cuenta los saltos**, no las teclas: Do → Mi son **4 semitonos** (dos tonos); 3 semitonos = **tono y medio**.',
    'En el Piano Roll **cada fila es un semitono**: contar filas es contar semitonos.',
    'Solo semitonos = escala **cromática** (12 notas, tensa). Solo tonos = escala de **tonos enteros** (6 notas, de sueño).',
    'La fórmula **T T S T T T S** desde Do da solo teclas blancas: es la **escala mayor**. Desde otra nota la misma fórmula pide negras (desde Sol, Fa♯).',
  ],
  pasos: [
    // 0 · O5 — Gancho de oído
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Las dos tarjetas empiezan en Do y suben cinco notas. Una sube con el paso más pequeño posible.',
      rondas: [
        {
          pregunta: '¿Cuál sube de semitono en semitono?',
          sonidos: [
            { notas: cromatica('C4', 4), intervalo: 0.3 },
            { notas: escala('C4', ['T', 'T', 'T', 'T']), intervalo: 0.3 },
          ],
          correcta: 0,
          mezclar: true,
          mostrarNotas: true,
          explicacion:
            'La que sube **Do, Do♯, Re, Re♯, Mi** va de tecla en tecla: **semitonos**. La otra salta una tecla cada vez (**Do, Re, Mi, Fa♯, Sol♯**): **tonos**. Con estos dos pasos se mide toda la música.',
        },
      ],
    },

    // 1 · L2 — Repaso: la regla
    {
      tipo: 'texto',
      titulo: 'La regla para medir',
      parrafos: [
        'En el módulo 1 viste los dos pasos básicos. Ahora van a ser tu **regla**: con ellos se miden los intervalos, las escalas y los acordes.',
        'Un **semitono** (lo abreviamos **S**) es ir de una tecla a la **de al lado**, sea blanca o negra. Es el paso más pequeño.',
        'Un **tono** (**T**) son **dos semitonos**: saltas una tecla. De Fa a Sol hay un tono porque en medio queda Fa♯.',
        'Recuerda: entre **Mi–Fa** y **Si–Do** no hay negra, así que esas blancas están a **un semitono**.',
      ],
      sonidos: [
        { etiqueta: 'Semitono: Mi → Fa', notas: ['E4', 'F4'], intervalo: 0.6 },
        { etiqueta: 'Tono: Fa → Sol', notas: ['F4', 'G4'], intervalo: 0.6 },
        { etiqueta: 'Los 12 semitonos: Do → Do', notas: cromatica('C4', 12), intervalo: 0.22 },
      ],
      nota: 'En FL Studio, **Shift + ↑** sube las notas seleccionadas un semitono. Moverlas «dos veces» es subirlas un tono.',
    },

    // 2 · P5 — Medir un paso (con nombres)
    {
      tipo: 'tocar',
      titulo: 'Un paso desde una nota',
      intro: 'Escucha la nota marcada y da el paso que se pide. **Sube** = a la derecha; **baja** = a la izquierda.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          { desde: 'C4', paso: 'T', direccion: 'sube', pista: 'Un tono salta una tecla: de Do, pasando por Do♯, llegas a **Re**.' },
          { desde: 'E4', paso: 'S', direccion: 'sube', pista: 'Entre Mi y Fa no hay negra: la tecla de al lado de Mi es **Fa**.' },
          { desde: 'A4', paso: 'S', direccion: 'baja', pista: 'Baja a la tecla de al lado, a la izquierda: la **negra** entre Sol y La (La♭ = Sol♯).' },
          { desde: 'F4', paso: 'T', direccion: 'sube', pista: 'Salta una tecla (Fa♯) hacia la derecha: **Sol**.' },
          { desde: 'D4', paso: 'S', direccion: 'sube', pista: 'La tecla de al lado de Re, a la derecha, es una negra: **Re♯ = Mi♭**.' },
        ],
      },
      piano: { startOctave: 4, octaves: 1 },
    },

    // 3 · P5 — Medir un paso (sin nombres, con trampas)
    {
      tipo: 'tocar',
      titulo: 'Ahora sin nombres',
      intro: 'Las mismas reglas, sin nombres en las teclas. Ojo con **Mi–Fa** y **Si–Do**.',
      objetivo: {
        tipo: 'paso',
        rondas: [
          {
            desde: 'E4',
            paso: 'T',
            direccion: 'sube',
            pista: 'Desde Mi, un semitono ya es Fa (no hay negra en medio). Un **tono** llega a la negra siguiente: **Fa♯**.',
          },
          { desde: 'G4', paso: 'T', direccion: 'baja', pista: 'Salta la negra que hay a la izquierda de Sol (Fa♯) y llegas a **Fa**.' },
          { desde: 'C#4', paso: 'T', direccion: 'sube', pista: 'De la primera negra del grupo de 2, salta Re y llega a la segunda negra: **Re♯**.' },
          {
            desde: 'B4',
            paso: 'T',
            direccion: 'baja',
            pista: 'Salta la negra de la izquierda de Si (La♯ = Si♭) y llega a **La**.',
          },
          { desde: 'F#4', paso: 'S', direccion: 'sube', pista: 'La tecla de al lado de Fa♯, a la derecha, es la blanca **Sol**.' },
        ],
      },
      piano: { startOctave: 4, octaves: 1, showLabels: false },
    },

    // 4 · L3 — Contar semitonos (con el roll)
    {
      tipo: 'texto',
      titulo: 'Contar semitonos',
      parrafos: [
        'Para medir la distancia entre dos notas cualquiera, **cuenta los saltos**, no las teclas: la de salida no cuenta.',
        '**Do → Mi**: Do → Do♯ → Re → Re♯ → Mi. Son **4 semitonos**, o sea **dos tonos**.',
        '**Mi → Sol**: Mi → Fa → Fa♯ → Sol. Son **3 semitonos**: un tono y medio.',
        'En el **Piano Roll** es todavía más fácil: **cada fila es un semitono**, sea tecla blanca o negra. Cuenta las filas que sube la nota.',
      ],
      roll: { rango: ['C4', 'F4'], columnas: 4, porTiempo: 1, bpm: 80, notas: dosNotas('C4', 'E4') },
      sonidos: [
        { etiqueta: 'Do → Mi (4 semitonos)', notas: ['C4', 'E4'], intervalo: 0.6 },
        { etiqueta: 'Mi → Sol (3 semitonos)', notas: ['E4', 'G4'], intervalo: 0.6 },
      ],
    },

    // 5 · O4 — Leer el roll y elegir
    {
      tipo: 'elegir',
      titulo: 'Cuenta las filas',
      intro: 'Cada fila del roll es un semitono. Pulsa Reproducir si quieres oírlo.',
      rondas: [
        cuentaFilas('D4', 'E4', ['C4', 'F4'], 2, 'De **Re** a **Mi** subes **2 filas** (Re♯ y Mi): **un tono**.'),
        cuentaFilas('E4', 'F4', ['C4', 'G4'], 1, 'De **Mi** a **Fa** subes **1 fila**: no hay negra en medio. **Un semitono**.'),
        cuentaFilas('A4', 'C5', ['G4', 'C5'], 3, 'De **La** a **Do**: La♯, Si, Do. **3 filas** = **tono y medio**.'),
        cuentaFilas('F4', 'A4', ['E4', 'A4'], 4, 'De **Fa** a **La**: Fa♯, Sol, Sol♯, La. **4 filas** = **dos tonos**.'),
      ],
    },

    // 6 · O2 — Escuchar y elegir: distancia de oído
    {
      tipo: 'elegir',
      titulo: '¿Cuánto se movió?',
      intro: 'Ahora sin ver nada. El semitono roza, el tono avanza y el tono y medio ya salta.',
      rondas: [
        distanciaDeOido('D4', 'E4', 2, '**Re → Mi**: un tono, con Re♯ en medio.'),
        distanciaDeOido('B3', 'C4', 1, '**Si → Do**: dos blancas sin negra en medio. Un semitono.'),
        distanciaDeOido('A4', 'C5', 3, '**La → Do**: tres semitonos (La♯, Si, Do). Tono y medio: se nota el salto.'),
        distanciaDeOido('G4', 'F4', 2, '**Sol → Fa**, bajando: un tono.'),
        distanciaDeOido('E4', 'G4', 3, '**Mi → Sol**: tono y medio. Es el comienzo de muchas melodías tristes.'),
      ],
    },

    // 7 · L2 — Dos escalas de un solo paso
    {
      tipo: 'texto',
      titulo: 'Dos escalas de un solo paso',
      parrafos: [
        'Una **escala** es una escalera de notas. ¿Qué pasa si todos los escalones son iguales?',
        'Solo **semitonos**: la escala **cromática**. Pasa por las **12 notas**, blancas y negras. Suena a deslizarse, a tensión, a algo que se acerca.',
        'Solo **tonos**: la escala de **tonos enteros**. Solo tiene **6 notas** (Do, Re, Mi, Fa♯, Sol♯, La♯) y suena flotante, como un sueño o un recuerdo en una película.',
      ],
      sonidos: [
        { etiqueta: 'Cromática (S S S…)', notas: cromatica('C4', 12), intervalo: 0.2 },
        { etiqueta: 'Tonos enteros (T T T…)', notas: escala('C4', T6), intervalo: 0.3 },
      ],
      nota: 'Las escalas que más se usan **mezclan** tonos y semitonos. Lo verás dentro de nada.',
    },

    // 8 · O2 — ¿Cromática o de tonos enteros?
    {
      tipo: 'elegir',
      titulo: '¿Cromática o de tonos enteros?',
      intro: 'Escucha la escalera. ¿Escalones mínimos o el doble de grandes?',
      rondas: [
        queEscala(cromatica('G3', 8), true, 'Notas pegadas, de tecla en tecla: **cromática**.'),
        queEscala(escala('D4', T6), false, 'Cada nota salta una tecla: **tonos enteros**. ¿Notaste lo «flotante»?'),
        queEscala(cromatica('E5', 8, -1), true, 'Bajando de semitono en semitono: **cromática**. Muy de escena de suspenso.'),
        queEscala(escala('C4', T6).reverse(), false, 'Bajando de tono en tono: **tonos enteros**. Seis escalones y vuelves a Do.'),
      ],
    },

    // 9 · L2 — La fórmula T T S T T T S
    {
      tipo: 'texto',
      titulo: 'Mezcla tonos y semitonos',
      parrafos: [
        'Ahora mezclemos. Sigue esta **fórmula** de pasos desde **Do**: **T T S T T T S**.',
        'Do →(T) Re →(T) Mi →(S) Fa →(T) Sol →(T) La →(T) Si →(S) Do. ¡Solo **teclas blancas**!',
        'Los dos semitonos caen justo en **Mi–Fa** y **Si–Do**, donde no hay negras. Esta escala es la **escala mayor**: la verás a fondo en la lección 3.3.',
        'Lo potente es que la fórmula sirve **desde cualquier nota**. Desde **Sol**, para cumplirla hace falta una negra: **Fa♯**.',
      ],
      sonidos: [
        { etiqueta: 'T T S T T T S desde Do', notas: escala('C4', MAYOR), intervalo: 0.35 },
        { etiqueta: 'La misma fórmula desde Sol', notas: escala('G3', MAYOR), intervalo: 0.35 },
      ],
    },

    // 10 · P6 — Seguir la fórmula (desde Do, con nombres)
    {
      tipo: 'tocar',
      titulo: 'Toca la fórmula',
      intro: 'Empiezas en **Do** (marcado). Toca cada nota siguiendo los pasos: **T** salta una tecla, **S** va a la de al lado.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'C4',
            pasos: MAYOR,
            titulo: '¡La escala de Do mayor!',
            mensaje: 'Do · Re · Mi · Fa · Sol · La · Si · Do. Los semitonos caen en **Mi–Fa** y **Si–Do**: por eso no necesitaste ninguna negra.',
          },
        ],
      },
      piano: { startOctave: 4, octaves: 2 },
    },

    // 11 · P6 — Seguir la fórmula (desde Sol y Fa, sin nombres)
    {
      tipo: 'tocar',
      titulo: 'La fórmula desde otras notas',
      intro: 'Sin nombres. La fórmula es la misma; ahora alguna nota tendrá que ser **negra** para cumplirla.',
      objetivo: {
        tipo: 'formula',
        rondas: [
          {
            desde: 'G3',
            pasos: MAYOR,
            titulo: '¡Sol mayor!',
            mensaje: 'Sol · La · Si · Do · Re · Mi · **Fa♯** · Sol. Si tocas Fa, de Mi a Fa habría un semitono y la fórmula pide un **tono**.',
          },
          {
            desde: 'F4',
            pasos: MAYOR,
            titulo: '¡Fa mayor!',
            mensaje: 'Fa · Sol · La · **Si♭** · Do · Re · Mi · Fa. De La a Si habría un tono; la fórmula pide un **semitono**, así que bajas a Si♭.',
          },
        ],
      },
      piano: { startOctave: 3, octaves: 3, showLabels: false },
    },

    // 12 · O2 — ¿Qué pasos suenan?
    {
      tipo: 'elegir',
      titulo: '¿Qué pasos suenan?',
      intro: 'Tres notas seguidas = dos pasos. Escucha dónde está el semitono (el paso que «roza»).',
      rondas: [
        quePasos(['C4', 'D4', 'E4'], 0, '**Do → Re → Mi**: tono + tono. Dos pasos iguales y abiertos.'),
        quePasos(['A4', 'B4', 'C5'], 1, '**La → Si → Do**: tono + semitono. El último paso roza: Si–Do.'),
        quePasos(['E4', 'F4', 'G4'], 2, '**Mi → Fa → Sol**: semitono + tono. El primer paso roza: Mi–Fa.'),
        quePasos(['G4', 'A4', 'B4'], 0, '**Sol → La → Si**: tono + tono.'),
      ],
    },

    // 13 · O3 — Comprueba la idea
    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué nota está un tono por encima de Mi?',
          opciones: ['Fa', 'Fa♯', 'Sol'],
          correcta: 1,
          explicacion: 'De Mi a Fa solo hay **un semitono**; un tono llega una tecla más allá: **Fa♯**. Es la trampa más común.',
        },
        {
          pregunta: '¿Cuántos semitonos hay de Do a Mi?',
          opciones: ['2', '3', '4'],
          correcta: 2,
          explicacion: 'Do → Do♯ → Re → Re♯ → Mi: **4 saltos**, es decir, **dos tonos**. La tecla de salida no se cuenta.',
        },
        {
          pregunta: 'En el Piano Roll de FL, subir una nota una fila es…',
          opciones: ['Subirla un semitono', 'Subirla un tono', 'Depende de si es blanca o negra'],
          correcta: 0,
          explicacion: 'Cada fila es **un semitono**, siempre: las filas negras también cuentan.',
        },
        {
          pregunta: '¿Qué escala tiene solo 6 notas?',
          opciones: ['La cromática', 'La de tonos enteros', 'La mayor'],
          correcta: 1,
          explicacion: '6 tonos = 12 semitonos = una octava. Por eso la de **tonos enteros** tiene solo 6 notas; la cromática tiene 12 y la mayor, 7.',
        },
        {
          pregunta: 'La fórmula T T S T T T S desde Do…',
          opciones: ['Solo usa teclas blancas', 'Usa todas las negras', 'Usa una negra: Fa♯'],
          correcta: 0,
          explicacion: 'Desde **Do** salen solo blancas: es **Do mayor**. Desde Sol hace falta **Fa♯**.',
        },
      ],
    },

    // 14 · L5 — ¿Qué se siente?
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma idea —subir con escalones iguales— con dos tamaños de escalón.',
      lados: [
        {
          etiqueta: 'Cromática',
          emociones: 'Tensión, misterio, algo que se desliza',
          ejemplos: 'El villano que se acerca, un bajo que repta en el trap oscuro, una subida antes del drop.',
          sonido: { etiqueta: 'Escuchar cromática', notas: cromatica('E3', 12), intervalo: 0.18 },
        },
        {
          etiqueta: 'Tonos enteros',
          emociones: 'Sueño, magia, sin rumbo fijo',
          ejemplos: 'La transición a un recuerdo en una película, un arpa mágica, el jazz impresionista.',
          sonido: { etiqueta: 'Escuchar tonos enteros', notas: escala('C4', T6).concat(escala('C5', T6).slice(1)), intervalo: 0.2 },
        },
      ],
      nota: 'Las dos son «simétricas»: no tienen una nota que suene a casa. Por eso las escalas que **mezclan** tonos y semitonos, como la mayor, se sienten más estables.',
    },

    // 15 · X1 — Reto en FL Studio
    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu regla en el Piano Roll',
      minutos: 15,
      objetivo: 'Medir tonos y semitonos contando filas, y construir escalas con fórmulas.',
      pasos: [
        'Abre el **Piano roll** de un canal de piano. Dibuja **C5** (nuestro Do4) y, detrás, la nota de **una fila más arriba** (C#5): un semitono. Luego otra a **dos filas** (D5): un tono.',
        'Dibuja la **escala cromática**: 13 notas seguidas de C5 a C6, una por fila. Escúchala.',
        'Debajo, en otro compás, la de **tonos enteros**: C5, D5, E5, F#5, G#5, A#5, C6 (siempre saltando una fila). Compara las dos.',
        'Ahora la fórmula **T T S T T T S** desde C5: deberías tener solo filas blancas (C D E F G A B C).',
        'Selecciona la fórmula (Ctrl+A) y bájala con **Shift + ↓** hasta que empiece en **G4**. Fíjate: la fórmula se mantiene y aparece **F#**.',
      ],
      consejo: 'Para medir en FL, cuenta **filas**, no teclas blancas: cada fila es un semitono. Si te pierdes, toca las dos notas a la vez y escucha si «rozan» (semitono) o no.',
      reflexion: '¿Cuál de las dos escalas de un solo paso te gustó más? ¿En qué parte de una canción la usarías?',
    },
  ],
}
