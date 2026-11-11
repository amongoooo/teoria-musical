import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RESORTE } from './movimiento.js'
import { Cerrar } from './Iconos.jsx'
import Pulsable from './Pulsable.jsx'
import { VIDRIO } from './vidrio.js'

/**
 * Hoja que sube desde abajo (bottom sheet tipo iOS). En pantallas anchas flota centrada.
 * Se cierra tocando el fondo, con ✕, con Escape o arrastrándola hacia abajo.
 *  - abierta, onCerrar, etiqueta (nombre accesible del diálogo), children
 * Si el contenido no cabe, se desplaza dentro de la hoja (y entonces solo el asa la arrastra).
 * Lo que lleve `data-sin-arrastre` (p. ej. un carrusel lateral) no arrastra la hoja.
 * Se pinta en un portal en <body>, por encima de todo (cabecera fija y barra de puntitos incluidas), aunque
 * la abra un botón que vive dentro de una capa fija (p. ej. Opciones en la cabecera de Módulo).
 */
export default function Hoja({ abierta, onCerrar, etiqueta, children }) {
  const ref = useRef(null)
  const arrastre = useDragControls()

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
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[calc(100dvh-1.5rem)] max-w-lg flex-col gap-5 rounded-t-3xl bg-white px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:rounded-3xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={RESORTE.pantalla}
            drag="y"
            dragListener={false}
            dragControls={arrastre}
            onPointerDown={(e) => {
              if (e.target.closest('[data-sin-arrastre], input, textarea')) return
              // Si el contenido es más alto que la pantalla, se desplaza: solo el asa arrastra la hoja.
              const zona = e.target.closest('[data-desplazable]')
              if (zona && zona.scrollHeight > zona.clientHeight + 1) return
              arrastre.start(e)
            }}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onCerrar()
            }}
          >
            <div className="relative flex justify-center">
              <span aria-hidden className="mt-1 h-1.5 w-10 rounded-full bg-zinc-300" />
              <Pulsable
                onClick={onCerrar}
                aria-label="Cerrar"
                className={`absolute -top-1 right-0 grid size-11 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
              >
                <Cerrar className="size-5" />
              </Pulsable>
            </div>
            <div data-desplazable className="-mx-5 -mb-2 flex min-h-0 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-2">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
