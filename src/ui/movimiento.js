// Movimiento de la app: resortes tipo iOS compartidos por todos los componentes.
// Reglas completas en .claude/skills/diseno/SKILL.md
//
// Resortes (Framer Motion / paquete `motion`):
//  - PULSAR: respuesta al dedo, rápida y firme (botones, tarjetas).
//  - SUAVE: elementos que entran o cambian de tamaño (paneles, barras de progreso).
//  - PANTALLA: transición entre pantallas o pasos de lección.

export const RESORTE = {
  pulsar: { type: 'spring', stiffness: 600, damping: 32, mass: 0.6 },
  suave: { type: 'spring', stiffness: 320, damping: 30 },
  pantalla: { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 },
}

/** Cuánto se hunde algo al tocarlo. */
export const HUNDIR = { boton: 0.96, tarjeta: 0.98 }

/** Profundidad de cada ruta: sirve para saber si se avanza (entra por la derecha) o se vuelve. */
export function profundidad(ruta) {
  if (ruta.pagina === 'inicio') return 0
  if (ruta.pagina === 'leccion') return 2
  if (ruta.pagina === 'oido') return ruta.id ? 2 : 1
  return 1 // módulo
}

/** Variantes de pantalla: desliza 32 px en la dirección de la navegación y aparece. */
export const variantesPantalla = {
  entra: (dir) => ({ opacity: 0, x: dir * 32 }),
  quieta: { opacity: 1, x: 0 },
  sale: (dir) => ({ opacity: 0, x: dir * -32 }),
}

/** Entrada escalonada para listas (tarjetas de Inicio). */
export const lista = {
  oculta: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}
export const itemLista = {
  oculta: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: RESORTE.suave },
}

/** Algo nuevo dentro de un paso (pregunta, ronda) entra desde la derecha. Uso: <motion.div key={r} {...ENTRA_DERECHA}> */
export const ENTRA_DERECHA = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  transition: { ...RESORTE.pantalla, opacity: { duration: 0.2 } },
}

/** Aparece subiendo 16 px (paneles, botones que se desbloquean). */
export const SUBE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: RESORTE.suave,
}

/** «Salto» de celebración (respuesta correcta, casilla conseguida). Uso: animate={ok ? SALTO : { scale: 1 }} */
export const SALTO = { scale: [1, 1.05, 1] }

/**
 * Reglas de los gestos de deslizar (ver useDeslizar.js y la skill de diseño, sección 3b).
 * Fracciones de X (la distancia de un paso):
 *  - zonaMuerta: px desde donde se apoyó el dedo en los que NO se mueve nada.
 *  - inicio / resistencia: hasta el 30 % de X el contenido casi no se mueve (como mucho el 6,5 % de X).
 *  - sigueSale: ya siguiendo al dedo, por debajo del 26 % vuelve la resistencia (evita temblores en el 30 %).
 *  - iman: 50 %, igual en los dos sentidos: por encima se pega al vecino; por debajo, al de antes.
 *  - continuo: avance continuo ya pegado al vecino: [desde qué fracción de X, espera en ms entre islas].
 *  - velocidadMax / alcance: tope SUAVE de velocidad de lo automático (resortes del imán, pasos automáticos,
 *    soltar), en px/ms; crece `alcance` px/ms por cada px que se quede atrás. Lo que sigue al dedo no se frena.
 *  - veloz: [entra, sale] px/ms: con el dedo así de rápido, el contenido lo sigue sin resistencia ni paradas.
 *  - velocidad: px/ms a partir de los que un gesto corto cuenta como swipe (pasa uno).
 *  - goma: resistencia cuando no hay más (extremos).
 *  - umbralAncho / umbralCelular: X en pantallas anchas (px) y en el celular (fracción del ancho).
 *  - puntitos: separación entre puntitos de la barra (px, = X al arrastrar por ella), su zona muerta y su
 *    modo rápido (más bajo: los puntitos están mucho más juntos que las islas).
 *  - pagina: X del swipe de página (cambiar de módulo), lateral y vertical.
 */
export const DESLIZAR = {
  zonaMuerta: 14,
  inicio: 0.3,
  resistencia: 0.065,
  sigueSale: 0.26,
  iman: 0.5,
  continuo: [
    [0.75, 1000],
    [0.85, 700],
    [0.9, 500],
    [0.95, 350],
    [0.98, 250],
  ],
  velocidadMax: 1.2,
  alcance: 0.012,
  veloz: [0.8, 0.4],
  velocidad: 0.45,
  goma: 0.35,
  umbralAncho: 240,
  umbralCelular: 0.35,
  puntitos: { separacion: 44, zonaMuerta: 8, veloz: [0.25, 0.12] },
  // Swipe de página (cambiar de módulo): X más larga para que sea a propósito.
  // Lateral: 60 % del ancho en el celular (mín. 160 px) o 320 px en ancho; vertical (tirar más allá del borde): 240 px.
  // desdeAbajo: tirar desde arriba (módulo anterior) solo si el dedo se apoya por debajo del 75 % de la pantalla;
  // más arriba se deja al navegador recargar la página.
  pagina: { umbralCelular: 0.6, umbralAncho: 320, umbralVertical: 240, desdeAbajo: 0.75 },
}
