// CHANNEL RACK (Producción 1; propuesta aprobada: https://claude.ai/artifact/EqP6ik7JikQGsfGUnek2uT): filas de
// batería × 16 pasos (un compás de semicorcheas), como el de FL Studio. Un PATRÓN es { kick: [0, 7, 10], clap: [4, 12] }:
// por fila, los pasos encendidos (0 = el primero, el «1» del compás). Lo usan el paso `rack` de las lecciones
// (components/exercises/RackEjercicio.jsx), el componente components/ChannelRack.jsx y la Caja de ritmos (#/caja).

/** Pasos de un compás (4 tiempos × 4 semicorcheas) y pasos por tiempo. */
export const PASOS = 16
export const POR_TIEMPO = 4

/**
 * Las filas que puede tener el rack: el golpe que suena (audio/bateria.js), su nombre en FL Studio, cómo se llama en
 * español (con artículo, para los avisos: «al bombo le faltan…») y la fuerza con la que suena cada paso.
 */
export const FILAS_RACK = {
  kick: { id: 'kick', fl: 'Kick', nombre: 'Bombo', al: 'al bombo', el: 'el bombo', velocity: 0.95 },
  clap: { id: 'clap', fl: 'Clap', nombre: 'Palmas', al: 'a las palmas', el: 'las palmas', velocity: 0.85 },
  snare: { id: 'snare', fl: 'Snare', nombre: 'Caja', al: 'a la caja', el: 'la caja', velocity: 0.85 },
  hat: { id: 'hat', fl: 'Hat', nombre: 'Hi-hat', al: 'a los hats', el: 'los hats', velocity: 0.55 },
  ohat: { id: 'ohat', fl: 'O.Hat', nombre: 'Hat abierto', al: 'al hat abierto', el: 'el hat abierto', velocity: 0.5 },
  tom: { id: 'tom', fl: 'Perc', nombre: 'Percusión', al: 'a la percusión', el: 'la percusión', velocity: 0.6 },
}

/** Las 4 filas de siempre (como el proyecto nuevo de FL: Kick, Clap, Hat… y una percusión). */
export const FILAS_BASICAS = ['kick', 'clap', 'hat', 'tom']

/** Las filas de la Caja de ritmos: todas (desde la P1.2, también la caja y el hat abierto de los géneros). */
export const FILAS_CAJA = ['kick', 'clap', 'snare', 'hat', 'ohat', 'tom']

/** Un patrón con todas sus filas (vacías las que falten) y los pasos ordenados y sin repetir. */
export function normalizar(patron = {}, filas = FILAS_BASICAS) {
  return Object.fromEntries(filas.map((f) => [f, [...new Set(patron[f] ?? [])].filter((p) => p >= 0 && p < PASOS).sort((a, b) => a - b)]))
}

/** Enciende o apaga un paso de una fila: devuelve el patrón nuevo. */
export function conPaso(patron, fila, paso, encendido) {
  const actual = patron[fila] ?? []
  const sin = actual.filter((p) => p !== paso)
  return { ...patron, [fila]: encendido ? [...sin, paso].sort((a, b) => a - b) : sin }
}

export const encendido = (patron, fila, paso) => Boolean(patron[fila]?.includes(paso))

/** Golpes en total. */
export const golpes = (patron) => Object.values(patron).reduce((n, l) => n + l.length, 0)

/** Los hats en corcheas (un paso sí, uno no) y en semicorcheas (todos). */
export const CORCHEAS = [0, 2, 4, 6, 8, 10, 12, 14]
export const SEMICORCHEAS = Array.from({ length: PASOS }, (_, i) => i)

/** Patrones de ejemplo (todos en 16 pasos). */
export const PATRONES = {
  // Boom bap: bombo sincopado (el 1, la «a» del 2 y la «y» del 3), palmas en 2 y 4, hats en corcheas y una percusión.
  boomBap: { kick: [0, 7, 10], clap: [4, 12], hat: CORCHEAS, tom: [14] },
  // Pop: bombo en 1 y 3.
  pop: { kick: [0, 8], clap: [4, 12], hat: CORCHEAS },
}

/** Bombo en los cuatro tiempos («four on the floor»). */
export const CUATRO = [0, 4, 8, 12]

/**
 * GÉNEROS (Producción, P1.2 «El groove de cada género»; propuesta aprobada: https://claude.ai/artifact/L51wET3sh5LHPupPka3K9B
 * y el árbol: https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE). El mismo kit; cambian el tempo, dónde cae el bombo y
 * dónde cae la caja. Son los TRONCOS del árbol de géneros (pop = backbeat, boom bap = hip hop, house = four on the floor,
 * dembow = tresillo 3 + 3 + 2) más el trap, la rama más famosa del boom bap (`padre`). Más adelante el árbol suma ramas
 * aquí mismo (cada una con `padre` y su `cambio`). Patrones simplificados a 16 pasos para aprender la huella de cada uno.
 */
