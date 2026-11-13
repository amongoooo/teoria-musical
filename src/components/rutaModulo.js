// Una RUTA presentada como si fuera un MÓDULO (pedido del usuario: «que las rutas salgan igual a los módulos, mismas
// animaciones y visualmente iguales»). Así la página de la ruta reutiliza tal cual el camino de islas
// (CaminoLecciones), la cabecera (CabeceraModulo), el deslizar entre páginas (useCambioModulo) y los cuadritos
// (Cuadrito). El «módulo» de una ruta lleva `esRuta`, su ícono en lugar del número y `vecino(dir)` para pasar
// a la ruta de al lado.
import { ORDEN_RUTAS, RUTAS, estadoRuta, rutaDisponible } from '../content/rutas.js'
import { useOpciones } from '../progress/opciones.js'
import { tiendaOido } from '../progress/oido.js'
import { useProgreso } from '../progress/progreso.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { tiendaVocab } from '../progress/vocabulario.js'
import { rutas } from '../router.js'
import { Metronomo, Oreja, Pluma } from '../ui/Iconos.jsx'

/** Ícono de cada ruta (el de su práctica) y de lo que se abre en ella. */
export const ICONO_RUTA = { ritmo: Metronomo, letras: Pluma, acordes: Oreja }
export const ICONOS_ABRE = { flow: Pluma }

/** La memoria del entrenamiento de cada práctica y a dónde lleva cada modo. */
export const PRACTICAS = {
  ritmo: { tienda: tiendaRitmo, enlace: rutas.ritmo, nombre: 'Ritmo' },
  oido: { tienda: tiendaOido, enlace: rutas.oido, nombre: 'Oído' },
  letras: { tienda: tiendaVocab, enlace: () => rutas.letras(), nombre: 'Letras' },
}

/** El «módulo» de una ruta (sin estado): lo que necesitan la cabecera, los cuadritos y el deslizar. */
export function moduloDeRuta(id) {
  const ruta = RUTAS[id]
  if (!ruta) return null
  const i = ORDEN_RUTAS.indexOf(id)
  return {
    esRuta: true,
    id,
    numero: i + 1,
    etiqueta: 'Ruta',
    titulo: ruta.nombre,
    descripcion: ruta.descripcion,
    acento: ruta.acento,
    Icono: ICONO_RUTA[id],
    lecciones: [],
    disponible: rutaDisponible(ruta),
    vecino: (dir) => moduloDeRuta(ORDEN_RUTAS[i + dir]),
  }
}

/** Ruta + su estado (paradas cumplidas) con lo que guarda la app; se vuelve a pintar al cambiar el progreso. */
export function useRuta(id) {
  const progreso = useProgreso()
  const { admin } = useOpciones()
  const ruta = RUTAS[id] ?? RUTAS.ritmo
  const practica = PRACTICAS[ruta.practica]
  const datos = practica.tienda.usar()
  const nivelMax = (modo) => practica.tienda.datosModo(modo, datos).nivelMax
  return {
    ruta,
    modulo: moduloDeRuta(ruta.id),
    estado: estadoRuta(ruta, { progreso, nivelMax, admin }),
    nivelMax,
    enlaceMeta: practica.enlace,
    progreso,
  }
}
