// Prueba LO QUE SUENA, A LA VISTA (components/VerSonido.jsx + BotonSonido con `ver`), un sonido a la vez
// (engine.js → `programar`) y la BARRA DE «TOCA AL PULSO» (Medidor con puntito que barre y cuadrito de la desviación):
//  - 2.2 paso 11 (trap): dos tarjetas con metrónomo «140 BPM» y 4 pads (Bombo, Caja, Palmas, Hi-hat); al sonar, el
//    pad de la Caja se ilumina y un puntito del metrónomo se enciende; tocar el segundo sonido apaga el primero;
//  - 3.3 paso 2 (escala): teclado con las notas marcadas; al sonar se encienden teclas y abajo sale su nombre;
//  - 1.1 paso 4: la onda de 440 Hz;
//  - en una pregunta (3.3 paso 1, «Escucha y elige») no sale nada de esto;
//  - 2.1 paso 2 (Toca al pulso): tras Empezar, el puntito celeste barre la barra; tras los toques, el cuadrito de la
//    desviación media sale dentro de la barra y el mensaje de abajo ya no dice los ms.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/ver-sonido.mjs [carpeta-de-capturas]
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

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  const abrir = async (id, paso) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, id, paso]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { [id]: { paso } }, retos: {} }))
      },
      [tema, id, paso],
    )
    await page.goto(BASE + `#/leccion/${id}/guiada`)
    await page.reload()
    await espera(900)
  }
  const tarjetas = () => page.locator('[data-boton-sonido-ver]')

  // Trap: metrónomo y pads
  await abrir('2.2', 10)
  comprobar(r, 'trap: 2 tarjetas', (await tarjetas().count()) === 2)
  comprobar(r, 'trap: metrónomo 140', (await page.locator('[data-metronomo="140"]').count()) === 2)
  const pads = await tarjetas().first().locator('[data-pad-sonido]').evaluateAll((els) => els.map((e) => e.dataset.padSonido).join(','))
  comprobar(r, 'trap: pads', pads === 'kick,snare,clap,hat', pads)
  await tarjetas().first().locator('button').first().click()
  await espera(1500)
  const caja = Number(await tarjetas().first().locator('[data-pad-sonido="snare"]').getAttribute('data-golpes'))
  comprobar(r, 'trap: la caja se ilumina', caja >= 1, caja)
  comprobar(r, 'trap: metrónomo encendido', (await tarjetas().first().locator('[data-pulso][data-encendido]').count()) === 1)
  await foto('ver-trap')
  await tarjetas().nth(1).locator('button').first().click()
  await espera(300)
  comprobar(r, 'un sonido a la vez', (await page.locator('[data-sonando]').count()) === 1 && (await tarjetas().nth(1).locator('[data-sonando]').count()) === 1)

  // Escala: teclado
  await abrir('3.3', 1)
  comprobar(r, 'escala: notas marcadas', (await tarjetas().first().locator('[data-tecla-sonido] span').count()) === 8)
  await tarjetas().first().locator('button').first().click()
  await espera(1200)
  comprobar(r, 'escala: teclas encendidas', (await tarjetas().first().locator('[data-tecla-sonido][data-encendida]').count()) >= 1)
  comprobar(r, 'escala: nombre abajo', ((await tarjetas().first().locator('[data-nombres-sonido]').textContent()) ?? '').length > 0)
  await foto('ver-escala')

  // Frecuencia: onda
  await abrir('1.1', 3)
  comprobar(r, '440 Hz: onda', (await page.locator('[data-onda="440"]').count()) === 1)

  // Pregunta: nada a la vista
  await abrir('3.3', 0)
  comprobar(r, 'pregunta: sin vista', (await tarjetas().count()) === 0 && (await page.locator('[data-ver-sonido]').count()) === 0)

  // Toca al pulso: barrido y cuadrito
  await abrir('2.1', 1)
  await page.getByRole('button', { name: 'Empezar', exact: true }).click()
  await espera(600)
  const barrido = await page.locator('[data-barrido]').evaluate((el) => Number(el.style.opacity) > 0 || el.style.left !== '0%')
  comprobar(r, 'pulso: el puntito barre', barrido)
  await page.evaluate(async () => {
    const pad = document.querySelector('[data-pad-goma]')
    for (let i = 0; i < 14; i++) {
      pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      await new Promise((res) => setTimeout(res, 60000 / 90))
    }
  })
  await espera(400)
  comprobar(r, 'pulso: cuadrito de la media', (await page.locator('[data-media]').count()) === 1)
  const fb = (await page.locator('[data-tarjeta-info]').textContent().catch(() => '')) ?? ''
  comprobar(r, 'pulso: el mensaje no dice los ms', fb.includes('¡Tienes pulso!') && !/ms/.test(fb), fb)
  await foto('pulso-media')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await page.close()
}
await browser.close()
console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO OK')
process.exit(fallos ? 1 : 0)
