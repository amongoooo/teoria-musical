// EXPERIENCIA (XP) del jugador (plan aprobado en el chat, 2026-11-17: «títulos por niveles, +XP en cada acierto con el
// desglose y con cansancio»). La XP mide cuánto y qué tan bien practicas; sube tu NIVEL DE JUGADOR (aparte del nivel de
// cada entrenador) y no desbloquea contenido.
//
// Dos fuentes:
//  1. FIJA (components/useXP.js): lo que pasa una sola vez se CALCULA del progreso que ya existe (lecciones, retos,
//     niveles aprobados en los entrenadores, metas, tramos, bloques…). No se guarda: al sincronizar no se cuenta doble.
//  2. JUGADA (este archivo): lo que se gana jugando (aciertos de los entrenadores, constancia del día, repetir una
//     lección…) va a un LIBRO por dispositivo: { [dispositivo]: { [día]: { [área]: xp } } }. Al combinar dispositivos
//     viaja un total por área de cada dispositivo (el máximo al unir); lo de este dispositivo no se toca: nada se
//     duplica.
//
// localStorage `teoria-musical:xp:v1`:
//   { dispositivo: 'd-…', libro: { … }, cansancio: { dia, s: { 'oido:intervalos': segundos } },
//     bonos: { dia, lista: ['meta:oido', 'tres'] }, visto: 4 }   // visto = último nivel de jugador celebrado
import { useSyncExternalStore } from 'react'
import { hoy } from './entrenamiento.js'

/** Áreas en las que se anota la XP (las 5 de content/areas.js + «general»: constancia, bloques, etapas…). */
export const AREAS_XP = ['melodia', 'armonia', 'ritmo', 'letras', 'produccion', 'general']

/** Todos los números del sistema (un solo lugar para ajustarlos). */
export const XP = {
  // Por acierto (o ronda buena) en los entrenadores: ≈ 20 XP por minuto bien jugado en lo básico.
  base: { oido: 4, seguir: 6, eco: 7, vocab: 3 },
  clavado: 3, // ritmo: la ronda salió «¡Clavado!»
  dificultad: [1, 1.2, 1.4, 1.7, 2],
  rapido: 1.5, // modo Rápido de Oído absoluto (+1 por cada nota de más en juego)
  contrarreloj: 1.3, // + hasta 50 % si respondes en el primer tercio del tiempo
  tiempoMax: 0.5,
  vidas: 1.2,
  escalada: 1.5,
  combo: { cada: 5, paso: 0.1, max: 1.5 },
  tempo: { lento: 0.5, normal: 1, rapido: 1.3 },
  cansancio: { minutos: 20, factor: 0.5 },
  dominado: 0.5, // jugar un nivel con menos dificultad de la que ya aprobaste
  // Lecciones y camino (los de una vez se calculan en useXP.js).
  leccion: { completar: 50, acierto: 5, perfecta: 25, repaso: 3, repetir: 0.25 },
  prueba: 5,
  saltada: 15,
  reto: 40,
  meta: 40,
  tramo: 100,
  bloque: 200,
  etapa: 500,
  primeraLetra: 20,
  primerFlow: 20,
  genero: 60, // dominar un género del árbol (sus tres pruebas)
  nivelEntrenador: 50,
  dificultadEntrenador: 30,
  vocab: { nueva: 5, caja: 2 },
  dia: { meta: 30, racha: 5, rachaMax: 50, tres: 50 },
}

/**
 * Títulos del jugador (pedido del usuario: «una leyenda no llega en el nivel 30»): cada uno más lejos que el anterior
 * (4, 5, 8, 10, 14, 18 y 25 niveles de distancia) y cada nivel cuesta más. Con unos 200 XP al día: Músico de cuarto en
 * una semana, Beatmaker en un mes, Productor en unos 3 meses, Compositor en 7, Maestro en más de un año, Virtuoso en
 * unos 2 años y medio y Leyenda en unos 5.
 */
export const TITULOS = [
  { desde: 1, nombre: 'Aprendiz' },
  { desde: 5, nombre: 'Músico de cuarto' },
  { desde: 10, nombre: 'Beatmaker' },
  { desde: 18, nombre: 'Productor' },
  { desde: 28, nombre: 'Compositor' },
  { desde: 42, nombre: 'Maestro' },
  { desde: 60, nombre: 'Virtuoso' },
  { desde: 85, nombre: 'Leyenda' },
]

export const tituloDe = (nivel) => [...TITULOS].reverse().find((t) => nivel >= t.desde) ?? TITULOS[0]

/** XP para pasar del nivel n al n + 1: 200 + 100 × (n − 1). */
export const costoNivel = (n) => 200 + 100 * (n - 1)

/** Nivel de jugador con `total` XP: { nivel, enNivel, paraSiguiente, avance (0…1), titulo, siguienteTitulo }. */
export function nivelDeXP(total) {
  let resto = Math.max(0, Math.floor(total))
  let nivel = 1
  while (resto >= costoNivel(nivel)) {
    resto -= costoNivel(nivel)
    nivel += 1
  }
  const paraSiguiente = costoNivel(nivel)
  return {
    nivel,
    enNivel: resto,
    paraSiguiente,
    avance: resto / paraSiguiente,
    titulo: tituloDe(nivel).nombre,
    siguienteTitulo: TITULOS.find((t) => t.desde > nivel) ?? null,
  }
}

