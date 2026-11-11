import qrcode from 'qrcode-generator'
import { useMemo } from 'react'

/**
 * Código QR en SVG (siempre negro sobre blanco, también en modo oscuro: los lectores lo necesitan así).
 * Corrección de errores baja (L) para que un link largo siga siendo legible.
 */
export default function CodigoQR({ texto, etiqueta = 'Código QR', className = '' }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'L')
    qr.addData(texto, 'Byte')
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let f = 0; f < n; f++) {
      for (let c = 0; c < n; c++) if (qr.isDark(f, c)) d += `M${c} ${f}h1v1h-1z`
    }
    return { n, d }
  }, [texto])
  const margen = 4 // zona en blanco alrededor que piden los lectores
  return (
    <svg
      viewBox={`${-margen} ${-margen} ${n + margen * 2} ${n + margen * 2}`}
      role="img"
      aria-label={etiqueta}
      shapeRendering="crispEdges"
      className={`block rounded-2xl bg-[#ffffff] ${className}`}
    >
      <path d={d} fill="#000000" />
    </svg>
  )
}
