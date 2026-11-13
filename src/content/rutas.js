// RUTAS de curso (pedido del usuario; plan: https://claude.ai/artifact/1jGqsB6x9HwUEkze8JZxP1).
// Una ruta es un camino de islas por habilidad que mezcla lecciones del curso, metas de práctica de su entrenamiento,
// herramientas que se abren y un reto en FL Studio. Vive dentro de su entrenamiento («una puerta por habilidad»:
// la de ritmo, en el panel de #/ritmo). Las paradas SE CUMPLEN SOLAS con lo que ya guarda la app; los entrenamientos
// siguen siempre abiertos: la ruta solo guía.
//
// Tipos de parada:
//   { tipo: 'leccion', id: '2.1' }                                    → hecha si la lección está completada
//   { tipo: 'meta', modo: 'seguir', nivel: 2, titulo, texto }        → hecha si en ese modo ya llegaste a ese nivel
//   { tipo: 'abre', herramienta: 'flow', titulo, texto }             → hecha cuando se abre la herramienta (HERRAMIENTAS)
//   { tipo: 'reto', id: 'ruta-ritmo', titulo, texto }                → hecha con «Lo hice» (progreso.retos[id])
import { MODULOS } from './modulos.js'

/** Herramientas que se abren con una lección del curso (el modo administrador las abre todas). */
export const HERRAMIENTAS = {
  flow: { nombre: 'Flow', leccion: '2.4' },
  circulo: { nombre: 'Círculo de quintas', leccion: '3.5' },
}

/** ¿Está abierta la herramienta? */
export function herramientaAbierta(id, progreso, admin = false) {
  return admin || Boolean(progreso.lecciones[HERRAMIENTAS[id].leccion]?.completada)
}

export const RUTAS = {
  ritmo: {
    id: 'ritmo',
    nombre: 'Ritmo',
    titulo: 'Ruta de ritmo',
    acento: 'var(--color-modulo-2)',
    descripcion: 'Pulso, compás, figuras, síncopa y swing: las lecciones del módulo 2 con práctica de Seguir y Eco.',
    modulos: [2],
    practica: 'ritmo',
    paradas: [
      { tipo: 'leccion', id: '2.1' },
      { tipo: 'meta', modo: 'seguir', nivel: 2, titulo: 'Seguir · nivel 2', texto: 'Toca las negras a tiempo sobre el beat hasta subir al nivel 2.' },
      { tipo: 'leccion', id: '2.2' },
      { tipo: 'meta', modo: 'eco', nivel: 3, titulo: 'Eco · nivel 3', texto: 'Escucha un compás y repítelo: llega a las corcheas.' },
      { tipo: 'leccion', id: '2.3' },
      { tipo: 'meta', modo: 'seguir', nivel: 5, titulo: 'Seguir · nivel 5', texto: 'Llega al contratiempo: los golpes caen en las «y».' },
      { tipo: 'leccion', id: '2.4' },
      { tipo: 'abre', herramienta: 'flow', titulo: 'Flow', texto: 'Tu pad sobre el beat, sílaba por sílaba: la pestaña Flow de cada letra.' },
      { tipo: 'leccion', id: '2.5' },
      {
        tipo: 'reto',
        id: 'ruta-ritmo',
        titulo: 'Tu groove con swing',
        texto: 'En FL Studio, programa 2 compases de batería en el Channel rack, sube el swing y baja la velocity de los hi-hats que no van en el tiempo.',
      },
    ],
  },
}

// Las que aún no tienen paradas salen como «próximamente» (con candado), como los módulos sin lecciones.
RUTAS.letras = {
  id: 'letras',
  nombre: 'Letras',
  titulo: 'Ruta de letras',
  acento: 'var(--color-modulo-6)',
  descripcion: 'Rima, esquemas, sílabas, multis y flow.',
  modulos: [],
  practica: 'letras',
  paradas: [],
}
RUTAS.acordes = {
  id: 'acordes',
  nombre: 'Acordes',
  titulo: 'Ruta de acordes',
  acento: 'var(--color-modulo-4)',
  descripcion: 'Terceras, tríadas, mayor o menor al oído, inversiones y voicings.',
  modulos: [3, 4],
  practica: 'oido',
  paradas: [],
}

/** Orden de las rutas (en Inicio y al deslizar entre rutas). */
export const ORDEN_RUTAS = ['ritmo', 'letras', 'acordes']

export const getRuta = (id) => RUTAS[id]

/** ¿Ya tiene paradas? */
export const rutaDisponible = (ruta) => Boolean(ruta?.paradas.length)

/** Título de una lección del curso por su id ('2.1' → 'Pulso y tempo'). */
export function tituloLeccion(id) {
  for (const m of MODULOS) {
    const l = m.lecciones.find((x) => x.id === id)
    if (l) return l.titulo
  }
  return id
}

/**
 * Estado de cada parada: `hecha` y `estado`:
 *   'hecha' | 'actual' (la primera sin cumplir) | 'bloqueada' (después de la actual; en modo administrador, 'abierta').
 * La ruta es LINEAL (pedido del usuario): una parada solo cuenta como hecha si también lo están todas las de antes.
 * Si ya llegaste a un nivel (o hiciste una lección) que la ruta pide más adelante, esa parada sale bloqueada
 * hasta cumplir las anteriores; entonces se marca sola. `cumplida` = la condición, sin mirar el orden.
 * `nivelMax(modo)` = nivel más alto alcanzado en ese modo del entrenamiento.
 */
export function estadoRuta(ruta, { progreso, nivelMax, admin = false }) {
  const cumplida = (p) => {
    if (p.tipo === 'leccion') return Boolean(progreso.lecciones[p.id]?.completada)
    if (p.tipo === 'meta') return nivelMax(p.modo) >= p.nivel
    if (p.tipo === 'abre') return herramientaAbierta(p.herramienta, progreso)
    if (p.tipo === 'reto') return Boolean(progreso.retos[p.id]?.hecho)
    return false
  }
  let actual = -1
  const paradas = ruta.paradas.map((p, i) => {
    const ok = cumplida(p)
    const hecha = ok && actual < 0 // lineal: nada cuenta después de la primera sin cumplir
    if (!hecha && actual < 0) actual = i
    return { ...p, i, hecha, cumplida: ok, titulo: p.titulo ?? tituloLeccion(p.id) }
  })
  for (const p of paradas) p.estado = p.hecha ? 'hecha' : p.i === actual ? 'actual' : admin ? 'abierta' : 'bloqueada'
  return { paradas, hechas: paradas.filter((p) => p.hecha).length, total: paradas.length, actual }
}
