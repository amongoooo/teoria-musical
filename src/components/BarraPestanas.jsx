import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navegar, rutas } from '../router.js'
import { entradaBarra } from '../ui/barraAbajo.js'
import { RESORTE } from '../ui/movimiento.js'
import { VIDRIO } from '../ui/vidrio.js'
import { MATRACA, flotar, gradosMatraca } from './CaminoLecciones.jsx'

/**
 * BARRA DE PESTAÑAS (fase 3 del rediseño; pedido del usuario: «hecha a partir de la barra de puntitos de las islas»;
 * maqueta aprobada: https://claude.ai/artifact/6EWwNQ4puh3mtiT1T8Pfne, variante «Nombres»).
 * La misma píldora de vidrio que la barra de puntitos, abajo y en el mismo sitio, con las 4 pestañas: Inicio ·
 * Aprender · Practicar · Herramientas, cada una con su nombre y un puntito encima (el de la elegida se alarga).
 *  - La elegida lleva detrás la MARCA: una píldora de superficie que se desliza con resorte.
 *  - ARRASTRAR por la barra cambia de pestaña EN VIVO (como arrastrar por los puntitos abre cada isla): la marca sigue al
 *    dedo con imán (35 % hacia el dedo, 65 % al centro de la pestaña) e inflada; al cruzar a otra pestaña, golpe de
 *    MATRACA (el de la barra de puntitos: inclinación según su lugar × el tirón del dedo, y golpe lateral); la barra
 *    FLOTA con el dedo (flotar()) y al soltar todo vuelve con resorte.
 *  - TOCAR va directo; tocar la pestaña en la que ya estás sube al principio.
 *  - Dentro de un camino (módulo, ruta, bloque) la píldora «se vuelve» la barra de puntitos: esta se desvanece en su
 *    sitio y aquella aparece ahí (ui/barraAbajo.js). En lecciones, entrenadores y pruebas no hay barra.
 *  - Teclado: flechas ← → entre pestañas (tablist con foco itinerante).
 */
export const PESTANAS = [
  { id: 'inicio', nombre: 'Inicio' },
  { id: 'aprender', nombre: 'Aprender' },
  { id: 'practicar', nombre: 'Practicar' },
  { id: 'herramientas', nombre: 'Herramientas' },
]
export const indicePestana = (pagina) => PESTANAS.findIndex((p) => p.id === pagina)

/** Aprender recuerda su última vista (Rutas o Biblioteca) mientras la app esté abierta. */
let vistaAprender = null
const enlace = (id) =>
  id === 'inicio' ? rutas.inicio() : id === 'aprender' ? rutas.aprender(vistaAprender) : id === 'practicar' ? rutas.practicar() : rutas.herramientas()

/** Cuánto se infla la marca mientras el dedo la arrastra (px de más a lo ancho) y cuánto la jala el dedo (imán). */
const INFLA = 10
const IMAN = 0.35

