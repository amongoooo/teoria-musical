// Batería: nombres de los sonidos de percusión y patrones (grooves) de ejemplo.
// En el Piano Roll y en los sonidos, una «nota» puede ser 'kick', 'snare', 'hat', 'clap' o 'click'.
import { midi } from './notas.js'

export const PERCUSION = { kick: 'Bombo', snare: 'Caja', hat: 'Hi-hat', clap: 'Palmas', click: 'Clic', tom: 'Percusión' }

export const esPercusion = (n) => typeof n === 'string' && n in PERCUSION

/** Clave para comparar notas: el nombre si es percusión; si no, el número MIDI (así Db4 = C#4). */
export const claveNota = (n) => (esPercusion(n) ? n : midi(n))

/**
 * Patrones de 1 compás en casillas (por defecto 4 tiempos × 2 casillas = corcheas).
 * Los que tienen otro compás o resolución lo dicen en FORMA. velocity opcional (0–1).
 * Las «notas» pueden ser golpes de batería o notas de piano ('C3', 'E4'…).
 */
export const GROOVES = {
  // Metrónomo: un clic por tiempo, el primero más fuerte.
  click: [0, 2, 4, 6].map((inicio) => ({ nota: 'click', inicio, velocity: inicio === 0 ? 1 : 0.6 })),
  // Beat básico: bombo en 1 y 3, caja en 2 y 4, hi-hat en cada corchea.
  basico: [
    ...[0, 4].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    ...[2, 6].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.85 })),
    ...Array.from({ length: 8 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 2 ? 0.45 : 0.7 })),
  ],
  // Solo bombo en cada tiempo (estilo house, «four on the floor»).
  bombo: [0, 2, 4, 6].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),

  // --- Compás de 3/4 (6 casillas) ---
  // Metrónomo en 3: «1, 2, 3».
  click3: [0, 2, 4].map((inicio) => ({ nota: 'click', inicio, velocity: inicio === 0 ? 1 : 0.6 })),
  // Batería en 3/4: bombo en el 1, caja suave en 2 y 3, hi-hat en corcheas.
  vals: [
    { nota: 'kick', inicio: 0, velocity: 0.95 },
    ...[2, 4].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.5 })),
    ...Array.from({ length: 6 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 2 ? 0.35 : 0.6 })),
  ],
  // Vals al piano: bajo en el 1 y acorde en 2 y 3 («um-pa-pa»).
  valsPiano: [
    { nota: 'C3', inicio: 0, duracion: 2, velocity: 0.9 },
    ...[2, 4].flatMap((inicio) => ['E4', 'G4'].map((nota) => ({ nota, inicio, duracion: 1.5, velocity: 0.45 }))),
  ],
  // Marcha al piano en 4/4: bajo en 1 y 3, acorde en 2 y 4 («um-pa, um-pa»).
  marchaPiano: [
    { nota: 'C3', inicio: 0, duracion: 2, velocity: 0.9 },
    { nota: 'G2', inicio: 4, duracion: 2, velocity: 0.75 },
    ...[2, 6].flatMap((inicio) => ['E4', 'G4'].map((nota) => ({ nota, inicio, duracion: 1.5, velocity: 0.45 }))),
  ],

  // --- Trap a medio tiempo (16 casillas, semicorcheas) ---
  // Caja/palmas solo en el tiempo 3; hi-hats en semicorcheas con un redoble al final.
  trap: [
    ...[0, 7, 11].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    { nota: 'snare', inicio: 8, velocity: 0.95 },
    { nota: 'clap', inicio: 8, velocity: 0.8 },
    ...Array.from({ length: 16 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 4 === 0 ? 0.65 : inicio % 2 ? 0.3 : 0.45 })),
  ],
  // El mismo trap pero con la caja en 2 y 4 (como el beat básico): suena el doble de agitado.
  trapNormal: [
    ...[0, 7, 11].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    ...[4, 12].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.95 })),
    ...[4, 12].map((inicio) => ({ nota: 'clap', inicio, velocity: 0.8 })),
    ...Array.from({ length: 16 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: inicio % 4 === 0 ? 0.65 : inicio % 2 ? 0.3 : 0.45 })),
  ],

  // --- Síncopa (16 casillas, semicorcheas) ---
  // Dembow del reguetón: bombo en cada tiempo y caja en la «a» del 1 y la «y» del 2 (y lo mismo en 3–4).
  dembow: [
    ...[0, 4, 8, 12].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
    ...[3, 6, 11, 14].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.85 })),
    ...[0, 2, 4, 6, 8, 10, 12, 14].map((inicio) => ({ nota: 'hat', inicio, velocity: inicio % 4 ? 0.3 : 0.45 })),
  ],
  // Bounce del hip hop: caja en 2 y 4, pero el bombo se adelanta (la «a» del 2) y cae a contratiempo (la «y» del 3).
  bounce: [
    { nota: 'kick', inicio: 0, velocity: 0.95 },
    { nota: 'kick', inicio: 7, velocity: 0.8 },
    { nota: 'kick', inicio: 10, velocity: 0.9 },
    ...[4, 12].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.9 })),
    ...[0, 2, 4, 6, 8, 10, 12, 14].map((inicio) => ({ nota: 'hat', inicio, velocity: inicio % 4 ? 0.35 : 0.55 })),
  ],
}