export const GENEROS = {
  pop: {
    id: 'pop', nombre: 'Pop', bpm: 118, rango: '100–130 BPM',
    patron: { kick: [0, 8], snare: [4, 12], hat: CORCHEAS },
    huella: 'El **backbeat**: bombo en el 1 y el 3, caja en el 2 y el 4. De aquí sale casi todo.',
  },
  boomBap: {
    id: 'boomBap', nombre: 'Boom bap', bpm: 90, rango: '85–95 BPM',
    patron: { kick: [0, 7, 10], snare: [4, 12], hat: CORCHEAS },
    huella: 'El backbeat con el **bombo sincopado**: rebota. El tronco del hip hop.',
  },
  trap: {
    id: 'trap', nombre: 'Trap', bpm: 140, rango: '130–150 BPM', padre: 'boomBap',
    patron: { kick: [0, 7, 11], clap: [8], hat: SEMICORCHEAS },
    huella: '**Medio tiempo**: una sola caja, en el 3. A 140 se siente como 70; los hats corren.',
  },
  house: {
    id: 'house', nombre: 'House', bpm: 124, rango: '120–128 BPM',
    patron: { kick: CUATRO, clap: [4, 12], ohat: [2, 6, 10, 14] },
    huella: '**Four on the floor**: bombo en los cuatro tiempos y el **hat abierto** en cada «y».',
  },
  dembow: {
    id: 'dembow', nombre: 'Dembow', bpm: 95, rango: '90–100 BPM',
    patron: { kick: CUATRO, snare: [3, 6, 11, 14], hat: CORCHEAS },
    huella: 'El **mismo bombo del house**, más lento. Lo que cambia es la caja: **3 + 3 + 2**.',
  },
}

/** Las filas que hacen falta para tocar varios géneros en un mismo rack (en el orden de FILAS_RACK). */
export const filasDeGeneros = (ids) => Object.keys(FILAS_RACK).filter((f) => ids.some((id) => GENEROS[id].patron[f]?.length))

/** Un género como sonido (`sonidoRack` a su tempo). */
export const sonidoGenero = (id, opciones = {}) => sonidoRack(GENEROS[id].patron, { bpm: GENEROS[id].bpm, compases: 2, ...opciones })

/** Los pasos que cambian de un patrón a otro, por fila: { 'kick:7': true }. */
export function cambiosPatron(antes, despues, filas) {
  const cambios = {}
  for (const f of filas) for (let p = 0; p < PASOS; p++) if (encendido(antes, f, p) !== encendido(despues, f, p)) cambios[`${f}:${p}`] = true
  return cambios
}

/**
 * El patrón como sonido de las lecciones (`groove` propio de 16 casillas, theory/bateria.js → formaGroove):
 * `{ groove, tiempos: 4, porTiempo: 4, bpm, compases }`. Las filas en `mudas` no suenan.
 * En los hats, el paso del tiempo suena un poco más fuerte (como un hi-hat tocado a mano).
 */
export function sonidoRack(patron, { bpm = 90, compases = 2, mudas = [], etiqueta } = {}) {
  const groove = Object.entries(patron)
    .filter(([f]) => !mudas.includes(f) && FILAS_RACK[f])
    .flatMap(([f, pasos]) => pasos.map((inicio) => ({ nota: f, inicio, velocity: velocidad(f, inicio) })))
  return { groove, tiempos: 4, porTiempo: POR_TIEMPO, bpm, compases, ...(etiqueta ? { etiqueta } : {}) }
}

/** Fuerza de un golpe del rack. */
export function velocidad(fila, paso) {
  const v = FILAS_RACK[fila]?.velocity ?? 0.8
  return fila === 'hat' && paso % POR_TIEMPO === 0 ? Math.min(1, v + 0.15) : v
}

/** El patrón sin una fila (para «¿Qué le falta?»). */
export const sinFila = (patron, fila) => ({ ...patron, [fila]: [] })

/**
 * Compara lo que hizo el usuario con el patrón buscado, fila por fila (solo `filas`).
 * → { ok, faltan: { fila: [pasos] }, sobran: { fila: [pasos] } }
 */
export function comparar(usuario, objetivo, filas) {
  const faltan = {}
  const sobran = {}
  for (const f of filas) {
    const u = usuario[f] ?? []
    const o = objetivo[f] ?? []
    const fa = o.filter((p) => !u.includes(p))
    const so = u.filter((p) => !o.includes(p))
    if (fa.length) faltan[f] = fa
    if (so.length) sobran[f] = so
  }
  return { ok: !Object.keys(faltan).length && !Object.keys(sobran).length, faltan, sobran }
}

const golpesTexto = (n) => `${n} ${n === 1 ? 'golpe' : 'golpes'}`

/**
 * El aviso del primer error, sin decir dónde (pista, no respuesta): «Al bombo le faltan 2 golpes y le sobra 1.»
 * Como mucho dos filas.
 */
export function avisoRack({ faltan, sobran }, filas) {
  const frases = filas
    .filter((f) => faltan[f] || sobran[f])
    .map((f) => {
      const fa = faltan[f]?.length ?? 0
      const so = sobran[f]?.length ?? 0
      const partes = []
      if (fa) partes.push(fa === 1 ? 'le falta 1 golpe' : `le faltan ${golpesTexto(fa)}`)
      if (so) partes.push(so === 1 ? 'le sobra 1' : `le sobran ${so}`)
      const al = FILAS_RACK[f].al
      return `${al[0].toUpperCase()}${al.slice(1)} ${partes.join(' y ')}.`
    })
  const extra = frases.length > 2 ? ` Y hay algo más en ${frases.length - 2 === 1 ? 'otra fila' : `otras ${frases.length - 2} filas`}.` : ''
  return frases.slice(0, 2).join(' ') + extra
}
