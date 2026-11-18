import { motion } from 'motion/react'
import { useRef } from 'react'
import { RESORTE } from '../ui/movimiento.js'

/** Recorrido de la perilla: de −135° (0 %) a +135° (100 %), como las de FL Studio. */
const GIRO = 135
/** Píxeles de arrastre para ir de 0 a 100 %. */
const RECORRIDO = 160
/** Cada cuánto se ajusta el valor (5 %). */
const PASO = 0.05

/**
 * PERILLA (la del Swing del Channel rack; árbol de géneros): un botón redondo con un arco del color del área que crece
 * con el valor y una rayita que gira. Se arrastra con el dedo: hacia arriba o a la derecha sube, hacia abajo o a la
 * izquierda baja (como en FL Studio); con teclado, ← → ↑ ↓. Sin `onCambio`, solo enseña el valor.
 *
 * Props: valor (0–1), onCambio(v), etiqueta ('Swing'), color.
 */
export default function Perilla({ valor = 0, onCambio, etiqueta = 'Swing', color = 'var(--color-produccion)' }) {
  const arrastre = useRef(null)
  const editable = Boolean(onCambio)
  const v = Math.max(0, Math.min(1, valor))
  const porcentaje = Math.round(v * 100)

  const fijar = (x) => {
    const nuevo = Math.round(Math.max(0, Math.min(1, x)) / PASO) * PASO
    if (Math.abs(nuevo - v) > 1e-6) onCambio(Math.round(nuevo * 100) / 100)
  }
  const onDown = (e) => {
    if (!editable) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, desde: v, pointer: e.pointerId }
  }
  const onMove = (e) => {
    const a = arrastre.current
    if (!a || a.pointer !== e.pointerId) return
    fijar(a.desde + (e.clientX - a.x - (e.clientY - a.y)) / RECORRIDO)
  }
  const onUp = (e) => {
    if (arrastre.current?.pointer === e.pointerId) arrastre.current = null
  }
  const onKeyDown = (e) => {
    if (!editable) return
    const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]
    if (!d) return
    e.preventDefault()
    fijar(v + d * PASO)
  }

  // Arco de fondo (todo el recorrido) y arco del valor, en un círculo de radio 17 dentro de 44 × 44.
  const R = 17
  const largo = 2 * Math.PI * R * (2 * GIRO / 360)
  return (
    <div className="flex items-center gap-2" data-perilla={etiqueta.toLowerCase()} data-valor={porcentaje}>
      <div
        role="slider"
        tabIndex={editable ? 0 : -1}
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        aria-valuetext={`${porcentaje} %`}
        aria-readonly={!editable || undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKeyDown}
        className="relative grid size-12 shrink-0 place-items-center rounded-full"
        style={{ touchAction: 'none', cursor: editable ? 'ns-resize' : 'default' }}
      >
        {/* El SVG gira −90° (el trazo empieza arriba) y cada arco −135° más: de abajo a la izquierda, 270° en el sentido del reloj. */}
        <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={R} fill="none" strokeWidth="4" strokeLinecap="round" style={{ stroke: 'var(--color-zinc-200)' }}
            strokeDasharray={`${largo} 999`} transform={`rotate(${-GIRO} 22 22)`} />
          {v > 0 && <circle cx="22" cy="22" r={R} fill="none" strokeWidth="4" strokeLinecap="round" style={{ stroke: color, transition: 'stroke-dasharray 120ms' }}
            strokeDasharray={`${largo * v} 999`} transform={`rotate(${-GIRO} 22 22)`} />}
        </svg>
        <motion.span
          aria-hidden
          className="relative grid size-8 place-items-center rounded-full border border-zinc-200 bg-zinc-100 shadow-[0_1px_2px_rgb(16_18_28/0.15)]"
          initial={false}
          animate={{ rotate: -GIRO + v * 2 * GIRO }}
          transition={RESORTE.pulsar}
        >
          <span className="absolute top-1 h-2.5 w-[3px] rounded-full bg-zinc-700" />
        </motion.span>
      </div>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-zinc-600">{etiqueta}</span>
        <span className="font-dato text-base font-medium tabular-nums text-zinc-700" data-swing>
          {porcentaje} %
        </span>
      </span>
    </div>
  )
}
