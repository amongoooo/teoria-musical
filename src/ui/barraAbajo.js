// La barra de abajo es UNA (fase 3 del rediseño): en las 4 pestañas es la barra de pestañas (components/BarraPestanas.jsx)
// y dentro de un camino (módulo, ruta, bloque) la de puntitos (BarraPuntitos de components/CaminoLecciones.jsx).
// Al pasar de una a otra, la que llega aparece EN SU SITIO (fundido + escala) mientras la otra se desvanece, en vez de
// subir desde abajo: así parece la misma píldora que se transforma.

/** ¿Está en pantalla la otra barra? (`[data-pestanas]` o `[data-puntitos]`). */
export const vieneDeLaOtra = (selector) => typeof document !== 'undefined' && Boolean(document.querySelector(selector))

/** Cómo entra una barra: en su sitio si viene de la otra; si no, sube desde abajo. */
export const entradaBarra = (otra) => (vieneDeLaOtra(otra) ? { opacity: 0, scale: 0.94 } : { y: '120%' })
