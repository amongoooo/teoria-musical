// Flow (Parte 4 del plan «Ritmo y Letras»): las sílabas de un verso sobre las casillas del compás (semicorcheas:
// 16 por compás de 4/4). Funciones puras; se prueban con node src/letras/flow.test.mjs
import { DEBILES } from './analisis.js'

export const POR_COMPAS = 16
/** Como mucho dos compases por verso (32 sílabas). */
export const MAX_COMPASES = 2

const limpio = (t) => t.toLowerCase()

/**
 * Sílabas de un verso como se dicen (con sinalefa: «la‿a», una sola sílaba) y cuáles llevan acento: la tónica de cada
 * palabra, salvo las palabras cortas que suenan débiles (artículos, preposiciones…). `verso` = el de `analizar()`.
 * Devuelve [{ texto, tonica }].
 */
export function silabasFlow(verso, { porPalabra = false } = {}) {
  const fuera = []
  verso.palabras.forEach((p, i) => {
    const debil = p.silabas.length === 1 && DEBILES.has(limpio(p.texto))
    p.silabas.forEach((s, j) => {
      const sil = { texto: s, tonica: !debil && j === p.tonica }
      if (j === 0 && !porPalabra && verso.sinalefas.includes(i) && fuera.length) {
        const antes = fuera.at(-1)
        fuera[fuera.length - 1] = { texto: `${antes.texto}‿${s}`, tonica: antes.tonica || sil.tonica }
      } else fuera.push(sil)
    })
  })
  return fuera
}

/** Cuántos compases hacen falta para `n` sílabas (1 o 2). */
export function compasesPara(n) {
  return Math.min(MAX_COMPASES, Math.max(1, Math.ceil(n / POR_COMPAS)))
}

/** Reparte `n` sílabas a lo largo de `total` casillas, lo más parejo posible (siempre en orden y sin repetir). */
export function repartir(n, total) {
  const m = Math.min(n, total)
  return Array.from({ length: m }, (_, i) => Math.floor((i * total) / m))
}

/**
 * Coloca un toque: la casilla más cercana a `t` (segundos desde el 1 del primer compás), siempre después de la
 * anterior. Devuelve la casilla o null si ya no cabe.
 */
export function casillaDeToque(t, semicorchea, anterior, total) {
  let c = Math.round(t / semicorchea)
  if (anterior != null) c = Math.max(c, anterior + 1)
  c = Math.max(0, c)
  return c < total ? c : null
}

/**
 * Reparte las sílabas parejo, pero con las tónicas en el pulso de corcheas (casilla par) cuando se puede: cada sílaba
 * va a la casilla libre más cercana a su sitio ideal, después de la anterior y dejando sitio a las que faltan.
 */
export function repartirConAcentos(silabas, total) {
  const n = Math.min(silabas.length, total)
  const c = []
  for (let i = 0; i < n; i++) {
    const ideal = (i * total) / n
    const desde = i ? c[i - 1] + 1 : 0
    const hasta = total - (n - i) // deja una casilla para cada una de las que faltan
    let mejor = null
    for (let x = desde; x <= hasta; x++) {
      if (silabas[i].tonica && x % 2 && !(mejor === null && x === hasta)) continue
      if (mejor === null || Math.abs(x - ideal) < Math.abs(mejor - ideal)) mejor = x
    }
    c.push(mejor ?? desde)
  }
  return c
}

/** ¿Se puede mover la sílaba `i` a la casilla `destino`? Tiene que quedar entre la de antes y la de después. */
export function puedeMover(casillas, i, destino) {
  const antes = i > 0 ? casillas[i - 1] : -1
  const despues = i < casillas.length - 1 ? casillas[i + 1] : Infinity
  return destino > antes && destino < despues && !casillas.includes(destino)
}

/** Acentos que caen en el pulso de corcheas (casilla par): { a tiempo, total }. */
export function acentosATiempo(silabas, casillas) {
  let bien = 0
  let total = 0
  silabas.forEach((s, i) => {
    if (!s.tonica || casillas[i] == null) return
    total++
    if (casillas[i] % 2 === 0) bien++
  })
  return { bien, total }
}
