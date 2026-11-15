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
import { BRILLO_MS, ENTRA_DERECHA, POP, RESORTE, SALTO, SUBE } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import useTemblor from '../../ui/useTemblor.js'
import Piano from '../Piano.jsx'
import { Candado, Repaso } from '../../ui/Iconos.jsx'
import {
  APILADO,
  TERCERA,
  abierto as voicingAbierto,
  TRIADAS,
  acordeDeGrado,
  arpegioYAcorde,
  cifrado as cifradoDe,
  cifradoInversion,
  inversion,
  nombreAcorde,
  triada,
} from '../../theory/acordes.js'
import { notasTonalidad } from '../../theory/escalas.js'
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
 *    `grado: 'la dominante'` cambia la frase a «Toca la dominante de Do4» (lección 3.5).
 *        → tocar la nota a un semitono / un tono de `desde`
 *  - { tipo: 'formula', rondas: [{ desde: 'C4', pasos: ['T','T','S',…], nombre }] }
 *        → tocar en orden las notas que salen de aplicar la fórmula de pasos desde `desde`
 *  - { tipo: 'acorde', rondas: [{ raiz: 'D4', tipo: 'mayor' | 'menor' | 'dis' | 'aum', cifrado, guia, escuchar }] }
 *        → construir la tríada: la fundamental viene marcada y se tocan la 3.ª y la 5.ª (en cualquier orden y octava)
 */
export default function TocaEnPiano(props) {
  const { objetivo } = props.paso
  if (objetivo.tipo === 'explorar') return <Explorar {...props} />
  if (objetivo.tipo === 'extremos') return <Extremos {...props} />
  if (objetivo.tipo === 'comparar') return <Comparar {...props} />
  if (objetivo.tipo === 'octavas') return <Octavas {...props} />
  if (objetivo.tipo === 'paso') return <Paso {...props} />
  if (objetivo.tipo === 'formula') return <Formula {...props} />
  if (objetivo.tipo === 'acorde') return <Acorde {...props} />
  return <p>Objetivo desconocido: {objetivo.tipo}</p>
}

