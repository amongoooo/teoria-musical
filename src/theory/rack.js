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
 * y el ÁRBOL DE GÉNEROS: https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE). El mismo kit; cambian el tempo, dónde cae
 * el bombo y dónde cae la caja. Cuatro TRONCOS rítmicos (pop = backbeat, boom bap = hip hop, house = four on the
 * floor, dembow = tresillo 3 + 3 + 2) y RAMAS que son «su padre más un cambio» (`padres`, `cambio`). Patrones
 * simplificados a 16 pasos para aprender la huella de cada uno.
 *
 * Cada género: `tronco` (en qué árbol va), `nivel` (fila del árbol, 0 = el tronco), `padres` (uno o dos; el primero es
 * del que se parte al programarlo), `abre` (lección que lo abre sin padre: los cinco de la P1.2), `leccion` (lección
 * que hace falta ADEMÁS de dominar al padre: «Se abre con la P1.3»), `swing` (0–1, la perilla del rack) y `cambio`
 * (qué cambia respecto al padre, en una frase). El árbol vive en theory/generos.js y pages/Generos.jsx.
 */
export const GENEROS = {
  // ----- Tronco Pop (backbeat) -----
  pop: {
    id: 'pop', nombre: 'Pop', bpm: 118, rango: '100–130 BPM', tronco: 'pop', nivel: 0, abre: '12.2',
    patron: { kick: [0, 8], snare: [4, 12], hat: CORCHEAS },
    huella: 'El **backbeat**: bombo en el 1 y el 3, caja en el 2 y el 4. De aquí sale casi todo.',
    cambio: 'El tronco: bombo en el 1 y el 3, caja en el 2 y el 4 (**backbeat**). De aquí sale casi todo.',
  },
  rock: {
    id: 'rock', nombre: 'Rock', bpm: 120, rango: '110–140 BPM', tronco: 'pop', nivel: 1, padres: ['pop'],
    patron: { kick: [0, 8, 10], snare: [4, 12], hat: CORCHEAS },
    cambio: 'Un **bombo más** en la «y» del 3: empuja hacia el 4.',
  },
  funk: {
    id: 'funk', nombre: 'Funk', bpm: 100, rango: '95–115 BPM', tronco: 'pop', nivel: 1, padres: ['pop'],
    patron: { kick: [0, 6, 10], snare: [4, 12], hat: SEMICORCHEAS },
    cambio: 'El bombo se **sincopa** (la «y» del 2 y del 3) y los hats pasan a **semicorcheas**.',
  },
  // ----- Tronco Boom bap (hip hop) -----
  boomBap: {
    id: 'boomBap', nombre: 'Boom bap', bpm: 90, rango: '85–95 BPM', tronco: 'boomBap', nivel: 0, abre: '12.2',
    patron: { kick: [0, 7, 10], snare: [4, 12], hat: CORCHEAS },
    huella: 'El backbeat con el **bombo sincopado**: rebota. El tronco del hip hop.',
    cambio: 'El tronco del hip hop: el backbeat con el **bombo sincopado**, a 90.',
  },
  lofi: {
    id: 'lofi', nombre: 'Lo-fi', bpm: 80, rango: '70–90 BPM', tronco: 'boomBap', nivel: 1, padres: ['boomBap'], swing: 0.6,
    patron: { kick: [0, 10], snare: [4, 12], hat: SEMICORCHEAS },
    cambio: 'Más lento, **un bombo menos** y hats en semicorcheas con **swing**: la «e» y la «a» llegan tarde.',
  },
  trap: {
    id: 'trap', nombre: 'Trap', bpm: 140, rango: '130–150 BPM', tronco: 'boomBap', nivel: 1, padres: ['boomBap'], abre: '12.2',
    patron: { kick: [0, 7, 11], clap: [8], hat: SEMICORCHEAS },
    huella: '**Medio tiempo**: una sola caja, en el 3. A 140 se siente como 70; los hats corren.',
    cambio: '**Medio tiempo**: una sola palmada, en el 3, a 140. Los hats corren en semicorcheas.',
  },
  dnb: {
    id: 'dnb', nombre: 'Drum & bass', bpm: 174, rango: '160–180 BPM', tronco: 'boomBap', nivel: 1, padres: ['boomBap'],
    patron: { kick: [0, 10], snare: [4, 12], hat: CORCHEAS },
    cambio: 'El breakbeat **a 174**: el bombo solo en el 1 y la «y» del 3.',
  },
  drill: {
    id: 'drill', nombre: 'Drill', bpm: 142, rango: '138–145 BPM', tronco: 'boomBap', nivel: 2, padres: ['trap'], leccion: '12.3',
    patron: { kick: [0, 10, 13], clap: [8, 14], hat: CORCHEAS },
    cambio: 'Hats que tropiezan y una **palmada corrida** antes del 1.',
  },
  phonk: {
    id: 'phonk', nombre: 'Phonk', bpm: 130, rango: '120–140 BPM', tronco: 'boomBap', nivel: 2, padres: ['trap'], leccion: '12.4',
    patron: { kick: [0, 7, 11], clap: [8], hat: SEMICORCHEAS, tom: [0, 3, 6, 10, 12] },
    cambio: 'El trap con **cencerro** y el 808 distorsionado.',
  },
  // ----- Tronco House (four on the floor) -----
  house: {
    id: 'house', nombre: 'House', bpm: 124, rango: '120–128 BPM', tronco: 'house', nivel: 0, abre: '12.2',
    patron: { kick: CUATRO, clap: [4, 12], ohat: [2, 6, 10, 14] },
    huella: '**Four on the floor**: bombo en los cuatro tiempos y el **hat abierto** en cada «y».',
    cambio: 'El tronco: **four on the floor** (bombo en los cuatro tiempos) y el hat abierto en cada «y».',
  },
  techno: {
    id: 'techno', nombre: 'Techno', bpm: 130, rango: '125–140 BPM', tronco: 'house', nivel: 1, padres: ['house'],
    patron: { kick: CUATRO, ohat: [2, 6, 10, 14], hat: SEMICORCHEAS },
    cambio: 'Más rápido, **sin palmas** y con hats en semicorcheas: una máquina.',
  },
  garage: {
    id: 'garage', nombre: 'UK garage', bpm: 132, rango: '128–135 BPM', tronco: 'house', nivel: 1, padres: ['house'], swing: 0.5,
    patron: { kick: [0, 10], clap: [4, 12], ohat: [2, 6, 10, 14], hat: [3, 7, 11, 15] },
    cambio: 'El bombo **salta** (2-step: el 1 y la «y» del 3) y entran hats en la «a», con **swing**.',
  },
  jersey: {
    id: 'jersey', nombre: 'Jersey club', bpm: 140, rango: '135–145 BPM', tronco: 'house', nivel: 1, padres: ['house'], leccion: '12.3',
    patron: { kick: [0, 4, 8, 11, 14], clap: [4, 12], hat: CORCHEAS },
    cambio: 'A 140, con el bombo en **ráfagas** al final del compás.',
  },
  dubstep: {
    id: 'dubstep', nombre: 'Dubstep', bpm: 140, rango: '138–142 BPM', tronco: 'house', nivel: 2, padres: ['garage'], leccion: '12.3',
    patron: { kick: [0, 10], clap: [8], hat: CORCHEAS },
    cambio: 'El garage a **medio tiempo**: la palmada solo en el 3.',
  },
  // ----- Tronco Dembow (tresillo 3 + 3 + 2) -----
  dembow: {
    id: 'dembow', nombre: 'Dembow', bpm: 95, rango: '90–100 BPM', tronco: 'dembow', nivel: 0, abre: '12.2',
    patron: { kick: CUATRO, snare: [3, 6, 11, 14], hat: CORCHEAS },
    huella: 'El **mismo bombo del house**, más lento. Lo que cambia es la caja: **3 + 3 + 2**.',
    cambio: 'El tronco latino: bombo en los cuatro tiempos y la caja en **3 + 3 + 2**.',
  },
  reggaeton: {
    id: 'reggaeton', nombre: 'Reggaetón', bpm: 92, rango: '88–100 BPM', tronco: 'dembow', nivel: 1, padres: ['dembow'], leccion: '12.4',
    patron: { kick: CUATRO, snare: [3, 6, 11, 14], hat: SEMICORCHEAS },
    cambio: 'El dembow con **808** y hats más llenos: el sonido de hoy.',
  },
  dominicano: {
    id: 'dominicano', nombre: 'Dembow dominicano', corto: 'Dembow dom.', bpm: 125, rango: '115–130 BPM', tronco: 'dembow', nivel: 1, padres: ['dembow'],
    patron: { kick: CUATRO, snare: [3, 6, 11, 14], hat: CORCHEAS, tom: [2, 10] },
    cambio: 'Mucho **más rápido** y con una percusión en la «y» del 1 y del 3.',
  },
  afro: {
    id: 'afro', nombre: 'Afrobeats', bpm: 105, rango: '100–115 BPM', tronco: 'dembow', nivel: 1, padres: ['dembow'], swing: 0.3,
    patron: { kick: [0, 8], snare: [4, 12], hat: SEMICORCHEAS, tom: [0, 3, 6, 8, 11, 14] },
    cambio: 'El **3 + 3 + 2** pasa a la percusión; bombo tranquilo, caja en el 2 y el 4 y un poco de **swing**.',
  },
  moombah: {
    id: 'moombah', nombre: 'Moombahton', bpm: 108, rango: '105–110 BPM', tronco: 'dembow', nivel: 1, padres: ['dembow', 'house'],
    patron: { kick: CUATRO, snare: [3, 6, 11, 14], ohat: [2, 6, 10, 14] },
    cambio: '**Dos padres**: el hat abierto del house sobre el dembow, a 108.',
  },
}

