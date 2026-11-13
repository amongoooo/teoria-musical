// Análisis de una letra (rap / trap / canción): estrofas, versos, sílabas por verso, esquema de rima por estrofa,
// familias de rima para colorear (también rimas internas) y multisilábicas («multis») entre versos.
//
// analizar(texto, { porPalabra }) → {
//   estrofas: [{ versos: [{ texto, palabras, silabas, letra, multi }] }],
//   familias: [{ id, color, tipo: 'consonante' | 'asonante', clave, palabras }],
// }
// Cada palabra: { texto, inicio, fin, silabas, tonica, tipo, consonante, asonante, familia, final }.
import { rima, vocalesDe } from './rima.js'
import { esVocal, limpiar } from './silabas.js'

/** Colores de rima: 8 familias (tokens `--color-rima-N` de src/index.css). */
export const COLORES_RIMA = 8

/** Palabras cortas que casi siempre suenan débiles: no se colorean salvo al final del verso. */
const DEBILES = new Set(
  'a al de del el la las lo los le les un una unos unas y e o u ni que en con por para se me te nos os mi mis tu tus su sus es son ya no si sin como pero mas muy tan qué cómo'.split(
    ' ',
  ),
)

const PALABRA = /[a-záéíóúüñ]+/gi

/** Las palabras de un verso con su posición. */
function palabrasDe(verso) {
  return [...verso.matchAll(PALABRA)].map((m) => ({ texto: m[0], inicio: m.index, fin: m.index + m[0].length }))
}

/** ¿Acaba en vocal (como suena)? «hoy», «rey» sí; «amor» no. */
function acabaEnVocal(p) {
  const l = limpiar(p)
  const c = l.at(-1)
  return Boolean(c) && (esVocal(c) || (c === 'y' && l.length > 1 && esVocal(l.at(-2))))
}

/** ¿Empieza en vocal (como suena)? La h no suena; «hie-», «hue-», «ya», «yo» empiezan en consonante. */
function empiezaEnVocal(p) {
  const l = limpiar(p)
  if (l === 'y') return true
  const s = l[0] === 'h' ? l.slice(1) : l
  if (!s || !esVocal(s[0])) return false
  if (l[0] === 'h' && /^(ie|ue)/.test(s)) return false
  return true
}

/**
 * Sílabas de un verso «como se dice»: la suma de las de cada palabra menos una por cada sinalefa (una palabra que
 * acaba en vocal y la siguiente empieza en vocal se dicen juntas: «la_alegría»). Con `porPalabra`, sin sinalefas.
 */
export function silabasVerso(palabras, { porPalabra = false } = {}) {
  let n = palabras.reduce((a, p) => a + p.silabas.length, 0)
  const sinalefas = []
  if (!porPalabra) {
    for (let i = 1; i < palabras.length; i++) {
      if (acabaEnVocal(palabras[i - 1].texto) && empiezaEnVocal(palabras[i].texto)) {
        n -= 1
        sinalefas.push(i)
      }
    }
  }
  return { n, sinalefas }
}

/** Vocales de un verso, sílaba por sílaba (para las multis). */
function vocalesVerso(palabras) {
  return palabras.flatMap((p) => vocalesDe(p.texto))
}

/** Cuántas vocales seguidas coinciden contando desde el final. */
function finalComun(a, b) {
  let n = 0
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++
  return n
}

/** Una multi cuenta desde 3 vocales seguidas que suenan igual al final de dos versos. */
export const MULTI_MINIMA = 3

