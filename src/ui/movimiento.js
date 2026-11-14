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
  // Tinte que se extiende bajo el vidrio del botón principal (BarraAccion): sin rebote y algo más pausado (~0,35 s)
  // para que se vea el borde degradado avanzar.
  tinte: { type: 'spring', stiffness: 160, damping: 26, mass: 0.8 },
  // Rebote de la flechita del gesto al llegar a «suelta para ir»: poca amortiguación, se nota que ya puede pasar.
  rebote: { type: 'spring', stiffness: 520, damping: 11, mass: 0.7 },
}

/** Cuánto se hunde algo al tocarlo. */
export const HUNDIR = { boton: 0.96, tarjeta: 0.98 }

/** Profundidad de cada ruta: sirve para saber si se avanza (entra por la derecha) o se vuelve. */
export function profundidad(ruta) {
  if (['inicio', 'aprender', 'practicar', 'herramientas'].includes(ruta.pagina)) return 0 // las 4 pestañas
  if (ruta.pagina === 'leccion' || ruta.pagina === 'prueba') return 2
  if (ruta.pagina === 'oido' || ruta.pagina === 'ritmo' || ruta.pagina === 'letras') return ruta.id ? 2 : 1
  if (ruta.pagina === 'vocabulario') return ruta.id ? 3 : 2
  if (ruta.pagina === 'curso') return ruta.id ? 2 : 1 // el curso y, más adentro, cada bloque
  return 1 // módulo y explorador del círculo
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

/** «Pop» más marcado (casilla que se consigue al tocar la tecla correcta). Uso: animate={ok ? POP : { scale: 1 }} transition={{ duration: 0.4 }} */
export const POP = { scale: [1, 1.14, 0.97, 1] }

/** Ms que una nota señalada (al sonar en «Escuchar…» o al tocar una casilla verde) queda iluminada en el teclado y en su casilla. */
export const BRILLO_MS = 550

/**
 * «Temblor» (useTemblor.js): algo que ya está hecho y se vuelve a pedir (casilla ya conseguida…).
 * Se mueve en x, en y y gira sobre su eje durante `duracion` s en total. Amplitud en cada eje = `px` / tamaño
 * en ese eje (un rectángulo acostado se mueve más en y que en x); giro = `grados` / √(ancho × alto) (lo chico
 * gira más). Cada movimiento (x, y, giro) empieza en un sentido al azar y con un desfase al azar de hasta
 * `desfase` s: dos objetos iguales tiemblan igual de fuerte pero a destiempo. `ida` es la forma de la oscilación
 * (fracciones de la amplitud, alternando sentido). Límites en `min`/`max`.
 */
export const TEMBLOR = {
  duracion: 0.25,
  desfase: 0.06,
  px: 300, // px²: 100 px de ancho → 3 px en x
  grados: 240, // °·px: un cuadrado de 80 px → 3°
  ida: [1, -0.6, 0.3, 0],
  min: { mover: 0.8, girar: 0.5 },
  max: { mover: 8, girar: 6 },
}

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
  // Tirar desde arriba (módulo anterior) solo si el dedo se apoya por debajo del título del módulo; sobre el
  // título o más arriba se deja al navegador recargar la página. recarga: respaldo si no hay título
  // (fracción de arriba de la pantalla que es zona de recarga: 0,1 = el 10 % de arriba).
  pagina: { umbralCelular: 0.6, umbralAncho: 320, umbralVertical: 240, recarga: 0.1 },
  // Gesto del botón principal de la lección (useGestoBoton.js): X = `umbral` × ancho del botón (mín. `umbralMin` px);
  // pulsación larga: `mantener` ms en un borde lateral de `borde` × ancho (mín. `bordeMin` px); a los `brillo` ms
  // empieza el brillo radial y la tarjeta va saliendo hasta quedar como el deslizamiento en «suelta para ir».
  boton: { umbral: 0.6, umbralMin: 160, mantener: 500, brillo: 120, borde: 0.22, bordeMin: 56 },
}
