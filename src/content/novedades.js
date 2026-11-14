// Novedades de la app (botón ⓘ arriba a la izquierda en Inicio): qué cambió en cada actualización y dónde verlo.
// La más nueva PRIMERO. Al terminar cada tarea, añade una entrada arriba (id = fecha + algo corto, único).
// Cada cosa: `texto` (corto, con **negritas**) y, si se puede ir a verla, `donde: { etiqueta, href }` (rutas de router.js).
// La versión exacta (v.1.AA.MM.DD.HHMM) sale sola de vite.config.js (`__VERSION_APP__`).

export const NOVEDADES = [
  {
    id: '2026-11-14-boton-vidrio',
    fecha: '14 nov 2026',
    titulo: 'Botón de vidrio',
    cosas: [
      {
        texto: 'El botón de abajo (**Continuar**, **Comprobar**, **Atrás**) **sigue siendo de vidrio** mientras lo presionas: ya no se vuelve opaco.',
        donde: { etiqueta: 'Probarlo en la 3.7', href: '#/leccion/3.7' },
      },
    ],
  },
  {
    id: '2026-11-14-menores',
    fecha: '14 nov 2026',
    titulo: 'Menor armónica y melódica',
    cosas: [
      {
        texto: 'Lección **3.7 «Menor armónica y melódica»**: el 7.º que sube para llegar a casa, el salto de tono y medio y la melódica que sube distinta. Con ella se completa el **Módulo 3**.',
        donde: { etiqueta: 'Abrir la 3.7', href: '#/leccion/3.7' },
      },
      {
        texto: 'En la fórmula de la armónica, el **T½** se escribe **Fa → Sol♯** (una 2.ª aumentada), como en la escala.',
        donde: { etiqueta: 'Ver el paso', href: '#/leccion/3.7' },
      },
    ],
  },
  {
    id: '2026-11-14-pentatonicas',
    fecha: '14 nov 2026',
    titulo: 'Pentatónicas',
    cosas: [
      {
        texto: 'Lección **3.6 «Pentatónicas»**: cinco notas que nunca chocan, las teclas negras, la pentatónica menor y un riff en el Piano Roll.',
        donde: { etiqueta: 'Abrir la 3.6', href: '#/leccion/3.6' },
      },
      {
        texto: 'En la fórmula aparece el salto **T½** (tono y medio): **salta dos teclas**, en oro como la S.',
        donde: { etiqueta: 'Ver el paso', href: '#/leccion/3.6' },
      },
    ],
  },
  {
    id: '2026-11-13-explorar',
    fecha: '13 nov 2026',
    titulo: 'Explorar más cómodo',
    cosas: [
      {
        texto: 'Al deslizar el dedo por la **barra de puntitos** sale un **cuadrito** detrás del vidrio que se pega a cada velocidad y, al soltar, vuelve al centro con rebote.',
        donde: { etiqueta: 'Ruta de acordes', href: '#/ruta/acordes' },
      },
      { texto: 'En Inicio, las **Rutas** van arriba, luego las **Prácticas** y hasta abajo los **Módulos**.', donde: { etiqueta: 'Ir a Inicio', href: '#/' } },
      {
        texto: 'Los **puntitos** de abajo siguen a las islas que ves: se inflan un poco y, si son muchos, la barra se corre al bajar la página.',
        donde: { etiqueta: 'Ruta de acordes', href: '#/ruta/acordes' },
      },
      {
        texto: '«**Practicar**» desde una ruta abre el entrenamiento con la **dificultad recomendada** para ese punto del curso.',
        donde: { etiqueta: 'Ruta de ritmo', href: '#/ruta/ritmo' },
      },
      { texto: 'Para pasar de módulo o de ruta tirando de la página, empieza el gesto **ya en el borde** (arriba o abajo del todo).' },
      { texto: 'En la computadora, la primera y la última isla quedan **enteras** y los lados se desvanecen **más leve**.', donde: { etiqueta: 'Ruta de letras', href: '#/ruta/letras' } },
    ],
  },
  {
    id: '2026-11-13-voicings',
    fecha: '13 nov 2026',
    titulo: 'Voicings y novedades',
    cosas: [
      {
        texto: 'Lección **4.5 «Voicings»**: cerrado y abierto, duplicar, el bajo aparte y acordes que se mueven poco. Cierra el **Módulo 4**.',
        donde: { etiqueta: 'Abrir la 4.5', href: '#/leccion/4.5' },
      },
      {
        texto: 'Ejercicio nuevo **«Abre el acorde»**: la 3.ª sube una octava y aquí sí cuenta la octava.',
        donde: { etiqueta: 'Ver el paso', href: '#/leccion/4.5' },
      },
      {
        texto: 'La **ruta de acordes** ya está completa: la 4.5 dejó de decir «Llega pronto».',
        donde: { etiqueta: 'Ruta de acordes', href: '#/ruta/acordes' },
      },
      { texto: 'El botón de **Opciones** ahora es un **engrane**.' },
      { texto: 'En la computadora, los lados del camino de islas se desvanecen **más suave**.', donde: { etiqueta: 'Módulo 2', href: '#/modulo/2' } },
      { texto: 'Este botón **ⓘ**: la versión, qué hay de nuevo y dónde verlo.' },
    ],
  },
  {
    id: '2026-11-13-diatonicos',
    fecha: '13 nov 2026',
    titulo: 'Acordes en la tonalidad',
    cosas: [
      {
        texto: 'Lección **4.3**: acordes diatónicos y **números romanos** (I–V–vi–IV en Do y en Sol).',
        donde: { etiqueta: 'Abrir la 4.3', href: '#/leccion/4.3' },
      },
      {
        texto: 'Lección **4.4**: **inversiones** (C/E, C/G), el bajo que camina y el bajo aparte.',
        donde: { etiqueta: 'Abrir la 4.4', href: '#/leccion/4.4' },
      },
    ],
  },
  {
    id: '2026-11-13-regla',
    fecha: '13 nov 2026',
    titulo: 'Rutas más cómodas',
    cosas: [
      {
        texto: 'En el celular, la **barra de puntitos** de las rutas largas es una regla: deja el dedo a un lado y avanza sola.',
        donde: { etiqueta: 'Ruta de acordes', href: '#/ruta/acordes' },
      },
      { texto: 'Las **rutas van en bucle**: desliza de lado para pasar de una a otra sin tope.', donde: { etiqueta: 'Ruta de ritmo', href: '#/ruta/ritmo' } },
      { texto: 'Las rutas se dividen en **tramos**, con un letrero y su avance.', donde: { etiqueta: 'Ruta de acordes', href: '#/ruta/acordes' } },
    ],
  },
  {
    id: '2026-11-13-triadas',
    fecha: '13 nov 2026',
    titulo: 'Empieza el Módulo 4',
    cosas: [
      {
        texto: 'Lecciones **4.1 «Tríadas»** y **4.2 «¿Mayor o menor?»**, con el ejercicio **«Construir un acorde»**.',
        donde: { etiqueta: 'Módulo 4', href: '#/modulo/4' },
      },
      { texto: '**Ruta de letras**: 5 lecciones de rima, sílabas y flow.', donde: { etiqueta: 'Ruta de letras', href: '#/ruta/letras' } },
    ],
  },
]
