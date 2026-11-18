// RUTAS de curso (pedido del usuario; plan: https://claude.ai/artifact/1jGqsB6x9HwUEkze8JZxP1).
// Una ruta es un camino de islas por habilidad que mezcla lecciones del curso, metas de práctica de su entrenamiento,
// herramientas que se abren y un reto en FL Studio. Vive dentro de su entrenamiento («una puerta por habilidad»:
// la de ritmo, en el panel de #/ritmo). Las paradas SE CUMPLEN SOLAS con lo que ya guarda la app; los entrenamientos
// siguen siempre abiertos: la ruta solo guía.
//
// Tipos de parada:
//   { tipo: 'leccion', id: '2.1' }                                    → hecha si la lección está completada
//   { tipo: 'meta', modo: 'seguir', nivel: 2, titulo, texto }        → hecha si en ese modo ya llegaste a ese nivel
//        `dificultad` (1–5): la que pide ese punto del curso (pedido del usuario: todo es progresivo): la meta se cumple
//        al llegar al nivel aprobando con esa dificultad o más (`nivelCon` de progress/entrenamiento.js). Al tocar
//        «Practicar» desde la ruta, el entrenador empieza con esa dificultad (octavas en oído, margen en ritmo), sin
//        vidas y a tempo normal. `legado`: el nivel de ANTES que equivalía a la meta (si el modo cambió sus niveles,
//        como Acordes): quien ya lo tenía la conserva cumplida.
//   { tipo: 'meta', clave: 'letra', titulo, texto }                  → otras metas (las mide `medirMeta` de
//   { tipo: 'meta', clave: 'vocab', tema: 'noche', palabras: 10, … }    components/rutaModulo.js): una letra en el cuaderno,
//                                                                         N palabras de un tema del vocabulario…
//   { tipo: 'leccion', id: 'L1', titulo }                             → una lección que vive EN la ruta (content/ruta-letras/)
//   { tipo: 'abre', herramienta: 'flow', titulo, texto }             → hecha cuando se abre la herramienta (HERRAMIENTAS)
//   { tipo: 'reto', id: 'ruta-ritmo', titulo, texto }                → hecha con «Lo hice» (progreso.retos[id])
//
// TRAMOS (pedido del usuario: «es un proyecto que escalará mucho»; propuesta aprobada:
// https://claude.ai/artifact/UXqLcj3Ee1MfzLQYuKvkk3): las paradas no van sueltas en la ruta, sino en TRAMOS
// (paquetes cortos de lecciones y prácticas con su título). Un tramo se escribe UNA vez y lo reutilizan varias
// rutas: módulos (el curso) → tramos → rutas (caminos por habilidad). El tramo NO tiene color propio: toma el de la
// ruta en la que va (fase 4: «Notas y teclado» sale turquesa en Melodía y violeta en Acordes).
// Cada ruta lista sus `tramos` en orden; `paradas` se arma sola (cada parada sabe su `tramo`). Con 2 tramos o
// más, el camino pone un letrero al empezar cada tramo y la barra de puntitos los agrupa.
// Las metas de un tramo miden el entrenamiento de la `practica` de la ruta: un tramo con metas de oído va en
// rutas de oído.
import { MODULOS } from './modulos.js'

/** Herramientas que se abren con una lección del curso (el modo administrador las abre todas). */
export const HERRAMIENTAS = {
  flow: { nombre: 'Flow', leccion: '2.4' },
  circulo: { nombre: 'Círculo de quintas', leccion: '3.5' },
  caja: { nombre: 'Caja de ritmos', leccion: '12.1' },
}

/** ¿Está abierta la herramienta? */
export function herramientaAbierta(id, progreso, admin = false) {
  return admin || Boolean(progreso.lecciones[HERRAMIENTAS[id].leccion]?.completada)
}