// --- Swing, groove y velocity (lección 2.5) ---

/** Retraso «de tresillo»: con `conSwing(…, SWING)` la casilla impar cae a 2/3 del par de casillas. */
export const SWING = 1 / 3

/**
 * Swing: retrasa las casillas impares (las «y» en corcheas; las «e» y las «a» en semicorcheas,
 * como el Swing del Channel rack de FL Studio). `cantidad` en casillas: 0 = recto, 1/3 = tresillo.
 */
export function conSwing(eventos, cantidad = SWING) {
  return eventos.map((e) => (Math.round(e.inicio) % 2 === 1 ? { ...e, inicio: e.inicio + cantidad } : e))
}

/** Números pseudoaleatorios con semilla (mulberry32): el «humano» suena siempre igual. */
function azar(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Humanizar: pequeñas variaciones al azar de tiempo (± `tiempo` casillas) y de fuerza (± `fuerza`).
 * Con la misma `semilla` sale siempre lo mismo.
 */
export function humanizar(eventos, { tiempo = 0.08, fuerza = 0.15, semilla = 7 } = {}) {
  const r = azar(semilla)
  return eventos.map((e) => {
    const dt = (r() * 2 - 1) * tiempo
    const dv = (r() * 2 - 1) * fuerza
    return {
      ...e,
      inicio: Math.max(0, Math.round((e.inicio + dt) * 1000) / 1000),
      velocity: Math.min(1, Math.max(0.08, Math.round(((e.velocity ?? 0.8) + dv) * 100) / 100)),
    }
  })
}

const hats16 = (vel) => Array.from({ length: 16 }, (_, inicio) => ({ nota: 'hat', inicio, velocity: vel(inicio) }))

// Boom bap (hip hop) en semicorcheas: bombo en 1, 3 y la «y» del 3; caja en 2 y 4.
const BOOM_BAP = [
  ...[0, 8, 10].map((inicio) => ({ nota: 'kick', inicio, velocity: 0.95 })),
  ...[4, 12].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.9 })),
]

Object.assign(GROOVES, {
  // Corcheas rectas (el beat básico) y con swing de tresillo: la «y» se retrasa.
  shuffle: conSwing(GROOVES.basico),
  // Boom bap con hi-hats a máquina: todos iguales.
  boomBapPlano: [...BOOM_BAP, ...hats16(() => 0.6)],
  // Hi-hats con vida: fuertes en los tiempos, medios en las «y», suaves en las «e» y las «a».
  boomBap: [...BOOM_BAP, ...hats16((i) => (i % 4 === 0 ? 0.75 : i % 2 === 0 ? 0.5 : 0.22))],
  // Con ghost notes: golpes de caja muy suaves entre los principales.
  boomBapGhost: [
    ...BOOM_BAP,
    ...[7, 9, 15].map((inicio) => ({ nota: 'snare', inicio, velocity: 0.2 })),
    ...hats16((i) => (i % 4 === 0 ? 0.75 : i % 2 === 0 ? 0.5 : 0.22)),
  ],
})
// El mismo boom bap con el Swing del Channel rack (retrasa las «e» y las «a»).
GROOVES.boomBapSwing = conSwing(GROOVES.boomBap)
GROOVES.boomBapGhostSwing = conSwing(GROOVES.boomBapGhost)

/** Compás y resolución de los grooves que no son 4/4 en corcheas. */
const FORMA = {
  click3: { tiempos: 3 },
  vals: { tiempos: 3 },
  valsPiano: { tiempos: 3 },
  trap: { porTiempo: 4 },
  trapNormal: { porTiempo: 4 },
  dembow: { porTiempo: 4 },
  bounce: { porTiempo: 4 },
  boomBapPlano: { porTiempo: 4 },
  boomBap: { porTiempo: 4 },
  boomBapGhost: { porTiempo: 4 },
  boomBapSwing: { porTiempo: 4 },
  boomBapGhostSwing: { porTiempo: 4 },
}

