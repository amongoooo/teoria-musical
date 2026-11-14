// Prueba la lección 3.5 (grados, tonalidad y círculo de quintas) a 375 px en claro y oscuro: recorre los 15 pasos
// (sin errores en la consola), el círculo que suena (paso 4: tocar una tonalidad la elige y el centro dice su armadura),
// «Encuentra el grado» (paso 3: «Toca la dominante de Do4» → Sol4), «Encuentra en el círculo» (paso 8: acierto y fallo
// con verde / oro) y las relativas por dentro (paso 10).
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/circulo.mjs [carpeta-de-capturas]
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
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/3-5-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  /** Abre la lección en el paso `n` (el visor empieza en el paso guardado). */
  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { 3.5: { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/3.5/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const pulsarBoton = async () => {
    await boton().click()
    await espera(500)
  }

  // Todos los pasos se pintan sin errores.
  for (let n = 0; n < 15; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    await foto(`paso-${String(n).padStart(2, '0')}`)
  }

  // Paso 3: «Toca la dominante de Do4» → Sol4.
  await irAlPaso(3)
  const frase = await page.locator('p', { hasText: 'Toca' }).first().textContent()
  comprobar(r, 'grado: frase «Toca la dominante de Do4»', /Toca la dominante de Do4/.test(frase), frase)
  const tecla = await page.locator('[data-note="G4"]').first().boundingBox()
  await page.touchscreen.tap(tecla.x + tecla.width / 2, tecla.y + tecla.height * 0.85)
  await espera(500)
  const info3 = await page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  comprobar(r, 'grado: Sol4 es la dominante', /Sol4/.test(info3) && /dominante de Do es/.test(info3), info3)
  await foto('grado-bien')

  // Paso 4: el círculo que suena.
  await irAlPaso(4)
  await page.locator('[data-casilla="A"]').dispatchEvent('pointerdown')
  await espera(400)
  const centro = await page.locator('[data-circulo]').textContent()
  comprobar(r, 'círculo: La elegida', (await page.locator('[data-casilla="A"]').getAttribute('data-estado')) === 'elegida')
  comprobar(r, 'círculo: centro «La mayor 3♯»', /La mayor/.test(centro) && /3♯/.test(centro), centro)
  comprobar(r, 'círculo: sin anillo de menores', (await page.locator('[data-casilla="Am"]').count()) === 0)
  await foto('circulo-la')

  // Paso 8: Encuentra en el círculo — acierto (Re, 2♯) y fallo (Sol en vez de Mi♭).
  await irAlPaso(8)
  comprobar(r, 'elegir: Comprobar apagado', await boton().isDisabled())
  await page.locator('[data-casilla="D"]').dispatchEvent('pointerdown')
  await espera(300)
  await foto('elegir-re')
  await pulsarBoton()
  comprobar(r, 'elegir: Re en verde', (await page.locator('[data-casilla="D"]').getAttribute('data-estado')) === 'bien')
  await foto('elegir-bien')
  await pulsarBoton()
  await page.locator('[data-casilla="G"]').dispatchEvent('pointerdown')
  await espera(200)
  await pulsarBoton()
  comprobar(r, 'elegir: Sol en oro', (await page.locator('[data-casilla="G"]').getAttribute('data-estado')) === 'mal')
  comprobar(r, 'elegir: Mi♭ en verde', (await page.locator('[data-casilla="Eb"]').getAttribute('data-estado')) === 'bien')
  const info8 = await page.locator('[data-tarjeta-info]').textContent()
  comprobar(r, 'elegir: «La respuesta era: Mi♭ mayor»', /Mi♭ mayor/.test(info8), info8)
  await foto('elegir-mal')

  // Paso 10: la relativa por dentro (Mi menor = 1♯), con las armaduras a la vista.
  await irAlPaso(10)
  await page.locator('[data-casilla="G"]').dispatchEvent('pointerdown') // el anillo de fuera no responde
  await espera(200)
  comprobar(r, 'relativa: el anillo de fuera no responde', (await page.locator('[data-casilla="G"]').getAttribute('data-estado')) !== 'elegida')
  await page.locator('[data-casilla="Em"]').dispatchEvent('pointerdown')
  await espera(200)
  await pulsarBoton()
  comprobar(r, 'relativa: Mi menor en verde', (await page.locator('[data-casilla="Em"]').getAttribute('data-estado')) === 'bien')
  await foto('relativa-bien')

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLOS` : 'Todo bien')
process.exit(fallos ? 1 : 0)
