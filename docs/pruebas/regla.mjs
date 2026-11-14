// Prueba la barra de puntitos en REGLA (cuando a 44 px no caben: celular con una ruta o un módulo largo) y la
// rutas en BUCLE (sin tope a los lados: a la izquierda siempre la siguiente, a la derecha siempre la anterior).
//  - 375 px, #/ruta/acordes con el módulo 1 hecho: `data-regla`, la barra a lo ancho, cada puntito de 44 px, el de la
//    centro de lo que se ve en pantalla en el centro (pedido del usuario: con el camino cerrado, la barra sigue a las
//    islas que se ven y sus puntitos se inflan un poco), 4 números de tramo en los huecos.
//  - Tocar un puntito abre su isla y la regla lo lleva al centro. Arrastrar: la tira sigue al dedo en el sentido del
//    arrastre (2 puntitos a la izquierda → 2 más adelante; 1 a la derecha → 1 atrás), un golpe de matraca por puntito
//    que pasa por el centro, al soltar siempre un puntito en el centro; lanzar deprisa suma inercia; pasado el último
//    (o el primero), goma y se queda en el último (o el primero); tocar sin mover no cambia nada.
//  - #/modulo/1 (6 puntitos) y la computadora (1280 px) sin regla.
//  - Bucle: deslizar a la izquierda recorre ritmo → letras → acordes → ritmo… y a la derecha al revés, sin tope.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/regla.mjs [carpeta-de-capturas]
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
const hecha = { paso: 0, completada: true, aciertos: 5, total: 5 }

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (lecciones = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
      },
      [tema, lecciones],
    )
  }
  const pildora = () => page.locator('[data-puntitos] [role=group]').boundingBox()
  /** Distancia (px) del centro del puntito `i` al centro de la barra. */
  const alCentro = async (i) => {
    const b = await pildora()
    const p = await page.locator(`[data-punto="${i}"]`).boundingBox()
    return Math.abs(p.x + p.width / 2 - (b.x + b.width / 2))
  }
  const actual = () => page.$eval('[data-punto][aria-current="true"]', (e) => e.dataset.punto).catch(() => null)

  await preparar({ '1.1': hecha, '1.2': hecha, '1.3': hecha, '1.4': hecha })
  await page.goto(BASE + '#/ruta/acordes')
  await page.reload()
  await espera(2500)
  comprobar(r, 'acordes: barra en regla', (await page.locator('[data-regla]').count()) === 1)
  const b = await pildora()
  comprobar(r, 'regla a lo ancho (343 px)', Math.abs(b.width - 343) < 2, String(b.width))
  const anchos = await page.$$eval('[data-punto]', (ps) => ps.map((p) => Math.round(p.getBoundingClientRect().width)))
  comprobar(r, 'puntitos de 44 px', anchos.every((a) => a === 44), anchos.join(','))
  // Con el camino cerrado, el puntito del centro es uno de los que se ven (inflados).
  const escalas = await page.$$eval('[data-punto] span', (ps) => ps.map((p) => +((p.style.transform.match(/scale\(([\d.]+)/) || [])[1] ?? 0)))
  const distancias = []
  for (let i = 0; i < escalas.length; i++) distancias.push(await alCentro(i))
  const enMedio = distancias.indexOf(Math.min(...distancias))
  comprobar(r, 'el del centro es de una isla que se ve', distancias[enMedio] < 3 && escalas[enMedio] > 0.55, `${enMedio}: ${escalas.join(' ')}`)
  comprobar(r, 'se ven (inflados) 1–4 puntitos', escalas.filter((e) => e > 0.55).length >= 1 && escalas.filter((e) => e > 0.55).length <= 4, escalas.join(' '))
  // Al bajar la página, la regla se corre: el del centro cambia.
  await page.mouse.wheel(0, 900)
  await espera(1200)
  const distancias2 = []
  for (let i = 0; i < escalas.length; i++) distancias2.push(await alCentro(i))
  const enMedio2 = distancias2.indexOf(Math.min(...distancias2))
  comprobar(r, 'al bajar, la regla sigue a lo que se ve', enMedio2 > enMedio, `${enMedio} → ${enMedio2}`)
  await page.mouse.wheel(0, -900)
  await espera(1200)
  const numeros = await page.$$eval('[data-regla] [aria-hidden].font-dato', (ns) => ns.map((n) => n.textContent).join(''))
  comprobar(r, 'números de tramo 1 2 3 4', numeros === '1234', numeros)
  await foto('regla-cerrada')

  // Tocar el puntito a la derecha del centro: abre su isla y la regla lo centra.
  const otro = enMedio + 1
  const p5 = await page.locator(`[data-punto="${otro}"]`).boundingBox()
  await page.touchscreen.tap(p5.x + p5.width / 2, p5.y + p5.height / 2)
  await espera(1400)
  comprobar(r, 'tocar abre el puntito de al lado', (await actual()) === String(otro), await actual())
  comprobar(r, 'tocar lo lleva al centro', (await alCentro(otro)) < 3, String(await alCentro(otro)))
  await foto('regla-tocar')

  // ARRASTRE: la tira sigue al dedo; al soltar, un puntito en el centro.
  const c = await pildora()
  const y = c.y + c.height / 2
  const centro = c.x + c.width / 2
  const ZM = 8 // zona muerta de la barra
  const arrastrar = async (dx, pasos = 12) => {
    await page.mouse.move(centro, y)
    await page.mouse.down()
    for (let k = 1; k <= pasos; k++) {
      await page.mouse.move(centro + ((dx + Math.sign(dx) * ZM) * k) / pasos, y)
      await espera(30)
    }
    await espera(250) // quieto antes de soltar: sin inercia
    await page.mouse.up()
    await espera(1100)
  }
  const n = async () => Number(await actual())
  let antes = await n()
  await arrastrar(-88) // a la izquierda 2 puntitos → los de más adelante llegan al centro
  comprobar(r, 'arrastrar 2 a la izquierda → avanza 2', (await n()) - antes === 2, `${antes} → ${await n()}`)
  comprobar(r, 'al soltar, en el centro', (await alCentro(await n())) < 3, String(await alCentro(await n())))
  antes = await n()
  await arrastrar(44) // a la derecha 1 → retrocede 1
  comprobar(r, 'arrastrar 1 a la derecha → retrocede 1', antes - (await n()) === 1, `${antes} → ${await n()}`)
  antes = await n()
  // Cuenta los golpes de matraca (la barra se empuja de lado y vuelve) mientras recorre: uno por puntito.
  await page.evaluate(() => {
    const barra = document.querySelector('[data-puntitos] [role=group]')
    window.__golpes = 0
    let quieta = true
    const mirar = () => {
      const x = new DOMMatrix(getComputedStyle(barra).transform).m41
      // Umbral bajo: sin GPU, con la isla cambiando, los fotogramas tardan y el golpe se ve más corto.
      if (quieta && Math.abs(x) > 0.25) window.__golpes++
      quieta = Math.abs(x) < 0.05 ? true : Math.abs(x) > 0.25 ? false : quieta
      window.__mirar = requestAnimationFrame(mirar)
    }
    mirar()
  })
  await arrastrar(-132, 36) // 3 puntitos, despacio (un golpe cada ~0,35 s, para poder contarlos)
  const golpes = await page.evaluate(() => (cancelAnimationFrame(window.__mirar), window.__golpes))
  comprobar(r, 'arrastrar 3 → avanza 3', (await n()) - antes === 3, `${antes} → ${await n()}`)
  comprobar(r, 'un golpe de matraca por puntito (3)', golpes === 3, String(golpes))
  // Mientras se arrastra (a medio camino entre dos), la tira está con el dedo; al soltar se acomoda.
  await page.mouse.move(centro, y)
  await page.mouse.down()
  await page.mouse.move(centro - ZM - 20, y, { steps: 4 })
  await espera(300)
  const medio = await page.$$eval('[data-punto]', (ps, cx) => Math.min(...ps.map((p) => Math.abs(p.getBoundingClientRect().left + 22 - cx))), centro)
  comprobar(r, 'con el dedo, la tira sigue al dedo (entre dos puntitos)', medio > 12, String(medio))
  await foto('regla-arrastre')
  await page.mouse.up()
  await espera(1100)
  comprobar(r, 'al soltar, se acomoda con uno en el centro', (await alCentro(await n())) < 3, String(await alCentro(await n())))
  // Lanzar deprisa: la inercia suma puntitos (eventos dentro de la página: los de Playwright llegan con retraso).
  antes = await n()
  await page.evaluate(async ([cx, y]) => {
    const el = document.querySelector('[data-puntitos] [role=group]')
    const ev = (t, x) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true }))
    ev('pointerdown', cx)
    ev('pointermove', cx - 12)
    await new Promise((res) => setTimeout(res, 60))
    ev('pointermove', cx - 70)
    ev('pointerup', cx - 70)
  }, [centro, y])
  await espera(1300)
  comprobar(r, 'lanzar 1,4 puntitos deprisa → avanza 3 o más', (await n()) - antes >= 3, `${antes} → ${await n()}`)
  comprobar(r, 'tras lanzar, en el centro', (await alCentro(await n())) < 3, String(await alCentro(await n())))
  await arrastrar(-1200) // más allá del último: goma
  comprobar(r, 'hasta el final → el último (18)', (await n()) === 18, String(await n()))
  await arrastrar(1200)
  comprobar(r, 'hasta el principio → el primero (0)', (await n()) === 0, String(await n()))
  // Tocar sin mover (en el centro): no cambia.
  antes = await n()
  await page.mouse.move(centro + 3, y)
  await page.mouse.down()
  await espera(400)
  await page.mouse.up()
  await espera(900)
  comprobar(r, 'tocar el del centro no cambia', (await n()) === antes, `${antes} → ${await n()}`)

  // Un módulo corto: sin regla.
  await page.goto(BASE + '#/modulo/1')
  await espera(1800)
  comprobar(r, 'módulo 1 sin regla', (await page.locator('[data-regla]').count()) === 0)

  // Vuelta entre rutas: deslizar la página (camino cerrado) de Acordes a la izquierda → Ritmo.
  const deslizar = async (desde, hasta) => {
    await page.mouse.move(desde, 300)
    await page.mouse.down()
    for (let k = 1; k <= 24; k++) {
      await page.mouse.move(desde + ((hasta - desde) * k) / 24, 300)
      await espera(16)
    }
    await page.mouse.up()
    await espera(1500)
  }
  // Bucle sin tope: a la izquierda siempre la siguiente (… acordes → ritmo → letras → acordes → ritmo) y a la
  // derecha siempre la anterior (… ritmo → acordes → letras → ritmo → acordes).
  await page.goto(BASE + '#/ruta/acordes')
  await espera(2000)
  for (const sig of ['ritmo', 'letras', 'acordes', 'ritmo']) {
    await deslizar(340, 30)
    comprobar(r, `izquierda → ${sig}`, page.url().endsWith(`#/ruta/${sig}`), page.url())
  }
  for (const ant of ['acordes', 'letras', 'ritmo', 'acordes']) {
    await deslizar(30, 340)
    comprobar(r, `derecha → ${ant}`, page.url().endsWith(`#/ruta/${ant}`), page.url())
  }

  comprobar(r, 'sin errores de JS', errores.length === 0, errores.join(' | '))
  await browser.close()
}

// Computadora: caben a 44 px, sin regla.
{
  const r = (resultados.computadora = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } })
  await page.goto(BASE + '#/ruta/acordes')
  await espera(2000)
  comprobar(r, 'acordes sin regla a 1280 px', (await page.locator('[data-regla]').count()) === 0)
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