/** Nombre de la tecla en el Piano (con sostenidos): Sol♭4 → 'F#4'. */
const tecla = (n) => Note.fromMidiSharps(Note.midi(n))
/** Fallos que se permiten en una pregunta («ahora sí se puede fallar»): al segundo, la respuesta sale en rojo. */
const INTENTOS = 2

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
function Casilla({ ok, mal = false, sacude = 0, sonando = false, onTocar, etiqueta, children }) {
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
        data-mal={mal || undefined}
        className={`grid min-h-16 place-items-center rounded-2xl border-2 px-3 py-2 text-center text-xl font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 ${
          mal ? 'border-mal bg-mal-suave text-mal-tinta' : ok ? 'border-bien-relleno bg-bien-relleno text-blanco' : 'border-zinc-200 bg-white text-zinc-700'
        } ${sonando ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''}`}
      >
        <span className="inline-flex items-center gap-1.5">
          {mal && <Repaso className="size-5" />}
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

function Comparar({ paso, setAccion, siguiente, completar, fallo }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [intento, setIntento] = useState(null) // { nota, ok }
  const [fallos, setFallos] = useState(0) // fallos en la ronda actual (al 2.º, la respuesta en rojo)
  const [aciertos, setAciertos] = useState(0) // rondas resueltas al primer intento
  const ronda = rondas[r]
  const resuelta = intento?.ok === true
  const perdida = !resuelta && fallos >= INTENTOS
  const terminada = resuelta || perdida
  const ultima = r === rondas.length - 1
  const palabra = ronda.direccion === 'agudo' ? 'más aguda' : 'más grave'
  // Al perderla, una que sí valía: la tecla de al lado hacia donde se pedía.
  const ejemplo = tecla(Note.fromMidi(Note.midi(ronda.referencia) + (ronda.direccion === 'agudo' ? 1 : -1)))
  const { senal, senalar } = useSenal()
  const [sacudidas, setSacudidas] = useState({}) // { nota: veces } que se tocó en el piano la nota de un recuadro

  const onNoteOn = useCallback(
    (nota) => {
      // Tocar en el piano la nota de un recuadro ya a la vista lo hace temblar (así se ve cuál es). La referencia
      // misma no cuenta como fallo.
      const vistas = [ronda.referencia, ...(resuelta ? [intento.nota] : perdida ? [ejemplo] : [])]
      const ya = vistas.find((n) => mismaTecla(n, nota))
      if (ya) setSacudidas((s) => ({ ...s, [ya]: (s[ya] ?? 0) + 1 }))
      if (terminada || ya === ronda.referencia) return
      const dif = compararAltura(nota, ronda.referencia)
      const ok = ronda.direccion === 'agudo' ? dif > 0 : dif < 0
      setIntento({ nota, ok, dif })
      if (ok) {
        const total = aciertos + (fallos === 0 ? 1 : 0)
        setAciertos(total)
        if (ultima) completar({ aciertos: total, total: rondas.length })
      } else {
        const f = fallos + 1
        setFallos(f)
        if (f >= INTENTOS) {
          fallo?.(r)
          if (ultima) completar({ aciertos, total: rondas.length })
        }
      }
    },
    [resuelta, perdida, terminada, intento, ejemplo, ronda, aciertos, fallos, ultima, r, rondas.length, completar, fallo],
  )

  useEffect(() => {
    let feedback = null
    const ref = nombre(ronda.referencia)
    const lado = ronda.direccion === 'agudo' ? 'derecha' : 'izquierda'
    if (resuelta) {
      const n = nombre(intento.nota)
      feedback = {
        tipo: 'bien',
        titulo: '¡Bien!',
        texto: `**${n}** es ${palabra} que ${ref}: está a su ${lado}.`,
      }
    } else if (perdida) {
      feedback = {
        tipo: 'error',
        titulo: `Valía ${nombre(ejemplo)}.`,
        texto: `Cualquier tecla a la **${lado}** de ${ref} es ${palabra}. Al final la repasas.`,
        plegable: true,
      }
    } else if (intento) {
      const n = nombre(intento.nota)
      feedback = {
        tipo: 'mal',
        titulo: `Esa es ${n}.`,
        texto: `${n} es ${intento.dif > 0 ? 'más aguda' : 'más grave'} que ${ref}. Prueba hacia la ${lado}.`,
        plegable: true,
      }
    }

    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !terminada,
      ayuda: terminada || intento ? null : `Toca una nota ${palabra} que ${nombre(ronda.referencia)}`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        const next = rondas[r + 1]
        setR(r + 1)
        setIntento(null)
        setFallos(0)
        setSacudidas({})
        playNotes(next.referencia)
      },
    })
  }, [intento, resuelta, perdida, terminada, ejemplo, ultima, palabra, ronda, rondas, r, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={terminada} />

      <motion.div key={`frase-${r}`} {...ENTRA_DERECHA} className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          Toca una nota <span className="underline decoration-fijate decoration-4 underline-offset-4">{palabra}</span>{' '}
          que <span className="rounded-md bg-fijate-claro px-1.5">{nombre(ronda.referencia)}</span>
        </p>
      </motion.div>

      {/* La referencia y, con candado, la que buscas (a su derecha si es más aguda, a su izquierda si es más grave). */}
      <FilaNotas
        key={`fila-${r}`}
        desde={ronda.referencia}
        meta={resuelta ? intento.nota : perdida ? ejemplo : null}
        perdida={perdida}
        sube={ronda.direccion === 'agudo'}
        senal={senal}
        senalar={senalar}
        sacudidas={sacudidas}
      />

      <Piano
        {...paso.piano}
        compacto
        onNoteOn={onNoteOn}
        marcadas={[ronda.referencia, ...(resuelta ? [intento.nota] : [])]}
        estados={perdida ? { [ejemplo]: 'mal' } : undefined}
        senalar={senal}
      />
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

function Octavas({ paso, setAccion, siguiente, completar, fallo }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [encontradas, setEncontradas] = useState([])
  const [intento, setIntento] = useState(null) // { nota, tipo: 'nueva' | 'repetida' | 'otra' }
  const [fallos, setFallos] = useState(0) // fallos en la ronda actual (al 2.º, las que faltan salen en rojo)
  const [aciertos, setAciertos] = useState(0) // rondas sin fallos
  const [sacudidas, setSacudidas] = useState({}) // { A4: 2 }: veces que se volvió a tocar una ya conseguida
  const { senal, senalar, suena } = useSenal() // casilla verde o «Escuchar las 3 La» → el piano va a la tecla
  const ronda = rondas[r]
  const objetivos = useMemo(() => enCadaOctava(ronda.nota, paso.piano), [ronda.nota, paso.piano])
  const listo = encontradas.length === objetivos.length
  const perdida = !listo && fallos >= INTENTOS
  const terminada = listo || perdida
  const faltaban = useMemo(() => (perdida ? objetivos.filter((o) => !encontradas.includes(o)) : []), [perdida, objetivos, encontradas])
  const ultima = r === rondas.length - 1
  const nombreSolo = nombre(objetivos[0], { octava: false })

  const onNoteOn = useCallback(
    (nota) => {
      const objetivo = objetivos.find((o) => midi(o) === midi(nota))
      // Una ya conseguida (o ya en rojo): su casilla tiembla (también cuando ya están todas).
      if (objetivo && (encontradas.includes(objetivo) || (perdida && !encontradas.includes(objetivo)))) {
        setSacudidas((s) => ({ ...s, [objetivo]: (s[objetivo] ?? 0) + 1 }))
        if (!terminada) setIntento({ nota, tipo: 'repetida' })
        return
      }
      if (terminada) return
      if (!objetivo || !mismaNota(nota, objetivos[0])) {
        const f = fallos + 1
        setFallos(f)
        setIntento({ nota, tipo: 'otra' })
        if (f >= INTENTOS) {
          fallo?.(r)
          if (ultima) completar({ aciertos, total: rondas.length })
        }
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
    [terminada, perdida, objetivos, encontradas, aciertos, fallos, ultima, r, rondas.length, completar, fallo],
  )

  // Las casillas también son botones: gris → solo suena su nota (no se regala dónde está); verde (o roja) → suena y el
  // piano va a su octava e ilumina la tecla (sirve para repasar, también con todas encontradas).
  const tocarCasilla = (o) => {
    playNotes(o)
    if (encontradas.includes(o) || faltaban.includes(o)) senalar(o)
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
    } else if (perdida) {
      feedback = {
        tipo: 'error',
        titulo: `Faltaba${faltaban.length === 1 ? '' : 'n'} ${faltaban.map((o) => nombre(o)).join(', ')}.`,
        texto: `Las ${nombreSolo} se repiten cada **12 teclas**: misma tecla, una octava más arriba o más abajo. Al final la repasas.`,
        plegable: true,
      }
    } else if (intento?.tipo === 'otra') {
      feedback = {
        tipo: 'mal',
        titulo: `Esa es ${nombre(intento.nota)}.`,
        texto: ronda.pista ?? `Buscamos **${nombreSolo}**. Fíjate en el nombre de las teclas.`,
        plegable: true,
      }
    } else if (intento?.tipo === 'repetida') {
      feedback = { tipo: 'mal', titulo: `Ya tienes ${nombre(intento.nota)}.`, texto: 'Busca la misma nota en otra octava, más a la izquierda o a la derecha.', plegable: true }
    }

    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !terminada,
      ayuda: terminada || feedback ? null : `Toca todas las ${nombreSolo} (${encontradas.length}/${objetivos.length})`,
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
  }, [listo, perdida, terminada, faltaban, intento, ronda, objetivos, encontradas.length, nombreSolo, ultima, r, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={terminada} />

      <motion.p key={`frase-${r}`} {...ENTRA_DERECHA} className="text-lg font-semibold leading-snug sm:text-2xl">
        Toca <span className="underline decoration-fijate decoration-4 underline-offset-4">todas</span> las{' '}
        <span className="rounded-md bg-fijate-claro px-1.5">{nombreSolo}</span> del teclado
      </motion.p>

      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${objetivos.length}, minmax(0, 1fr))` }}>
        {objetivos.map((o) => {
          const ok = encontradas.includes(o)
          const mal = faltaban.includes(o)
          return (
            <Casilla
              key={o}
              ok={ok}
              mal={mal}
              sacude={sacudidas[o]}
              sonando={suena(o)}
              onTocar={() => tocarCasilla(o)}
              etiqueta={ok ? `${nombre(o)}, encontrada: ver en el teclado` : mal ? `${nombre(o)}, faltaba: ver en el teclado` : `Escuchar ${nombre(o)}`}
            >
              {nombre(o)}
            </Casilla>
          )
        })}
      </ul>

      {terminada && (
        <motion.div {...SUBE}>
          <BotonSonido
            sonido={{ notas: objetivos, intervalo: 0.6 }}
            etiqueta={`Escuchar las ${objetivos.length} ${nombreSolo}`}
            onNotas={senalar}
            className="w-full"
          />
        </motion.div>
      )}

      <Piano
        {...paso.piano}
        compacto
        onNoteOn={onNoteOn}
        marcadas={encontradas}
        estados={perdida ? Object.fromEntries(faltaban.map((o) => [o, 'mal'])) : undefined}
        senalar={senal}
      />
    </div>
  )
}

// ——— Medir un paso (semitono o tono) o construir un intervalo (3.ª mayor, 5.ª justa…) desde una nota ———

/** Nombre corto para el Piano y para nombre(): sin dobles alteraciones ni Mi♯ (Tonal). */
const simple = (n) => Note.simplify(n)
const PALABRA_PASO = { S: 'un semitono', T: 'un tono', 'T½': 'un tono y medio' }
/** Cómo se ve cada paso en el teclado. */
const TECLAS_PASO = { S: 'es la tecla de al lado', T: 'salta una tecla', 'T½': 'salta dos teclas' }
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

function Paso({ paso, setAccion, siguiente, completar, fallo }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [intento, setIntento] = useState(null) // { nota, ok }
  const [fallos, setFallos] = useState(0) // fallos en la ronda (al 2.º, la respuesta sale en rojo)
  const [aciertos, setAciertos] = useState(0)
  const ronda = rondas[r]
  const dir = ronda.direccion === 'baja' ? -1 : 1
  const meta = ronda.intervalo ? notaIntervalo(ronda.desde, ronda.intervalo, dir) : pasoDesde(ronda.desde, ronda.paso, dir)
  const palabra = palabraRonda(ronda)
  const resuelta = intento?.ok === true
  const perdida = !resuelta && fallos >= INTENTOS
  const terminada = resuelta || perdida
  const ultima = r === rondas.length - 1
  const verbo = dir > 0 ? 'Sube' : 'Baja'
  const { senal, senalar } = useSenal()
  const [sacudidas, setSacudidas] = useState({}) // { nota: veces } que se tocó en el piano la nota de un recuadro

  const onNoteOn = useCallback(
    (nota) => {
      // Tocar en el piano la nota de un recuadro ya a la vista lo hace temblar (así se ve cuál es).
      const ya = [simple(ronda.desde), ...(terminada ? [meta] : [])].find((n) => mismaTecla(n, nota))
      if (ya) setSacudidas((s) => ({ ...s, [ya]: (s[ya] ?? 0) + 1 }))
      if (terminada || ya === simple(ronda.desde)) return
      const ok = mismaTecla(nota, meta)
      setIntento({ nota, ok })
      if (ok) {
        const total = aciertos + (fallos === 0 ? 1 : 0)
        setAciertos(total)
        if (ultima) completar({ aciertos: total, total: rondas.length })
      } else {
        const f = fallos + 1
        setFallos(f)
        if (f >= INTENTOS) {
          fallo?.(r)
          if (ultima) completar({ aciertos, total: rondas.length })
        }
      }
    },
    [terminada, ronda.desde, meta, aciertos, fallos, ultima, r, rondas.length, completar, fallo],
  )

  useEffect(() => {
    let feedback = null
    const desde = nombre(simple(ronda.desde))
    const comoEs = ronda.intervalo
      ? `**${desde} → ${nombre(meta)}**: ${palabra}, ${plural(datosIntervalo(ronda.intervalo).semitonos)}.`
      : `**${desde} → ${nombre(meta)}**: ${palabra}, ${comoSeLlega(ronda.desde, meta)}.`
    if (resuelta) {
      feedback = { tipo: 'bien', titulo: '¡Eso es!', texto: comoEs + (ronda.intervalo && ronda.mensaje ? ` ${ronda.mensaje}` : '') }
    } else if (perdida) {
      feedback = { tipo: 'error', titulo: `Era ${nombre(meta)}.`, texto: `${comoEs} Al final la repasas.`, plegable: true }
    } else if (intento) {
      const d = semitonos(ronda.desde, intento.nota)
      const tocada = nombre(Note.fromMidiSharps(Note.midi(intento.nota)))
      const otraDir = d !== 0 && Math.sign(d) !== dir
      feedback = {
        tipo: 'mal',
        titulo: d === 0 ? 'Es la misma nota.' : `Esa es ${tocada}.`,
        plegable: true,
        texto:
          (d === 0
            ? `Tienes que ${dir > 0 ? 'subir' : 'bajar'} desde ${desde}.`
            : otraDir
              ? `Está ${d > 0 ? 'por encima' : 'por debajo'} de ${desde}: ve hacia la ${dir > 0 ? 'derecha' : 'izquierda'}.`
              : ronda.intervalo
                ? `De ${desde} a ${tocada} hay **${plural(Math.abs(d))}**${Math.abs(d) <= 12 ? ` (${conArticulo(d)})` : ''}. Buscamos **${palabra}**: ${plural(datosIntervalo(ronda.intervalo).semitonos)}.`
                : `De ${desde} a ${tocada} hay **${nombreDistancia(d)}**. Buscamos **${palabra}**.`) + (ronda.pista ? ` ${ronda.pista}` : ''),
      }
    }
    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !terminada,
      ayuda: terminada || intento ? null : ronda.grado ? `Toca ${ronda.grado} de ${desde}` : `${verbo} ${palabra} desde ${desde}`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        const next = rondas[r + 1]
        setR(r + 1)
        setIntento(null)
        setFallos(0)
        setSacudidas({})
        playNotes(next.desde)
      },
    })
  }, [intento, resuelta, perdida, terminada, ultima, ronda, rondas, r, meta, palabra, dir, verbo, setAccion, siguiente])

  // La salida va marcada (oro); acertada, también la meta. Perdida, la meta en rojo.
  const marcadas = [simple(ronda.desde), ...(resuelta ? [meta] : [])]

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={terminada} />

      <motion.div key={`frase-${r}`} {...ENTRA_DERECHA} className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          {ronda.grado ? 'Toca' : verbo}{' '}
          <span className="underline decoration-fijate decoration-4 underline-offset-4">{ronda.grado ?? palabra}</span>{' '}
          {ronda.grado ? 'de' : 'desde'} <span className="rounded-md bg-fijate-claro px-1.5">{nombre(simple(ronda.desde))}</span>
        </p>
      </motion.div>

      {/* Pedido del usuario: las notas como recuadros (no botones). La que buscas, con candado hasta tocarla. */}
      <FilaNotas
        key={`fila-${r}`}
        desde={simple(ronda.desde)}
        meta={terminada ? meta : null}
        perdida={perdida}
        sube={dir > 0}
        etiqueta={ronda.grado ? ronda.grado.replace(/^(la|el) /, '') : ronda.intervalo ? datosIntervalo(ronda.intervalo)?.corto : ronda.paso}
        tenue={!ronda.grado && !ronda.intervalo && ronda.paso === 'T'}
        senal={senal}
        senalar={senalar}
        sacudidas={sacudidas}
      />

      <Piano
        {...paso.piano}
        compacto
        onNoteOn={onNoteOn}
        marcadas={marcadas}
        estados={perdida ? { [meta]: 'mal' } : undefined}
        ir={simple(ronda.desde)}
        senalar={senal}
      />
    </div>
  )
}

/**
 * Dos recuadros (pedido del usuario: «las notas que indican algo del piano aparecen como recuadros»): la nota de la
 * que se parte y la que buscas, de grave a aguda como en el teclado (la buscada a la derecha si sube, a la izquierda
 * si baja). La buscada va con **candado** hasta tocarla en el piano; entonces se abre con su nombre. Tocar un recuadro
 * abierto hace sonar su nota y la enciende en el teclado; tocar en el piano la nota de un recuadro lo hace temblar
 * (`sacudidas`: { nota: veces }). Encima, el paso que se pide (S, T, 3.ª M, dominante…) con una flechita hacia la buscada.
 */
function FilaNotas({ desde, meta, perdida = false, sube, etiqueta, tenue = false, senal, senalar, sacudidas = {} }) {
  const recuadros = [{ nota: desde }, { nota: meta, buscada: true }]
  if (!sube) recuadros.reverse()
  const tocar = (nota, i) => {
    playNotes(nota)
    senalar(nota, i)
  }
  return (
    <div className="flex flex-col items-center gap-1.5" data-fila-notas>
      {/* El paso que se pide, con la flechita hacia la buscada. */}
      {etiqueta && (
        <span
          aria-hidden
          className={`grid h-7 place-items-center whitespace-nowrap rounded-full px-2.5 font-dato text-sm font-medium ${
            tenue ? 'bg-zinc-100 text-zinc-700' : 'bg-fijate-suave text-fijate-tinta'
          }`}
        >
          {sube ? `${etiqueta} →` : `← ${etiqueta}`}
        </span>
      )}
      <ol className="grid w-full grid-cols-2 gap-3">
        {recuadros.map(({ nota, buscada }, i) => (
          <CasillaFormula
            key={buscada ? 'buscada' : 'desde'}
            hecha={!buscada || Boolean(nota)}
            dada={!buscada}
            mal={buscada && perdida}
            salta={buscada && Boolean(nota)}
            suena={Boolean(nota && senal?.activa && senal.i === i)}
            sacude={nota ? (sacudidas[nota] ?? 0) : 0}
            onTocar={nota ? () => tocar(nota, i) : undefined}
            etiqueta={nota ? `Escuchar ${nombre(nota)}` : 'Nota por descubrir: tócala en el piano'}
            alto
          >
            {nota ? (
              <span className="inline-flex items-center gap-1.5">
                {buscada && perdida && <Repaso className="size-5" />}
                {nombre(nota)}
              </span>
            ) : (
              <Candado className="size-5 text-zinc-400" />
            )}
          </CasillaFormula>
        ))}
      </ol>
    </div>
  )
}

// ——— Tocar una fórmula de pasos en orden (T T S T T T S…) ———

function Formula({ paso, setAccion, siguiente, completar, fallo }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [hechas, setHechas] = useState(1) // notas ya tocadas o reveladas (la primera viene dada)
  const [rojas, setRojas] = useState([]) // índices que salieron en rojo (dos fallos en esa nota)
  const [intento, setIntento] = useState(null) // { nota, ok, revelada }
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

  /** Se llena una casilla más (bien o en rojo); al llenar la última, la ronda termina. */
  const avanzar = (rojasNuevas) => {
    const n = hechas + 1
    setHechas(n)
    setFallos(0)
    if (n < notas.length) return
    const total = aciertos + (fallosRonda === 0 ? 1 : 0)
    setAciertos(total)
    if (rojasNuevas.length > 0) fallo?.(r)
    if (ultima) completar({ aciertos: total, total: rondas.length })
  }

  const onNoteOn = (nota) => {
    // Una nota ya tocada (también con la fórmula completa): su casilla tiembla, no cuenta como fallo.
    const ya = notas.slice(0, hechas).findLastIndex((n) => mismaTecla(n, nota))
    if (ya >= 0) return setSacudidas((s) => ({ ...s, [ya]: (s[ya] ?? 0) + 1 }))
    if (listo) return
    if (mismaTecla(nota, actual)) {
      setIntento({ nota, ok: true })
      avanzar(rojas)
    } else {
      setFallosRonda((f) => f + 1)
      if (fallos + 1 >= INTENTOS) {
        // Segundo fallo en esta nota: se abre en rojo y se sigue con la siguiente.
        const nuevas = [...rojas, hechas]
        setRojas(nuevas)
        setIntento({ nota, ok: false, revelada: hechas })
        avanzar(nuevas)
      } else {
        setIntento({ nota, ok: false })
        setFallos((f) => f + 1)
      }
    }
  }

  useEffect(() => {
    let feedback = null
    const ultimaRoja = intento?.revelada
    if (listo && rojas.length === 0) {
      feedback = {
        tipo: 'bien',
        titulo: ronda.titulo ?? '¡Fórmula completa!',
        texto: ronda.mensaje ?? `${notas.map((n) => nombre(simple(n), { octava: false })).join(' · ')}.`,
      }
    } else if (ultimaRoja !== undefined) {
      const p = ronda.pasos[ultimaRoja - 1]
      const de = nombre(simple(notas[ultimaRoja - 1]), { octava: false })
      feedback = {
        tipo: 'error',
        titulo: `Era ${nombre(simple(notas[ultimaRoja]), { octava: false })}.`,
        texto: `Desde ${de}, ${PALABRA_PASO[p]} ${TECLAS_PASO[p]}.` + (listo ? ` ${ronda.mensaje ?? ''} Al final la repasas.` : ' Sigue con la siguiente.'),
        plegable: true,
      }
    } else if (listo) {
      feedback = {
        tipo: 'error',
        titulo: `Completa, con ${rojas.length} en rojo.`,
        texto: `${notas.map((n) => nombre(simple(n), { octava: false })).join(' · ')}. Al final la repasas.`,
        plegable: true,
      }
    } else if (intento && !intento.ok) {
      const p = ronda.pasos[hechas - 1]
      const d = semitonos(anterior, intento.nota)
      const tocada = nombre(Note.fromMidiSharps(Note.midi(intento.nota)))
      feedback = {
        tipo: 'mal',
        titulo: `Esa es ${tocada}.`,
        plegable: true,
        texto:
          `Desde ${nombre(simple(anterior), { octava: false })}, ${PALABRA_PASO[p]} ${TECLAS_PASO[p]}` +
          (d > 0 ? `; tocaste ${nombreDistancia(d)} hacia arriba.` : '; la fórmula sube: ve hacia la derecha.'),
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
        setRojas([])
        setIntento(null)
        setFallos(0)
        setFallosRonda(0)
        setSacudidas({})
        playNotes(rondas[r + 1].desde)
      },
    })
  }, [listo, rojas, intento, ronda, notas, hechas, anterior, ultima, r, rondas, setAccion, siguiente])

  const marcadas = notas.slice(0, hechas).filter((_, i) => !rojas.includes(i)).map(simple)
  const estados = rojas.length ? Object.fromEntries(rojas.map((i) => [notas[i], 'mal'])) : undefined

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={listo} />

      <motion.p key={`frase-${r}`} {...ENTRA_DERECHA} className="text-xl font-semibold leading-snug sm:text-2xl">
        {ronda.pregunta ?? (
          <>
            Desde <span className="rounded-md bg-fijate-claro px-1.5">{nombre(simple(ronda.desde))}</span>, sigue la fórmula
          </>
        )}
      </motion.p>

      <FilaFormula
        key={`fila-${r}`}
        notas={notas}
        pasos={ronda.pasos}
        hechas={hechas}
        rojas={rojas}
        senal={senal}
        sacudidas={sacudidas}
        grados={ronda.grados}
        alTocar={(n, i) => {
          playNotes(n)
          senalar(simple(n), i)
        }}
      />

      {listo && (
        <motion.div {...SUBE}>
          <BotonSonido sonido={{ notas, intervalo: 0.4 }} etiqueta="Escuchar lo que tocaste" onNotas={(ns, i) => senalar(ns.map(simple), i)} className="w-full" />
        </motion.div>
      )}

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={marcadas} estados={estados} ir={simple(listo ? anterior : actual)} senalar={senal} />
    </div>
  )
}

/**
 * La fórmula como una fila: una casilla por nota (las tocadas con su nombre en verde, la que toca
 * ahora con borde negro, las pendientes con «?») y, encima, el paso (T / S) entre cada pareja.
 * `senal` (de useSenal): al «Escuchar lo que tocaste», la casilla de la nota que suena lleva aro celeste.
 * `sacudidas` ({ índice: veces }): al volver a tocar una nota ya tocada, su casilla tiembla.
 * `grados`: debajo, el número de grado de cada nota (1 … 7 y la octava otra vez 1), o una lista propia
 *   (pentatónicas, 3.6: ['1', '♭3', '4', '5', '♭7', '1']).
 */
function FilaFormula({ notas, pasos, hechas, rojas = [], senal, sacudidas = {}, grados = false, alTocar }) {
  const columnas = { gridTemplateColumns: `repeat(${notas.length}, minmax(0, 1fr))` }
  return (
    <div className="flex flex-col gap-1.5" aria-label={`Fórmula: ${pasos.join(' ')}`}>
      <div className="grid gap-1.5" style={columnas} aria-hidden>
        {notas.map((_, i) => (
          <span key={i} className="relative h-6">
            {i > 0 && (
              <span
                className={`absolute left-0 top-0 -translate-x-1/2 -ml-[3px] grid h-6 min-w-6 place-items-center rounded-full font-dato text-sm font-medium ${
                  pasos[i - 1] === 'T' ? 'bg-zinc-100 text-zinc-700' : 'bg-fijate-suave text-fijate-tinta'
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
            mal={rojas.includes(i)}
            ahora={i === hechas}
            salta={i > 0 && i === hechas - 1}
            suena={Boolean(senal?.activa && senal.i === i)}
            sacude={sacudidas[i] ?? 0}
            onTocar={alTocar && i < hechas ? () => alTocar(n, i) : undefined}
            etiqueta={i < hechas ? `Escuchar ${nombre(simple(n))}` : 'Nota por descubrir'}
          >
            {i < hechas ? nombre(simple(n), { octava: false }) : <Candado className="size-[18px] text-zinc-400" />}
          </CasillaFormula>
        ))}
      </ol>
      {grados && (
        <div className="grid gap-1.5" style={columnas} aria-label="Grados de la escala">
          {notas.map((_, i) => (
            <span key={i} className="text-center font-dato text-sm font-medium tabular-nums text-zinc-500">
              {Array.isArray(grados) ? grados[i] : (i % 7) + 1}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Una casilla de una fila de notas (fórmula, acorde, paso). El `li` tiembla (useTemblor); dentro, el SALTO al acertar.
 * Las que faltan llevan **candado** (pedido del usuario). Con `onTocar`, la casilla es un botón: abierta, hace sonar su
 * nota (y la enciende en el teclado); con candado, tiembla (aún no se puede escuchar). `dada` = la nota de la que se
 * parte (borde de oro claro, como el nombre en la pregunta). `alto` = más grande (dos casillas a lo ancho).
 */
function CasillaFormula({ hecha, ahora, salta, suena, sacude, dada = false, mal = false, alto = false, onTocar, etiqueta, children }) {
  const [ref, temblar] = useTemblor()
  useEffect(() => {
    if (sacude > 0) temblar()
  }, [sacude, temblar])
  const caja = (
    <motion.div
      initial={false}
      animate={hecha && salta ? SALTO : { scale: 1 }}
      transition={{ duration: 0.35 }}
      data-sonando={suena || undefined}
      className={`grid place-items-center rounded-xl border-2 font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 ${alto ? 'h-14 text-lg' : 'h-11 text-sm'} ${suena ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''} ${
        dada
          ? 'border-fijate bg-fijate-claro text-zinc-900'
          : mal && hecha
            ? 'border-mal bg-mal-suave text-mal-tinta'
          : hecha
            ? 'border-bien bg-bien-suave text-bien-tinta'
            : ahora
              ? 'border-zinc-900 bg-white text-zinc-600'
              : 'border-zinc-200 bg-white text-zinc-500'
      }`}
    >
      {children}
    </motion.div>
  )
  return (
    <li ref={ref} data-casilla={dada ? 'dada' : mal && hecha ? 'mal' : hecha ? 'ok' : ahora ? 'ahora' : 'pendiente'}>
      {onTocar || !hecha ? (
        <Pulsable onClick={hecha ? onTocar : temblar} aria-label={etiqueta} className="block w-full rounded-xl">
          {caja}
        </Pulsable>
      ) : (
        caja
      )}
    </li>
  )
}

// ——— Construir un acorde (P8): la fundamental marcada; tocar la 3.ª y la 5.ª ———

/** Semitonos hacia arriba de `a` a `b` sin contar octavas (0…11). */
const haciaArriba = (a, b) => (((midi(b) - midi(a)) % 12) + 12) % 12
const PARTES = ['fundamental', '3.ª', '5.ª']
const GRADO_PARTE = [1, 3, 5]
const Mayus = (t) => `${t[0].toUpperCase()}${t.slice(1)}`
/** «Do mayor» de una tonalidad ('C4' → 'Do mayor'; con `menor`, 'La menor'). */
const nombreTonalidad = (t, menor = false) => `${nombre(/\d/.test(t) ? t : `${t}4`, { octava: false })} ${menor ? 'menor' : 'mayor'}`

/**
 * Lo que pide una ronda de P8: las notas de abajo arriba (`orden`), qué parte es cada casilla, cuál viene dada y
 * qué nota se marca (`dada`: la fundamental; en una inversión, el bajo; con `romano`, ninguna).
 */
function acordeDeRonda(ronda) {
  const base = ronda.romano ? acordeDeGrado(ronda.tonalidad, ronda.romano, { menor: ronda.menor }) : null
  const raiz = base?.raiz ?? ronda.raiz
  const tipo = base?.tipo ?? ronda.tipo
  const inv = ronda.inversion ?? 0
  const notas = triada(raiz, tipo)
  if (ronda.voicing === 'abierto') return { raiz, tipo, inv: 0, notas, orden: voicingAbierto(notas), partes: [0, 2, 1], dada: 0, abierto: true }
  const orden = inversion(notas, inv)
  const partes = orden.map((_, j) => (j + inv) % 3)
  return { raiz, tipo, inv, notas, orden, partes, dada: ronda.romano ? null : 0, abierto: false }
}

/**
 * Ronda: { raiz: 'D4', tipo: 'mayor', cifrado: true (pide «Dm» en vez de «Re menor»), guia: true (los intervalos
 * «3M / 3m» entre las casillas), escuchar: true (suena el acorde y no se dice cuál es), pista, titulo, mensaje }.
 * Opciones de la 4.3 y la 4.4:
 *  - `revelar: true` + `tonalidad: 'C'`: «Apila sobre Re con las notas de Do mayor»: no dice el tipo; al completarlo
 *    se revela (título y guía).
 *  - `romano: 'vi'` + `tonalidad: 'C4'`: «Construye el vi de Do mayor»: no viene ninguna nota; se tocan las tres.
 *  - `inversion: 1 | 2`: la tecla marcada es el BAJO (la 3.ª o la 5.ª) y las otras dos van encima de ella; las
 *    casillas van de abajo arriba (3 · 5 · 1 o 5 · 1 · 3) y la guía dice 3m / 3M / 4J.
 * Opción de la 4.5:
 *  - `voicing: 'abierto'`: «Abre Do mayor desde Do3»: la fundamental marcada abajo, encima la 5.ª y la 3.ª UNA OCTAVA
 *    más arriba (C3 · G3 · E4). Aquí sí cuenta la octava: la nota justa en otra octava es un fallo que lo explica.
 *    Casillas 1 · 5 · 3 y guía 5J / 6M (o 6m).
 * Vale la nota en cualquier octava (en una inversión, siempre encima del bajo; en el abierto, solo la exacta); la que
 * se tocó queda marcada.
 */
function Acorde({ paso, setAccion, siguiente, completar, fallo }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const [tocadas, setTocadas] = useState({}) // { 1: 'F#4', 2: 'A4' }: la tecla con la que se encontró cada casilla
  const [intento, setIntento] = useState(null) // { nota, ok, debajo }
  const [fallos, setFallos] = useState(0) // fallos seguidos (con 2, se marcan las que faltan)
  const [fallosRonda, setFallosRonda] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [sacudidas, setSacudidas] = useState({})
  const { senal, senalar } = useSenal()
  const ronda = rondas[r]
  const acorde = useMemo(() => acordeDeRonda(ronda), [ronda])
  const { raiz: raizAcorde, tipo, inv, notas, orden, partes, dada, abierto } = acorde
  const porTocar = useMemo(() => orden.map((_, j) => j).filter((j) => j !== dada), [orden, dada])
  const listo = porTocar.every((j) => tocadas[j])
  // Dos fallos seguidos: las que faltan se abren en rojo y la ronda termina (cuenta como mal).
  const perdida = !listo && fallos >= INTENTOS
  const terminada = listo || perdida
  const rojas = useMemo(() => (perdida ? porTocar.filter((j) => !tocadas[j]) : []), [perdida, porTocar, tocadas])
  const ultima = r === rondas.length - 1
  const escuchar = Boolean(ronda.escuchar)
  const revelar = Boolean(ronda.revelar || ronda.romano)
  const guia = !escuchar && ronda.guia !== false && (!revelar || terminada)
  const bajo = orden[0]
  const nombreDelAcorde = nombreAcorde(raizAcorde, tipo)
  const cifradoDelAcorde = inv ? cifradoInversion(raizAcorde, tipo, inv) : cifradoDe(raizAcorde, tipo)
  const pedido = ronda.cifrado ? cifradoDelAcorde : nombreDelAcorde
  const tonalidad = ronda.tonalidad ? nombreTonalidad(ronda.tonalidad, ronda.menor) : null
  const escala = ronda.tonalidad ? notasTonalidad(ronda.tonalidad, ronda.menor) : null
  const enEscala = (n) => !escala || escala.some((e) => Note.chroma(e) === Note.chroma(n))
  const sonidoAcorde = { notas: arpegioYAcorde(orden), intervalo: 0.4, duracion: 1.2 }
  // La nota de referencia: con `romano`, la tónica de la tonalidad; si no, la dada (fundamental o bajo).
  const referencia = ronda.romano ? (/\d/.test(ronda.tonalidad) ? ronda.tonalidad : `${ronda.tonalidad}4`) : bajo

  const onNoteOn = useCallback(
    (nota) => {
      const misma = orden.findIndex((n) => haciaArriba(n, nota) === 0) // la misma nota en cualquier octava
      // En el voicing abierto solo vale la nota exacta; la misma en otra octava es un fallo que lo explica.
      const j = abierto ? orden.findIndex((n) => midi(n) === midi(nota)) : misma
      const encima = !inv || midi(nota) > midi(bajo)
      if (j >= 0 && (j === dada || tocadas[j] || (perdida && rojas.includes(j)))) return setSacudidas((s) => ({ ...s, [j]: (s[j] ?? 0) + 1 }))
      if (terminada) return
      const fallar = (datos) => {
        const f = fallos + 1
        setIntento({ nota, ok: false, ...datos })
        setFallos(f)
        setFallosRonda((x) => x + 1)
        if (f >= INTENTOS) {
          playNotes(orden, { modo: 'acorde', duracion: 1.4, retraso: 0.35 })
          fallo?.(r)
          if (ultima) completar({ aciertos, total: rondas.length })
        }
      }
      if (abierto && j < 0 && misma >= 0) return fallar({ octava: misma })
      if (j >= 0 && encima) {
        const nuevas = { ...tocadas, [j]: nota }
        setTocadas(nuevas)
        setIntento({ nota, ok: true })
        setFallos(0)
        if (porTocar.every((k) => nuevas[k])) {
          playNotes(orden, { modo: 'acorde', duracion: 1.4, retraso: 0.35 })
          const total = aciertos + (fallosRonda === 0 ? 1 : 0)
          setAciertos(total)
          if (ultima) completar({ aciertos: total, total: rondas.length })
        }
      } else {
        fallar({ debajo: j >= 0 })
      }
    },
    [orden, inv, abierto, bajo, dada, tocadas, terminada, perdida, rojas, porTocar, aciertos, fallos, fallosRonda, ultima, r, rondas.length, completar, fallo],
  )

  useEffect(() => {
    let feedback = null
    const notasEs = (lista) => lista.map((n) => nombre(n, { octava: false })).join(' · ')
    if (listo) {
      const [abajo, arriba] = TRIADAS[tipo].terceras
      feedback = {
        tipo: 'bien',
        titulo:
          ronda.titulo ??
          (ronda.romano
            ? `¡${ronda.romano} = ${cifradoDelAcorde}!`
            : abierto
              ? `¡${Mayus(nombreDelAcorde)} abierto!`
              : `¡${Mayus(inv ? cifradoDelAcorde : nombreDelAcorde)}!`),
        texto:
          ronda.mensaje ??
          (abierto
            ? `${notasEs(orden)}: la 3.ª subió una octava y dejó aire en medio.`
            : inv
            ? `${notasEs(orden)}: ${Mayus(nombreDelAcorde)} con la ${PARTES[inv]} en el bajo.`
            : `${notasEs(notas)}: ${TERCERA[abajo].nombre} y encima ${TERCERA[arriba].nombre}.`),
      }
    } else if (perdida) {
      const faltan = rojas.map((j) => nombre(orden[j], { octava: false })).join(' y ')
      feedback = {
        tipo: 'error',
        titulo: `Faltaba${rojas.length === 1 ? '' : 'n'} ${faltan}.`,
        texto: `${Mayus(inv ? cifradoDelAcorde : nombreDelAcorde)} = ${notasEs(orden)}. Al final lo repasas.`,
        plegable: true,
      }
    } else if (intento && !intento.ok) {
      const tocada = nombre(Note.fromMidiSharps(Note.midi(intento.nota)), { octava: false })
      const desde = nombre(dada === null ? referencia : bajo, { octava: false })
      const d = haciaArriba(dada === null ? referencia : bajo, intento.nota)
      const marco = ''
      const pista = ronda.pista ? ` ${ronda.pista}` : ''
      let titulo = `Esa es ${tocada}.`
      let texto
      if (abierto && intento.octava === 0) {
        titulo = `${Mayus(tocada)} ya está abajo.`
        texto = `En el voicing abierto la fundamental va sola en el grave, en **${nombre(simple(bajo))}**. Encima van la **5.ª** y la **3.ª**.`
      } else if (abierto && intento.octava !== undefined) {
        const esTercera = partes[intento.octava] === 1
        titulo = `${Mayus(tocada)}, pero en otra octava.`
        texto = esTercera
          ? `${Mayus(tocada)} es la **3.ª**: en el abierto sube **una octava**, por encima de la 5.ª.`
          : `${Mayus(tocada)} es la **5.ª**: va a una **5.ª justa** (7 semitonos) de ${nombre(simple(bajo))}, justo encima.`
      } else if (inv && intento.debajo) {
        titulo = `${Mayus(tocada)} va encima del bajo.`
        texto = `En ${cifradoDelAcorde} la más grave es **${nombre(bajo, { octava: false })}**: toca las otras dos **a su derecha**.`
      } else if (inv) {
        const otras = orden.slice(1).map((n) => `**${nombre(n, { octava: false })}**`).join(' y ')
        texto = `${Mayus(nombreDelAcorde)} = ${notasEs(notas)}. Con ${nombre(bajo, { octava: false })} en el bajo, encima van ${otras}.`
      } else if (ronda.romano) {
        texto = enEscala(intento.nota)
          ? `El **${ronda.romano}** se apila sobre el **${GRADOS_CORTOS[acordeDeGrado(ronda.tonalidad, ronda.romano, { menor: ronda.menor }).grado - 1]}** grado de ${tonalidad}, nota sí, nota no por la escala.`
          : `${Mayus(tocada)} no está en ${tonalidad}: usa solo sus notas.`
      } else if (revelar) {
        texto = enEscala(intento.nota)
          ? `De ${desde} a ${tocada} hay ${plural(d)}. Nota sí, nota no: salta una nota de ${tonalidad ?? 'la escala'} cada vez.`
          : `${Mayus(tocada)} no está en ${tonalidad}: usa solo sus notas.`
      } else {
        const [abajo, arriba] = TRIADAS[tipo].terceras
        const falta = porTocar.filter((j) => !tocadas[j])
        const busca = escuchar
          ? 'Escucha otra vez: la del medio decide si es mayor o menor.'
          : falta
              .map((j) =>
                abierto
                  ? partes[j] === 1
                    ? `la **3.ª**, a ${plural(abajo + 12)} (una octava más arriba de lo normal)`
                    : `la **5.ª** está a ${plural(abajo + arriba)}`
                  : partes[j] === 1
                    ? `la **3.ª** está a ${plural(abajo)} (${TERCERA[abajo].nombre})`
                    : `la **5.ª**, a ${plural(abajo + arriba)} (${TERCERA[arriba].nombre} sobre la 3.ª)`,
              )
              .join(' y ')
        texto = `De ${desde} a ${tocada} hay ${plural(d)} hacia arriba. ` + (escuchar ? busca : `${Mayus(busca)}.`)
      }
      feedback = { tipo: 'mal', titulo, texto: texto + pista + marco, plegable: true }
    }
    const cuantas = porTocar.filter((j) => tocadas[j]).length
    const faltan = `(${cuantas}/${porTocar.length})`
    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      disabled: !terminada,
      ayuda:
        terminada || feedback
          ? null
          : ronda.romano
            ? `Toca las tres notas ${faltan}`
            : abierto
              ? `Toca la 5.ª y la 3.ª, una octava arriba ${faltan}`
            : inv
              ? `Toca las otras dos encima del bajo ${faltan}`
              : escuchar
                ? `Toca la 3.ª y la 5.ª que oíste ${faltan}`
                : `Toca la 3.ª y la 5.ª ${faltan}`,
      feedback,
      onClick: () => {
        if (ultima) return siguiente()
        const next = rondas[r + 1]
        const a = acordeDeRonda(next)
        setR(r + 1)
        setTocadas({})
        setIntento(null)
        setFallos(0)
        setFallosRonda(0)
        setSacudidas({})
        if (next.escuchar) playNotes(arpegioYAcorde(a.orden), { intervalo: 0.4, duracion: 1.2 })
        else if (next.romano) playNotes(/\d/.test(next.tonalidad) ? next.tonalidad : `${next.tonalidad}4`)
        else playNotes(a.orden[0])
      },
    })
  }, [listo, perdida, rojas, intento, ronda, tipo, inv, abierto, notas, orden, partes, porTocar, bajo, dada, referencia, tocadas, escuchar, revelar, tonalidad, nombreDelAcorde, cifradoDelAcorde, ultima, r, rondas, setAccion, siguiente])

  // Perdida (dos fallos seguidos): las que faltan, en rojo y en su sitio (encima del bajo).
  const marcadas = [...(dada === null ? [] : [simple(bajo)]), ...Object.values(tocadas)]
  const estados = rojas.length ? Object.fromEntries(rojas.map((j) => [orden[j], 'mal'])) : undefined
  const chipNota = (n) => <span className="rounded-md bg-fijate-claro px-1.5">{nombre(simple(n))}</span>
  const subrayado = (texto, dato) => (
    <span className={`underline decoration-fijate decoration-4 underline-offset-4 ${dato ? 'font-dato font-medium' : ''}`}>{texto}</span>
  )

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={terminada} />

      <motion.div key={`frase-${r}`} {...ENTRA_DERECHA} className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold leading-snug sm:text-2xl" data-frase-acorde>
          {escuchar ? (
            <>Escucha y construye el acorde desde {chipNota(bajo)}</>
          ) : ronda.romano ? (
            <>
              Construye el {subrayado(ronda.romano, true)} de <strong className="font-semibold">{tonalidad}</strong>
            </>
          ) : revelar ? (
            <>
              Apila sobre {chipNota(bajo)}
              {tonalidad && <> con las notas de {tonalidad}</>}
            </>
          ) : abierto ? (
            <>
              Abre {subrayado(pedido, ronda.cifrado)} desde {chipNota(bajo)}
            </>
          ) : inv ? (
            <>
              Construye {subrayado(pedido, ronda.cifrado)} con {chipNota(bajo)} en el bajo
            </>
          ) : (
            <>
              Construye {subrayado(pedido, ronda.cifrado)} desde {chipNota(bajo)}
            </>
          )}
        </p>
        {/* «Escucha y construye»: el acorde ES la pregunta. Si no, la nota de partida ya es un recuadro que suena. */}
        {escuchar && <BotonSonido sonido={sonidoAcorde} etiqueta="Escuchar" className="min-h-12 shrink-0 py-1.5 pl-2 pr-4" />}
      </motion.div>

      <FilaAcorde
        key={`fila-${r}`}
        orden={orden}
        partes={partes}
        dada={dada}
        tocadas={tocadas}
        rojas={rojas}
        guia={guia}
        revelada={revelar}
        senal={senal}
        sacudidas={sacudidas}
        alTocar={(n, i) => {
          playNotes(n)
          senalar(simple(n), i)
        }}
      />

      {terminada && (
        <motion.div {...SUBE}>
          <BotonSonido
            sonido={sonidoAcorde}
            etiqueta={`Escuchar ${inv ? cifradoDelAcorde : nombreDelAcorde}`}
            onNotas={(ns, i) => senalar(ns.flat().map(simple), i < 3 ? i : null)}
            className="w-full"
          />
        </motion.div>
      )}

      <Piano {...paso.piano} compacto onNoteOn={onNoteOn} marcadas={marcadas} estados={estados} ir={simple(dada === null ? referencia : bajo)} senalar={senal} />
    </div>
  )
}

const GRADOS_CORTOS = ['1.er', '2.º', '3.er', '4.º', '5.º', '6.º', '7.º']

/**
 * El acorde como una fila de tres casillas de abajo arriba (en estado fundamental: fundamental, 3.ª, 5.ª; en una
 * inversión, el bajo primero): la dada ya va en verde; las otras con «?» hasta encontrarlas. Con `guia`, entre cada
 * pareja el intervalo que la separa (3M / 3m / 4J), que aparece con un pop si llega al final (`revelar`).
 * Debajo, qué parte es cada una: 1 · 3 · 5, 3 · 5 · 1 o 5 · 1 · 3.
 */
function FilaAcorde({ orden, partes, dada, tocadas, rojas = [], guia, revelada = false, senal, sacudidas = {}, alTocar }) {
  const columnas = { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
  const saltos = orden.slice(1).map((n, j) => APILADO[midi(n) - midi(orden[j])])
  return (
    <div className="flex flex-col gap-1.5" data-fila-acorde>
      {guia && (
        <div className="grid gap-1.5" style={columnas} aria-label={`Intervalos: ${saltos.map((s) => s?.nombre).join(' y ')}`} data-guia-acorde>
          {orden.map((_, i) => (
            <span key={i} className="relative h-6">
              {i > 0 && (
                <motion.span
                  initial={revelada ? { scale: 0.6, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={RESORTE.pulsar}
                  className="absolute left-0 top-0 -ml-[3px] grid h-6 -translate-x-1/2 place-items-center rounded-full bg-zinc-100 px-2 font-dato text-sm font-medium text-zinc-700"
                >
                  {saltos[i - 1]?.corto}
                </motion.span>
              )}
            </span>
          ))}
        </div>
      )}
      <ol className="grid gap-1.5" style={columnas}>
        {orden.map((n, i) => {
          const mal = rojas.includes(i)
          const hecha = i === dada || Boolean(tocadas[i]) || mal
          return (
            <CasillaFormula
              key={i}
              hecha={hecha}
              mal={mal}
              ahora={false}
              salta={i !== dada && hecha}
              suena={Boolean(senal?.activa && senal.i === i)}
              sacude={sacudidas[i] ?? 0}
              onTocar={alTocar && hecha ? () => alTocar(n, i) : undefined}
              etiqueta={hecha ? `${PARTES[partes[i]]}: escuchar ${nombre(n)}` : `${PARTES[partes[i]]}: por descubrir`}
            >
              {hecha ? nombre(n, { octava: false }) : <Candado className="size-[18px] text-zinc-400" />}
            </CasillaFormula>
          )
        })}
      </ol>
      <div className="grid gap-1.5" style={columnas} aria-hidden data-partes-acorde>
        {partes.map((p, i) => (
          <span key={i} className="text-center font-dato text-sm font-medium tabular-nums text-zinc-500">
            {GRADO_PARTE[p]}
          </span>
        ))}
      </div>
    </div>
  )
}
