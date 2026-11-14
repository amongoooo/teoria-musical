// RUTAS de curso (pedido del usuario; plan: https://claude.ai/artifact/1jGqsB6x9HwUEkze8JZxP1).
// Una ruta es un camino de islas por habilidad que mezcla lecciones del curso, metas de práctica de su entrenamiento,
// herramientas que se abren y un reto en FL Studio. Vive dentro de su entrenamiento («una puerta por habilidad»:
// la de ritmo, en el panel de #/ritmo). Las paradas SE CUMPLEN SOLAS con lo que ya guarda la app; los entrenamientos
// siguen siempre abiertos: la ruta solo guía.
//
// Tipos de parada:
//   { tipo: 'leccion', id: '2.1' }                                    → hecha si la lección está completada
//   { tipo: 'meta', modo: 'seguir', nivel: 2, titulo, texto }        → hecha si en ese modo ya llegaste a ese nivel
//        `dificultad` (1–5): la recomendada para ese punto del curso (pedido del usuario: todo es progresivo). Al tocar
//        «Practicar» desde la ruta, el entrenador empieza con esa dificultad (octavas en oído, margen en ritmo).
//   { tipo: 'meta', clave: 'letra', titulo, texto }                  → otras metas (las mide `medirMeta` de
//   { tipo: 'meta', clave: 'vocab', tema: 'noche', palabras: 10, … }    components/rutaModulo.js): una letra en el cuaderno,
//                                                                         N palabras de un tema del vocabulario…
//   { tipo: 'leccion', id: 'L1', titulo }                             → una lección que vive EN la ruta (content/ruta-letras/)
//   { tipo: 'abre', herramienta: 'flow', titulo, texto }             → hecha cuando se abre la herramienta (HERRAMIENTAS)
//   { tipo: 'reto', id: 'ruta-ritmo', titulo, texto }                → hecha con «Lo hice» (progreso.retos[id])
//
// TRAMOS (pedido del usuario: «es un proyecto que escalará mucho»; propuesta aprobada:
// https://claude.ai/artifact/UXqLcj3Ee1MfzLQYuKvkk3): las paradas no van sueltas en la ruta, sino en TRAMOS
// (paquetes cortos de lecciones y prácticas con su título y el color del área de su ruta). Un tramo se
// escribe UNA vez y lo reutilizan varias rutas: módulos (el curso) → tramos → rutas (caminos por habilidad).
// Cada ruta lista sus `tramos` en orden; `paradas` se arma sola (cada parada sabe su `tramo`). Con 2 tramos o
// más, el camino pone un letrero al empezar cada tramo y la barra de puntitos los agrupa.
// Las metas de un tramo miden el entrenamiento de la `practica` de la ruta: un tramo con metas de oído va en
// rutas de oído.
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

