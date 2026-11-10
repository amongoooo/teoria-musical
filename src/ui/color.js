// Utilidades de color de la app (ver .claude/skills/diseno/SKILL.md).

/** El acento oscurecido para poner texto blanco encima (contraste ≥ 4.5:1). */
export const oscuro = (color) => `color-mix(in oklab, ${color} 72%, black)`

/** El acento muy claro, para fondos de iconos (equivale a ~13 % de opacidad). */
export const claro = (color) => `color-mix(in oklab, ${color} 14%, white)`
