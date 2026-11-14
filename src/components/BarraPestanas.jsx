import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { navegar, rutas } from '../router.js'
import { entradaBarra } from '../ui/barraAbajo.js'
import { Inicio, Lapiz, Libro, Opciones, Pesas } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'
import { VIDRIO } from '../ui/vidrio.js'
import { MATRACA, flotar, gradosMatraca } from './CaminoLecciones.jsx'

/**
 * BARRA DE PESTAÑAS (fase 3 del rediseño, hecha a partir de la barra de puntitos; cambio pedido por el usuario:
 * «mejor que sí sean íconos y al seleccionarlos se despliega su texto y su botón se hace más grande»).
 * La misma píldora de vidrio que la barra de puntitos, abajo y en el mismo sitio, con 5 pestañas de izquierda a
 * derecha: Herramientas (lápiz) · Practicar (pesas) · Inicio (casita) · Aprender (libro) · Configuración (engrane).
 *  - Las demás: solo su ícono en un círculo de 44 px, en gris.
 *  - La elegida CRECE (más alta y ancha), despliega su NOMBRE junto al ícono y lleva detrás la MARCA (píldora de
 *    superficie que pasa de una a otra con resorte: `layoutId`).
 *  - ARRASTRAR por la barra cambia de pestaña EN VIVO (como arrastrar por los puntitos abre cada isla): la marca se
 *    corre un poco hacia el dedo (imán); al cruzar a otra pestaña, golpe de MATRACA (el de la barra de puntitos) y la
 *    barra FLOTA con el dedo; al soltar todo vuelve con resorte.
 *  - TOCAR va directo; tocar la pestaña en la que ya estás sube al principio.
 *  - Dentro de un camino (módulo, ruta, bloque) la píldora «se vuelve» la barra de puntitos (ui/barraAbajo.js). En
 *    lecciones, entrenadores y pruebas no hay barra.
 *  - Teclado: flechas ← → entre pestañas (tablist con foco itinerante).
 */
export const PESTANAS = [
  { id: 'herramientas', nombre: 'Herramientas', Icono: Lapiz },
  { id: 'practicar', nombre: 'Practicar', Icono: Pesas },
  { id: 'inicio', nombre: 'Inicio', Icono: Inicio },
  { id: 'aprender', nombre: 'Aprender', Icono: Libro },
  { id: 'configuracion', nombre: 'Configuración', Icono: Opciones },
]
export const indicePestana = (pagina) => PESTANAS.findIndex((p) => p.id === pagina)

/** Aprender recuerda su última vista (Rutas o Biblioteca) mientras la app esté abierta. */
let vistaAprender = null
const enlace = (id) => (id === 'inicio' ? rutas.inicio() : id === 'aprender' ? rutas.aprender(vistaAprender) : `#/${id}`)

/** Cuánto se corre la marca hacia el dedo (imán) y hasta dónde. */
const IMAN = 0.35
const IMAN_MAX = 14

