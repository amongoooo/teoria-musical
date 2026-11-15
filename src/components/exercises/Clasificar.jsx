import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { pararProgramado } from '../../audio/engine.js'
import { reproducir } from '../../audio/sonido.js'
import { acentoLeccion } from '../../content/index.js'
import { tinta } from '../../ui/color.js'
import { Bombilla, Check } from '../../ui/Iconos.jsx'
import { ENTRA_DERECHA, RESORTE, SALTO } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import { IconoPlay } from '../BotonSonido.jsx'
import { LetraFuncion, fondoFuncion } from '../MapaFunciones.jsx'
import Rich from '../Rich.jsx'
import Rondas from './Rondas.jsx'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function mezclar(n) {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * «Clasificar» (O8, lección 5.1): fichas que suenan y se mandan a una caja.
 *
 * paso.cajas: ['T', 'S', 'D'] (funciones; el fondo de cada caja, el de su función)
 * paso.rondas: [{ pregunta, fichas: [{ nombre, detalle, sonido, caja: 'T' }], explicacion }]
 *  - Ficha sin `nombre` = de oído: se ve como A, B, C… con su botón de escuchar.
 *  - Tocar una ficha de abajo la elige (y suena); tocar una caja (o una ficha que ya está en ella) la manda ahí. Sin
 *    ninguna elegida, tocar una ficha ya puesta la devuelve abajo.
 *  - Con todas puestas, «Comprobar»: las bien, en verde con ✓; las mal pasan a su caja en oro con bombilla.
 * Puntúa una ficha por acierto.
 */
export default function Clasificar({ paso, leccionId, setAccion, siguiente, completar }) {
  const color = acentoLeccion(leccionId)
  const cajas = paso.cajas ?? ['T', 'S', 'D']
  const rondas = paso.rondas
  const [r, setR] = useState(0)
  const [ordenes] = useState(() => rondas.map((ronda) => mezclar(ronda.fichas.length)))
  const ronda = rondas[r]
  const n = ronda.fichas.length
  const [puesta, setPuesta] = useState(() => Array(n).fill(null)) // ficha → caja elegida
  const [elegida, setElegida] = useState(null)
  const [resultado, setResultado] = useState(null) // null | [bool por ficha]
  const [aciertos, setAciertos] = useState(0)
  const [sonando, setSonando] = useState(null)
    useEffect(() => () => pararProgramado(), [])

  const respondida = resultado !== null
  const ultima = r === rondas.length - 1
  const faltan = puesta.filter((c) => c === null).length
  const total = rondas.reduce((s, x) => s + x.fichas.length, 0)
  const etiqueta = (i) => ronda.fichas[i].nombre ?? LETRAS[ordenes[r].indexOf(i)]

  const sonar = (i) => {
    const s = ronda.fichas[i].sonido
    if (!s) return
    setSonando(i)
    reproducir(s, { alParar: () => setSonando((x) => (x === i ? null : x)) })
  }

  const tocarFicha = (i) => {
    sonar(i)
    if (respondida) return
    if (puesta[i] !== null) {
      // Ya estaba en una caja: vuelve abajo.
      const nueva = [...puesta]
      nueva[i] = null
      setPuesta(nueva)
      setElegida(null)
      return
    }
    setElegida((e) => (e === i ? null : i))
  }

  const tocarCaja = (c) => {
    if (respondida || elegida === null) return
    const nueva = [...puesta]
    nueva[elegida] = c
    setPuesta(nueva)
    setElegida(null)
  }

  useEffect(() => {
    if (!respondida) {
      setAccion({
        label: 'Comprobar',
        disabled: faltan > 0,
        ayuda: faltan === n ? (ronda.fichas[0].nombre ? 'Toca un acorde y luego su caja' : 'Escucha un sonido y toca su caja') : faltan > 0 ? `Falta${faltan === 1 ? '' : 'n'} ${faltan}` : null,
        onClick: () => {
          const bien = puesta.map((c, i) => c === ronda.fichas[i].caja)
          const suma = aciertos + bien.filter(Boolean).length
          setAciertos(suma)
          setResultado(bien)
          setElegida(null)
          if (ultima) completar({ aciertos: suma, total })
        },
      })
      return
    }
    const buenas = resultado.filter(Boolean).length
    setAccion({
      label: 'Continuar',
      avanza: ultima,
      feedback:
        buenas === n
          ? { tipo: 'bien', titulo: '¡Todas en su lugar!', texto: ronda.explicacion }
          : { tipo: 'mal', titulo: `${buenas} de ${n} bien`, texto: ronda.explicacion ?? 'Las de oro ya están en su caja: escúchalas otra vez.' },
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setPuesta(Array(rondas[r + 1].fichas.length).fill(null))
        setResultado(null)
        setElegida(null)
      },
    })
  }, [respondida, resultado, puesta, faltan, n, aciertos, ultima, r, ronda, rondas, total, setAccion, siguiente, completar])

  // Después de comprobar, cada ficha va a su caja correcta (las mal, en oro).
  const cajaDe = (i) => (respondida ? ronda.fichas[i].caja : puesta[i])
  const orden = ordenes[r]
  const enMano = orden.filter((i) => puesta[i] === null)

  const ficha = (i, enCaja) => {
    const estado = respondida ? (resultado[i] ? 'bien' : 'mal') : null
    const f = ronda.fichas[i]
    const deOido = !f.nombre
    return (
      <motion.div key={`${r}-${i}`} layoutId={`clasificar-${r}-${i}`} transition={RESORTE.suave} animate={estado === 'bien' ? SALTO : { scale: 1 }} className={enCaja ? 'w-full' : ''}>
        <Pulsable
          tipo="tarjeta"
          data-ficha={etiqueta(i)}
          data-estado={estado ?? (elegida === i ? 'elegida' : enCaja ? 'puesta' : 'mano')}
          onClick={(e) => {
            e.stopPropagation()
            // Con otra ficha elegida, tocar una que ya está en una caja = mandar la elegida a esa caja.
            if (enCaja && elegida !== null && elegida !== i && !respondida) tocarCaja(puesta[i])
            else tocarFicha(i)
          }}
          animate={{ y: elegida === i ? -4 : 0 }}
          aria-pressed={elegida === i}
          aria-label={`${deOido ? `Sonido ${etiqueta(i)}` : etiqueta(i)}${enCaja ? `, en ${cajaDe(i)}` : ''}`}
          className={`flex items-center justify-center gap-1.5 rounded-2xl border-2 transition-colors duration-200 ${
            enCaja ? 'min-h-11 w-full px-1.5 py-1' : 'min-h-14 min-w-[4.5rem] px-3 py-1.5'
          } ${claseFicha(estado, elegida === i)} ${sonando === i ? 'ring-4 ring-sky-300 dark:ring-sky-500' : ''}`}
        >
          {deOido && <IconoPlay sonando={sonando === i} />}
          <span className="flex flex-col items-center leading-tight">
            <span className={`font-titulo font-bold ${enCaja ? 'text-lg' : 'text-xl'}`}>{etiqueta(i)}</span>
            {f.detalle && !enCaja && <span className="font-dato text-sm font-medium opacity-70">{f.detalle}</span>}
          </span>
          {estado === 'bien' && <Check className="size-4 shrink-0" />}
          {estado === 'mal' && <Bombilla className="size-4 shrink-0" />}
        </Pulsable>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        {ronda.pregunta && (
          <p className="text-xl font-semibold leading-snug sm:text-2xl">
            <Rich>{ronda.pregunta}</Rich>
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {cajas.map((c) => {
            const dentro = orden.filter((i) => cajaDe(i) === c)
            const invita = elegida !== null && !respondida
            return (
              // La caja es un div que se toca (dentro van las fichas, que son botones: un botón no puede ir en otro).
              <motion.div
                key={c}
                data-caja={c}
                role="button"
                tabIndex={respondida ? -1 : 0}
                aria-disabled={respondida}
                onClick={() => tocarCaja(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    tocarCaja(c)
                  }
                }}
                whileTap={invita ? { scale: 0.98 } : undefined}
                transition={RESORTE.pulsar}
                aria-label={`Caja ${c}`}
                className={`flex min-h-36 min-w-0 flex-col items-center gap-2 rounded-3xl border-2 px-1.5 pb-2 pt-3 transition-colors duration-200 ${invita ? '' : 'border-transparent'}`}
                style={{ touchAction: 'manipulation', background: fondoFuncion(color, c), ...(invita ? { borderColor: tinta(color), borderStyle: 'dashed' } : null) }}
              >
                <LetraFuncion f={c} color={color} compacta />
                <span className="flex w-full flex-col gap-1.5">{dentro.map((i) => ficha(i, true))}</span>
              </motion.div>
            )
          })}
        </div>

        {!respondida && enMano.length > 0 && <div className="flex flex-wrap justify-center gap-2">{enMano.map((i) => ficha(i, false))}</div>}
      </motion.div>
    </div>
  )
}

function claseFicha(estado, elegida) {
  if (estado === 'bien') return 'border-bien bg-bien-suave text-bien-tinta'
  if (estado === 'mal') return 'border-fijate bg-fijate-suave text-fijate-tinta'
  if (elegida) return 'border-zinc-900 bg-white text-zinc-900'
  return 'border-zinc-200 bg-white text-zinc-900'
}
