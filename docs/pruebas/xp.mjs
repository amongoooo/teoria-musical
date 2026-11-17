// Playwright del sistema de experiencia (XP) y de la flechita ‹ de los módulos abiertos desde Aprender › Módulos.
// 375 px, claro y oscuro: insignia de nivel en Inicio y su hoja (áreas, títulos), «Hoy» con la XP, +XP en el
// vocabulario y el ritmo (píldora, chispa, desglose), fin de partida con la tarjeta de XP, celebración al subir de nivel.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/xp.mjs [carpeta-de-capturas]
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
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Una lección hecha (50 + 5 × 8 = 90) + 198 XP jugados en «general» → 288: nivel 2. `visto` = 2 (no celebra al entrar).
const PROGRESO = { lecciones: { '1.1': { paso: 0, completada: true, aciertos: 8, total: 10 } }, retos: {} }
const XPGUARDADA = (jugada, visto) => ({ dispositivo: 'd-prueba', libro: { 'd-prueba': { [hoy()]: { general: jugada } } }, visto })
// Ritmo con 1 vida para llegar al fin de la partida.
const RITMO = { version: 1, dias: {}, mejorRacha: 0, modos: { seguir: { v: 2, nivel: 1, nivelMax: 1, ventana: [], ajustes: { vidas: 1 } } } }

