// Buscar rimas en la lista de las ~45 000 palabras más usadas (src/letras/diccionario.js, generada con
// scripts/diccionario.mjs). Se carga con import() solo al entrar a Letras; el service worker la guarda en el
// teléfono como el resto de la app (sin internet sigue funcionando) y se pide almacenamiento persistente.
import { useEffect, useState } from 'react'
import { rima } from './rima.js'

let promesa = null
let indice = null

function construir(texto) {
  const porConsonante = new Map()
  const porAsonante = new Map()
  for (const linea of texto.split('\n')) {
    const [c, a, lista] = linea.split('|')
    const palabras = lista.split(' ')
    porConsonante.set(c, palabras)
    if (!porAsonante.has(a)) porAsonante.set(a, [])
    porAsonante.get(a).push(palabras)
  }
  // Las familias grandes (terminaciones comunes) primero.
  for (const grupos of porAsonante.values()) grupos.sort((x, y) => y.length - x.length)
  return { porConsonante, porAsonante }
}

export function cargarDiccionario() {
  if (!promesa) {
    promesa = import('./diccionario.js').then((m) => {
      indice = construir(m.default)
      // Que el navegador no borre lo guardado de la app aunque el teléfono ande corto de espacio.
      navigator.storage?.persist?.().catch(() => {})
      return indice
    })
    promesa.catch(() => {
      promesa = null
    })
  }
  return promesa
}

/** Hook: el índice (o null mientras carga). Empieza a cargarlo al montarse. */
export function useDiccionario() {
  const [d, setD] = useState(indice)
  useEffect(() => {
    if (indice) return
    let vivo = true
    cargarDiccionario()
      .then((x) => vivo && setD(x))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])
  return d
}

/**
 * Rimas de una palabra en el diccionario: { consonantes, asonantes } (hasta `max` cada una, las más usadas primero).
 * Las asonantes se toman por turnos de cada familia (así salen variadas: -ota, -osa, -oma…).
 */
export function buscarRimas(d, palabra, max = 30) {
  if (!d) return { consonantes: [], asonantes: [] }
  const r = rima(palabra)
  const p = palabra.toLowerCase()
  const consonantes = (d.porConsonante.get(r.consonante) ?? []).filter((w) => w !== p).slice(0, max)
  const grupos = (d.porAsonante.get(r.asonante) ?? []).filter((g) => g !== d.porConsonante.get(r.consonante))
  const asonantes = []
  for (let i = 0; asonantes.length < max && grupos.some((g) => i < g.length); i++) {
    for (const g of grupos) {
      if (i < g.length && g[i] !== p) asonantes.push(g[i])
      if (asonantes.length >= max) break
    }
  }
  return { consonantes, asonantes }
}