/** Los tramos: un paquete de paradas con su título y su color (el del área de la ruta en la que van: dentro de una ruta todo lleva su color). */
export const TRAMOS = {
  'pulso-groove': {
    titulo: 'Pulso y groove',
    acento: 'var(--color-ritmo)',
    paradas: [
      { tipo: 'leccion', id: '2.1' },
      { tipo: 'meta', modo: 'seguir', nivel: 2, dificultad: 1, titulo: 'Seguir · nivel 2', texto: 'Toca las negras a tiempo sobre el beat hasta subir al nivel 2.' },
      { tipo: 'leccion', id: '2.2' },
      { tipo: 'meta', modo: 'eco', nivel: 3, dificultad: 1, titulo: 'Eco · nivel 3', texto: 'Escucha un compás y repítelo: llega a las corcheas.' },
      { tipo: 'leccion', id: '2.3' },
      { tipo: 'meta', modo: 'seguir', nivel: 5, dificultad: 2, titulo: 'Seguir · nivel 5', texto: 'Llega al contratiempo: los golpes caen en las «y».' },
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
  // Las lecciones L1–L5 viven en la ruta de letras (content/ruta-letras/, registradas en content/index.js).
  'rima-flow': {
    titulo: 'Rima y flow',
    acento: 'var(--color-letras)',
    paradas: [
      { tipo: 'leccion', id: 'L1', titulo: 'Rima consonante y asonante' },
      { tipo: 'meta', clave: 'letra', titulo: 'Analiza tu primera letra', texto: 'Escribe o pega una letra en tu cuaderno y mira sus rimas en colores.' },
      { tipo: 'meta', clave: 'vocab', tema: 'noche', palabras: 10, titulo: 'Vocabulario · Noche', texto: 'Aprende 10 palabras del tema Noche.' },
      { tipo: 'leccion', id: 'L2', titulo: 'Esquemas de rima' },
      { tipo: 'leccion', id: 'L3', titulo: 'Sílabas y sinalefa' },
      { tipo: 'meta', clave: 'vocab', tema: 'calle', palabras: 10, titulo: 'Vocabulario · Calle', texto: 'Aprende 10 palabras del tema Calle.' },
      { tipo: 'leccion', id: 'L4', titulo: 'Multis' },
      { tipo: 'abre', herramienta: 'flow', titulo: 'Flow', texto: 'Tus versos sobre el beat, sílaba por sílaba: la pestaña Flow de cada letra.' },
      { tipo: 'leccion', id: 'L5', titulo: 'Acentos en el pulso' },
      {
        tipo: 'reto',
        id: 'ruta-letras',
        titulo: '8 versos con flow',
        texto: 'Escribe 8 versos con esquema ABAB, acomódalos en el Flow con los acentos en el pulso y grábalos sobre un beat tuyo de FL Studio.',
      },
    ],
  },
  // La base de casi todo lo que suena: dónde están las notas (la 1.1, frecuencia y altura, no hace falta aquí).
  'notas-teclado': {
    titulo: 'Notas y teclado',
    acento: 'var(--color-armonia)',
    paradas: [
      { tipo: 'leccion', id: '1.2' },
      { tipo: 'leccion', id: '1.3' },
      { tipo: 'leccion', id: '1.4' },
    ],
  },
  'intervalos-escalas': {
    titulo: 'Intervalos y escalas',
    acento: 'var(--color-armonia)',
    paradas: [
      { tipo: 'leccion', id: '3.1' },
      { tipo: 'leccion', id: '3.2' },
      { tipo: 'meta', modo: 'intervalos', nivel: 4, dificultad: 1, titulo: 'Intervalos · nivel 4', texto: 'Llega al nivel en el que se suman la 3.ª menor y la 4.ª: las terceras son los ladrillos de los acordes.' },
      { tipo: 'leccion', id: '3.3' },
      { tipo: 'leccion', id: '3.4' },
      { tipo: 'leccion', id: '3.5' },
      { tipo: 'abre', herramienta: 'circulo', titulo: 'Círculo de quintas', texto: 'Las tonalidades y sus vecinas, de donde salen los acordes de cada tonalidad.' },
    ],
  },
  triadas: {
    titulo: 'Tríadas',
    acento: 'var(--color-armonia)',
    paradas: [
      { tipo: 'leccion', id: '4.1' },
      { tipo: 'meta', modo: 'acordes', nivel: 2, dificultad: 1, titulo: 'Acordes · nivel 2', texto: '¿Mayor o menor? Supera el nivel del arpegio: llega a oír solo el acorde.' },
      { tipo: 'leccion', id: '4.2' },
    ],
  },
  // Termina con la 4.5 «Voicings» y el reto de la ruta.
  'acordes-tonalidad': {
    titulo: 'Acordes en la tonalidad',
    acento: 'var(--color-armonia)',
    paradas: [
      { tipo: 'leccion', id: '4.3' },
      { tipo: 'leccion', id: '4.4' },
      { tipo: 'meta', modo: 'acordes', nivel: 3, dificultad: 2, titulo: 'Acordes · nivel 3', texto: 'Mayor o menor también con los acordes invertidos.' },
      { tipo: 'leccion', id: '4.5' },
      {
        tipo: 'reto',
        id: 'ruta-acordes',
        titulo: 'Tu progresión I–V–vi–IV',
        texto: 'En FL Studio, escribe I–V–vi–IV en la tonalidad que quieras (C – G – Am – F en Do), con inversiones que se muevan poco y el bajo en la fundamental.',
      },
    ],
  },
}

export const RUTAS = {
  ritmo: {
    id: 'ritmo',
    nombre: 'Ritmo',
    titulo: 'Ruta de ritmo',
    acento: 'var(--color-ritmo)',
    descripcion: 'Pulso, compás, figuras, síncopa y swing: las lecciones del módulo 2 con práctica de Seguir y Eco.',
    modulos: [2],
    practica: 'ritmo',
    tramos: ['pulso-groove'],
  },
  letras: {
    id: 'letras',
    nombre: 'Letras',
    titulo: 'Ruta de letras',
    acento: 'var(--color-letras)',
    descripcion: 'Rima, esquemas, sílabas, multis y flow: cinco lecciones cortas con tu cuaderno y el vocabulario.',
    modulos: [],
    practica: 'letras',
    tramos: ['rima-flow'],
  },
  acordes: {
    id: 'acordes',
    nombre: 'Acordes',
    titulo: 'Ruta de acordes',
    acento: 'var(--color-armonia)',
    descripcion: 'Notas, intervalos y escalas, tríadas, acordes de la tonalidad, inversiones y voicings.',
    modulos: [1, 3, 4],
    practica: 'oido',
    tramos: ['notas-teclado', 'intervalos-escalas', 'triadas', 'acordes-tonalidad'],
  },
}

// Las paradas de cada ruta, en orden, con el tramo al que pertenecen.
for (const ruta of Object.values(RUTAS)) {
  ruta.paradas = ruta.tramos.flatMap((tramo) => TRAMOS[tramo].paradas.map((p) => ({ ...p, tramo })))
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
 * `medirMeta(p)` → { valor, meta }: cuánto llevas de una meta (nivel más alto del modo, letras en el cuaderno,
 * palabras del tema…) y cuánto pide. Sin él, `nivelMax(modo)` = nivel más alto alcanzado en ese modo.
 */
/** ¿Se cumple la condición de una parada (sin mirar el orden)? `medir(p)` → { valor, meta } de una meta. */
export function cumplidaParada(p, progreso, medir) {
  if (p.tipo === 'leccion') return Boolean(progreso.lecciones[p.id]?.completada)
  if (p.tipo === 'meta') {
    const m = medir(p)
    return m.valor >= m.meta
  }
  if (p.tipo === 'abre') return herramientaAbierta(p.herramienta, progreso)
  if (p.tipo === 'reto') return Boolean(progreso.retos[p.id]?.hecho)
  return false
}

export function estadoRuta(ruta, { progreso, nivelMax, medirMeta, admin = false }) {
  const medir = medirMeta ?? ((p) => ({ valor: nivelMax(p.modo), meta: p.nivel }))
  const cumplida = (p) => cumplidaParada(p, progreso, medir)
  let actual = -1
  const paradas = ruta.paradas.map((p, i) => {
    const ok = cumplida(p)
    const hecha = ok && actual < 0 // lineal: nada cuenta después de la primera sin cumplir
    if (!hecha && actual < 0) actual = i
    return { ...p, i, hecha, cumplida: ok, titulo: p.titulo ?? tituloLeccion(p.id) }
  })
  for (const p of paradas) p.estado = p.hecha ? 'hecha' : p.i === actual ? 'actual' : admin ? 'abierta' : 'bloqueada'
  // Cada tramo: dónde empieza y acaba (índices de parada) y cuántas lleva hechas.
  const tramos = ruta.tramos.map((id, t) => {
    const suyas = paradas.filter((p) => p.tramo === id)
    return {
      id,
      numero: t + 1,
      titulo: TRAMOS[id].titulo,
      acento: TRAMOS[id].acento,
      desde: suyas[0].i,
      hasta: suyas[suyas.length - 1].i,
      hechas: suyas.filter((p) => p.hecha).length,
      total: suyas.length,
    }
  })
  return { paradas, tramos, hechas: paradas.filter((p) => p.hecha).length, total: paradas.length, actual }
}
