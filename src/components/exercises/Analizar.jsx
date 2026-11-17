import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { pararProgramado } from '../../audio/engine.js'
import { reproducir } from '../../audio/sonido.js'
import { acentoLeccion } from '../../content/index.js'
import { funcionDe } from '../../theory/acordes.js'
import { nombre } from '../../theory/notas.js'
import { oscuro, tinta } from '../../ui/color.js'
import { Check, Repaso } from '../../ui/Iconos.jsx'
import { ENTRA_DERECHA, RESORTE, SALTO } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import BotonSonido from '../BotonSonido.jsx'
import { fondoFuncion } from '../MapaFunciones.jsx'
import Rich from '../Rich.jsx'
import Rondas from './Rondas.jsx'

/** Los números que se ofrecen por defecto (el vii° casi no sale en las canciones). */
const OPCIONES = ['I', 'ii', 'iii', 'IV', 'V', 'vi']
/** La función (T · S · D) de un grado, sin su séptima: 'V7' → 'D'. */
const funcionGrado = (grado) => funcionDe(String(grado).replace(/maj7|7$/, '')) ?? 'T'

/** La pista del primer error, sin dar el número: el bajo del compás que falló (o, con varios, a qué escuchar). */
function pistaDe(compases, mal) {
  if (mal.length === 1) {
    const i = mal[0]
    return `Compás ${i + 1}: su bajo es **${nombre(compases[i].notas[0], { octava: false })}**. Cuenta desde la casa.`
  }
  const lista = mal.map((i) => i + 1)
  return `Compases ${lista.slice(0, -1).join(', ')} y ${lista.at(-1)}: tócalos solos, sigue su bajo y cuenta desde la casa.`
}

/**
 * «Analiza la rejilla» (O9, lección 5.7): la rejilla de compases de la 5.5, pero por llenar. Suena la progresión y cada
 * compás se enciende al sonar; la casa (y los que digan `dados`) vienen puestos. Se toca un compás vacío y luego su
 * número: la casilla toma el fondo de su función y el cursor salta al siguiente vacío. Tocar un compás toca su acorde.
 * El cifrado sale al comprobar (antes delataría la respuesta).
 *
 * paso.opciones: los números de abajo (por defecto I ii iii IV V vi)
 * paso.rondas: [{ pregunta, compases: [{ cifrado, grado, notas }], dados: [0], sonido: { notas: [un acorde por compás…] },
 *   pista?, explicacion }] (sin `pista`, la del primer error dice el bajo del compás que falló)
 * «Ahora sí se puede fallar»: al primer «Comprobar», los bien se quedan fijos (verde ✓) y los mal vuelven vacíos en oro
 * (con el número equivocado tachado); al segundo, los que siguen mal enseñan el correcto en ROJO y la ronda va al repaso.
 * Puntúa un compás por acierto (al primer «Comprobar»).
 */
