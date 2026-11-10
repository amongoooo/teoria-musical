// Lección 2.1 — Pulso y tempo (abre el módulo 2 «Ritmo y groove»).
// Formato de los pasos: ver src/content/FORMATO.md (tipo `pulso` y sonidos `groove`).

/** Roll de batería: 3 filas (hi-hat, caja, bombo) × 8 casillas = 1 compás de 4 tiempos. */
const BATERIA = { filas: ['hat', 'snare', 'kick'], columnas: 8, porTiempo: 2, bpm: 90 }

const BEAT_BASICO = [
  ...[0, 4].map((inicio) => ({ nota: 'kick', inicio, duracion: 1 })),
  ...[2, 6].map((inicio) => ({ nota: 'snare', inicio, duracion: 1 })),
  ...Array.from({ length: 8 }, (_, inicio) => ({ nota: 'hat', inicio, duracion: 1 })),
]

export default {
  id: '2.1',
  modulo: 2,
  titulo: 'Pulso y tempo',
  subtitulo: 'El latido de la música y los BPM',
  minutos: 12,
  resumen: [
    'El **pulso** es el latido constante de la música: lo que sigues con el pie o la cabeza.',
    'El **tempo** es la velocidad de ese pulso y se mide en **BPM** (pulsos por minuto). 60 BPM = 1 pulso por segundo; 120 BPM = 2.',
    'Cada género tiene su zona: hip hop ~85–95, house ~120–128, trap ~130–150, drum and bass ~170–175.',
    'Un beat básico: **bombo** en los tiempos 1 y 3, **caja** en 2 y 4, **hi-hat** marcando las corcheas.',
    'Para averiguar el tempo de un tema, **marca el pulso** (tap tempo) y cuenta los BPM.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'El pulso: el latido de la música',
      parrafos: [
        'Casi toda la música tiene un **pulso**: un latido constante, como un reloj, que sigues sin pensar con el pie o la cabeza.',
        'Cada latido se llama **tiempo** (en inglés, *beat*). Los tiempos se agrupan de 4 en 4: «**1**, 2, 3, 4, **1**, 2, 3, 4…».',
        'Escucha primero solo el pulso (un clic por tiempo) y luego un beat de batería con el mismo pulso.',
      ],
      sonidos: [
        { etiqueta: 'Solo el pulso (clic)', groove: 'click', bpm: 90, compases: 2 },
        { etiqueta: 'Un beat con ese pulso', groove: 'basico', bpm: 90, compases: 2 },
      ],
      nota: 'El primer tiempo de cada grupo suena más fuerte en el clic: así se oye dónde empieza cada **compás**.',
    },

    {
      tipo: 'pulso',
      titulo: 'Toca al pulso',
      intro: 'Pulsa **Empezar** y toca el botón grande con cada clic.',
      objetivo: {
        tipo: 'seguir',
        rondas: [
          { pregunta: 'Toca con cada clic', bpm: 90, groove: 'click', meta: 8, mensaje: 'Con ayuda visual es fácil. Ahora, solo con el oído.' },
          { pregunta: 'Ahora sin ayuda visual, con un beat', bpm: 100, groove: 'basico', meta: 8, visual: false, mensaje: 'Seguir el pulso de un beat es lo mismo que mover la cabeza con una canción.' },
        ],
      },
    },

    {
      tipo: 'texto',
      titulo: 'Tempo y BPM',
      parrafos: [
        'El **tempo** es la **velocidad del pulso**. Se mide en **BPM**: *beats per minute*, pulsos por minuto.',
        '**60 BPM** = 1 pulso por segundo, como un reloj. **120 BPM** = 2 pulsos por segundo: el doble de rápido.',
        'Más BPM no cambia las notas ni el beat: solo los hace ir más deprisa o más despacio.',
      ],
      sonidos: [
        { etiqueta: '60 BPM (1 por segundo)', groove: 'click', bpm: 60, compases: 1 },
        { etiqueta: '120 BPM (2 por segundo)', groove: 'click', bpm: 120, compases: 2 },
      ],
      nota: 'No confundas **tempo** (BPM, velocidad de la canción) con **velocity** (fuerza de cada nota), que viste en la lección 1.4.',
    },

    {
      tipo: 'elegir',
      titulo: '¿Cuál va más rápido?',
      intro: 'Escucha los dos beats y elige.',
      rondas: [
        {
          pregunta: '¿Cuál tiene más BPM?',
          sonidos: [
            { groove: 'basico', bpm: 85, compases: 1 },
            { groove: 'basico', bpm: 128, compases: 2 },
          ],
          correcta: 1,
          mezclar: true,
          explicacion: 'Uno va a **85 BPM** (hip hop) y el otro a **128 BPM** (house): el segundo tiene muchos más pulsos por minuto.',
        },
        {
          pregunta: '¿Cuál va a 60 BPM, un pulso por segundo?',
          sonidos: [
            { groove: 'click', bpm: 60, compases: 1 },
            { groove: 'click', bpm: 80, compases: 1 },
          ],
          correcta: 0,
          mezclar: true,
          explicacion: 'A **60 BPM** hay un clic por segundo, como el tic-tac de un reloj. El otro iba a 80.',
        },
        {
          pregunta: '¿Cuál es más lento?',
          sonidos: [
            { groove: 'basico', bpm: 110, compases: 1 },
            { groove: 'basico', bpm: 95, compases: 1 },
          ],
          correcta: 1,
          mezclar: true,
          explicacion: 'Esta era difícil: **95** frente a **110 BPM**. Fíjate en la distancia entre bombo y caja.',
        },
      ],
    },

    {
      tipo: 'pulso',
      titulo: 'Cambia el tempo',
      intro: 'El mismo beat a distintos tempos. Toca cada uno para escucharlo (y otra vez para pararlo).',
      objetivo: {
        tipo: 'explorar',
        groove: 'basico',
        minimo: 3,
        tempos: [
          { bpm: 70, genero: 'Balada, lo-fi' },
          { bpm: 90, genero: 'Hip hop, reguetón' },
          { bpm: 124, genero: 'House' },
          { bpm: 140, genero: 'Trap, dubstep' },
          { bpm: 174, genero: 'Drum and bass' },
          { bpm: 110, genero: 'Pop, funk' },
        ],
        mensaje: 'Las mismas cuatro partes de batería pasan de relajadas a frenéticas solo cambiando los **BPM**.',
      },
    },

    {
      tipo: 'texto',
      titulo: 'Cada género tiene su tempo',
      parrafos: [
        'No es una ley, pero cada estilo suele vivir en una zona de tempo:',
        '**Lo-fi y baladas**: 60–80 · **Hip hop y reguetón**: 85–100 · **Pop**: 100–120 · **House**: 120–128 · **Techno**: 125–140 · **Trap**: 130–150 · **Drum and bass**: 170–175.',
        'Truco: el **trap** a 140 se siente lento porque la caja va **a medio tiempo** (cada 2 tiempos). Lo verás en la próxima lección.',
      ],
      nota: 'FL Studio abre los proyectos nuevos a **130 BPM**. Antes de grabar o dibujar nada, elige el tempo del estilo que quieres hacer.',
    },

    {
      tipo: 'pulso',
      titulo: '¿A cuántos BPM va?',
      intro: 'Marca el pulso tocando el botón (al menos 6 veces) y la app calcula los BPM. Es el **tap tempo** que tiene FL Studio.',
      objetivo: {
        tipo: 'tempo',
        rondas: [
          { bpm: 100, groove: 'basico' },
          { bpm: 124, groove: 'bombo' },
          { bpm: 75, groove: 'basico' },
        ],
      },
    },

    {
      tipo: 'pianoroll',
      titulo: 'Tu primer beat',
      intro: 'En FL Studio la batería también se escribe en una rejilla. Rellena los contornos: **bombo** en 1 y 3, **caja** en 2 y 4 y **hi-hat** en todas las casillas.',
      roll: BATERIA,
      objetivo: {
        tipo: 'copiar',
        fantasma: true,
        notas: BEAT_BASICO,
        explicacion: 'Este es **el** beat básico de la música popular. Pulsa **Reproducir**: bombo y caja marcan el pulso, el hi-hat lo divide en dos.',
      },
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué mide el BPM?',
          opciones: ['Cuántos pulsos hay en un minuto', 'Lo fuerte que suena la batería', 'Cuántas notas tiene la melodía'],
          correcta: 0,
          explicacion: '**BPM** = *beats per minute*: pulsos por minuto. Es la medida del **tempo**.',
        },
        {
          pregunta: 'A 120 BPM, ¿cuántos pulsos hay cada segundo?',
          opciones: ['1', '2', '120'],
          correcta: 1,
          explicacion: '120 pulsos ÷ 60 segundos = **2 pulsos por segundo**.',
        },
        {
          pregunta: '¿Qué tempo encaja mejor con un tema de house?',
          opciones: ['70 BPM', '124 BPM', '174 BPM'],
          correcta: 1,
          explicacion: 'El **house** suele ir entre **120 y 128 BPM**. 70 es de balada y 174 de drum and bass.',
        },
        {
          pregunta: 'En el beat básico, ¿dónde va la caja?',
          opciones: ['En los tiempos 1 y 3', 'En los tiempos 2 y 4', 'En todas las casillas'],
          correcta: 1,
          explicacion: 'La **caja** va en **2 y 4**; el **bombo**, en 1 y 3; el **hi-hat**, en todas las casillas.',
        },
      ],
    },

    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'El mismo beat, lento y rápido.',
      lados: [
        {
          etiqueta: 'Tempo lento',
          emociones: 'Calma, peso, introspección',
          ejemplos: 'Lo-fi para estudiar, una balada de R&B, el hip hop más relajado.',
          sonido: { etiqueta: 'Escuchar a 72 BPM', groove: 'basico', bpm: 72, compases: 2 },
        },
        {
          etiqueta: 'Tempo rápido',
          emociones: 'Energía, euforia, urgencia',
          ejemplos: 'Drum and bass, el clímax de un tema de festival, una persecución en una peli.',
          sonido: { etiqueta: 'Escuchar a 170 BPM', groove: 'basico', bpm: 170, compases: 4 },
        },
      ],
      nota: 'El tempo es la primera decisión de un tema: marca la **energía** antes que cualquier acorde o melodía.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: un beat a tres tempos',
      minutos: 15,
      objetivo: 'Programar el beat básico y sentir cómo cambia con el tempo.',
      pasos: [
        'Abre un proyecto nuevo. Arriba, en el **tempo** (pone 130), arrastra con el ratón hacia abajo o haz **clic derecho → Type in value** y escribe **90**.',
        'En el **Channel rack** busca un **Kick**, un **Clap** o **Snare** y un **Hat** (o arrástralos desde el navegador de sonidos).',
        'Programa el beat básico en los pasos: **kick** en los pasos 1 y 9, **snare** en 5 y 13, **hat** en los pasos impares (1, 3, 5…).',
        'Activa el **metrónomo** (el icono del reloj, o **Ctrl+M**) y dale a Play. Mueve la cabeza con el pulso.',
        'Sin tocar el beat, cambia el tempo a **124** y luego a **170**. ¿Qué estilo te sugiere cada uno?',
        'Bonus: busca un tema que te guste, haz **clic derecho en el tempo → Tap** y marca su pulso para averiguar sus BPM.',
      ],
      consejo: 'El Channel rack tiene **16 pasos** por compás (semicorcheas): cada tiempo son 4 pasos. Por eso la caja va en el 5 y el 13.',
      reflexion: '¿Con qué tempo te sonó mejor tu beat y por qué?',
    },
  ],
}
