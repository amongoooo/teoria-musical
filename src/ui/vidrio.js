// «Vidrio» (pedido del usuario): el material de LA APP —lo que flota fijo sobre el contenido y sirve para
// navegar, salir, ajustar o avanzar—: cabeceras de Módulo y de lección, barra de puntitos, botones de
// Inicio/Atrás/Opciones/Cerrar y la barra de abajo de las lecciones. El contenido (opciones de respuesta, piano,
// roll…) es superficie sólida y el significado (módulo, bien, fíjate) va en color sólido. Ver la skill de diseño.
//
// Con Opciones → Vidrio → «Opaco» (clase `opaco` en <html>), todo lo que lleva la clase `vidrio` pasa a
// superficie sólida, sin desenfoque (reglas en src/index.css).

/**
 * Botones y píldoras: casi transparente, desenfoca lo que pasa por detrás, contorno blanco delgado, brillo de
 * 1 px arriba (inset) y una sombra muy suave. `blanco` es blanco fijo (no cambia con el tema). Lleva `border`:
 * quien lo usa solo pone la forma (rounded-full…). Sobre una tarjeta de color, añade `vidrio-color`.
 */
export const VIDRIO = [
  'vidrio border border-blanco/80 bg-blanco/25 backdrop-blur-md backdrop-saturate-150',
  'shadow-[0_0_0_0.5px_rgb(16_18_28/0.12),0_6px_20px_rgb(16_18_28/0.10),inset_0_1px_0_rgb(255_255_255/0.7)]',
  'dark:border-blanco/30 dark:bg-blanco/[0.06]',
  'dark:shadow-[0_0_0_0.5px_rgb(0_0_0/0.4),0_6px_20px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.18)]',
].join(' ')

/**
 * Paneles con texto (la barra de abajo de las lecciones, indicadores que flotan): el mismo vidrio pero más
 * esmerilado, teñido con la superficie del tema (`bg-white` = superficie también en oscuro), para que el texto
 * se lea aunque pase por detrás el piano o el roll.
 */
export const VIDRIO_PANEL = [
  'vidrio border border-blanco/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150',
  'shadow-[0_0_0_0.5px_rgb(16_18_28/0.12),0_8px_28px_rgb(16_18_28/0.14),inset_0_1px_0_rgb(255_255_255/0.7)]',
  'dark:border-blanco/15',
  'dark:shadow-[0_0_0_0.5px_rgb(0_0_0/0.45),0_8px_28px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.12)]',
].join(' ')

/**
 * El botón principal de la lección (BarraAccion): un vidrio fino SOBRE una tarjeta de color (gris claro = desactivado,
 * oscuro = listo, verde = acierto), así parece que el vidrio cambia de color. Más transparente que VIDRIO para que el
 * color se vea; brillo de 1 px arriba y una línea de sombra abajo (relieve). En «Opaco» lleva `vidrio-color` (velo blanco).
 * Sin `backdrop-blur`: debajo solo hay color liso y, recortado por el botón, el desenfoque aclaraba sus bordes; lo que
 * se mueve debajo (la tarjeta del gesto) lleva su propio desenfoque.
 */
export const VIDRIO_BOTON = [
  'vidrio vidrio-color border border-blanco/60 bg-blanco/[0.14]',
  'shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_0_-1px_0_rgb(16_18_28/0.10)]',
  'dark:border-blanco/25 dark:bg-blanco/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),inset_0_-1px_0_rgb(0_0_0/0.25)]',
].join(' ')