/**
 * Forma de un groove: { eventos, tiempos, porTiempo, casillas }.
 * `groove` es un nombre de GROOVES o una lista de eventos; `tiempos` y `porTiempo`
 * (opcionales) mandan sobre los del groove.
 */
export function formaGroove(groove, { tiempos, porTiempo } = {}) {
  const base = (typeof groove === 'string' && FORMA[groove]) || {}
  const t = tiempos ?? base.tiempos ?? 4
  const p = porTiempo ?? base.porTiempo ?? 2
  return { eventos: GROOVES[groove] ?? groove, tiempos: t, porTiempo: p, casillas: t * p }
}

// ---------------------------------------------------------------------------
// Acordes sobre un beat (lección 5.6, ritmo armónico)
// ---------------------------------------------------------------------------

/**
 * Dónde empieza y acaba cada acorde, en tiempos: [{ inicio, fin }]. Cada acorde dura `tiempos`; con `adelanto` (en
 * tiempos) llega antes de lo que le toca (0.5 = en la «y» del tiempo anterior) y el de antes se corta ahí. Con
 * `ciclo: true`, el adelanto del PRIMERO también cuenta (al repetir el loop llega antes: su inicio queda negativo y el
 * último acorde acaba antes del final).
 */
export function tramosAcordes(acordes, { ciclo = false } = {}) {
  const total = acordes.reduce((s, a) => s + a.tiempos, 0)
  let t = 0
  const inicios = acordes.map((a, i) => {
    const s = t - (i > 0 || ciclo ? a.adelanto ?? 0 : 0)
    t += a.tiempos
    return s
  })
  return acordes.map((_, i) => ({ inicio: inicios[i], fin: i < acordes.length - 1 ? inicios[i + 1] : total + (ciclo ? inicios[0] : 0) }))
}

/**
 * Un sonido con ACORDES SOBRE UN BEAT: la batería del `groove` en cada compás y encima los acordes (con su bajo en la
 * primera nota), cada uno el tiempo que dura. El beat no cambia: solo cambia cada cuánto cambia el acorde.
 *   conBeat([{ notas: ['C3', 'C4', 'E4', 'G4'], tiempos: 4, adelanto?: 0.5 }, …], { groove: 'basico', bpm: 90, vueltas: 2 })
 * → sonido `groove` (sirve en `sonidos`, `rejilla` y en las rondas de `pulso`): { groove: [eventos], tiempos, porTiempo,
 *   bpm, compases: 1, metro: 4, ciclo }. `groove: null` = solo los acordes; `metro` = tiempos por compás (el metrónomo
 *   de «lo que suena» cuenta de 4 en 4); `ciclo` = tiempos de una vuelta. Las vueltas van ya escritas (así el primer
 *   acorde también se adelanta al repetir).
 */
export function conBeat(acordes, { groove = 'basico', bpm = 90, vueltas = 1, etiqueta, velocidad = 0.6, metro = 4 } = {}) {
  const forma = groove ? formaGroove(groove) : { eventos: [], porTiempo: 2 }
  const p = forma.porTiempo
  const ciclo = acordes.reduce((s, a) => s + a.tiempos, 0)
  const total = ciclo * vueltas
  const tramos = tramosAcordes(acordes, { ciclo: true })
  const eventos = []
  for (let v = 0; v < vueltas; v++) {
    acordes.forEach((a, i) => {
      const inicio = Math.max(0, v * ciclo + tramos[i].inicio)
      const fin = Math.min(total, v * ciclo + tramos[i].fin + (i === acordes.length - 1 && v === vueltas - 1 ? -tramos[0].inicio : 0))
      if (fin > inicio) eventos.push({ nota: a.notas, inicio: inicio * p, duracion: (fin - inicio) * p, velocity: velocidad })
    })
  }
  const casillasCompas = metro * p
  for (let c = 0; c < total / metro; c++) {
    for (const e of forma.eventos) if (e.inicio < casillasCompas) eventos.push({ ...e, inicio: e.inicio + c * casillasCompas })
  }
  return { groove: eventos, tiempos: total, porTiempo: p, bpm, compases: 1, metro, ciclo, ...(etiqueta ? { etiqueta } : {}) }
}

/** Los tiempos (dentro de una vuelta) en los que cambia el acorde: para «Toca en cada cambio» (`toques` de `pulso`). */
export const cambiosAcordes = (acordes) => tramosAcordes(acordes).map((t) => t.inicio)
