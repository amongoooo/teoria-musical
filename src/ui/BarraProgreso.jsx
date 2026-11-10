import { motion } from 'motion/react'
import { RESORTE } from './movimiento.js'

/**
 * Barra de progreso fina que avanza con un resorte.
 *  - valor: 0–1
 *  - color: color de la parte llena
 *  - fondo: clase del carril (bg-zinc-200 sobre la página, bg-zinc-100 dentro de tarjetas blancas)
 *  - alAparecer: si true, se llena desde 0 al montar (con un pequeño retraso); si false, solo anima los cambios.
 */
export default function BarraProgreso({ valor, color, fondo = 'bg-zinc-200', alto = 'h-2.5', alAparecer = true, className = '', ...props }) {
  const ancho = `${Math.max(0, Math.min(1, valor)) * 100}%`
  return (
    <div className={`${alto} overflow-hidden rounded-full ${fondo} ${className}`} {...props}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={alAparecer ? { width: 0 } : false}
        animate={{ width: ancho }}
        transition={alAparecer ? { ...RESORTE.suave, delay: 0.2 } : RESORTE.suave}
      />
    </div>
  )
}
