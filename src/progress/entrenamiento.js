// Memoria de un entrenamiento (oído, ritmo…) en localStorage: racha diaria, minutos de hoy y niveles por modo.
// Cada entrenamiento crea la suya con `crearEntrenamiento(clave)`: misma forma, datos aparte.
//
// Forma de los datos:
// {
//   version: 1,
//   dias: { '2026-11-10': { segundos: 312, respuestas: 40, aciertos: 31 } },
//   mejorRacha: 5,
//   modos: {
//     intervalos: {
//       v: 2,                                  // forma de los datos (la 1 no tenía `superado`; se migra sola al leer)
//       nivel: 3, nivelMax: 3,                 // nivel elegido y el más alto desbloqueado
//       superado: { 1: 3, 2: 1 },              // DOMINIO: por nivel, la dificultad más alta con la que lo aprobaste
//       ventana: [{ b: true, e: '3M', d: 1 }, …], // últimas 10 respuestas en el nivel actual (bien, elemento, dificultad)
//       aciertos: 80, total: 100, racha: 4, mejorRacha: 12,  // racha = aciertos seguidos
//       items: { '3M': { a: 20, t: 24 } },
//       ajustes: { direccion: 'sube', juego: 'normal' },
//       legado: 3,                             // nivelMax que traían los datos de antes (cumple las metas que ya cumplía)
//     }
//   }
// }
//
// UNA SOLA REGLA PARA APROBAR UN NIVEL (plan de niveles y dificultad, 2026-11): en las últimas 10 respuestas del nivel
// con la MISMA dificultad, al menos 8 bien y cada elemento NUEVO del nivel (`nuevos`: el intervalo, la nota o el acorde
// que se sumó) acertado al menos 2 veces. Al aprobar se apunta `superado[nivel] = dificultad` (si es más alta) y se
// pasa al siguiente nivel. Nunca se baja. Lo que mide las metas de las rutas es `nivelCon(modo, dificultad)`.
import { useSyncExternalStore } from 'react'

/** Minutos diarios recomendados. */
export const META_SEGUNDOS = 5 * 60
/** Para aprobar un nivel: ACIERTOS_PARA_SUBIR de las últimas TAMANO_VENTANA respuestas… */
export const TAMANO_VENTANA = 10
export const ACIERTOS_PARA_SUBIR = 8
/** …y cada elemento nuevo del nivel, acertado al menos ACIERTOS_NUEVO veces en esa ventana. */
export const ACIERTOS_NUEVO = 2
/** Forma de los datos de un modo (ver arriba). */
export const VERSION_MODO = 2
/** Tiempo máximo que cuenta por respuesta (si te distraes, no suma de más). */
const MAX_SEGUNDOS_POR_RESPUESTA = 25
const DIAS_GUARDADOS = 120