export default function BarraPestanas({ ruta }) {
  const reducir = useReducedMotion()
  const indiceRuta = indicePestana(ruta.pagina)
  if (ruta.pagina === 'aprender') vistaAprender = ruta.id
  const [foco, setFoco] = useState(indiceRuta)
  const focoRef = useRef(foco)
  const arrastre = useRef(null)
  const botones = useRef([])

  const iman = useMotionValue(0)
  const flotaX = useMotionValue(0)
  const flotaY = useMotionValue(0)
  const giro = useMotionValue(0)
  const golpe = useMotionValue(0)

  const cambiarFoco = (i) => {
    focoRef.current = i
    setFoco(i)
  }
  // La pestaña la manda la ruta (salvo mientras el dedo arrastra: ahí manda el dedo).
  useEffect(() => {
    if (!arrastre.current) cambiarFoco(indiceRuta)
  }, [indiceRuta])

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

  const centro = (i) => {
    const c = botones.current[i]?.getBoundingClientRect()
    return c ? c.left + c.width / 2 : 0
  }
  const masCercana = (x) => {
    let mejor = 0
    PESTANAS.forEach((_, i) => {
      if (Math.abs(centro(i) - x) < Math.abs(centro(mejor) - x)) mejor = i
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
    arrastre.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, eje: caja.top + caja.height / 2, movio: false }
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
      const d = e.clientY - (s.eje + flotaY.get())
      const tiron = Math.sign(d) * Math.min(1, Math.max(0, (Math.abs(d) - MATRACA.eje) / MATRACA.rango))
      matraca(i, Math.sign(i - focoRef.current), tiron)
      cambiarFoco(i)
      navegar(enlace(PESTANAS[i].id))
    }
    // Imán: la marca se corre un poco hacia el dedo, sin dejar su pestaña.
    if (!reducir) iman.set(Math.max(-IMAN_MAX, Math.min(IMAN_MAX, (e.clientX - centro(focoRef.current)) * IMAN)))
  }
  const soltar = (e) => {
    const s = arrastre.current
    if (!s || s.id !== e.pointerId) return
    arrastre.current = null
    animate(flotaX, 0, RESORTE.suave)
    animate(flotaY, 0, RESORTE.suave)
    animate(iman, 0, RESORTE.rebote)
    if (!s.movio && e.type === 'pointerup') {
      const i = masCercana(e.clientX)
      if (i !== focoRef.current) matraca(i, Math.sign(i - focoRef.current))
      ir(i)
    }
  }

  const onKeyDown = (e) => {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    const i = Math.min(PESTANAS.length - 1, Math.max(0, focoRef.current + paso))
    if (i === focoRef.current) return
    matraca(i, paso)
    ir(i)
    requestAnimationFrame(() => botones.current[i]?.focus())
  }

  // Si la barra de puntitos sigue en pantalla (venimos de un camino), aparece en su sitio; si no, sube desde abajo.
  const [entrada] = useState(() => entradaBarra('[data-puntitos]'))
  const transicion = reducir ? { duration: 0 } : RESORTE.pulsar

  return (
    <motion.nav
      aria-label="Secciones"
      data-pestanas
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3"
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
          role="tablist"
          aria-label="Secciones"
          className={`pointer-events-auto relative flex h-15 w-full select-none items-center justify-between rounded-full px-1.5 ${VIDRIO}`}
          style={{ touchAction: 'none', rotate: giro, x: golpe }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onKeyDown={onKeyDown}
        >
          <LayoutGroup id="pestanas">
            {PESTANAS.map((p, i) => {
              const activa = i === foco
              const Icono = p.Icono
              return (
                <motion.button
                  key={p.id}
                  ref={(el) => (botones.current[i] = el)}
                  layout
                  transition={transicion}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  aria-label={p.nombre}
                  tabIndex={activa ? 0 : -1}
                  data-pestana={p.id}
                  // Con el dedo o el ratón lo resuelve la píldora (pointerup); este clic es el del teclado o el lector.
                  onClick={(e) => e.detail === 0 && ir(i)}
                  className={`relative flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                    activa ? 'h-12 gap-1 px-3 text-zinc-900' : 'size-11 text-zinc-500'
                  }`}
                >
                  {activa && (
                    <motion.span layoutId="marca-pestana" transition={transicion} className="absolute inset-0" aria-hidden>
                      <motion.span data-marca-pestana className="absolute inset-0 rounded-full bg-white shadow-[0_1px_5px_rgb(16_18_28/0.18)]" style={{ x: iman }} />
                    </motion.span>
                  )}
                  <motion.span layout="position" transition={transicion} className="relative grid place-items-center">
                    <Icono className={activa ? 'size-6.5' : 'size-6'} grosor={activa ? 2.2 : 2} />
                  </motion.span>
                  <AnimatePresence initial={false}>
                    {activa && (
                      <motion.span
                        key="nombre"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={transicion}
                        className="relative overflow-hidden text-sm font-bold whitespace-nowrap"
                        aria-hidden
                      >
                        {p.nombre}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </LayoutGroup>
        </motion.div>
      </motion.div>
    </motion.nav>
  )
}
