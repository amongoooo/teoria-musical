// Prueba la pantalla de Letras a 375 px en claro y oscuro: Inicio (bloque Letras) → cuaderno vacío → «Probar con un
// ejemplo» → análisis (esquema, colores, sílabas, sinalefas, multi) → ficha de una palabra → «Palabra por palabra» →
// escribir → el cuaderno con la letra. También captura el pad de ritmo con su textura.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/letras.mjs [carpeta-de-capturas]
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

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/letras-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.addInitScript((tema) => {
    if (sessionStorage.getItem('iniciado')) return
    sessionStorage.setItem('iniciado', '1')
    localStorage.clear()
    localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
  }, tema)

  await page.goto(BASE + '#/practicar')
  const bloque = page.locator('[data-entrenamiento="letras"]')
  await bloque.waitFor()
  await bloque.scrollIntoViewIfNeeded()
  await espera(900)
  await foto('1-inicio')
  await bloque.click()
  await page.waitForSelector('[data-ejemplo]')
  await espera(600)
  await foto('2-cuaderno-vacio')

  await page.click('[data-ejemplo]')
  await page.waitForSelector('[data-estrofa]')
  await espera(700)
  const esquemas = await page.$$eval('[data-estrofa]', (es) => es.map((e) => e.dataset.esquema))
  comprobar(r, 'esquema', esquemas.join(' ') === 'AABB AABB', esquemas.join(' '))
  const colorVida = await page.getAttribute('[data-palabra="vida"]', 'data-familia')
  const colorAvenida = await page.getAttribute('[data-palabra="avenida"]', 'data-familia')
  comprobar(r, 'familia', colorVida && colorVida === colorAvenida, `${colorAvenida}/${colorVida}`)
  comprobar(r, 'rimaInterna', (await page.getAttribute('[data-palabra="frente"]', 'data-familia')) === (await page.getAttribute('[data-palabra="gente"]', 'data-familia')))
  comprobar(r, 'sinalefas', (await page.locator('[data-sinalefa]').count()) > 0)
  comprobar(r, 'multi', (await page.locator('[data-multi]').count()) > 0)
  const silabas1 = await page.getAttribute('[data-verso]', 'data-silabas')
  await foto('3-analisis')

  await page.click('[data-palabra="avenida"]')
  await page.waitForSelector('[data-ficha="avenida"]')
  await espera(700)
  const tonica = await page.textContent('[data-tonica]')
  comprobar(r, 'tonica', tonica.trim() === 'ni', tonica)
  comprobar(r, 'rimaEnLetra', (await page.textContent('[data-ficha]')).includes('vida'))
  await foto('4-ficha')
  await page.keyboard.press('Escape')
  await espera(500)

  await page.getByRole('radio', { name: 'Palabra por palabra' }).click()
  await espera(400)
  const silabas2 = await page.getAttribute('[data-verso]', 'data-silabas')
  comprobar(r, 'porPalabra', Number(silabas2) >= Number(silabas1) && (await page.locator('[data-sinalefa]').count()) === 0, `${silabas1} → ${silabas2}`)

  await page.getByRole('radio', { name: 'Escribir' }).click()
  await page.waitForSelector('[data-texto-letra]')
  await page.fill('[data-texto-letra]', 'Tengo un corazón\nque busca razón')
  await page.getByRole('radio', { name: 'Analizar' }).click()
  await page.waitForSelector('[data-estrofa]')
  comprobar(r, 'editar', (await page.getAttribute('[data-estrofa]', 'data-esquema')) === 'AA')
  await page.getByRole('radio', { name: 'Escribir' }).click()
  await espera(500)
  await foto('5-escribir')

  await page.click('[aria-label="Volver al cuaderno"]')
  await page.waitForSelector('[data-letra]')
  await espera(600)
  comprobar(r, 'guardada', (await page.locator('[data-letra]').count()) === 1)
  await foto('6-cuaderno')

  // Pad de ritmo (de goma, con su grano).
  await page.goto(BASE + '#/ritmo/seguir')
  await page.locator('[data-barra-accion] button', { hasText: 'Empezar' }).click()
  await page.waitForSelector('[data-textura]')
  await espera(1200)
  await foto('7-pad')

  comprobar(r, 'sinErrores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
process.exit(fallos ? 1 : 0)
