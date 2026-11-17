// Acordes (Módulo 4): tríadas por terceras apiladas con Tonal.js (`Chord` + `Note.transpose`).
// Las notas van en notación inglesa con octava ('C4'); los nombres en español salen de theory/notas.js.
import { Chord, Key, Note, Scale } from 'tonal'
import { nombre } from './notas.js'

/**
 * Las cuatro tríadas. `tonal` = tipo de acorde de Tonal; `terceras` = semitonos de la 3.ª de abajo y la de arriba;
 * `cifrado` = lo que se escribe tras la letra (C, Cm, C°, C+).
 */
export const TRIADAS = {
  mayor: { tonal: 'M', nombre: 'mayor', terceras: [4, 3], cifrado: '', siente: 'luminoso y estable' },
  menor: { tonal: 'm', nombre: 'menor', terceras: [3, 4], cifrado: 'm', siente: 'íntimo y melancólico' },
  dis: { tonal: 'dim', nombre: 'disminuido', terceras: [3, 3], cifrado: '°', siente: 'inquieto, tenso' },
  aum: { tonal: 'aug', nombre: 'aumentado', terceras: [4, 4], cifrado: '+', siente: 'suspendido, como un sueño' },
}

/**
 * Acordes de séptima (lección 5.2: el V7; la 5.5 usará maj7 y m7). Misma forma que TRIADAS, con una 3.ª más encima.
 * El «7» solo = dominante con séptima: tríada mayor + 7.ª menor (G7 = Sol · Si · Re · Fa).
 */
export const SEPTIMAS = {
  dom7: { tonal: '7', nombre: 'séptima', terceras: [4, 3, 3], cifrado: '7', siente: 'tensión que pide resolver' },
  maj7: { tonal: 'maj7', nombre: 'séptima mayor', terceras: [4, 3, 4], cifrado: 'maj7', siente: 'suave, soñador' },
  m7: { tonal: 'm7', nombre: 'menor séptima', terceras: [3, 4, 3], cifrado: 'm7', siente: 'relajado, cálido' },
}

/** Todos los tipos de acorde (tríadas y séptimas): lo que aceptan `triada`, `nombreAcorde` y `cifrado`. */
export const TIPOS_ACORDE = { ...TRIADAS, ...SEPTIMAS }

/** Nombre de una 3.ª por sus semitonos. */
export const TERCERA = { 3: { corto: '3m', nombre: '3.ª menor' }, 4: { corto: '3M', nombre: '3.ª mayor' } }

/**
 * Notas del acorde en estado fundamental: triada('D4', 'mayor') → ['D4', 'F#4', 'A4']; con una séptima,
 * triada('G3', 'dom7') → ['G3', 'B3', 'D4', 'F4'].
 */
export function triada(raiz, tipo = 'mayor') {
  const { intervals } = Chord.getChord(TIPOS_ACORDE[tipo].tonal, Note.pitchClass(raiz))
  return intervals.map((iv) => Note.simplify(Note.transpose(raiz, iv)))
}

/** Arpegio (las tres de una en una) y luego las tres a la vez: para el sonido de una lección. */
export const arpegioYAcorde = (notas) => [...notas, notas]

/** «Re mayor», «Si disminuido», «Sol séptima» (sin octava). */
export function nombreAcorde(raiz, tipo = 'mayor') {
  return `${nombre(/\d/.test(raiz) ? raiz : `${raiz}4`, { octava: false })} ${TIPOS_ACORDE[tipo].nombre}`
}

/** Cifrado americano: cifrado('D4', 'menor') → 'Dm'; 'F#4' mayor → 'F♯'; 'Bb3' → 'B♭'; 'G3' dom7 → 'G7'. */
export function cifrado(raiz, tipo = 'mayor') {
  const letra = Note.pitchClass(raiz).replace('#', '♯').replace(/b$/, '♭')
  return `${letra}${TIPOS_ACORDE[tipo].cifrado}`
}

