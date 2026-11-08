import { useCallback, useEffect, useState } from 'react'
import { playNotes } from '../../audio/engine.js'
import { compararAltura, frecuencia, hz, midi, nombre } from '../../theory/notas.js'
import BotonSonido from '../BotonSonido.jsx'
import Piano from '../Piano.jsx'

/**
 * "Toca en el teclado": el usuario responde tocando el Piano.
 *
 * paso.piano: props del Piano ({ startOctave, octaves }).
 * paso.objetivo:
 *  - { tipo: 'explorar', cantidad: 5 }  → tocar N teclas distintas
 *  - { tipo: 'extremos' }               → tocar la tecla más grave y la más aguda
 *  - { tipo: 'comparar', rondas: [{ referencia: 'G4', direccion: 'agudo' | 'grave' }] }
 *  - { tipo: 'octavas', rondas: [{ nota: 'A' }] }   → tocar esa nota en TODAS las octavas del teclado
 */
export default function TocaEnPiano(props) {
  const { objetivo } = props.paso
  if (objetivo.tipo === 'explorar') return <Explorar {...props} />
  if (objetivo.tipo === 'extremos') return <Extremos {...props} />
  if (objetivo.tipo === 'comparar') return <Comparar {...props} />
  if (objetivo.tipo === 'octavas') return <Octavas {...props} />
  return <p>Objetivo desconocido: {objetivo.tipo}</p>
}

function rango(piano = {}) {
  const start = piano.startOctave ?? 4
  const octaves = piano.octaves ?? 2
  return { grave: `C${start}`, aguda: `B${start + octaves - 1}` }
}

function Explorar({ paso, setAccion, siguiente }) {
  const cantidad = paso.objetivo.cantidad ?? 5
  const [tocadas, setTocadas] = useState([])
  const listo = tocadas.length >= cantidad

  const onNoteOn = useCallback((nota) => {
    setTocadas((prev) => (prev.includes(nota) ? prev : [...prev, nota]))
  }, [])

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      disabled: !listo,
      ayuda: listo ? null : `Toca ${cantidad} teclas distintas (${tocadas.length}/${cantidad})`,
      feedback: listo
        ? {
            tipo: 'bien',
            titulo: '¡Eso es!',
            texto: paso.objetivo.mensaje ?? 'Cuanto más a la derecha, más rápido vibra la cuerda del piano y más aguda suena la nota.',
          }
        : null,
      onClick: siguiente,
    })
  }, [listo, tocadas.length, cantidad, paso.objetivo.mensaje, setAccion, siguiente])

  const ultima = tocadas[tocadas.length - 1]

  return (
    <div className="flex flex-col gap-3">
      <UltimaNota nota={ultima} />
      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} />
    </div>
  )
}

function Extremos({ paso, setAccion, siguiente }) {
  const { grave, aguda } = rango(paso.piano)
  const [encontradas, setEncontradas] = useState({ grave: false, aguda: false })
  const listo = encontradas.grave && encontradas.aguda

  const onNoteOn = useCallback(
    (nota) => {
      if (nota === grave) setEncontradas((e) => ({ ...e, grave: true }))
      if (nota === aguda) setEncontradas((e) => ({ ...e, aguda: true }))
    },
    [grave, aguda],
  )

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      disabled: !listo,
      ayuda: listo ? null : 'Busca en los dos extremos del teclado',
      feedback: listo
        ? {
            tipo: 'bien',
            titulo: '¡Encontradas!',
            texto: `La más grave es **${nombre(grave)}** (${hz(frecuencia(grave))}) y la más aguda **${nombre(aguda)}** (${hz(frecuencia(aguda))}). ¡La aguda vibra unas ${Math.round(frecuencia(aguda) / frecuencia(grave))} veces más rápido!`,
          }
        : null,
      onClick: siguiente,
    })
  }, [listo, grave, aguda, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3">
        <Check ok={encontradas.grave}>La más grave</Check>
        <Check ok={encontradas.aguda}>La más aguda</Check>
      </ul>
      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} />
    </div>
  )
}

function UltimaNota({ nota }) {
  return (
    <p className="min-h-6 text-base text-zinc-500" aria-live="polite">
      {nota ? (
        <>
          Última: <span className="font-semibold text-zinc-800">{nombre(nota)}</span> · {hz(frecuencia(nota))}
        </>
      ) : (
        'Toca el piano…'
      )}
    </p>
  )
}