/**
 * XP de una respuesta: `base` (los puntos del acierto), `extras` ([{ nombre, xp }] que se suman antes de multiplicar:
 * notas en juego, clavado) y `factores` ([{ nombre, f }], se multiplican en orden). Devuelve { xp, partes } con lo que
 * aporta cada cosa (partes negativas = lo que resta: cansancio, tempo lento…). Sin redondear (se redondea al mostrar).
 */
export function calcularXP({ base, extras = [], factores = [] }) {
  const partes = { Aciertos: base }
  let v = base
  for (const e of extras) {
    if (!e.xp) continue
    partes[e.nombre] = (partes[e.nombre] ?? 0) + e.xp
    v += e.xp
  }
  for (const { nombre, f } of factores) {
    if (f === 1 || f == null) continue
    const extra = v * (f - 1)
    partes[nombre] = (partes[nombre] ?? 0) + extra
    v += extra
  }
  return { xp: v, partes }
}

/** Factor del combo: +10 % cada 5 aciertos seguidos, hasta ×1,5. */
export const factorCombo = (seguidos) => Math.min(XP.combo.max, 1 + XP.combo.paso * Math.floor(seguidos / XP.combo.cada))

/** Contrarreloj: ×1,5 si respondes al instante, bajando a ×1 al pasar el primer tercio del tiempo. */
export const factorTiempo = (fraccion) => 1 + XP.tiempoMax * Math.max(0, Math.min(1, (1 / 3 - fraccion) * 3))

/**
 * Reparte el redondeo para que las partes enteras sumen el total entero (resto mayor primero). `partes`: { nombre: xp }.
 */
export function redondearPartes(partes, total = Object.values(partes).reduce((a, b) => a + b, 0)) {
  const meta = Math.round(total)
  const lista = Object.entries(partes).map(([nombre, v]) => ({ nombre, v, r: Math.floor(v) }))
  let falta = meta - lista.reduce((a, x) => a + x.r, 0)
  const orden = [...lista].sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)))
  for (const x of orden) {
    if (falta <= 0) break
    x.r += 1
    falta -= 1
  }
  return lista.filter((x) => x.r !== 0).map(({ nombre, r }) => ({ nombre, xp: r }))
}

// ---------------------------------------------------------------------------
// El libro de este dispositivo
// ---------------------------------------------------------------------------

const CLAVE = 'teoria-musical:xp:v1'
const DIAS_GUARDADOS = 120
const ANTES = 'antes' // días viejos sumados en uno solo
const VACIO = { libro: {}, cansancio: null, bonos: null, visto: null }

let cache = null
const oyentes = new Set()

function nuevoDispositivo() {
  const azar = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `d-${azar}`
}

export function leerXP() {
  if (cache) return cache
  let data = null
  try {
    data = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
  } catch {
    data = null
  }
  cache = { ...VACIO, ...(data && typeof data === 'object' ? data : {}) }
  if (!cache.dispositivo) {
    cache = { ...cache, dispositivo: nuevoDispositivo() }
    guardar(cache, false)
  }
  return cache
}

function guardar(next, avisar = true) {
  cache = next
  try {
    localStorage.setItem(CLAVE, JSON.stringify(next))
  } catch {
    // Modo privado o almacenamiento lleno: seguimos en memoria.
  }
  if (avisar) oyentes.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE) return
    cache = null
    oyentes.forEach((fn) => fn())
  })
}

