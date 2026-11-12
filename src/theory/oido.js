// Datos y generadores de preguntas del Entrenamiento de oído.
// Cada modo define: niveles, opciones(nivel) y generar(nivel, ajustes, anterior).
// Una pregunta es { item, sonido, notas, sonidoDe(id), explicacion }:
//  - item: id de la respuesta correcta
//  - sonido: lo que suena (formato de audio/sonido.js)
//  - notas: notas para marcar en el piano al responder
//  - sonidoDe(id): cómo sonaría otra opción (para comparar tras responder)
import { frecuencia, hz, midi, nombre, notaDesdeMidi } from './notas.js'

function azar(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

function entre(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** Elige al azar evitando repetir el anterior (si hay más de una opción). */
function elegirDistinto(lista, anterior) {
  const resto = lista.length > 1 ? lista.filter((x) => x !== anterior) : lista
  return azar(resto)
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
  // Color del módulo con el que se relaciona (un color = un lugar): intervalos → M3, acordes → M4, notas → M1.
  acento: 'var(--color-modulo-3)',
  descripcion: 'Escucha dos notas y elige la distancia entre ellas.',
  info:
    'Cada intervalo tiene su **carácter**: la 3.ª mayor es luminosa, la 5.ª justa hueca y estable, el tritono ' +
    'inquietante. Empiezas con 3.ª mayor y 5.ª justa y en cada nivel se suman más. Subes al acertar ' +
    '**8 de las últimas 10**. La dificultad abre más octavas para la nota de abajo.',
  pregunta: '¿Qué intervalo suena?',
  dificultad: true, // rueda de Dificultad (octavas en las que puede sonar)
  direcciones: true, // Subiendo / Bajando / A la vez
  // Puntitos del arranque: los 12 intervalos de la 2.ª menor (abajo) a la octava (arriba); encendidos los del nivel.
  puntosNivel: (nivel) => {
    const ids = new Set(intervalosDelNivel(nivel))
    return { encendidos: ORDEN_INTERVALOS.map((id) => ids.has(id)), etiquetas: ORDEN_INTERVALOS.map((id) => INTERVALOS[id].nombre) }
  },
  niveles: NUEVOS_POR_NIVEL.length,
  nuevosEnNivel: (nivel) => (NUEVOS_POR_NIVEL[nivel - 1] ?? []).map((id) => INTERVALOS[id].nombre),
  nombreItem: (id) => INTERVALOS[id]?.nombre ?? id,
  opciones: (nivel) => intervalosDelNivel(nivel).map((id) => ({ id, label: INTERVALOS[id].nombre })),
  generar(nivel, ajustes = {}, anterior) {
    const direccion = ajustes.direccion ?? 'sube'
    const ids = intervalosDelNivel(nivel)
    const item = elegirDistinto(ids, anterior?.item)
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
// Acordes: mayor o menor
// ---------------------------------------------------------------------------

const ACORDES = {
  mayor: { nombre: 'Mayor', terceras: [4, 7], siente: 'luminoso y estable' },
  menor: { nombre: 'Menor', terceras: [3, 7], siente: 'íntimo y melancólico' },
}

const NIVELES_ACORDES = ['Arpegio y luego el acorde', 'Solo el acorde', 'Acordes invertidos']

function notasAcorde(raiz, tipo, inversion) {
  const [t, q] = ACORDES[tipo].terceras
  const m = [raiz, raiz + t, raiz + q]
  for (let i = 0; i < inversion; i++) m.push(m.shift() + 12)
  return m.map(notaDesdeMidi)
}

function sonidoAcorde(notas, nivel) {
  if (nivel === 1) return { notas: [...notas, notas], modo: 'secuencia', intervalo: 0.4, duracion: 1.4 }
  return { notas, modo: 'acorde', duracion: 1.8 }
}

export const modoAcordes = {
  id: 'acordes',
  titulo: 'Acordes',
  acento: 'var(--color-modulo-4)',
  descripcion: 'Escucha un acorde y decide si es mayor o menor.',
  info:
    'El acorde **mayor** suena luminoso y el **menor** íntimo; solo cambia la nota del medio (la 3.ª). ' +
    'Nivel 1: suena el arpegio y luego el acorde. Nivel 2: solo el acorde. Nivel 3: acordes invertidos ' +
    '(otra nota abajo). Subes al acertar **8 de las últimas 10**. La dificultad abre más octavas.',
  pregunta: '¿Mayor o menor?',
  dificultad: true,
  // Puntitos del arranque: los 3 niveles, encendidos hasta el elegido.
  puntosNivel: (nivel) => ({ encendidos: NIVELES_ACORDES.map((_, i) => i < nivel), etiquetas: NIVELES_ACORDES }),
  niveles: NIVELES_ACORDES.length,
  nuevosEnNivel: (nivel) => [NIVELES_ACORDES[nivel - 1]],
  nombreItem: (id) => ACORDES[id]?.nombre ?? id,
  opciones: () => Object.entries(ACORDES).map(([id, a]) => ({ id, label: a.nombre })),
  generar(nivel, ajustes) {
    // Sin evitar repeticiones: que salga dos veces seguidas el mismo es parte del reto.
    const item = azar(Object.keys(ACORDES))
    // Registro: una de las octavas elegidas con la Dificultad (1 = Do4–La4).
    const o = azar(octavasDe(ajusteAbsoluto(ajustes, 'octavas')))
    const raiz = entre(midi(`C${o}`), midi(`A${o}`))
    const inversion = nivel >= 3 ? entre(0, 2) : 0
    const notas = notasAcorde(raiz, item, inversion)
    return {
      item,
      sonido: sonidoAcorde(notas, nivel),
      notas,
      sonidoDe: (id) => sonidoAcorde(notasAcorde(raiz, id, inversion), nivel),
      explicacion: `${nombre(notaDesdeMidi(raiz), { octava: false })} ${ACORDES[item].nombre.toLowerCase()}: ${notas.map((n) => nombre(n, { octava: false })).join(' – ')}. Suena ${ACORDES[item].siente}.`,
    }
  },
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

/** Partes del círculo de nivel: al llenarlas se desbloquea una nota más. */
export const PARTES_NIVEL = 8

/**
 * Modos de juego del oído absoluto (pedido del usuario; se eligen en el arranque, `ajustes.juego`).
 *  - normal: cada acierto llena una parte del círculo de nivel (`acierto`) y cada fallo vacía una (`fallo`).
 *  - rapido: el nivel es un MULTIPLICADOR (`ajustes.multiplicador`, ×1…×10): empiezas con 2 + N notas, cada
 *    `ajustes.cadaAciertos` aciertos (8 por defecto) se suman N más y cada fallo quita una al azar. Es una partida
 *    aparte: no mueve el nivel del modo normal.
 *  - contrarreloj: como el normal, con `ajustes.segundos` por nota (5 por defecto).
 */
export const JUEGOS_ABSOLUTO = [
  { id: 'normal', nombre: 'Normal', acierto: 1, fallo: 1 },
  { id: 'rapido', nombre: 'Rápido', multiplicador: true },
  { id: 'contrarreloj', nombre: 'Contrarreloj', acierto: 1, fallo: 1, segundos: 5 },
]

/** Ajustes que se pueden cambiar en el arranque (valor por defecto y límites). */
export const AJUSTES_ABSOLUTO = {
  multiplicador: { defecto: 1, min: 1, max: 10 },
  cadaAciertos: { defecto: 8, min: 2, max: 20 },
  segundos: { defecto: 5, min: 2, max: 15 },
  octavas: { defecto: 1, min: 1, max: 5 },
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
  return 'Cada acierto llena una parte del círculo y cada fallo vacía una. Al llenarlo, se suma una nota.'
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
  acento: 'var(--color-modulo-1)',
  descripcion: 'Un juego: adivina la nota sin ninguna referencia.',
  // Burbuja ⓘ del arranque (se despliega al tocarla).
  info:
    'Es un **juego**: suena una nota sin ninguna referencia y la tocas en el piano. Empiezas con 2 notas (las demás ' +
    'tienen candado) y se desbloquea una más cada vez que llenas el círculo de 8 partes. En adultos el oído absoluto ' +
    'es muy difícil de adquirir, así que tómalo como un reto divertido, no como una promesa. Entre nota y nota suenan ' +
    'unas notas al azar y un ruido corto: así la nota anterior no te sirve de pista.',
  pregunta: '¿Qué nota es?',
  limpiar: true, // borrador de oído entre preguntas (ver limpiarOido en audio/engine.js)
  niveles: ORDEN_ABSOLUTO.length - 1,
  nombreNivel: (nivel) => `${nivel + 1} notas`,
  nuevosEnNivel: (nivel) =>
    nivel === 1 ? ORDEN_ABSOLUTO.slice(0, 2).map((c) => nombreClase(c)) : [nombreClase(ORDEN_ABSOLUTO[nivel])],
  nombreItem: (id, ajustes) => nombreClase(id, ajustes?.cifrado),
  dificultad: true,
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
  generar(nivel, ajustes) {
    const item = azar(ajustes?.notas ?? notasDelNivel(nivel))
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

export const MODOS_OIDO = [modoIntervalos, modoAcordes, modoAbsoluto]

export function getModoOido(id) {
  return MODOS_OIDO.find((m) => m.id === id) ?? null
}
