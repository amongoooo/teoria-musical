import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playNotes } from '../../audio/engine.js'
import { Note } from 'tonal'
import {
  conArticulo,
  datosIntervalo,
  entre,
  formula,
  mismaTecla,
  nombreDistancia,
  notaIntervalo,
  pasoDesde,
  semitonos,
} from '../../theory/intervalos.js'
import { compararAltura, frecuencia, hz, midi, nombre } from '../../theory/notas.js'
import BotonSonido from '../BotonSonido.jsx'
import { BRILLO_MS, ENTRA_DERECHA, POP, SALTO, SUBE } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import useTemblor from '../../ui/useTemblor.js'
import Piano from '../Piano.jsx'
import Rondas from './Rondas.jsx'

/**
 * "Toca en el teclado": el usuario responde tocando el Piano.
 *
 * paso.piano: props del Piano ({ startOctave, octaves }).
 * paso.objetivo:
 *  - { tipo: 'explorar', cantidad: 5 }  → tocar N teclas distintas
 *  - { tipo: 'extremos' }               → tocar la tecla más grave y la más aguda
 *  - { tipo: 'comparar', rondas: [{ referencia: 'G4', direccion: 'agudo' | 'grave' }] }
 *  - { tipo: 'octavas', rondas: [{ nota: 'A' }] }   → tocar esa nota en TODAS las octavas del teclado
 *  - { tipo: 'paso', rondas: [{ desde: 'E4', paso: 'S' | 'T', direccion: 'sube' | 'baja' }] }
 *    (o `intervalo: '3M'` en lugar de `paso`: construir un intervalo con nombre de Tonal)
 *        → tocar la nota a un semitono / un tono de `desde`
 *  - { tipo: 'formula', rondas: [{ desde: 'C4', pasos: ['T','T','S',…], nombre }] }
 *        → tocar en orden las notas que salen de aplicar la fórmula de pasos desde `desde`
 */
export default function TocaEnPiano(props) {
  const { objetivo } = props.paso
  if (objetivo.tipo === 'explorar') return <Explorar {...props} />
  if (objetivo.tipo === 'extremos') return <Extremos {...props} />
  if (objetivo.tipo === 'comparar') return <Comparar {...props} />
  if (objetivo.tipo === 'octavas') return <Octavas {...props} />
  if (objetivo.tipo === 'paso') return <Paso {...props} />
  if (objetivo.tipo === 'formula') return <Formula {...props} />
  return <p>Objetivo desconocido: {objetivo.tipo}</p>
}

function rango(piano = {}) {
  const start = piano.startOctave ?? 4
  const octaves = piano.octaves ?? 2
  return { grave: `C${start}`, aguda: `B${start + octaves - 1}` }
}

/**
 * Notas señaladas (pedido del usuario: al pulsar «Escuchar…», cada nota se indica en el teclado y en las
 * casillas mientras suena). `senalar(notas)` → `senal` = { notas, n, activa }: el Piano la recibe en `senalar`
 * (va a su octava e ilumina las teclas) y las casillas miran `suena(nota)` (true durante BRILLO_MS); `i` = qué
 * nota del sonido es (la fila de la fórmula marca esa casilla).
 */