const suscribir = (fn) => {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

/** Hook: el estado del libro (se vuelve a pintar al ganar XP). */
export function usarXP() {
  return useSyncExternalStore(suscribir, leerXP, leerXP)
}

const redondo = (x) => Math.round(x * 10) / 10

/** Los días de más de DIAS_GUARDADOS se suman en «antes» (el libro no crece sin fin). */
function recortar(dias) {
  const fechas = Object.keys(dias).filter((f) => f !== ANTES).sort()
  const viejas = fechas.slice(0, Math.max(0, fechas.length - DIAS_GUARDADOS))
  if (!viejas.length) return dias
  const r = { ...dias, [ANTES]: { ...(dias[ANTES] ?? {}) } }
  for (const f of viejas) {
    for (const [a, v] of Object.entries(dias[f])) r[ANTES][a] = redondo((r[ANTES][a] ?? 0) + v)
    delete r[f]
  }
  return r
}

/** Anota `xp` en el área `area` (hoy, en este dispositivo). */
export function sumarXP(area, xp) {
  if (!xp || !(xp > 0)) return
  const e = leerXP()
  const a = AREAS_XP.includes(area) ? area : 'general'
  const mio = e.libro[e.dispositivo] ?? {}
  const dia = mio[hoy()] ?? {}
  const dias = recortar({ ...mio, [hoy()]: { ...dia, [a]: redondo((dia[a] ?? 0) + xp) } })
  guardar({ ...e, libro: { ...e.libro, [e.dispositivo]: dias } })
}

/** XP jugada (todos los dispositivos): { total, porArea, hoy }. */
export function xpJugada(estado = leerXP()) {
  const porArea = Object.fromEntries(AREAS_XP.map((a) => [a, 0]))
  let deHoy = 0
  for (const dias of Object.values(estado.libro ?? {})) {
    for (const [f, areas] of Object.entries(dias ?? {})) {
      for (const [a, v] of Object.entries(areas ?? {})) {
        const k = a in porArea ? a : 'general'
        porArea[k] += Number(v) || 0
        if (f === hoy()) deHoy += Number(v) || 0
      }
    }
  }
  return { total: Object.values(porArea).reduce((s, v) => s + v, 0), porArea, hoy: deHoy }
}

/** Segundos que llevas hoy en un modo (para el cansancio). */
export function segundosHoy(clave, estado = leerXP()) {
  return estado.cansancio?.dia === hoy() ? (estado.cansancio.s?.[clave] ?? 0) : 0
}

/** Suma segundos de práctica de hoy a un modo. Devuelve los que llevaba antes. */
export function sumarSegundos(clave, segundos) {
  const e = leerXP()
  const antes = segundosHoy(clave, e)
  const s = e.cansancio?.dia === hoy() ? e.cansancio.s : {}
  guardar({ ...e, cansancio: { dia: hoy(), s: { ...s, [clave]: Math.round(antes + segundos) } } }, false)
  return antes
}

/** ¿Está cansado este modo hoy? (más de 20 minutos). */
export const cansado = (segundos) => segundos >= XP.cansancio.minutos * 60

/** Un bono que se da una vez al día: true la primera vez (y lo apunta). */
export function bonoNuevo(id) {
  const e = leerXP()
  const lista = e.bonos?.dia === hoy() ? e.bonos.lista : []
  if (lista.includes(id)) return false
  guardar({ ...e, bonos: { dia: hoy(), lista: [...lista, id] } }, false)
  return true
}

/** Último nivel de jugador celebrado (null = aún no se ha mirado: no celebra lo que ya traías). */
export const nivelVisto = () => leerXP().visto ?? null
export function marcarNivelVisto(nivel) {
  const e = leerXP()
  if (e.visto !== nivel) guardar({ ...e, visto: nivel }, false)
}

/**
 * Para «Tu progreso» el libro viaja COMPACTO (el QR tiene que ser corto): por dispositivo, un total por área
 * { [dispositivo]: { [área]: xp } }. Los otros dispositivos se guardan así, en un solo «día» `total`.
 */
export function libroCompacto(estado = leerXP()) {
  const r = {}
  for (const [disp, dias] of Object.entries(estado.libro ?? {})) {
    const suma = {}
    for (const areas of Object.values(dias ?? {})) for (const [a, v] of Object.entries(areas ?? {})) suma[a] = redondo((suma[a] ?? 0) + (Number(v) || 0))
    if (Object.keys(suma).length) r[disp] = suma
  }
  return r
}

/** Revisa un libro compacto que llega de fuera (solo números positivos, ids y áreas cortos). */
export function revisarCompacto(x) {
  const r = {}
  if (!x || typeof x !== 'object') return r
  for (const [disp, areas] of Object.entries(x)) {
    if (typeof disp !== 'string' || disp.length > 24 || !areas || typeof areas !== 'object') continue
    const limpio = {}
    for (const [a, v] of Object.entries(areas)) {
      const n = Number(v)
      if (AREAS_XP.includes(a) && Number.isFinite(n) && n > 0) limpio[a] = redondo(n)
    }
    if (Object.keys(limpio).length) r[disp] = limpio
  }
  return r
}

/** Une dos libros compactos (por dispositivo y área, el máximo). */
export function combinarCompactos(a = {}, b = {}) {
  const r = structuredClone(a ?? {})
  for (const [disp, areas] of Object.entries(b ?? {})) {
    r[disp] ??= {}
    for (const [k, v] of Object.entries(areas)) r[disp][k] = Math.max(r[disp][k] ?? 0, v)
  }
  return r
}

/**
 * Guarda lo que llega de otro dispositivo: cada dispositivo que no es este queda como su total por área (el máximo
 * entre lo que había y lo que llega). Lo de este dispositivo no se toca (aquí está más al día). Importar dos veces el
 * mismo código no cambia nada.
 */
export function importarCompacto(x) {
  const e = leerXP()
  const llega = revisarCompacto(x)
  const propios = libroCompacto(e)
  const libro = { ...e.libro }
  for (const [disp, areas] of Object.entries(llega)) {
    if (disp === e.dispositivo) continue
    const total = { ...(propios[disp] ?? {}) }
    for (const [a, v] of Object.entries(areas)) total[a] = Math.max(total[a] ?? 0, v)
    libro[disp] = { total }
  }
  guardar({ ...e, libro })
}
