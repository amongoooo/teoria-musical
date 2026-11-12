import { AnimatePresence, animate, motion, useDragControls, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RESORTE } from './movimiento.js'
import { Cerrar } from './Iconos.jsx'
import Pulsable from './Pulsable.jsx'
import { VIDRIO } from './vidrio.js'

/**
 * Hoja que sube desde abajo (bottom sheet tipo iOS). En pantallas anchas flota centrada.
 * Se cierra tocando el fondo, con ✕, con Escape o arrastrándola hacia abajo.
 *  - abierta, onCerrar, etiqueta (nombre accesible del diálogo), children
 * Si el contenido no cabe, se desplaza dentro de la hoja; con el dedo, tirar hacia abajo con el contenido ARRIBA
 * DEL TODO (o desde el asa) arrastra la hoja, como en iOS. El dedo va con eventos táctiles propios (no con el drag
 * de motion): en Android el navegador se quedaba con el gesto (pointercancel) y la hoja «se soltaba» a medias
 * (pedido del usuario). El ratón sigue con el drag de motion. Lo que lleve `data-sin-arrastre` (p. ej. un carrusel
 * lateral) no arrastra la hoja.
 * Se pinta en un portal en <body>, por encima de todo (cabecera fija y barra de puntitos incluidas), aunque
 * la abra un botón que vive dentro de una capa fija (p. ej. Opciones en la cabecera de Módulo).
 */
/** Arrastre de la hoja: se cierra al soltar más allá de `cierra` px o hacia abajo a más de `velocidad` px/ms. */
const ARRASTRE = { cierra: 90, velocidad: 0.6, goma: 0.15 }

/** Óvalo del asa: al tomarla crece con un pop pequeño y se queda un poco más grande; al soltar, el pop inverso. */
const ASA = {
  toma: { scale: [1, 1.32, 1.18] },
  suelta: { scale: [1.18, 0.9, 1] },
  transicion: { duration: 0.24, ease: [0.3, 0, 0.3, 1] },
}

/** ¿El toque empezó en el asa (y no en su ✕)? */
const enAsa = (el) => Boolean(el.closest?.('[data-asa]')) && !el.closest('button')

