// Pruebas del motor de letras: node src/letras/letras.test.mjs
import assert from 'node:assert/strict'
import { analizar, silabasVerso } from './analisis.js'
import { rima, riman, sonido } from './rima.js'
import { analizarPalabra, silabas } from './silabas.js'

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

// Sílabas
const SILABAS = {
  canción: 'can-ción', poesía: 'po-e-sí-a', calle: 'ca-lle', perro: 'pe-rro', noche: 'no-che', guitarra: 'gui-ta-rra',
  querer: 'que-rer', atlas: 'a-tlas', obstáculo: 'obs-tá-cu-lo', instrumento: 'ins-tru-men-to', ciudad: 'ciu-dad',
  héroe: 'hé-ro-e', país: 'pa-ís', buey: 'buey', hoy: 'hoy', reyes: 're-yes', murciélago: 'mur-cié-la-go',
  pingüino: 'pin-güi-no', ahora: 'a-ho-ra', corazón: 'co-ra-zón', fuego: 'fue-go', tiempo: 'tiem-po', mar: 'mar',
  ciudades: 'ciu-da-des', destrozo: 'des-tro-zo', abrazo: 'a-bra-zo', construir: 'cons-truir', río: 'rí-o',
  aéreo: 'a-é-re-o', cielo: 'cie-lo', camino: 'ca-mi-no', y: 'y', transporte: 'trans-por-te', extraño: 'ex-tra-ño',
}
for (const [p, esperado] of Object.entries(SILABAS)) prueba(`sílabas ${p}`, () => assert.equal(silabas(p).join('-'), esperado))

// Acento
const ACENTO = { canción: 'aguda', calle: 'llana', árbol: 'llana', murciélago: 'esdrújula', amor: 'aguda', ciudad: 'aguda', examen: 'llana', dímelo: 'esdrújula', dígaselo: 'sobresdrújula', reloj: 'aguda', Uruguay: 'aguda' }
for (const [p, t] of Object.entries(ACENTO)) prueba(`acento ${p}`, () => assert.equal(analizarPalabra(p).tipo, t))

// Sonido y rimas (seseo, yeísmo, b = v, h muda)
prueba('sonido', () => {
  assert.equal(sonido('ción'), 'sion')
  assert.equal(sonido('alle'), 'aye')
  assert.equal(sonido('ive'), 'ibe')
})
const CONSONANTES = [['corazón', 'razón'], ['calle', 'valle'], ['calle', 'baye'], ['cielo', 'hielo'], ['voz', 'sol'.replace('l', 's')], ['abrazo', 'paso'], ['vive', 'escribe'], ['hoy', 'voy'], ['noche', 'reproche'], ['fuego', 'luego'], ['ciudad', 'verdad']]
for (const [a, b] of CONSONANTES) prueba(`consonante ${a}/${b}`, () => assert.equal(riman(a, b), 'consonante'))
const ASONANTES = [['noche', 'golpe'], ['calle', 'tarde'], ['amor', 'dolor'.replace('d', 'c')], ['camino', 'destino'.replace('t', 'r')], ['luna', 'cura'], ['mar', 'pan'], ['árbol', 'cargo']]
// 'amor'/'color' y 'camino'/'desrino' son consonantes: cámbialos por asonantes de verdad
ASONANTES.splice(2, 2, ['amor', 'sol'], ['camino', 'frío'])
for (const [a, b] of ASONANTES) prueba(`asonante ${a}/${b}`, () => assert.equal(riman(a, b), 'asonante'))
prueba('no riman', () => {
  assert.equal(riman('noche', 'calle'), null)
  assert.equal(riman('amor', 'amor'), null)
})
prueba('asonante de esdrújula', () => assert.equal(rima('música').asonante, 'u-a'))

// Sinalefa
const verso = (t) => t.match(/[a-záéíóúüñ]+/gi).map((p) => ({ texto: p, silabas: silabas(p) }))
prueba('sinalefa', () => {
  assert.equal(silabasVerso(verso('La alegría de la vida')).n, 8) // la_a-le-grí-a de la vi-da
  assert.equal(silabasVerso(verso('La alegría de la vida'), { porPalabra: true }).n, 9)
  assert.equal(silabasVerso(verso('Me gusta el hielo')).n, 5) // me gus-ta_el hie-lo
  assert.equal(silabasVerso(verso('Yo soy')).n, 2)
})

// Letra: esquema, familias y multis
const LETRA = `Camino solo por la calle
la luna mira desde el valle
y en mi pecho late el fuego
me dijo nos vemos luego

Siempre tengo el reproche
porque vengo de noche`
prueba('esquema y familias', () => {
  const a = analizar(LETRA)
  assert.equal(a.estrofas.length, 2)
  assert.deepEqual(a.estrofas[0].versos.map((v) => v.letra), ['A', 'A', 'B', 'B'])
  assert.deepEqual(a.estrofas[1].versos.map((v) => v.letra), ['A', 'A'])
  const calle = a.estrofas[0].versos[0].palabras.at(-1)
  const valle = a.estrofas[0].versos[1].palabras.at(-1)
  assert.equal(calle.familia, valle.familia)
  assert.ok(a.familias[calle.familia].color >= 1)
  assert.equal(a.estrofas[1].versos[1].multi, 3) // ten-go_el re-pro-che / ven-go de no-che: e-o-e
})

console.log(`${ok} pruebas bien${process.exitCode ? ' (con fallos arriba)' : ''}`)
