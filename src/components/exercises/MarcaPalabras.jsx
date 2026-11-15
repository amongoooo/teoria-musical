import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { acentoLeccion } from '../../content/index.js'
import { DEBILES, analizar } from '../../letras/analisis.js'
import { limpiar } from '../../letras/silabas.js'
import { tinta } from '../../ui/color.js'
import { Check, Repaso } from '../../ui/Iconos.jsx'
import { ENTRA_DERECHA, RESORTE } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import Rich from '../Rich.jsx'
import Rondas from './Rondas.jsx'

/**
 * «Marcar en la letra» (ruta de letras): unos versos con cada palabra (o cada sílaba) tocable; se marcan las que
 * pide la pregunta y se comprueba. Al comprobar: las bien marcadas en verde con ✓, las que faltaban en oro y las que
 * sobraban tachadas. Puntúa una ronda por acierto (todas exactas).
 *
 * Cada ronda:
 *  - pregunta, texto (versos separados por saltos de línea), explicacion
 *  - unidad: 'palabra' (por defecto) | 'silaba'
 *  - correctas:
 *      palabra → ['razón', 'canción'] (palabras, sin importar mayúsculas ni tildes de más: todas sus apariciones)
 *      silaba  → 'tonicas' (la sílaba tónica de cada palabra que suena fuerte; las débiles —la, de, que…— no se
 *                tocan) o una lista de claves 'verso.palabra.silaba' (desde 0)
 *  - fijas: ['corazón'] (palabra) → se ven ya marcadas en gris y no se tocan (p. ej. la palabra de la pregunta)
 * Las palabras débiles (la, de, con, que…) se ven como texto y no se tocan (salvo que sean respuesta).
 * «Ahora sí se puede fallar»: al primer «Comprobar» con errores, las bien marcadas se quedan en verde (fijas), las que
 * sobraban se desmarcan y se dice cuántas faltan (oro); al segundo, las que faltaban salen en ROJO y la ronda va al
 * repaso del final (`fallo(r)`).
 */
