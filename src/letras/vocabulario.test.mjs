// Pruebas del vocabulario: node src/letras/vocabulario.test.mjs
import assert from 'node:assert/strict'
import { EJERCICIOS, crearPregunta } from './vocabulario/ejercicios.js'
import { TEMAS, VOCABULARIO, partirVerso } from './vocabulario/index.js'
import { NUEVAS_POR_DIA, apuntar, combinarRepaso, resumenRepaso, siguiente, sumarDias } from './vocabulario/repaso.js'

let ok = 0
const prueba = (nombre, fn) => {
  try {
    fn()
    ok++
  } catch (e) {
    console.error('✗', nombre, '\n ', e.message)
    process.exitCode = 1
  }
}

// Semilla fija para que las pruebas sean siempre iguales.
function semilla(n) {
  return () => {
    n = (n * 1103515245 + 12345) % 2147483648
    return n / 2147483648
  }
}

prueba('4 temas × 30 palabras, sin repetir', () => {
  assert.equal(TEMAS.length, 4)
  for (const t of TEMAS) assert.equal(t.palabras.length, 30, t.id)
  assert.equal(new Set(VOCABULARIO.map((w) => w.p)).size, 120)
})

prueba('cada palabra tiene todo y su verso la lleva', () => {
  for (const w of VOCABULARIO) {
    assert.ok(w.d && w.d.length <= 90, `definición de ${w.p}`)
    assert.ok(['s', 'v', 'a'].includes(w.t), `tipo de ${w.p}`)
    if (w.t === 's') assert.ok(['f', 'm'].includes(w.g), `género de ${w.p}`)
    assert.ok(Array.isArray(w.s) && w.s.length >= 2, `sinónimos de ${w.p}`)
    assert.ok(!w.s.includes(w.p), `${w.p} no es sinónimo de sí misma`)
    assert.ok(partirVerso(w), `el verso de ${w.p} la lleva`)
  }
})

prueba('las preguntas tienen 4 opciones distintas y la correcta una sola vez', () => {
  const azar = semilla(7)
  for (const w of VOCABULARIO) {
    for (const tipo of EJERCICIOS) {
      const q = crearPregunta(w, tipo, azar)
      assert.equal(q.opciones.length, 4, `${tipo} ${w.p}`)
      assert.equal(new Set(q.opciones.map((o) => o.id)).size, 4, `${tipo} ${w.p}: repetidas`)
      assert.equal(q.opciones.filter((o) => o.id === q.correcta).length, 1)
      if (tipo === 'sinonimos') {
        // Ningún distractor es sinónimo de la palabra.
        for (const o of q.opciones) if (o.id !== q.correcta) assert.ok(!w.s.includes(o.id), `${w.p}: ${o.id} es sinónimo`)
      }
      if (tipo === 'verso') {
        for (const o of q.opciones) if (o.id !== q.correcta) assert.ok(!w.v.toLowerCase().includes(o.id), `${w.p}: ${o.id} ya está en el verso`)
      }
    }
  }
})

prueba('repaso: bien sube de caja (1, 2, 4, 8, 16 días); mal vuelve a la 1', () => {
  const hoy = '2026-11-13'
  let r = {}
  let x = apuntar(r, 'bruma', true, hoy)
  assert.deepEqual(x.repaso.bruma, [1, '2026-11-14'])
  r = x.repaso
  // Al día siguiente toca y sube a la 2 (2 días).
  x = apuntar(r, 'bruma', true, '2026-11-14')
  assert.deepEqual(x.repaso.bruma, [2, '2026-11-16'])
  // Practicar antes de tiempo y bien: no se mueve.
  const extra = apuntar(x.repaso, 'bruma', true, '2026-11-15')
  assert.equal(extra.movida, false)
  // Fallar: vuelve a la 1.
  x = apuntar(x.repaso, 'bruma', false, '2026-11-16')
  assert.deepEqual(x.repaso.bruma, [1, '2026-11-17'])
  // Tope en la caja 5 (16 días).
  r = { bruma: [5, hoy] }
  assert.deepEqual(apuntar(r, 'bruma', true, hoy).repaso.bruma, [5, sumarDias(hoy, 16)])
})

prueba('repaso: primero lo que toca, luego nuevas (hasta 10 al día), luego práctica extra', () => {
  const hoy = '2026-11-13'
  const r = { bruma: [2, '2026-11-12'], sigilo: [1, '2026-11-13'], farol: [3, '2026-11-20'] }
  assert.equal(siguiente(r, VOCABULARIO, hoy).palabra.p, 'bruma') // la más atrasada
  assert.equal(siguiente(r, VOCABULARIO, hoy, { evitar: ['bruma'] }).palabra.p, 'sigilo')
  const n = siguiente(r, VOCABULARIO, hoy, { evitar: ['bruma', 'sigilo'], temas: ['dinero'] })
  assert.equal(n.motivo, 'nueva')
  assert.equal(n.palabra.tema, 'dinero')
  const e = siguiente(r, VOCABULARIO, hoy, { evitar: ['bruma', 'sigilo'], nuevasHechasHoy: NUEVAS_POR_DIA })
  assert.equal(e.motivo, 'extra')
  const res = resumenRepaso(r, VOCABULARIO, hoy, 3)
  assert.deepEqual(res, { porRepasar: 2, nuevasHoy: 7, vistas: 3, dominadas: 0 })
})

prueba('combinar dos dispositivos: la caja más alta gana', () => {
  const a = { bruma: [2, '2026-11-15'], farol: [1, '2026-11-14'] }
  const b = { bruma: [3, '2026-11-17'], lana: [1, '2026-11-14'] }
  assert.deepEqual(combinarRepaso(a, b), { bruma: [3, '2026-11-17'], farol: [1, '2026-11-14'], lana: [1, '2026-11-14'] })
})

console.log(process.exitCode ? 'Fallaron pruebas' : `✓ ${ok} pruebas del vocabulario`)
