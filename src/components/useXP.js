// XP total del jugador = la FIJA (lo que pasa una sola vez, calculado del progreso que ya existe) + la JUGADA (el libro
// de progress/xp.js). La fija no se guarda: al sincronizar dispositivos no se cuenta doble y, desde el primer día, ya
// tienes la XP de lo que hiciste antes de que existiera el sistema.
import { CATALOGO } from '../content/catalogo.js'
import { AREAS as AREAS_CURSO, estadoCurso } from '../content/curso.js'
import { getModulo } from '../content/index.js'
import { ORDEN_RUTAS, RUTAS, estadoRuta, rutaDisponible } from '../content/rutas.js'
import { useCuaderno } from '../progress/letras.js'
import { tiendaOido } from '../progress/oido.js'
import { useProgreso } from '../progress/progreso.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { hoy as diaDeHoy } from '../progress/entrenamiento.js'
import { AREAS_XP, XP, nivelDeXP, usarXP, xpJugada } from '../progress/xp.js'
import { MODOS_OIDO } from '../theory/oido.js'
import { useMedirMetas } from './rutaModulo.js'

/** Área de XP de un acento `var(--color-AREA)` (o 'general'). */
export function areaDeAcento(acento) {
  const a = String(acento ?? '').match(/--color-([a-z]+)/)?.[1]
  return AREAS_XP.includes(a) ? a : 'general'
}

/** Área principal de una lección (catálogo) o de un reto. */
export function areaDe(id) {
  const info = CATALOGO[id]
  if (info?.areas?.[0]) return areaDeAcento(`--color-${info.areas[0]}`)
  const m = String(id).match(/^M(\d+)$/)
  if (m) return areaDeAcento(`--color-${getModulo(Number(m[1]))?.area}`)
  return 'general'
}

const AREA_CURSO = { melodia: 'melodia', acordes: 'armonia', ritmo: 'ritmo', letras: 'letras', tres: 'general' }

/** XP de una lección completada (con su mejor resultado): { completar, aciertos, perfecta, total }. */
export function xpLeccion(l) {
  if (!l?.completada) return null
  if (l.saltada) return { saltada: XP.saltada, total: XP.saltada }
  const mejor = l.mejor ?? l.aciertos ?? 0
  const perfecta = l.total > 0 && mejor >= l.total ? XP.leccion.perfecta : 0
  const aciertos = mejor * XP.leccion.acierto
  return { completar: XP.leccion.completar, aciertos, perfecta, total: XP.leccion.completar + aciertos + perfecta }
}

/** XP de los niveles aprobados de un modo: por nivel, 50 + 30 por cada dificultad por encima de la 1. */
const xpSuperado = (m) =>
  Object.values(m?.superado ?? {}).reduce((s, d) => s + XP.nivelEntrenador + XP.dificultadEntrenador * Math.max(0, (Number(d) || 1) - 1), 0)

/**
 * XP fija: { total, porArea }. Lecciones (completar, aciertos a la primera, perfecta, saltadas), pruebas rápidas,
 * retos, niveles aprobados de oído y ritmo, metas cumplidas, tramos, bloques y etapas, primera letra y primer flow.
 */
function calcularFija({ progreso, oido, ritmo, letras, medir }) {
  const porArea = Object.fromEntries(AREAS_XP.map((a) => [a, 0]))
  const sumar = (a, v) => (porArea[AREAS_XP.includes(a) ? a : 'general'] += v)

  for (const [id, l] of Object.entries(progreso.lecciones ?? {})) {
    const x = xpLeccion(l)
    if (x) sumar(areaDe(id), x.total)
  }
  for (const pr of Object.values(progreso.pruebas ?? {})) sumar('general', XP.prueba * (pr?.mejor ?? pr?.aciertos ?? 0))
  for (const [id, r] of Object.entries(progreso.retos ?? {})) if (r?.hecho) sumar(areaDe(id), XP.reto)

  for (const modo of MODOS_OIDO) sumar(areaDeAcento(modo.acento), xpSuperado(tiendaOido.datosModo(modo.id, oido)))
  for (const m of Object.values(ritmo.modos ?? {})) sumar('ritmo', xpSuperado(tiendaRitmo.migrar('', m)))

  // Metas, tramos, bloques y etapas (sin repetir: una meta o un tramo pueden estar en dos rutas y en el curso).
  const metas = new Set()
  const tramos = new Set()
  const meta = (p, area) => {
    const clave = `${p.modo ?? p.clave}:${p.nivel ?? p.tema ?? ''}:${p.dificultad ?? p.palabras ?? p.letras ?? ''}`
    if (metas.has(clave)) return
    metas.add(clave)
    sumar(area, XP.meta)
  }
  for (const id of ORDEN_RUTAS) {
    const ruta = RUTAS[id]
    if (!rutaDisponible(ruta)) continue
    const area = areaDeAcento(`--color-${ruta.area}`)
    const e = estadoRuta(ruta, { progreso, medirMeta: (p) => medir(p, ruta.practica) })
    for (const p of e.paradas) if (p.tipo === 'meta' && p.cumplida) meta(p, area)
    for (const t of e.tramos) {
      if (t.hechas < t.total || tramos.has(t.id)) continue
      tramos.add(t.id)
      sumar(area, XP.tramo)
    }
  }
  const curso = estadoCurso({ progreso, medir: (p) => medir(p, AREAS_CURSO[p.area].practica) })
  for (const b of curso.bloques) {
    for (const p of b.paradas) if (p.tipo === 'meta' && p.cumplida) meta(p, AREA_CURSO[p.area])
    if (b.estado === 'hecha') sumar('general', XP.bloque)
  }
  for (const e of curso.etapas) if (e.estado === 'hecha') sumar('general', XP.etapa)

  if (letras.some((l) => l.texto.split('\n').filter((v) => v.trim()).length >= 2)) sumar('letras', XP.primeraLetra)
  if (letras.some((l) => Object.keys(l.flows ?? {}).length)) sumar('letras', XP.primerFlow)

  return { total: Object.values(porArea).reduce((s, v) => s + v, 0), porArea }
}

/**
 * Hook: toda la XP del jugador. { total, porArea, hoy, nivel: nivelDeXP(total) }. Se vuelve a pintar al cambiar el
 * progreso, una práctica o el libro.
 */
export function useXP() {
  const progreso = useProgreso()
  const oido = tiendaOido.usar()
  const ritmo = tiendaRitmo.usar()
  const libro = usarXP()
  const { letras } = useCuaderno()
  const medidor = useMedirMetas()
  const fija = calcularFija({ progreso, oido, ritmo, letras, medir: medidor.meta })
  const jugada = xpJugada(libro)
  const porArea = Object.fromEntries(AREAS_XP.map((a) => [a, Math.round(fija.porArea[a] + jugada.porArea[a])]))
  const total = Math.round(fija.total + jugada.total)
  // Hoy: lo jugado y las lecciones terminadas hoy.
  const lecciones = Object.values(progreso.lecciones ?? {}).filter((l) => l?.fecha === diaDeHoy())
  const deHoy = jugada.hoy + lecciones.reduce((s, l) => s + (xpLeccion(l)?.total ?? 0), 0)
  return { total, porArea, hoy: Math.round(deHoy), nivel: nivelDeXP(total) }
}
