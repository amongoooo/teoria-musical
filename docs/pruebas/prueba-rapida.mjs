// Prueba la PRUEBA RÁPIDA «¿Ya lo sabes?» (content/pruebas/, pages/Prueba.jsx, components/HojaEntrada.jsx):
//  - el banco (con node): 26 lecciones × 3 preguntas, `correcta` dentro de las opciones (o de los sonidos), todas
//    las lecciones con contenido tienen sus 3 preguntas; conteos y esquemas de letras como los da el motor;
//  - a 375 px en claro y oscuro: Inicio → cuadrito del módulo 3 → hoja con «¿Ya lo sabes? · 7 preguntas» → la prueba
//    (azar fijo: la 1.ª pregunta de cada lección): bien, mal, «No lo sé», bien, el círculo (La), bien, bien → 5 de 7;
//    segmentos verde / oro; resultado con 5 marcadas; quitar la 3.7 → «Saltar 4 lecciones» → vuelve al módulo con
//    3.1, 3.4, 3.5 y 3.6 saltadas (✓ en contorno en el camino), la 3.2 abierta y el Círculo abierto en Inicio;
//    la hoja vuelve a salir con 3 preguntas y «Última vez: 5 de 7»;
//  - un módulo ya completo entra directo (sin hoja);
//  - la ruta de acordes: hoja con sus 4 tramos (el 1.º marcado), tocar «Tríadas» cambia el botón a «tramo 3»; esa
//    prueba (2 preguntas) con «No lo sé» → «Mejor empieza por las lecciones» → «Ir a la ruta»;
//  - la pestaña de módulos (dentro de un módulo) también ofrece «¿Ya lo sabes?»;
//  - en el globo de una lección saltada: «Saltada con la prueba» y «Hacerla».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/prueba-rapida.mjs [carpeta-de-capturas]
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

