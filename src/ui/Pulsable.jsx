import { motion } from 'motion/react'
import { HUNDIR, RESORTE } from './movimiento.js'

/**
 * Botón o enlace que "se hunde" al tocarlo con un resorte (sensación iOS).
 *  - Con `href` es un <a>; si no, un <button type="button">.
 *  - tipo: 'boton' (se hunde más) o 'tarjeta' (más sutil, para superficies grandes).
 * El resto de props pasan tal cual (className, onClick, disabled, aria-*…).
 */
export default function Pulsable({ href, tipo = 'boton', disabled, children, ...props }) {
  const Comp = href ? motion.a : motion.button
  const extra = href ? { href } : { type: 'button', disabled }
  return (
    <Comp
      {...extra}
      {...props}
      whileTap={disabled ? undefined : { scale: HUNDIR[tipo] }}
      transition={RESORTE.pulsar}
      style={{ touchAction: 'manipulation', ...props.style }}
    >
      {children}
    </Comp>
  )
}
