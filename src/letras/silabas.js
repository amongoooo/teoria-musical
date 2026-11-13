// Sílabas y acento de una palabra en español (como se escribe; con las reglas de siempre de la RAE).
//
//  - silabas('canción') → ['can', 'ción'];  silabas('poesía') → ['po', 'e', 'sí', 'a']
//  - tonica(silabas) → índice de la sílaba que suena fuerte; tipoAcento → aguda | llana | esdrújula | sobresdrújula
//
// Reglas: entre dos núcleos, 1 consonante va con la siguiente sílaba; 2 se separan salvo los grupos que no se
// separan (pl, br, tr…, también «tl» como se dice en México: a-tlas); con 3, las dos últimas van juntas si forman
// grupo; con 4, dos y dos. «ch», «ll», «rr» son una sola consonante; la «u» de «que, qui, gue, gui» no suena.
// Vocales: dos fuertes (a, e, o, o í/ú con tilde) = hiato; con una débil sin tilde (i, u) = diptongo.

const FUERTES = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'í', 'ú'])
const VOCALES = new Set([...FUERTES, 'i', 'u', 'ü'])
const TILDES = new Set(['á', 'é', 'í', 'ó', 'ú'])
const GRUPOS = new Set(['pl', 'pr', 'bl', 'br', 'fl', 'fr', 'cl', 'cr', 'gl', 'gr', 'dr', 'tr', 'kl', 'kr', 'tl'])
const DIGRAFOS = new Set(['ch', 'll', 'rr'])

export const esVocal = (letra) => VOCALES.has(letra)

/** La palabra en minúsculas, solo letras (con tildes, ñ y ü). */
export function limpiar(palabra) {
  return palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, '')
}

/** Unidades de sonido: { t: letras, v: es vocal }. «ch», «ll», «rr», «qu», «gu» (ante e, i) van juntas. */
function unidades(p) {
  const u = []
  for (let i = 0; i < p.length; i++) {
    const c = p[i]
    const par = p.slice(i, i + 2)
    const sigue = p[i + 2]
    if (DIGRAFOS.has(par)) {
      u.push({ t: par, v: false })
      i++
    } else if ((c === 'q' || c === 'g') && p[i + 1] === 'u' && (sigue === 'e' || sigue === 'i' || sigue === 'é' || sigue === 'í')) {
      u.push({ t: par, v: false })
      i++
    } else if (c === 'y') {
      // «y» suena vocal al final tras vocal (hoy, rey, muy) o sola; si no, es consonante (yo, mayo).
      const vocal = (i === p.length - 1 && i > 0 && esVocal(p[i - 1])) || p.length === 1
      u.push({ t: c, v: vocal })
    } else u.push({ t: c, v: esVocal(c) })
  }
  return u
}

const fuerte = (u) => FUERTES.has(u.t)

/** ¿Las vocales `a` y `b` (seguidas) van en la misma sílaba? */
function diptongo(a, b) {
  if (a.t === 'y' || b.t === 'y') return true
  if (fuerte(a) && fuerte(b)) return false
  if (a.t === b.t) return false // «chiita», «duunviro»
  return true
}

/** Divide una palabra en sílabas (con sus letras originales, en minúsculas). */
export function silabas(palabra) {
  const p = limpiar(palabra)
  if (!p) return []
  const u = unidades(p)
  // Núcleos: grupos de vocales seguidas que van en la misma sílaba.
  const nucleos = [] // [desde, hasta] (índices de unidades, hasta incluido)
  for (let i = 0; i < u.length; i++) {
    if (!u[i].v) continue
    const ultimo = nucleos.at(-1)
    if (ultimo && ultimo[1] === i - 1 && diptongo(u[i - 1], u[i])) ultimo[1] = i
    else nucleos.push([i, i])
  }
  if (!nucleos.length) return [p] // sin vocales («pst»): una sola
  // Dónde empieza cada sílaba (en unidades).
  const cortes = [0]
  for (let n = 0; n < nucleos.length - 1; n++) {
    const fin = nucleos[n][1]
    const ini = nucleos[n + 1][0]
    const cons = ini - fin - 1
    let corte
    if (cons <= 1) corte = fin + 1
    else if (cons === 2) corte = GRUPOS.has(u[fin + 1].t + u[fin + 2].t) ? fin + 1 : fin + 2
    else if (cons === 3) corte = GRUPOS.has(u[fin + 2].t + u[fin + 3].t) ? fin + 2 : fin + 3
    else corte = ini - 2
    cortes.push(corte)
  }
  return cortes.map((c, i) => u.slice(c, cortes[i + 1] ?? u.length).map((x) => x.t).join(''))
}

/** Índice de la sílaba tónica: la de la tilde; si no hay, llana si acaba en vocal, n o s, y aguda si no. */
export function tonica(sils, palabra = sils.join('')) {
  const conTilde = sils.findIndex((s) => [...s].some((c) => TILDES.has(c)))
  if (conTilde >= 0) return conTilde
  if (sils.length < 2) return 0
  const ultima = limpiar(palabra).at(-1)
  return /[aeiouns]/.test(ultima) ? sils.length - 2 : sils.length - 1
}

export function tipoAcento(sils, t = tonica(sils)) {
  const desdeAtras = sils.length - 1 - t
  return ['aguda', 'llana', 'esdrújula', 'sobresdrújula'][Math.min(3, desdeAtras)]
}

/** Índice (dentro de la sílaba) de su vocal principal: la de tilde, si no la fuerte, y entre dos débiles la segunda. */
export function vocalPrincipal(silaba) {
  const letras = [...silaba]
  const tilde = letras.findIndex((c) => TILDES.has(c))
  if (tilde >= 0) return tilde
  const f = letras.findIndex((c) => FUERTES.has(c))
  if (f >= 0) return f
  const vocales = letras.flatMap((c, i) => (esVocal(c) || (c === 'y' && i === letras.length - 1) ? [i] : []))
  if (!vocales.length) return -1
  return vocales.length > 1 ? vocales[1] : vocales[0]
}

/** Todo de una palabra: { palabra, silabas, tonica, tipo }. */
export function analizarPalabra(palabra) {
  const sils = silabas(palabra)
  const t = tonica(sils, palabra)
  return { palabra: limpiar(palabra), silabas: sils, tonica: t, tipo: tipoAcento(sils, t) }
}
