// Prueba la lección 3.7 (menor armónica y melódica) a 375 px en claro y oscuro: recorre los 16 pasos (sin errores en
// la consola), La menor armónica con el salto T½ (paso 2: grados 1 2 ♭3 4 5 ♭6 7 1, el fallo en Fa → Sol explica el
// tono y medio), la sensible un semitono abajo (paso 5), La menor melódica (paso 7) y el roll con Sol♯ (paso 12).
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/menores.mjs [carpeta-de-capturas]
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
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/3-7-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  /** Abre la lección en el paso `n` (el visor empieza en el paso guardado). */
  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { 3.7: { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/3.7')
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
  for (let n = 0; n < 16; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    await foto(`paso-${String(n).padStart(2, '0')}`)
  }

  // Paso 2: La menor armónica con el salto T½.
  await irAlPaso(2)
  const pasos = await fila().getAttribute('aria-label')
  comprobar(r, 'armónica: T S T T S T½ S', pasos === 'Fórmula: T S T T S T½ S', pasos)
  const oro = await fila().locator('.bg-fijate-suave').count()
  comprobar(r, 'armónica: S y T½ en oro (4)', oro === 4, String(oro))
  const grados = await page.locator('[aria-label="Grados de la escala"]').textContent()
  comprobar(r, 'armónica: grados 1 2 ♭3 4 5 ♭6 7 1', grados === '12♭345♭671', grados)
  for (const n of ['B4', 'C5', 'D5', 'E5', 'F5']) await tocar(n)
  await tocar('G5') // fallo: desde Fa el salto es de tono y medio
  const mal = await info()
  comprobar(r, 'armónica: el fallo explica T½', /un tono y medio salta dos teclas/.test(mal), mal)
  await foto('armonica-fallo')
  for (const n of ['G#5', 'A5']) await tocar(n)
  const bien = await info()
  comprobar(r, 'armónica: ¡La menor armónica!', /La menor armónica/.test(bien), bien)
  const casillas = await fila().textContent()
  comprobar(r, 'armónica: la casilla dice Sol♯ (no La♭)', /Sol♯/.test(casillas) && !/La♭/.test(casillas), casillas)
  await foto('armonica-bien')

  // Paso 5: la sensible de La (un semitono abajo).
  await irAlPaso(5)
  await tocar('G#4')
  const sens = await info()
  comprobar(r, 'sensible: Sol♯', /Sol♯/.test(sens), sens)
  await foto('sensible')

  // Paso 7: La menor melódica.
  await irAlPaso(7)
  const gradosMel = await page.locator('[aria-label="Grados de la escala"]').textContent()
  comprobar(r, 'melódica: grados 1 2 ♭3 4 5 6 7 1', gradosMel === '12♭345671', gradosMel)
  for (const n of ['B4', 'C5', 'D5', 'E5', 'F#5', 'G#5', 'A5']) await tocar(n)
  const bienMel = await info()
  comprobar(r, 'melódica: ¡La menor melódica!', /La menor melódica/.test(bienMel), bienMel)
  await foto('melodica-bien')

  // Paso 12: el roll tiene la fila de Sol♯ junto a la de La.
  await irAlPaso(12)
  const texto = await page.locator('main').textContent()
  comprobar(r, 'roll: fila de Sol♯', /Sol♯/.test(texto), '')
  await foto('roll')

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLOS` : 'Todo bien')
process.exit(fallos ? 1 : 0)
