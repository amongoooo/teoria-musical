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
  pregunta: '¿Qué intervalo suena?',
  niveles: NUEVOS_POR_NIVEL.length,
  nuevosEnNivel: (nivel) => (NUEVOS_POR_NIVEL[nivel - 1] ?? []).map((id) => INTERVALOS[id].nombre),
  nombreItem: (id) => INTERVALOS[id]?.nombre ?? id,
  opciones: (nivel) => intervalosDelNivel(nivel).map((id) => ({ id, label: INTERVALOS[id].nombre })),
  generar(nivel, { direccion = 'sube' } = {}, anterior) {
    const ids = intervalosDelNivel(nivel)
    const item = elegirDistinto(ids, anterior?.item)
    const raiz = entre(midi('F3'), midi('F4'))
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

const NIVELES_ACORDES = [
  'Arpegio y luego el acorde',
  'Solo el acorde',
  'Acordes invertidos y en otros registros',
]

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
  pregunta: '¿Mayor o menor?',
  niveles: NIVELES_ACORDES.length,
  nuevosEnNivel: (nivel) => [NIVELES_ACORDES[nivel - 1]],
  nombreItem: (id) => ACORDES[id]?.nombre ?? id,
  opciones: () => Object.entries(ACORDES).map(([id, a]) => ({ id, label: a.nombre })),
  generar(nivel) {
    // Sin evitar repeticiones: que salga dos veces seguidas el mismo es parte del reto.
    const item = azar(Object.keys(ACORDES))
    const raiz = nivel >= 3 ? entre(midi('C3'), midi('B4')) : entre(midi('C4'), midi('A4'))
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
const CROMATICA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Nombre de la clase de nota: 'C#' -> 'Do♯'. */
export function nombreClase(clase) {
  return nombre(`${clase}4`, { octava: false })
}

function notasDelNivel(nivel) {
  const set = ORDEN_ABSOLUTO.slice(0, nivel + 1) // nivel 1 = 2 notas
  return CROMATICA.filter((c) => set.includes(c))
}

export const modoAbsoluto = {
  id: 'absoluto',
  titulo: 'Oído absoluto',
  acento: 'var(--color-modulo-1)',
  descripcion: 'Un juego: adivina la nota sin ninguna referencia.',
  pregunta: '¿Qué nota es?',
  limpiar: true, // borrador de oído entre preguntas (ver limpiarOido en audio/engine.js)
  niveles: ORDEN_ABSOLUTO.length - 1,
  nombreNivel: (nivel) => `${nivel + 1} notas`,
  nuevosEnNivel: (nivel) =>
    nivel === 1 ? ORDEN_ABSOLUTO.slice(0, 2).map(nombreClase) : [nombreClase(ORDEN_ABSOLUTO[nivel])],
  nombreItem: nombreClase,
  opciones: (nivel) => notasDelNivel(nivel).map((id) => ({ id, label: nombreClase(id) })),
  generar(nivel) {
    const item = azar(notasDelNivel(nivel))
    // Con pocas notas, siempre en la octava 4; luego cambia de octava para
    // que no se pueda adivinar comparando con la anterior.
    const octava = nivel >= 4 ? entre(3, 5) : 4
    const nota = `${item}${octava}`
    return {
      item,
      sonido: { notas: [nota], modo: 'secuencia', duracion: 1.6 },
      notas: [nota],
      sonidoDe: (id) => ({ notas: [`${id}${octava}`], modo: 'secuencia', duracion: 1.6 }),
      explicacion: `Sonó ${nombre(nota)} (${hz(frecuencia(nota))}).`,
    }
  },
}

export const MODOS_OIDO = [modoIntervalos, modoAcordes, modoAbsoluto]

export function getModoOido(id) {
  return MODOS_OIDO.find((m) => m.id === id) ?? null
}
