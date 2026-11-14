// META GUIADA (pedido del usuario: «que al hacer las prácticas dentro del modo de bloque o rutas me saque de la práctica
// al terminar el nivel que pide; actualmente deja jugar infinito»).
// Al tocar «Practicar» en una meta de una ruta o de un bloque del Curso (useMedirMetas de components/rutaModulo.js) se
// guarda aquí QUÉ meta es y A DÓNDE volver. Mientras sigas en esa práctica, App.jsx la mide y, en cuanto se cumple
// (llegas al nivel, aprendes las palabras del tema…), cambia el entrenador por «¡Meta cumplida!» (MetaCumplida.jsx).
// Solo vive mientras la app está abierta (no se guarda en localStorage) y se olvida al salir de la práctica.
import { useSyncExternalStore } from 'react'

let actual = null // { parada, practica, volver, desde }
const oyentes = new Set()
const avisar = () => oyentes.forEach((f) => f())

/** Empieza una meta guiada: la parada de la ruta o del bloque, su práctica y el enlace al que volver. */
export function guiarMeta(parada, practica, volver) {
  actual = { parada, practica, volver, desde: Date.now() }
  avisar()
}

/** Olvida la meta guiada (al cumplirla y elegir, o al salir de la práctica). */
export function soltarMeta() {
  if (!actual) return
  actual = null
  avisar()
}

export const metaGuiada = () => actual

/** La práctica ya cumplió la meta: App.jsx cambia el entrenador por «¡Meta cumplida!». */
export function marcarCumplida() {
  if (!actual || actual.cumplida) return
  actual = { ...actual, cumplida: true }
  avisar()
}

export function useMetaGuiada() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => actual,
  )
}
