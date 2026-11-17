// Prueba la lección 5.6 «Ritmo armónico» a 375 px en claro y oscuro:
//  - node: conBeat / tramosAcordes (duraciones, adelanto, vueltas), banco de la prueba rápida, catálogo y tramo «Progresiones»;
//  - los 14 pasos se ven, sin errores en la consola ni scroll de lado;
//  - paso 1: la rejilla con bloques sobre el beat: Escuchar enciende un acorde y un tiempo; tocar un bloque lo enciende;
//  - paso 2: versiones Lento (4 bloques) · Normal (8) · Rápido (16) que cambian con el control segmentado;
//  - paso 4: «Toca en cada cambio» (pulso con los acordes): 6 cambios a tiempo → «¡Tienes pulso!»;
//  - paso 6: R2 el bajo del loop, dos por compás → «Perfecto»;
//  - paso 7: el pre-coro en 12 compases (3 filas); paso 9: «Adelantado» con 4 bloques en oro.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/ritmo-armonico.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

const BASE = process.env.BASE || 'http://localhost:5199/teoria-musical/'
const carpeta = process.argv[2] || null
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const resultados = {}
let fallos = 0
const comprobar = (r, nombre, ok, detalle = '') => {
  r[nombre] = ok ? 'ok' : `FALLA ${detalle}`
  if (!ok) fallos++
}
const PASOS = 14

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const { conBeat, tramosAcordes, cambiosAcordes } = await import('../../src/theory/bateria.js')
  const a = (tiempos, adelanto = 0) => ({ notas: ['C3', 'E4'], tiempos, adelanto })
  const t = tramosAcordes([a(4, 0.5), a(4, 0.5)], { ciclo: true })
  comprobar(r, 'tramos con adelanto en bucle', JSON.stringify(t) === '[{"inicio":-0.5,"fin":3.5},{"inicio":3.5,"fin":7.5}]', JSON.stringify(t))
  comprobar(r, 'cambios: cada 2 compases', cambiosAcordes([a(8), a(8), a(8)]).join() === '0,8,16')
  const s = conBeat([a(4, 0.5), a(4, 0.5)], { vueltas: 2 })
  const acordes = s.groove.filter((e) => Array.isArray(e.nota)).map((e) => `${e.inicio}+${e.duracion}`).join(' ')
  comprobar(r, 'conBeat: 2 vueltas, el 1.º se adelanta al repetir', acordes === '0+7 7+8 15+8 23+9' && s.tiempos === 16, acordes)
  const golpes = s.groove.filter((e) => e.nota === 'kick').length
  comprobar(r, 'conBeat: el beat en cada compás (bombo 1 y 3)', golpes === 8, String(golpes))
  const trap = conBeat([a(8)], { groove: 'trap', bpm: 140 })
  comprobar(r, 'conBeat con trap: semicorcheas', trap.porTiempo === 4 && trap.metro === 4)

  const banco = (await import('../../src/content/pruebas/modulo-5.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 5.6', banco['5.6']?.length === 3)
  const { CATALOGO } = await import('../../src/content/catalogo.js')
  const c = CATALOGO['5.6']
  comprobar(r, 'catálogo: 5.6 ← 5.4, 2.2 (Armonía, Ritmo, Producción)', JSON.stringify(c?.requiere) === '["5.4","2.2"]' && c?.areas.join() === 'armonia,ritmo,produccion', JSON.stringify(c))
  const { TRAMOS } = await import('../../src/content/rutas.js')
  const paradas = TRAMOS.progresiones.paradas.map((p) => p.id ?? `${p.modo}:${p.nivel}`).join(' ')
  comprobar(r, 'tramo «Progresiones»: … la 5.6 y luego la 5.7', paradas.startsWith('5.4 funciones:4 5.5 acordes:6 5.6'), paradas)
  const leccion = (await import('../../src/content/modulo-05/leccion-5-6.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const v = leccion.pasos[2].rejilla.versiones.map((x) => `${x.nombre}:${x.acordes.length}:${x.sonido.tiempos}`).join(' ')
  comprobar(r, 'versiones: 8 compases cada una', v === 'Lento:4:32 Normal:8:32 Rápido:16:32', v)
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '5.6': { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/5.6/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')

  // ——— Los 14 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`5.6-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 1: la rejilla sobre el beat ———
  await irAlPaso(1)
  const rej = page.locator('[data-rejilla-bloques]')
  comprobar(r, 'paso 1: 4 bloques', (await rej.locator('[data-bloque]').count()) === 4)
  await rej.evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await rej.getByRole('button', { name: /Escuchar sobre el beat/ }).click()
  await espera(3600) // ya en el 2.º compás (90 BPM: 2,67 s por compás)
  const suena = await rej.locator('[data-suena]').getAttribute('data-cifrado').catch(() => null)
  comprobar(r, 'Escuchar enciende el acorde del compás 2 (G)', suena === 'G', String(suena))
  comprobar(r, 'y un tiempo late', (await rej.locator('[data-late]').count()) === 1)
  await foto('5.6-rejilla-sonando')
  await rej.locator('[data-bloque="2"]').click()
  await espera(250)
  const solo = await rej.locator('[data-suena]').getAttribute('data-cifrado').catch(() => null)
  comprobar(r, 'tocar el bloque 3 lo enciende (Am)', solo === 'Am', String(solo))

  // ——— Paso 2: versiones ———
  await irAlPaso(2)
  const rej2 = page.locator('[data-rejilla-bloques]')
  const cuantos = async () => rej2.locator('[data-bloque]').evaluateAll((els) => new Set(els.map((e) => e.dataset.bloque)).size)
  comprobar(r, 'Lento: 4 acordes', (await cuantos()) === 4)
  await rej2.locator('[data-version="Normal"]').click()
  await espera(600)
  comprobar(r, 'Normal: 8 acordes', (await cuantos()) === 8)
  await rej2.locator('[data-version="Rápido"]').click()
  await espera(600)
  comprobar(r, 'Rápido: 16 acordes', (await cuantos()) === 16)
  const elegido = await rej2.locator('[role="radio"][aria-checked="true"]').textContent()
  comprobar(r, 'el control marca la versión', elegido === 'Rápido', elegido)
  const anchoRej = await rej2.evaluate((e) => e.getBoundingClientRect().width)
  comprobar(r, 'la rejilla cabe a 375 px', anchoRej <= 344, String(anchoRej))
  await foto('5.6-rapido')

  // ——— Paso 4: Toca en cada cambio (un acorde por compás a 90 BPM) ———
  await irAlPaso(4)
  await page.getByRole('button', { name: 'Empezar', exact: true }).click()
  const periodo = (4 * 60000) / 90
  await espera(periodo * 0.9)
  for (let i = 0; i < 9; i++) {
    await page.locator('[data-pad-goma]').dispatchEvent('pointerdown')
    await espera(120)
    const err = Number(await page.locator('[data-medidor]').getAttribute('data-medidor').catch(() => 0)) || 0
    if ((await page.locator('[data-tarjeta-info]').textContent().catch(() => '')).includes('¡Tienes pulso!')) break
    await espera(periodo - 120 - err)
  }
  await espera(300)
  comprobar(r, 'Toca en cada cambio: 6 a tiempo', /¡Tienes pulso!/.test(await info()), await info())

  // ——— Paso 6: el bajo, dos por compás ———
  await irAlPaso(6)
  await page.locator('[data-rejilla]').evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await espera(300)
  const g = await page.locator('[data-rejilla]').boundingBox()
  const celda = (col, fila) => [g.x + ((col + 0.5) / 8) * g.width, g.y + ((fila + 0.5) / 4) * g.height]
  // Do (fila 0) en 0, Sol (fila 2) en 2, La (fila 1) en 4, Fa (fila 3) en 6: cada una alargada a 2 casillas.
  for (const [col, fila] of [[0, 0], [2, 2], [4, 1], [6, 3]]) {
    const [x, y] = celda(col, fila)
    const [x2] = celda(col + 1, fila)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x2, y, { steps: 6 })
    await page.mouse.up()
    await espera(250)
  }
  await foto('5.6-roll')
  await boton().click()
  await espera(600)
  comprobar(r, 'roll: el bajo dos por compás', /Perfecto/.test(await info()), await info())

  // ——— Paso 7: el pre-coro en 12 compases ———
  await irAlPaso(7)
  const rej7 = page.locator('[data-rejilla-bloques]')
  comprobar(r, 'pre-coro: 12 acordes', (await rej7.locator('[data-bloque]').count()) === 12)
  comprobar(r, 'pre-coro: 12 compases numerados', (await rej7.locator('[data-compas-tiempos]').count()) === 12)

  // ——— Paso 9: adelantado ———
  await irAlPaso(9)
  const rej9 = page.locator('[data-rejilla-bloques]')
  comprobar(r, 'a tiempo: sin adelanto', (await rej9.locator('[data-adelanto]').count()) === 0)
  await rej9.locator('[data-version="Adelantado"]').click()
  await espera(600)
  comprobar(r, 'adelantado: 4 bloques en oro', (await rej9.locator('[data-adelanto]').count()) === 4)
  await foto('5.6-adelantado')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
