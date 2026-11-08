// Lección 1.2 — Las 12 notas y la octava.
// Formato de los pasos: ver src/content/FORMATO.md

const CROMATICA_4 = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

// Melodía corta para comparar octavas (la misma en todas las versiones).
const MELODIA = ['C', 'E', 'G', 'A', 'G', 'E', 'D', 'C']
const melodia = (octava) => MELODIA.map((n) => `${n}${octava}`)
const doblada = (grave, aguda) => MELODIA.map((n) => [`${n}${grave}`, `${n}${aguda}`])

/** Ronda "¿es la misma nota en otra octava?". */
function mismaNota(a, b, si, explicacion) {
  return {
    pregunta: '¿Es la misma nota en otra octava?',
    sonidos: [{ etiqueta: 'Escuchar las dos', notas: [a, b], intervalo: 0.7 }],
    opciones: ['Sí, la misma nota', 'No, son notas distintas'],
    correcta: si ? 0 : 1,
    explicacion,
  }
}

export default {
  id: '1.2',
  modulo: 1,
  titulo: 'Las 12 notas y la octava',
  subtitulo: 'El teclado se repite',
  minutos: 10,
  resumen: [
    'En la música occidental solo hay **12 notas**: 7 blancas (Do Re Mi Fa Sol La Si) y 5 negras.',
    'Después de la 12.ª, el ciclo se repite: vuelve a empezar en **Do**.',
    'Una **octava** es la distancia de una nota a la siguiente con el mismo nombre.',
    'Subir una octava **duplica la frecuencia**: La3 = 220 Hz, La4 = 440 Hz, La5 = 880 Hz.',
    'El número indica la octava: **Do4** es el Do central del piano.',
    'Para orientarte: **Do** está justo a la izquierda del grupo de **2 negras**; **Fa**, del grupo de **3**.',
  ],
  pasos: [
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Cada tarjeta toca dos notas seguidas. Escúchalas con atención.',
      rondas: [
        {
          pregunta: '¿En qué pareja las dos notas suenan como “la misma”, solo que una más aguda?',
          sonidos: [
            { notas: ['C4', 'C5'], intervalo: 0.7 },
            { notas: ['C4', 'F#4'], intervalo: 0.7 },
          ],
          correcta: 0,
          mezclar: true,
          explicacion:
            'La pareja correcta es **Do4 → Do5**: suenan tan parecidas que casi se funden, aunque una es más aguda. Tienen el mismo nombre y están a una **octava** de distancia. **Do → Fa♯** suena claramente a dos notas distintas.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Solo existen 12 notas',
      parrafos: [
        'Un piano tiene 88 teclas, pero solo hay **12 notas distintas**. Después de la 12.ª, todo se repite.',
        'Las **7 teclas blancas** se llaman **Do, Re, Mi, Fa, Sol, La, Si**. Entre ellas hay **5 teclas negras** que tienen el nombre de su vecina con ♯ (sostenido) o ♭ (bemol): Do♯, Re♯, Fa♯, Sol♯, La♯. Las verás a fondo en la próxima lección.',
        'Escucha las 12 seguidas, de Do a Si, y cómo la 13.ª vuelve a ser un Do.',
      ],
      sonidos: [
        { etiqueta: 'Las 12 notas (y vuelta a Do)', notas: CROMATICA_4, intervalo: 0.3, duracion: 0.6 },
        { etiqueta: 'Solo las blancas', notas: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], intervalo: 0.38 },
      ],
      nota: 'Cada tecla, blanca o negra, está a un **semitono** de su vecina: es el paso más pequeño del piano.',
    },

    {
      tipo: 'tocar',
      titulo: 'Las 12 teclas de una octava',
      intro: 'Toca las **12 teclas** de este teclado: las 7 blancas y las 5 negras. Esas son todas las notas que existen.',
      objetivo: {
        tipo: 'explorar',
        cantidad: 12,
        mensaje: 'Ya tocaste todas las notas de la música occidental. Todo lo demás son estas 12 repetidas más graves o más agudas.',
      },
      piano: { startOctave: 4, octaves: 1 },
    },

    {
      tipo: 'texto',
      titulo: 'La octava: el doble de rápido',
      parrafos: [
        'Una **octava** es la distancia entre una nota y la siguiente que se llama igual: de Do4 a Do5, de La3 a La4…',
        'Lo sorprendente es la física: subir una octava **duplica la frecuencia**. La4 vibra a **440 Hz** y La5 a **880 Hz**. Bajar una octava la divide entre dos: La3 = **220 Hz**.',
        'Como las vibraciones “encajan” (una hace exactamente dos ciclos por cada uno de la otra), el oído las oye casi como **la misma nota**. Por eso tienen el mismo nombre.',
        'El número de la nota dice en qué octava está: **Do4** es el **Do central**, el que queda en medio del piano.',
      ],
      sonidos: [
        { etiqueta: 'La3, La4, La5 (220 → 440 → 880 Hz)', notas: ['A3', 'A4', 'A5'], intervalo: 0.7 },
        { etiqueta: 'Do4 + Do5 a la vez', notas: ['C4', 'C5'], modo: 'acorde', duracion: 1.6 },
      ],
      nota: 'Fíjate en las teclas: la etiqueta **Do** lleva un numerito (Do₃, Do₄, Do₅) que te dice la octava.',
    },

    {
      tipo: 'tocar',
      titulo: 'Todas las Do',
      intro: 'Este teclado tiene 3 octavas. Toca **todas las Do**. En el celular, muévete con ◀ ▶.',
      objetivo: { tipo: 'octavas', rondas: [{ nota: 'C' }] },
      piano: { startOctave: 3, octaves: 3 },
    },

    {
      tipo: 'tocar',
      titulo: 'La misma nota en 3 octavas',
      intro: 'Ahora con otras notas. En cada ronda, encuentra la nota en las **3 octavas** y escucha cómo suena igual pero más grave o más aguda.',
      objetivo: {
        tipo: 'octavas',
        rondas: [{ nota: 'A' }, { nota: 'E' }, { nota: 'G' }],
      },
      piano: { startOctave: 3, octaves: 3 },
    },

    {
      tipo: 'texto',
      titulo: 'El mapa de las teclas negras',
      parrafos: [
        'En un piano real las teclas no tienen nombre escrito. El truco está en las **negras**: van en grupos de **2** y de **3**, una y otra vez.',
        '**Do** es la tecla blanca justo a la **izquierda del grupo de 2** negras.',
        '**Fa** es la tecla blanca justo a la **izquierda del grupo de 3** negras.',
        'Con esas dos referencias encuentras cualquier nota en cualquier octava, también en el Piano Roll de FL Studio.',
      ],
    },

    {
      tipo: 'tocar',
      titulo: 'Sin nombres: todas las Fa',
      intro: 'Este teclado no tiene etiquetas. Usa el mapa: **Fa** está a la izquierda del grupo de **3 negras**.',
      objetivo: {
        tipo: 'octavas',
        rondas: [
          { nota: 'F', pista: '**Fa** es la blanca justo a la izquierda del grupo de **3 teclas negras**.' },
          { nota: 'C', pista: '**Do** es la blanca justo a la izquierda del grupo de **2 teclas negras**.' },
        ],
      },
      piano: { startOctave: 3, octaves: 3, showLabels: false },
    },

    {
      tipo: 'elegir',
      titulo: '¿Misma nota u otra?',
      intro: 'Escucha cada pareja. ¿Es la misma nota en otra octava o son dos notas distintas?',
      rondas: [
        mismaNota('C4', 'C5', true, 'Es **Do4 → Do5**: misma nota, una octava arriba. Suenan “emparentadas”.'),
        mismaNota('C4', 'G4', false, 'Es **Do4 → Sol4**: dos notas distintas. Suenan bien juntas, pero no son la misma.'),
        mismaNota('A4', 'A3', true, 'Es **La4 → La3**: misma nota, una octava abajo (de 440 Hz a 220 Hz).'),
        mismaNota('E3', 'E5', true, 'Es **Mi3 → Mi5**: ¡dos octavas de distancia! Sigue siendo la misma nota.'),
        mismaNota('D4', 'D#5', false, 'Es **Re4 → Re♯5**: casi una octava, pero un semitono de más. Por eso suena “rara”, como desafinada.'),
      ],
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Cuántas notas distintas hay antes de que el ciclo se repita?',
          opciones: ['7', '12', '88'],
          correcta: 1,
          explicacion: 'Son **12**: 7 blancas y 5 negras. 88 son las teclas de un piano completo, que repite esas 12 en varias octavas.',
        },
        {
          pregunta: 'Do4 vibra a unos 262 Hz. ¿A cuánto vibra Do5?',
          opciones: ['Unos 131 Hz', 'Unos 274 Hz', 'Unos 523 Hz'],
          correcta: 2,
          explicacion: 'Una octava arriba es el **doble** de frecuencia: 262 × 2 ≈ **523 Hz**. 131 Hz sería Do3, una octava abajo.',
        },
        {
          pregunta: '¿Qué nota es la tecla blanca justo a la izquierda del grupo de 2 negras?',
          opciones: ['Do', 'Fa', 'Si'],
          correcta: 0,
          explicacion: 'Es **Do**. Fa está a la izquierda del grupo de 3 negras.',
        },
      ],
    },

    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'La misma melodía en distintas octavas. Las notas son las mismas; cambia la sensación.',
      lados: [
        {
          etiqueta: 'Una octava abajo',
          emociones: 'Cuerpo, calidez, seriedad',
          ejemplos: 'Una línea de bajo, un violonchelo, una voz grave que canta la melodía.',
          sonido: { etiqueta: 'Escuchar abajo', notas: melodia(3), intervalo: 0.35 },
        },
        {
          etiqueta: 'Una octava arriba',
          emociones: 'Brillo, ligereza, inocencia',
          ejemplos: 'Una caja de música, un glockenspiel, una melodía de videojuego.',
          sonido: { etiqueta: 'Escuchar arriba', notas: melodia(5), intervalo: 0.35 },
        },
        {
          etiqueta: 'Las dos a la vez',
          emociones: 'Fuerza, anchura, épica',
          ejemplos: 'Un estribillo que “explota”, el piano de una balada, los sintes de un drop.',
          sonido: { etiqueta: 'Escuchar doblada', notas: doblada(3, 5), intervalo: 0.35 },
        },
      ],
      nota: '**Doblar a la octava** (tocar la melodía en dos octavas a la vez) es un truco clásico para que un estribillo suene más grande sin cambiar ni una nota.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: octavas en el Piano Roll',
      minutos: 15,
      objetivo: 'Encontrar las 12 notas en el Piano Roll y mover una melodía de octava.',
      pasos: [
        'Abre FL Studio, crea un proyecto nuevo y abre el **Piano roll** del canal de piano (clic derecho en el canal → Piano roll).',
        'En el teclado vertical de la izquierda busca **C5** (el Do central en FL). Sube tecla a tecla hasta **C6** contando: deberían ser **12 teclas** antes de volver a C.',
        'Dibuja tres notas seguidas: **C4, C5 y C6**. Escúchalas con la barra espaciadora: misma nota, tres alturas.',
        'Borra todo (selecciona con Ctrl+A y pulsa Supr) y escribe una melodía corta de 6 a 8 notas.',
        'Selecciónala (Ctrl+A) y pulsa **Ctrl+↑** para subirla una octava; **Ctrl+↓** la baja. Escucha cómo cambia la sensación.',
        'Para **doblarla a la octava**: con las notas seleccionadas, mantén **Shift** y arrastra una de ellas 12 filas hacia arriba; se crea una copia. (Si no te sale, dibuja la copia a mano.)',
      ],
      consejo:
        'Recuerda: FL Studio numera las octavas una más que esta app. Su **C5** es nuestro **Do4** (el Do central). Las negras del Piano Roll siguen el mismo mapa: Do a la izquierda del grupo de 2, Fa a la izquierda del grupo de 3.',
      reflexion: '¿Cómo cambió tu melodía una octava arriba, una abajo y doblada? ¿Cuál te gustó más para un estribillo?',
    },
  ],
}