function useSenal() {
  const [senal, setSenal] = useState(null)
  const t = useRef(null)
  useEffect(() => () => clearTimeout(t.current), [])
  const senalar = useCallback((notas, i = null) => {
    const lista = Array.isArray(notas) ? notas : [notas]
    setSenal((s) => ({ notas: lista, i, n: (s?.n ?? 0) + 1, activa: true }))
    clearTimeout(t.current)
    t.current = setTimeout(() => setSenal((s) => s && { ...s, activa: false }), BRILLO_MS)
  }, [])
  const suena = (nota) => Boolean(senal?.activa && senal.notas.some((n) => midi(n) === midi(nota)))
  return { senal, senalar, suena }
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
      avanza: true,
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
  const [sacudidas, setSacudidas] = useState({}) // { grave: 2 }: veces que se volvió a tocar una ya encontrada
  const listo = encontradas.grave && encontradas.aguda

  const onNoteOn = useCallback(
    (nota) => {
      const cual = nota === grave ? 'grave' : nota === aguda ? 'aguda' : null
      if (!cual) return
      if (encontradas[cual]) setSacudidas((s) => ({ ...s, [cual]: (s[cual] ?? 0) + 1 }))
      else setEncontradas((e) => ({ ...e, [cual]: true }))
    },
    [grave, aguda, encontradas],
  )

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      avanza: true,
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
        <Casilla ok={encontradas.grave} sacude={sacudidas.grave}>La más grave</Casilla>
        <Casilla ok={encontradas.aguda} sacude={sacudidas.aguda}>La más aguda</Casilla>
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

/**
 * Casilla de un objetivo del teclado («La3», «La más grave»…). Pedido del usuario: sin ✓ ni círculo, más
 * grande; al conseguirla da un «pop» y se rellena de verde (el relleno sólido es la segunda señal además del color).
 * `sacude` (un contador): cada vez que sube, la casilla tiembla (`useTemblor`: se tocó otra vez en el piano una
 * nota ya conseguida, así se ve cuál es).
 * Con `onTocar` la casilla también es un botón (`etiqueta` = su nombre para lectores de pantalla).
 * `sonando`: su nota suena ahora («Escuchar…»): aro celeste (el color de «suena», como la tecla) y un `SALTO`.
 */
function Casilla({ ok, sacude = 0, sonando = false, onTocar, etiqueta, children }) {
  const [ref, temblar] = useTemblor()
  useEffect(() => {
    if (sacude > 0) temblar()
  }, [sacude, temblar])
  const caja = (
    <motion.div initial={false} animate={sonando ? SALTO : { scale: 1 }} transition={{ duration: 0.3 }}>
      <motion.div
        initial={false}
        animate={ok ? POP : { scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        data-sonando={sonando || undefined}
        className={`grid min-h-16 place-items-center rounded-2xl border-2 px-3 py-2 text-center text-xl font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 ${
          ok ? 'border-bien-relleno bg-bien-relleno text-blanco' : 'border-zinc-200 bg-white text-zinc-700'
        } ${sonando ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''}`}
      >
        <span>
          {children}
          {ok && !onTocar && <span className="sr-only"> (conseguida)</span>}
        </span>
      </motion.div>
    </motion.div>
  )
  return (
    <li ref={ref}>
      {onTocar ? (
        <Pulsable onClick={onTocar} aria-label={etiqueta} data-casilla={ok ? 'ok' : 'pendiente'} className="block w-full rounded-2xl">
          {caja}
        </Pulsable>
      ) : (
        caja
      )}
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
  const { senal, senalar } = useSenal()

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
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
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
      <Rondas total={rondas.length} actual={r} hecha={resuelta} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          Toca una nota <span className="underline decoration-fijate decoration-4 underline-offset-4">{palabra}</span>{' '}
          que <span className="rounded-md bg-fijate-claro px-1.5">{nombre(ronda.referencia)}</span>
        </p>
        <BotonSonido
          sonido={{ notas: [ronda.referencia] }}
          etiqueta={nombre(ronda.referencia)}
          onNotas={senalar}
          className="min-h-12 shrink-0 py-1.5 pl-2 pr-4"
        />
      </motion.div>

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={[ronda.referencia]} senalar={senal} />
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
  const [sacudidas, setSacudidas] = useState({}) // { A4: 2 }: veces que se volvió a tocar una ya conseguida
  const { senal, senalar, suena } = useSenal() // casilla verde o «Escuchar las 3 La» → el piano va a la tecla
  const ronda = rondas[r]
  const objetivos = enCadaOctava(ronda.nota, paso.piano)
  const listo = encontradas.length === objetivos.length
  const ultima = r === rondas.length - 1
  const nombreSolo = nombre(objetivos[0], { octava: false })

  const onNoteOn = useCallback(
    (nota) => {
      const objetivo = objetivos.find((o) => midi(o) === midi(nota))
      // Una ya conseguida: su casilla tiembla (también cuando ya están todas).
      if (objetivo && encontradas.includes(objetivo)) {
        setSacudidas((s) => ({ ...s, [objetivo]: (s[objetivo] ?? 0) + 1 }))
        if (!listo) setIntento({ nota, tipo: 'repetida' })
        return
      }
      if (listo) return
      if (!objetivo || !mismaNota(nota, objetivos[0])) {
        setFallos((f) => f + 1)
        setIntento({ nota, tipo: 'otra' })
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

  // Las casillas también son botones: gris → solo suena su nota (no se regala dónde está); verde → suena y el
  // piano va a su octava e ilumina la tecla (sirve para repasar, también con todas encontradas).
  const tocarCasilla = (o) => {
    playNotes(o)
    if (encontradas.includes(o)) senalar(o)
  }

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
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !listo,
      ayuda: listo || feedback ? null : `Toca todas las ${nombreSolo} (${encontradas.length}/${objetivos.length})`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setEncontradas([])
        setIntento(null)
        setFallos(0)
        setSacudidas({})
      },
    })
  }, [listo, intento, ronda, objetivos, encontradas.length, nombreSolo, ultima, r, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={listo} />

      <motion.p key={r} {...ENTRA_DERECHA} className="text-lg font-semibold leading-snug sm:text-2xl">
        Toca <span className="underline decoration-fijate decoration-4 underline-offset-4">todas</span> las{' '}
        <span className="rounded-md bg-fijate-claro px-1.5">{nombreSolo}</span> del teclado
      </motion.p>

      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${objetivos.length}, minmax(0, 1fr))` }}>
        {objetivos.map((o) => {
          const ok = encontradas.includes(o)
          return (
            <Casilla
              key={o}
              ok={ok}
              sacude={sacudidas[o]}
              sonando={suena(o)}
              onTocar={() => tocarCasilla(o)}
              etiqueta={ok ? `${nombre(o)}, encontrada: ver en el teclado` : `Escuchar ${nombre(o)}`}
            >
              {nombre(o)}
            </Casilla>
          )
        })}
      </ul>

      {listo && (
        <motion.div {...SUBE}>
          <BotonSonido
            sonido={{ notas: objetivos, intervalo: 0.6 }}
            etiqueta={`Escuchar las ${objetivos.length} ${nombreSolo}`}
            onNotas={senalar}
            className="w-full"
          />
        </motion.div>
      )}

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={encontradas} senalar={senal} />
    </div>
  )
}

// ——— Medir un paso (semitono o tono) o construir un intervalo (3.ª mayor, 5.ª justa…) desde una nota ———

/** Nombre corto para el Piano y para nombre(): sin dobles alteraciones ni Mi♯ (Tonal). */
const simple = (n) => Note.simplify(n)
const PALABRA_PASO = { S: 'un semitono', T: 'un tono' }
const plural = (n) => `${n} semitono${n === 1 ? '' : 's'}`

/** Lo que pide la ronda, en palabras: «un tono», «una 3.ª mayor». */
const palabraRonda = (ronda) => (ronda.intervalo ? conArticulo(ronda.intervalo) : PALABRA_PASO[ronda.paso])

/** «la tecla de al lado» / «saltando Re♯»: cómo se llega de `a` a `b` en el teclado. */
function comoSeLlega(a, b) {
  const medio = entre(a, b)
  if (medio.length === 0) {
    const blancas = !a.includes('#') && !a.includes('b') && !b.includes('#') && !b.includes('b')
    return blancas ? 'la tecla de al lado: entre las dos no hay negra' : 'la tecla de al lado'
  }
  return `saltando una tecla (${medio.map((n) => nombre(n, { octava: false })).join(', ')})`
}

function Paso({ paso, setAccion, siguiente, completar }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [intento, setIntento] = useState(null) // { nota, ok }
  const [fallos, setFallos] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const ronda = rondas[r]
  const dir = ronda.direccion === 'baja' ? -1 : 1
  const meta = ronda.intervalo ? notaIntervalo(ronda.desde, ronda.intervalo, dir) : pasoDesde(ronda.desde, ronda.paso, dir)
  const palabra = palabraRonda(ronda)
  const resuelta = intento?.ok === true
  const ultima = r === rondas.length - 1
  const verbo = dir > 0 ? 'Sube' : 'Baja'
  const { senal, senalar } = useSenal()

  const onNoteOn = useCallback(
    (nota) => {
      if (resuelta) return
      const ok = mismaTecla(nota, meta)
      setIntento({ nota, ok })
      if (ok) {
        const total = aciertos + (fallos === 0 ? 1 : 0)
        setAciertos(total)
        if (ultima) completar({ aciertos: total, total: rondas.length })
      } else {
        setFallos((f) => f + 1)
      }
    },
    [resuelta, meta, aciertos, fallos, ultima, rondas.length, completar],
  )

  useEffect(() => {
    let feedback = null
    const desde = nombre(simple(ronda.desde))
    if (intento?.ok) {
      feedback = {
        tipo: 'bien',
        titulo: '¡Eso es!',
        texto: ronda.intervalo
          ? `**${desde} → ${nombre(meta)}**: ${palabra}, ${plural(datosIntervalo(ronda.intervalo).semitonos)}.${ronda.mensaje ? ` ${ronda.mensaje}` : ''}`
          : `**${desde} → ${nombre(meta)}**: ${palabra}, ${comoSeLlega(ronda.desde, meta)}.`,
      }
    } else if (intento) {
      const d = semitonos(ronda.desde, intento.nota)
      const tocada = nombre(Note.fromMidiSharps(Note.midi(intento.nota)))
      const otraDir = d !== 0 && Math.sign(d) !== dir
      feedback = {
        tipo: 'mal',
        titulo: d === 0 ? 'Es la misma nota.' : `Esa es ${tocada}.`,
        texto:
          (d === 0
            ? `Tienes que ${dir > 0 ? 'subir' : 'bajar'} desde ${desde}.`
            : otraDir
              ? `Está ${d > 0 ? 'por encima' : 'por debajo'} de ${desde}: ve hacia la ${dir > 0 ? 'derecha' : 'izquierda'}.`
              : ronda.intervalo
                ? `De ${desde} a ${tocada} hay **${plural(Math.abs(d))}**${Math.abs(d) <= 12 ? ` (${conArticulo(d)})` : ''}. Buscamos **${palabra}**: ${plural(datosIntervalo(ronda.intervalo).semitonos)}.`
                : `De ${desde} a ${tocada} hay **${nombreDistancia(d)}**. Buscamos **${palabra}**.`) +
          (ronda.pista ? ` ${ronda.pista}` : '') +
          (fallos >= 2 ? ' Te la marco en el teclado.' : ''),
      }
    }
    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !resuelta,
      ayuda: resuelta || intento ? null : `${verbo} ${palabra} desde ${desde}`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        const next = rondas[r + 1]
        setR(r + 1)
        setIntento(null)
        setFallos(0)
        playNotes(next.desde)
      },
    })
  }, [intento, resuelta, ultima, ronda, rondas, r, meta, palabra, dir, verbo, fallos, setAccion, siguiente])

  // Tras 2 fallos, la meta se marca en el teclado (el error nunca castiga).
  const marcadas = [simple(ronda.desde), ...(fallos >= 2 || resuelta ? [meta] : [])]

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={resuelta} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          {verbo} <span className="underline decoration-fijate decoration-4 underline-offset-4">{palabra}</span>{' '}
          desde <span className="rounded-md bg-fijate-claro px-1.5">{nombre(simple(ronda.desde))}</span>
        </p>
        <BotonSonido
          sonido={{ notas: [ronda.desde] }}
          etiqueta={nombre(simple(ronda.desde))}
          onNotas={senalar}
          className="min-h-12 shrink-0 py-1.5 pl-2 pr-4"
        />
      </motion.div>

      {resuelta && (
        <motion.div {...SUBE}>
          <BotonSonido
            sonido={{ notas: [ronda.desde, meta], intervalo: 0.6 }}
            etiqueta={`Escuchar ${nombre(simple(ronda.desde), { octava: false })} → ${nombre(meta, { octava: false })}`}
            onNotas={senalar}
            className="w-full"
          />
        </motion.div>
      )}

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={marcadas} ir={simple(ronda.desde)} senalar={senal} />
    </div>
  )
}

// ——— Tocar una fórmula de pasos en orden (T T S T T T S…) ———

function Formula({ paso, setAccion, siguiente, completar }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [hechas, setHechas] = useState(1) // notas ya tocadas bien (la primera viene dada)
  const [intento, setIntento] = useState(null) // { nota, ok }
  const [fallos, setFallos] = useState(0) // fallos en la nota actual
  const [fallosRonda, setFallosRonda] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const ronda = rondas[r]
  const notas = useMemo(() => formula(ronda.desde, ronda.pasos), [ronda])
  const listo = hechas === notas.length
  const ultima = r === rondas.length - 1
  const actual = notas[hechas] // la que toca ahora
  const anterior = notas[hechas - 1]
  const { senal, senalar } = useSenal()
  const [sacudidas, setSacudidas] = useState({}) // { 3: 2 }: veces que se volvió a tocar la nota ya tocada de esa casilla

  const onNoteOn = useCallback(
    (nota) => {
      // Una nota ya tocada (también con la fórmula completa): su casilla tiembla, no cuenta como fallo.
      const ya = notas.slice(0, hechas).findLastIndex((n) => mismaTecla(n, nota))
      if (ya >= 0) return setSacudidas((s) => ({ ...s, [ya]: (s[ya] ?? 0) + 1 }))
      if (listo) return
      if (mismaTecla(nota, actual)) {
        const n = hechas + 1
        setHechas(n)
        setIntento({ nota, ok: true })
        setFallos(0)
        if (n === notas.length) {
          const total = aciertos + (fallosRonda === 0 ? 1 : 0)
          setAciertos(total)
          if (ultima) completar({ aciertos: total, total: rondas.length })
        }
      } else {
        setIntento({ nota, ok: false })
        setFallos((f) => f + 1)
        setFallosRonda((f) => f + 1)
      }
    },
    [listo, notas, actual, hechas, aciertos, fallosRonda, ultima, rondas.length, completar],
  )

  useEffect(() => {
    let feedback = null
    if (listo) {
      feedback = {
        tipo: 'bien',
        titulo: ronda.titulo ?? '¡Fórmula completa!',
        texto: ronda.mensaje ?? `${notas.map((n) => nombre(simple(n), { octava: false })).join(' · ')}.`,
      }
    } else if (intento && !intento.ok) {
      const p = ronda.pasos[hechas - 1]
      const d = semitonos(anterior, intento.nota)
      const tocada = nombre(Note.fromMidiSharps(Note.midi(intento.nota)))
      feedback = {
        tipo: 'mal',
        titulo: `Esa es ${tocada}.`,
        texto:
          `Desde ${nombre(simple(anterior), { octava: false })}, ${PALABRA_PASO[p]} ${p === 'S' ? 'es la tecla de al lado' : 'salta una tecla'}` +
          (d > 0 ? `; tocaste ${nombreDistancia(d)} hacia arriba.` : '; la fórmula sube: ve hacia la derecha.') +
          (fallos >= 2 ? ' Te marco la tecla.' : ''),
      }
    }
    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !listo,
      ayuda: listo || feedback ? null : `Sigue la fórmula (${hechas - 1}/${notas.length - 1})`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setHechas(1)
        setIntento(null)
        setFallos(0)
        setFallosRonda(0)
        setSacudidas({})
        playNotes(rondas[r + 1].desde)
      },
    })
  }, [listo, intento, ronda, notas, hechas, anterior, fallos, ultima, r, rondas, setAccion, siguiente])

  const marcadas = [...notas.slice(0, hechas).map(simple), ...(fallos >= 2 && !listo ? [simple(actual)] : [])]

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={listo} />

      <motion.p key={r} {...ENTRA_DERECHA} className="text-xl font-semibold leading-snug sm:text-2xl">
        {ronda.pregunta ?? (
          <>
            Desde <span className="rounded-md bg-fijate-claro px-1.5">{nombre(simple(ronda.desde))}</span>, sigue la fórmula
          </>
        )}
      </motion.p>

      <FilaFormula key={r} notas={notas} pasos={ronda.pasos} hechas={hechas} senal={senal} sacudidas={sacudidas} grados={ronda.grados} />

      {listo && (
        <motion.div {...SUBE}>
          <BotonSonido sonido={{ notas, intervalo: 0.4 }} etiqueta="Escuchar lo que tocaste" onNotas={(ns, i) => senalar(ns.map(simple), i)} className="w-full" />
        </motion.div>
      )}

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={marcadas} ir={simple(listo ? anterior : actual)} senalar={senal} />
    </div>
  )
}

/**
 * La fórmula como una fila: una casilla por nota (las tocadas con su nombre en verde, la que toca
 * ahora con borde negro, las pendientes con «?») y, encima, el paso (T / S) entre cada pareja.
 * `senal` (de useSenal): al «Escuchar lo que tocaste», la casilla de la nota que suena lleva aro celeste.
 * `sacudidas` ({ índice: veces }): al volver a tocar una nota ya tocada, su casilla tiembla.
 * `grados`: debajo, el número de grado de cada nota (1 … 7 y la octava otra vez 1).
 */
function FilaFormula({ notas, pasos, hechas, senal, sacudidas = {}, grados = false }) {
  const columnas = { gridTemplateColumns: `repeat(${notas.length}, minmax(0, 1fr))` }
  return (
    <div className="flex flex-col gap-1.5" aria-label={`Fórmula: ${pasos.join(' ')}`}>
      <div className="grid gap-1.5" style={columnas} aria-hidden>
        {notas.map((_, i) => (
          <span key={i} className="relative h-6">
            {i > 0 && (
              <span
                className={`absolute left-0 top-0 -translate-x-1/2 -ml-[3px] grid h-6 min-w-6 place-items-center rounded-full font-dato text-sm font-medium ${
                  pasos[i - 1] === 'S' ? 'bg-fijate-suave text-fijate-tinta' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {pasos[i - 1]}
              </span>
            )}
          </span>
        ))}
      </div>
      <ol className="grid gap-1.5" style={columnas}>
        {notas.map((n, i) => (
          <CasillaFormula
            key={i}
            hecha={i < hechas}
            ahora={i === hechas}
            salta={i > 0 && i === hechas - 1}
            suena={Boolean(senal?.activa && senal.i === i)}
            sacude={sacudidas[i] ?? 0}
          >
            {i < hechas ? nombre(simple(n), { octava: false }) : '?'}
          </CasillaFormula>
        ))}
      </ol>
      {grados && (
        <div className="grid gap-1.5" style={columnas} aria-label="Grados de la escala">
          {notas.map((_, i) => (
            <span key={i} className="text-center font-dato text-sm font-medium tabular-nums text-zinc-500">
              {(i % 7) + 1}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Una casilla de la fila de la fórmula. El `li` tiembla (useTemblor); dentro, el SALTO al acertar. */
function CasillaFormula({ hecha, ahora, salta, suena, sacude, children }) {
  const [ref, temblar] = useTemblor()
  useEffect(() => {
    if (sacude > 0) temblar()
  }, [sacude, temblar])
  return (
    <li ref={ref} data-casilla={hecha ? 'ok' : ahora ? 'ahora' : 'pendiente'}>
      <motion.div
        initial={false}
        animate={hecha && salta ? SALTO : { scale: 1 }}
        transition={{ duration: 0.35 }}
        data-sonando={suena || undefined}
        className={`grid h-11 place-items-center rounded-xl border-2 text-sm font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 ${suena ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''} ${
          hecha
            ? 'border-bien bg-bien-suave text-bien-tinta'
            : ahora
              ? 'border-zinc-900 bg-white text-zinc-600'
              : 'border-zinc-200 bg-white text-zinc-500'
        }`}
      >
        {children}
      </motion.div>
    </li>
  )
}
