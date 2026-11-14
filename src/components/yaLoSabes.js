// PRUEBA RÁPIDA «¿Ya lo sabes?» desde la INSIGNIA del camino (pedido del usuario, 14 nov: «al presionar un módulo en
// Inicio, manda directamente al módulo o a la ruta; el botón de ¿Ya lo sabes? aparece dentro de la vista de las islas
// al presionar el ícono del módulo o la ruta, en lugar del botón "Ir a:"»). Antes salía en una hoja al tocar el
// cuadrito (HojaEntrada). Solo mientras quede algo que la prueba pueda saltar.
import { datosPrueba, pendientes, pruebaModulo, pruebaTramo } from '../content/pruebas/index.js'
import { getPrueba } from '../progress/progreso.js'

/** Las lecciones que la prueba de un módulo aún puede saltar. */
export function pendientesModulo(numero, progreso) {
  return pendientes(datosPrueba(pruebaModulo(numero)), progreso)
}

/** La prueba de un módulo: { id, n (preguntas), ultima } o null si no queda nada que saltar. */
export function pruebaDeModulo(numero, progreso) {
  const prueba = datosPrueba(pruebaModulo(numero))
  const n = pendientes(prueba, progreso).length
  return n > 0 ? { id: prueba.id, n, ultima: getPrueba(prueba.clave) } : null
}

/**
 * La prueba de una ruta: la del tramo en el que vas (o la del primero con algo que saltar).
 * { id, n, tramo (número, solo con 2 tramos o más), ultima } o null.
 */
export function pruebaDeRuta(id, estado, progreso) {
  const tramos = estado.tramos.map((t) => {
    const prueba = datosPrueba(pruebaTramo(id, t.id))
    return { ...t, prueba, n: pendientes(prueba, progreso).length }
  })
  const actual = tramos.find((t) => estado.actual >= t.desde && estado.actual <= t.hasta)
  const t = actual?.n ? actual : tramos.find((x) => x.n > 0)
  if (!t) return null
  return { id: t.prueba.id, n: t.n, tramo: tramos.length > 1 ? t.numero : null, ultima: getPrueba(t.prueba.clave) }
}
