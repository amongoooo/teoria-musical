import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { golpeAhora, iniciarPista, latenciaAudio, tiempoAudio } from '../audio/engine.js'
import { analizar } from '../letras/analisis.js'
import { POR_COMPAS, acentosATiempo, casillaDeToque, compasesPara, puedeMover, repartirConAcentos, silabasFlow } from '../letras/flow.js'
import { guardarLetra } from '../progress/letras.js'
import { GROOVES } from '../theory/bateria.js'
import { claro, oscuro, tinta } from '../ui/color.js'
import { Check, Reproducir } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useTemblor from '../ui/useTemblor.js'
import { Segmentado } from './Opciones.jsx'
import { Pad } from './PiezasRitmo.jsx'

/** Color del entrenamiento de letras: M6 (rosa). */
const ACENTO = 'var(--color-letras)'
const TEMPOS = [75, 90, 105]
/** «1 e y a»: lo que se ve en una casilla vacía. */
const CUENTA = ['', 'e', 'y', 'a']

/** El beat de fondo (bombo, caja y hi-hat) en tiempos, un poco más bajo que las sílabas. */
const BEAT = GROOVES.basico.map((e) => ({ nota: e.nota, t: e.inicio / 2, velocity: e.velocity * 0.75 }))

/**
 * Flow (Parte 4 del plan): un verso del cuaderno sobre las casillas del compás. Las sílabas (como se dicen, con
 * sinalefa) se colocan tocando el pad sobre el beat (una sílaba por toque), con «Repartir» o moviéndolas (tocar una
 * sílaba y luego una casilla libre). «Escuchar» toca el beat con las sílabas. Se guarda en la letra (`flows`, por el
 * texto del verso).
 */
export default function Flow({ letra }) {
  // Siempre «como se dicen» (con sinalefa), aunque el análisis esté en «palabra por palabra».
  const versos = useMemo(() => analizar(letra.texto).estrofas.flatMap((e) => e.versos), [letra.texto])
  const [iv, setIv] = useState(0)
  const verso = versos[Math.min(iv, versos.length - 1)]
  if (!verso) return null
  return (
    <div className="flex flex-col gap-5">
      <ElegirVerso versos={versos} iv={Math.min(iv, versos.length - 1)} onCambiar={setIv} />
      <FlowVerso
        key={verso.texto}
        verso={verso}
        guardado={letra.flows?.[verso.texto]}
        onGuardar={(c, bpm) => guardarLetra(letra.id, { flows: { ...(letra.flows ?? {}), [verso.texto]: { c, bpm } } })}
      />
    </div>
  )
}

function ElegirVerso({ versos, iv, onCambiar }) {
  const flecha = 'grid size-11 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white text-2xl font-bold text-zinc-700 disabled:opacity-40'
  return (
    <div className="flex items-center gap-3" data-elegir-verso={iv}>
      <Pulsable onClick={() => onCambiar(iv - 1)} disabled={iv === 0} aria-label="Verso anterior" className={flecha}>
        ‹
      </Pulsable>
      <motion.div key={iv} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={RESORTE.suave} className="flex min-w-0 flex-1 flex-col items-center text-center">
        <span className="font-dato text-sm font-medium text-zinc-500">
          {iv + 1} / {versos.length}
        </span>
        <span className="font-titulo text-xl font-bold leading-snug tracking-tight">{versos[iv].texto}</span>
      </motion.div>
      <Pulsable onClick={() => onCambiar(iv + 1)} disabled={iv >= versos.length - 1} aria-label="Verso siguiente" className={flecha}>
        ›
      </Pulsable>
    </div>
  )
}

/**
 * El flow de un verso (`verso` = el de `analizar()`). `guardado` = { c, bpm } con el que empieza; `onGuardar(c, bpm)`
 * al cambiar. En una lección (paso `flow`): `inicial` (casillas con las que empieza), `conRepartir` = false (sin el
 * botón que lo resuelve), `bloqueado` (ya comprobado: solo Escuchar) y `onCasillas(c)` para saber cómo va.
 */
