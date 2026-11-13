// Repaso espaciado (cajas de Leitner) del vocabulario: cada palabra está en una caja 1…5 y vuelve a salir dentro de
// 1, 2, 4, 8 o 16 días. Bien → sube de caja; mal → vuelve a la 1 (mañana). Caja 0 = nueva (aún no vista).
// Forma guardada: repaso = { [palabra]: [caja, proximo] }  (proximo = 'AAAA-MM-DD'; así el código de progreso es corto)
// Funciones puras (sin localStorage): se prueban con node src/letras/vocabulario.test.mjs

export const INTERVALOS = [1, 2, 4, 8, 16]
export const CAJAS = INTERVALOS.length
/** Palabras nuevas por día (las demás esperan a mañana: así el repaso no crece de golpe). */
export const NUEVAS_POR_DIA = 10

export function sumarDias(fecha, n) {
  const [y, m, d] = fecha.split('-').map(Number)
  const f = new Date(y, m - 1, d + n)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

export function diasEntre(a, b) {
  const t = (f) => {
    const [y, m, d] = f.split('-').map(Number)
    return Date.UTC(y, m - 1, d) / 864e5
  }
  return Math.round(t(b) - t(a))
}

export function estadoPalabra(repaso, p) {
  const e = repaso?.[p]
  return e ? { caja: e[0], proximo: e[1] } : { caja: 0, proximo: null }
}

/** ¿Le toca hoy? (vista y con su fecha ya cumplida). */
export function toca(repaso, p, hoy) {
  const { caja, proximo } = estadoPalabra(repaso, p)
  return caja > 0 && proximo <= hoy
}

/**
 * Apunta una respuesta. Solo mueve la caja si la palabra es nueva o le tocaba hoy (practicar de más no adelanta el
 * repaso). Devuelve { repaso, caja, proximo, movida }.
 */
export function apuntar(repaso, p, bien, hoy) {
  const { caja, proximo } = estadoPalabra(repaso, p)
  if (caja > 0 && proximo > hoy) {
    // Práctica extra: un fallo sí la trae de vuelta mañana (si la olvidaste, conviene verla pronto).
    if (bien) return { repaso, caja, proximo, movida: false }
  }
  const nueva = bien ? Math.min(CAJAS, caja + 1) : 1
  const prox = sumarDias(hoy, INTERVALOS[nueva - 1])
  return { repaso: { ...repaso, [p]: [nueva, prox] }, caja: nueva, proximo: prox, movida: true }
}

/** Resumen: { porRepasar, nuevasHoy, vistas, dominadas } (dominada = caja 4 o más: ya aguanta una semana). */
export function resumenRepaso(repaso, palabras, hoy, nuevasHechasHoy = 0) {
  let porRepasar = 0
  let vistas = 0
  let dominadas = 0
  let sinVer = 0
  for (const w of palabras) {
    const { caja, proximo } = estadoPalabra(repaso, w.p)
    if (!caja) sinVer++
    else {
      vistas++
      if (caja >= 4) dominadas++
      if (proximo <= hoy) porRepasar++
    }
  }
  return { porRepasar, nuevasHoy: Math.max(0, Math.min(sinVer, NUEVAS_POR_DIA - nuevasHechasHoy)), vistas, dominadas }
}

/**
 * La siguiente palabra: primero las que tocan hoy (las más atrasadas antes), luego nuevas (en orden de la lista, si
 * quedan de las de hoy) y si no, una ya vista al azar (práctica extra). `evitar` = las últimas que salieron.
 * `temas` limita las nuevas (y la práctica extra) a esos temas; los repasos salen de todos.
 */
export function siguiente(repaso, palabras, hoy, { temas = null, evitar = [], nuevasHechasHoy = 0, azar = Math.random } = {}) {
  const fuera = new Set(evitar)
  const deTema = (w) => !temas || temas.includes(w.tema)
  const tocan = palabras
    .filter((w) => !fuera.has(w.p) && toca(repaso, w.p, hoy))
    .sort((a, b) => (estadoPalabra(repaso, a.p).proximo < estadoPalabra(repaso, b.p).proximo ? -1 : 1))
  if (tocan.length) return { palabra: tocan[0], motivo: 'repaso' }
  if (nuevasHechasHoy < NUEVAS_POR_DIA) {
    const nueva = palabras.find((w) => deTema(w) && !fuera.has(w.p) && !estadoPalabra(repaso, w.p).caja)
    if (nueva) return { palabra: nueva, motivo: 'nueva' }
  }
  // Práctica extra: de las vistas, las de caja más baja tienen más probabilidad.
  let vistas = palabras.filter((w) => deTema(w) && !fuera.has(w.p) && estadoPalabra(repaso, w.p).caja)
  if (!vistas.length) vistas = palabras.filter((w) => !fuera.has(w.p) && estadoPalabra(repaso, w.p).caja)
  if (!vistas.length) {
    // Sin nada visto (y ya se vieron las nuevas de hoy): una nueva de todos modos.
    const nueva = palabras.find((w) => deTema(w) && !fuera.has(w.p)) ?? palabras[0]
    return { palabra: nueva, motivo: 'nueva' }
  }
  const peso = (w) => CAJAS + 1 - estadoPalabra(repaso, w.p).caja
  const total = vistas.reduce((s, w) => s + peso(w), 0)
  let r = azar() * total
  for (const w of vistas) {
    r -= peso(w)
    if (r < 0) return { palabra: w, motivo: 'extra' }
  }
  return { palabra: vistas.at(-1), motivo: 'extra' }
}

/** Combina dos repasos (de dos dispositivos): por palabra, la caja más alta; si empatan, la fecha más lejana. */
export function combinarRepaso(a = {}, b = {}) {
  const r = { ...a }
  for (const [p, e] of Object.entries(b)) {
    const x = r[p]
    if (!x || e[0] > x[0] || (e[0] === x[0] && e[1] > x[1])) r[p] = e
  }
  return r
}
