// ÁREAS DE CONOCIMIENTO (pedido del usuario; análisis aprobado: https://claude.ai/artifact/YS4QK6SLnK894SQkV1LiCu).
// El color dice el TIPO DE RUTA (la disciplina), no el módulo: cada módulo, ruta, tramo, práctica y herramienta usa
// el color de su área. Oído no es un área: es un tipo de práctica que toma el color de lo que entrena.
// Agregar un área = una entrada aquí + sus 4 variables en src/index.css (`--color-ID`, `-relleno`, `-tinta`, `-suave`,
// también en `.dark`). Interpretación queda reservada.

export const AREAS_CONOCIMIENTO = {
  ritmo: { id: 'ritmo', nombre: 'Ritmo', acento: 'var(--color-ritmo)' },
  melodia: { id: 'melodia', nombre: 'Melodía', acento: 'var(--color-melodia)' },
  armonia: { id: 'armonia', nombre: 'Armonía', acento: 'var(--color-armonia)' },
  letras: { id: 'letras', nombre: 'Letras', acento: 'var(--color-letras)' },
  produccion: { id: 'produccion', nombre: 'Producción', acento: 'var(--color-produccion)' },
}

/** El color (variable CSS) de un área: `color('armonia')` → `var(--color-armonia)`. */
export const color = (area) => AREAS_CONOCIMIENTO[area].acento

export const RITMO = color('ritmo')
export const MELODIA = color('melodia')
export const ARMONIA = color('armonia')
export const LETRAS = color('letras')
export const PRODUCCION = color('produccion')