export function FlowVerso({ verso, guardado, onGuardar = () => {}, inicial = [], conRepartir = true, bloqueado = false, onCasillas }) {
  const silabas = useMemo(() => silabasFlow(verso), [verso])
  const compases = compasesPara(silabas.length)
  const total = compases * POR_COMPAS
  const [bpm, setBpm] = useState(guardado?.bpm ?? 90)
  const [casillas, setCasillas] = useState(() => (guardado?.c?.length && guardado.c.length <= silabas.length ? guardado.c : inicial))
  useEffect(() => onCasillas?.(casillas), [casillas, onCasillas])
  const [modo, setModo] = useState('quieto') // quieto | grabando | sonando
  const [cuenta, setCuenta] = useState(null) // 1…4 mientras entra la cuenta
  const [cabezal, setCabezal] = useState(-1)
  const [elegida, setElegida] = useState(null) // sílaba elegida para moverla
  const pistaRef = useRef(null)
  const acaboRef = useRef(0) // cuándo terminó la última grabación (los toques que sobran no empiezan otra)
  const casRef = useRef(casillas)
  casRef.current = casillas

  const guardarRef = useRef(onGuardar)
  guardarRef.current = onGuardar
  const guardar = useCallback((c, b = bpm) => guardarRef.current(c, b), [bpm])

  const parar = useCallback(() => {
    pistaRef.current?.pista.parar()
    pistaRef.current = null
    setModo('quieto')
    setCuenta(null)
    setCabezal(-1)
  }, [])
  useEffect(() => () => pistaRef.current?.pista.parar(), [])

  const pulso = 60 / bpm
  const semicorchea = pulso / 4

  /** Grabar: un compás de cuenta (clics) y luego el beat; cada toque del pad coloca la siguiente sílaba. */
  const grabar = () => {
    setElegida(null)
    setCasillas([])
    casRef.current = []
    const pista = iniciarPista(
      (k) => {
        if (k === 0) return [0, 1, 2, 3].map((t) => ({ nota: 'click', t, velocity: t === 0 ? 1 : 0.6 }))
        return k <= compases ? BEAT : null
      },
      { bpm },
    )
    pistaRef.current = { pista, tipo: 'graba', fin: pista.compas * (compases + 1) + semicorchea }
    setModo('grabando')
  }

  /** Escuchar: el beat con las sílabas (las tónicas más fuertes), dos vueltas. */
  const escuchar = () => {
    if (modo === 'sonando') return parar()
    setElegida(null)
    const c = casRef.current
    const pista = iniciarPista(
      (k) => {
        if (k >= compases * 2) return null
        const desde = (k % compases) * POR_COMPAS
        const sil = c
          .map((casilla, i) => ({ casilla, i }))
          .filter(({ casilla }) => casilla >= desde && casilla < desde + POR_COMPAS)
          .map(({ casilla, i }) => ({ nota: 'tom', t: (casilla - desde) / 4, velocity: silabas[i].tonica ? 1 : 0.55 }))
        return [...BEAT, ...sil]
      },
      { bpm },
    )
    pistaRef.current = { pista, tipo: 'escucha', fin: pista.compas * compases * 2 }
    setModo('sonando')
  }

  // Reloj: la cuenta, la casilla que suena y el final.
  useEffect(() => {
    if (modo === 'quieto') return
    let raf = 0
    const paso = () => {
      const p = pistaRef.current
      if (!p) return
      const t = tiempoAudio() - latenciaAudio() - p.pista.inicio
      if (t >= p.fin) {
        if (p.tipo === 'graba') {
          guardar(casRef.current)
          acaboRef.current = performance.now()
        }
        parar()
        return
      }
      if (p.tipo === 'graba') {
        const k = Math.floor(t / p.pista.compas)
        setCuenta(k === 0 && t >= 0 ? Math.floor(t / p.pista.pulso) + 1 : null)
        setCabezal(k >= 1 ? Math.floor((t - p.pista.compas) / semicorchea) : -1)
      } else {
        setCabezal(t >= 0 ? Math.floor(t / semicorchea) % total : -1)
      }
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [modo, semicorchea, total, guardar, parar])

  /** Un toque del pad (o la barra espaciadora): sin grabar, empieza; grabando, coloca la siguiente sílaba. */
  const tocar = () => {
    if (bloqueado) return
    if (modo === 'sonando') parar()
    if (modo !== 'grabando') {
      if (performance.now() - acaboRef.current < 800) return
      return grabar()
    }
    const p = pistaRef.current
    const actuales = casRef.current
    if (!p || actuales.length >= silabas.length) return
    golpeAhora('toque', silabas[actuales.length].tonica ? 1 : 0.6)
    const t = tiempoAudio() - latenciaAudio() - p.pista.inicio - p.pista.compas
    if (t < -semicorchea / 2) return // aún en la cuenta
    const c = casillaDeToque(t, semicorchea, actuales.at(-1) ?? null, total)
    if (c == null) return
    const next = [...actuales, c]
    casRef.current = next
    setCasillas(next)
  }
  const tocarRef = useRef(tocar)
  tocarRef.current = tocar
  useEffect(() => {
    const alTeclado = (e) => {
      if (e.code !== 'Space' || e.repeat || /input|textarea/i.test(e.target?.tagName ?? '')) return
      e.preventDefault()
      tocarRef.current()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [])

  const repartirTodas = () => {
    parar()
    const c = repartirConAcentos(silabas, total)
    setCasillas(c)
    setElegida(null)
    guardar(c)
  }

  /** Mover: tocar una sílaba la elige; tocar una casilla libre entre sus vecinas la lleva ahí. */
  const tocarCasilla = (i, temblar) => {
    if (modo !== 'quieto' || bloqueado) return
    const s = casillas.indexOf(i)
    if (s >= 0) return setElegida(elegida === s ? null : s)
    if (elegida == null) return
    if (!puedeMover(casillas, elegida, i)) return temblar()
    const c = casillas.map((x, k) => (k === elegida ? i : x))
    setCasillas(c)
    setElegida(null)
    guardar(c)
  }

  const cambiarBpm = (b) => {
    parar()
    setBpm(b)
    guardar(casillas, b)
  }

  const acentos = acentosATiempo(silabas, casillas)
  const completas = casillas.length === silabas.length
  const siguiente = silabas[casillas.length]

  return (
    <div className="flex flex-col gap-5" data-flow={verso.texto} data-colocadas={casillas.length} data-modo={modo}>
      <Segmentado opciones={TEMPOS.map((b) => ({ id: b, nombre: `${b} BPM` }))} valor={bpm} onCambiar={cambiarBpm} capa="tempo-flow" />

      <Rejilla total={total} silabas={silabas} casillas={casillas} cabezal={cabezal} elegida={elegida} grabando={modo === 'grabando'} onCasilla={tocarCasilla} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-base text-zinc-600">
        <span>
          <span className="font-dato font-medium tabular-nums text-zinc-900">{silabas.length}</span> sílabas
          {compases > 1 && (
            <>
              {' · '}
              <span className="font-dato font-medium">2</span> compases
            </>
          )}
        </span>
        {completas && acentos.total > 0 && (
          <span
            data-acentos={`${acentos.bien}/${acentos.total}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              acentos.bien === acentos.total ? 'bg-bien-suave text-bien-tinta' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {acentos.bien === acentos.total && <Check className="size-4" />}
            <span className="font-dato">
              {acentos.bien}/{acentos.total}
            </span>
            acentos en el pulso
          </span>
        )}
      </div>

      <Pad
        color={ACENTO}
        onToque={tocar}
        atenuado={modo === 'sonando' || bloqueado}
        data-pad-flow
        aria-label={modo === 'grabando' ? 'Toca cada sílaba' : 'Grabar el flow'}
      >
        {modo === 'grabando' ? (
          cuenta ? (
            <span className="font-dato text-6xl font-medium">{cuenta}</span>
          ) : siguiente ? (
            <motion.span key={casillas.length} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={RESORTE.pulsar} className="font-dato text-5xl font-medium">
              {siguiente.texto}
            </motion.span>
          ) : (
            <Check className="size-14" />
          )
        ) : (
          <span className="flex items-center gap-2.5 font-juego text-2xl uppercase tracking-wide">
            <span aria-hidden className="size-4 rounded-full" style={{ backgroundColor: oscuro(ACENTO) }} />
            Grabar
          </span>
        )}
      </Pad>

      <div className={`grid gap-3 ${conRepartir ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Pulsable
          onClick={escuchar}
          disabled={!casillas.length || modo === 'grabando'}
          data-escuchar-flow
          className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 text-lg font-semibold transition-colors duration-200 disabled:opacity-40 ${
            modo === 'sonando' ? 'border-sky-500 bg-sky-50 text-sky-700 dark:text-sky-300' : 'border-zinc-200 bg-white text-zinc-800'
          }`}
        >
          <Reproducir className="size-5" /> {modo === 'sonando' ? 'Parar' : 'Escuchar'}
        </Pulsable>
        {conRepartir && (
          <Pulsable
            onClick={repartirTodas}
            disabled={modo === 'grabando'}
            data-repartir
            className="min-h-14 rounded-2xl border-2 border-zinc-200 bg-white text-lg font-semibold text-zinc-800 disabled:opacity-40"
          >
            Repartir
          </Pulsable>
        )}
      </div>
    </div>
  )
}

/**
 * Las casillas del compás (semicorcheas, en filas de 8): vacías muestran la cuenta «1 e y a»; con sílaba, rellenas
 * del rosa (la tónica, oscuro con texto blanco; las demás, suave). Aro celeste = la que suena; borde negro = la
 * sílaba elegida para moverla; las casillas a las que se puede mover, con borde punteado.
 */
function Rejilla({ total, silabas, casillas, cabezal, elegida, grabando, onCasilla }) {
  return (
    <div className="grid grid-cols-8 gap-1.5" data-rejilla={total}>
      {Array.from({ length: total }, (_, i) => {
        const s = casillas.indexOf(i)
        return (
          <Casilla
            key={i}
            i={i}
            silaba={s >= 0 ? silabas[s] : null}
            suena={i === cabezal}
            elegida={s >= 0 && s === elegida}
            destino={elegida != null && s < 0 && puedeMover(casillas, elegida, i)}
            grabando={grabando}
            onCasilla={onCasilla}
          />
        )
      })}
    </div>
  )
}

function Casilla({ i, silaba, suena, elegida, destino, grabando, onCasilla }) {
  const [ref, temblar] = useTemblor()
  const tiempo = i % 4 === 0
  return (
    <div ref={ref} className="min-w-0">
      <Pulsable
        onClick={() => onCasilla(i, temblar)}
        disabled={grabando}
        aria-label={silaba ? `Sílaba ${silaba.texto}` : `Casilla ${i + 1}`}
        data-casilla={i}
        data-silaba={silaba?.texto}
        data-tonica={silaba?.tonica || undefined}
        animate={elegida ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
        transition={RESORTE.pulsar}
        className={`grid h-12 w-full place-items-center rounded-xl border-2 px-0.5 font-dato text-sm leading-tight font-medium break-all transition-shadow duration-100 ${
          suena ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''
        } ${destino ? 'border-dashed' : ''}`}
        style={{
          backgroundColor: silaba ? (silaba.tonica ? oscuro(ACENTO) : claro(ACENTO)) : 'var(--color-white)',
          color: silaba ? (silaba.tonica ? 'var(--color-blanco)' : tinta(ACENTO)) : tiempo ? 'var(--color-zinc-500)' : 'var(--color-zinc-400)',
          borderColor: elegida ? 'var(--color-zinc-900)' : destino ? tinta(ACENTO) : silaba ? 'transparent' : tiempo ? 'var(--color-zinc-300)' : 'var(--color-zinc-200)',
        }}
      >
        {silaba ? silaba.texto : tiempo ? Math.floor(i / 4) % 4 + 1 : CUENTA[i % 4]}
      </Pulsable>
    </div>
  )
}