export default function BarraPestanas({ ruta }) {
  const reducir = useReducedMotion()
  const indiceRuta = indicePestana(ruta.pagina)
  if (ruta.pagina === 'aprender') vistaAprender = ruta.id
  const [foco, setFoco] = useState(indiceRuta)
  const focoRef = useRef(foco)
  const arrastre = useRef(null)
  const pista = useRef(null)
  const botones = useRef([])

  const x = useMotionValue(0)
  const ancho = useMotionValue(0)
  const flotaX = useMotionValue(0)
  const flotaY = useMotionValue(0)
  const giro = useMotionValue(0)
  const golpe = useMotionValue(0)
  const listo = useRef(false)

  // La pestaña la manda la ruta (salvo mientras el dedo arrastra: ahí manda el dedo).
  useEffect(() => {
    if (!arrastre.current) cambiarFoco(indiceRuta)
  }, [indiceRuta]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarFoco = (i) => {
    focoRef.current = i
    setFoco(i)
  }
  const medida = (i) => {
    const b = botones.current[i]
    return b ? { x: b.offsetLeft, w: b.offsetWidth, c: b.offsetLeft + b.offsetWidth / 2 } : { x: 0, w: 0, c: 0 }
  }
  /** Lleva la marca a la pestaña `i` (con resorte; la primera vez, sin animar). */
  const asentar = (i, transicion = RESORTE.pulsar) => {
    const m = medida(i)
    if (!listo.current || reducir) {
      x.set(m.x)
      ancho.set(m.w)
      listo.current = m.w > 0
      return
    }
    animate(x, m.x, transicion)
    animate(ancho, m.w, transicion)
  }
  useLayoutEffect(() => {
    if (!arrastre.current) asentar(foco)
  }, [foco]) // eslint-disable-line react-hooks/exhaustive-deps
  // Las medidas cambian al cargar la letra o al girar el teléfono.
  useEffect(() => {
    const el = pista.current
    const ro = new ResizeObserver(() => !arrastre.current && asentar(focoRef.current, { duration: 0 }))
    ro.observe(el)
    document.fonts?.ready.then(() => asentar(focoRef.current, { duration: 0 }))
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tiempoMatraca = useRef(null)
  useEffect(() => () => clearTimeout(tiempoMatraca.current), [])
  /** Golpe de matraca al llegar a la pestaña `i` (como la barra de puntitos). `tiron`: −1 … 1 (dedo por encima/debajo del eje). */
  const matraca = (i, dir, tiron = 0) => {
    if (reducir) return
    clearTimeout(tiempoMatraca.current)
    const grados = gradosMatraca(i, PESTANAS.length) * tiron
    animate(giro, grados, MATRACA.golpe)
    animate(golpe, dir * MATRACA.lateral * (1 - Math.abs(grados) / MATRACA.max), MATRACA.golpe)
    tiempoMatraca.current = setTimeout(() => {
      animate(giro, 0, MATRACA.vuelta)
      animate(golpe, 0, MATRACA.vuelta)
    }, MATRACA.vuelve)
  }

  /** Ir a la pestaña `i` (o, si ya estás en ella, subir al principio). */
  const ir = (i) => {
    if (i === indiceRuta) {
      window.scrollTo({ top: 0, behavior: reducir ? 'auto' : 'smooth' })
      return
    }
    cambiarFoco(i)
    navegar(enlace(PESTANAS[i].id))
  }

  const masCercana = (clientX) => {
    const izq = pista.current.getBoundingClientRect().left
    let mejor = 0
    PESTANAS.forEach((_, i) => {
      if (Math.abs(medida(i).c + izq - clientX) < Math.abs(medida(mejor).c + izq - clientX)) mejor = i
    })
    return mejor
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // (puntero que ya no existe)
    }
    const caja = e.currentTarget.getBoundingClientRect()
    arrastre.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, eje: caja.top + caja.height / 2, movio: false, izq: pista.current.getBoundingClientRect().left }
  }
  const onPointerMove = (e) => {
    const s = arrastre.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (!s.movio && Math.hypot(dx, dy) < 8) return
    s.movio = true
    if (!reducir) {
      flotaX.set(flotar(dx) * 0.4)
      flotaY.set(flotar(dy))
    }
    const i = masCercana(e.clientX)
    if (i !== focoRef.current) {
      const ejeY = s.eje + flotaY.get()
      const d = e.clientY - ejeY
      const tiron = Math.sign(d) * Math.min(1, Math.max(0, (Math.abs(d) - MATRACA.eje) / MATRACA.rango))
      matraca(i, Math.sign(i - focoRef.current), tiron)
      cambiarFoco(i)
      navegar(enlace(PESTANAS[i].id))
    }
    // Imán: la marca va un poco hacia el dedo, pero la jala el centro de su pestaña; mientras tanto, inflada.
    const m = medida(focoRef.current)
    const centro = m.c + (e.clientX - s.izq - m.c) * IMAN
    const w = m.w + INFLA
    // Sin salirse de la píldora (2 px de aire en las orillas).
    const tope = pista.current.clientWidth - w - 2
    animate(x, Math.min(tope, Math.max(2, centro - w / 2)), RESORTE.pulsar)
    animate(ancho, w, RESORTE.pulsar)
  }
  const soltar = (e) => {
    const s = arrastre.current
    if (!s || s.id !== e.pointerId) return
    arrastre.current = null
    animate(flotaX, 0, RESORTE.suave)
    animate(flotaY, 0, RESORTE.suave)
    if (!s.movio && e.type === 'pointerup') {
      const i = masCercana(e.clientX)
      if (i !== focoRef.current) matraca(i, Math.sign(i - focoRef.current))
      ir(i)
    }
    // Al soltar, la marca se acomoda en su pestaña con un pequeño sobrepaso.
    asentar(focoRef.current, RESORTE.rebote)
  }

  const onKeyDown = (e) => {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    const i = Math.min(PESTANAS.length - 1, Math.max(0, focoRef.current + paso))
    if (i === focoRef.current) return
    matraca(i, paso)
    ir(i)
    botones.current[i]?.focus()
  }

  // Si la barra de puntitos sigue en pantalla (venimos de un camino), aparece en su sitio; si no, sube desde abajo.
  const [entrada] = useState(() => entradaBarra('[data-puntitos]'))

  return (
    <motion.nav
      aria-label="Secciones"
      data-pestanas
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      initial={entrada}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={RESORTE.pantalla}
    >
      {/* Capa que flota con el dedo */}
      <motion.div style={{ x: flotaX, y: flotaY }} className="w-full max-w-md">
        {/* Capa de la matraca (giro y golpe lateral) */}
        <motion.div
          ref={pista}
          role="tablist"
          aria-label="Secciones"
          className={`pointer-events-auto relative flex h-14 w-full select-none items-center justify-between rounded-full px-1.5 ${VIDRIO}`}
          style={{ touchAction: 'none', rotate: giro, x: golpe }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onKeyDown={onKeyDown}
        >
          <motion.span
            aria-hidden
            data-marca-pestana
            className="absolute top-1 bottom-1 left-0 rounded-full bg-white shadow-[0_1px_4px_rgb(16_18_28/0.16)]"
            style={{ x, width: ancho }}
          />
          {PESTANAS.map((p, i) => {
            const activa = i === foco
            return (
              <button
                key={p.id}
                ref={(el) => (botones.current[i] = el)}
                type="button"
                role="tab"
                aria-selected={activa}
                tabIndex={activa ? 0 : -1}
                data-pestana={p.id}
                // Con el dedo o el ratón lo resuelve la píldora (pointerup); este clic es el del teclado o el lector.
                onClick={(e) => e.detail === 0 && ir(i)}
                className={`relative z-10 flex h-12 shrink-0 flex-col items-center justify-center gap-1 rounded-full px-3 text-sm font-bold whitespace-nowrap transition-colors duration-200 ${
                  activa ? 'text-zinc-900' : 'text-zinc-500'
                }`}
              >
                <motion.span
                  aria-hidden
                  className="block h-1.5 rounded-full"
                  animate={{ width: activa ? 16 : 6, backgroundColor: activa ? 'var(--color-zinc-900)' : 'var(--color-zinc-300)' }}
                  transition={RESORTE.rebote}
                />
                {p.nombre}
              </button>
            )
          })}
        </motion.div>
      </motion.div>
    </motion.nav>
  )
}
