// Una RUTA presentada como si fuera un MÓDULO (pedido del usuario: «que las rutas salgan igual a los módulos, mismas
// animaciones y visualmente iguales»). Así la página de la ruta reutiliza tal cual el camino de islas
// (CaminoLecciones), la cabecera (CabeceraModulo), el deslizar entre páginas (useCambioModulo) y los cuadritos
// (Cuadrito). El «módulo» de una ruta lleva `esRuta`, su ícono en lugar del número y `vecino(dir)` para pasar
// a la ruta de al lado.
import { ORDEN_RUTAS, RUTAS, estadoRuta, rutaDisponible } from '../content/rutas.js'
import { getPalabra, getTema } from '../letras/vocabulario/index.js'
import { useCuaderno } from '../progress/letras.js'
import { useOpciones } from '../progress/opciones.js'
import { tiendaOido } from '../progress/oido.js'
import { useProgreso } from '../progress/progreso.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { tiendaVocab } from '../progress/vocabulario.js'
import { navegar, rutas } from '../router.js'
import { Metronomo, Oreja, Pluma } from '../ui/Iconos.jsx'

/** Ícono de cada ruta (el de su práctica) y de lo que se abre en ella. */
export const ICONO_RUTA = { ritmo: Metronomo, letras: Pluma, acordes: Oreja }
export const ICONOS_ABRE = { flow: Pluma }

/** La memoria del entrenamiento de cada práctica y a dónde lleva cada modo. */
export const PRACTICAS = {
  // `claveDif`: dónde guarda cada entrenamiento su Dificultad (ritmo: el margen; oído: las octavas).
  ritmo: { tienda: tiendaRitmo, enlace: rutas.ritmo, nombre: 'Ritmo', claveDif: 'dificultad' },
  oido: { tienda: tiendaOido, enlace: rutas.oido, nombre: 'Oído', claveDif: 'octavas' },
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
    href: rutas.ruta(id),
    // Cómo se nombra al asomar al deslizar (CambioModulo) y en la insignia del camino.
    nombre: `Ruta de ${ruta.nombre.toLowerCase()}`,
    subtitulo: ruta.descripcion,
    etiqueta: 'Ruta',
    titulo: ruta.nombre,
    descripcion: ruta.descripcion,
    acento: ruta.acento,
    Icono: ICONO_RUTA[id],
    lecciones: [],
    disponible: rutaDisponible(ruta),
    // Las rutas dan la vuelta (pedido del usuario): después de la última viene la primera, y al revés.
    vecino: (dir) => moduloDeRuta(ORDEN_RUTAS[(i + dir + ORDEN_RUTAS.length) % ORDEN_RUTAS.length]),
  }
}

/** Letras del cuaderno que ya tienen texto (al menos dos versos): la meta «Analiza tu primera letra». */
const letrasConTexto = (letras) => letras.filter((l) => l.texto.split('\n').filter((v) => v.trim()).length >= 2).length

/** Palabras de un tema que ya están en el repaso del vocabulario (vistas al menos una vez). */
const palabrasDelTema = (repaso, tema) => Object.keys(repaso ?? {}).filter((p) => getPalabra(p)?.tema === tema).length

/**
 * Medidor de las metas de cualquier práctica (rutas y Curso completo): `meta(p, practica)` →
 * { valor, meta, detalle (texto de «cómo vas»), ir() (el botón «Practicar») }.
 *  - con `modo`: nivel del entrenamiento de la práctica.
 *  - `letra`: letras con texto en el cuaderno.
 *  - `vocab`: palabras vistas de un tema; «Practicar» deja encendido solo ese tema y abre el vocabulario.
 */
export function useMedirMetas() {
  const { letras } = useCuaderno()
  const vocab = tiendaVocab.usar()
  const datos = { ritmo: tiendaRitmo.usar(), oido: tiendaOido.usar(), letras: vocab }
  const nivelMax = (practicaId, modo) => PRACTICAS[practicaId].tienda.datosModo(modo, datos[practicaId]).nivelMax
  const meta = (p, practicaId) => {
    if (p.clave === 'letra') {
      const n = letrasConTexto(letras)
      return { valor: n, meta: 1, detalle: `Letras en tu cuaderno: ${n}`, ir: () => navegar(rutas.letras()) }
    }
    if (p.clave === 'vocab') {
      const n = palabrasDelTema(vocab.repaso, p.tema)
      return {
        valor: n,
        meta: p.palabras,
        detalle: `${getTema(p.tema)?.nombre}: ${Math.min(n, p.palabras)}/${p.palabras} palabras`,
        ir: () => {
          tiendaVocab.guardarCampos({ temas: [p.tema] })
          navegar(rutas.vocabulario())
        },
      }
    }
    const practica = PRACTICAS[practicaId]
    const n = nivelMax(practicaId, p.modo)
    // «Practicar» desde la ruta (pedido del usuario): el entrenador empieza con la dificultad recomendada de esa parada.
    const dificultad = p.dificultad ?? 1
    return {
      valor: n,
      meta: p.nivel,
      detalle: `Tu nivel: ${Math.min(n, 10)} · meta: ${p.nivel} · dificultad ${dificultad}`,
      ir: () => {
        if (practica.claveDif) practica.tienda.guardarAjustes(p.modo, { [practica.claveDif]: dificultad })
        navegar(practica.enlace(p.modo))
      },
    }
  }
  return { meta, nivelMax }
}

/** Ruta + su estado (paradas cumplidas) con lo que guarda la app; se vuelve a pintar al cambiar el progreso. */
export function useRuta(id) {
  const progreso = useProgreso()
  const { admin } = useOpciones()
  const medidor = useMedirMetas()
  const ruta = RUTAS[id] ?? RUTAS.ritmo
  const practica = PRACTICAS[ruta.practica]
  const nivelMax = (modo) => medidor.nivelMax(ruta.practica, modo)
  const meta = (p) => medidor.meta(p, ruta.practica)

  return {
    ruta,
    modulo: moduloDeRuta(ruta.id),
    estado: estadoRuta(ruta, { progreso, medirMeta: meta, admin }),
    nivelMax,
    meta,
    enlaceMeta: practica.enlace,
    progreso,
  }
}
