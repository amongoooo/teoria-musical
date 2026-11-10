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
 * Reglas de los gestos de deslizar (ver useDeslizar.js y la skill de diseño):
 *  - zonaMuerta: px iniciales que casi no mueven nada (curva suave).
 *  - velocidad: px/ms a partir de los que un gesto corto cuenta como swipe.
 *  - retorno: fracción del umbral que hay que regresar para deshacer un paso ya dado (1/5).
 *  - goma: resistencia en los extremos.
 */
export const DESLIZAR = { zonaMuerta: 14, velocidad: 0.45, retorno: 0.2, goma: 0.35 }
