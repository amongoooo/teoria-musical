// Pasar el progreso entre dispositivos SIN servidor: todo cabe en un código de texto.
//
// Código = versión + base64url( deflate-raw( JSON ) ):
//   «1…» comprimido (CompressionStream; Chrome, Safari 16.4+, Firefox)
//   «0…» sin comprimir (respaldo para navegadores viejos)
// El JSON lleva { v: 1, p: progreso (lecciones y retos), o: oído, c: opciones }.
//
// Al importar se COMBINA, nunca se reemplaza: por lección se queda lo más avanzado,
// los retos y los días de práctica se unen. Importar dos veces el mismo código no cambia nada.
import { getProgreso, importarProgreso } from './progreso.js'
import { getOido, importarOido } from './oido.js'
import { TEMAS, getOpciones, setTema } from './opciones.js'

const VERSION = 1

// ---------------------------------------------------------------------------
// Codificar / decodificar
// ---------------------------------------------------------------------------

function aBase64url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64url(texto) {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

const hayCompresion = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'

async function transformar(bytes, stream) {
  const respuesta = new Response(new Blob([bytes]).stream().pipeThrough(stream))
  return new Uint8Array(await respuesta.arrayBuffer())
}

/** Lo de este dispositivo, en la forma que usa `combinar`. */
export function datosActuales() {
  const p = getProgreso()
  const o = getOido()
  return {
    v: VERSION,
    p: { lecciones: p.lecciones ?? {}, retos: p.retos ?? {} },
    o: { dias: o.dias ?? {}, mejorRacha: o.mejorRacha ?? 0, modos: o.modos ?? {} },
    c: { tema: getOpciones().tema },
  }
}

// Días de práctica en forma compacta (son lo que más ocupa): [[fecha, s, r, a], [díasDespués, s, r, a], …]
// La primera fila lleva la fecha; las demás, cuántos días después de la anterior. Así el código y el QR son más cortos.
const dia0 = (f) => Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10)) / 864e5

function diasCompactos(dias) {
  let previo = null
  return Object.keys(dias)
    .filter(esFecha)
    .sort()
    .map((f) => {
      const { segundos = 0, respuestas = 0, aciertos = 0 } = dias[f]
      const fila = [previo === null ? f : dia0(f) - previo, Math.round(segundos), respuestas, aciertos]
      previo = dia0(f)
      return fila
    })
}

function diasDeCompactos(filas) {
  const dias = {}
  if (!Array.isArray(filas)) return dias
  let previo = null
  for (const fila of filas) {
    if (!Array.isArray(fila)) continue
    const [f, segundos, respuestas, aciertos] = fila
    const n = typeof f === 'string' && esFecha(f) ? dia0(f) : previo !== null && Number.isInteger(f) && f > 0 ? previo + f : null
    if (n === null) continue
    previo = n
    dias[new Date(n * 864e5).toISOString().slice(0, 10)] = { segundos, respuestas, aciertos }
  }
  return dias
}

/** Crea el código de texto con todo el progreso. */
export async function crearCodigo(datos = datosActuales()) {
  const { dias, ...oido } = datos.o
  const paquete = { ...datos, o: { ...oido, d: diasCompactos(dias) } }
  const bytes = new TextEncoder().encode(JSON.stringify(paquete))
  if (hayCompresion()) {
    try {
      return '1' + aBase64url(await transformar(bytes, new CompressionStream('deflate-raw')))
    } catch {
      // Sigue sin comprimir.
    }
  }
  return '0' + aBase64url(bytes)
}

