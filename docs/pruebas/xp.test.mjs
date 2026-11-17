// Pruebas del motor de experiencia (progress/xp.js): curva, títulos, multiplicadores, redondeo, libro, cansancio,
// bonos del día y combinar dispositivos. Uso: node docs/pruebas/xp.test.mjs
import assert from 'node:assert/strict'

// localStorage de mentira (el motor lo usa).
const almacen = new Map()
globalThis.localStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k) }

const xp = await import('../../src/progress/xp.js')
const { XP, nivelDeXP, costoNivel, tituloDe, calcularXP, factorCombo, factorTiempo, redondearPartes } = xp
let n = 0
const prueba = (nombre, fn) => {
  fn()
  n++
  console.log('ok', nombre)
}

prueba('curva: 200 + 100 × (n − 1)', () => {
  assert.equal(costoNivel(1), 200)
  assert.equal(costoNivel(5), 600)
  assert.equal(nivelDeXP(0).nivel, 1)
  assert.equal(nivelDeXP(199).nivel, 1)
  assert.equal(nivelDeXP(200).nivel, 2)
  assert.equal(nivelDeXP(5400).nivel, 10)
  assert.equal(nivelDeXP(5399).nivel, 9)
  const m = nivelDeXP(250)
  assert.equal(m.enNivel, 50)
  assert.equal(m.paraSiguiente, 300)
})

prueba('títulos cada 5 niveles', () => {
  assert.equal(tituloDe(1).nombre, 'Aprendiz')
  assert.equal(tituloDe(4).nombre, 'Aprendiz')
  assert.equal(tituloDe(5).nombre, 'Músico de cuarto')
  assert.equal(tituloDe(12).nombre, 'Beatmaker')
  assert.equal(tituloDe(40).nombre, 'Leyenda')
  assert.equal(nivelDeXP(0).siguienteTitulo.desde, 5)
})

prueba('multiplicadores: Rápido, dificultad 3, vidas y combo ≈ 13', () => {
  const r = calcularXP({
    base: XP.base.oido,
    factores: [
      { nombre: 'Dificultad', f: XP.dificultad[2] },
      { nombre: 'Modo Rápido', f: XP.rapido },
      { nombre: 'Con vidas', f: XP.vidas },
      { nombre: 'Combo', f: 1.3 },
    ],
  })
  assert.ok(Math.abs(r.xp - 4 * 1.4 * 1.5 * 1.2 * 1.3) < 1e-9)
  assert.equal(Math.round(r.xp), 13)
  const suma = Object.values(r.partes).reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(suma - r.xp) < 1e-9, 'las partes suman el total')
})

prueba('lo básico: 4 por acierto, sin partes de más', () => {
  const r = calcularXP({ base: 4, factores: [{ nombre: 'Dificultad', f: 1 }, { nombre: 'Combo', f: 1 }] })
  assert.equal(r.xp, 4)
  assert.deepEqual(Object.keys(r.partes), ['Aciertos'])
})

prueba('cansancio y tempo lento restan (partes negativas)', () => {
  const r = calcularXP({ base: 6, factores: [{ nombre: 'Tempo lento', f: 0.5 }, { nombre: 'Cansancio', f: 0.5 }] })
  assert.equal(r.xp, 1.5)
  assert.equal(r.partes['Tempo lento'], -3)
  assert.equal(r.partes['Cansancio'], -1.5)
})

prueba('combo: +10 % cada 5 seguidos, hasta ×1,5', () => {
  assert.equal(factorCombo(4), 1)
  assert.equal(factorCombo(5), 1.1)
  assert.equal(factorCombo(12), 1.2)
  assert.equal(factorCombo(100), 1.5)
})

prueba('contrarreloj: ×1,5 al instante, ×1 desde el primer tercio', () => {
  assert.equal(factorTiempo(0), 1.5)
  assert.equal(factorTiempo(0.5), 1)
  assert.ok(Math.abs(factorTiempo(1 / 6) - 1.25) < 1e-9)
})

prueba('redondeo: las partes enteras suman el total', () => {
  const partes = { Aciertos: 12, Dificultad: 4.8, Combo: 1.68, Cansancio: -3.2 }
  const total = 15.28
  const filas = redondearPartes(partes, total)
  assert.equal(filas.reduce((a, f) => a + f.xp, 0), 15)
})

prueba('libro: sumar, hoy, cansancio y bonos una vez al día', () => {
  xp.sumarXP('melodia', 10.25)
  xp.sumarXP('ritmo', 5)
  xp.sumarXP('raro', 2) // área desconocida → general
  const j = xp.xpJugada()
  assert.ok(Math.abs(j.total - 17.3) < 0.01)
  assert.ok(Math.abs(j.hoy - 17.3) < 0.01)
  assert.equal(j.porArea.general, 2)
  assert.equal(xp.sumarSegundos('oido:intervalos', 600), 0)
  assert.equal(xp.sumarSegundos('oido:intervalos', 700), 600)
  assert.equal(xp.cansado(xp.segundosHoy('oido:intervalos')), true)
  assert.equal(xp.cansado(xp.segundosHoy('oido:acordes')), false)
  assert.equal(xp.bonoNuevo('tres'), true)
  assert.equal(xp.bonoNuevo('tres'), false)
})

prueba('combinar dispositivos: lo propio no se toca, lo de otros por máximo, sin duplicar', () => {
  const propio = xp.leerXP().dispositivo
  const antes = xp.xpJugada().total
  const otro = { 'd-otro': { melodia: 100, ritmo: 20 }, [propio]: { melodia: 99999 } }
  xp.importarCompacto(otro)
  assert.ok(Math.abs(xp.xpJugada().total - (antes + 120)) < 0.01, 'suma lo del otro y no toca lo propio')
  xp.importarCompacto(otro) // dos veces: igual
  assert.ok(Math.abs(xp.xpJugada().total - (antes + 120)) < 0.01, 'importar dos veces no duplica')
  xp.importarCompacto({ 'd-otro': { melodia: 150 } })
  assert.ok(Math.abs(xp.xpJugada().total - (antes + 170)) < 0.01, 'el otro avanzó: máximo por área')
  const c = xp.libroCompacto()
  assert.deepEqual(c['d-otro'], { melodia: 150, ritmo: 20 })
  assert.deepEqual(xp.revisarCompacto({ x: { melodia: -3, nada: 4, ritmo: '7' }, ['y'.repeat(40)]: { ritmo: 1 } }), { x: { ritmo: 7 } })
})

console.log(`\n${n} pruebas bien`)