export default function MarcaPalabras({ paso, leccionId, setAccion, siguiente, completar, fallo }) {
  const rondas = paso.rondas
  const [r, setR] = useState(0)
  const [marcadas, setMarcadas] = useState(() => new Set())
  const [resultado, setResultado] = useState(null) // null | 'bien' | 'mal'
  const [fijasBien, setFijasBien] = useState(() => new Set()) // bien marcadas en el primer intento (verdes)
  const [aviso, setAviso] = useState(null) // primer intento con errores: { faltan, sobran }
  const [aciertos, setAciertos] = useState(0)
  const color = acentoLeccion(leccionId) ?? 'var(--color-zinc-900)'

  const ronda = rondas[r]
  const unidad = ronda.unidad ?? 'palabra'
  const versos = useMemo(() => analizar(ronda.texto, { porPalabra: true }).estrofas.flatMap((e) => e.versos), [ronda.texto])
  const correctas = useMemo(() => clavesCorrectas(ronda, versos), [ronda, versos])
  const fijas = useMemo(() => new Set((ronda.fijas ?? []).map(norma)), [ronda.fijas])
  const ultima = r === rondas.length - 1
  const respondida = resultado !== null

  useEffect(() => {
    if (!respondida) {
      const unidades = unidad === 'silaba' ? 'sílabas' : 'palabras'
      setAccion({
        label: 'Comprobar',
        disabled: marcadas.size === 0,
        ayuda: marcadas.size === 0 ? (unidad === 'silaba' ? 'Toca las sílabas' : 'Toca las palabras') : null,
        feedback: aviso
          ? {
              tipo: 'mal',
              titulo: aviso.faltan ? `Te falta${aviso.faltan === 1 ? '' : 'n'} ${aviso.faltan}.` : `Sobraba${aviso.sobran === 1 ? '' : 'n'} ${aviso.sobran}.`,
              texto: aviso.faltan
                ? `Las verdes ya están.${aviso.sobran ? ` Quité ${aviso.sobran} que no iba${aviso.sobran === 1 ? '' : 'n'}.` : ''} Busca las ${unidades} que faltan.`
                : 'Las verdes ya están: comprueba otra vez.',
            }
          : null,
        onClick: () => {
          const buenas = [...marcadas].filter((k) => correctas.has(k))
          const bien = marcadas.size === correctas.size && buenas.length === correctas.size
          if (!bien && !aviso) {
            // Primer intento con errores: las bien se quedan (verdes) y las que sobraban se desmarcan.
            setFijasBien(new Set(buenas))
            setMarcadas(new Set(buenas))
            setAviso({ faltan: correctas.size - buenas.length, sobran: marcadas.size - buenas.length })
            return
          }
          const total = aciertos + (bien && !aviso ? 1 : 0)
          setAciertos(total)
          setResultado(bien ? 'bien' : 'mal')
          if (!bien) fallo?.(r)
          if (ultima) completar({ aciertos: total, total: rondas.length })
        },
      })
      return
    }
    setAccion({
      label: 'Continuar',
      avanza: ultima,
      feedback:
        resultado === 'bien'
          ? { tipo: 'bien', titulo: '¡Correcto!', texto: ronda.explicacion }
          : { tipo: 'error', titulo: 'Las que faltaban van en rojo', texto: ronda.explicacion },
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setMarcadas(new Set())
        setFijasBien(new Set())
        setAviso(null)
        setResultado(null)
      },
    })
  }, [respondida, resultado, marcadas, aviso, correctas, aciertos, ultima, r, ronda, rondas.length, unidad, setAccion, siguiente, completar, fallo])

  const alternar = (clave) => {
    if (respondida || fijasBien.has(clave)) return
    setMarcadas((m) => {
      const n = new Set(m)
      if (n.has(clave)) n.delete(clave)
      else n.add(clave)
      return n
    })
  }

  /** Estado de una pieza tocable: 'bien' | 'falta' | 'sobra' | 'marcada' | null. */
  const estadoDe = (clave) => {
    const m = marcadas.has(clave)
    if (!respondida) return fijasBien.has(clave) ? 'bien' : m ? 'marcada' : null
    if (correctas.has(clave)) return m ? 'bien' : 'falta'
    return m ? 'sobra' : null
  }

  return (
    <div className="flex flex-col gap-6">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />
      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-5">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          <Rich>{ronda.pregunta}</Rich>
        </p>
        <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4" data-marcar={unidad}>
          {versos.map((v, iv) => (
            <div key={iv} className="flex flex-wrap items-center gap-x-1.5 gap-y-2" data-verso-marcar={iv}>
              {v.palabras.map((p, ip) => {
                const debil = p.silabas.length === 1 && DEBILES.has(limpiar(p.texto))
                if (unidad === 'palabra') {
                  const clave = norma(p.texto)
                  if (fijas.has(clave)) return <Pieza key={ip} texto={p.texto} estado="fija" color={color} />
                  // Las palabras débiles (la, de, con…) se ven como texto: nunca son la respuesta y así el verso cabe.
                  if (debil && !correctas.has(clave)) return <Pieza key={ip} texto={p.texto} estado="debil" color={color} />
                  return <Pieza key={ip} texto={p.texto} estado={estadoDe(clave)} color={color} onClick={() => alternar(clave)} data-pieza={p.texto} />
                }
                // Sílabas: la palabra es un grupo de piezas pegadas; las débiles se ven pero no se tocan.
                if (debil) return <Pieza key={ip} texto={p.texto} estado="debil" color={color} />
                return (
                  <span key={ip} className="inline-flex gap-1" data-palabra-silabas={p.texto}>
                    {p.silabas.map((s, is) => {
                      const clave = `${iv}.${ip}.${is}`
                      return <Pieza key={is} texto={s} estado={estadoDe(clave)} color={color} chica onClick={() => alternar(clave)} data-pieza={clave} />
                    })}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/** Normaliza una palabra para compararla (minúsculas; sin tildes no se toca: «tú» ≠ «tu»). */
const norma = (t) => t.toLowerCase()

function clavesCorrectas(ronda, versos) {
  if ((ronda.unidad ?? 'palabra') === 'palabra') return new Set(ronda.correctas.map(norma))
  if (ronda.correctas !== 'tonicas') return new Set(ronda.correctas)
  const claves = new Set()
  versos.forEach((v, iv) =>
    v.palabras.forEach((p, ip) => {
      if (p.silabas.length === 1 && DEBILES.has(limpiar(p.texto))) return
      claves.add(`${iv}.${ip}.${p.tonica}`)
    }),
  )
  return claves
}

/** Una palabra o sílaba tocable (botón grande de 44 px) con su estado. */
function Pieza({ texto, estado, color, chica = false, onClick, ...resto }) {
  const estilos = {
    marcada: { backgroundColor: color, color: 'var(--color-blanco)', borderColor: color },
    bien: { backgroundColor: 'var(--color-bien-suave)', color: 'var(--color-bien-tinta)', borderColor: 'var(--color-bien)' },
    falta: { backgroundColor: 'var(--color-mal-suave)', color: 'var(--color-mal-tinta)', borderColor: 'var(--color-mal)' },
    sobra: { color: 'var(--color-zinc-400)', borderColor: 'var(--color-zinc-200)', textDecoration: 'line-through' },
    fija: { backgroundColor: 'var(--color-zinc-100)', color: tinta(color), borderColor: 'transparent' },
  }
  const clase = `inline-flex min-h-11 items-center gap-1 rounded-xl border-2 text-lg font-semibold leading-none ${chica ? 'px-1.5' : 'px-2'}`
  if (!onClick) {
    return (
      <span className={`${clase} ${estado === 'debil' ? 'border-transparent px-0.5 font-normal text-zinc-400' : ''}`} style={estilos[estado]}>
        {texto}
      </span>
    )
  }
  return (
    <Pulsable
      onClick={onClick}
      aria-pressed={estado === 'marcada' || estado === 'bien' || estado === 'sobra'}
      animate={estado === 'bien' ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={RESORTE.pulsar}
      className={`${clase} transition-colors duration-150`}
      style={estilos[estado] ?? { borderColor: 'var(--color-zinc-200)', color: 'var(--color-zinc-800)' }}
      data-estado={estado ?? undefined}
      {...resto}
    >
      {estado === 'bien' && <Check className="size-4" />}
      {estado === 'falta' && <Repaso className="size-4" />}
      {texto}
    </Pulsable>
  )
}