async function tocar(page, ks, desfases = [0]) {
  return page.evaluate(
    async ({ ks, desfases }) => {
      const R = window.__ritmo
      const { pista, ronda } = R
      const pad = document.querySelector('[data-pad]')
      const lista = ks.flatMap((k) => ronda.patron.map((c) => (k * 4 + c / ronda.porTiempo) * pista.pulso)).map((t, i) => t + desfases[i % desfases.length])
      for (const t of lista) {
        const meta = pista.inicio + t + R.latenciaAudio()
        while (R.tiempoAudio() < meta - 0.02) await new Promise((r) => setTimeout(r, 4))
        while (R.tiempoAudio() < meta) {
          /* espera activa */
        }
        pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', isPrimary: true }))
      }
    },
    { ks, desfases },
  )
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  const foto = (nombre) => carpeta && page.screenshot({ path: `${carpeta}/xp-${nombre}-${tema}.png` })
  await page.addInitScript(
    ({ tema, progreso, xp, ritmo }) => {
      if (sessionStorage.getItem('iniciado')) return
      sessionStorage.setItem('iniciado', '1')
      localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
      localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify(progreso))
      localStorage.setItem('teoria-musical:xp:v1', JSON.stringify(xp))
      localStorage.setItem('teoria-musical:ritmo:v1', JSON.stringify(ritmo))
    },
    { tema, progreso: PROGRESO, xp: XPGUARDADA(198, 2), ritmo: RITMO },
  )

  // Inicio: insignia (nivel 2, Aprendiz) y «Hoy» con la XP de hoy (198 + 90 de la lección de… otro día: solo 198).
  await page.goto(BASE + '#/')
  const insignia = page.locator('[data-insignia-nivel]')
  await insignia.waitFor()
  await espera(800)
  comprobar(r, 'insigniaNivel2', (await insignia.getAttribute('data-insignia-nivel')) === '2' && /Aprendiz/.test(await insignia.innerText()))
  comprobar(r, 'hoyConXP', Number(await page.getAttribute('[data-xp-hoy]', 'data-xp-hoy')) >= 198)
  await foto('1-inicio')
  await insignia.click()
  await page.waitForSelector('[data-panel-nivel]')
  await espera(600)
  comprobar(r, 'hojaAreas', (await page.locator('[data-xp-area="melodia"]').count()) === 1 && (await page.locator('[data-xp-area="general"]').count()) === 1)
  comprobar(r, 'hojaTitulos', (await page.locator('[data-titulo]').count()) === 7 && (await page.getAttribute('[data-titulo="Aprendiz"]', 'data-actual')) === 'true')
  await foto('2-hoja-nivel')
  await page.keyboard.press('Escape')
  await espera(400)

  // Vocabulario: aciertos → píldora y chispa; el desglose en la hoja.
  await page.goto(BASE + '#/letras/vocabulario/significado')
  await page.waitForSelector('[data-xp-sesion]')
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-opcion][data-correcta]').first().click()
    await espera(250)
    if (i === 0) {
      comprobar(r, 'chispa', (await page.locator('[data-chispa-xp]').count()) === 1)
      await foto('3-vocab-chispa')
    }
    await page.locator('[data-barra-accion] button', { hasText: 'Continuar' }).first().click()
    await espera(500)
  }
  const sesion = Number(await page.getAttribute('[data-xp-sesion]', 'data-xp-sesion'))
  comprobar(r, 'vocabSuma', sesion >= 9, String(sesion))
  await page.click('[data-xp-sesion]')
  await page.waitForSelector('[data-desglose-xp]')
  await espera(500)
  comprobar(r, 'desglose', (await page.locator('[data-parte-xp="Aciertos"]').count()) === 1 && (await page.locator('[data-parte-xp="Palabras nuevas"]').count()) === 1)
  await foto('4-vocab-desglose')
  await page.keyboard.press('Escape')
  await espera(300)

  // Celebración al subir de nivel de jugador (se fuerza con el libro).
  await page.evaluate((h) => {
    const x = JSON.parse(localStorage.getItem('teoria-musical:xp:v1'))
    x.libro['d-prueba'][h].general = 420
    localStorage.setItem('teoria-musical:xp:v1', JSON.stringify(x))
  }, hoy())
  // Con 420 en «general» ya pasa de 500 (nivel 3): al recargar, el nivel sube por encima del visto (2) y se celebra.
  await page.reload()
  const celebro = await page.waitForSelector('[data-subio-nivel="3"]', { timeout: 4000 }).then(() => true, () => false)
  comprobar(r, 'celebracion', celebro)
  await espera(500)
  await foto('5-celebracion')

  // Ritmo · Seguir con 1 vida: una ronda buena (+XP), luego una mala → fin de la partida con la tarjeta de XP.
  await page.goto(BASE + '#/ritmo/seguir')
  const empezar = page.locator('[data-barra-accion] button', { hasText: 'Empezar' }).first()
  await empezar.waitFor()
  await empezar.click()
  await page.waitForFunction(() => window.__ritmo?.ronda?.n === 1)
  await tocar(page, [1, 2], [0.01, -0.01])
  await page.waitForSelector('[data-fase="evaluada"]', { timeout: 30000 })
  await espera(500)
  const xpRitmo = Number(await page.getAttribute('[data-xp-sesion]', 'data-xp-sesion'))
  comprobar(r, 'ritmoSuma', xpRitmo >= 7, String(xpRitmo)) // 6 × 1,2 (vidas) + clavado
  await foto('6-ritmo-xp')
  await page.locator('[data-barra-accion] button', { hasText: 'Continuar' }).first().click()
  await page.waitForFunction(() => window.__ritmo?.ronda?.n === 2)
  await tocar(page, [1, 2], [0.2, -0.2])
  await page.waitForSelector('[data-fase="evaluada"]', { timeout: 30000 })
  await espera(400)
  await page.locator('[data-barra-accion] button', { hasText: 'Continuar' }).first().click()
  await page.waitForSelector('[data-fin-partida]')
  await espera(900)
  const tarjeta = page.locator('[data-tarjeta-xp]')
  comprobar(r, 'finConXP', Number(await tarjeta.getAttribute('data-tarjeta-xp')) === xpRitmo)
  await tarjeta.click()
  await page.waitForSelector('[data-fin-partida] [data-desglose-xp]')
  await espera(500)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await espera(300)
  await foto('7-fin-partida')

  // Módulos: desde Aprender › Módulos, flechita ‹ que vuelve ahí; abierto directo, la casita.
  await page.goto(BASE + '#/aprender/modulos')
  await page.locator('[data-cuadrito-modulo="1"]').first().click()
  await page.waitForSelector('[data-volver="#/aprender/modulos"]')
  comprobar(r, 'flechitaModulos', true)
  await espera(700)
  await foto('8-modulo-flechita')
  await page.locator('[data-volver="#/aprender/modulos"]').click()
  await page.waitForFunction(() => location.hash === '#/aprender/modulos')
  comprobar(r, 'vuelveAModulos', true)
  await page.goto(BASE + '#/')
  await page.goto(BASE + '#/modulo/2')
  await espera(800)
  comprobar(r, 'casitaDirecto', (await page.locator('[data-volver]').count()) === 0)

  comprobar(r, 'sinErrores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
process.exit(fallos ? 1 : 0)
