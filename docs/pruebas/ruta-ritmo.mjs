// Prueba la ruta de ritmo, el nuevo orden de Inicio y el Piano libre en tarjetita, a 375 px en claro y oscuro
// (y con «reducir movimiento»):
//  - Inicio: «Rutas y práctica» (Ritmo dice «ruta 0/10»), «Herramientas» con las tarjetitas del Círculo y del Piano;
//    el Piano abre #/piano con su teclado.
//  - #/ritmo: la ruta debajo de la práctica: 10 paradas; sin progreso, la 1 es la actual y las demás con candado.
//  - Con 2.1 y 2.2 hechas y Seguir en el nivel 2: 3/10, la 4 (Eco · nivel 3) es la actual; su hoja dice «Tu nivel» y
//    «Practicar» lleva a #/ritmo/eco; una bloqueada dice «Antes: …».
//  - Con 2.1–2.5 completas: el Flow se abre (pestaña de Letras sin candado); sin la 2.4, la pestaña tiene candado
//    y no cambia al tocarla. El reto «Lo hice» completa la ruta (10/10).
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/ruta-ritmo.mjs [carpeta-de-capturas]
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
const completadas = (ids) => Object.fromEntries(ids.map((id) => [id, { paso: 0, completada: true, aciertos: 1, total: 1 }]))
const ritmo = (seguir, eco = 1) => ({ version: 1, dias: {}, mejorRacha: 0, modos: { seguir: { nivel: seguir, nivelMax: seguir }, eco: { nivel: eco, nivelMax: eco } } })

for (const [tema, reducir] of [['claro', false], ['oscuro', false], ['claro', true]]) {
  const r = (resultados[`${tema}${reducir ? ' (reducir movimiento)' : ''}`] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  if (reducir) await page.emulateMedia({ reducedMotion: 'reduce' })
  const foto = (n, completa = false) => carpeta && !reducir && page.screenshot({ path: `${carpeta}/ruta-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async ({ lecciones = {}, retos = {}, nivelSeguir = 1, nivelEco = 1, ruta = '' } = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, retos, datosRitmo]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos }))
        localStorage.setItem('teoria-musical:ritmo:v1', JSON.stringify(datosRitmo))
      },
      [tema, lecciones, retos, ritmo(nivelSeguir, nivelEco)],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(800)
  }
  const estadoParada = (i) => page.getAttribute(`[data-parada="${i}"]`, 'data-estado')

  // 1) Inicio sin progreso.
  await preparar()
  const titulos = await page.$$eval('h2', (hs) => hs.map((h) => h.textContent.trim()))
  comprobar(r, 'Inicio: Rutas y práctica · Módulos · Herramientas', ['Rutas y práctica', 'Módulos', 'Herramientas'].every((t) => titulos.includes(t)), titulos.join(' | '))
  comprobar(r, 'sin «Piano libre» suelto en Inicio', (await page.locator('[data-note]').count()) === 0)
  comprobar(r, 'Ritmo dice ruta 0/10', (await page.textContent('[data-ruta-inicio="ritmo"]')).includes('0/10'))
  await page.locator('[data-tarjeta-piano]').scrollIntoViewIfNeeded()
  await espera(300)
  await foto('inicio-herramientas')
  await page.locator('[data-tarjeta-piano]').click()
  await page.waitForSelector('[data-piano-libre]')
  await espera(500)
  comprobar(r, 'el Piano abre #/piano con su teclado', page.url().includes('#/piano') && (await page.locator('[data-note]').count()) > 0)
  await foto('piano')

  // 2) La ruta sin progreso.
  await preparar({ ruta: '#/ritmo' })
  comprobar(r, 'la ruta tiene 10 paradas', (await page.locator('[data-parada]').count()) === 10)
  comprobar(r, 'sin progreso: la 1 es la actual', (await estadoParada(0)) === 'actual' && (await estadoParada(1)) === 'bloqueada')

  // 3) Con 2.1 y 2.2 y Seguir nivel 2.
  await preparar({ ruta: '#/ritmo', lecciones: completadas(['2.1', '2.2']), nivelSeguir: 2 })
  comprobar(r, '3/10', (await page.textContent('[data-ruta-avance]')).includes('3/10'))
  comprobar(r, 'Eco · nivel 3 es la actual', (await estadoParada(3)) === 'actual' && (await estadoParada(2)) === 'hecha')
  await page.locator('[data-parada="3"]').scrollIntoViewIfNeeded()
  await espera(300)
  await foto('camino')
  await page.locator('[data-parada="3"] button').click()
  await page.waitForSelector('[data-hoja-parada="3"]')
  await espera(500)
  comprobar(r, 'hoja de la meta con «Tu nivel»', (await page.textContent('[data-nivel-meta]')).includes('Tu nivel: 1'))
  await foto('hoja-meta')
  await page.getByRole('link', { name: 'Practicar' }).click()
  await espera(700)
  comprobar(r, '«Practicar» lleva a #/ritmo/eco', page.url().includes('#/ritmo/eco'), page.url())
  await page.goto(BASE + '#/ritmo')
  await espera(800)
  await page.locator('[data-parada="6"]').scrollIntoViewIfNeeded()
  await page.locator('[data-parada="6"] button').click()
  await page.waitForSelector('[data-hoja-parada="6"]')
  await espera(400)
  comprobar(r, 'bloqueada dice «Antes: Eco · nivel 3»', (await page.textContent('[data-hoja-parada="6"]')).includes('Antes: Eco · nivel 3'))

  // 4) Flow con candado sin la 2.4.
  await preparar({ ruta: '#/letras' })
  await page.click('[data-nueva-letra]')
  await espera(600)
  const flow = page.locator('[role="radio"]', { hasText: 'Flow' })
  comprobar(r, 'Flow con candado sin la 2.4', (await flow.getAttribute('data-bloqueado')) === 'true')
  await flow.click({ force: true }) // aria-disabled: Playwright no lo toca sin force
  await espera(400)
  comprobar(r, 'tocar Flow bloqueado no cambia', (await flow.getAttribute('aria-checked')) === 'false')

  // 5) Todo el módulo 2 y Seguir 5 / Eco 3: falta solo el reto; el Flow abierto.
  await preparar({ ruta: '#/ritmo', lecciones: completadas(['2.1', '2.2', '2.3', '2.4', '2.5']), nivelSeguir: 5, nivelEco: 3 })
  comprobar(r, '9/10 y el reto es la actual', (await page.textContent('[data-ruta-avance]')).includes('9/10') && (await estadoParada(9)) === 'actual')
  comprobar(r, 'Flow hecho', (await estadoParada(7)) === 'hecha')
  await page.locator('[data-parada="9"]').scrollIntoViewIfNeeded()
  await page.locator('[data-parada="9"] button').click()
  await page.waitForSelector('[data-hoja-parada="9"]')
  await espera(400)
  await foto('hoja-reto')
  await page.getByRole('button', { name: 'Lo hice' }).click()
  await espera(400)
  await page.keyboard.press('Escape')
  await espera(500)
  comprobar(r, 'con el reto: 10/10', (await page.textContent('[data-ruta-avance]')).includes('10/10'))
  await foto('ruta-completa')
  await page.goto(BASE + '#/letras')
  await espera(500)
  await page.click('[data-nueva-letra]')
  await espera(600)
  comprobar(r, 'Flow abierto con la 2.4', (await page.locator('[role="radio"]', { hasText: 'Flow' }).getAttribute('data-bloqueado')) === null)

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
