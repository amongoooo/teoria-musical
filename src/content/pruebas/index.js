// PRUEBA RÁPIDA «¿Ya lo sabes?» (pedido del usuario; plan aprobado: https://claude.ai/artifact/Hn3bNT88iiZFcRiBGj1Bct).
// Una pregunta por lección: las que aciertas se pueden SALTAR (cuentan como hechas; ver progress/progreso.js →
// `saltarLecciones`). Se abre al tocar el cuadrito de un módulo o de una ruta (components/HojaEntrada.jsx):
//   #/prueba/modulo/3                → las lecciones del módulo 3
//   #/prueba/ruta/acordes/triadas    → las lecciones del tramo «Tríadas» (vuelve a la ruta de acordes)
// Las preguntas: 3 por lección en los bancos de esta carpeta (modulo-N.js, letras.js); cada prueba toma una al azar.
// Una lección nueva trae sus 3 preguntas: añádelas al banco de su módulo (si no tiene, la prueba no la incluye).
import { getModulo, leccionDisponible } from '../index.js'
import { RUTAS, TRAMOS } from '../rutas.js'
import { rutas } from '../../router.js'
import letras from './letras.js'
import modulo1 from './modulo-1.js'
import modulo2 from './modulo-2.js'
import modulo3 from './modulo-3.js'
import modulo4 from './modulo-4.js'

/** id de lección → sus preguntas (rondas de `elegir`, o de `circulo` con `tipo: 'circulo'`). */
export const PREGUNTAS = { ...modulo1, ...modulo2, ...modulo3, ...modulo4, ...letras }

/** ¿Esta lección entra en las pruebas? (existe y tiene preguntas). */
const conPreguntas = (id) => leccionDisponible(id) && PREGUNTAS[id]?.length > 0

/**
 * Lo que mide una prueba según su id ('modulo/3' o 'ruta/acordes/triadas'): { id, clave, etiqueta, titulo,
 * acento, volver, lecciones: [ids] } o null si no existe. `clave` = dónde se guarda su último resultado.
 */
export function datosPrueba(id) {
  const [tipo, a, b] = String(id).split('/')
  if (tipo === 'modulo') {
    const m = getModulo(a)
    if (!m) return null
    return {
      id,
      clave: `M${m.numero}`,
      etiqueta: `Módulo ${m.numero}`,
      titulo: m.titulo,
      acento: m.acento,
      volver: rutas.modulo(m.numero),
      lecciones: m.lecciones.map((l) => l.id).filter(conPreguntas),
    }
  }
  if (tipo === 'ruta') {
    const ruta = RUTAS[a]
    const tramo = TRAMOS[b]
    const n = ruta?.tramos.indexOf(b) ?? -1
    if (!tramo || n < 0) return null
    return {
      id,
      clave: `T-${b}`,
      etiqueta: ruta.tramos.length > 1 ? `Tramo ${n + 1} · ${ruta.titulo}` : ruta.titulo,
      titulo: tramo.titulo,
      acento: tramo.acento,
      volver: rutas.ruta(ruta.id),
      lecciones: tramo.paradas.filter((p) => p.tipo === 'leccion').map((p) => p.id).filter(conPreguntas),
    }
  }
  return null
}

/** Las lecciones de la prueba que aún no están hechas (las únicas que pregunta). */
export const pendientes = (prueba, progreso) => (prueba?.lecciones ?? []).filter((id) => !progreso.lecciones[id]?.completada)

/** id de la prueba de un módulo o de un tramo de una ruta. */
export const pruebaModulo = (numero) => `modulo/${numero}`
export const pruebaTramo = (ruta, tramo) => `ruta/${ruta}/${tramo}`

/**
 * Las preguntas de una prueba: una al azar de cada lección pendiente, en el orden del curso.
 * Cada una: { leccion, paso } con `paso` listo para el componente de su tipo (una sola ronda).
 */
export function armarPreguntas(prueba, progreso, azar = Math.random) {
  return pendientes(prueba, progreso).map((id) => {
    const banco = PREGUNTAS[id]
    const { tipo = 'elegir', ...ronda } = banco[Math.floor(azar() * banco.length)]
    return { leccion: id, paso: { tipo, rondas: [ronda] } }
  })
}
