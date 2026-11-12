// Lección 1.1 — Qué es una nota: frecuencia y altura.
// Formato de los pasos: ver src/content/FORMATO.md
import { frecuencia, hz, nombre } from '../../theory/notas.js'

/** Ronda "¿cuál es más agudo?": el orden A/B se mezcla al azar. */
function parAgudo(grave, agudo) {
  return {
    pregunta: '¿Cuál de los dos sonidos es más agudo?',
    sonidos: [{ notas: [grave] }, { notas: [agudo] }],
    correcta: 1,
    mezclar: true,
    mostrarNotas: true,
    explicacion: `**${nombre(agudo)}** vibra a ${hz(frecuencia(agudo))} y **${nombre(grave)}** a ${hz(frecuencia(grave))}: más vibraciones por segundo, sonido más agudo.`,
  }
}

export default {
  id: '1.1',
  modulo: 1,
  titulo: 'Qué es una nota',
  subtitulo: 'Frecuencia y altura',
  minutos: 8,
  resumen: [
    'El sonido es **vibración**: ondas de presión que viajan por el aire.',
    'La **frecuencia** es cuántas vibraciones hay por segundo, en **hercios (Hz)**.',
    'Más frecuencia → sonido más **agudo**; menos frecuencia → más **grave**.',
    'Altura y volumen son distintos: una nota puede sonar suave o fuerte.',
    'Una **nota** es una altura con nombre: La4 = 440 Hz.',
    'En el piano lo grave está a la izquierda; en el Piano Roll, abajo.',
  ],
  pasos: [
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Toca cada tarjeta para escuchar el sonido. Puedes repetirlo las veces que quieras.',
      rondas: [
        {
          pregunta: '¿Cuál de los dos sonidos es más agudo?',
          sonidos: [{ notas: ['C3'] }, { notas: ['C5'] }],
          correcta: 1,
          explicacion:
            'El sonido B es más **agudo** (más “fino” y brillante) y el A es más **grave** (más “grueso”). Ya sabes distinguirlos de oído; ahora veamos qué los hace distintos.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'El sonido es vibración',
      parrafos: [
        'Cuando una cuerda, una membrana o tus cuerdas vocales **vibran**, empujan el aire. Esas pequeñas ondas de presión viajan hasta tu oído y tu cerebro las convierte en sonido.',
        'Lo que hace que un sonido sea grave o agudo es **qué tan rápido vibra**. Al número de vibraciones por segundo se le llama **frecuencia**, y se mide en **hercios (Hz)**.',
        '100 Hz = 100 vibraciones cada segundo. Pocas vibraciones → sonido grave. Muchas → sonido agudo.',
      ],
      nota: 'Tu oído capta, más o menos, de 20 Hz a 20 000 Hz. Un bombo vive abajo (50–100 Hz); un silbido, arriba (1000–3000 Hz).',
    },

    {
      tipo: 'frecuencia',
      titulo: 'Desliza la frecuencia',
      intro: 'Mantén el dedo en el recuadro y deslízalo de abajo (grave) hasta arriba (agudo).',
      min: 80,
      max: 1200,
    },

    {
      tipo: 'texto',
      titulo: 'Frecuencia y altura',
      parrafos: [
        'La **frecuencia** es el dato físico: cuántas vibraciones por segundo (Hz).',
        'La **altura** es cómo la percibimos: más grave o más aguda. A más frecuencia, más altura.',
        'Una **nota** es un sonido con una altura estable al que le ponemos nombre. Por ejemplo, la nota **La4** vibra a **440 Hz**: es la referencia con la que se afinan casi todos los instrumentos.',
      ],
      sonidos: [
        { etiqueta: 'La4 en piano', notas: ['A4'] },
        { etiqueta: '440 Hz, onda pura', frecuencia: 440 },
      ],
      nota: 'Las dos suenan a la misma altura aunque el “color” sea distinto. Ese color se llama timbre: lo verás más adelante.',
    },

    {
      tipo: 'tocar',
      titulo: 'El teclado: de grave a agudo',
      intro: 'En el piano, la **izquierda** es grave y la **derecha**, aguda. Toca 5 teclas distintas y escucha cómo sube.',
      objetivo: { tipo: 'explorar', cantidad: 5 },
      piano: { startOctave: 3, octaves: 3 },
    },

    {
      tipo: 'tocar',
      titulo: 'Encuentra los extremos',
      intro: 'Toca la tecla **más grave** y la **más aguda** de este teclado. En el celular, cambia de octava con la barra de abajo.',
      objetivo: { tipo: 'extremos' },
      piano: { startOctave: 3, octaves: 3 },
    },

    {
      tipo: 'elegir',
      titulo: '¿Cuál es más agudo?',
      intro: 'Cinco rondas. Cada vez los sonidos estarán más cerca entre sí: ¡afina el oído!',
      rondas: [
        parAgudo('C3', 'C5'),
        parAgudo('C4', 'G4'),
        parAgudo('E4', 'A4'),
        parAgudo('D4', 'E4'),
        parAgudo('F4', 'F#4'),
      ],
    },

    {
      tipo: 'tocar',
      titulo: 'Más agudo, más grave',
      objetivo: {
        tipo: 'comparar',
        rondas: [
          { referencia: 'G4', direccion: 'agudo' },
          { referencia: 'E4', direccion: 'grave' },
          { referencia: 'C5', direccion: 'agudo' },
        ],
      },
      piano: { startOctave: 4, octaves: 2 },
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: 'Una cuerda de guitarra empieza a vibrar más rápido. ¿Qué le pasa al sonido?',
          opciones: ['Se vuelve más agudo', 'Se vuelve más grave', 'Suena más fuerte'],
          correcta: 0,
          explicacion:
            'Más vibraciones por segundo = más frecuencia = sonido **más agudo**. Que suene más fuerte depende de con cuánta fuerza vibra, no de lo rápido.',
        },
        {
          pregunta: 'Escucha A y B. ¿Qué cambió entre los dos?',
          sonidos: [
            { etiqueta: 'A', notas: ['A4'], velocidad: 0.2 },
            { etiqueta: 'B', notas: ['A4'], velocidad: 1 },
          ],
          opciones: ['La altura', 'El volumen'],
          correcta: 1,
          explicacion:
            'Es la misma nota (La4, 440 Hz) tocada suave y fuerte. **Volumen** y **altura** son cosas distintas: un sonido puede ser fuerte y grave, o suave y agudo.',
        },
        {
          pregunta: '¿Qué sonido tiene más hercios (Hz)?',
          opciones: ['El bombo de una batería', 'Un silbido'],
          correcta: 1,
          explicacion:
            'El silbido es agudo, así que vibra muchas más veces por segundo (miles de Hz). El bombo es grave: apenas 50–100 Hz.',
        },
      ],
    },

    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Escucha la misma melodía en dos alturas muy distintas.',
      lados: [
        {
          etiqueta: 'Grave',
          emociones: 'Peso, calma, poder, oscuridad',
          ejemplos: 'El bajo, el 808 del trap, el bombo, la voz de un tráiler de cine.',
          sonido: { etiqueta: 'Escuchar en grave', notas: ['C2', 'E2', 'G2', 'C3'] },
        },
        {
          etiqueta: 'Agudo',
          emociones: 'Brillo, tensión, ligereza, alerta',
          ejemplos: 'Campanitas, hi-hats, un violín muy arriba, el “ping” de una notificación.',
          sonido: { etiqueta: 'Escuchar en agudo', notas: ['C6', 'E6', 'G6', 'C7'] },
        },
      ],
      nota: 'En producción se reparte el espacio por alturas: bombo y bajo dan el peso; pads, voces y hi-hats dan el aire. Una mezcla con todo en la misma zona suena “apretada”.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: arriba y abajo',
      minutos: 15,
      objetivo: 'Ver la altura en el Piano Roll y escribir tu primera melodía de 8 notas.',
      pasos: [
        'Abre FL Studio y crea un proyecto nuevo (File → New).',
        'En el Channel Rack, haz clic derecho sobre el canal de piano (FL Keys o el que tengas) → Piano roll.',
        'Mira el teclado vertical de la izquierda: **arriba es agudo y abajo es grave**. Cada fila es una tecla.',
        'Con clic izquierdo dibuja 8 notas que suban como una escalera (clic derecho borra). Dale a la barra espaciadora para escucharlas.',
        'Ahora haz que la melodía baje al final. ¿Cómo cambia la sensación?',
        'Anota el nombre de cada nota (aparece en el teclado: C5, D5…).',
      ],
      consejo:
        'FL Studio usa los nombres en inglés: C = Do, D = Re, E = Mi, F = Fa, G = Sol, A = La, B = Si. Y numera las octavas distinto: su C5 es el Do central, que en esta app es Do4.',
      reflexion: '¿Qué sentiste cuando la melodía subía? ¿Y cuando bajaba?',
    },
  ],
}
