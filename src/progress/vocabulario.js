// Memoria del vocabulario de letras: racha y 5 min propios (`crearEntrenamiento`, como oído y ritmo) y, además,
// el repaso espaciado de cada palabra, las nuevas vistas hoy y los temas elegidos (viajan en «Tu progreso»).
// { …entrenamiento, repaso: { palabra: [caja, proximo] }, nuevas: [fecha, n], temas: ['noche', …] | undefined }
import { TEMAS, VOCABULARIO } from '../letras/vocabulario/index.js'
import { apuntar, resumenRepaso } from '../letras/vocabulario/repaso.js'
import { crearEntrenamiento, hoy } from './entrenamiento.js'

export const tiendaVocab = crearEntrenamiento('teoria-musical:letras-vocab:v1', { conservar: ['repaso', 'temas'] })

/** Nuevas vistas hoy (se reinicia sola al cambiar de día). */
export function nuevasDeHoy(estado = tiendaVocab.leer()) {
  const [f, n] = estado.nuevas ?? []
  return f === hoy() ? n : 0
}

/** Temas de los que salen las palabras nuevas (por defecto, todos). */
export function temasElegidos(estado = tiendaVocab.leer()) {
  const t = (estado.temas ?? []).filter((id) => TEMAS.some((x) => x.id === id))
  return t.length ? t : TEMAS.map((x) => x.id)
}

/** Enciende o apaga un tema (siempre queda al menos uno). */
export function alternarTema(id) {
  const actuales = temasElegidos()
  const next = actuales.includes(id) ? actuales.filter((t) => t !== id) : [...actuales, id]
  if (next.length) tiendaVocab.guardarCampos({ temas: next })
}

export function resumenVocab(estado = tiendaVocab.leer(), palabras = VOCABULARIO) {
  return resumenRepaso(estado.repaso ?? {}, palabras, hoy(), nuevasDeHoy(estado))
}

/**
 * Apunta una respuesta: mueve la palabra de caja (si tocaba o era nueva) y cuenta para la racha y los minutos.
 * Devuelve { caja, proximo, movida, nueva, metaCumplida }.
 */
export function responderVocab(tipo, palabra, bien) {
  const antes = tiendaVocab.leer()
  const eraNueva = !antes.repaso?.[palabra]
  const { metaCumplida } = tiendaVocab.registrarRespuesta(tipo, { item: palabra, bien, niveles: 1 })
  const e = tiendaVocab.leer()
  const r = apuntar(e.repaso ?? {}, palabra, bien, hoy())
  tiendaVocab.guardarCampos({ repaso: r.repaso, ...(eraNueva ? { nuevas: [hoy(), nuevasDeHoy(e) + 1] } : {}) })
  return { caja: r.caja, proximo: r.proximo, movida: r.movida, nueva: eraNueva, metaCumplida }
}
