// Prueba la lección 3.6 (pentatónicas) a 375 px en claro y oscuro: recorre los 14 pasos (sin errores en la consola),
// la fórmula con el salto «T½» (paso 2: Do pentatónica, casillas T½ en oro, grados 1 2 3 5 6 1, el fallo dice
// «un tono y medio salta dos teclas») y la pentatónica menor con grados ♭3 y ♭7 (paso 7).
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/pentatonicas.mjs [carpeta-de-capturas]
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
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/3-6-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  /** Abre la lección en el paso `n` (el visor empieza en el paso guardado). */
  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { 3.6: { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/3.6/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  /** Toca una tecla del piano (el teclado ya fue solo a la octava de la nota que toca). */
  const tocar = async (nota) => {
    const tecla = page.locator(`[data-note="${nota}"]`).first()
    await tecla.scrollIntoViewIfNeeded().catch(() => {})
    await espera(350)
    const caja = await tecla.boundingBox()
    await page.touchscreen.tap(caja.x + caja.width / 2, caja.y + caja.height * 0.85)
    await espera(350)
  }
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const fila = () => page.locator('[aria-label^="Fórmula"]').first()

  // Todos los pasos se pintan sin errores.
  for (let n = 0; n < 14; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    await foto(`paso-${String(n).padStart(2, '0')}`)
  }

  // Paso 2: Do pentatónica con el salto T½.
  await irAlPaso(2)
  const pasos = await fila().getAttribute('aria-label')
  comprobar(r, 'fórmula: T T T½ T T½', pasos === 'Fórmula: T T T½ T T½', pasos)
  const oro = await fila().locator('.bg-fijate-suave').count()
  comprobar(r, 'fórmula: 2 casillas T½ en oro', oro === 2, String(oro))
  const grados = await page.locator('[aria-label="Grados de la escala"]').textContent()
  comprobar(r, 'fórmula: grados 1 2 3 5 6 1', grados === '123561', grados)
  await tocar('D4')
  await tocar('E4')
  await tocar('F4') // fallo: desde Mi el salto es de tono y medio
  const mal = await info()
  comprobar(r, 'fórmula: el fallo explica T½', /un tono y medio salta dos teclas/.test(mal), mal)
  await foto('t-medio-fallo')
  for (const n of ['G4', 'A4', 'C5']) await tocar(n)
  const bien = await info()
  comprobar(r, 'fórmula: ¡Do pentatónica!', /Do pentatónica/.test(bien), bien)
  await foto('do-penta-bien')

  // Paso 7: La pentatónica menor (♭3 y ♭7).
  await irAlPaso(7)
  const gradosMenor = await page.locator('[aria-label="Grados de la escala"]').textContent()
  comprobar(r, 'menor: grados 1 ♭3 4 5 ♭7 1', gradosMenor === '1♭345♭71', gradosMenor)
  for (const n of ['C5', 'D5', 'E5', 'G5', 'A5']) await tocar(n)
  const bienMenor = await info()
  comprobar(r, 'menor: ¡La pentatónica menor!', /La pentatónica menor/.test(bienMenor), bienMenor)
  await foto('la-menor-bien')

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLOS` : 'Todo bien')
process.exit(fallos ? 1 : 0)