/** Las filas que hacen falta para tocar varios géneros en un mismo rack (en el orden de FILAS_RACK). */
export const filasDeGeneros = (ids) => Object.keys(FILAS_RACK).filter((f) => ids.some((id) => GENEROS[id].patron[f]?.length))

/** Un género como sonido (`sonidoRack` a su tempo). */
export const sonidoGenero = (id, opciones = {}) =>
  sonidoRack(GENEROS[id].patron, { bpm: GENEROS[id].bpm, swing: GENEROS[id].swing ?? 0, compases: 2, ...opciones })

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
export function sonidoRack(patron, { bpm = 90, compases = 2, mudas = [], swing = 0, etiqueta } = {}) {
  const groove = Object.entries(patron)
    .filter(([f]) => !mudas.includes(f) && FILAS_RACK[f])
    .flatMap(([f, pasos]) => pasos.map((inicio) => ({ nota: f, inicio: inicio + retrasoSwing(inicio, swing), velocity: velocidad(f, inicio) })))
  return { groove, tiempos: 4, porTiempo: POR_TIEMPO, bpm, compases, ...(etiqueta ? { etiqueta } : {}) }
}

/**
 * SWING del rack (la perilla, como la del Channel rack de FL Studio; árbol de géneros): retrasa los pasos impares (la
 * «e» y la «a» de cada tiempo). `swing` de 0 (recto) a 1 (tresillo: el paso cae a 1/3 de casilla más tarde).
 * Devuelve el retraso en casillas.
 */
export const retrasoSwing = (paso, swing = 0) => (paso % 2 === 1 ? (Math.max(0, Math.min(1, swing)) * 1) / 3 : 0)

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
