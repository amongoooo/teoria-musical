// Novedades de la app (botón ⓘ arriba a la izquierda en Inicio): qué cambió en cada actualización y dónde verlo.
// La más nueva PRIMERO. Al terminar cada tarea, añade una entrada arriba (id = fecha + algo corto, único).
// Cada cosa: `texto` (corto, con **negritas**) y, si se puede ir a verla, `donde: { etiqueta, href }` (rutas de router.js).
// La versión exacta (v.1.AA.MM.DD.HHMM) sale sola de vite.config.js (`__VERSION_APP__`).

export const NOVEDADES = [
  {
    id: '2026-11-14-antes-te-conviene',
    fecha: '14 nov 2026',
    titulo: 'Antes te conviene',
    cosas: [
      {
        texto: 'Si abres una lección y te falta algo que necesita, primero sale **«Antes te conviene»** con la lección que falta. Puedes ir a ella, probar **«¿Ya lo sabes?»** o seguir de todos modos.',
        donde: { etiqueta: 'Probarlo en la 4.3', href: '#/leccion/4.3' },
      },
      {
        texto: 'En las rutas y en el Curso completo no sale: allí el camino ya va en orden.',
      },
    ],
  },
  {
    id: '2026-11-14-colores-por-area',
    fecha: '14 nov 2026',
    titulo: 'Colores por área y respuestas que se mueven',
    cosas: [
      {
        texto: 'Las respuestas de las lecciones **cambian de lugar** cada vez que abres un paso: ya no te aprendes dónde está la buena.',
      },
      {
        texto: 'Ahora el color dice el **tipo de ruta**: Ritmo naranja, Letras rosa, **Armonía violeta intenso**, Melodía turquesa y, más adelante, Producción en rojo coral.',
        donde: { etiqueta: 'Ver la ruta de acordes', href: '#/ruta/acordes' },
      },
    ],
  },
  {
    id: '2026-11-14-tu-camino',
    fecha: '14 nov 2026',
    titulo: 'Tu camino más simple',
    cosas: [
      {
        texto: 'En **Tu camino** del Curso completo, cada bloque es una tarjeta chica: **«Bloque N»**, su título y la **barra de progreso**. Tócala para entrar directo.',
        donde: { etiqueta: 'Abrir el curso', href: '#/curso' },
      },
      {
        texto: 'Dentro de un bloque, la casita cambió por una **flechita ‹** que te regresa al Curso completo.',
        donde: { etiqueta: 'Ver el bloque 1', href: '#/curso/bloque/1' },
      },
    ],
  },
  {
    id: '2026-11-14-carrusel-modulos',
    fecha: '14 nov 2026',
    titulo: 'Módulos y prácticas',
    cosas: [
      {
        texto: 'En las **rutas** y los **bloques del curso**, el botón de cuadritos sobre la barra de puntitos ahora **se resalta** y cambia las islas por los **módulos** y las **prácticas** en tarjetas grandes.',
        donde: { etiqueta: 'Abrir la ruta de acordes', href: '#/ruta/acordes' },
      },
      {
        texto: 'Como un **juego de cartas**: la fila elegida va arriba en grande y la otra espera **abajo, chiquita**. Desliza **arriba o abajo** para sacar la de abajo (cada fila guarda su tarjeta) y **de lado** para pasar de tarjeta. Toca la del centro o **sube el botón** para abrirla; tócalo otra vez para volver a las islas.',
      },
      {
        texto: 'La **barra de puntitos** sigue a lo que ves: un puntito por módulo o por práctica, con las prácticas **agrupadas por tipo**. Deslizar la barra arriba o abajo también cambia de fila.',
      },
    ],
  },
  {
    id: '2026-11-14-curso-completo',
    fecha: '14 nov 2026',
    titulo: 'Curso completo',
    cosas: [
      {
        texto: 'Nuevo en Inicio: **Curso completo**, las tres rutas a la par en **bloques** (40 pasos). Un anillo de tres colores dice cuánto llevas.',
        donde: { etiqueta: 'Abrir el curso', href: '#/curso' },
      },
      {
        texto: 'Cada bloque se abre como un **camino de islas**, cada isla del color de su ruta. La **3.6** y la **3.7** van como **opcionales**.',
        donde: { etiqueta: 'Ver el bloque 1', href: '#/curso/bloque/1' },
      },
      {
        texto: 'Los cuadritos de los **módulos** y las **rutas** entran directo. **«¿Ya lo sabes?»** ahora está en el globo de la **insignia** (el primer cuadro del camino).',
        donde: { etiqueta: 'Probar con el módulo 3', href: '#/modulo/3' },
      },
      {
        texto: 'Ya no sale el **cuadrito gris** bajo la barra de puntitos al deslizarla.',
      },
    ],
  },
  {
    id: '2026-11-14-regla-arrastre',
    fecha: '14 nov 2026',
    titulo: 'Barra de puntitos que se arrastra',
    cosas: [
      {
        texto: 'En el celular, **desliza la barra de puntitos** de una ruta: los puntitos **siguen a tu dedo** y, al soltar, siempre queda **uno en medio** (si la lanzas, sigue un poco más).',
        donde: { etiqueta: 'Probarla en la ruta de acordes', href: '#/ruta/acordes' },
      },
      {
        texto: 'Arreglo: **tocar un puntito** abre siempre ese puntito.',
      },
    ],
  },
  {
    id: '2026-11-14-ya-lo-sabes',
    fecha: '14 nov 2026',
    titulo: '¿Ya lo sabes?',
    cosas: [
      {
        texto: 'Al tocar un **módulo** sube una hoja con **«¿Ya lo sabes?»**: una pregunta por lección y puedes **saltar** las que ya dominas.',
        donde: { etiqueta: 'Probar con el módulo 3', href: '#/prueba/modulo/3' },
      },
      {
        texto: 'En las **rutas**, la prueba es la del **tramo** en el que vas (toca otro tramo para cambiarla).',
        donde: { etiqueta: 'Ver la ruta de acordes', href: '#/ruta/acordes' },
      },
      {
        texto: 'Las lecciones saltadas llevan el **✓ en contorno** y cuentan como hechas: abren la siguiente, avanzan la ruta y abren sus herramientas.',
      },
    ],
  },
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