export function analizar(texto, { porPalabra = false } = {}) {
  // Estrofas: separadas por una línea en blanco.
  const bloques = texto
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.split('\n').filter((v) => v.trim()))
    .filter((b) => b.length)

  const estrofas = bloques.map((versos) => ({
    versos: versos.map((t) => {
      const palabras = palabrasDe(t).map((p) => {
        const r = rima(p.texto)
        return { ...p, silabas: r.silabas, tonica: r.tonica, tipo: r.tipo, consonante: r.consonante, asonante: r.asonante, familia: null, final: false }
      })
      if (palabras.length) palabras.at(-1).final = true
      const { n, sinalefas } = silabasVerso(palabras, { porPalabra })
      return { texto: t, palabras, silabas: n, sinalefas, letra: '', multi: 0 }
    }),
  }))

  // Familias de rima (para colorear, en toda la letra):
  //  1) consonantes: palabras distintas con el mismo sonido desde la tónica (en cualquier sitio del verso).
  //  2) asonantes: dentro de cada estrofa, con al menos una palabra al final de verso (la rima interna hace eco a la
  //     del final), entre palabras que no están ya en una consonante.
  const todas = estrofas.flatMap((e, ie) => e.versos.flatMap((v, iv) => v.palabras.map((p) => ({ p, ie, iv }))))
  const cuenta = (p) => p.final || !DEBILES.has(limpiar(p.texto))
  const familias = []
  const porClave = new Map()
  for (const { p } of todas) {
    if (!cuenta(p) || !p.consonante) continue
    const lista = porClave.get(p.consonante) ?? []
    lista.push(p)
    porClave.set(p.consonante, lista)
  }
  for (const [clave, lista] of porClave) {
    if (new Set(lista.map((p) => limpiar(p.texto))).size < 2) continue
    const f = { id: familias.length, tipo: 'consonante', clave, palabras: lista }
    familias.push(f)
    lista.forEach((p) => (p.familia = f.id))
  }
  estrofas.forEach((e) => {
    const libres = e.versos.flatMap((v) => v.palabras).filter((p) => p.familia === null && cuenta(p) && p.asonante)
    const porAson = new Map()
    for (const p of libres) {
      const lista = porAson.get(p.asonante) ?? []
      lista.push(p)
      porAson.set(p.asonante, lista)
    }
    for (const [clave, lista] of porAson) {
      if (!lista.some((p) => p.final)) continue
      if (new Set(lista.map((p) => limpiar(p.texto))).size < 2) continue
      const f = { id: familias.length, tipo: 'asonante', clave, palabras: lista }
      familias.push(f)
      lista.forEach((p) => (p.familia = f.id))
    }
  })
  // Colores: por orden de aparición; más de 8 familias se quedan sin color.
  const orden = []
  for (const { p } of todas) if (p.familia !== null && !orden.includes(p.familia)) orden.push(p.familia)
  orden.forEach((id, i) => (familias[id].color = i < COLORES_RIMA ? i + 1 : null))

  // Esquema por estrofa (A, B, C…): versos cuyas palabras finales riman (consonante o asonante); sin rima = «–».
  estrofas.forEach((e) => {
    const letras = new Map()
    e.versos.forEach((v) => {
      const p = v.palabras.at(-1)
      if (!p) return (v.letra = '–')
      const otro = e.versos.find((w) => w !== v && w.palabras.at(-1) && rimanFinales(p, w.palabras.at(-1)))
      if (!otro) return (v.letra = '–')
      const clave = p.familia ?? `${p.consonante}`
      if (!letras.has(clave)) letras.set(clave, String.fromCharCode(65 + letras.size))
      v.letra = letras.get(clave)
    })
    // Multis: con el verso de antes o el de dos antes (rimas cruzadas), las vocales que coinciden al final.
    const vocales = e.versos.map((v) => vocalesVerso(v.palabras))
    e.versos.forEach((v, i) => {
      const n = Math.max(i > 0 ? finalComun(vocales[i], vocales[i - 1]) : 0, i > 1 ? finalComun(vocales[i], vocales[i - 2]) : 0)
      v.multi = n >= MULTI_MINIMA ? n : 0
    })
  })

  return { estrofas, familias }
}

function rimanFinales(a, b) {
  if (limpiar(a.texto) === limpiar(b.texto)) return true // el mismo final (estribillo) también marca el esquema
  return a.consonante === b.consonante || a.asonante === b.asonante
}

/** Las palabras de la letra que riman con `palabra` (sin repetir), separadas en consonantes y asonantes. */
export function rimasEnLetra(analisis, palabra) {
  const r = rima(palabra)
  const yo = limpiar(palabra)
  const cons = new Set()
  const ason = new Set()
  for (const e of analisis.estrofas)
    for (const v of e.versos)
      for (const p of v.palabras) {
        const l = limpiar(p.texto)
        if (l === yo || DEBILES.has(l)) continue
        if (p.consonante === r.consonante) cons.add(l)
        else if (p.asonante === r.asonante) ason.add(l)
      }
  return { consonantes: [...cons], asonantes: [...ason] }
}
