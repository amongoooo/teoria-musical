import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { RESORTE } from './movimiento.js'

/**
 * Barra de progreso fina que avanza con un resorte.
 *  - valor: 0–1
 *  - color: color de la parte llena
 *  - fondo: clase del carril (bg-zinc-200 sobre la página, bg-zinc-100 dentro de tarjetas blancas)
 *  - alAparecer: si true, se llena desde 0 al montar (con un pequeño retraso); si false, solo anima los cambios.
 * Los cambios de valor y de color se animan (el color con un fundido, p. ej. al cambiar de módulo).
 */
export default function BarraProgreso({ valor, color, fondo = 'bg-zinc-200', alto = 'h-2.5', alAparecer = true, className = '', ...props }) {
  const ancho = `${Math.max(0, Math.min(1, valor)) * 100}%`
  // El retraso solo para el llenado inicial; los cambios posteriores responden al momento.
  const montada = useRef(false)
  useEffect(() => {
    montada.current = true
  }, [])
  return (
    <div className={`${alto} overflow-hidden rounded-full ${fondo} ${className}`} {...props}>
      <motion.div
        className="h-full rounded-full"
        initial={alAparecer ? { width: 0, backgroundColor: color } : false}
        animate={{ width: ancho, backgroundColor: color }}
        transition={{ ...RESORTE.suave, delay: alAparecer && !montada.current ? 0.2 : 0, backgroundColor: { duration: 0.35, ease: 'easeOut' } }}
      />
    </div>
  )
}