export default function Analizar({ paso, leccionId, setAccion, siguiente, completar, fallo }) {
  const color = acentoLeccion(leccionId)
  const rondas = paso.rondas
  const opciones = paso.opciones ?? OPCIONES
  const [r, setR] = useState(0)
  const ronda = rondas[r]
  const n = ronda.compases.length
  const dados = ronda.dados ?? [0]
  const inicial = () => ronda.compases.map((c, i) => (dados.includes(i) ? c.grado : null))
  const [puestos, setPuestos] = useState(inicial)
  const [fijos, setFijos] = useState(() => ronda.compases.map((_, i) => dados.includes(i)))
  const [tachados, setTachados] = useState(() => Array(n).fill(null)) // el número equivocado del primer intento (oro)
  const [cursor, setCursor] = useState(() => ronda.compases.findIndex((_, i) => !dados.includes(i)))
  const [segundo, setSegundo] = useState(false)
  const [resultado, setResultado] = useState(null) // null | [bool por compás]
  const [aciertos, setAciertos] = useState(0)
  const [actual, setActual] = useState(-1) // compás que suena con «Escuchar»
  const [suelto, setSuelto] = useState(null) // compás que suena solo
  useEffect(() => () => pararProgramado(), [])

  const respondida = resultado !== null
  const ultima = r === rondas.length - 1
  const porLlenar = ronda.compases.map((_, i) => i).filter((i) => !dados.includes(i))
  const faltan = puestos.filter((g) => g === null).length
  const total = rondas.reduce((s, x) => s + x.compases.length - (x.dados ?? [0]).length, 0)
  const encendido = suelto ?? actual

  const tocarCompas = (i) => {
    setActual(-1)
    setSuelto(i)
    reproducir({ notas: [ronda.compases[i].notas], duracion: 1.1 }, { alParar: () => setSuelto((x) => (x === i ? null : x)) })
    if (!respondida && !fijos[i]) setCursor(i)
  }

  /** El siguiente compás vacío después de `i` (dando la vuelta), o -1. */
  const siguienteVacio = (lista, i) => {
    for (let k = 1; k <= n; k++) {
      const j = (i + k) % n
      if (lista[j] === null && !fijos[j]) return j
    }
    return -1
  }

  const poner = (g) => {
    if (respondida || cursor < 0) return
    const nuevos = [...puestos]
    nuevos[cursor] = g
    setPuestos(nuevos)
    setCursor(siguienteVacio(nuevos, cursor))
  }

  useEffect(() => {
    if (!respondida) {
      setAccion({
        label: 'Comprobar',
        disabled: faltan > 0,
        ayuda: faltan === porLlenar.length && !segundo ? 'Toca un compás y luego su número' : faltan > 0 ? `Falta${faltan === 1 ? '' : 'n'} ${faltan}` : null,
        feedback: segundo
          ? {
              tipo: 'mal',
              titulo: `${porLlenar.filter((i) => fijos[i]).length} de ${porLlenar.length} bien`,
              texto: ronda.pista ?? pistaDe(ronda.compases, porLlenar.filter((i) => !fijos[i])),
            }
          : null,
        onClick: () => {
          const bien = ronda.compases.map((c, i) => puestos[i] === c.grado)
          const buenas = porLlenar.filter((i) => bien[i]).length
          if (!segundo && buenas < porLlenar.length) {
            setAciertos(aciertos + buenas)
            setFijos(bien.map((b, i) => b || dados.includes(i)))
            setTachados(puestos.map((g, i) => (bien[i] ? null : g)))
            const vacios = puestos.map((g, i) => (bien[i] ? g : null))
            setPuestos(vacios)
            setCursor(vacios.findIndex((g) => g === null))
            setSegundo(true)
            return
          }
          const suma = segundo ? aciertos : aciertos + buenas
          setAciertos(suma)
          setResultado(bien)
          setCursor(-1)
          if (buenas < porLlenar.length) fallo?.(r)
          if (ultima) completar({ aciertos: suma, total })
        },
      })
      return
    }
    const buenas = porLlenar.filter((i) => resultado[i]).length
    setAccion({
      label: 'Continuar',
      avanza: ultima,
      feedback:
        buenas === porLlenar.length
          ? { tipo: 'bien', titulo: '¡Análisis completo!', texto: ronda.explicacion }
          : { tipo: 'error', titulo: `${buenas} de ${porLlenar.length} bien`, texto: ronda.explicacion ?? 'Los rojos ya llevan su número: escúchalos otra vez.' },
      onClick: () => {
        if (ultima) return siguiente()
        const sig = rondas[r + 1]
        const d = sig.dados ?? [0]
        setR(r + 1)
        setPuestos(sig.compases.map((c, i) => (d.includes(i) ? c.grado : null)))
        setFijos(sig.compases.map((_, i) => d.includes(i)))
        setTachados(Array(sig.compases.length).fill(null))
        setCursor(sig.compases.findIndex((_, i) => !d.includes(i)))
        setSegundo(false)
        setResultado(null)
        setActual(-1)
        setSuelto(null)
      },
    })
  }, [respondida, resultado, puestos, fijos, segundo, faltan, aciertos, ultima, r, ronda, rondas, total, porLlenar, dados, setAccion, siguiente, completar, fallo])

  /** Estado de cada casilla: 'dado' | 'bien' | 'mal' | 'puesto' | 'oro' (vacía tras fallar) | 'vacio'. */
  const estado = (i) => {
    if (dados.includes(i)) return 'dado'
    if (respondida) return resultado[i] ? 'bien' : 'mal'
    if (fijos[i]) return 'bien'
    if (puestos[i] !== null) return 'puesto'
    return tachados[i] ? 'oro' : 'vacio'
  }

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-3">
        {ronda.pregunta && (
          <p className="text-xl font-semibold leading-snug sm:text-2xl">
            <Rich>{ronda.pregunta}</Rich>
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-3" data-analizar>
          <BotonSonido
            sonido={ronda.sonido}
            etiqueta={ronda.sonido.etiqueta ?? 'Escuchar'}
            className="w-full"
            onPlay={() => setSuelto(null)}
            onNotas={(_, i) => setActual(i)}
            onParar={() => setActual(-1)}
          />
          <div className="grid grid-cols-4 gap-1.5" role="list">
            {ronda.compases.map((c, i) => {
              const e = estado(i)
              const on = encendido === i
              const elegido = cursor === i && !respondida
              const grado = e === 'mal' || e === 'dado' || e === 'bien' ? c.grado : puestos[i]
              const conCifrado = e === 'dado' || e === 'bien' || e === 'mal'
              const fondo = on
                ? oscuro(color)
                : e === 'mal'
                  ? 'var(--color-mal-suave)'
                  : e === 'oro'
                    ? 'var(--color-fijate-suave)'
                    : grado
                      ? fondoFuncion(color, funcionGrado(grado))
                      : 'transparent'
              const borde = on
                ? oscuro(color)
                : elegido
                  ? 'var(--color-zinc-900)'
                  : e === 'bien'
                    ? 'var(--color-bien)'
                    : e === 'mal'
                      ? 'var(--color-mal)'
                      : e === 'oro'
                        ? 'var(--color-fijate)'
                        : e === 'vacio'
                          ? 'var(--color-zinc-300)'
                          : 'transparent'
              const texto = on ? 'text-blanco' : e === 'mal' ? 'text-mal-tinta' : ''
              return (
                <Pulsable
                  key={`${r}-${i}`}
                  tipo="tarjeta"
                  role="listitem"
                  onClick={() => tocarCompas(i)}
                  aria-label={`Compás ${i + 1}: ${grado ? `el ${grado}${conCifrado ? `, ${c.cifrado}` : ''}` : 'sin número'}${elegido ? ', elegido' : ''}`}
                  data-compas={i + 1}
                  data-estado={e}
                  data-elegido={elegido || undefined}
                  data-suena={on || undefined}
                  className="min-w-0"
                >
                  <motion.span
                    animate={on ? { scale: 1.06 } : e === 'bien' ? SALTO : { scale: elegido ? 1.04 : 1 }}
                    transition={e === 'bien' && !on ? { duration: 0.35 } : RESORTE.pulsar}
                    className={`relative flex min-h-[4.5rem] flex-col items-center justify-center rounded-2xl border-2 px-1 pb-1.5 pt-3 transition-colors duration-150 ${e === 'vacio' && !elegido ? 'border-dashed' : ''}`}
                    style={{ background: fondo, borderColor: borde }}
                  >
                    <span className={`absolute left-1.5 top-1 font-dato text-xs leading-none ${on ? 'text-blanco' : 'text-zinc-500'}`}>{i + 1}</span>
                    {(e === 'bien' || e === 'mal') && !on && (
                      <span className={`absolute right-1 top-1 ${e === 'bien' ? 'text-bien-tinta' : 'text-mal-tinta'}`}>
                        {e === 'bien' ? <Check className="size-3.5" /> : <Repaso className="size-3.5" />}
                      </span>
                    )}
                    {grado ? (
                      <>
                        <span className={`font-titulo text-xl font-extrabold leading-tight ${texto}`} style={on || e === 'mal' ? undefined : { color: tinta(color) }}>
                          {grado}
                        </span>
                        {conCifrado && <span className={`font-dato text-sm leading-none ${on ? 'text-blanco' : e === 'mal' ? 'text-mal-tinta' : 'text-zinc-600'}`}>{c.cifrado}</span>}
                      </>
                    ) : (
                      <>
                        <span className={`font-titulo text-xl font-extrabold leading-tight ${on ? 'text-blanco' : 'text-zinc-500'}`}>?</span>
                        {e === 'oro' && (
                          <span className={`font-dato text-sm leading-none line-through ${on ? 'text-blanco' : 'text-fijate-tinta'}`} data-tachado>
                            {tachados[i]}
                          </span>
                        )}
                      </>
                    )}
                  </motion.span>
                </Pulsable>
              )
            })}
          </div>
        </div>

        {!respondida && (
          <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Números">
            {opciones.map((g) => {
              const f = funcionGrado(g)
              return (
                <Pulsable
                  key={g}
                  tipo="tarjeta"
                  onClick={() => poner(g)}
                  disabled={cursor < 0}
                  aria-label={`Grado ${g}`}
                  data-opcion={g}
                  className="flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-transparent leading-none disabled:opacity-50"
                  style={{ background: fondoFuncion(color, f) }}
                >
                  <span className="font-titulo text-xl font-extrabold" style={{ color: tinta(color) }}>
                    {g}
                  </span>
                  <span className="mt-1 font-dato text-xs text-zinc-600">{f}</span>
                </Pulsable>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
