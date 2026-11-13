// Prueba el explorador del círculo de quintas (#/circulo) y su tarjetita de Inicio a 375 px en claro y oscuro:
//  - Inicio: sin la 3.5 terminada la tarjetita está bloqueada (no abre nada); con la 3.5 terminada abre el explorador.
//  - Explorador: Do mayor con sus 7 nodos prendidos; dominante → Sol mayor (Fa♯ entra en oro, Fa deja su contorno,
//    la ficha Fa♯ nueva, la línea gira 30°); tocar un nodo (Re), una menor de dentro (Mi menor) y la subdominante
//    (de Do a Fa: Si → Si♭); tocar una tecla prende su nodo en celeste; «Escuchar…» prende teclas y nodos.
//  - Con «reducir movimiento» sigue funcionando. Sin errores en la consola.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/circulo-libre.mjs [carpeta-de-capturas]
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

for (const [tema, reducir] of [['claro', false], ['oscuro', false], ['claro', true]]) {
  const r = (resultados[`${tema}${reducir ? ' (reducir movimiento)' : ''}`] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  if (reducir) await page.emulateMedia({ reducedMotion: 'reduce' })
  const foto = (n, completa = false) => carpeta && !reducir && page.screenshot({ path: `${carpeta}/circulo-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (progreso) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, progreso]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify(progreso))
      },
      [tema, progreso],
    )
    await page.reload()
    await espera(600)
  }

  // 1) Inicio sin la 3.5: bloqueada.
  await preparar({ lecciones: {}, retos: {} })
  const bloqueada = page.locator('[data-tarjeta-circulo="bloqueada"]')
  await bloqueada.scrollIntoViewIfNeeded()
  comprobar(r, 'tarjetita bloqueada sin la 3.5', (await bloqueada.count()) === 1)
  await espera(300)
  await foto('inicio-bloqueada')
  await bloqueada.click()
  await espera(400)
  comprobar(r, 'bloqueada no abre nada', !page.url().includes('#/circulo'), page.url())

  // 2) Con la 3.5 terminada: abierta y lleva al explorador.
  await preparar({ lecciones: { 3.5: { paso: 14, completada: true, aciertos: 10, total: 10 } }, retos: {} })
  const abierta = page.locator('[data-tarjeta-circulo="abierta"]')
  await abierta.scrollIntoViewIfNeeded()
  comprobar(r, 'tarjetita abierta con la 3.5', (await abierta.count()) === 1)
  await espera(300)
  await foto('inicio-abierta')
  await abierta.click()
  await page.waitForSelector('[data-explorador-circulo]')
  await espera(900)
  comprobar(r, 'abre #/circulo', page.url().includes('#/circulo'))

  const estado = (id) => page.getAttribute(`[data-nodo="${id}"]`, 'data-estado')
  const prendidos = () => page.$$eval('[data-nodo]', (ns) => ns.filter((n) => !n.dataset.nodo.endsWith('m') && n.dataset.estado).map((n) => n.dataset.nodo))
  const tecla = (c) => page.getAttribute(`[data-tecla="${c}"]`, 'data-estado')

  // 3) Do mayor: 7 nodos de fuera prendidos (Fa … Si), Do elegida, Lam relativa.
  const p = await prendidos()
  comprobar(r, 'Do mayor: 7 nodos prendidos', p.length === 7 && ['F', 'C', 'G', 'D', 'A', 'E', 'B'].every((n) => p.includes(n)), p.join(' '))
  comprobar(r, 'Do elegida y Lam vecina', (await estado('C')) === 'elegida' && (await estado('Am')) === 'vecina')
  comprobar(r, 'centro «Do mayor»', (await page.textContent('[data-centro]')).includes('Do mayor'))
  comprobar(r, 'sin armadura', (await page.textContent('[data-armadura]')).includes('sin ♯ ni ♭'))
  await foto('do-mayor')

  // 4) A la dominante: Sol mayor; entra Fa♯ (oro), sale Fa.
  await page.click('[data-vecina="dominante"]')
  await espera(250)
  comprobar(r, 'Sol elegida', (await estado('G')) === 'elegida')
  comprobar(r, 'Fa♯ entra en oro en el teclado', (await tecla(6)) === 'nueva', await tecla(6))
  comprobar(r, 'Fa deja su contorno', (await page.locator('[data-tecla="5"] [data-sale]').count()) === 1)
  comprobar(r, 'ficha Fa♯ nueva', (await page.locator('[data-ficha="F#"][data-nueva]').count()) === 1)
  comprobar(r, 'nodo Fa apagado, Fa♯ prendido', (await estado('F')) === '' && (await estado('F#')) === 'nota')
  await espera(reducir ? 100 : 700)
  const giro = await page.getAttribute('[data-linea-encendida]', 'd').then(() => page.$eval('[data-linea-encendida]', (el) => el.parentNode.getAttribute('transform')))
  comprobar(r, 'la línea giró a 30°', /rotate\(30(\.0+)?\)/.test(giro ?? ''), giro)
  await foto('sol-mayor')
  await espera(1500)
  comprobar(r, 'Fa♯ vuelve al color de nota', (await tecla(6)) === 'nota', await tecla(6))

  // 5) Tocar un nodo: Re mayor (2♯).
  await page.click('[data-nodo="D"]')
  await espera(400)
  comprobar(r, 'Re mayor elegida', (await estado('D')) === 'elegida' && (await page.textContent('[data-armadura]')).includes('Do♯'))

  // 6) Una menor de dentro: Mi menor (tónica Mi en el teclado; relativa Sol mayor).
  await page.click('[data-nodo="Em"]')
  await espera(400)
  comprobar(r, 'Mi menor: tónica Mi', (await tecla(4)) === 'tonica' && (await estado('G')) === 'vecina')
  await foto('mi-menor')

  // 7) Subdominante desde Do: Si → Si♭.
  await page.click('[data-nodo="C"]')
  await espera(300)
  const textoSub = await page.textContent('[data-vecina="subdominante"] [data-cambia]')
  comprobar(r, 'subdominante de Do: Si → Si♭', textoSub.includes('Si') && textoSub.includes('Si♭'), textoSub)
  await page.click('[data-vecina="subdominante"]')
  await espera(250)
  comprobar(r, 'Fa mayor: Si♭ en oro', (await tecla(10)) === 'nueva', await tecla(10))

  // 8) Tocar una tecla prende su nodo en celeste.
  await page.locator('[data-tecla="7"]').dispatchEvent('pointerdown')
  await espera(60)
  comprobar(r, 'tecla Sol → nodo Sol celeste', (await page.getAttribute('[data-nodo="G"]', 'data-suena')) === 'true')
  await page.locator('[data-tecla="7"]').dispatchEvent('pointerup')

  // 9) Escuchar la escala: teclas y nodos se prenden mientras suena.
  await espera(500)
  await page.getByRole('button', { name: /Escuchar Fa mayor/ }).click()
  let vistos = new Set()
  for (let i = 0; i < 12; i++) {
    await espera(150)
    for (const n of await page.$$eval('[data-nodo][data-suena]', (ns) => ns.map((n) => n.dataset.nodo))) vistos.add(n)
  }
  comprobar(r, 'la escala prende sus nodos', vistos.size >= 5, [...vistos].join(' '))
  await espera(400)
  await foto('fa-mayor-completa', true)

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
