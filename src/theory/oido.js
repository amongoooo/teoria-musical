// Datos y generadores de preguntas del Entrenamiento de oído.
// Cada modo define: niveles, opciones(nivel), elementosNuevos(nivel) (lo que se sumó en ese nivel: cada uno tiene que
// salir bien 2 veces para aprobarlo; ver progress/entrenamiento.js) y generar(nivel, ajustes, anterior, contexto).
// `contexto` = { items, nuevos }: las estadísticas del modo y los elementos nuevos, para que el sorteo saque más lo
// que más se falla y lo recién sumado (`elegirPesado`).
// Una pregunta es { item, sonido, notas, sonidoDe(id), explicacion }:
//  - item: id de la respuesta correcta
//  - sonido: lo que suena (formato de audio/sonido.js)
//  - notas: notas para marcar en el piano al responder
//  - sonidoDe(id): cómo sonaría otra opción (para comparar tras responder)
import { Note } from 'tonal'
import { FUNCIONES, FUNCION_GRADO, ORDEN_FUNCIONES, ROMANOS, acordeDeGrado, cifrado } from './acordes.js'
import { frecuencia, hz, midi, nombre, notaDesdeMidi } from './notas.js'

function azar(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

function entre(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * Elige al azar dando más peso a lo que más se falla (`items`: { id: { a, t } }) y a lo recién sumado al nivel
 * (`nuevos`), sin repetir `anterior` (si hay más de una opción). Todo puede salir: nunca deja de cubrir el nivel.
 */
export function elegirPesado(lista, { anterior, items = {}, nuevos = [] } = {}) {
  const resto = lista.length > 1 && anterior != null ? lista.filter((x) => x !== anterior) : lista
  const peso = (id) => {
    const it = items[id] ?? { a: 0, t: 0 }
    const fallo = (it.t - it.a + 1) / (it.t + 2) // 0…1 (sin datos, 0,5)
    return 1 + 2 * fallo + (nuevos.includes(id) ? 1.5 : 0)
  }
  const total = resto.reduce((s, id) => s + peso(id), 0)
  let r = Math.random() * total
  for (const id of resto) {
    r -= peso(id)
    if (r < 0) return id
  }
  return resto.at(-1)
}

// ---------------------------------------------------------------------------
// Intervalos
// ---------------------------------------------------------------------------

export const INTERVALOS = {
  '2m': { semitonos: 1, nombre: '2.ª menor', siente: 'un roce tenso, muy pegado' },
  '2M': { semitonos: 2, nombre: '2.ª mayor', siente: 'un paso de escala' },
  '3m': { semitonos: 3, nombre: '3.ª menor', siente: 'melancólica, la base del acorde menor' },
  '3M': { semitonos: 4, nombre: '3.ª mayor', siente: 'luminosa, la base del acorde mayor' },
  '4J': { semitonos: 5, nombre: '4.ª justa', siente: 'abierta, como un llamado' },
  TT: { semitonos: 6, nombre: 'Tritono', siente: 'inestable e inquietante, pide resolver' },
  '5J': { semitonos: 7, nombre: '5.ª justa', siente: 'hueca y estable, el «power chord»' },
  '6m': { semitonos: 8, nombre: '6.ª menor', siente: 'dulce y algo triste' },
  '6M': { semitonos: 9, nombre: '6.ª mayor', siente: 'cálida y amplia' },
  '7m': { semitonos: 10, nombre: '7.ª menor', siente: 'pide moverse, suena a blues' },
  '7M': { semitonos: 11, nombre: '7.ª mayor', siente: 'muy tensa, casi llega a la octava' },
  '8J': { semitonos: 12, nombre: 'Octava', siente: 'la misma nota, más aguda' },
}

const ORDEN_INTERVALOS = Object.keys(INTERVALOS)

// Cada nivel suma intervalos al anterior.
const NUEVOS_POR_NIVEL = [['3M', '5J'], ['8J'], ['3m'], ['4J'], ['2M', '6M'], ['2m', '6m'], ['7m', '7M'], ['TT']]

function intervalosDelNivel(nivel) {
  const ids = NUEVOS_POR_NIVEL.slice(0, nivel).flat()
  return ORDEN_INTERVALOS.filter((id) => ids.includes(id))
}

export const DIRECCIONES = [
  { id: 'sube', label: 'Subiendo' },
  { id: 'baja', label: 'Bajando' },
  { id: 'juntas', label: 'A la vez' },
]

function sonidoIntervalo(raiz, semitonos, direccion) {
  const grave = notaDesdeMidi(raiz)
  const aguda = notaDesdeMidi(raiz + semitonos)
  if (direccion === 'juntas') return { notas: [grave, aguda], modo: 'acorde', duracion: 1.6 }
  const notas = direccion === 'baja' ? [aguda, grave] : [grave, aguda]
  return { notas, modo: 'secuencia', intervalo: 0.7, duracion: 1.1 }
}

export const modoIntervalos = {
  id: 'intervalos',
  titulo: 'Intervalos',
  // Color del área que entrena (Oído no es un área): intervalos → Melodía, acordes → Armonía, notas → Melodía.
  acento: 'var(--color-melodia)',
  descripcion: 'Escucha dos notas y elige la distancia entre ellas.',
  info:
    'Cada intervalo tiene su **carácter**: la 3.ª mayor es luminosa, la 5.ª justa hueca y estable, el tritono ' +
    'inquietante. Empiezas con 3.ª mayor y 5.ª justa y en cada nivel se suman más. Subes al acertar ' +
    '**8 de las últimas 10**, con lo nuevo del nivel bien **2 veces**. La dificultad abre más octavas para la nota de ' +
    'abajo; cada nivel recuerda la más alta con la que lo pasaste.',
  pregunta: '¿Qué intervalo suena?',
  dificultad: true, // rueda de Dificultad (octavas en las que puede sonar)
  nombreDificultad: 'Octavas',
  direcciones: true, // Subiendo / Bajando / A la vez
  // Puntitos del arranque: los 12 intervalos de la 2.ª menor (abajo) a la octava (arriba); encendidos los del nivel.
  puntosNivel: (nivel) => {
    const ids = new Set(intervalosDelNivel(nivel))
    return { encendidos: ORDEN_INTERVALOS.map((id) => ids.has(id)), etiquetas: ORDEN_INTERVALOS.map((id) => INTERVALOS[id].nombre) }
  },
  niveles: NUEVOS_POR_NIVEL.length,
  nuevosEnNivel: (nivel) => (NUEVOS_POR_NIVEL[nivel - 1] ?? []).map((id) => INTERVALOS[id].nombre),
  elementosNuevos: (nivel) => NUEVOS_POR_NIVEL[nivel - 1] ?? [],
  nombreItem: (id) => INTERVALOS[id]?.nombre ?? id,
  opciones: (nivel) => intervalosDelNivel(nivel).map((id) => ({ id, label: INTERVALOS[id].nombre })),
  generar(nivel, ajustes = {}, anterior, contexto = {}) {
    const direccion = ajustes.direccion ?? 'sube'
    const ids = intervalosDelNivel(nivel)
    const item = elegirPesado(ids, { anterior: anterior?.item, ...contexto })
    // La nota de abajo, entre Fa de la octava anterior y Mi de una de las octavas elegidas (dificultad 1 = Fa3–Mi4).
    const o = azar(octavasDe(ajusteAbsoluto(ajustes, 'octavas')))
    const raiz = entre(midi(`F${o - 1}`), midi(`E${o}`))
    const semitonos = INTERVALOS[item].semitonos
    return {
      item,
      sonido: sonidoIntervalo(raiz, semitonos, direccion),
      notas: [notaDesdeMidi(raiz), notaDesdeMidi(raiz + semitonos)],
      sonidoDe: (id) => sonidoIntervalo(raiz, INTERVALOS[id].semitonos, direccion),
      explicacion: `${nombre(notaDesdeMidi(raiz))} → ${nombre(notaDesdeMidi(raiz + semitonos))}: ${semitonos} semitono${semitonos === 1 ? '' : 's'}. Se siente ${INTERVALOS[item].siente}.`,
    }
  },
}

// ---------------------------------------------------------------------------
// Acordes (reordenado con «las tres perillas»): el NIVEL suma tipos de acorde y la DIFICULTAD es cómo suena
// (antes los niveles eran arpegio → solo el acorde → invertidos; ahora son las dificultades 1–3).
// ---------------------------------------------------------------------------

/** Tipos de acorde: semitonos desde la fundamental. */
export const ACORDES = {
  mayor: { nombre: 'Mayor', semitonos: [0, 4, 7], siente: 'luminoso y estable' },
  menor: { nombre: 'Menor', semitonos: [0, 3, 7], siente: 'íntimo y melancólico' },
  dis: { nombre: 'Disminuido', semitonos: [0, 3, 6], siente: 'apretado y tenso: pide moverse' },
  aum: { nombre: 'Aumentado', semitonos: [0, 4, 8], siente: 'flotante, como un sueño sin suelo' },
  dom7: { nombre: 'Séptima de dominante', corto: '7 de dominante', semitonos: [0, 4, 7, 10], siente: 'mayor con un roce que pide volver a casa' },
  maj7: { nombre: 'Mayor con 7.ª mayor', corto: 'Maj7', semitonos: [0, 4, 7, 11], siente: 'mayor y suave, con brillo de jazz' },
  m7: { nombre: 'Menor con 7.ª', corto: 'm7', semitonos: [0, 3, 7, 10], siente: 'menor pero relajado, sin drama' },
}

/** Lo que se suma en cada nivel; las séptimas se abren con su lección (`requiereNivel`). */
const NUEVOS_ACORDES = [['mayor', 'menor'], ['dis'], ['aum'], ['dom7'], ['maj7', 'm7']]
const ORDEN_ACORDES = NUEVOS_ACORDES.flat()

function acordesDelNivel(nivel) {
  return NUEVOS_ACORDES.slice(0, Math.max(1, nivel)).flat()
}

/** Dificultad = cómo suena: 1 arpegio y luego el acorde · 2 solo el acorde · 3 + inversiones · 4 + registro amplio · 5 + abiertos. */
const DIFICULTADES_ACORDES = ['Arpegio y acorde', 'Solo el acorde', '+ Inversiones', '+ Registro amplio', '+ Voicings abiertos']

function notasAcorde(raiz, tipo, { inversion = 0, abierto = false } = {}) {
  const m = ACORDES[tipo].semitonos.map((s) => raiz + s)
  for (let i = 0; i < inversion; i++) m.push(m.shift() + 12)
  // Abierto: la segunda voz sube una octava (1 · 5 · 3 en una tríada), como en la lección 4.5.
  if (abierto) m.push(m.splice(1, 1)[0] + 12)
  return m.map(notaDesdeMidi)
}

function sonidoAcorde(notas, dificultad) {
  if (dificultad <= 1) return { notas: [...notas, notas], modo: 'secuencia', intervalo: 0.4, duracion: 1.4 }
  return { notas, modo: 'acorde', duracion: 1.8 }
}

export const modoAcordes = {
  id: 'acordes',
  titulo: 'Acordes',
  acento: 'var(--color-armonia)',
  descripcion: 'Escucha un acorde y elige qué tipo es.',
  info:
    'El acorde **mayor** suena luminoso y el **menor** íntimo; solo cambia la nota del medio (la 3.ª). En cada nivel ' +
    'entra un tipo más: disminuido, aumentado y, con sus lecciones, las séptimas. Subes al acertar **8 de las ' +
    'últimas 10**, con el tipo nuevo bien **2 veces**. La dificultad cambia cómo suena: primero el arpegio, luego solo ' +
    'el acorde, invertido, en otros registros y abierto.',
  pregunta: '¿Qué acorde es?',
  dificultad: true,
  claveDificultad: 'dificultad',
  nombreDificultad: 'Sonido',
  puntosDificultad: (d) => ({ encendidos: DIFICULTADES_ACORDES.map((_, i) => i < d), etiquetas: DIFICULTADES_ACORDES }),
  // Puntitos del arranque: los 7 tipos (mayor abajo), encendidos los del nivel.
  puntosNivel: (nivel) => {
    const ids = new Set(acordesDelNivel(nivel))
    return { encendidos: ORDEN_ACORDES.map((id) => ids.has(id)), etiquetas: ORDEN_ACORDES.map((id) => ACORDES[id].nombre) }
  },
  niveles: NUEVOS_ACORDES.length,
  // Las séptimas, con candado hasta su lección: la 5.2 trae el V7 y la 5.5 el ii–V–I (m7 y maj7).
  requiereNivel: { 4: '5.2', 5: '5.5' },
  nuevosEnNivel: (nivel) => (NUEVOS_ACORDES[nivel - 1] ?? []).map((id) => ACORDES[id].nombre),
  elementosNuevos: (nivel) => NUEVOS_ACORDES[nivel - 1] ?? [],
  nombreItem: (id) => ACORDES[id]?.nombre ?? id,
  opciones: (nivel) => acordesDelNivel(nivel).map((id) => ({ id, label: ACORDES[id].corto ?? ACORDES[id].nombre })),
  generar(nivel, ajustes, anterior, contexto = {}) {
    // Sin evitar repeticiones: que salga dos veces seguidas el mismo es parte del reto.
    const item = elegirPesado(acordesDelNivel(nivel), contexto)
    const dif = ajusteAbsoluto(ajustes, 'dificultad')
    // Registro: Do4–La4; desde la dificultad 4, de Do3 a La5.
    const o = dif >= 4 ? azar([3, 4, 5]) : 4
    const raiz = entre(midi(`C${o}`), midi(`A${o}`))
    const tam = ACORDES[item].semitonos.length
    const inversion = dif >= 3 ? entre(0, tam - 1) : 0
    const abierto = dif >= 5 && Math.random() < 0.5
    const forma = { inversion, abierto }
    const notas = notasAcorde(raiz, item, forma)
    const nombreRaiz = nombre(notaDesdeMidi(raiz), { octava: false })
    return {
      item,
      sonido: sonidoAcorde(notas, dif),
      notas,
      sonidoDe: (id) => sonidoAcorde(notasAcorde(raiz, id, { ...forma, inversion: Math.min(inversion, ACORDES[id].semitonos.length - 1) }), dif),
      explicacion: `${nombreRaiz} ${ACORDES[item].nombre.toLowerCase()}: ${notas.map((n) => nombre(n, { octava: false })).join(' – ')}. Suena ${ACORDES[item].siente}.`,
    }
  },
}

/**
 * Migración de los datos de Acordes de antes (niveles = arpegio, solo el acorde, invertidos; mayor o menor): llegar
 * al nivel N de antes = aprobar «Mayor y menor» con la dificultad N − 1. La forma de sonar que tenías elegida pasa a
 * ser la Dificultad. `legado` guarda el nivel de antes (las metas de Acordes de las rutas lo traducen con `legado`).
 */
export function migrarAcordes(m) {
  const antes = Math.max(1, Math.min(3, Math.floor(Number(m.nivelMax) || 1)))
  const elegido = Math.max(1, Math.min(3, Math.floor(Number(m.nivel) || 1)))
  const superado = antes > 1 ? { 1: antes - 1 } : {}
  const nivelMax = antes > 1 ? 2 : 1
  return { ...m, nivel: nivelMax, nivelMax, superado, legado: antes, ajustes: { ...(m.ajustes ?? {}), dificultad: elegido } }
}

// ---------------------------------------------------------------------------
// Oído absoluto (juego): adivinar la nota sin referencia
// ---------------------------------------------------------------------------

// Orden en que se van sumando notas: primero naturales bien separadas.
const ORDEN_ABSOLUTO = ['C', 'G', 'E', 'A', 'D', 'F', 'B', 'F#', 'A#', 'C#', 'G#', 'D#']
export const CROMATICA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * Nombre de la clase de nota: 'C#' -> 'Do♯'. Con cifrado 'en' (pedido del usuario: se cambia tocando una nota en la
 * cajita de notas del arranque), en letras: 'C#' -> 'C♯'.
 */
export function nombreClase(clase, cifrado = 'es') {
  if (cifrado === 'en') return clase.replace('#', '♯')
  return nombre(`${clase}4`, { octava: false })
}

/** Nombre de una nota con octava según el cifrado: 'C#4' -> 'Do♯4' o 'C♯4'. */
function nombreCifrado(nota, cifrado = 'es') {
  return cifrado === 'en' ? nota.replace('#', '♯') : nombre(nota)
}

/** Clase de nota de una nota con octava: 'C#4' -> 'C#'. */
export function claseDe(nota) {
  return nota.replace(/-?\d+$/, '')
}

/**
 * Modos de juego del oído absoluto (pedido del usuario; se eligen en el arranque, `ajustes.juego`).
 *  - normal: se sube como en todos los modos (8 de las últimas 10, con la nota nueva bien 2 veces).
 *  - rapido: el nivel es un MULTIPLICADOR (`ajustes.multiplicador`, ×1…×10): empiezas con 2 + N notas, cada
 *    `ajustes.cadaAciertos` aciertos (8 por defecto) se suman N más y cada fallo quita una al azar. Es una partida
 *    aparte: no mueve el nivel del modo normal.
 *  - contrarreloj: como el normal, con `ajustes.segundos` por nota (5 por defecto).
 */
export const JUEGOS_ABSOLUTO = [
  { id: 'normal', nombre: 'Normal' },
  { id: 'rapido', nombre: 'Rápido', multiplicador: true },
  { id: 'contrarreloj', nombre: 'Contrarreloj', segundos: 5 },
]

/** Ajustes que se pueden cambiar en el arranque (valor por defecto y límites). */
export const AJUSTES_ABSOLUTO = {
  multiplicador: { defecto: 1, min: 1, max: 10 },
  cadaAciertos: { defecto: 8, min: 2, max: 20 },
  segundos: { defecto: 5, min: 2, max: 15 },
  octavas: { defecto: 1, min: 1, max: 5 },
  // Vidas (pedido del usuario): 1…20 y, encima, ∞ (21). En Rápido, debajo del 1 está la Escalada (0).
  vidas: { defecto: 5, min: 0, max: 21 },
  // Entrenamiento de ritmo: su rueda de Dificultad no son octavas sino el margen de precisión (theory/ritmo.js).
  dificultad: { defecto: 1, min: 1, max: 5 },
}

export const VIDAS_INFINITAS = 21
/** Rápido con 0 vidas: las vidas son las notas que subes desde el inicio; si vuelves al inicio, se acaba. */
export const VIDAS_ESCALADA = 0

/** Vidas elegidas para un juego (fuera de Rápido no existe la Escalada: mínimo 1). */
export function vidasDe(ajustes, rapido = false) {
  const v = ajusteAbsoluto(ajustes, 'vidas')
  return rapido ? v : Math.max(1, v)
}

/** Valor de un ajuste del oído absoluto, dentro de sus límites. */
export function ajusteAbsoluto(ajustes, clave) {
  const { defecto, min, max } = AJUSTES_ABSOLUTO[clave]
  const v = Number(ajustes?.[clave])
  return Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : defecto
}

/** Texto de cada modo de juego según los ajustes (los números van en negrita). */
export function textoJuego(id, ajustes) {
  if (id === 'rapido') {
    const n = ajusteAbsoluto(ajustes, 'multiplicador')
    const k = ajusteAbsoluto(ajustes, 'cadaAciertos')
    return `Tu nivel multiplica: empiezas con **${n} ${n === 1 ? 'nota extra' : 'notas extra'}** y cada **${k} aciertos** se suman ${n} más. Cada fallo quita una nota al azar.`
  }
  if (id === 'contrarreloj') {
    return `Tienes **${ajusteAbsoluto(ajustes, 'segundos')} segundos** por nota. Si se acaba el tiempo, cuenta como fallo.`
  }
  return 'Acierta **8 de las últimas 10**, con la nota nueva bien **2 veces**, y se suma otra nota.'
}

export function getJuego(id) {
  return JUEGOS_ABSOLUTO.find((j) => j.id === id) ?? JUEGOS_ABSOLUTO[0]
}

// Octavas (pedido del usuario): se van sumando una arriba, una abajo y así: 4 → 4–5 → 3–5 → 3–6 → 2–6.
const ORDEN_OCTAVAS = [4, 5, 3, 6, 2]
export const OCTAVAS_POSIBLES = [2, 3, 4, 5, 6]

/** Las octavas en las que puede sonar la nota con `n` octavas elegidas (de grave a aguda). */
export function octavasDe(n) {
  return ORDEN_OCTAVAS.slice(0, Math.max(1, Math.min(ORDEN_OCTAVAS.length, n))).sort((a, b) => a - b)
}

export function notasDelNivel(nivel) {
  const set = ORDEN_ABSOLUTO.slice(0, nivel + 1) // nivel 1 = 2 notas
  return CROMATICA.filter((c) => set.includes(c))
}

/** La nota que se suma en ese nivel (null en el 1, que empieza con dos). */
export function notaNuevaDelNivel(nivel) {
  return nivel >= 2 ? (ORDEN_ABSOLUTO[nivel] ?? null) : null
}

/** Modo Rápido: las dos notas de base (Do y Sol) y las del principio con el multiplicador N (2 + N). */
export const NOTAS_BASE = ORDEN_ABSOLUTO.slice(0, 2)
export function notasInicialesRapido(n) {
  return notasDelNivel(Math.min(ORDEN_ABSOLUTO.length - 1, 1 + n))
}

/** Modo Rápido: suma `n` notas (las siguientes del orden que aún no estén). Devuelve { notas, sumadas }. */
export function sumarNotas(notas, n) {
  const sumadas = ORDEN_ABSOLUTO.filter((c) => !notas.includes(c)).slice(0, n)
  return { notas: CROMATICA.filter((c) => notas.includes(c) || sumadas.includes(c)), sumadas }
}

/** Modo Rápido: quita una nota al azar (siempre quedan al menos 2). Devuelve { notas, quitada }. */
export function quitarNotaAlAzar(notas) {
  if (notas.length <= 2) return { notas, quitada: null }
  const quitada = azar(notas)
  return { notas: notas.filter((c) => c !== quitada), quitada }
}

export const modoAbsoluto = {
  id: 'absoluto',
  titulo: 'Oído absoluto',
  acento: 'var(--color-melodia)',
  descripcion: 'Un juego: adivina la nota sin ninguna referencia.',
  // Burbuja ⓘ del arranque (se despliega al tocarla).
  info:
    'Es un **juego**: suena una nota sin ninguna referencia y la tocas en el piano. Empiezas con 2 notas (las demás ' +
    'tienen candado) y se desbloquea una más al acertar **8 de las últimas 10**, con la nota nueva bien **2 veces**. ' +
    'En adultos el oído absoluto ' +
    'es muy difícil de adquirir, así que tómalo como un reto divertido, no como una promesa. Entre nota y nota suenan ' +
    'unas notas al azar y un ruido corto: así la nota anterior no te sirve de pista.',
  pregunta: '¿Qué nota es?',
  limpiar: true, // borrador de oído entre preguntas (ver limpiarOido en audio/engine.js)
  niveles: ORDEN_ABSOLUTO.length - 1,
  nombreNivel: (nivel) => `${nivel + 1} notas`,
  nuevosEnNivel: (nivel) =>
    nivel === 1 ? ORDEN_ABSOLUTO.slice(0, 2).map((c) => nombreClase(c)) : [nombreClase(ORDEN_ABSOLUTO[nivel])],
  elementosNuevos: (nivel) => (nivel === 1 ? ORDEN_ABSOLUTO.slice(0, 2) : [ORDEN_ABSOLUTO[nivel]].filter(Boolean)),
  nombreItem: (id, ajustes) => nombreClase(id, ajustes?.cifrado),
  dificultad: true,
  nombreDificultad: 'Octavas',
  // Puntitos del arranque: un piano roll de 12 notas (Do abajo) con las del nivel (en Rápido, las 2 + N del principio).
  puntosNivel: (nivel, { rapido } = {}) => {
    const notas = new Set(rapido ? notasInicialesRapido(nivel) : notasDelNivel(nivel))
    return {
      encendidos: CROMATICA.map((c) => notas.has(c)),
      etiquetas: CROMATICA.map((c) => nombreClase(c)),
      negras: CROMATICA.map((c) => c.includes('#')),
    }
  },
  piano: true, // se responde tocando el piano (las notas aún no desbloqueadas van con candado)
  juegos: JUEGOS_ABSOLUTO,
  // `ajustes.notas` (modo Rápido): las notas de la partida en lugar de las del nivel.
  opciones: (nivel, ajustes) => (ajustes?.notas ?? notasDelNivel(nivel)).map((id) => ({ id, label: nombreClase(id, ajustes?.cifrado) })),
  generar(nivel, ajustes, anterior, contexto = {}) {
    // En Rápido, las notas de la partida al azar; si no, con más peso lo que más se falla y la nota nueva.
    const item = ajustes?.notas ? azar(ajustes.notas) : elegirPesado(notasDelNivel(nivel), contexto)
    // La octava sale al azar entre las elegidas en el arranque (`ajustes.octavas`: 1 = solo la 4).
    const octava = azar(octavasDe(ajusteAbsoluto(ajustes, 'octavas')))
    const nota = `${item}${octava}`
    return {
      item,
      sonido: { notas: [nota], modo: 'secuencia', duracion: 1.6 },
      notas: [nota],
      sonidoDe: (id) => ({ notas: [`${id}${octava}`], modo: 'secuencia', duracion: 1.6 }),
      explicacion: `Sonó ${nombreCifrado(nota, ajustes?.cifrado)} (${hz(frecuencia(nota))}).`,
    }
  },
}


// ---------------------------------------------------------------------------
// Funciones (se abre con la lección 5.1): suena la casa (el I) y luego un acorde: ¿T, S o D?
// Propuesta aprobada de «las tres perillas» (https://claude.ai/artifact/3L2HVesmNfUkDZ9ww1Z2BF):
//  - Nivel = qué entra (los grados que pueden sonar).
//  - Dificultad = cómo suena: aquí, las TONALIDADES (y luego inversiones y registro), no las octavas.
// ---------------------------------------------------------------------------

/** Lo que se suma en cada nivel (el 5 es la frase: suenan cuatro acordes y se pregunta por el último). */
/** `nuevos`: los grados que entran en ese nivel (cada uno tiene que salir bien 2 veces para aprobarlo; el I no, que sale poco). */
const NIVELES_FUNCIONES = [
  { nombre: 'T o D', grados: ['I', 'V'], nuevos: ['V'] },
  { nombre: '+ Subdominante', grados: ['I', 'IV', 'V'], nuevos: ['IV'] },
  { nombre: '+ vi y ii', grados: ['I', 'ii', 'IV', 'V', 'vi'], nuevos: ['vi', 'ii'] },
  { nombre: 'Los 7 acordes', grados: ROMANOS, nuevos: ['iii', 'vii°'] },
  { nombre: 'Dentro de una frase', grados: ROMANOS, frase: true, nuevos: [] },
]

/** Dificultad = tonalidades: 1 Do · 2 Do, Sol y Fa · 3 todas las mayores · 4 + inversiones · 5 + registro amplio. */
const DIFICULTADES_FUNCIONES = ['Do', 'Do, Sol y Fa', 'Todas las mayores', '+ inversiones', '+ registro amplio']
const TONICAS = { 1: ['C'], 2: ['C', 'G', 'F'], 3: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'] }

/** La tónica con octava, en el centro del teclado (entre Sol3 y Fa♯4). */
function tonicaCentrada(pc) {
  const m = Note.midi(`${pc}4`)
  return m > 66 ? `${pc}3` : `${pc}4`
}

/** Las tres notas del acorde puestas lo más cerca posible de `cerca` (media de alturas): voces que se mueven poco. */
function vocesCerca(notas, cerca) {
  const base = notas.map((n) => Note.midi(n))
  let mejor = base
  for (let inv = 0; inv < 3; inv++) {
    for (const sube of [-12, 0, 12]) {
      const m = base.map((x, i) => x + (i < inv ? 12 : 0) + sube).sort((a, b) => a - b)
      const media = (m[0] + m[1] + m[2]) / 3
      const mejorMedia = (mejor[0] + mejor[1] + mejor[2]) / 3
      if (Math.abs(media - cerca) < Math.abs(mejorMedia - cerca)) mejor = m
    }
  }
  return mejor
}

/**
 * Un acorde de la tonalidad listo para sonar: las voces de arriba cerca de Mi4 y el bajo abajo (la fundamental; con
 * `inversion`, la 3.ª o la 5.ª). Devuelve las notas (bajo primero).
 */
function vozFuncion(tonica, romano, { inversion = 0, subir = 0 } = {}) {
  const a = acordeDeGrado(tonica, romano)
  const arriba = vocesCerca(a.notas, 65 + subir)
  const bajoPc = Note.chroma(a.notas[inversion])
  // El bajo: la primera nota con ese nombre por debajo de las voces, entre Mi2 y Sol3.
  let bajo = arriba[0] - 1
  while (((bajo % 12) + 12) % 12 !== bajoPc) bajo--
  if (bajo > 55) bajo -= 12
  if (bajo < 40) bajo += 12
  return [bajo, ...arriba].map((m) => Note.fromMidiSharps(m))
}

const FRASES_ANTES = [['I', 'vi', 'IV'], ['I', 'IV', 'ii'], ['vi', 'IV', 'I'], ['I', 'V', 'vi'], ['I', 'ii', 'V'], ['IV', 'I', 'vi'], ['I', 'iii', 'IV']]

export const modoFunciones = {
  id: 'funciones',
  titulo: 'Funciones',
  acento: 'var(--color-armonia)',
  descripcion: 'Suena la casa y luego un acorde: ¿tónica, subdominante o dominante?',
  info:
    'Cada acorde tiene un **trabajo**: la **tónica** es la casa, la **subdominante** sale de ella y la **dominante** ' +
    'pide volver. Primero suena el **I** (la casa) y luego otro acorde. Empiezas con T o D y en cada nivel entran más ' +
    'acordes; en el último, suena una frase y se pregunta por el final. Subes al acertar **8 de las últimas 10**, ' +
    'con los acordes nuevos bien **2 veces**. ' +
    'La dificultad abre más tonalidades.',
  pregunta: '¿Qué función tiene?',
  requiere: '5.1',
  dificultad: true,
  claveDificultad: 'dificultad',
  nombreDificultad: 'Tonalidad',
  puntosDificultad: (d) => ({ encendidos: DIFICULTADES_FUNCIONES.map((_, i) => i < d), etiquetas: DIFICULTADES_FUNCIONES }),
  // Puntitos del Nivel: los 7 grados (el I abajo) con los que pueden sonar.
  puntosNivel: (nivel) => {
    const n = NIVELES_FUNCIONES[Math.max(1, Math.min(NIVELES_FUNCIONES.length, nivel)) - 1]
    return { encendidos: ROMANOS.map((rn) => n.grados.includes(rn)), etiquetas: ROMANOS.map((rn) => `${rn} · ${FUNCIONES[FUNCION_GRADO[rn]].nombre}`) }
  },
  niveles: NIVELES_FUNCIONES.length,
  nuevosEnNivel: (nivel) => [NIVELES_FUNCIONES[nivel - 1]?.nombre].filter(Boolean),
  // Lo que se cubre son los GRADOS (la respuesta es la función): la pregunta lleva `elemento` = el grado.
  elementosNuevos: (nivel) => NIVELES_FUNCIONES[nivel - 1]?.nuevos ?? [],
  nombreItem: (id) => FUNCIONES[id]?.nombre ?? id,
  // Nivel 1: solo T y D; desde el 2, las tres.
  opciones: (nivel) => (nivel <= 1 ? ['T', 'D'] : ORDEN_FUNCIONES).map((id) => ({ id, label: `${FUNCIONES[id].nombre} · ${id}` })),
  generar(nivel, ajustes = {}, anterior, contexto = {}) {
    const n = NIVELES_FUNCIONES[Math.max(1, Math.min(NIVELES_FUNCIONES.length, nivel)) - 1]
    const dif = ajusteAbsoluto(ajustes, 'dificultad')
    const tonica = tonicaCentrada(azar(TONICAS[Math.min(3, dif)]))
    const subir = dif >= 5 ? azar([-7, 0, 7]) : 0
    const inversion = () => (dif >= 4 ? entre(0, 2) : 0)
    // En los niveles 1–4 sale un grado distinto de la casa la mayoría de las veces (el I solo de vez en cuando).
    const posibles = n.grados.filter((rn) => rn !== anterior?.romano)
    const frase = n.frase ? azar(FRASES_ANTES) : ['I']
    const romano = n.frase
      ? azar(ROMANOS.filter((rn) => rn !== frase.at(-1)))
      : Math.random() < 0.15
        ? 'I'
        : elegirPesado(posibles.some((rn) => rn !== 'I') ? posibles.filter((rn) => rn !== 'I') : n.grados.filter((rn) => rn !== 'I'), { nuevos: contexto.nuevos })
    const item = FUNCION_GRADO[romano]
    const acorde = vozFuncion(tonica, romano, { inversion: inversion(), subir })
    const antes = frase.map((rn) => vozFuncion(tonica, rn, { inversion: rn === 'I' && !n.frase ? 0 : inversion(), subir }))
    const sonido = { notas: [...antes, acorde], intervalo: 1.0, duracion: 0.95 }
    const a = acordeDeGrado(tonica, romano)
    const nombreTonalidad = `${nombre(tonica, { octava: false })} mayor`
    // Cómo sonaría la otra función: su acorde principal desde la casa.
    const sonidoDe = (id) => ({ notas: [...antes, vozFuncion(tonica, FUNCIONES[id].jefe, { subir })], intervalo: 1.0, duracion: 0.95 })
    const porque = { T: 'descansa: es de la familia de la casa', S: 'sale de casa sin prisa', D: 'pide volver a casa' }[item]
    return {
      item,
      elemento: romano,
      romano,
      sonido,
      notas: acorde.slice(1),
      sonidoDe,
      explicacion: `${cifrado(a.raiz, a.tipo)} es el **${romano}** de ${nombreTonalidad}: ${FUNCIONES[item].nombre.toLowerCase()}, ${porque}.`,
    }
  },
}

export const MODOS_OIDO = [modoIntervalos, modoAcordes, modoFunciones, modoAbsoluto]

export function getModoOido(id) {
  return MODOS_OIDO.find((m) => m.id === id) ?? null
}
