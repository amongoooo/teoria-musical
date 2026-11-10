// Lección 1.4 — Leer el Piano Roll (cierra el módulo 1).
// Formato de los pasos: ver src/content/FORMATO.md (tipo `pianoroll` y `roll` en `texto`/`elegir`).

/** Roll de 1 octava (Do4–Do5, solo teclas blancas): 8 filas × 8 casillas (4 tiempos). */
const OCTAVA = { rango: ['C4', 'C5'], soloBlancas: true }

const nota = (n, inicio, duracion = 2, velocity) => ({ nota: n, inicio, duracion, ...(velocity ? { velocity } : {}) })

export default {
  id: '1.4',
  modulo: 1,
  titulo: 'Leer el Piano Roll',
  subtitulo: 'Notas, tiempo, duración y velocity',
  minutos: 12,
  resumen: [
    'En el Piano Roll, las **filas** son notas (más arriba, más agudo) y las **columnas** son el **tiempo** (se lee de izquierda a derecha).',
    'La **longitud** de una nota es su **duración**. Las notas apiladas en la misma columna suenan **a la vez**: un acorde.',
    'La **velocity** es la fuerza con que se toca cada nota (0–127). Con ella se hacen los **acentos**. No es el tempo.',
    'FL Studio numera las octavas **una más arriba**: el Do central es **C5** en FL y **Do4** en la app. Regla: **FL = app + 1**.',
    'Notas **cortas** dan rebote y energía; notas **largas**, calma y amplitud.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Un mapa de notas',
      parrafos: [
        'En FL Studio la música se escribe en el **Piano Roll**: una rejilla con un teclado a la izquierda.',
        '**Filas = notas.** Cada fila es una tecla del piano. Más arriba, más aguda.',
        '**Columnas = tiempo.** Se lee de izquierda a derecha, como un texto. Los números de arriba son los **tiempos** del compás.',
        'Cada rectángulo es una **nota**. Pulsa **Reproducir** y mira avanzar la línea azul.',
      ],
      roll: { ...OCTAVA, notas: [nota('C4', 0), nota('E4', 2), nota('G4', 4), nota('C5', 6)] },
      nota: 'Toca los nombres de la izquierda para oír cada fila, como el teclado del Piano Roll.',
    },

    {
      tipo: 'elegir',
      titulo: 'Lee el roll',
      intro: 'Mira la rejilla (y pulsa Reproducir si quieres comprobarlo).',
      rondas: [
        {
          pregunta: '¿Qué nota suena primero?',
          roll: { ...OCTAVA, notas: [nota('E4', 0), nota('C4', 2), nota('G4', 4, 4)] },
          opciones: ['Do4', 'Mi4', 'Sol4'],
          correcta: 1,
          explicacion: 'Suena primero la que está más a la **izquierda**: **Mi4**, en el tiempo 1.',
        },
        {
          pregunta: '¿Y cuál es la más aguda?',
          roll: { ...OCTAVA, notas: [nota('E4', 0), nota('C4', 2), nota('G4', 4, 4)] },
          opciones: ['Do4', 'Mi4', 'Sol4'],
          correcta: 2,
          explicacion: 'La más aguda es la que está más **arriba**: **Sol4**.',
        },
        {
          pregunta: '¿Cuántas notas suenan a la vez en el tiempo 1?',
          roll: { ...OCTAVA, notas: [nota('C4', 0, 4), nota('E4', 0, 4), nota('G4', 0, 4), nota('C5', 4, 4)] },
          opciones: ['1', '2', '3'],
          correcta: 2,
          explicacion: 'Las notas **apiladas** en la misma columna suenan juntas: **Do, Mi y Sol** forman un **acorde** (Do mayor). Lo verás en el módulo de acordes.',
        },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Dibuja tus primeras notas',
      intro: 'Toca la rejilla para crear notas. Luego pulsa **Reproducir**.',
      roll: OCTAVA,
      objetivo: {
        tipo: 'libre',
        cantidad: 4,
        mensaje: 'Cada nota tiene una **altura** (su fila) y un **momento** (su columna). Pulsa **Reproducir** para oír tu melodía.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Duración: lo largo de la nota',
      parrafos: [
        'La **longitud** del rectángulo es su **duración**: cuánto tiempo suena la nota.',
        'Aquí cada tiempo tiene **2 casillas**. Una nota de 1 casilla dura **medio tiempo**; una de 2, **1 tiempo**; una de 4, **2 tiempos**.',
        'En FL Studio se alarga una nota arrastrando su **borde derecho**. Aquí, arrastrando el dedo hacia la derecha.',
      ],
      roll: { ...OCTAVA, notas: [nota('C4', 0, 1), nota('C4', 1, 1), nota('E4', 2, 2), nota('G4', 4, 4)] },
    },

    {
      tipo: 'pianoroll',
      titulo: 'Copia el ritmo',
      intro: 'Rellena los contornos punteados. **Arrastra a la derecha** para que cada nota dure lo mismo que su contorno.',
      roll: OCTAVA,
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: [nota('C4', 0, 1), nota('D4', 1, 1), nota('E4', 2, 2), nota('G4', 4, 4)],
        explicacion: 'Mismas teclas, distintas duraciones: eso ya es **ritmo**. Pulsa **Reproducir** para oírlo.',
      },
    },

    {
      tipo: 'elegir',
      titulo: 'Lee las duraciones',
      rondas: [
        {
          pregunta: '¿Qué nota dura más?',
          roll: { ...OCTAVA, notas: [nota('D4', 0, 1), nota('F4', 1, 3), nota('A4', 4, 2), nota('C5', 6, 1)] },
          opciones: ['Re4', 'Fa4', 'La4'],
          correcta: 1,
          explicacion: 'La más **larga** es **Fa4**: ocupa 3 casillas (un tiempo y medio).',
        },
        {
          pregunta: '¿En qué tiempo empieza La4?',
          roll: { ...OCTAVA, notas: [nota('D4', 0, 1), nota('F4', 1, 3), nota('A4', 4, 2), nota('C5', 6, 1)] },
          opciones: ['En el tiempo 2', 'En el tiempo 3', 'En el tiempo 4'],
          correcta: 1,
          explicacion: '**La4** empieza justo bajo el número **3**. Fíjate en las líneas más marcadas: separan los tiempos.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Velocity: la fuerza de cada nota',
      parrafos: [
        'Cada nota tiene también una **velocity**: lo **fuerte** que se pulsa la tecla, de 0 a 127.',
        'En FL Studio se ve en el **panel de abajo** del Piano Roll: una barrita bajo cada nota. Más alta, más fuerte. El color de la nota también cambia.',
        'No cambia la altura ni la duración, sino la **intensidad** (y en muchos instrumentos, el brillo). Ojo: no tiene nada que ver con el tempo.',
      ],
      roll: {
        rango: ['C4', 'E4'],
        soloBlancas: true,
        velocity: true,
        notas: [nota('C4', 0, 2, 0.25), nota('C4', 2, 2, 0.5), nota('C4', 4, 2, 0.75), nota('C4', 6, 2, 1)],
      },
      sonidos: [
        { etiqueta: 'Suave (velocity baja)', notas: ['C4', 'E4', 'G4'], velocidad: 0.25 },
        { etiqueta: 'Fuerte (velocity alta)', notas: ['C4', 'E4', 'G4'], velocidad: 1 },
      ],
    },

    {
      tipo: 'pianoroll',
      titulo: 'Dale acentos',
      intro: 'Ocho notas iguales suenan a máquina. Sube la **velocity** de las notas de los tiempos **1** y **3** para que el ritmo tenga pulso.',
      roll: {
        rango: ['C4', 'E4'],
        soloBlancas: true,
        velocity: true,
        notas: Array.from({ length: 8 }, (_, i) => nota('C4', i, 1, 0.45)),
      },
      objetivo: {
        tipo: 'velocity',
        fuertes: [0, 4],
        explicacion: 'Los **acentos** en los tiempos 1 y 3 dan pulso al patrón. Los productores lo hacen todo el rato en hi-hats, bajos y acordes.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Ojo: en FL, Do4 se llama C5',
      parrafos: [
        'El **Do central** del piano (262 Hz) en esta app se llama **Do4**, como en la notación científica.',
        'En FL Studio esa misma tecla se llama **C5**: FL numera las octavas **una más arriba**.',
        'Regla rápida: **FL = app + 1**. Do4 → **C5**, La4 (440 Hz) → **A5**, Sol3 → **G4**.',
        'No es otra nota: suena exactamente igual. Solo cambia el número. Cambia los nombres con el selector y compruébalo.',
      ],
      roll: { ...OCTAVA, etiquetas: 'fl', alternar: true, notas: [nota('C4', 0, 4), nota('C5', 4, 4)] },
      nota: 'Cada programa usa su convención: en **Ableton** el Do central es **C3**. Ante la duda, busca la tecla que suena a **262 Hz**.',
    },

    {
      tipo: 'pianoroll',
      titulo: 'Traduce a FL Studio',
      intro: 'Este roll usa los nombres de **FL Studio**.',
      roll: { rango: ['G3', 'C5'], soloBlancas: true, etiquetas: 'fl' },
      objetivo: {
        tipo: 'copiar',
        instruccion: 'Dibuja **Sol4** (como lo llama la app) en el tiempo 1 y **Do4** en el tiempo 3. Cada una dura **1 tiempo** (2 casillas).',
        notas: [nota('G4', 0, 2), nota('C4', 4, 2)],
        pista: 'Recuerda: en FL el número es **uno más**. Sol4 → **G5** y Do4 → **C5**.',
        explicacion: '**G5** y **C5** de FL son **Sol4** y **Do4** de la app: la misma tecla con otro número.',
      },
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué indica la fila de una nota en el Piano Roll?',
          opciones: ['Su altura (qué nota es)', 'Su duración', 'Lo fuerte que suena'],
          correcta: 0,
          explicacion: 'Las **filas** son las teclas: indican la **altura**. Más arriba, más aguda.',
        },
        {
          pregunta: '¿Y la longitud del rectángulo?',
          opciones: ['Lo aguda que es', 'Cuánto dura', 'Lo fuerte que suena'],
          correcta: 1,
          explicacion: 'La **longitud** es la **duración**: cuántas casillas (tiempos) suena.',
        },
        {
          pregunta: '¿Qué es la velocity?',
          opciones: ['La velocidad de la canción (BPM)', 'La fuerza con que se toca cada nota', 'La altura de la nota'],
          correcta: 1,
          explicacion: 'La **velocity** es la **fuerza** de cada nota (0–127). La velocidad de la canción es el **tempo** (BPM).',
        },
        {
          pregunta: 'El Do central (Do4 en la app), en FL Studio se llama…',
          opciones: ['C4', 'C5', 'C3'],
          correcta: 1,
          explicacion: 'En FL Studio es **C5**: FL numera las octavas una más arriba.',
        },
        {
          pregunta: 'En FL Studio ves A5. En esta app es…',
          opciones: ['La5', 'La4', 'La6'],
          correcta: 1,
          explicacion: 'Restas uno: **A5** de FL es **La4** de la app, el La de 440 Hz.',
        },
      ],
    },

    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma melodía con notas cortas y con notas largas. Solo cambia la **duración**.',
      lados: [
        {
          etiqueta: 'Notas cortas',
          emociones: 'Rebote, energía, ritmo',
          ejemplos: 'Plucks de house, un bajo funky, el piano entrecortado de un tema de pop.',
          sonido: { etiqueta: 'Escuchar cortas', notas: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], duracion: 0.12, intervalo: 0.25 },
        },
        {
          etiqueta: 'Notas largas',
          emociones: 'Calma, amplitud, emoción',
          ejemplos: 'Pads de fondo, acordes de una balada, la intro de una película.',
          sonido: { etiqueta: 'Escuchar largas', notas: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], duracion: 1.4, intervalo: 0.5 },
        },
      ],
      nota: 'En el Piano Roll basta con **estirar o encoger** las notas para cambiar por completo la energía de una parte.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: tu primera frase en el Piano Roll',
      minutos: 15,
      objetivo: 'Escribir una frase corta usando altura, duración y velocity.',
      pasos: [
        'Abre el **Piano roll** de un canal de piano (clic derecho en el canal → Piano roll). Busca **C5**: es nuestro **Do4**, el Do central.',
        'En el imán de arriba (**Snap**) elige **1/2 beat**: así cada casilla dura medio tiempo, como en la app.',
        'Dibuja 4 notas con **clic izquierdo** y alarga alguna arrastrando su **borde derecho**. Usa duraciones distintas: medio tiempo, 1 tiempo y 2 tiempos.',
        'Borra una nota con **clic derecho** y vuelve a dibujarla.',
        'Abajo, en el panel de **Velocity**, baja todas las barras a la mitad y sube solo las notas de los tiempos **1 y 3**. Escucha el cambio.',
        'Haz un acorde: apila **C5, E5 y G5** en la misma columna (Do4, Mi4 y Sol4 de la app).',
      ],
      consejo: 'Si un tutorial (o Ableton) llama **C3** o **C4** al Do central, no te líes: en FL Studio es **C5**. Toca las teclas de la izquierda del Piano Roll para oír dónde estás.',
      reflexion: '¿Qué cambió más la sensación de tu frase: las duraciones o la velocity?',
    },
  ],
}
