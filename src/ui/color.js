// Utilidades de color de la app (ver .claude/skills/diseno/SKILL.md).

/** El acento oscurecido para FONDOS con texto blanco encima (`text-blanco`, contraste ≥ 4.5:1). Igual en los dos temas. */
export const oscuro = (color) => `color-mix(in oklab, ${color} 72%, black)`

/**
 * El acento como COLOR DE TEXTO sobre el fondo de la página o una tarjeta: oscurecido en el tema
 * claro y aclarado en el oscuro (`--mezcla-tinta` es black / white). Contraste ≥ 4.5:1 en ambos.
 */
export const tinta = (color) => `color-mix(in oklab, ${color} 72%, var(--mezcla-tinta, black))`

/** El acento muy suave, para fondos de iconos y anillos (14 % sobre la superficie: blanca u oscura). */
export const claro = (color) => `color-mix(in oklab, ${color} 14%, var(--color-white))`
