// Una RUTA presentada como si fuera un MÓDULO (pedido del usuario: «que las rutas salgan igual a los módulos, mismas
// animaciones y visualmente iguales»). Así la página de la ruta reutiliza tal cual el camino de islas
// (CaminoLecciones), la cabecera (CabeceraModulo), el deslizar entre páginas (useCambioModulo) y los cuadritos
// (Cuadrito). El «módulo» de una ruta lleva `esRuta`, su ícono en lugar del número y `vecino(dir)` para pasar
// a la ruta de al lado.
import { useMotionValue } from 'motion/react'
import { useRef, useState } from 'react'
import { getModulo } from '../content/index.js'
import { HERRAMIENTAS, ORDEN_RUTAS, RUTAS, estadoRuta, rutaDisponible } from '../content/rutas.js'
import { MODOS_OIDO } from '../theory/oido.js'
import { MODOS_RITMO } from '../theory/ritmo.js'
import { getPalabra, getTema } from '../letras/vocabulario/index.js'
import { useCuaderno } from '../progress/letras.js'
import { useOpciones } from '../progress/opciones.js'
import { tiendaOido } from '../progress/oido.js'
import { useProgreso } from '../progress/progreso.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { tiendaVocab } from '../progress/vocabulario.js'
import { navegar, rutas } from '../router.js'
import { nombreNivel } from './PanelEntrenamiento.jsx'
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

/** Modos de cada práctica (los ejercicios que salen en «Módulos y prácticas»). Letras: el cuaderno y el vocabulario. */
const MODOS = { oido: MODOS_OIDO, ritmo: MODOS_RITMO, letras: [{ id: 'cuaderno' }, { id: 'vocabulario' }] }
const ICONO_PRACTICA = { oido: Oreja, ritmo: Metronomo, letras: Pluma }
const ACENTO_PRACTICA = { oido: 'var(--color-modulo-1)', ritmo: 'var(--color-modulo-2)', letras: 'var(--color-modulo-6)' }

/** Módulo de una parada (lección numerada o lo que abre una lección), o null. */
function moduloDeParada(p) {
  const id = p.tipo === 'leccion' ? p.id : p.tipo === 'abre' ? HERRAMIENTAS[p.herramienta]?.leccion : null
  return id && /^\d+\./.test(id) ? Number(id.split('.')[0]) : null
}

/** Práctica y ejercicio de una meta: ['oido', 'intervalos'], ['letras', 'vocabulario']… */
function ejercicioDeMeta(p, practica) {
  if (p.clave === 'letra') return ['letras', 'cuaderno']
  if (p.clave === 'vocab') return ['letras', 'vocabulario']
  return p.modo ? [practica, p.modo] : null
}

/**
 * Lo que sale en el carrusel «Módulos y prácticas» de una ruta o de un bloque (CarruselModulos): los MÓDULOS que usan
 * sus paradas (en orden) y sus PRÁCTICAS (las de sus metas y, en una ruta, después el resto de ejercicios de su práctica).
 * `practicaDe(p)` = la práctica que mide cada meta; `practicaRuta` = la de la ruta (o null en un bloque).
 */
export function useModulosYPracticas(paradas, practicaDe, practicaRuta = null) {
  const progreso = useProgreso()
  const { letras } = useCuaderno()
  const datos = { oido: tiendaOido.usar(), ritmo: tiendaRitmo.usar(), letras: tiendaVocab.usar() }

  const numeros = [...new Set(paradas.map(moduloDeParada).filter(Boolean))].sort((a, b) => a - b)
  const modulos = numeros.map(getModulo).filter(Boolean).map((m) => {
    const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
    const total = m.lecciones.length
    return { id: `modulo-${m.numero}`, titulo: m.titulo, etiqueta: `Módulo ${m.numero}`, acento: m.acento, numero: m.numero, dato: `${hechas}/${total}`, avance: total ? hechas / total : 0, hecho: total > 0 && hechas === total, href: rutas.modulo(m.numero) }
  })

  const claves = []
  for (const p of paradas) {
    if (p.tipo !== 'meta') continue
    const e = ejercicioDeMeta(p, practicaDe(p))
    if (e && !claves.some(([a, b]) => a === e[0] && b === e[1])) claves.push(e)
  }
  if (practicaRuta) for (const m of MODOS[practicaRuta] ?? []) if (!claves.some(([a, b]) => a === practicaRuta && b === m.id)) claves.push([practicaRuta, m.id])
  // Agrupadas por tipo de práctica (pedido del usuario): ritmo con ritmo, letras con letras… en el orden en que aparecen.
  const tipos = [...new Set(claves.map(([pid]) => pid))]
  claves.sort((a, b) => tipos.indexOf(a[0]) - tipos.indexOf(b[0]))
  const practicas = claves.map(([pid, id]) => {
    const base = { id: `${pid}-${id}`, grupo: pid, Icono: ICONO_PRACTICA[pid], etiqueta: `Práctica · ${PRACTICAS[pid].nombre}` }
    if (id === 'cuaderno') return { ...base, titulo: 'Tus letras', acento: ACENTO_PRACTICA.letras, dato: `${letras.length} ${letras.length === 1 ? 'letra' : 'letras'}`, href: rutas.letras() }
    if (id === 'vocabulario') {
      const n = Object.keys(datos.letras.repaso ?? {}).length
      return { ...base, titulo: 'Vocabulario', acento: ACENTO_PRACTICA.letras, dato: `${n} ${n === 1 ? 'palabra' : 'palabras'}`, href: rutas.vocabulario() }
    }
    const modo = (MODOS[pid] ?? []).find((m) => m.id === id)
    if (!modo) return null
    const d = PRACTICAS[pid].tienda.datosModo(id, datos[pid])
    return { ...base, titulo: modo.titulo, acento: modo.acento ?? ACENTO_PRACTICA[pid], dato: nombreNivel(modo, d.nivel), href: PRACTICAS[pid].enlace(id) }
  }).filter(Boolean)

  return [
    { id: 'modulos', titulo: 'Módulos', items: modulos },
    { id: 'practicas', titulo: 'Prácticas', items: practicas },
  ]
}

/**
 * Estado del carrusel «Módulos y prácticas» de una página de ruta o de bloque (lo que va en `ruta.carrusel` de
 * CaminoLecciones): `abierto` (las islas se cambian por el carrusel), tocar el botón lo abre o lo cierra, y el gesto de
 * subir el botón (`subir`, `listo`) abre la tarjeta del centro (`api.current.elegir()`).
 */
export function useCarruselModulos(filas) {
  const [abierto, setAbierto] = useState(false)
  const [sel, setSel] = useState({ fila: 0, indice: 0 }) // lo que se ve en el carrusel (para la barra de puntitos)
  const subir = useMotionValue(0)
  const listo = useMotionValue(0)
  const api = useRef(null)
  return {
    abierto,
    filas,
    subir,
    listo,
    api,
    onTocar: () => setAbierto((a) => !a),
    onAbrir: () => setAbierto(true),
    onCerrar: () => setAbierto(false),
    onElegir: () => api.current?.elegir(),
    sel,
    onSel: setSel,
    irA: (i) => api.current?.irA(i),
    cambiarFila: (dir) => api.current?.cambiarFila(dir),
  }
}
