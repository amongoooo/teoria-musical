// «Vidrio» (pedido del usuario): para lo que flota sobre el contenido —la barra de puntitos del camino y la
// cabecera de Módulo (casita, barra de progreso, Opciones), y los botones de Inicio/Atrás/Opciones—.
// Casi transparente, desenfoca lo que pasa por detrás, contorno blanco delgado, brillo de 1 px arriba (inset)
// y una sombra muy suave. En oscuro, el contorno blanco más tenue. `blanco` es blanco fijo (no cambia con el
// tema). Lleva `border`: quien lo usa solo pone la forma (rounded-full…). Única excepción aprobada al «nada de
// glassmorphism» de la skill de diseño.
export const VIDRIO = [
  'border border-blanco/80 bg-blanco/25 backdrop-blur-md backdrop-saturate-150',
  'shadow-[0_0_0_0.5px_rgb(16_18_28/0.12),0_6px_20px_rgb(16_18_28/0.10),inset_0_1px_0_rgb(255_255_255/0.7)]',
  'dark:border-blanco/30 dark:bg-blanco/[0.06]',
  'dark:shadow-[0_0_0_0.5px_rgb(0_0_0/0.4),0_6px_20px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.18)]',
].join(' ')
