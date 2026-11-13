import { useEffect, useRef } from 'react'

const PASO_PX = 40 // trackpad: desplazamiento acumulado (en px) que vale un paso
const MUESCA_PX = 50 // un evento de este tamaño (o en líneas/páginas) es una muesca de la rueda: un paso cada una

/**
 * Rueda del mouse (o trackpad) sobre un carrusel (pedido del usuario, para computadora): cada «muesca» lo mueve un
 * paso hacia donde va el scroll, sin pausas (5 muescas rápidas = 5 pasos; pedido del usuario: antes se perdían). En
 * trackpad, cada 40 px acumulados = un paso. `onPaso` puede llegar varias veces antes de que la pantalla se vuelva a
 * pintar: quien lo usa debe sumar al DESTINO, no a lo que se ve a medio camino. `onPaso(dir)` recibe +1 / −1; con `puede(dir)` falso (p. ej. en el extremo) no se
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
      const dir = Math.sign(px)
      if (e.deltaMode !== 0 || Math.abs(px) >= MUESCA_PX) {
        acumulado = 0
        o.onPaso(dir)
        return
      }
      acumulado += px
      while (Math.abs(acumulado) >= PASO_PX) {
        acumulado -= dir * PASO_PX
        if (o.puede && !o.puede(dir)) {
          acumulado = 0
          break
        }
        o.onPaso(dir)
      }
    }
    el.addEventListener('wheel', gira, { passive: false })
    return () => el.removeEventListener('wheel', gira)
  }, [ref])
}
