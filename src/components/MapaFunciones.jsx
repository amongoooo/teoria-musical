import { useEffect, useMemo, useState } from 'react'
import { pararProgramado } from '../audio/engine.js'
import { reproducir } from '../audio/sonido.js'
import { FUNCIONES, ORDEN_FUNCIONES, arpegioYAcorde, funcionesDe } from '../theory/acordes.js'
import { nombre } from '../theory/notas.js'
import { tinta } from '../ui/color.js'
import Pulsable from '../ui/Pulsable.jsx'

/**
 * Fondo de cada función: el color del área cada vez más intenso de T a D (la tensión sube). Siempre va con su letra
 * (T · S · D): el tono solo dice «cuánto», la letra dice «cuál».
 */
const INTENSIDAD = { T: 14, S: 26, D: 40 }
export const fondoFuncion = (color, f) => `color-mix(in oklab, ${color} ${INTENSIDAD[f] ?? 14}%, var(--color-white))`

/** Cabecera de una columna o caja de función: la letra grande y su palabra. */
export function LetraFuncion({ f, color, compacta = false }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className={`font-titulo font-extrabold ${compacta ? 'text-2xl' : 'text-3xl'}`} style={{ color: tinta(color) }}>
        {f}
      </span>
      <span className="mt-1 text-sm font-semibold text-zinc-900">{FUNCIONES[f].corto}</span>
    </span>
  )
}

/**
 * «Mapa de funciones» (L9, lección 5.1): los 7 acordes de una tonalidad mayor en tres columnas (T · S · D). El jefe de
 * cada familia (I, IV, V) va con borde; en los demás, las notas que comparten con él van en oro («fíjate»). Tocar un
 * acorde suena: el jefe, en arpegio y luego junto; los demás, después de su jefe (así se oye lo que comparten).
 * funciones: { tonalidad: 'C4' }
 */
export default function MapaFunciones({ funciones, color }) {
  const familias = useMemo(() => funcionesDe(funciones.tonalidad ?? 'C4'), [funciones.tonalidad])
  const [sonando, setSonando] = useState(null)
  useEffect(() => () => pararProgramado(), [])

  const tocar = (f, a) => {
    const jefe = familias[f][0]
    const sonido = a === jefe ? { notas: arpegioYAcorde(a.notas), intervalo: 0.3, duracion: 1.1 } : { notas: [jefe.notas, a.notas], intervalo: 1.0, duracion: 0.95 }
    setSonando(a.cifrado)
    reproducir(sonido, { alParar: () => setSonando((x) => (x === a.cifrado ? null : x)) })
  }

  return (
    <section data-mapa-funciones className="grid grid-cols-3 gap-2">
      {ORDEN_FUNCIONES.map((f) => (
        <div key={f} data-funcion={f} className="flex min-w-0 flex-col items-center gap-2 rounded-3xl px-1.5 pb-2 pt-3" style={{ background: fondoFuncion(color, f) }}>
          <LetraFuncion f={f} color={color} />
          {familias[f].map((a, i) => {
            const jefe = i === 0
            const comunes = new Set(a.comunes)
            return (
              <Pulsable
                key={a.romano}
                tipo="tarjeta"
                data-acorde={a.cifrado}
                data-jefe={jefe ? '' : undefined}
                data-suena={sonando === a.cifrado ? '' : undefined}
                onClick={() => tocar(f, a)}
                aria-label={`Escuchar ${a.cifrado}, el ${a.romano}`}
                className={`flex w-full flex-col items-center gap-0.5 rounded-2xl border-2 bg-white px-1 py-2 transition-shadow duration-200 ${
                  sonando === a.cifrado ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''
                }`}
                style={{ borderColor: jefe ? tinta(color) : 'transparent' }}
              >
                <span className="font-titulo text-xl font-bold leading-tight text-zinc-900">{a.cifrado}</span>
                <span className="font-dato text-sm font-medium text-zinc-500">{a.romano}</span>
                <span className="flex flex-wrap justify-center gap-x-1 gap-y-0.5 text-sm leading-snug text-zinc-600">
                  {a.notas.map((n) => {
                    const pc = n.replace(/-?\d+$/, '')
                    const enComun = comunes.has(pc)
                    return (
                      <span key={n} data-comun={enComun ? '' : undefined} className={enComun ? 'rounded-md bg-fijate-suave px-0.5 font-semibold text-fijate-tinta' : ''}>
                        {nombre(n, { octava: false })}
                      </span>
                    )
                  })}
                </span>
              </Pulsable>
            )
          })}
        </div>
      ))}
    </section>
  )
}