/** Tipo de tríada por las semitonos de sus terceras ([4, 3] → 'mayor'), o null. */
export function tipoPorTerceras(abajo, arriba) {
  return Object.keys(TRIADAS).find((t) => TRIADAS[t].terceras[0] === abajo && TRIADAS[t].terceras[1] === arriba) ?? null
}

// ——— Acordes de la tonalidad e inversiones (lecciones 4.3 y 4.4), con Tonal `Key` ———

/** Números romanos de las tríadas de una tonalidad: mayúscula = mayor, minúscula = menor, ° = disminuido. */
export const ROMANOS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
export const ROMANOS_MENOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']

/** Tipo de tríada a partir del nombre de Tonal ('Dm' → 'menor', 'Bdim' → 'dis', 'G' → 'mayor'). */
function tipoDeTonal(nombreTonal) {
  const { quality } = Chord.get(nombreTonal)
  return { Major: 'mayor', Minor: 'menor', Diminished: 'dis', Augmented: 'aum' }[quality] ?? 'mayor'
}

/**
 * Las 7 tríadas de una tonalidad (Tonal `Key`), del I al vii°: diatonicos('C4') →
 * [{ grado: 1, romano: 'I', raiz: 'C4', tipo: 'mayor', notas: ['C4', 'E4', 'G4'], cifrado: 'C' }, …, { grado: 7, romano: 'vii°', raiz: 'B4', tipo: 'dis', … }].
 * Con octava en la tónica, cada raíz sube desde ella por la escala; sin octava, se usa la 4. `menor` = la menor natural.
 */
export function diatonicos(tonica, { menor = false } = {}) {
  const tonicaOct = /\d/.test(tonica) ? tonica : `${tonica}4`
  const pc = Note.pitchClass(tonicaOct)
  const triadas = menor ? Key.minorKey(pc).natural.triads : Key.majorKey(pc).triads
  const romanos = menor ? ROMANOS_MENOR : ROMANOS
  const escala = Scale.degrees(`${tonicaOct} ${menor ? 'minor' : 'major'}`)
  return triadas.map((t, i) => {
    const raiz = Note.simplify(escala(i + 1))
    const tipo = tipoDeTonal(t)
    return { grado: i + 1, romano: romanos[i], raiz, tipo, notas: triada(raiz, tipo), cifrado: cifrado(raiz, tipo) }
  })
}

/**
 * El acorde de un número romano en una tonalidad: acordeDeGrado('G3', 'vi') → { raiz: 'E4', tipo: 'menor', … }.
 * 'V7' = la dominante con séptima (5.2): acordeDeGrado('F4', 'V7') → C7 (C5 · E5 · G5 · B♭5); en menor también es
 * mayor con 7.ª (sale de la menor armónica): acordeDeGrado('A3', 'V7', { menor: true }) → E7.
 * Otras séptimas (5.5): el grado + '7' o 'maj7'. Sobre una tríada mayor, '7' = séptima de dominante ('I7', 'IV7' del
 * blues: C7 y F7 en Do) y 'maj7' = séptima mayor ('Imaj7' → Cmaj7); sobre una menor, '7' = menor séptima ('ii7' → Dm7).
 */
export function acordeDeGrado(tonica, romano, opciones) {
  const [, grado, septima] = /^(.*?)(maj7|7)?$/.exec(romano)
  if (septima) {
    const t = diatonicos(tonica, opciones)
    const base = romano === 'V7' ? t[4] : t.find((a) => a.romano === grado)
    if (!base) return null
    const tipo = romano === 'V7' || (base.tipo === 'mayor' && septima === '7') ? 'dom7' : base.tipo === 'mayor' ? 'maj7' : base.tipo === 'menor' && septima === '7' ? 'm7' : null
    if (!tipo) return null
    return { ...base, romano, tipo, notas: triada(base.raiz, tipo), cifrado: cifrado(base.raiz, tipo) }
  }
  return diatonicos(tonica, opciones).find((a) => a.romano === romano) ?? null
}

/**
 * Inversión de un acorde: las `n` notas de abajo suben una octava.
 * inversion(['C4', 'E4', 'G4'], 1) → ['E4', 'G4', 'C5'] (1.ª: la 3.ª en el bajo); 2 → ['G4', 'C5', 'E5'] (la 5.ª en el bajo).
 */
