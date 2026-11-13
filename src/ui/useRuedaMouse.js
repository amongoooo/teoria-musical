import { useEffect, useRef } from 'react'

const PASO_PX = 50 // desplazamiento acumulado (en px) que vale un paso
const PAUSA_MS = 140 // tras un paso, se ignora la inercia del trackpad un momento

/**
 * Rueda del mouse (o trackpad) sobre un carrusel (pedido del usuario, para computadora): cada «muesca» lo mueve un
 * paso hacia donde va el scroll. `onPaso(dir)` recibe +1 / −1; con `puede(dir)` falso (p. ej. en el extremo) no se
 * toma el scroll y la página se desplaza como siempre.
 *  - eje 'x' (carruseles de lado): a la derecha (o la rueda hacia abajo, si `conVertical`) = +1.
 *  - eje 'y' (ruedas verticales con los valores altos arriba): la rueda hacia abajo baja el valor (−1).
 */
export default function useRuedaMouse(ref, { onPaso, puede, eje = 'x', conVertical = true, activo = true }) {
  const op = useRef(null)
  op.current = { onPaso, puede, eje, conVertical, activo }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let acumulado = 0
    let pausa = 0
    let ultimo = 0
    const gira = (e) => {
      const o = op.current
      if (!o.activo || e.ctrlKey) return
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      let d
      if (o.eje === 'y') {
        if (horizontal) return
        d = -e.deltaY
      } else {
        if (!horizontal && !o.conVertical) return
        d = horizontal ? e.deltaX : e.deltaY
      }
      if (!d) return
      const px = e.deltaMode === 1 ? d * 40 : e.deltaMode === 2 ? d * 400 : d
      if (o.puede && !o.puede(Math.sign(px))) return
      e.preventDefault()
      const ahora = performance.now()
      if (ahora - ultimo > 250 || Math.sign(px) !== Math.sign(acumulado)) acumulado = 0
      ultimo = ahora
      if (ahora < pausa) return
      acumulado += px
      if (Math.abs(acumulado) < PASO_PX && e.deltaMode === 0) return
      const dir = Math.sign(acumulado)
      acumulado = 0
      pausa = ahora + PAUSA_MS
      o.onPaso(dir)
    }
    el.addEventListener('wheel', gira, { passive: false })
    return () => el.removeEventListener('wheel', gira)
  }, [ref])
}
