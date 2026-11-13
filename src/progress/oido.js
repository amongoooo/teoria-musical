// Estadísticas y racha del Entrenamiento de oído, en localStorage (la forma de los datos y las reglas están en
// entrenamiento.js, que comparte con el entrenamiento de ritmo; cada uno guarda lo suyo).
import { crearEntrenamiento } from './entrenamiento.js'

export { ACIERTOS_PARA_SUBIR, META_SEGUNDOS, TAMANO_VENTANA, hoy } from './entrenamiento.js'

/** La memoria del entrenamiento de oído (se pasa entera a las piezas compartidas: arranque, panel…). */
export const tiendaOido = crearEntrenamiento('teoria-musical:oido:v1')

/** Hook: todo el estado del entrenamiento de oído. */
export const useOido = tiendaOido.usar
export const datosDeHoy = tiendaOido.datosDeHoy
export const rachaActual = tiendaOido.rachaActual
export const ultimosDias = tiendaOido.ultimosDias
export const datosModo = tiendaOido.datosModo
export const elegirNivel = tiendaOido.elegirNivel
export const guardarAjustes = tiendaOido.guardarAjustes
export const empezarSesion = tiendaOido.empezarSesion
export const registrarRespuesta = tiendaOido.registrarRespuesta
export const getOido = tiendaOido.leer
export const importarOido = tiendaOido.importar
export const reiniciarOido = tiendaOido.reiniciar
