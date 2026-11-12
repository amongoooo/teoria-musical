// Lección 1.3 — Teclas blancas y negras: sostenidos y bemoles.
// Formato de los pasos: ver src/content/FORMATO.md

/** Ronda "¿semitono o tono?" a partir de dos notas. */
function semitonoOTono(a, b, semitono, explicacion) {
  return {
    pregunta: '¿Se movió un semitono o un tono?',
    sonidos: [{ etiqueta: 'Escuchar', notas: [a, b], intervalo: 0.6 }],
    opciones: ['Un semitono (paso mínimo)', 'Un tono (dos semitonos)'],
    correcta: semitono ? 0 : 1,
    explicacion,
  }
}

export default {
  id: '1.3',
  modulo: 1,
  titulo: 'Teclas blancas y negras',
  subtitulo: 'Sostenidos, bemoles y semitonos',
  minutos: 10,
  resumen: [
    'Un **semitono** es la distancia entre dos teclas vecinas (blanca o negra): el paso más pequeño del piano.',
    'Un **tono** son **dos semitonos**: Do → Re, Fa → Sol…',
    '**Mi–Fa** y **Si–Do** no tienen negra en medio: ahí las blancas están a solo un semitono.',
    'El **sostenido ♯** sube una nota un semitono; el **bemol ♭** la baja un semitono.',
    'Cada negra tiene dos nombres: **Do♯ = Re♭**, Re♯ = Mi♭, Fa♯ = Sol♭, Sol♯ = La♭, La♯ = Si♭. Eso es la **enarmonía**.',
    'Para encontrar **Do♯/Re♭**: es la **primera negra del grupo de 2**, entre Do y Re.',
  ],
  pasos: [
    {
      tipo: 'elegir',
      titulo: 'Empecemos con el oído',
      intro: 'Las dos tarjetas empiezan en Do y suben a otra nota. Una sube lo mínimo posible.',
      rondas: [
        {
          pregunta: '¿Cuál sube el paso más pequeño?',
          sonidos: [
            { notas: ['C4', 'C#4'], intervalo: 0.6 },
            { notas: ['C4', 'D4'], intervalo: 0.6 },
          ],
          correcta: 0,
          mezclar: true,
          explicacion:
            '**Do → Do♯** es el paso más pequeño: un **semitono**, de una tecla a su vecina negra. **Do → Re** salta el doble: un **tono**.',
        },
      ],
    },

    {
      tipo: 'texto',
      titulo: 'Semitono y tono',
      parrafos: [
        'Un **semitono** es la distancia entre una tecla y la de al lado, **sin saltarse ninguna**, sea blanca o negra. Es el paso más pequeño del piano.',
        'Un **tono** son **dos semitonos**: de Do a Re hay un tono, porque en medio queda una negra.',
        'Fíjate en el teclado: entre **Mi y Fa** y entre **Si y Do** no hay negra. Ahí dos teclas blancas están a solo **un semitono**.',
      ],
      sonidos: [
        { etiqueta: 'Semitono: Do → Do♯', notas: ['C4', 'C#4'], intervalo: 0.6 },
        { etiqueta: 'Tono: Do → Re', notas: ['C4', 'D4'], intervalo: 0.6 },
        { etiqueta: 'Semitono entre blancas: Mi → Fa', notas: ['E4', 'F4'], intervalo: 0.6 },
      ],
      nota: 'En una octava hay **12 semitonos**: por eso hay 12 notas.',
    },

    {
      tipo: 'texto',
      titulo: 'Sostenidos ♯ y bemoles ♭',
      parrafos: [
        'Las teclas negras toman el nombre de sus vecinas blancas:',
        'El **sostenido ♯** **sube** una nota un semitono. **Do♯** es la tecla justo a la **derecha** de Do: la negra que hay entre Do y Re.',
        'El **bemol ♭** **baja** una nota un semitono. **Re♭** es la tecla justo a la **izquierda** de Re… ¡la misma negra!',
        'Así que **Do♯ y Re♭ son la misma tecla** y suenan exactamente igual. Es la primera negra del **grupo de 2**.',
      ],
      sonidos: [
        { etiqueta: 'Do → Do♯ (sube)', notas: ['C4', 'C#4'], intervalo: 0.6 },
        { etiqueta: 'Re → Re♭ (baja)', notas: ['D4', 'Db4'], intervalo: 0.6 },
      ],
    },

    {
      tipo: 'tocar',
      titulo: 'Encuentra la nota',
      objetivo: {
        tipo: 'octavas',
        rondas: [
          {
            nota: 'C#',
            pista: '**Do♯** es la **negra** justo a la derecha de **Do**: la primera del grupo de **2 negras**.',
          },
        ],
      },
      piano: { startOctave: 3, octaves: 3 },
    },

    {
      tipo: 'tocar',
      titulo: 'Encuentra la nota',
      objetivo: {
        tipo: 'octavas',
        rondas: [
          {
            nota: 'Db',
            pista: '**Re♭** es la negra justo a la izquierda de **Re**… la misma tecla que **Do♯**: la primera del grupo de **2 negras**.',
          },
        ],
      },
      piano: { startOctave: 3, octaves: 3, showLabels: false },
    },

    {
      tipo: 'texto',
      titulo: 'Enarmonía: dos nombres, un sonido',
      parrafos: [
        'Cuando dos nombres suenan igual se llaman **enarmónicos**. Cada tecla negra tiene dos:',
        '**Do♯ = Re♭** · **Re♯ = Mi♭** · **Fa♯ = Sol♭** · **Sol♯ = La♭** · **La♯ = Si♭**',
        '¿Por qué dos nombres? Depende de la **escala** en la que estés: a veces se escribe Fa♯ y a veces Sol♭. Lo verás en el módulo de escalas.',
        'Curiosidad: como Mi–Fa y Si–Do están a un semitono, **Mi♯ = Fa** y **Si♯ = Do**. Raro, pero existe.',
      ],
      sonidos: [
        { etiqueta: 'Do♯4 y luego Re♭4', notas: ['C#4', 'Db4'], intervalo: 0.8 },
        { etiqueta: 'Fa♯4 y luego Sol♭4', notas: ['F#4', 'Gb4'], intervalo: 0.8 },
      ],
      nota: 'FL Studio y la mayoría de programas nombran las negras con **sostenidos** (C#, D#, F#…). Si ves «Db» en una partitura, búscala como C#.',
    },

    {
      tipo: 'tocar',
      titulo: 'Encuentra la nota',
      objetivo: {
        tipo: 'octavas',
        rondas: [
          { nota: 'F#', pista: '**Fa♯** es la negra justo a la derecha de **Fa**: la primera del grupo de **3 negras**.' },
          { nota: 'Bb', pista: '**Si♭** es la negra justo a la izquierda de **Si**: la última del grupo de **3 negras**.' },
          { nota: 'Eb', pista: '**Mi♭** (= Re♯) es la negra justo a la izquierda de **Mi**: la segunda del grupo de **2 negras**.' },
        ],
      },
      piano: { startOctave: 3, octaves: 3, showLabels: false },
    },

    {
      tipo: 'elegir',
      titulo: '¿Semitono o tono?',
      intro: 'Escucha cada pareja. ¿Se movió un paso mínimo o el doble?',
      rondas: [
        semitonoOTono('C4', 'C#4', true, 'Es **Do → Do♯**: un semitono, a la tecla de al lado.'),
        semitonoOTono('G4', 'A4', false, 'Es **Sol → La**: un tono, porque en medio queda Sol♯.'),
        semitonoOTono('E4', 'F4', true, 'Es **Mi → Fa**: dos blancas, pero sin negra en medio. Un semitono.'),
        semitonoOTono('A4', 'G4', false, 'Es **La → Sol**, bajando: un tono.'),
        semitonoOTono('C5', 'B4', true, 'Es **Do → Si**, bajando: otra pareja de blancas a un semitono.'),
      ],
    },

    {
      tipo: 'elegir',
      titulo: 'Comprueba la idea',
      rondas: [
        {
          pregunta: '¿Qué hace un sostenido ♯?',
          opciones: ['Sube la nota un semitono', 'Baja la nota un semitono', 'Sube la nota una octava'],
          correcta: 0,
          explicacion: 'El **♯ sube** un semitono (a la tecla de la derecha). El **♭ baja** un semitono.',
        },
        {
          pregunta: '¿Qué otro nombre tiene Do♯?',
          opciones: ['Re♯', 'Re♭', 'Si♭'],
          correcta: 1,
          explicacion: '**Do♯ = Re♭**: es la misma tecla negra, entre Do y Re. Son **enarmónicas**.',
        },
        {
          pregunta: '¿Entre qué blancas NO hay tecla negra?',
          opciones: ['Do–Re y Fa–Sol', 'Mi–Fa y Si–Do', 'Sol–La y La–Si'],
          correcta: 1,
          explicacion: 'Entre **Mi–Fa** y **Si–Do** no hay negra: esas blancas están a un **semitono**.',
        },
        {
          pregunta: '¿Cuántos semitonos hay de Do a Re?',
          opciones: ['1', '2', '3'],
          correcta: 1,
          explicacion: 'Son **2** (Do → Do♯ → Re), es decir, **un tono**.',
        },
        {
          pregunta: 'Sol♯ y La♭…',
          opciones: ['Suenan igual: son la misma tecla', 'Sol♯ es más agudo', 'La♭ es más agudo'],
          correcta: 0,
          explicacion: 'Son la **misma tecla negra** entre Sol y La: suenan exactamente igual.',
        },
      ],
    },

    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      intro: 'Un semitono y un tono, repetidos. La diferencia es pequeña en el teclado, pero enorme en la emoción.',
      lados: [
        {
          etiqueta: 'Semitono repetido',
          emociones: 'Tensión, suspenso, peligro',
          ejemplos: 'El tema de un tiburón que se acerca, una escena de terror, un bajo oscuro de trap.',
          sonido: { etiqueta: 'Escuchar semitono', notas: ['E2', 'F2', 'E2', 'F2', 'E2', 'F2', 'E2', 'F2'], intervalo: 0.32 },
        },
        {
          etiqueta: 'Tono repetido',
          emociones: 'Movimiento, apertura, calma',
          ejemplos: 'Una melodía infantil, un riff relajado, un vaivén que no inquieta.',
          sonido: { etiqueta: 'Escuchar tono', notas: ['C4', 'D4', 'C4', 'D4', 'C4', 'D4', 'C4', 'D4'], intervalo: 0.32 },
        },
      ],
      nota: 'El semitono es la herramienta de la **tensión**: una nota que «roza» a otra pide moverse. Lo usarás mucho en melodías y acordes.',
    },

    {
      tipo: 'reto',
      titulo: 'Reto en FL Studio: semitonos en el Piano Roll',
      minutos: 15,
      objetivo: 'Encontrar las teclas negras en el Piano Roll y sentir la diferencia entre semitono y tono.',
      pasos: [
        'Abre el **Piano roll** de un canal de piano. Busca **C5** (nuestro Do4) y la fila de justo encima: **C#5**. Esa es Do♯/Re♭.',
        'Dibuja las **12 notas seguidas** de C5 a B5, una por fila, sin saltarte ninguna. Escúchalas: cada paso es un semitono.',
        'Borra todo. Dibuja un bajo grave que alterne **E3 y F3** (semitono), 8 notas. Luego cópialo y cámbialo por **C3 y D3** (tono). Compara la sensación.',
        'Escribe una melodía corta de 6 a 8 notas solo con teclas blancas.',
        'Selecciónala (Ctrl+A) y súbela **un semitono** con **Shift+↑** (o arrástrala una fila). Ahora usa teclas negras: escucha cómo cambia el color.',
      ],
      consejo:
        'FL Studio nombra las negras con sostenidos: **C#, D#, F#, G#, A#**. Si un tutorial dice «Eb», busca **D#**: es la misma tecla.',
      reflexion: '¿Qué sentiste con el bajo de semitono comparado con el de tono? ¿Dónde usarías cada uno?',
    },
  ],
}