/** Link que abre la app y pregunta si cargar el progreso. */
export function linkDeCodigo(codigo) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/importar/${codigo}`
}

/** Acepta el código suelto o un link entero (#/importar/…). Devuelve el código limpio o ''. */
export function limpiarCodigo(texto) {
  const t = String(texto ?? '').trim()
  const enLink = t.match(/#\/importar\/([^\s/?#]+)/)
  return (enLink ? enLink[1] : t).replace(/\s+/g, '')
}

/** Lee un código. Devuelve los datos ya revisados o lanza un error si no es válido. */
export async function leerCodigo(codigo) {
  const limpio = limpiarCodigo(codigo)
  if (!/^[01][A-Za-z0-9_-]+$/.test(limpio)) throw new Error('formato')
  let bytes = deBase64url(limpio.slice(1))
  if (limpio[0] === '1') {
    if (!hayCompresion()) throw new Error('navegador')
    bytes = await transformar(bytes, new DecompressionStream('deflate-raw'))
  }
  const datos = JSON.parse(new TextDecoder().decode(bytes))
  if (!esObjeto(datos) || datos.v !== VERSION) throw new Error('version')
  return revisar(datos)
}

// ---------------------------------------------------------------------------
// Revisar lo que llega (el código viene de fuera: solo se acepta lo que tiene la forma esperada)
// ---------------------------------------------------------------------------

const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)
const num = (x, def = 0) => (Number.isFinite(x) && x >= 0 ? x : def)
const esFecha = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const esId = (k) => /^[A-Za-z0-9.]{1,12}$/.test(k)

function entradas(obj, fn) {
  const fuera = {}
  if (!esObjeto(obj)) return fuera
  for (const [k, v] of Object.entries(obj)) {
    if (!esId(k) || !esObjeto(v)) continue
    fuera[k] = fn(v)
  }
  return fuera
}

function revisar(d) {
  const p = esObjeto(d.p) ? d.p : {}
  const o = esObjeto(d.o) ? d.o : {}
  const lecciones = entradas(p.lecciones, (l) => {
    const r = { paso: Math.floor(num(l.paso)) }
    if (l.completada === true) {
      r.completada = true
      r.aciertos = num(l.aciertos)
      r.total = num(l.total)
      if (esFecha(l.fecha)) r.fecha = l.fecha
    }
    return r
  })
  const retos = entradas(p.retos, (r) => {
    const x = {}
    if (r.hecho === true) x.hecho = true
    if (esFecha(r.fecha)) x.fecha = r.fecha
    if (typeof r.nota === 'string' && r.nota.trim()) x.nota = r.nota.slice(0, 4000)
    return x
  })
  const dias = {}
  const llegan = Array.isArray(o.d) ? diasDeCompactos(o.d) : o.dias
  if (esObjeto(llegan)) {
    for (const [f, v] of Object.entries(llegan)) {
      if (!esFecha(f) || !esObjeto(v)) continue
      dias[f] = { segundos: num(v.segundos), respuestas: num(v.respuestas), aciertos: num(v.aciertos) }
    }
  }
  const modos = entradas(o.modos, (m) => ({
    nivel: Math.max(1, Math.floor(num(m.nivel, 1))),
    nivelMax: Math.max(1, Math.floor(num(m.nivelMax, 1))),
    ventana: Array.isArray(m.ventana) ? m.ventana.filter((x) => typeof x === 'boolean').slice(-10) : [],
    aciertos: num(m.aciertos),
    total: num(m.total),
    racha: num(m.racha),
    mejorRacha: num(m.mejorRacha),
    items: entradas(m.items, (it) => ({ a: num(it.a), t: num(it.t) })),
    ajustes: esObjeto(m.ajustes)
      ? Object.fromEntries(Object.entries(m.ajustes).filter(([k, v]) => esId(k) && ['string', 'number', 'boolean'].includes(typeof v)))
      : {},
  }))
  const tema = TEMAS.includes(d.c?.tema) ? d.c.tema : null
  return {
    v: VERSION,
    p: { lecciones, retos },
    o: { dias, mejorRacha: num(o.mejorRacha), modos },
    c: { tema },
  }
}

// ---------------------------------------------------------------------------
// Combinar (a = lo de este dispositivo, b = lo que llega)
// ---------------------------------------------------------------------------

const mayorFecha = (x, y) => (!x ? y : !y ? x : x > y ? x : y)
const menorFecha = (x, y) => (!x ? y : !y ? x : x < y ? x : y)
const nota = (l) => (l.total ? l.aciertos / l.total : 0)

/** Por lección, lo más avanzado: completada gana; el paso a medias, el mayor; el mejor resultado. */
export function combinarLeccion(a, b) {
  if (!a) return b
  if (!b) return a
  const r = { ...a, paso: Math.max(a.paso ?? 0, b.paso ?? 0) }
  if (a.completada || b.completada) {
    const mejor = !a.completada ? b : !b.completada ? a : nota(b) > nota(a) ? b : a
    r.completada = true
    r.aciertos = mejor.aciertos ?? 0
    r.total = mejor.total ?? 0
    const fecha = mayorFecha(a.completada && a.fecha, b.completada && b.fecha)
    if (fecha) r.fecha = fecha
  }
  return r
}

export function combinarReto(a, b) {
  if (!a) return b
  if (!b) return a
  const r = { ...a }
  if (a.hecho || b.hecho) {
    r.hecho = true
    const fecha = menorFecha(a.hecho && a.fecha, b.hecho && b.fecha)
    if (fecha) r.fecha = fecha
  }
  const na = a.nota?.trim() ?? ''
  const nb = b.nota?.trim() ?? ''
  if (nb && !na.includes(nb)) r.nota = na ? `${na}\n\n${nb}` : nb
  return r
}

function combinarModo(a, b) {
  if (!a) return b
  if (!b) return a
  // La base es el dispositivo más avanzado (nivel más alto; si empatan, el que más practicó).
  const base = (b.nivelMax ?? 1) > (a.nivelMax ?? 1) || ((b.nivelMax ?? 1) === (a.nivelMax ?? 1) && (b.total ?? 0) > (a.total ?? 0)) ? b : a
  const items = { ...(a.items ?? {}) }
  for (const [k, it] of Object.entries(b.items ?? {})) {
    if (!items[k] || it.t > items[k].t) items[k] = it
  }
  return {
    ...base,
    nivelMax: Math.max(a.nivelMax ?? 1, b.nivelMax ?? 1),
    aciertos: Math.max(a.aciertos ?? 0, b.aciertos ?? 0),
    total: Math.max(a.total ?? 0, b.total ?? 0),
    mejorRacha: Math.max(a.mejorRacha ?? 0, b.mejorRacha ?? 0),
    items,
    ajustes: { ...(b.ajustes ?? {}), ...(a.ajustes ?? {}) },
  }
}

function combinarClaves(a = {}, b = {}, fn) {
  const r = { ...a }
  for (const [k, v] of Object.entries(b)) r[k] = fn(a[k], v)
  return r
}

/** Combina dos paquetes completos { p, o }. */
export function combinar(a, b) {
  return {
    p: {
      lecciones: combinarClaves(a.p.lecciones, b.p.lecciones, combinarLeccion),
      retos: combinarClaves(a.p.retos, b.p.retos, combinarReto),
    },
    o: {
      // Mismo día en los dos: el máximo de cada dato (no se suma, así importar dos veces no duplica).
      dias: combinarClaves(a.o.dias, b.o.dias, (x, y) =>
        x ? { segundos: Math.max(x.segundos, y.segundos), respuestas: Math.max(x.respuestas, y.respuestas), aciertos: Math.max(x.aciertos, y.aciertos) } : y,
      ),
      mejorRacha: Math.max(a.o.mejorRacha ?? 0, b.o.mejorRacha ?? 0),
      modos: combinarClaves(a.o.modos, b.o.modos, combinarModo),
    },
  }
}

/** Resumen para enseñar antes de cargar. */
export function resumen(d) {
  const lecciones = Object.values(d.p.lecciones)
  return {
    completadas: lecciones.filter((l) => l.completada).length,
    aMedias: lecciones.filter((l) => !l.completada && l.paso > 0).length,
    retos: Object.values(d.p.retos).filter((r) => r.hecho).length,
    dias: Object.values(d.o.dias).filter((x) => x.respuestas > 0).length,
    tema: d.c?.tema ?? null,
  }
}

/** Combina lo que llega con lo de este dispositivo y lo guarda. */
export function importar(datos, { conTema = false } = {}) {
  const junto = combinar(datosActuales(), datos)
  importarProgreso({ ...getProgreso(), ...junto.p })
  importarOido({ ...getOido(), ...junto.o })
  if (conTema && datos.c?.tema) setTema(datos.c.tema)
  return junto
}
