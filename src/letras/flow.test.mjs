// Pruebas del flow: node src/letras/flow.test.mjs
import assert from 'node:assert/strict'
import { analizar } from './analisis.js'
import { acentosATiempo, casillaDeToque, compasesPara, puedeMover, repartir, repartirConAcentos, silabasFlow } from './flow.js'

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
const verso = (t) => analizar(t).estrofas[0].versos[0]

prueba('sílabas con sinalefa y acentos', () => {
  const s = silabasFlow(verso('la luna me sigue'))
  assert.deepEqual(s.map((x) => x.texto), ['la', 'lu', 'na', 'me', 'si', 'gue'])
  assert.deepEqual(s.filter((x) => x.tonica).map((x) => x.texto), ['lu', 'si'])
  const v = verso('traigo en el pecho un fuego')
  assert.equal(silabasFlow(v).length, v.silabas) // mismas que el análisis
  assert.ok(silabasFlow(v).some((x) => x.texto.includes('‿')))
  assert.equal(silabasFlow(v, { porPalabra: true }).length, 9)
})

prueba('compases y repartir', () => {
  assert.equal(compasesPara(12), 1)
  assert.equal(compasesPara(17), 2)
  assert.equal(compasesPara(40), 2)
  assert.deepEqual(repartir(4, 16), [0, 4, 8, 12])
  const r = repartir(11, 16)
  assert.equal(new Set(r).size, 11)
  assert.ok(r.every((c, i) => i === 0 || c > r[i - 1]))
})

prueba('toque a la semicorchea más cercana y siempre en orden', () => {
  const sc = 0.15
  assert.equal(casillaDeToque(0.02, sc, null, 16), 0)
  assert.equal(casillaDeToque(0.44, sc, null, 16), 3)
  assert.equal(casillaDeToque(0.44, sc, 3, 16), 4) // ya ocupada: la siguiente
  assert.equal(casillaDeToque(2.2, sc, 14, 16), 15)
  assert.equal(casillaDeToque(2.2, sc, 15, 16), null)
})

prueba('mover entre vecinas y acentos a tiempo', () => {
  const c = [0, 2, 5, 8]
  assert.ok(puedeMover(c, 2, 4))
  assert.ok(!puedeMover(c, 2, 2))
  assert.ok(!puedeMover(c, 2, 9))
  const sil = [{ tonica: false }, { tonica: true }, { tonica: true }, { tonica: true }]
  assert.deepEqual(acentosATiempo(sil, c), { bien: 2, total: 3 })
})

prueba('repartir con acentos: las tónicas caen en el pulso', () => {
  for (const t of ['Camino de noche por la avenida', 'la luna me sigue, me cuida la vida', 'cada palabra se vuelve poema']) {
    const s = silabasFlow(verso(t))
    const c = repartirConAcentos(s, 16)
    assert.ok(c.every((x, i) => i === 0 || x > c[i - 1]), t)
    const { bien, total } = acentosATiempo(s, c)
    assert.ok(bien >= acentosATiempo(s, repartir(s.length, 16)).bien, t)
    assert.ok(bien >= total - 1, `${t}: ${bien}/${total}`)
  }
})

console.log(process.exitCode ? 'Fallaron pruebas' : `✓ ${ok} pruebas del flow`)
