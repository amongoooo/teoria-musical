// Utilidades de color de la app (ver .claude/skills/diseno/SKILL.md, sección 2).
//
// Los colores de módulo vienen como variable (`var(--color-modulo-2)`, en src/content/modulos.js) y
// cada uno tiene sus variantes calculadas para cada tema en src/index.css (`-relleno`, `-tinta`,
// `-suave`). Para esos, los helpers devuelven la variante; para cualquier otro color, una mezcla.

const MODULO = /^var\(--color-modulo-(\d+)\)$/

/** Variante de un color de papel (`var(--color-modulo-N)` → `var(--color-modulo-N-<variante>)`), o null. */
const variante = (color, nombre) => {
  const m = MODULO.exec(String(color).trim())
  return m ? `var(--color-modulo-${m[1]}-${nombre})` : null
}

/** El color para FONDOS con texto blanco encima (`text-blanco`, contraste ≥ 4.5:1). */
export const oscuro = (color) => variante(color, 'relleno') ?? `color-mix(in oklab, ${color} 72%, black)`

/**
 * El color como TEXTO sobre el fondo de la página, una tarjeta o su fondo suave: oscurecido en el
 * tema claro y aclarado en el oscuro. Contraste ≥ 4.5:1 en ambos.
 */
export const tinta = (color) => variante(color, 'tinta') ?? `color-mix(in oklab, ${color} 72%, var(--mezcla-tinta, black))`

/** El color muy suave, para fondos de iconos, avisos y anillos (se mezcla con la superficie del tema). */
export const claro = (color) => variante(color, 'suave') ?? `color-mix(in oklab, ${color} 14%, var(--color-white))`

/** «Labio» sólido bajo islas y cuadritos (relieve táctil): el color con negro. */
export const labio = (color) => `color-mix(in oklab, ${color} 45%, black)`