export default function Hoja({ abierta, onCerrar, etiqueta, children }) {
  const ref = useRef(null)
  const arrastre = useDragControls()
  const y = useMotionValue(0)
  const cerrarRef = useRef(onCerrar)
  cerrarRef.current = onCerrar
  // Cuando el contenido se desplaza por debajo del asa, la cabecera (asa + ✕) se vuelve de vidrio.
  const [desplazada, setDesplazada] = useState(false)
  // La hoja está «tomada» (dedo o ratón en el asa, o arrastrándola): el óvalo del asa se resalta con un pop pequeño
  // y al soltar hace el pop inverso (pedido del usuario).
  const [tomada, setTomada] = useState(false)
  useEffect(() => {
    if (!abierta) {
      setDesplazada(false)
      setTomada(false)
    }
  }, [abierta])

  useEffect(() => {
    if (!abierta) return
    const alTeclado = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclado)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Foco dentro del diálogo (accesibilidad), sin hacer scroll.
    requestAnimationFrame(() => ref.current?.querySelector('[data-foco]')?.focus({ preventScroll: true }))
    return () => {
      document.removeEventListener('keydown', alTeclado)
      document.body.style.overflow = overflow
    }
  }, [abierta, onCerrar])

  // Arrastre con el dedo (ver arriba). La decisión se toma en el PRIMER touchmove (si no se cancela ese, el
  // navegador empieza a desplazar y ya no deja cancelar los siguientes): de lado → nada; hacia abajo con el
  // contenido arriba del todo, desde el asa o si el contenido cabe → la hoja sigue al dedo; si no → se desplaza.
  useEffect(() => {
    const hoja = ref.current
    if (!abierta || !hoja) return
    let g = null // { y0, x0, nuestro, muestras: [{ y, t }] }
    let vuelta = null
    const empieza = (e) => {
      g = null
      if (e.touches.length !== 1 || e.target.closest('[data-sin-arrastre], input, textarea')) return
      const t = e.touches[0]
      g = { y0: t.clientY, x0: t.clientX, nuestro: null, muestras: [{ y: t.clientY, t: e.timeStamp }] }
      if (enAsa(e.target)) setTomada(true)
    }
    const mueve = (e) => {
      if (!g) return
      if (e.touches.length !== 1) return (g = null)
      const t = e.touches[0]
      if (g.nuestro === null) {
        const dy = t.clientY - g.y0
        const dx = t.clientX - g.x0
        if (Math.abs(dx) > Math.abs(dy)) {
          setTomada(false)
          return (g = null)
        }
        const zona = hoja.querySelector('[data-desplazable]')
        const desplazable = zona && zona.scrollHeight > zona.clientHeight + 1
        g.nuestro = Boolean(e.target.closest('[data-asa]')) || !desplazable || (dy > 0 && zona.scrollTop <= 0)
        if (!g.nuestro) {
          setTomada(false)
          return (g = null)
        }
        setTomada(true)
        vuelta?.stop()
        // Sigue al dedo 1:1 desde donde se apoyó (y desde donde esté la hoja, si aún volvía a su sitio). Tras la
        // animación de entrada el valor puede quedar como texto ('0%'): a número (px).
        g.y0 -= Math.max(0, parseFloat(y.get()) || 0)
      }
      if (e.cancelable) e.preventDefault()
      const d = t.clientY - g.y0
      y.set(d >= 0 ? d : d * ARRASTRE.goma) // hacia arriba apenas se mueve (goma)
      g.muestras.push({ y: t.clientY, t: e.timeStamp })
      if (g.muestras.length > 5) g.muestras.shift()
    }
    const suelta = () => {
      setTomada(false)
      if (!g?.nuestro) return (g = null)
      const [a, b] = [g.muestras[0], g.muestras[g.muestras.length - 1]]
      const v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0
      g = null
      if (y.get() > ARRASTRE.cierra || (v > ARRASTRE.velocidad && y.get() > 0)) cerrarRef.current()
      else vuelta = animate(y, 0, RESORTE.pantalla)
    }
    hoja.addEventListener('touchstart', empieza, { passive: true })
    hoja.addEventListener('touchmove', mueve, { passive: false })
    hoja.addEventListener('touchend', suelta)
    hoja.addEventListener('touchcancel', suelta)
    return () => {
      hoja.removeEventListener('touchstart', empieza)
      hoja.removeEventListener('touchmove', mueve)
      hoja.removeEventListener('touchend', suelta)
      hoja.removeEventListener('touchcancel', suelta)
      vuelta?.stop()
    }
  }, [abierta, y])

  return createPortal(
    <AnimatePresence>
      {abierta && (
        <>
          <motion.div
            key="fondo"
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
            aria-hidden
          />
          <motion.div
            key="hoja"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={etiqueta}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[calc(100dvh-1.5rem)] max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:bottom-6 sm:rounded-3xl"
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={RESORTE.pantalla}
            drag="y"
            dragListener={false}
            dragControls={arrastre}
            onPointerDown={(e) => {
              if (e.pointerType !== 'mouse') return // el dedo va con los eventos táctiles de arriba
              if (e.target.closest('[data-sin-arrastre], input, textarea')) return
              // Si el contenido es más alto que la pantalla, se desplaza: solo el asa arrastra la hoja.
              const zona = e.target.closest('[data-desplazable]')
              if (zona && zona.scrollHeight > zona.clientHeight + 1) return
              arrastre.start(e)
              if (enAsa(e.target)) {
                setTomada(true)
                window.addEventListener('pointerup', () => setTomada(false), { once: true })
              }
            }}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onCerrar()
            }}
          >
            <div
              data-asa
              className={`absolute inset-x-0 top-0 z-10 flex h-14 justify-center px-5 pt-3 transition-[background-color,box-shadow] duration-200 ${
                desplazada ? 'vidrio bg-white/70 shadow-[0_1px_0_var(--color-zinc-200)] backdrop-blur-xl backdrop-saturate-150' : ''
              }`}
            >
              <motion.span
                aria-hidden
                data-asa-ovalo={tomada ? 'tomada' : undefined}
                className={`mt-1 h-1.5 w-10 rounded-full transition-colors duration-150 ${tomada ? 'bg-zinc-500' : 'bg-zinc-300'}`}
                initial={false}
                animate={tomada ? ASA.toma : ASA.suelta}
                transition={ASA.transicion}
              />
              <Pulsable
                onClick={onCerrar}
                aria-label="Cerrar"
                className={`absolute top-2 right-5 grid size-11 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
              >
                <Cerrar className="size-5" />
              </Pulsable>
            </div>
            <div
              data-desplazable
              onScroll={(e) => setDesplazada(e.currentTarget.scrollTop > 4)}
              className="flex min-h-0 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-[2.625rem] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