function Check({ ok, children }) {
  return (
    <li
      className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2 text-base font-medium ${
        ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-zinc-200 bg-white text-zinc-500'
      }`}
    >
      <span aria-hidden>{ok ? '✓' : '○'}</span>
      {children}
    </li>
  )
}

function Comparar({ paso, setAccion, siguiente, completar }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [intento, setIntento] = useState(null) // { nota, ok }
  const [fallos, setFallos] = useState(0) // fallos en la ronda actual
  const [aciertos, setAciertos] = useState(0) // rondas resueltas al primer intento
  const ronda = rondas[r]
  const resuelta = intento?.ok === true
  const ultima = r === rondas.length - 1
  const palabra = ronda.direccion === 'agudo' ? 'más aguda' : 'más grave'

  const onNoteOn = useCallback(
    (nota) => {
      if (resuelta) return
      const dif = compararAltura(nota, ronda.referencia)
      const ok = ronda.direccion === 'agudo' ? dif > 0 : dif < 0
      setIntento({ nota, ok, dif })
      if (ok) {
        const total = aciertos + (fallos === 0 ? 1 : 0)
        setAciertos(total)
        if (ultima) completar({ aciertos: total, total: rondas.length })
      } else {
        setFallos((f) => f + 1)
      }
    },
    [resuelta, ronda, aciertos, fallos, ultima, rondas.length, completar],
  )

  useEffect(() => {
    let feedback = null
    if (intento) {
      const n = nombre(intento.nota)
      const ref = nombre(ronda.referencia)
      if (intento.ok) {
        feedback = {
          tipo: 'bien',
          titulo: '¡Bien!',
          texto: `**${n}** es ${palabra} que ${ref}: está a su ${ronda.direccion === 'agudo' ? 'derecha' : 'izquierda'}.`,
        }
      } else if (intento.dif === 0) {
        feedback = { tipo: 'mal', titulo: 'Es la misma nota.', texto: `Busca una ${palabra} que ${ref}.` }
      } else {
        feedback = {
          tipo: 'mal',
          titulo: 'Casi.',
          texto: `${n} es ${intento.dif > 0 ? 'más aguda' : 'más grave'} que ${ref}. Prueba hacia la ${ronda.direccion === 'agudo' ? 'derecha' : 'izquierda'}.`,
        }
      }
    }

    setAccion({
      label: ultima ? 'Continuar' : 'Siguiente',
      disabled: !resuelta,
      ayuda: resuelta || intento ? null : `Toca una nota ${palabra} que ${nombre(ronda.referencia)}`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        const next = rondas[r + 1]
        setR(r + 1)
        setIntento(null)
        setFallos(0)
        playNotes(next.referencia)
      },
    })
  }, [intento, resuelta, ultima, palabra, ronda, rondas, r, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      {rondas.length > 1 && (
        <div className="flex items-center gap-2" aria-label={`Ronda ${r + 1} de ${rondas.length}`}>
          {rondas.map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < r || (i === r && resuelta) ? 'bg-zinc-800' : i === r ? 'bg-zinc-400' : 'bg-zinc-200'}`}
            />
          ))}
        </div>
      )}

      <div key={r} className="animate-entrada flex items-center justify-between gap-3">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          Toca una nota <span className="underline decoration-amber-400 decoration-4 underline-offset-4">{palabra}</span>{' '}
          que <span className="rounded-md bg-amber-200 px-1.5">{nombre(ronda.referencia)}</span>
        </p>
        <BotonSonido
          sonido={{ notas: [ronda.referencia] }}
          etiqueta={nombre(ronda.referencia)}
          className="min-h-12 shrink-0 py-1.5 pl-2 pr-4"
        />
      </div>

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={[ronda.referencia]} />
    </div>
  )
}

/** La misma nota (p. ej. 'A') en cada octava del teclado: ['A3', 'A4', 'A5']. */
function enCadaOctava(nota, piano = {}) {
  const start = piano.startOctave ?? 4
  const octaves = piano.octaves ?? 2
  return Array.from({ length: octaves }, (_, i) => `${nota}${start + i}`)
}

