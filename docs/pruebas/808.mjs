// Prueba la P1.4 «El 808: el bombo que canta» (propuesta aprobada: https://claude.ai/artifact/XMnFwLjZLG7f8GjQUdnF4d) a
// 375 px en claro y oscuro:
//  - node: con808 (808 con `inst`, slide, acordes, varios compases), fondoRoll, notasRoll808, eventosSonido pasa el 808;
//    reggaetón y phonk se abren con la 12.4 (sin dominar al padre) y llevan su 808 (el del phonk, saturado y con
//    slide); el cencerro del phonk; catálogo, banco y 17 pasos;
//  - audio (con DEV=http://localhost:5198/teoria-musical/ de `npx vite --port 5198`): el 808 suena con su nota, el
//    slide desliza el tono y el largo de la nota corta la cola (Tone.Offline);
//  - los 17 pasos se ven, sin errores ni scroll de lado;
//  - paso 4: dibujar el 808 con cada bombo (fila del bombo arriba) → «¡Perfecto!»;
//  - paso 6: la cola que pisa el bombo, tachada en oro; recortarla la quita → «¡Perfecto!»;
//  - paso 8 (dictado): «Escuchar el original», 1.er error «Casi», 2.º la solución;
//  - paso 9: el roll de lectura con el triangulito y la rampa del glide;
//  - paso 11: sin slide «le falta el glide»; con el pincel Slide → «¡Perfecto!»;
//  - paso 15 (libre): pide 4 notas y un glide;
//  - árbol: con la 12.4, reggaetón y phonk abiertos (sin ella, cerrados); Prográmalo del phonk con la fila del cencerro;
//  - Caja de ritmos con la fila del cencerro.
// Uso: npm run build && npx vite preview --port 5199   y   node docs/pruebas/808.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

