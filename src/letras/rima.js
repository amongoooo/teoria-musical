// Rima de una palabra POR COMO SUENA en el español de México (seseo y yeísmo):
//  - consonante: todo lo que suena desde la vocal tónica (corazón / razón → «on»; calle / valle → «aye»)
//  - asonante: solo las vocales de ahí (la tónica y la última): noche / doce → «o-e»
// Se igualan: c (ante e, i), z y s; ll e y; b y v; la h no suena; qu y k; gu (ante e, i) y g; g (ante e, i) y j.
import { analizarPalabra, esVocal, vocalPrincipal } from './silabas.js'

const SIN_TILDE = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }

/** Cómo suena un trozo de palabra (en letras simples): «ción» → «sion», «calle» → «caye», «vive» → «bibe». */
export function sonido(texto) {
  let t = [...texto.toLowerCase()].map((c) => SIN_TILDE[c] ?? c).join('')
  t = t
    .replace(/ch/g, 'C')
    .replace(/qu(?=[ei])/g, 'k')
    .replace(/gu(?=[ei])/g, 'G')
    .replace(/c(?=[ei])/g, 's')
    .replace(/c/g, 'k')
    .replace(/g(?=[ei])/g, 'j')
    .replace(/G/g, 'g')
    .replace(/z/g, 's')
    .replace(/ll/g, 'y')
    .replace(/y$/g, 'i')
    .replace(/v/g, 'b')
    .replace(/w/g, 'u')
    .replace(/x/g, 'ks')
    .replace(/h/g, '')
    .replace(/rr/g, 'R')
  return t.replace(/C/g, 'ch')
}

const vocalSimple = (c) => SIN_TILDE[c] ?? c

/**
 * Rima de una palabra: { consonante, asonante, tipo, silabas, tonica }.
 * `consonante` es lo que suena desde la vocal tónica; `asonante`, sus vocales principales (tónica + última).
 */
export function rima(palabra) {
  const a = analizarPalabra(palabra)
  const { silabas: sils, tonica: t } = a
  if (!sils.length) return { ...a, consonante: '', asonante: '' }
  const sil = sils[t]
  const v = vocalPrincipal(sil)
  const cola = sil.slice(Math.max(0, v)) + sils.slice(t + 1).join('')
  const vocalT = vocalSimple(sil[v] ?? '')
  let asonante = vocalT === 'y' ? 'i' : vocalT
  if (t < sils.length - 1) {
    const ultima = sils.at(-1)
    const vu = vocalPrincipal(ultima)
    const c = ultima[vu]
    if (c) asonante += '-' + (c === 'y' ? 'i' : vocalSimple(c))
  }
  return { ...a, consonante: sonido(cola), asonante }
}

/** ¿Riman? 'consonante' | 'asonante' | null. La misma palabra repetida no cuenta como rima. */
export function riman(a, b) {
  const ra = typeof a === 'string' ? rima(a) : a
  const rb = typeof b === 'string' ? rima(b) : b
  if (!ra.consonante || !rb.consonante || ra.palabra === rb.palabra) return null
  if (ra.consonante === rb.consonante) return 'consonante'
  if (ra.asonante === rb.asonante) return 'asonante'
  return null
}

/** Vocales principales de cada sílaba de una palabra (sin tildes): «corazón» → ['o', 'a', 'o']. */
export function vocalesDe(palabra) {
  const { silabas: sils } = analizarPalabra(palabra)
  return sils.map((s) => {
    const i = vocalPrincipal(s)
    const c = s[i]
    return c ? (c === 'y' ? 'i' : vocalSimple(c)) : ''
  }).filter(Boolean)
}

export { esVocal }