const mismaNota = (a, b) => (midi(a) - midi(b)) % 12 === 0

function Octavas({ paso, setAccion, siguiente, completar }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [encontradas, setEncontradas] = useState([])
  const [intento, setIntento] = useState(null) // { nota, tipo: 'nueva' | 'repetida' | 'otra' }
  const [fallos, setFallos] = useState(0) // fallos en la ronda actual
  const [aciertos, setAciertos] = useState(0) // rondas sin fallos
  const ronda = rondas[r]
  const objetivos = enCadaOctava(ronda.nota, paso.piano)
  const listo = encontradas.length === objetivos.length
  const ultima = r === rondas.length - 1
  const nombreSolo = nombre(objetivos[0], { octava: false })

  const onNoteOn = useCallback(
    (nota) => {
      if (listo) return
      if (!mismaNota(nota, objetivos[0])) {
        setFallos((f) => f + 1)
        setIntento({ nota, tipo: 'otra' })
        return
      }
      const objetivo = objetivos.find((o) => midi(o) === midi(nota))
      if (encontradas.includes(objetivo)) {
        setIntento({ nota, tipo: 'repetida' })
        return
      }
      const nuevas = [...encontradas, objetivo]
      setEncontradas(nuevas)
      setIntento({ nota, tipo: 'nueva' })
      if (nuevas.length === objetivos.length) {
        const total = aciertos + (fallos === 0 ? 1 : 0)
        setAciertos(total)
        if (ultima) completar({ aciertos: total, total: rondas.length })
      }
    },
    [listo, objetivos, encontradas, aciertos, fallos, ultima, rondas.length, completar],
  )

  useEffect(() => {
    let feedback = null
    if (listo) {
      const lista = objetivos.map((o) => `**${nombre(o)}** (${hz(frecuencia(o))})`).join(', ')
      feedback = {
        tipo: 'bien',
        titulo: `¡Todas las ${nombreSolo}!`,
        texto: `${lista}. Mismo nombre, distinta octava: cada una vibra el **doble** de rápido que la anterior.`,
      }
    } else if (intento?.tipo === 'otra') {
      feedback = {
        tipo: 'mal',
        titulo: `Esa es ${nombre(intento.nota)}.`,
        texto: ronda.pista ?? `Buscamos **${nombreSolo}**. Fíjate en el nombre de las teclas.`,
      }
    } else if (intento?.tipo === 'repetida') {
      feedback = { tipo: 'mal', titulo: `Ya tienes ${nombre(intento.nota)}.`, texto: 'Busca la misma nota en otra octava, más a la izquierda o a la derecha.' }
    }

    setAccion({
      label: ultima ? 'Continuar' : 'Siguiente',
      disabled: !listo,
      ayuda: listo || feedback ? null : `Toca todas las ${nombreSolo} (${encontradas.length}/${objetivos.length})`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setEncontradas([])
        setIntento(null)
        setFallos(0)
      },
    })
  }, [listo, intento, ronda, objetivos, encontradas.length, nombreSolo, ultima, r, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      {rondas.length > 1 && (
        <div className="flex items-center gap-2" aria-label={`Ronda ${r + 1} de ${rondas.length}`}>
          {rondas.map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < r || (i === r && listo) ? 'bg-zinc-800' : i === r ? 'bg-zinc-400' : 'bg-zinc-200'}`}
            />
          ))}
        </div>
      )}

      <p key={r} className="animate-entrada text-lg font-semibold leading-snug sm:text-2xl">
        Toca <span className="underline decoration-amber-400 decoration-4 underline-offset-4">todas</span> las{' '}
        <span className="rounded-md bg-amber-200 px-1.5">{nombreSolo}</span> del teclado
      </p>

      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${objetivos.length}, minmax(0, 1fr))` }}>
        {objetivos.map((o) => (
          <Check key={o} ok={encontradas.includes(o)}>
            {nombre(o)}
          </Check>
        ))}
      </ul>

      {listo && (
        <BotonSonido
          sonido={{ notas: objetivos, intervalo: 0.6 }}
          etiqueta={`Escuchar las ${objetivos.length} ${nombreSolo}`}
          className="animate-entrada"
        />
      )}

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={encontradas} />
    </div>
  )
}