const BASE = process.env.BASE || 'http://localhost:5199/teoria-musical/'
const DEV = process.env.DEV || null
const carpeta = process.argv[2] || null
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const resultados = {}
let fallos = 0
const comprobar = (r, nombre, ok, detalle = '') => {
  r[nombre] = ok ? 'ok' : `FALLA ${detalle}`
  if (!ok) fallos++
}
const PASOS = 17

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const R = await import('../../src/theory/rack.js')
  const s = R.con808(R.GENEROS.trap.patron, [{ nota: 'A2', paso: 0, pasos: 7 }, { nota: 'C3', paso: 11, pasos: 5, slide: true }], {
    acordes: [{ notas: ['A3', 'C4', 'E4'], paso: 0, pasos: 16 }],
  })
  const b8 = s.groove.filter((e) => e.inst === '808')
  comprobar(r, 'con808: dos notas de 808, la última con slide', b8.length === 2 && b8[1].slide === true && !b8[0].slide && b8[0].duracion === 7)
  comprobar(r, 'con808: el acorde y el beat', s.groove.some((e) => Array.isArray(e.nota)) && s.groove.filter((e) => e.nota === 'kick').length === 3 && s.porTiempo === 4 && s.tiempos === 4)
  const largo = R.con808({ kick: [0] }, [0, 1, 2, 3].map((i) => ({ nota: 'A2', paso: i * 16, pasos: 16 })), { vueltas: 1 })
  comprobar(r, 'con808: 4 compases repiten el beat', largo.tiempos === 16 && largo.groove.filter((e) => e.nota === 'kick').map((e) => e.inicio).join() === '0,16,32,48')
  const f = R.fondoRoll(R.GENEROS.trap.patron, { compases: 2, porTiempo: 1 })
  comprobar(r, 'fondoRoll: en casillas del roll', f.filter((e) => e.nota === 'kick').map((e) => e.inicio).join() === '0,1.75,2.75,4,5.75,6.75')
  comprobar(r, 'notasRoll808', JSON.stringify(R.notasRoll808([{ nota: 'C3', paso: 11, pasos: 5, slide: true }])) === '[{"nota":"C3","inicio":11,"duracion":5,"slide":true}]')
  const { eventosSonido } = await import('../../src/audio/sonido.js').catch(() => ({}))
  if (eventosSonido) {
    const ev = eventosSonido(s).filter((e) => e.inst === '808')
    comprobar(r, 'eventosSonido pasa el 808 y el slide', ev.length === 4 && ev.some((e) => e.slide))
  }
  const ph = R.sonidoGenero('phonk').groove.filter((e) => e.inst === '808')
  comprobar(r, 'phonk: 808 saturado con slide', ph.length === 3 && ph.every((e) => e.saturado) && ph.some((e) => e.slide))
  comprobar(r, 'phonk: cencerro', R.GENEROS.phonk.patron.cencerro?.length === 5 && !R.GENEROS.phonk.patron.tom && R.FILAS_CAJA.includes('cencerro'))
  comprobar(r, 'reggaetón: 808 que sigue los acordes', new Set(R.GENEROS.reggaeton.bajo808.map((n) => n.nota)).size === 2)
  comprobar(r, 'dembow: sin 808', !R.sonidoGenero('dembow').groove.some((e) => e.inst))

  const G = await import('../../src/theory/generos.js')
  const hecha = { lecciones: { '12.2': { completada: true }, '12.3': { completada: true }, '12.4': { completada: true } } }
  const sin = { lecciones: { '12.2': { completada: true }, '12.3': { completada: true } } }
  for (const id of ['reggaeton', 'phonk']) {
    comprobar(r, `${id}: abierto con la 12.4 (sin dominar al padre)`, G.estadoGenero(id, { domina: () => false, progreso: hecha }) === 'abierto')
    comprobar(r, `${id}: cerrado sin la 12.4 aunque domines al padre`, G.estadoGenero(id, { domina: (x) => x === 'trap' || x === 'dembow', progreso: sin }) === 'bloqueado')
  }
  comprobar(r, 'ya ningún género espera una lección aparte', Object.values(R.GENEROS).every((g) => !g.leccion))

  const { CATALOGO } = await import('../../src/content/catalogo.js')
  comprobar(r, 'catálogo: 12.4 ← 12.3 y 5.4', CATALOGO['12.4']?.requiere.join() === '12.3,5.4' && CATALOGO['12.4'].areas.join() === 'produccion,armonia')
  const banco = (await import('../../src/content/pruebas/modulo-12.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 12.4', banco['12.4']?.length === 3)
  const leccion = (await import('../../src/content/modulo-12/leccion-12-4.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const idx = await import('../../src/content/index.js').catch(() => null)
  if (idx) comprobar(r, 'código P1.4 y ya no «Próximamente»', idx.codigoLeccion('12.4') === 'P1.4' && idx.estadoLeccion('12.4', { lecciones: {} }) !== 'proximamente')
}

// ——— Audio (Tone.Offline en el servidor de desarrollo) ———
if (DEV) {
  const r = (resultados.audio = {})
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(DEV)
  const m = await page.evaluate(async () => {
    // El mismo Tone que usa bateria.js (Vite le pone ?v=…: otra URL sería otra copia, con otro contexto de audio).
    const fuente = await (await fetch('/teoria-musical/src/audio/bateria.js')).text()
    const Tone = await import(fuente.match(/from\s+["']([^"']*deps\/tone\.js[^"']*)["']/)[1])
    const { nota808 } = await import('/teoria-musical/src/audio/bateria.js')
    const buf = await Tone.Offline(() => {
      nota808('A2', 0, 0.6, 0.9)
      nota808('E3', 0.6, 0.6, 0.9, { slide: true })
    }, 1.6)
    const d = buf.getChannelData(0)
    const sr = buf.sampleRate
    // Frecuencia por cruces por cero en una ventana.
    const hz = (a, b) => {
      let c = 0
      for (let i = Math.floor(a * sr) + 1; i < b * sr; i++) if (d[i - 1] < 0 && d[i] >= 0) c++
      return c / (b - a)
    }
    const rms = (a, b) => {
      let s = 0
      const n = Math.floor((b - a) * sr)
      for (let i = 0; i < n; i++) s += d[Math.floor(a * sr) + i] ** 2
      return Math.sqrt(s / n)
    }
    return { la: hz(0.15, 0.55), mi: hz(0.85, 1.15), fuerte: rms(0.1, 0.5), despues: rms(1.3, 1.55), slide: rms(0.62, 0.7) }
  })
  comprobar(r, 'el 808 suena en La2 (~110 Hz)', Math.abs(m.la - 110) < 6, JSON.stringify(m))
  comprobar(r, 'el slide llega a Mi3 (~165 Hz)', Math.abs(m.mi - 164.8) < 8, JSON.stringify(m))
  comprobar(r, 'el slide no se calla al deslizar', m.slide > m.fuerte * 0.3, JSON.stringify(m))
  comprobar(r, 'el largo de la nota corta la cola', m.despues < m.fuerte * 0.02, JSON.stringify(m))
  await browser.close()
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (progreso, ruta, extra = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, progreso, extra]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify(progreso))
        for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, JSON.stringify(v))
      },
      [tema, progreso, extra],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(700)
  }
  const irAlPaso = async (n) => {
    await preparar({ lecciones: { '12.4': { paso: n } }, retos: {} }, '#/leccion/12.4/guiada')
    await page.waitForSelector('[data-boton-accion]')
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  // Filas del roll del 808 (Mi2–Do3, de arriba abajo).
  const FILAS = ['C3', 'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2']
  const punto = async (col, nota, columnas = 16) => {
    const b = await page.locator('[data-rejilla]').boundingBox()
    return { x: b.x + ((col + 0.5) / columnas) * b.width, y: b.y + ((FILAS.indexOf(nota) + 0.5) / FILAS.length) * b.height }
  }
  /** Dibuja una nota: toca en `desde` y arrastra hasta `hasta` (columnas). */
  const dibujar = async (nota, desde, hasta = desde, columnas = 16) => {
    const a = await punto(desde, nota, columnas)
    const z = await punto(hasta, nota, columnas)
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    if (hasta !== desde) await page.mouse.move(z.x, z.y, { steps: 6 })
    await page.mouse.up()
    await espera(120)
  }
  const tocar = async (nota, col, columnas = 16) => {
    const a = await punto(col, nota, columnas)
    await page.mouse.click(a.x, a.y)
    await espera(120)
  }

  // ——— Los 17 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`12.4-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 0: los sonidos se tocan sin errores ———
  await irAlPaso(0)
  for (const t of ['El bombo', 'El 808', 'Los dos juntos']) {
    await page.getByText(t, { exact: true }).first().click()
    await espera(300)
  }

  // ——— Paso 4: tu primer 808 ———
  await irAlPaso(4)
  comprobar(r, 'primer 808: fila del bombo con 3 golpes', (await page.locator('[data-bombo] [data-golpe-bombo]').count()) === 3)
  await dibujar('A2', 0, 6)
  await dibujar('A2', 7, 10)
  await dibujar('A2', 11, 15)
  comprobar(r, 'primer 808: 3 notas sin choques', (await page.locator('[data-rejilla] [data-nota]').count()) === 3 && (await page.locator('[data-choque]').count()) === 0)
  await page.getByText('Reproducir').first().click()
  await espera(500)
  await foto('12.4-primer-808')
  await boton().click()
  await espera(400)
  comprobar(r, 'primer 808: ¡Perfecto!', /Perfecto/.test(await info()), await info())

  // ——— Paso 6: que respire ———
  await irAlPaso(6)
  comprobar(r, 'respire: la cola que pisa el bombo, en oro', (await page.locator('[data-choque="7"]').count()) === 1)
  await foto('12.4-respire-oro')
  const a = await punto(9, 'A2')
  const z = await punto(6, 'A2')
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(z.x, z.y, { steps: 6 })
  await page.mouse.up()
  await espera(200)
  comprobar(r, 'respire: recortada, sin oro', (await page.locator('[data-choque]').count()) === 0 && (await page.locator('[data-rejilla] [data-nota]').count()) === 2)
  await boton().click()
  await espera(400)
  comprobar(r, 'respire: ¡Perfecto!', /Perfecto/.test(await info()), await info())

  // ——— Paso 8: dictado ———
  await irAlPaso(8)
  comprobar(r, 'dictado: Escuchar el original', (await page.getByText('Escuchar el original').count()) >= 1)
  comprobar(r, 'dictado: bombo en el 1 de cada compás', (await page.locator('[data-bombo] [data-golpe-bombo]').count()) === 4)
  await dibujar('A2', 0, 3)
  await boton().click()
  await espera(400)
  comprobar(r, 'dictado: 1.er error «Casi»', /Casi/.test(await info()), await info())
  await dibujar('F2', 4, 7)
  await boton().click()
  await espera(400)
  comprobar(r, 'dictado: 2.º error → la solución (4 notas)', /Así queda/.test(await info()) && (await page.locator('[data-rejilla] [data-nota]').count()) === 4, await info())
  await foto('12.4-dictado-solucion')

  // ——— Paso 9: el glide en el roll ———
  await irAlPaso(9)
  comprobar(r, 'glide: triangulito y rampa', (await page.locator('[data-slide]').count()) === 1 && (await page.locator('[data-rampas="1"]').count()) === 1)

  // ——— Paso 11: haz un glide ———
  await irAlPaso(11)
  comprobar(r, 'haz un glide: pincel Nota · Slide', (await page.locator('[data-pincel-roll] [data-pincel]').count()) === 2)
  await boton().click()
  await espera(400)
  comprobar(r, 'haz un glide: sin slide, «le falta el glide»', /glide/.test(await info()), await info())
  await page.locator('[data-pincel="slide"]').click()
  await tocar('C3', 13)
  comprobar(r, 'haz un glide: la nota queda marcada (no se borra)', (await page.locator('[data-slide]').count()) === 1 && (await page.locator('[data-rejilla] [data-nota]').count()) === 3)
  await foto('12.4-glide')
  await boton().click()
  await espera(400)
  comprobar(r, 'haz un glide: ¡Perfecto!', /Perfecto/.test(await info()), await info())

  // ——— Paso 15: libre ———
  await irAlPaso(15)
  for (const [nota, c] of [['A2', 0], ['A2', 7], ['G2', 11], ['C3', 14]]) await dibujar(nota, c)
  comprobar(r, 'libre: sin glide no avanza', await boton().isDisabled())
  await page.locator('[data-pincel="slide"]').click()
  await tocar('C3', 14)
  await espera(200)
  comprobar(r, 'libre: con un glide, Continuar', !(await boton().isDisabled()))
  await foto('12.4-libre')

  // ——— Árbol de géneros ———
  const P13 = { '12.1': { completada: true }, '12.2': { completada: true }, '12.3': { completada: true } }
  await preparar({ lecciones: P13, retos: {} }, '#/generos')
  await page.locator('[data-tronco="dembow"]').click()
  await espera(400)
  comprobar(r, 'árbol: sin la 12.4, reggaetón cerrado', (await page.locator('[data-genero="reggaeton"]').getAttribute('data-estado')) === 'bloqueado')
  await page.locator('[data-genero="reggaeton"]').click()
  await espera(300)
  comprobar(r, 'árbol: «Se abre con la P1.4.»', ((await page.locator('[data-aviso-bloqueo]').textContent().catch(() => '')) ?? '').includes('P1.4'))
  const P14 = { ...P13, '12.4': { completada: true } }
  await preparar({ lecciones: P14, retos: {} }, '#/generos')
  await page.locator('[data-tronco="dembow"]').click()
  await espera(400)
  comprobar(r, 'árbol: con la 12.4, reggaetón abierto', (await page.locator('[data-genero="reggaeton"]').getAttribute('data-estado')) === 'abierto')
  await foto('12.4-arbol-dembow')
  await page.locator('[data-tronco="boomBap"]').click()
  await espera(400)
  comprobar(r, 'árbol: con la 12.4, phonk abierto', (await page.locator('[data-genero="phonk"]').getAttribute('data-estado')) === 'abierto')
  await preparar({ lecciones: P14, retos: {} }, '#/generos/phonk/programa')
  comprobar(r, 'árbol: Prográmalo del phonk con la fila del cencerro', (await page.locator('[data-prueba-programa="phonk"]').count()) === 1 && (await page.locator('[data-fila="cencerro"]').count()) === 1)
  await foto('12.4-programa-phonk')

  // ——— Caja de ritmos ———
  await preparar({ lecciones: P14, retos: {} }, '#/caja')
  comprobar(r, 'Caja: fila del cencerro', (await page.locator('[data-fila="cencerro"]').count()) === 1)
  comprobar(r, 'Caja: sin scroll de lado', (await page.evaluate(() => document.documentElement.scrollWidth)) <= 376)
  await foto('12.4-caja')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