// ——— El banco, con node ———
{
  const r = (resultados.banco = {})
  const { PREGUNTAS } = await import('../../src/content/pruebas/index.js')
  const { leccionDisponible, MODULOS } = await import('../../src/content/index.js')
  const { RUTAS } = await import('../../src/content/rutas.js')
  const ids = [...MODULOS.flatMap((m) => m.lecciones.map((l) => l.id)), ...RUTAS.letras.paradas.filter((p) => p.tipo === 'leccion').map((p) => p.id)].filter(leccionDisponible)
  comprobar(r, 'lecciones con banco', ids.every((id) => PREGUNTAS[id]?.length === 3), ids.filter((id) => PREGUNTAS[id]?.length !== 3).join(','))
  comprobar(r, '26 lecciones', Object.keys(PREGUNTAS).length === 26, Object.keys(PREGUNTAS).length)
  const malas = []
  for (const [id, banco] of Object.entries(PREGUNTAS))
    banco.forEach((p, k) => {
      if (p.tipo === 'circulo') return typeof p.correcta === 'string' || malas.push(`${id}#${k}`)
      const n = p.opciones?.length ?? p.sonidos?.length ?? 0
      if (!(p.correcta >= 0 && p.correcta < n) || !p.explicacion) malas.push(`${id}#${k}`)
    })
  comprobar(r, 'correcta dentro de las opciones', malas.length === 0, malas.join(','))
  const { analizar } = await import('../../src/letras/analisis.js')
  const esquemas = PREGUNTAS.L2.map((p) => analizar(p.letra.texto).estrofas[0].versos.map((v) => v.letra).join(''))
  comprobar(r, 'esquemas de L2 = motor', PREGUNTAS.L2.every((p, i) => p.opciones[p.correcta] === esquemas[i]), esquemas.join(','))
  const silabas = analizar(PREGUNTAS.L3[0].letra.texto).estrofas[0].versos[0].silabas
  comprobar(r, 'sílabas de L3 = motor', String(silabas) === PREGUNTAS.L3[0].opciones[PREGUNTAS.L3[0].correcta], silabas)
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  // Azar fijo: la prueba toma la PRIMERA pregunta del banco de cada lección.
  await page.addInitScript(() => {
    Math.random = () => 0
  })
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
    await page.reload()
    await espera(600)
  }
  const progreso = () => page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:progreso:v1')))
  const boton = () => page.locator('[data-boton-accion] button').first()
  const hoja = () => page.locator('[role="dialog"]')
  const opcion = (i) => page.locator('main button[aria-pressed]').nth(i)
  const comprobarYSeguir = async () => {
    await boton().click()
    await espera(450)
    await boton().click()
    await espera(650)
  }

  // ——— Módulo 3 desde Inicio ———
  await preparar()
  await page.locator('[data-cuadrito-modulo="3"]').click()
  await espera(700)
  const textoHoja = await hoja().textContent()
  comprobar(r, 'hoja del módulo 3', textoHoja.includes('Intervalos y escalas') && textoHoja.includes('¿Ya lo sabes? · 7 preguntas'), textoHoja)
  comprobar(r, 'sigue en Inicio', !page.url().includes('#/modulo'), page.url())
  await foto('1-hoja-modulo')
  await page.locator('[data-ya-lo-sabes]').click()
  await espera(900)
  comprobar(r, 'abre la prueba', page.url().includes('#/prueba/modulo/3'), page.url())
  comprobar(r, '7 segmentos', (await page.locator('[data-segmento]').count()) === 7)

  // 3.1 bien (Semitono)
  await opcion(0).click()
  await espera(200)
  await foto('2-pregunta')
  await boton().click()
  await espera(450)
  comprobar(r, '3.1 bien', (await page.locator('[data-tarjeta-info]').textContent()).includes('¡Correcto!'))
  await boton().click()
  await espera(650)
  // 3.2 mal (3.ª mayor; era la 3.ª menor)
  await opcion(1).click()
  await comprobarYSeguir()
  // 3.3 «No lo sé»
  await page.locator('[data-no-lo-se]').click()
  await espera(450)
  comprobar(r, 'No lo sé enseña la respuesta', (await page.locator('[data-tarjeta-info]').textContent()).includes('La respuesta era'))
  await foto('3-no-lo-se')
  await boton().click()
  await espera(650)
  // 3.4 bien (Re menor)
  await opcion(0).click()
  await comprobarYSeguir()
  // 3.5 círculo: La mayor
  await page.locator('[data-casilla="A"]').click()
  await espera(250)
  await boton().click()
  await espera(450)
  comprobar(r, '3.5 círculo bien', (await page.locator('[data-tarjeta-info]').textContent()).includes('¡Correcto!'))
  await boton().click()
  await espera(650)
  // 3.6 bien, 3.7 bien (armónica)
  await opcion(0).click()
  await comprobarYSeguir()
  const segmentos = await page.locator('[data-segmento]').evaluateAll((s) => s.map((x) => x.dataset.segmento).join(','))
  comprobar(r, 'segmentos verde y oro', segmentos === 'bien,fijate,fijate,bien,bien,bien,actual', segmentos)
  await opcion(1).click()
  await comprobarYSeguir()

  await page.waitForSelector('[data-resultado-prueba]')
  await espera(500)
  const res = await page.locator('[data-resultado-prueba]').textContent()
  comprobar(r, 'resultado 5 de 7', res.includes('5 de 7') && res.includes('Puedes saltar 5 lecciones'), res.slice(0, 120))
  await foto('4-resultado')
  await page.locator('[data-fila-prueba="3.7"]').click()
  await espera(300)
  comprobar(r, 'quitar una fila', (await page.locator('[data-saltar]').textContent()).includes('Saltar 4 lecciones'))
  await page.locator('[data-saltar]').click()
  await espera(1200)
  comprobar(r, 'vuelve al módulo', page.url().includes('#/modulo/3'), page.url())
  const p = await progreso()
  const saltadas = Object.entries(p.lecciones).filter(([, l]) => l.saltada).map(([id]) => id).sort().join(',')
  comprobar(r, 'saltadas guardadas', saltadas === '3.1,3.4,3.5,3.6', saltadas)
  comprobar(r, 'resultado guardado', p.pruebas?.M3?.aciertos === 5 && p.pruebas.M3.total === 7, JSON.stringify(p.pruebas))
  comprobar(r, '✓ en contorno en el camino', (await page.locator('[data-marca="saltada"]').count()) >= 4, await page.locator('[data-marca="saltada"]').count())
  await foto('5-camino')

  // Globo de una saltada: «Saltada con la prueba» y «Hacerla».
  await page.locator('button[aria-label^="Lección 3.1"]').first().click()
  await espera(900)
  const globo = await page.locator('[role="group"][aria-label^="Lección 3.1"]').textContent()
  comprobar(r, 'globo de la saltada', globo.includes('Saltada con la prueba') && globo.includes('Hacerla'), globo)
  await foto('6-globo-saltada')

  // De vuelta en Inicio: el Círculo se abrió (3.5 saltada) y la hoja ofrece 3 preguntas con «Última vez».
  await page.goto(BASE + '#/')
  await espera(800)
  comprobar(r, 'Círculo abierto', (await page.locator('[data-tarjeta-circulo="abierta"]').count()) === 1)
  await page.locator('[data-cuadrito-modulo="3"]').click()
  await espera(700)
  const textoHoja2 = await hoja().textContent()
  comprobar(r, 'hoja otra vez', textoHoja2.includes('· 3 preguntas') && textoHoja2.includes('Última vez: 5 de 7') && textoHoja2.includes('Seguir'), textoHoja2)
  await page.locator('[data-entrar]').click()
  await espera(900)
  comprobar(r, 'Seguir entra al módulo', page.url().includes('#/modulo/3'), page.url())

  // ——— Un módulo completo entra directo ———
  await preparar({ 1.1: { completada: true }, 1.2: { completada: true }, 1.3: { completada: true }, 1.4: { completada: true } })
  await page.locator('[data-cuadrito-modulo="1"]').click()
  await espera(900)
  comprobar(r, 'módulo completo entra directo', page.url().includes('#/modulo/1') && (await hoja().count()) === 0, page.url())

  // ——— Ruta de acordes ———
  await preparar()
  await page.locator('[data-cuadrito-ruta="acordes"]').click()
  await espera(700)
  const marcado = await page.locator('[data-tramo-hoja][data-marcado]').getAttribute('data-tramo-hoja')
  comprobar(r, 'hoja de la ruta con 4 tramos', (await page.locator('[data-tramo-hoja]').count()) === 4 && marcado === 'notas-teclado', marcado)
  await page.locator('[data-tramo-hoja="triadas"]').click()
  await espera(300)
  comprobar(r, 'tocar un tramo lo marca', (await page.locator('[data-ya-lo-sabes]').textContent()).includes('tramo 3'))
  await foto('7-hoja-ruta')
  await page.locator('[data-ya-lo-sabes]').click()
  await espera(900)
  comprobar(r, 'prueba del tramo', page.url().includes('#/prueba/ruta/acordes/triadas') && (await page.locator('[data-segmento]').count()) === 2, page.url())
  for (let i = 0; i < 2; i++) {
    await page.locator('[data-no-lo-se]').click()
    await espera(400)
    await boton().click()
    await espera(650)
  }
  const res2 = await page.locator('[data-resultado-prueba]').textContent()
  comprobar(r, 'sin aciertos', res2.includes('Mejor empieza por las lecciones') && res2.includes('Ir a la ruta'), res2.slice(0, 100))
  await page.getByText('Ir a la ruta').click()
  await espera(1000)
  comprobar(r, 'vuelve a la ruta', page.url().includes('#/ruta/acordes'), page.url())

  // ——— Pestaña de módulos dentro de un módulo ———
  await page.goto(BASE + '#/modulo/4')
  await espera(1000)
  await page.locator('button[aria-label^="Módulo 4"]').first().click()
  await espera(900)
  await page.getByText('Ver todos los módulos').click()
  await espera(900)
  const pestana = (await hoja().count()) ? await hoja().textContent() : ''
  comprobar(r, 'pestaña de módulos con ¿Ya lo sabes?', pestana.includes('¿Ya lo sabes?'), pestana.slice(0, 80))
  await foto('8-pestana')

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLOS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