/** Los tramos: un paquete de paradas con su título (el color lo pone la ruta en la que van: dentro de una ruta todo lleva su color). */
export const TRAMOS = {
  'pulso-groove': {
    titulo: 'Pulso y groove',
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
  // Las lecciones L1–L5 (content/ruta-letras/, registradas en content/index.js) son también el Módulo de Letras (11).
  'rima-flow': {
    titulo: 'Rima y flow',
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
    paradas: [
      { tipo: 'leccion', id: '1.2' },
      { tipo: 'leccion', id: '1.3' },
      { tipo: 'leccion', id: '1.4' },
    ],
  },
  'intervalos-escalas': {
    titulo: 'Intervalos y escalas',
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
  // Ruta de Melodía (fase 4 del rediseño; plan aprobado: https://claude.ai/artifact/JT5CGCcMc457BZF8XTYe8L).
  'pasos-intervalos': {
    titulo: 'Pasos e intervalos',
    paradas: [
      { tipo: 'leccion', id: '3.1' },
      { tipo: 'meta', modo: 'absoluto', nivel: 2, dificultad: 1, titulo: 'Oído absoluto · nivel 2', texto: 'Reconoce Do, Sol y Mi sin ninguna referencia: un juego para conocer el color de cada nota.' },
      { tipo: 'leccion', id: '3.2' },
      { tipo: 'meta', modo: 'intervalos', nivel: 5, dificultad: 1, titulo: 'Intervalos · nivel 5', texto: 'Llega al nivel en el que se suman la 2.ª mayor y la 6.ª mayor: los pasos de la escala.' },
    ],
  },
  'escalas-melodias': {
    titulo: 'Escalas y melodías',
    paradas: [
      { tipo: 'leccion', id: '3.3' },
      { tipo: 'leccion', id: '3.4' },
      { tipo: 'meta', modo: 'absoluto', nivel: 4, dificultad: 1, titulo: 'Oído absoluto · nivel 4', texto: 'Cinco notas: se suman La y Re.' },
      { tipo: 'leccion', id: '3.6' },
      { tipo: 'meta', modo: 'intervalos', nivel: 6, dificultad: 2, titulo: 'Intervalos · nivel 6', texto: 'Se suman la 2.ª menor y la 6.ª menor, ahora en dos octavas.' },
      {
        tipo: 'reto',
        id: 'ruta-melodia',
        titulo: 'Tu melodía pentatónica',
        texto: 'En FL Studio, escribe 4 compases de melodía con la pentatónica menor de La sobre un acorde de Am: que empiece y termine en La, con al menos un salto de 3.ª y uno de 5.ª.',
      },
    ],
  },
  triadas: {
    titulo: 'Tríadas',
    paradas: [
      { tipo: 'leccion', id: '4.1' },
      { tipo: 'meta', modo: 'acordes', nivel: 2, dificultad: 1, legado: 2, titulo: 'Acordes · nivel 2', texto: '¿Mayor o menor? Supéralo con el arpegio y llega al disminuido.' },
      { tipo: 'leccion', id: '4.2' },
    ],
  },
  // Termina con la 4.5 «Voicings» y el reto de la ruta.
  'acordes-tonalidad': {
    titulo: 'Acordes en la tonalidad',
    paradas: [
      { tipo: 'leccion', id: '4.3' },
      { tipo: 'leccion', id: '4.4' },
      { tipo: 'meta', id: 'acordes:3', modo: 'acordes', nivel: 2, dificultad: 3, legado: 3, titulo: 'Acordes · invertidos', texto: 'Mayor o menor también con los acordes invertidos: supéralo con la dificultad 3.' },
      { tipo: 'leccion', id: '4.5' },
      {
        tipo: 'reto',
        id: 'ruta-acordes',
        titulo: 'Tu progresión I–V–vi–IV',
        texto: 'En FL Studio, escribe I–V–vi–IV en la tonalidad que quieras (C – G – Am – F en Do), con inversiones que se muevan poco y el bajo en la fundamental.',
      },
    ],
  },
  // Módulo 5 (plan aprobado: https://claude.ai/artifact/HjTYcwyL4xszUxAwx2gJBL); la 5.4 abre el tramo «Progresiones».
  // La meta de Acordes pide SUPERAR el nivel 4 (el de la séptima de dominante, que se abre con la 5.2): nivel 5.
  funciones: {
    titulo: 'Funciones y cadencias',
    paradas: [
      { tipo: 'leccion', id: '5.1' },
      { tipo: 'meta', modo: 'funciones', nivel: 3, dificultad: 1, titulo: 'Funciones · nivel 3', texto: 'Suena la casa y luego un acorde: llega al nivel en el que entran los parientes, el vi y el ii.' },
      { tipo: 'leccion', id: '5.2' },
      { tipo: 'meta', modo: 'acordes', nivel: 5, dificultad: 1, titulo: 'Acordes · con séptima', texto: 'Supera el nivel 4, en el que entra el acorde con séptima de dominante: el V7, de oído.' },
      { tipo: 'leccion', id: '5.3' },
    ],
  },
  // Plan aprobado de la 5.4: https://claude.ai/artifact/5y8ppYbWa9MwyVdc2Bh31n y de la 5.5: https://claude.ai/artifact/LqW8UUP3JcQ1h9tsFKbP2T.
  // La 5.6 (plan: https://claude.ai/artifact/1MKSzMQVTy4c3rXHaCqiN8) y la 5.7 (plan: https://claude.ai/artifact/V9Q8tet1BajDdwTbVjQBfE)
  // cierran el tramo, con «Funciones · nivel 5» (dentro de una frase: lo que se analiza) y el reto del módulo 5. La meta
  // de Funciones nivel 4 pide llegar al nivel «Los 7 acordes» con la dificultad 2 (más tonalidades); la de Acordes,
  // superar el nivel 5 (el último: maj7 y m7), que se abre con la 5.5.
  progresiones: {
    titulo: 'Progresiones',
    paradas: [
      { tipo: 'leccion', id: '5.4' },
      { tipo: 'meta', modo: 'funciones', nivel: 4, dificultad: 2, titulo: 'Funciones · nivel 4', texto: 'Llega al nivel en el que entran los 7 acordes (el iii y el vii°), ahora en más tonalidades.' },
      { tipo: 'leccion', id: '5.5' },
      { tipo: 'meta', modo: 'acordes', nivel: 6, dificultad: 1, titulo: 'Acordes · maj7 y m7', texto: 'Supera el nivel 5, en el que entran la séptima mayor y la menor séptima: el ii–V–I, de oído.' },
      { tipo: 'leccion', id: '5.6' },
      { tipo: 'leccion', id: '5.7' },
      { tipo: 'meta', modo: 'funciones', nivel: 5, dificultad: 2, titulo: 'Funciones · nivel 5', texto: 'Llega al último nivel: reconoce la función de cada acorde dentro de una frase, como al analizar una canción.' },
      {
        tipo: 'reto',
        id: 'ruta-progresiones',
        titulo: 'Analiza y reescribe',
        texto: 'En FL Studio, saca los acordes de una canción que te guste, ponles número y función, y haz tu versión con otro ritmo armónico y otra cadencia final.',
      },
    ],
  },
  // RUTA DE BEATS (área Producción; propuesta aprobada: https://claude.ai/artifact/EqP6ik7JikQGsfGUnek2uT). Las lecciones de
  // Producción 1 que aún no existen salen «Próximamente» en el camino (la ruta es lineal: espera ahí).
  'primer-beat': {
    titulo: 'Tu primer beat',
    paradas: [
      { tipo: 'leccion', id: '2.2' },
      { tipo: 'leccion', id: '12.1' },
      { tipo: 'abre', herramienta: 'caja', titulo: 'Caja de ritmos', texto: 'El Channel rack libre: 16 pasos, tu tempo y tu patrón guardado.' },
      { tipo: 'leccion', id: '12.2' },
      { tipo: 'meta', modo: 'eco', nivel: 5, dificultad: 2, titulo: 'Eco · nivel 5', texto: 'Escucha un compás y repítelo: llega al contratiempo, los golpes que caen en las «y».' },
      { tipo: 'leccion', id: '2.5' },
      {
        tipo: 'reto',
        id: 'ruta-beats-generos',
        titulo: 'Tu beat en dos géneros',
        texto: 'En FL Studio, el mismo kit en dos patrones: uno de boom bap a 90 BPM y uno de dembow a 95.',
      },
    ],
  },
  '808-hihats': {
    titulo: '808 y hi-hats',
    paradas: [
      { tipo: 'leccion', id: '1.4' },
      { tipo: 'leccion', id: '12.3' },
      { tipo: 'meta', modo: 'seguir', nivel: 7, dificultad: 2, titulo: 'Seguir · nivel 7', texto: 'Semicorcheas a tiempo: cuatro golpes en cada tiempo, el motor de los hi-hats.' },
      { tipo: 'leccion', id: '12.4' },
      { tipo: 'leccion', id: '12.5' },
      {
        tipo: 'reto',
        id: 'ruta-beats-trap',
        titulo: 'Tu beat de trap de 8 compases',
        texto: 'Hats con un roll, el 808 afinado a la tónica y una variación en el compás 8.',
      },
    ],
  },
  'acordes-beat': {
    titulo: 'Acordes en el beat',
    paradas: [
      { tipo: 'leccion', id: '4.5' },
      { tipo: 'leccion', id: '5.4' },
      { tipo: 'meta', modo: 'eco', nivel: 7, dificultad: 2, titulo: 'Eco · nivel 7', texto: 'Semicorcheas de memoria: escucha un compás y repítelo.' },
      { tipo: 'leccion', id: '5.6' },
      {
        tipo: 'reto',
        id: 'ruta-beats-loop',
        titulo: 'Acordes, 808 y batería',
        texto: 'Un loop de 8 compases: tu progresión, el 808 en la fundamental de cada acorde y tu batería.',
      },
    ],
  },
  'loop-cancion': {
    titulo: 'Del loop a la canción',
    paradas: [
      { tipo: 'leccion', id: '10.1' },
      { tipo: 'leccion', id: '10.3' },
      { tipo: 'meta', modo: 'seguir', nivel: 9, dificultad: 2, titulo: 'Seguir · nivel 9', texto: 'Swing a tiempo: las semicorcheas que se balancean.' },
      {
        tipo: 'reto',
        id: 'ruta-beats-completo',
        titulo: 'Tu primer beat completo',
        texto: 'De 2 a 3 minutos con intro, verso y coro, listo para que alguien le escriba encima.',
      },
    ],
  },
}

export const RUTAS = {
  ritmo: {
    id: 'ritmo',
    area: 'ritmo', // su área de conocimiento (content/areas.js): fila de Aprender › Rutas
    nombre: 'Ritmo',
    titulo: 'Ruta de ritmo',
    acento: 'var(--color-ritmo)',
    descripcion: 'Pulso, compás, figuras, síncopa y swing: las lecciones de Ritmo 1 con práctica de Seguir y Eco.',
    modulos: [2],
    practica: 'ritmo',
    tramos: ['pulso-groove'],
  },
  letras: {
    id: 'letras',
    area: 'letras', // su área de conocimiento (content/areas.js): fila de Aprender › Rutas
    nombre: 'Letras',
    titulo: 'Ruta de letras',
    acento: 'var(--color-letras)',
    descripcion: 'Rima, esquemas, sílabas, multis y flow: cinco lecciones cortas con tu cuaderno y el vocabulario.',
    modulos: [11],
    practica: 'letras',
    tramos: ['rima-flow'],
  },
  melodia: {
    id: 'melodia',
    area: 'melodia', // su área de conocimiento (content/areas.js): fila de Aprender › Rutas
    nombre: 'Melodía',
    titulo: 'Ruta de melodía',
    acento: 'var(--color-melodia)',
    descripcion: 'Notas, tonos e intervalos, escalas mayor, menor y pentatónicas, con práctica de Intervalos y Oído absoluto.',
    modulos: [1, 3],
    practica: 'oido',
    tramos: ['notas-teclado', 'pasos-intervalos', 'escalas-melodias'],
  },
  acordes: {
    id: 'acordes',
    area: 'armonia', // su área de conocimiento (content/areas.js): fila de Aprender › Rutas
    nombre: 'Acordes',
    titulo: 'Ruta de acordes',
    acento: 'var(--color-armonia)',
    descripcion: 'Notas, intervalos y escalas, tríadas, acordes de la tonalidad, inversiones, voicings, funciones y progresiones.',
    modulos: [1, 3, 4, 5],
    practica: 'oido',
    tramos: ['notas-teclado', 'intervalos-escalas', 'triadas', 'acordes-tonalidad', 'funciones', 'progresiones'],
  },
  beats: {
    id: 'beats',
    area: 'produccion', // su área de conocimiento (content/areas.js): fila de Aprender › Rutas
    nombre: 'Beats',
    titulo: 'Ruta de beats',
    acento: 'var(--color-produccion)',
    descripcion: 'El Channel rack, el groove de cada género, hi-hats y 808, y acordes y bajo dentro del beat, en FL Studio.',
    modulos: [2, 12, 1, 4, 5, 10],
    practica: 'ritmo',
    tramos: ['primer-beat', '808-hihats', 'acordes-beat', 'loop-cancion'],
  },
}

/** Rutas de un área que aún no existen: salen en Aprender › Rutas, punteadas y con «Próximamente». */
export const RUTAS_PROXIMAS = [
  { id: 'sound-design', area: 'produccion', nombre: 'Sound design' },
  { id: 'mezcla', area: 'produccion', nombre: 'Mezcla y máster' },
]

// Las paradas de cada ruta, en orden, con el tramo al que pertenecen.
for (const ruta of Object.values(RUTAS)) {
  ruta.paradas = ruta.tramos.flatMap((tramo) => TRAMOS[tramo].paradas.map((p) => ({ ...p, tramo })))
}

/** Orden de las rutas (en Inicio y al deslizar entre rutas, en bucle). Melodía justo antes de Acordes: la prepara; Beats al final. */
export const ORDEN_RUTAS = ['ritmo', 'letras', 'melodia', 'acordes', 'beats']

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
      acento: ruta.acento, // el tramo toma el color de la ruta en la que va
      desde: suyas[0].i,
      hasta: suyas[suyas.length - 1].i,
      hechas: suyas.filter((p) => p.hecha).length,
      total: suyas.length,
    }
  })
  return { paradas, tramos, hechas: paradas.filter((p) => p.hecha).length, total: paradas.length, actual }
}