export function inversion(notas, n = 0) {
  const k = ((n % notas.length) + notas.length) % notas.length
  return [...notas.slice(k), ...notas.slice(0, k).map((x) => Note.transpose(x, '8P'))]
}

/** Nombre de cada inversión. */
export const INVERSIONES = ['estado fundamental', '1.ª inversión', '2.ª inversión']

/** Cifrado con barra: cifradoInversion('C4', 'mayor', 1) → 'C/E'; con 0, 'C'. */
export function cifradoInversion(raiz, tipo = 'mayor', n = 0) {
  if (!n) return cifrado(raiz, tipo)
  const bajo = Note.pitchClass(triada(raiz, tipo)[n]).replace('#', '♯').replace(/b$/, '♭')
  return `${cifrado(raiz, tipo)}/${bajo}`
}

/** Nombre corto de los intervalos que se apilan en un acorde (por semitonos): 3 → '3m', 4 → '3M', 5 → '4J'. */
// 7, 8 y 9 (5J, 6m, 6M) son los saltos de un voicing abierto (lección 4.5): 1 · 5 · 3 una octava arriba.
export const APILADO = {
  3: { corto: '3m', nombre: '3.ª menor' },
  4: { corto: '3M', nombre: '3.ª mayor' },
  5: { corto: '4J', nombre: '4.ª justa' },
  6: { corto: '4A', nombre: '4.ª aumentada' },
  7: { corto: '5J', nombre: '5.ª justa' },
  8: { corto: '6m', nombre: '6.ª menor' },
  9: { corto: '6M', nombre: '6.ª mayor' },
}

/**
 * Voicing abierto de una tríada en estado fundamental (lección 4.5): la 3.ª sube una octava.
 * abierto(['C3', 'E3', 'G3']) → ['C3', 'G3', 'E4'] (de abajo arriba: fundamental, 5.ª, 3.ª = una 10.ª).
 */
export function abierto(notas) {
  const [f, t, q] = notas
  return [f, q, Note.transpose(t, '8P')]
}

// ——— Funciones (lección 5.1): tónica, subdominante y dominante ———

/**
 * Las tres funciones, en el orden de la frase T → S → D. `jefe` = su acorde principal en mayor; `corto` = la palabra
 * que la resume (lo que se siente).
 */
export const FUNCIONES = {
  T: { id: 'T', nombre: 'Tónica', corto: 'Casa', jefe: 'I' },
  S: { id: 'S', nombre: 'Subdominante', corto: 'Salir', jefe: 'IV' },
  D: { id: 'D', nombre: 'Dominante', corto: 'Tensión', jefe: 'V' },
}
export const ORDEN_FUNCIONES = ['T', 'S', 'D']

/** Función de cada grado en mayor (el iii, el más ambiguo, cuenta como tónica). */
export const FUNCION_GRADO = { I: 'T', vi: 'T', iii: 'T', IV: 'S', ii: 'S', V: 'D', 'vii°': 'D' }

/** Función de un número romano: funcionDe('vi') → 'T'. */
export const funcionDe = (romano) => FUNCION_GRADO[romano] ?? null

/** Las notas (sin octava) que comparten dos acordes: notasComunes(['A4','C5','E5'], ['C4','E4','G4']) → ['C', 'E']. */
export function notasComunes(a, b) {
  const otras = new Set(b.map((n) => Note.chroma(n)))
  return a.filter((n) => otras.has(Note.chroma(n))).map((n) => Note.pitchClass(n))
}

/**
 * Los 7 acordes de una tonalidad mayor repartidos por función, el jefe primero y luego por cercanía (vi antes que iii):
 * funcionesDe('C4') → { T: [I, vi, iii], S: [IV, ii], D: [V, vii°] }, cada uno con `funcion` y `comunes` (las notas que
 * comparte con su jefe; vacío en el jefe).
 */