// Fecha LOCAL (no UTC): la racha cambia a medianoche del usuario.
function fecha(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

export function hoy() {
  return fecha()
}

function diaAnterior(f) {
  const [y, m, d] = f.split('-').map(Number)
  return fecha(new Date(y, m - 1, d - 1))
}

const DIA_VACIO = { segundos: 0, respuestas: 0, aciertos: 0 }
const MODO_VACIO = { v: VERSION_MODO, nivel: 1, nivelMax: 1, superado: {}, ventana: [], aciertos: 0, total: 0, racha: 0, mejorRacha: 0, items: {}, ajustes: {} }

/**
 * Datos de un modo de la forma 1 (sin `superado`) a la 2: cada nivel por debajo del máximo cuenta como aprobado con
 * dificultad 1 (no se sabe con cuál fue; 1 es lo seguro), `legado` guarda el máximo de antes para que las metas que ya
 * se cumplían sigan cumplidas, y la ventana y la barra de antes se descartan. `propia(m)` = la migración propia del modo
 * (Acordes reordena sus niveles), que se aplica antes.
 */
export function migrarModo(m, propia) {
  if (!m || typeof m !== 'object' || m.v >= VERSION_MODO) return m
  const base = propia ? propia(m) : m
  const nivelMax = Math.max(1, Math.floor(Number(base.nivelMax) || 1))
  const superado = { ...(base.superado ?? {}) }
  for (let n = 1; n < nivelMax; n++) superado[n] = Math.max(superado[n] ?? 0, 1)
  // eslint-disable-next-line no-unused-vars
  const { carga, ...resto } = base
  return { ...resto, v: VERSION_MODO, nivelMax, superado, legado: base.legado ?? nivelMax, ventana: [] }
}

/** Respuestas de la ventana que cuentan con la dificultad `d` (las de otra dificultad no valen para aprobar). */
const ventanaCon = (ventana, d) => (ventana ?? []).filter((x) => x && typeof x === 'object' && x.d === d)

/** ¿Se aprueba el nivel con esta ventana? 8 de 10 bien y cada elemento nuevo acertado 2 veces. */
export function apruebaVentana(ventana, nuevos = []) {
  if (ventana.filter((x) => x.b).length < ACIERTOS_PARA_SUBIR) return false
  return nuevos.every((e) => ventana.filter((x) => x.b && x.e === e).length >= ACIERTOS_NUEVO)
}

/**
 * Cuánto falta para aprobar el nivel actual (0…1) con la dificultad `dificultad`: los aciertos de la ventana (hasta 8)
 * más los de cada elemento nuevo (hasta 2 cada uno). Si ese nivel ya está aprobado con esa dificultad o más, 1.
 */
export function avanceNivel(m, { nuevos = [], dificultad = 1 } = {}) {
  if ((m.superado?.[m.nivel] ?? 0) >= dificultad) return 1
  const v = ventanaCon(m.ventana, dificultad)
  const aciertos = Math.min(ACIERTOS_PARA_SUBIR, v.filter((x) => x.b).length)
  const cubiertos = nuevos.reduce((s, e) => s + Math.min(ACIERTOS_NUEVO, v.filter((x) => x.b && x.e === e).length), 0)
  return (aciertos + cubiertos) / (ACIERTOS_PARA_SUBIR + ACIERTOS_NUEVO * nuevos.length)
}

/**
 * El nivel al que llegaste con dificultad `dificultad` o más: 1 + el nivel más alto aprobado con ella (los niveles se
 * acumulan: aprobar el 5 con dificultad 3 demuestra también lo de los anteriores). Con el último nivel aprobado, uno más.
 */
export function nivelCon(m, dificultad = 1) {
  let mayor = 0
  for (const [n, d] of Object.entries(m.superado ?? {})) if (d >= dificultad) mayor = Math.max(mayor, Number(n))
  return mayor + 1
}

/**
 * Crea la memoria de un entrenamiento guardada en `clave` de localStorage. `conservar`: campos propios (p. ej. el
 * repaso del vocabulario, con `guardarCampos`) que «Borrar estadísticas» no borra.
 */
export function crearEntrenamiento(clave, { conservar = [], migraciones = {} } = {}) {
  const VACIO = { version: 1, dias: {}, mejorRacha: 0, modos: {} }
  let cache = null
  const listeners = new Set()

  function leer() {
    if (cache) return cache
    try {
      const raw = localStorage.getItem(clave)
      const data = raw ? JSON.parse(raw) : null
      cache = data && typeof data === 'object' ? { ...VACIO, ...data } : VACIO
    } catch {
      cache = VACIO
    }
    return cache
  }

  function escribir(next) {
    cache = next
    try {
      localStorage.setItem(clave, JSON.stringify(next))
    } catch {
      // Modo privado o almacenamiento lleno: seguimos en memoria.
    }
    listeners.forEach((fn) => fn())
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== clave) return
      cache = null
      listeners.forEach((fn) => fn())
    })
  }

  function subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  /** Hook: todo el estado del entrenamiento. */
  function usar() {
    return useSyncExternalStore(subscribe, leer, leer)
  }

  /** Datos de hoy: { segundos, respuestas, aciertos }. */
  function datosDeHoy(estado = leer()) {
    return estado.dias[hoy()] ?? DIA_VACIO
  }

  /**
   * Racha: días seguidos con práctica (al menos una respuesta). Si hoy aún no
   * practicaste, la racha de ayer sigue viva hasta medianoche.
   */
  function rachaActual(estado = leer()) {
    let dia = hoy()
    if (!estado.dias[dia]?.respuestas) dia = diaAnterior(dia)
    let n = 0
    while (estado.dias[dia]?.respuestas) {
      n++
      dia = diaAnterior(dia)
    }
    return n
  }

  /** Los últimos `n` días (del más antiguo a hoy) con sus datos. */
  function ultimosDias(n = 7, estado = leer()) {
    const lista = []
    let dia = hoy()
    for (let i = 0; i < n; i++) {
      lista.unshift({ fecha: dia, ...(estado.dias[dia] ?? DIA_VACIO) })
      dia = diaAnterior(dia)
    }
    return lista
  }

  /** Un modo guardado, ya en la forma de hoy (`migraciones[id]`: lo propio de ese modo, ver migrarModo). */
  function migrar(id, m) {
    return migrarModo(m, migraciones[id])
  }

  function datosModo(id, estado = leer()) {
    return { ...MODO_VACIO, ...(migrar(id, estado.modos[id]) ?? {}) }
  }

  function guardarModo(id, cambios) {
    const e = leer()
    escribir({ ...e, modos: { ...e.modos, [id]: { ...datosModo(id, e), ...cambios } } })
  }

  /**
   * Elegir nivel a mano (solo hasta el máximo alcanzado; con `libre`, el modo administrador, cualquiera). Reinicia la
   * ventana.
   */
  function elegirNivel(id, nivel, { libre = false } = {}) {
    const m = datosModo(id)
    guardarModo(id, { nivel: Math.max(1, libre ? nivel : Math.min(nivel, m.nivelMax)), ventana: [] })
  }

  function guardarAjustes(id, ajustes) {
    guardarModo(id, { ajustes: { ...datosModo(id).ajustes, ...ajustes } })
  }

  // Reloj de práctica: cuenta el tiempo entre respuestas (con tope).
  let ultimoEvento = null

  /** Llamar al empezar una sesión de práctica. */
  function empezarSesion() {
    ultimoEvento = Date.now()
  }

  /**
   * Registra una respuesta. Devuelve { subio, nuevoNivel, desbloqueo, aprobado, metaCumplida }:
   *  - `elemento`: lo que se respondió en realidad, si no es el `item` de las estadísticas (Funciones: el grado).
   *  - `nuevos`: los elementos nuevos del nivel (cada uno tiene que salir bien 2 veces para aprobar).
   *  - `dificultad`: con la que se juega (la ventana solo cuenta las de la misma).
   *  - `niveles`: los niveles que se pueden alcanzar (Acordes: menos, si falta la lección de las séptimas).
   *  - `sinNivel` (Rápido, tempo lento del ritmo, vocabulario): cuenta para el día y las estadísticas, no para el nivel.
   *  - subio: al aprobar se pasa al nivel siguiente; desbloqueo: ese nivel no lo tenías.
   *  - aprobado: { nivel, dificultad, mejora } si con esta respuesta se aprobó un nivel (mejora = con más dificultad
   *    que antes).
   *  - metaCumplida: true si con esta respuesta se llega a los 5 minutos de hoy
   */
  function registrarRespuesta(id, { item, elemento, bien, niveles, nuevos = [], dificultad = 1, sinNivel = false }) {
    const e = leer()
    const m = datosModo(id, e)
    const ahora = Date.now()
    const segundos = ultimoEvento ? Math.min((ahora - ultimoEvento) / 1000, MAX_SEGUNDOS_POR_RESPUESTA) : 5
    ultimoEvento = ahora

    // Día
    const f = hoy()
    const dia = e.dias[f] ?? DIA_VACIO
    const nuevoDia = {
      segundos: Math.round((dia.segundos + segundos) * 10) / 10,
      respuestas: dia.respuestas + 1,
      aciertos: dia.aciertos + (bien ? 1 : 0),
    }
    const metaCumplida = dia.segundos < META_SEGUNDOS && nuevoDia.segundos >= META_SEGUNDOS
    const dias = { ...e.dias, [f]: nuevoDia }
    const fechas = Object.keys(dias).sort()
    fechas.slice(0, Math.max(0, fechas.length - DIAS_GUARDADOS)).forEach((k) => delete dias[k])

    // Modo
    const racha = bien ? m.racha + 1 : 0
    const it = m.items[item] ?? { a: 0, t: 0 }
    let nivel = m.nivel
    let subio = false
    let aprobado = null
    let ventana = m.ventana
    let superado = m.superado
    if (!sinNivel) {
      ventana = [...ventanaCon(m.ventana, dificultad), { b: bien, e: elemento ?? item, d: dificultad }].slice(-TAMANO_VENTANA)
      if (apruebaVentana(ventana, nuevos)) {
        const antes = superado[nivel] ?? 0
        superado = { ...superado, [nivel]: Math.max(antes, dificultad) }
        aprobado = { nivel, dificultad, mejora: dificultad > antes }
        if (nivel < niveles) {
          nivel += 1
          subio = true
        }
        ventana = []
      }
    }
    const modo = {
      ...m,
      nivel,
      nivelMax: Math.max(m.nivelMax, nivel),
      superado,
      ventana,
      aciertos: m.aciertos + (bien ? 1 : 0),
      total: m.total + 1,
      racha,
      mejorRacha: Math.max(m.mejorRacha, racha),
      items: { ...m.items, [item]: { a: it.a + (bien ? 1 : 0), t: it.t + 1 } },
    }

    const next = { ...e, dias, modos: { ...e.modos, [id]: modo } }
    next.mejorRacha = Math.max(e.mejorRacha ?? 0, rachaActual(next))
    escribir(next)
    return { subio, nuevoNivel: nivel, desbloqueo: nivel > m.nivelMax, aprobado, metaCumplida }
  }

  /** Reemplaza todo el estado (lo usa la importación, ya combinado). */
  function importar(datos) {
    const next = { ...VACIO, ...datos, version: 1 }
    next.mejorRacha = Math.max(next.mejorRacha ?? 0, rachaActual(next))
    escribir(next)
  }

  /** Guarda campos propios del entrenamiento (fuera de días y modos). */
  function guardarCampos(cambios) {
    escribir({ ...leer(), ...cambios })
  }

  /** Borra todas las estadísticas (salvo los campos de `conservar`). */
  function reiniciar() {
    const e = leer()
    escribir({ ...VACIO, ...Object.fromEntries(conservar.filter((k) => k in e).map((k) => [k, e[k]])) })
  }

  return {
    usar,
    leer,
    datosDeHoy,
    rachaActual,
    ultimosDias,
    datosModo,
    migrar,
    elegirNivel,
    guardarAjustes,
    empezarSesion,
    registrarRespuesta,
    guardarCampos,
    importar,
    reiniciar,
  }
}
