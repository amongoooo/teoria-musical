import { useEffect } from 'react'

/**
 * En las lecciones la barra inferior (BarraAccion) crece al mostrar un mensaje y
 * puede tapar el teclado o el Piano Roll en el celular: si pasa, desplazamos la
 * página lo justo para verlo. Al montar no se mueve nada.
 */
export default function useSobreBarra(ref, activo = true) {
  useEffect(() => {
    if (!activo) return
    const barra = document.querySelector('[data-barra-accion]')
    if (!barra) return
    let primera = true
    let frame = 0
    const ajustar = () => {
      const el = ref.current
      if (!el) return
      const limite = window.innerHeight - barra.offsetHeight - 8
      const tapado = el.getBoundingClientRect().bottom - limite
      if (tapado > 1) window.scrollBy({ top: tapado, behavior: 'smooth' })
    }
    const ro = new ResizeObserver(() => {
      if (primera) return void (primera = false)
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(ajustar)
    })
    ro.observe(barra)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [ref, activo])
}
