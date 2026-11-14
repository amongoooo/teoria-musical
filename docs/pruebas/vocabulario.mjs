// Prueba el vocabulario de letras a 375 px en claro y oscuro: cuaderno (tarjeta Vocabulario) → panel (repaso de hoy,
// temas) → repaso (pregunta nueva, acierto con ficha y rimas del diccionario, fallo) → caja guardada → cada ejercicio
// → ficha de una palabra en Letras con «Rimas en el diccionario» → Créditos en Opciones.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/vocabulario.mjs [carpeta-de-capturas]
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
const boton = (page, nombre) => page.locator('[data-barra-accion] button', { hasText: nombre }).first()
const CLAVE = 'teoria-musical:letras-vocab:v1'

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n, completa = false) => carpeta && page.screenshot({ path: `${carpeta}/vocab-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.addInitScript((tema) => {
    if (sessionStorage.getItem('iniciado')) return
    sessionStorage.setItem('iniciado', '1')
    localStorage.clear()
    localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
  }, tema)

  // Cuaderno → tarjeta de Vocabulario
  await page.goto(BASE + '#/letras')
  await page.waitForSelector('[data-vocabulario]')
  await espera(700)
  comprobar(r, 'tarjeta', (await page.textContent('[data-vocabulario]')).includes('10 palabras para hoy'))
  await foto('1-cuaderno')
  await page.click('[data-vocabulario]')
  await page.waitForSelector('[data-repaso-hoy]')
  await espera(900)
  comprobar(r, 'pendientes', (await page.getAttribute('[data-repaso-hoy]', 'data-repaso-hoy')) === '10')
  await foto('2-panel')
  await page.locator('[data-tema="calle"]').scrollIntoViewIfNeeded()
  await page.click('[data-tema="calle"]')
  await espera(500)
  comprobar(r, 'temaApagado', (await page.getAttribute('[data-tema="calle"]', 'aria-checked')) === 'false')
  await foto('3-temas')

  // Repaso: la primera es nueva y de significado
  await page.goto(BASE + '#/letras/vocabulario/repaso')
  await page.waitForSelector('[data-pregunta]')
  await espera(600)
  comprobar(r, 'primeraNueva', (await page.getAttribute('[data-pregunta]', 'data-pregunta')) === 'significado' && (await page.locator('[data-nueva]').count()) === 1)
  await foto('4-pregunta')
  const palabra1 = await page.getAttribute('[data-pregunta]', 'data-palabra')
  await page.click('[data-correcta]')
  await page.waitForSelector('[data-rimas-diccionario="listo"]', { timeout: 15000 })
  await espera(700)
  comprobar(r, 'rimas', (await page.locator('[data-ficha-vocab] [data-rima]').count()) > 0)
  await foto('5-acierto')
  await page.locator('[data-ficha-vocab]').scrollIntoViewIfNeeded()
  await espera(300)
  await foto('5b-ficha')
  const guardado = await page.evaluate((c) => JSON.parse(localStorage.getItem(c)), CLAVE)
  comprobar(r, 'caja', guardado.repaso?.[palabra1]?.[0] === 1, JSON.stringify(guardado.repaso))
  comprobar(r, 'racha', Object.values(guardado.dias)[0]?.respuestas === 1)

  // Segunda pregunta: fallar a propósito
  await boton(page, 'Continuar').click()
  await espera(700)
  const palabra2 = await page.getAttribute('[data-pregunta]', 'data-palabra')
  comprobar(r, 'otraPalabra', palabra2 && palabra2 !== palabra1)
  comprobar(r, 'temaCalleFuera', !(await page.evaluate(() => document.body.innerText)).includes('Mi barrio me enseñó'))
  await page.locator('[data-opcion]:not([data-correcta])').first().click()
  await espera(900)
  await foto('6-fallo')

  // Cada ejercicio
  for (const modo of ['sinonimos', 'verso']) {
    await page.goto(BASE + `#/letras/vocabulario/${modo}`)
    await page.waitForSelector(`[data-pregunta="${modo}"]`)
    await espera(600)
    if (modo === 'verso') comprobar(r, 'hueco', (await page.locator('[data-verso-hueco] [aria-label="hueco"]').count()) === 1)
    await foto(`7-${modo}`)
    await page.click('[data-correcta]')
    await espera(800)
    await foto(`8-${modo}-bien`)
  }

  // Panel otra vez: estadísticas y repaso que baja
  await page.goto(BASE + '#/letras/vocabulario')
  await page.waitForSelector('[data-repaso-hoy]')
  await espera(800)
  comprobar(r, 'bajan', Number(await page.getAttribute('[data-repaso-hoy]', 'data-repaso-hoy')) < 10)
  await foto('9-panel-despues', true)

  // Ficha de una palabra en Letras: rimas en el diccionario y tocar una
  await page.goto(BASE + '#/letras')
  await page.waitForSelector('[data-ejemplo]')
  await page.click('[data-ejemplo]')
  await page.waitForSelector('[data-estrofa]')
  await page.click('[data-palabra="noche"]')
  await page.waitForSelector('[data-ficha="noche"] [data-rimas-diccionario="listo"]', { timeout: 15000 })
  await espera(600)
  const rimas = await page.$$eval('[data-ficha="noche"] [data-rima]', (es) => es.map((e) => e.dataset.rima))
  comprobar(r, 'cocheRima', rimas.includes('coche'), rimas.slice(0, 8).join(','))
  await page.locator('[data-ficha="noche"] [data-rimas-diccionario]').scrollIntoViewIfNeeded()
  await espera(300)
  await foto('10-ficha-rimas')
  await page.click('[data-rima="coche"]')
  await page.waitForSelector('[data-ficha="coche"]')
  comprobar(r, 'navegaRima', true)

  // Créditos en Configuración (la pestaña de la tuerquita)
  await page.goto(BASE + '#/configuracion')
  await page.waitForSelector('[data-credito]')
  await page.locator('[data-credito]').first().scrollIntoViewIfNeeded()
  await espera(600)
  await foto('11-creditos')

  comprobar(r, 'sinErrores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `✗ ${fallos} fallos` : '✓ todo bien')
process.exitCode = fallos ? 1 : 0
