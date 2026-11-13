// Los tres ejercicios de vocabulario (decisión del usuario): ¿Qué significa?, Sinónimos y Completa el verso.
// Cada pregunta: { tipo, palabra (la entrada), opciones: [{ id, label }], correcta (id) }.
import { VOCABULARIO, partirVerso } from './index.js'

export const EJERCICIOS = ['significado', 'sinonimos', 'verso']

function barajar(lista, azar) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const minus = (x) => x.toLowerCase()

/** ¿Se parecen tanto que no sirven como distractor? (una es sinónimo de la otra o comparten sinónimos). */
function parientes(a, b) {
  if (a.p === b.p) return true
  const sa = new Set([a.p, ...a.s].map(minus))
  return [b.p, ...b.s].some((x) => sa.has(minus(x)))
}

/**
 * Elige `n` distractores para `w`: primero los del mismo tema y del mismo tipo (y género), luego los del mismo tipo,
 * luego cualquiera. Nunca parientes de `w`.
 */
function distractores(w, n, azar, filtro = () => true) {
  const candidatos = VOCABULARIO.filter((x) => !parientes(w, x) && filtro(x))
  const niveles = [
    (x) => x.tema === w.tema && x.t === w.t && x.g === w.g,
    (x) => x.t === w.t && x.g === w.g,
    (x) => x.t === w.t,
    () => true,
  ]
  const elegidos = []
  for (const nivel of niveles) {
    for (const x of barajar(candidatos.filter(nivel), azar)) {
      if (elegidos.length >= n) break
      if (!elegidos.includes(x) && !elegidos.some((y) => parientes(x, y))) elegidos.push(x)
    }
  }
  return elegidos.slice(0, n)
}

/** Crea una pregunta del `tipo` dado para la entrada `w`. */
export function crearPregunta(w, tipo, azar = Math.random) {
  if (tipo === 'significado') {
    const otros = distractores(w, 3, azar)
    const opciones = barajar([w, ...otros], azar).map((x) => ({ id: x.p, label: x.d }))
    return { tipo, palabra: w, opciones, correcta: w.p }
  }
  if (tipo === 'sinonimos') {
    const sinonimo = w.s[Math.floor(azar() * w.s.length)]
    // Los distractores son palabras de la lista (no sinónimos de esta).
    const otros = distractores(w, 3, azar, (x) => !w.s.map(minus).includes(minus(x.p)))
    const opciones = barajar([{ id: sinonimo, label: sinonimo }, ...otros.map((x) => ({ id: x.p, label: x.p }))], azar)
    return { tipo, palabra: w, opciones, correcta: sinonimo }
  }
  // Completa el verso: la palabra que falta (los distractores no pueden estar ya en el verso).
  const verso = partirVerso(w)
  const otros = distractores(w, 3, azar, (x) => !minus(w.v).includes(minus(x.p)))
  const opciones = barajar([w, ...otros], azar).map((x) => ({ id: x.p, label: x.p }))
  return { tipo: 'verso', palabra: w, opciones, correcta: w.p, verso }
}
