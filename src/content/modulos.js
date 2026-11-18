// Mapa de los módulos del curso (según el plan; el orden de la lista es el orden en que se ven).
// `area` = su área principal (src/content/areas.js) y `acento` = el color de esa área (pedido del usuario: el color
// dice el tipo de ruta, no el módulo), como variable de src/index.css: `--color-armonia` (barras, bordes) y sus
// variantes `-relleno`, `-tinta` y `-suave`, que cambian con el tema. Usa los helpers de src/ui/color.js:
// oscuro() → relleno, tinta(), claro() → suave.
// `numero` es el id interno (no cambia: lo usan las URLs #/modulo/N y el progreso). Lo que se VE es el número dentro
// de su área (pedido del usuario, 2026-11-16): «Armonía 2», con lecciones A2.1, A2.2… (`nombreModulo`,
// `numeroEnArea` y `codigoLeccion` de content/index.js). Un módulo nuevo de un área = al final, con el siguiente numero.
// Cada lección tiene `id` ('1.1') y `titulo`. Si existe su archivo de contenido
// en `lecciones` (ver index.js), la lección está disponible; si no, "Próximamente".

export const MODULOS = [
  {
    numero: 1,
    titulo: 'Sonido, notas y teclado',
    descripcion: 'Altura, las 12 notas, octavas, sostenidos y bemoles, el Piano Roll.',
    siente: 'Agudo = brillo y tensión; grave = peso.',
    reto: 'Nombrar las 12 notas en el Piano Roll; melodía de 8 notas.',
    area: 'melodia',
    acento: 'var(--color-melodia)',
    lecciones: [
      { id: '1.1', titulo: 'Qué es una nota: frecuencia y altura' },
      { id: '1.2', titulo: 'Las 12 notas y la octava' },
      { id: '1.3', titulo: 'Teclas blancas y negras: sostenidos y bemoles' },
      { id: '1.4', titulo: 'Leer el Piano Roll' },
    ],
  },
  {
    numero: 2,
    titulo: 'Ritmo y groove',
    descripcion: 'Pulso, BPM, compás 4/4 y 3/4, figuras, síncopa, swing, ghost notes.',
    siente: 'El tempo y la síncopa definen la energía y el “bounce”.',
    reto: 'Un patrón de batería a 3 tempos; aplicar swing.',
    area: 'ritmo',
    acento: 'var(--color-ritmo)',
    lecciones: [
      { id: '2.1', titulo: 'Pulso y tempo' },
      { id: '2.2', titulo: 'Compás y tiempos fuertes' },
      { id: '2.3', titulo: 'Figuras: de redonda a semicorchea' },
      { id: '2.4', titulo: 'Síncopa y anticipación' },
      { id: '2.5', titulo: 'Swing, groove y velocity' },
    ],
  },
  {
    numero: 3,
    titulo: 'Intervalos y escalas',
    descripcion: 'Tono y semitono, intervalos, escala mayor y menor, grados, círculo de quintas, pentatónicas.',
    siente: 'Mayor = luminoso; menor = melancólico; cada intervalo tiene carácter.',
    reto: 'La misma melodía en mayor y en menor.',
    area: 'melodia',
    acento: 'var(--color-melodia)',
    lecciones: [
      { id: '3.1', titulo: 'Tono y semitono' },
      { id: '3.2', titulo: 'Los intervalos y su carácter' },
      { id: '3.3', titulo: 'La escala mayor' },
      { id: '3.4', titulo: 'La escala menor natural y la relativa' },
      { id: '3.5', titulo: 'Grados, tonalidad y círculo de quintas' },
      { id: '3.6', titulo: 'Pentatónicas' },
      { id: '3.7', titulo: 'Menor armónica y melódica' },
    ],
  },
  {
    numero: 4,
    titulo: 'Acordes',
    descripcion: 'Tríadas, acordes diatónicos, números romanos, inversiones, voicings.',
    siente: 'Mayor estable, menor íntimo, disminuido inquieto.',
    reto: 'Un pad con los 7 acordes de una tonalidad, en varias inversiones.',
    area: 'armonia',
    acento: 'var(--color-armonia)',
    lecciones: [
      { id: '4.1', titulo: 'Tríadas por terceras apiladas' },
      { id: '4.2', titulo: '¿Mayor o menor? Entrenamiento de oído' },
      { id: '4.3', titulo: 'Acordes diatónicos y números romanos' },
      { id: '4.4', titulo: 'Inversiones y bajo' },
      { id: '4.5', titulo: 'Voicings' },
    ],
  },
  {
    numero: 5,
    titulo: 'Armonía funcional y progresiones',
    descripcion: 'Tónica, subdominante, dominante; cadencias; las progresiones más usadas.',
    siente: 'La dominante pide volver a casa; la cadencia rota sorprende.',
    reto: '4 loops de 8 compases, uno por progresión, con bajo.',
    area: 'armonia',
    acento: 'var(--color-armonia)',
    lecciones: [
      { id: '5.1', titulo: 'Funciones: tónica, subdominante, dominante' },
      { id: '5.2', titulo: 'Tensión y resolución' },
      { id: '5.3', titulo: 'Cadencias' },
      { id: '5.4', titulo: 'Las progresiones pop' },
      { id: '5.5', titulo: 'I–vi–IV–V, ii–V–I y blues' },
      { id: '5.6', titulo: 'Ritmo armónico' },
      { id: '5.7', titulo: 'Análisis de canciones' },
    ],
  },
  {
    numero: 6,
    titulo: 'Melodía sobre armonía',
    descripcion: 'Notas del acorde y de paso, contorno, motivos, pregunta–respuesta, hooks.',
    siente: 'Saltos = emoción; pasos = calma; la nota fuera del acorde crea anhelo.',
    reto: 'Un hook sobre tu progresión favorita de Armonía 2.',
    area: 'melodia',
    acento: 'var(--color-melodia)',
    lecciones: [
      { id: '6.1', titulo: 'Notas del acorde y notas de paso' },
      { id: '6.2', titulo: 'Contorno: saltos y pasos' },
      { id: '6.3', titulo: 'Motivos y variación' },
      { id: '6.4', titulo: 'Pregunta–respuesta y frases' },
      { id: '6.5', titulo: 'Anatomía de un hook' },
    ],
  },
  {
    numero: 7,
    titulo: 'Color armónico',
    descripcion: 'Séptimas, novenas a trecenas, sus2/sus4, add9, conducción de voces.',
    siente: 'maj7 = nostalgia cálida; sus = suspenso; 9 = aire.',
    reto: 'Rearmonizar el loop de Armonía 2 en estilo lo-fi o neo-soul.',
    area: 'armonia',
    acento: 'var(--color-armonia)',
    lecciones: [
      { id: '7.1', titulo: 'Acordes de séptima' },
      { id: '7.2', titulo: 'Extensiones 9, 11 y 13' },
      { id: '7.3', titulo: 'sus2, sus4 y add9' },
      { id: '7.4', titulo: 'Conducción de voces' },
      { id: '7.5', titulo: 'Lo-fi, neo-soul y R&B' },
    ],
  },
  {
    numero: 8,
    titulo: 'Modos e intercambio modal',
    descripcion: 'Los 7 modos, préstamo modal, tercera de Picardía.',
    siente: 'Dórico = melancolía con esperanza; lidio = sueño; iv menor = agridulce.',
    reto: 'Una melodía en 3 modos; meter un iv menor en una progresión mayor.',
    area: 'armonia',
    acento: 'var(--color-armonia)',
    lecciones: [
      { id: '8.1', titulo: 'Los modos' },
      { id: '8.2', titulo: 'El color de cada modo' },
      { id: '8.3', titulo: 'Préstamo modal' },
      { id: '8.4', titulo: '♭VI–♭VII–I y tercera de Picardía' },
      { id: '8.5', titulo: 'Modos para cine y videojuegos' },
    ],
  },
  {
    numero: 9,
    titulo: 'Progresiones complejas',
    descripcion: 'Dominantes secundarias, sustitución tritonal, mediantes cromáticas, modulación.',
    siente: 'Sorpresa, épica, giro cinematográfico, el “levantón” final.',
    reto: '16 compases con una modulación y dos dominantes secundarias.',
    area: 'armonia',
    acento: 'var(--color-armonia)',
    lecciones: [
      { id: '9.1', titulo: 'Dominantes secundarias' },
      { id: '9.2', titulo: 'Cadenas de ii–V' },
      { id: '9.3', titulo: 'Sustitución tritonal y disminuidos de paso' },
      { id: '9.4', titulo: 'Mediantes cromáticas' },
      { id: '9.5', titulo: 'Cadencia andaluza, line cliché y pedal' },
      { id: '9.6', titulo: 'Modulación' },
      { id: '9.7', titulo: 'Rearmonización' },
    ],
  },
  // ÁREA PRODUCCIÓN (propuesta aprobada: https://claude.ai/artifact/EqP6ik7JikQGsfGUnek2uT): tres módulos nuevos que
  // van ANTES del 10 en esta lista (el orden de la lista es el que se ve: Producción 1, 2, 3), y el 10 «De la teoría a
  // la canción» queda como Producción 4. Sus `numero` (12, 13, 14) son ids internos y no cambian.
  {
    numero: 12, // se ve como «Producción 1» (lecciones P1.1…P1.5)
    titulo: 'Beats en FL Studio',
    descripcion: 'El Channel rack, el groove de cada género, hi-hats, el 808 y del patrón al beat.',
    siente: 'Cada sonido tiene un papel: el bombo pesa, la caja golpea, los hats empujan.',
    reto: 'Un beat de 8 compases con hats, 808 afinado y una variación.',
    area: 'produccion',
    acento: 'var(--color-produccion)',
    lecciones: [
      { id: '12.1', titulo: 'Anatomía de un beat' },
      { id: '12.2', titulo: 'El groove de cada género' },
      { id: '12.3', titulo: 'Hi-hats y rolls' },
      { id: '12.4', titulo: 'El 808: el bombo que canta' },
      { id: '12.5', titulo: 'Del patrón al beat' },
    ],
  },
  {
    numero: 13, // se ve como «Producción 2»
    titulo: 'Sound design',
    descripcion: 'Ondas y timbre, filtro, envolvente, LFO, samples y tu propio 808.',
    siente: 'El timbre es la cara del sonido: brillante, oscuro, suave o agresivo.',
    reto: 'Un preset tuyo, de la onda al efecto.',
    area: 'produccion',
    acento: 'var(--color-produccion)',
    lecciones: [
      { id: '13.1', titulo: 'Ondas y timbre' },
      { id: '13.2', titulo: 'El filtro' },
      { id: '13.3', titulo: 'La envolvente (ADSR)' },
      { id: '13.4', titulo: 'LFO y modulación' },
      { id: '13.5', titulo: 'Samplear y cortar' },
      { id: '13.6', titulo: 'Diseña tu 808 y tu pad' },
    ],
  },
  {
    numero: 14, // se ve como «Producción 3»
    titulo: 'Mezcla y máster',
    descripcion: 'Volumen, paneo, EQ, compresión, reverb, sidechain, máster y publicar.',
    siente: 'Una buena mezcla no se nota: todo se oye y nada estorba.',
    reto: 'Tu canción mezclada, masterizada y exportada.',
    area: 'produccion',
    acento: 'var(--color-produccion)',
    lecciones: [
      { id: '14.1', titulo: 'Volumen y headroom' },
      { id: '14.2', titulo: 'Paneo y estéreo' },
      { id: '14.3', titulo: 'EQ: cortar antes que subir' },
      { id: '14.4', titulo: 'Compresión' },
      { id: '14.5', titulo: 'Reverb y delay' },
      { id: '14.6', titulo: 'Sidechain' },
      { id: '14.7', titulo: 'El máster' },
      { id: '14.8', titulo: 'Exportar y publicar' },
    ],
  },
  {
    numero: 10, // se ve como «Producción 4»
    titulo: 'De la teoría a la canción',
    descripcion: 'Forma, arco de tensión, arreglo por capas, dinámica, sonido y emoción.',
    siente: 'La canción entera cuenta una historia emocional.',
    reto: 'Una canción de 2–3 min que parte de una emoción elegida.',
    area: 'produccion',
    acento: 'var(--color-produccion)',
    lecciones: [
      { id: '10.1', titulo: 'Forma de canción' },
      { id: '10.2', titulo: 'El arco emocional' },
      { id: '10.3', titulo: 'Arreglo por capas' },
      { id: '10.4', titulo: 'Sonido y emoción' },
      { id: '10.5', titulo: 'Proyecto final' },
    ],
  },
  {
    // Módulo de Letras (pedido del usuario, 2026-11-16): las lecciones L1–L5 de la ruta de letras, que ahora también
    // viven aquí (llevan `ruta` y `modulo`), y las que vengan de lírica en español.
    numero: 11, // se ve como «Letras 1» (lecciones L1.1…L1.5)
    titulo: 'Letras: rima, métrica y flow',
    descripcion: 'Rima consonante y asonante, esquemas, sílabas y sinalefa, multis y acentos en el pulso.',
    siente: 'La rima amarra el oído; la tónica en el pulso hace que el verso suene.',
    reto: '8 versos con esquema ABAB, acomodados en el Flow y grabados sobre un beat tuyo.',
    area: 'letras',
    acento: 'var(--color-letras)',
    lecciones: [
      { id: 'L1', titulo: 'Rima consonante y asonante' },
      { id: 'L2', titulo: 'Esquemas de rima' },
      { id: 'L3', titulo: 'Sílabas y sinalefa' },
      { id: 'L4', titulo: 'Multis' },
      { id: 'L5', titulo: 'Acentos en el pulso' },
    ],
  },
]
