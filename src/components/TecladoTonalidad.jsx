import { motion, useAnimate } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Note } from 'tonal'
import { noteOff, noteOn } from '../audio/engine.js'
import { nombre } from '../theory/notas.js'
import { oscuro } from '../ui/color.js'

// Teclado de UNA octava (Do…Si) que no se mueve, para ver las 7 notas de una tonalidad (explorador #/circulo).
// Siempre claro (`tema-claro`), como el Piano. Cada tecla suena al tocarla (octava 4).
//   tónica = el color del módulo relleno · sus otras 6 notas = el color suave · nota nueva = oro (fíjate), que salta
//   · la que se va = contorno punteado de oro que se apaga · la que suena = celeste.

const BLANCAS = [0, 2, 4, 5, 7, 9, 11]
const NEGRAS = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 } // croma → entre qué blancas va (borde izquierdo de la blanca n)
const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const es = (n) => nombre(`${n}4`, { octava: false })

/**
 * Props:
 *  - notas: las 7 notas de la tonalidad (sin octava; la primera es la tónica)
 *  - color: acento del módulo
 *  - cambio: { entran: [...], salen: [...], n } (n cambia en cada paso para repetir la animación) o null
 *  - sonando: cromas que suenan ahora
 *  - onTocar(croma): al tocar una tecla
 */
export default function TecladoTonalidad({ notas, color, cambio, sonando = [], onTocar }) {
  const cromas = notas.map(Note.chroma)
  const entran = cambio?.entran.map(Note.chroma) ?? []
  const salen = cambio?.salen.map(Note.chroma) ?? []
  const tecla = (croma, negra) => {
    const i = cromas.indexOf(croma)
    const estado = sonando.includes(croma) ? 'suena' : i === 0 ? 'tonica' : entran.includes(croma) ? 'nueva' : i > 0 ? 'nota' : ''
    return (
      <Tecla
        key={croma}
        croma={croma}
        negra={negra}
        estado={estado}
        etiqueta={i >= 0 ? es(notas[i]) : negra ? '' : es(SOSTENIDOS[croma])}
        sale={salen.includes(croma) ? cambio.n : null}
        salta={entran.includes(croma) ? cambio.n : null}
        color={color}
        onTocar={onTocar}
      />
    )
  }
  return (
    <div className="tema-claro relative flex h-32 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 select-none" style={{ touchAction: 'none' }} data-teclado-tonalidad>
      {BLANCAS.map((c) => tecla(c, false))}
      {Object.keys(NEGRAS).map((c) => tecla(Number(c), true))}
    </div>
  )
}

function Tecla({ croma, negra, estado, etiqueta, sale, salta, color, onTocar }) {
  const sonando = useRef(false)
  const [scope, animar] = useAnimate()
  // La nota que entra salta (cada cambio trae un `n` nuevo).
  useEffect(() => {
    if (salta != null && scope.current) animar(scope.current, { y: [0, -6, 1, 0], scale: [1, 1.06, 0.99, 1] }, { duration: 0.42, ease: 'easeOut' })
  }, [salta, animar, scope])
  const nota = `${SOSTENIDOS[croma]}4`
  const fondo = {
    suena: 'var(--color-sky-500)',
    tonica: oscuro(color),
    nueva: 'var(--color-fijate)',
    nota: negra ? `color-mix(in oklab, ${color} 62%, white)` : `color-mix(in oklab, ${color} 18%, white)`,
  }[estado] ?? (negra ? 'var(--color-zinc-800)' : 'var(--color-white)')
  const texto = {
    suena: 'var(--color-blanco)',
    tonica: 'var(--color-blanco)',
    nueva: 'var(--color-negro)',
    nota: negra ? 'var(--color-negro)' : oscuro(color),
  }[estado] ?? 'var(--color-zinc-500)'

  const empezar = (e) => {
    e.preventDefault()
    if (sonando.current) return
    sonando.current = true
    noteOn(nota)
    onTocar?.(croma)
  }
  const soltar = () => {
    if (!sonando.current) return
    sonando.current = false
    noteOff(nota)
  }

  const posicion = negra ? { left: `calc(${(NEGRAS[croma] / 7) * 100}% - 4.6%)`, width: '9.2%' } : null
  return (
    <div
      ref={scope}
      role="button"
      aria-label={etiqueta || es(SOSTENIDOS[croma])}
      data-tecla={croma}
      data-estado={estado}
      onPointerDown={empezar}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      className={`flex cursor-pointer flex-col items-center justify-end font-dato font-medium ${
        negra ? 'absolute top-0 z-10 h-[60%] rounded-b-lg pb-1.5 text-[13px]' : 'relative flex-1 pb-2 text-sm'
      }`}
      style={{
        ...posicion,
        backgroundColor: fondo,
        color: texto,
        transition: estado === 'suena' ? 'background-color 60ms, color 60ms' : 'background-color 250ms, color 250ms',
      }}
    >
      {etiqueta}
      {sale != null && (
        <motion.span
          key={sale}
          aria-hidden
          data-sale
          className="pointer-events-none absolute inset-[3px] rounded-lg border-[3px] border-dashed border-fijate"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        />
      )}
    </div>
  )
}
