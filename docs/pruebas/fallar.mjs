// «Ahora sí se puede fallar» (lección 3.1) a 375 px en claro y oscuro:
//  - pista del paso (botón de bombilla junto a la etiqueta) en «Un paso desde una nota»;
//  - las frases de cada ronda NO se amontonan;
//  - nota equivocada: en la barra solo «Esa es Fa4.» (plegable: se abre al tocarla, se cierra al tocar fuera);
//  - segundo fallo: la nota buscada en rojo (recuadro y tecla), aviso rojo, «Continuar»;
//  - «Escucha y elige» de 3 opciones: el 1.er error tacha la opción en oro; el 2.º enseña la correcta en rojo;
//    con 2 opciones, un solo intento;
//  - repaso del final: la pregunta en rojo vuelve con la cabecera «Repaso» y la pantalla final dice «Repaso: 1 de 1».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/fallar.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const leccion = (await import('../../src/content/modulo-03/leccion-3-1.js')).default

const BASE = process.env.BASE || 'http://localhost:5199/teoria-musical/'
const carpeta = process.argv[2] || null
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
let fallos = 0
const comprobar = (nombre, ok, detalle = '') => {
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${nombre}${ok ? '' : ` ${detalle}`}`)
  if (!ok) fallos++
}

for (const tema of ['claro', 'oscuro']) {
  console.log(`— ${tema}`)
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/fallar-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const abrir = async (n, extra = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n, extra]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { 3.1: { paso: n, ...extra } }, retos: {} }))
      },
      [tema, n, extra],
    )
    await page.goto(BASE + '#/leccion/3.1/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const toca = async (n) => {
    const b = await page.locator(`[data-note="${n}"]`).first().boundingBox()
    await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.85)
    await espera(400)
  }
  const feedback = () => page.locator('[data-feedback]').first()

  // Paso 2 (P5): pista, rondas sin amontonarse, plegable y rojo al 2.º fallo.
  await abrir(2)
  comprobar('sin pista al entrar', (await page.locator('[data-pista]').count()) === 0)
  await page.locator('[data-boton-pista]').click()
  await espera(300)
  const pista = await page.locator('[data-pista]').textContent()
  comprobar('pista: se despliega', /Sube = a la derecha/.test(pista), pista)
  await foto('pista')
  await page.locator('[data-boton-pista]').click()
  await espera(300)
  comprobar('pista: se recoge', (await page.locator('[data-pista]').count()) === 0)

  await toca('D4') // Do4 + un tono = Re4
  await boton().click()
  await espera(600)
  const frases = await page.locator('main p.text-xl').allTextContents()
  comprobar('una sola frase por ronda', frases.length === 1 && /Mi4/.test(frases[0]), JSON.stringify(frases))

  await toca('G4') // ronda 2: Mi4 + semitono = Fa4 → Sol4 está mal
  comprobar('1.er fallo: aviso oro', (await feedback().getAttribute('data-feedback')) === 'mal')
  const titulo = await feedback().locator('p').first().innerText()
  comprobar('1.er fallo: solo «Esa es Sol4.»', /^Esa es Sol4\.$/.test(titulo.trim()), titulo)
  comprobar('plegable cerrado', (await feedback().getAttribute('data-plegable')) === 'cerrada')
  await feedback().locator('button').click()
  await espera(300)
  comprobar('plegable: se abre al tocarlo', (await feedback().getAttribute('data-plegable')) === 'abierta' && /semitono/.test(await feedback().innerText()))
  await foto('plegable')
  await page.mouse.click(180, 120)
  await espera(300)
  comprobar('plegable: se cierra al tocar fuera', (await feedback().getAttribute('data-plegable')) === 'cerrada')
  comprobar('aún no se puede seguir', (await boton().isDisabled()))

  await toca('A4')
  comprobar('2.º fallo: aviso rojo', (await feedback().getAttribute('data-feedback')) === 'error')
  comprobar('2.º fallo: «Era Fa4.»', /Era Fa4/.test(await feedback().textContent()))
  comprobar('2.º fallo: recuadro en rojo', (await page.locator('[data-casilla="mal"]').count()) === 1)
  comprobar('2.º fallo: tecla en rojo', (await page.locator('[data-note="F4"][data-estado="mal"]').count()) === 1)
  comprobar('2.º fallo: se puede seguir', !(await boton().isDisabled()))
  await foto('rojo-piano')
  const guardadas = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:progreso:v1')).lecciones['3.1'].falladas)
  comprobar('se guarda para el repaso', JSON.stringify(guardadas) === '[[2,1]]', JSON.stringify(guardadas))

  // Paso 6 («¿Cuánto se movió?», 3 opciones): oro y luego rojo. Se eligen las que NO son la respuesta.
  const r6 = leccion.pasos[6].rondas[0]
  const buena = r6.opciones[r6.correcta].replace(/\*/g, '')
  await abrir(6)
  const malas = page.locator('main button[aria-pressed]', { hasNotText: buena })
  await malas.nth(0).click()
  await espera(150)
  await boton().click()
  await espera(500)
  comprobar('elegir: 1.er error en oro', (await feedback().getAttribute('data-feedback')) === 'mal')
  comprobar('elegir: la elegida queda tachada', (await page.locator('main [data-estado="descartada"]').count()) === 1)
  await page.locator('main button[aria-pressed]:not([disabled])', { hasNotText: buena }).first().click()
  await espera(150)
  await boton().click()
  await espera(500)
  comprobar('elegir: 2.º error en rojo', (await feedback().getAttribute('data-feedback')) === 'error')
  comprobar('elegir: la correcta en rojo', (await page.locator('main [data-estado="rojo"]', { hasText: buena }).count()) === 1)
  await foto('rojo-elegir')

  // Paso 8 (2 opciones): un solo intento.
  await abrir(8)
  await page.locator('main button[aria-pressed]').first().click()
  await espera(150)
  await boton().click()
  await espera(500)
  const fb8 = await feedback().getAttribute('data-feedback')
  comprobar('2 opciones: bien o rojo al primero', fb8 === 'bien' || fb8 === 'error', fb8)

  // Repaso: último paso con una pregunta en rojo guardada.
  await abrir(15, { falladas: [[2, 0]] })
  await boton().click()
  await espera(800)
  comprobar('repaso: cabecera «Repaso»', (await page.locator('[data-cabecera-repaso]').count()) === 1)
  comprobar('repaso: etiqueta', (await page.locator('[data-etiqueta-repaso]').count()) === 1)
  const fraseRepaso = await page.locator('main p.text-xl').first().textContent()
  comprobar('repaso: la misma ronda (Do4)', /Sube un tono desde Do4/.test(fraseRepaso), fraseRepaso)
  await foto('repaso')
  await toca('D4')
  await boton().click()
  await espera(900)
  const final = await page.locator('[data-resultado-repaso]').textContent()
  comprobar('final: «Repaso: 1 de 1»', /Repaso: 1 de 1/.test(final), final)
  const completada = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:progreso:v1')).lecciones['3.1'])
  comprobar('completada y sin falladas', completada.completada === true && !completada.falladas, JSON.stringify(completada))
  await foto('final')

  comprobar('sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}
console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien')
process.exit(fallos ? 1 : 0)