export function funcionesDe(tonica) {
  const acordes = diatonicos(tonica)
  const de = (rn) => acordes.find((a) => a.romano === rn)
  const orden = { T: ['I', 'vi', 'iii'], S: ['IV', 'ii'], D: ['V', 'vii°'] }
  return Object.fromEntries(
    ORDEN_FUNCIONES.map((f) => {
      const jefe = de(FUNCIONES[f].jefe)
      return [f, orden[f].map((rn) => ({ ...de(rn), funcion: f, comunes: rn === jefe.romano ? [] : notasComunes(de(rn).notas, jefe.notas) }))]
    }),
  )
}

// ——— Tensión y resolución (lección 5.2): el V7 y su tritono ———

/** El tritono: 6 semitonos, tres tonos, la mitad de la octava (en Tonal, '4A' o '5d'). */
export const TRITONO = 6

/**
 * Cómo resuelve un V7 en su tónica: la **sensible** (la 3.ª del V7) sube un semitono a la tónica y la **7.ª** baja a la
 * 3.ª de la tónica (un semitono en mayor, un tono en menor). Las dos notas tensas forman un tritono que se cierra.
 * resolucionV7('G3') → { v7: ['G3', 'B3', 'D4', 'F4'], tonica: 'C4', tipoTonica: 'mayor',
 *   sensible: { desde: 'B3', hacia: 'C4' }, septima: { desde: 'F4', hacia: 'E4' }, acordes: [[G7…], [C…]] }
 * `menor: true` → E7 → Am (Re → Do baja un tono). `acordes` = el V7 y el acorde al que llega, con cada voz movida lo
 * mínimo (el bajo salta a la tónica, la 5.ª del V7 baja un tono): para el sonido de la resolución.
 */
export function resolucionV7(raiz, { menor = false } = {}) {
  const v7 = triada(raiz, 'dom7')
  const [f, t, q, s] = v7
  const tonica = Note.simplify(Note.transpose(t, '2m'))
  const sensible = { desde: t, hacia: tonica }
  const septima = { desde: s, hacia: Note.simplify(Note.transpose(s, menor ? '-2M' : '-2m')) }
  const llegada = [Note.simplify(Note.transpose(f, '-5P')), Note.simplify(Note.transpose(q, '-2M')), sensible.hacia, septima.hacia]
  return { v7, tonica, tipoTonica: menor ? 'menor' : 'mayor', sensible, septima, acordes: [v7, llegada] }
}

// ——— Cadencias (lección 5.3): cómo termina una frase ———

/**
 * Las cuatro cadencias, de la más cerrada a la más abierta. `formula` = lo que se ve en grande (los dos últimos grados),
 * `corto` = lo que se siente (la puntuación) e `intensidad` = cuánto color lleva su caja en Clasificar (más abierta =
 * más intensa, como T → S → D).
 */
export const CADENCIAS = {
  autentica: { id: 'autentica', formula: 'V → I', nombre: 'Auténtica', corto: 'Punto final', intensidad: 12 },
  plagal: { id: 'plagal', formula: 'IV → I', nombre: 'Plagal', corto: 'Amén', intensidad: 18 },
  rota: { id: 'rota', formula: 'V → vi', nombre: 'Rota', corto: 'Sorpresa', intensidad: 28 },
  semi: { id: 'semi', formula: '… → V', nombre: 'Semicadencia', corto: 'Coma', intensidad: 40 },
}
export const ORDEN_CADENCIAS = ['autentica', 'plagal', 'semi', 'rota']

/**
 * La cadencia que forman los dos últimos grados de una frase: cadenciaDe('V7', 'I') → 'autentica',
 * cadenciaDe('IV', 'I') → 'plagal', cadenciaDe('ii', 'V') → 'semi', cadenciaDe('V', 'vi') → 'rota'; otra cosa → null.
 */
export function cadenciaDe(penultimo, ultimo) {
  const dominante = /^V7?$/.test(penultimo)
  if (/^V7?$/.test(ultimo)) return 'semi'
  if (ultimo === 'I' && dominante) return 'autentica'
  if (ultimo === 'I' && /^iv$/i.test(penultimo)) return 'plagal'
  if (ultimo === 'vi' && dominante) return 'rota'
  return null
}
