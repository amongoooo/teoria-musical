// CATÁLOGO DE LECCIONES (fase 2 del rediseño; lista aprobada: https://claude.ai/artifact/65ewQGjSXnwndMBxAM259H).
// La lección es la pieza: aquí van sus ÁREAS (la principal primero; ids de src/content/areas.js), su NIVEL y lo que
// REQUIERE (ids de lecciones). Módulos, tramos, rutas y el Curso completo solo la citan.
//
// Reglas de `requiere`:
//  - Solo los prerrequisitos DIRECTOS: si 4.3 pide 3.3 y 3.3 pide 3.1, 4.3 no repite 3.1.
//  - Son SUAVES: fuera de las rutas y del curso la lección se abre igual, pero antes del primer paso avisa «Antes te
//    conviene» con las que falten (pages/Leccion.jsx → AntesTeConviene). En rutas, curso y modo administrador no avisa.
//  - Nunca uno que llegue DESPUÉS de su lección en una ruta o en el curso (lo comprueba docs/pruebas/prerrequisitos.mjs).
// Niveles: 'principiante' · 'intermedio' · 'avanzado' (este, para los módulos 7–9).
// Lección nueva = una línea aquí (la prueba falla si falta).

export const NIVELES = ['principiante', 'intermedio', 'avanzado']

const l = (areas, nivel, requiere = []) => ({ areas, nivel, requiere })

export const CATALOGO = {
  // Módulo 1 · Sonido, notas y teclado
  '1.1': l(['melodia', 'produccion'], 'principiante'),
  '1.2': l(['melodia'], 'principiante', ['1.1']),
  '1.3': l(['melodia'], 'principiante', ['1.2']),
  '1.4': l(['melodia', 'produccion'], 'principiante', ['1.3']),
  // Módulo 2 · Ritmo y groove (2.1 explica su propia rejilla de batería: no pide 1.4)
  '2.1': l(['ritmo'], 'principiante'),
  '2.2': l(['ritmo'], 'principiante', ['2.1']),
  '2.3': l(['ritmo'], 'principiante', ['2.2']),
  '2.4': l(['ritmo'], 'intermedio', ['2.3']),
  '2.5': l(['ritmo', 'produccion'], 'intermedio', ['2.3']),
  // Módulo 3 · Intervalos y escalas
  '3.1': l(['melodia'], 'principiante', ['1.3']),
  '3.2': l(['melodia', 'armonia'], 'principiante', ['3.1']),
  '3.3': l(['melodia'], 'principiante', ['3.1']),
  '3.4': l(['melodia', 'armonia'], 'principiante', ['3.3']),
  '3.5': l(['melodia', 'armonia'], 'intermedio', ['3.2', '3.4']),
  '3.6': l(['melodia'], 'intermedio', ['3.4']),
  '3.7': l(['melodia', 'armonia'], 'intermedio', ['3.5']),
  // Módulo 4 · Acordes
  '4.1': l(['armonia'], 'principiante', ['3.2']),
  '4.2': l(['armonia'], 'principiante', ['4.1']),
  '4.3': l(['armonia'], 'intermedio', ['3.3', '4.1']),
  '4.4': l(['armonia'], 'intermedio', ['4.1']),
  '4.5': l(['armonia', 'produccion'], 'intermedio', ['4.3', '4.4']),
  // Ruta de letras
  L1: l(['letras'], 'principiante'),
  L2: l(['letras'], 'principiante', ['L1']),
  L3: l(['letras'], 'principiante', ['L1']),
  L4: l(['letras'], 'intermedio', ['L1', 'L3']),
  L5: l(['letras', 'ritmo'], 'intermedio', ['2.2', 'L3']),
}

/** Lo que el catálogo sabe de una lección: { areas, nivel, requiere } (o null). */
export const infoLeccion = (id) => CATALOGO[id] ?? null
