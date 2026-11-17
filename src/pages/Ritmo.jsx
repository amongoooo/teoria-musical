import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { golpeAhora, iniciarPista, latenciaAudio, tiempoAudio } from '../audio/engine.js'
import ArranqueOido from '../components/ArranqueOido.jsx'
import FinPartida, { useMarcador } from '../components/FinPartida.jsx'
import CabeceraEntrenador from '../components/CabeceraEntrenador.jsx'
import PanelEntrenamiento, { textoAprobado } from '../components/PanelEntrenamiento.jsx'
import { avanceNivel } from '../progress/entrenamiento.js'
import { metaGuiada } from '../progress/metaGuiada.js'
import { Contador, Medidor, Pad, momentoToque } from '../components/PiezasRitmo.jsx'
import { useOpciones } from '../progress/opciones.js'
import { apuntarError, compensacionActual, tiendaRitmo } from '../progress/ritmo.js'
import { rutas } from '../router.js'
import { VIDAS_INFINITAS, ajusteAbsoluto, vidasDe } from '../theory/oido.js'
import {
  MODOS_RITMO,
  TIEMPOS,
  evaluar,
  eventosCompas,
  explicar,
  getModoRitmo,
  margenDe,
  margenEfectivo,
  objetivosDe,
  tempoDe,
} from '../theory/ritmo.js'
import { tinta } from '../ui/color.js'
import { Metronomo, Oreja } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import { RESORTE } from '../ui/movimiento.js'
import { BarraAccion } from './Leccion.jsx'

/** #/ritmo → panel del día; #/ritmo/seguir y #/ritmo/eco → entrenador. */
export default function Ritmo({ modo: modoId }) {
  const modo = modoId ? getModoRitmo(modoId) : null
  if (modo) return <Entrenador key={modo.id} modo={modo} />
  return (
    <PanelEntrenamiento
      titulo="Entrenamiento de ritmo"
      descripcion="Unos 5 minutos al día. Tocar a tiempo se entrena como un músculo."
      sugerencia="Sugerencia: 3 min de Seguir y 2 de Eco."
      nombre="ritmo"
      tienda={tiendaRitmo}
      modos={MODOS_RITMO}
      ruta={rutas.ritmo}
      Icono={Metronomo}
      volver={rutas.practicar('ritmo')}
      etiquetaVolver="Volver a Entrenar"
    />
  )
}


// ---------------------------------------------------------------------------
// Entrenador: una ronda = una pista de compases (iniciarPista). Cada compás tiene un tipo (entrada | demo | toca |
// cierre) que se decide cuando la pista lo pide (≈ 0,25 s antes de que empiece) y se guarda en `tipos`.
//  - Seguir: entrada → toca × 2 → cierre.
//  - Eco: entrada → (demo → toca) en bucle hasta que en un toca haya toques → cierre. 6 ciclos sin tocar: pausa.
//    El pad de seguimiento (arriba) se ilumina con cada golpe de la demo: hace primero lo que hay que copiar.
//  - Repaso (bocina, solo con la ronda ya evaluada; pedido del usuario): la app toca la respuesta correcta en el pad,
//    sin evaluar. Seguir: entrada → respuesta → cierre. Eco: entrada → demo → respuesta → cierre (pregunta y respuesta).
// ---------------------------------------------------------------------------

/** Ciclos de Eco sin tocar antes de quedar en pausa. */
const CICLOS_ECO = 6
const PEOR = { bien: 1, casi: 2, falta: 3 }

function Entrenador({ modo }) {
  const estado = tiendaRitmo.usar()
  const datos = tiendaRitmo.datosModo(modo.id, estado)
  const { gesto: sentidoGesto, admin } = useOpciones()
  const eco = modo.id === 'eco'
  const dificultad = ajusteAbsoluto(datos.ajustes, 'dificultad')
  const margen = margenDe(dificultad)
  const conSonido = datos.ajustes.pad !== 'mudo'

  const [jugando, setJugando] = useState(false)
  // Fin de la partida (pedido del usuario): al quedarse sin vidas, su pantalla con el resumen.
  const marcador = useMarcador()
  const [fin, setFin] = useState(null)
  const [vidas, setVidas] = useState(null)
  const vidasRef = useRef(null)
  const cambiarVidas = (v) => {
    vidasRef.current = v
    setVidas(v)
  }
  const [golpes, setGolpes] = useState(0)

  const [ronda, setRonda] = useState(null)
  const rondaRef = useRef(null)
  const contador = useRef(0)
  // La pista que suena y su plan: { clase: 'lista' | 'eco', lista, repaso }.
  const pistaRef = useRef(null)
  const planRef = useRef(null)
  const tiposRef = useRef([])
  // Toques en segundos desde el inicio de la pista, tal como se oyeron (sin compensar).
  const toquesRef = useRef([])
  const [toques, setToques] = useState([])
  // Dónde va la pista: compás, casilla, tiempo y segundos (se actualiza al cambiar de casilla).
  const [reloj, setReloj] = useState(null)
  // pausa | evaluada | null (sonando o sin empezar)
  const [fase, setFase] = useState(null)
  const [evaluacion, setEvaluacion] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [comp, setComp] = useState(compensacionActual())
  const compRef = useRef(comp)
  compRef.current = comp
  const [error, setError] = useState(null)
  // Destellos de los pads cuando SUENA un golpe del patrón: el de seguimiento (demo de Eco) y el tuyo (la respuesta).
  const [destellos, setDestellos] = useState({ demo: 0, respuesta: 0 })
  const ultimoGolpe = useRef('')
  const control = useRef({ evaluada: false, revisados: -1, ciclos: 0 })

  // Al abrir el modo, el nivel es el más alto al que has llegado (como en el de oído).
  useEffect(() => {
    const d = tiendaRitmo.datosModo(modo.id)
    if (d.nivel < d.nivelMax) tiendaRitmo.elegirNivel(modo.id, d.nivelMax)
  }, [modo.id])

  const parar = () => {
    pistaRef.current?.parar()
    pistaRef.current = null
  }
  useEffect(() => () => parar(), [])

  const pulsoDe = (r) => 60 / r.bpm
  const pasoDe = (r) => pulsoDe(r) / r.porTiempo

  /** Los compases `toca` que ya se decidieron. */
  const compasesToca = () => tiposRef.current.flatMap((t, k) => (t === 'toca' ? [k] : []))

  /** Toques que caen en los compases `ks` (desde media casilla antes hasta la gracia después). */
  const toquesDe = (ks, r = rondaRef.current) => {
    if (!ks.length) return []
    const pulso = pulsoDe(r)
    const compas = TIEMPOS * pulso
    const medio = pasoDe(r) / 2
    const gracia = Math.min(margen, medio)
    const desde = Math.min(...ks) * compas - medio
    const hasta = (Math.max(...ks) + 1) * compas + gracia
    return toquesRef.current.filter((t) => t >= desde && t < hasta)
  }

  const evaluarCompases = (ks, r = rondaRef.current, compensacion = comp) =>
    evaluar(objetivosDe(r, ks, pulsoDe(r)), toquesDe(ks, r), { margen, compensacion, paso: pasoDe(r) })

  /** Arranca la pista de la ronda `r` con el plan dado. */
  const arrancar = (r, plan) => {
    parar()
    planRef.current = plan
    tiposRef.current = []
    toquesRef.current = []
    control.current = { evaluada: plan.repaso, revisados: -1, ciclos: 0 }
    setToques([])
    setError(null)
    setReloj(null)
    if (!plan.repaso) {
      setFase(null)
      setEvaluacion(null)
      setResultado(null)
    }
    const porCompas = (k) => {
      const p = planRef.current
      let tipo = null
      if (p.clase === 'lista') tipo = p.lista[k] ?? null
      else if (k === 0) tipo = 'entrada'
      else if (p.cerrado) tipo = null
      else if (tiposRef.current[k - 1] === 'toca') {
        if (toquesDe([k - 1], r).length) {
          tipo = 'cierre'
          p.cerrado = true
        } else if (control.current.ciclos + 1 >= CICLOS_ECO) tipo = null
        else tipo = 'demo'
      } else tipo = tiposRef.current[k - 1] === 'demo' ? 'toca' : 'demo'
      tiposRef.current[k] = tipo
      return tipo ? eventosCompas(tipo, r) : null
    }
    pistaRef.current = iniciarPista(porCompas, { bpm: r.bpm, tiempos: TIEMPOS })
    // Solo en desarrollo: las pruebas de Playwright (docs/pruebas/ritmo.mjs) leen la pista para tocar a tiempo.
    if (import.meta.env.DEV) window.__ritmo = { pista: pistaRef.current, ronda: r, tipos: tiposRef.current, tiempoAudio, latenciaAudio }
  }

  const planJuego = () => (eco ? { clase: 'eco' } : { clase: 'lista', lista: ['entrada', 'toca', 'toca', 'cierre'] })

  // Desde una meta de una ruta o del curso: sin vidas y a tempo normal (ahí se aprende, no se compite).
  const guiada = () => metaGuiada()?.practica === 'ritmo'
  const tempoRonda = () => (guiada() ? 'normal' : tempoDe(tiendaRitmo.datosModo(modo.id).ajustes))

  const nueva = () => {
    const d = tiendaRitmo.datosModo(modo.id)
    const g = modo.generar(d.nivel, { ...d.ajustes, tempo: tempoRonda() }, rondaRef.current)
    contador.current += 1
    const r = { ...g, n: contador.current, nivel: d.nivel, tempo: tempoRonda() }
    rondaRef.current = r
    setRonda(r)
    window.scrollTo(0, 0)
    arrancar(r, planJuego())
  }

  const empezar = () => {
    tiendaRitmo.empezarSesion()
    const v = guiada() ? VIDAS_INFINITAS : vidasDe(datos.ajustes)
    cambiarVidas({ infinitas: v === VIDAS_INFINITAS, actual: v, max: v, alcanzados: [datos.nivel] })
    marcador.empezar(datos.nivel)
    setJugando(true)
    nueva()
  }

  const terminar = () => {
    setFin(marcador.resumen())
    parar()
    setJugando(false)
    setRonda(null)
    setFase(null)
    setEvaluacion(null)
    setResultado(null)
    window.scrollTo(0, 0)
  }

  /** Reinicia la ronda (tras una pausa). */
  const otraVez = () => arrancar(rondaRef.current, planJuego())

  /** Bocina (solo con tu turno terminado): la app toca la respuesta correcta en el pad. */
  const escuchar = () => {
    if (!rondaRef.current || fase !== 'evaluada') return
    const lista = eco ? ['entrada', 'demo', 'respuesta', 'cierre'] : ['entrada', 'respuesta', 'cierre']
    arrancar(rondaRef.current, { clase: 'lista', lista, repaso: true })
  }

  /** Cierra la ronda: registra el resultado, las vidas y el texto. */
  const cerrar = (ev, ks) => {
    control.current.evaluada = true
    const r = rondaRef.current
    // Una ronda = una respuesta; en tempo lento es práctica (cuenta para el día, no para aprobar el nivel).
    const res = tiendaRitmo.registrarRespuesta(modo.id, {
      item: r.item,
      bien: ev.buena,
      niveles: modo.niveles,
      dificultad,
      sinNivel: r.tempo === 'lento',
    })
    const vv = vidasRef.current
    if (vv && !vv.infinitas) {
      let { actual, alcanzados } = vv
      if (!ev.buena) actual -= 1
      if (res.subio && !alcanzados.includes(res.nuevoNivel)) {
        alcanzados = [...alcanzados, res.nuevoNivel]
        if (actual < vv.max) actual += 1
      }
      cambiarVidas({ ...vv, actual, alcanzados })
      if (actual < vv.actual) setGolpes((g) => g + 1)
      res.vidas = { antes: vv.actual, despues: actual, fin: actual <= 0 }
    }
    marcador.apuntar(ev.buena, res.nuevoNivel)
    setEvaluacion({ ks, ev })
    setResultado(res)
    setFase('evaluada')
  }

  const pausar = () => {
    parar()
    setFase('pausa')
    setReloj(null)
  }

  // Reloj: cada fotograma mira dónde va la pista; al pasar cada compás `toca` decide si evaluar.
  const tic = useRef(null)
  tic.current = () => {
    const pista = pistaRef.current
    const r = rondaRef.current
    if (!pista || !r) return
    const rel = tiempoAudio() - latenciaAudio() - pista.inicio
    const k = Math.floor(rel / pista.compas)
    const dentro = rel - k * pista.compas
    const casilla = Math.floor(dentro / pasoDe(r))
    const tiempo = Math.floor(dentro / pista.pulso)
    setReloj((a) => (a && a.k === k && a.casilla === casilla ? a : { k, casilla, tiempo, rel }))

    // Un golpe del patrón acaba de sonar en una demo o en la respuesta: su pad se ilumina.
    const t = tiposRef.current[k]
    if (t === 'demo' || t === 'respuesta') {
      const n = r.patron.filter((c) => (c / r.porTiempo) * pista.pulso <= dentro).length
      const clave = `${r.n}:${k}:${n}`
      if (n > 0 && clave !== ultimoGolpe.current) {
        ultimoGolpe.current = clave
        setDestellos((d) => ({ ...d, [t]: d[t] + 1 }))
      }
    }

    const c = control.current
    const plan = planRef.current
    if (!c.evaluada) {
      const gracia = Math.min(margen, pasoDe(r) / 2)
      // Compases `toca` ya terminados (más la gracia) que aún no se revisaron.
      for (let j = c.revisados + 1; j < tiposRef.current.length; j++) {
        if (rel < (j + 1) * pista.compas + gracia) break
        c.revisados = j
        if (tiposRef.current[j] !== 'toca') continue
        if (plan.clase === 'eco') {
          if (toquesDe([j]).length) {
            if (tiposRef.current[j + 1] !== 'cierre') parar()
            cerrar(evaluarCompases([j]), [j])
            return
          }
          c.ciclos += 1
          if (c.ciclos >= CICLOS_ECO) return pausar()
        } else if (tiposRef.current[j + 1] !== 'toca') {
          const ks = compasesToca()
          if (!toquesDe(ks).length) return pausar() // sin tocar nada: no castiga, queda en pausa
          cerrar(evaluarCompases(ks), ks)
          return
        }
      }
    }
    // Fin de la pista (el compás que toca ya no existe; un poco después, para que antes se revise el último `toca`).
    if (k >= 0 && tiposRef.current[k] === null && dentro > 0.15) {
      parar()
      setReloj(null)
      if (!control.current.evaluada) setFase('pausa')
    }
  }
  useEffect(() => {
    if (!jugando) return
    let frame = 0
    const bucle = () => {
      tic.current()
      frame = requestAnimationFrame(bucle)
    }
    frame = requestAnimationFrame(bucle)
    return () => cancelAnimationFrame(frame)
  }, [jugando])

  // Al ocultarse la pestaña: para y queda en pausa (si no estaba evaluada).
  useEffect(() => {
    const alCambiar = () => {
      if (document.visibilityState !== 'hidden' || !pistaRef.current) return
      parar()
      setReloj(null)
      if (!control.current.evaluada) setFase('pausa')
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  // Un toque en el pad (o la barra espaciadora).
  const toque = (e) => {
    if (conSonido) golpeAhora('toque')
    const pista = pistaRef.current
    const r = rondaRef.current
    if (!pista || !r || control.current.evaluada) return
    const t = momentoToque(e) - latenciaAudio() - pista.inicio
    toquesRef.current = [...toquesRef.current, t]
    setToques(toquesRef.current)
    // Medidor y retraso del dispositivo: el golpe más cercano de los compases `toca`.
    const objetivos = objetivosDe(r, compasesToca(), pista.pulso)
    const alcance = Math.min(0.25, pasoDe(r) / 2)
    let mejor = null
    for (const o of objetivos) if (!mejor || Math.abs(t - o.t) < Math.abs(t - mejor.t)) mejor = o
    if (mejor && Math.abs(t - mejor.t) <= alcance) {
      const compensada = apuntarError(t - mejor.t, margen)
      setComp(compensada)
      setError(t - mejor.t - compensada)
    }
  }
  const toqueRef = useRef(toque)
  toqueRef.current = toque
  useEffect(() => {
    if (!jugando) return
    const esEspacio = (e) => e.code === 'Space' && !e.target?.closest?.('input, textarea, select, [contenteditable="true"]')
    const abajo = (e) => {
      if (!esEspacio(e)) return
      e.preventDefault()
      if (e.repeat || document.querySelector('[role="dialog"]')) return
      toqueRef.current(e)
    }
    const arriba = (e) => {
      if (esEspacio(e)) e.preventDefault() // que no pulse el botón que tenga el foco
    }
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    return () => {
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
    }
  }, [jugando])

  // ---------------------------------------------------------------------------
  // Lo que se ve
  // ---------------------------------------------------------------------------

  const sonando = Boolean(pistaRef.current) && reloj
  const k = reloj?.k ?? -1
  const tipo = sonando ? (k < 0 ? 'entrada' : tiposRef.current[k]) : null
  const repaso = Boolean(planRef.current?.repaso)

  // Estado de cada golpe, con los toques que hay: antes de evaluar, lo que aún no pasa queda pendiente.
  let porCompas = []
  let estadosContador
  let ev = null
  if (ronda) {
    const alcance = Math.min(0.25, pasoDe(ronda) / 2)
    if (evaluacion) {
      ev = evaluacion.ev
      porCompas = evaluacion.ks.map((kk) => ev.golpes.filter((g) => g.k === kk).map((g) => g.estado))
      // Contador: lo peor de las pasadas por casilla y los toques de sobra.
      estadosContador = Array(ronda.casillas).fill(undefined)
      for (const g of ev.golpes) {
        const a = estadosContador[g.c]
        if (!a || PEOR[g.estado] > PEOR[a]) estadosContador[g.c] = g.estado
      }
      for (const s of ev.sobran) {
        const c = Math.round(s / pasoDe(ronda)) % ronda.casillas
        if (!ronda.patron.includes(c)) estadosContador[c] = 'sobra'
      }
    } else if (!eco) {
      const ks = compasesToca()
      const vivo = ks.length ? evaluarCompases(ks, ronda) : null
      const ahora = reloj?.rel ?? -Infinity
      const estadoVivo = (g) => (g.estado === 'falta' && g.t > ahora - alcance ? null : g.estado)
      // Dos pasadas (las filas de puntitos); las que aún no llegan, pendientes.
      const pasadas = ks.length ? ks : []
      porCompas = [0, 1].map((i) => {
        const kk = pasadas[i]
        if (kk === undefined || !vivo) return ronda.patron.map(() => null)
        return vivo.golpes.filter((g) => g.k === kk).map(estadoVivo)
      })
      // Contador: la pasada que suena ahora (o la última).
      const actualToca = tipo === 'toca' ? k : ks.filter((kk) => kk <= k).at(-1)
      if (vivo && actualToca !== undefined) {
        estadosContador = Array(ronda.casillas).fill(undefined)
        for (const g of vivo.golpes) if (g.k === actualToca) estadosContador[g.c] = estadoVivo(g) ?? undefined
      }
    }
  }

  /**
   * Guía del medidor (Seguir): cuánto le falta (−) o le sobra (+) a «ahora» respecto al golpe a tocar más cercano, con
   * el retraso del dispositivo descontado igual que en los toques. Solo mientras es tu turno.
   */
  const guia = () => {
    const pista = pistaRef.current
    const r = rondaRef.current
    const plan = planRef.current
    if (!pista || !r || control.current.evaluada || plan?.clase !== 'lista') return null
    const ks = plan.lista.flatMap((t, kk) => (t === 'toca' ? [kk] : []))
    const ts = objetivosDe(r, ks, pista.pulso).map((o) => o.t)
    if (!ts.length) return null
    const ahora = tiempoAudio() - latenciaAudio() - pista.inicio - compRef.current
    let i = 0
    for (let j = 1; j < ts.length; j++) if (Math.abs(ahora - ts[j]) < Math.abs(ahora - ts[i])) i = j
    const hueco = (a, b) => (a === undefined || b === undefined ? Infinity : Math.abs(b - a) / 2)
    return { d: ahora - ts[i], antes: hueco(ts[i - 1], ts[i]), despues: hueco(ts[i], ts[i + 1]) }
  }

  // Toques del compás `toca` de Eco que suena (un puntito neutro por toque).
  const toquesEco = eco && !evaluacion && tipo === 'toca' && ronda ? toquesDe([k], ronda).length : 0

  const verPatron = !eco || evaluacion || admin
  const patron = ronda && verPatron ? ronda.patron.map((c) => c / ronda.porTiempo) : []
  const colorCabezal = tipo === 'demo' ? 'var(--color-sky-500)' : tipo === 'toca' || tipo === 'respuesta' ? undefined : 'var(--color-zinc-500)'

  // Botón de abajo.
  let accion
  if (!jugando) accion = { label: 'Empezar', onClick: empezar, flotante: true }
  else if (fase === 'pausa') accion = { label: 'Continuar', onClick: otraVez, ayuda: eco ? 'Cuando quieras, otra vez' : 'No tocaste: cuando quieras, otra vez' }
  else if (fase !== 'evaluada') {
    const ayuda =
      tipo === 'demo' ? 'Escucha el patrón' : tipo === 'toca' ? (eco ? 'Tu turno: repítelo' : 'Toca los golpes con aro') : 'Entra después de la cuenta'
    accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda }
  } else {
    const fin = Boolean(resultado?.vidas?.fin)
    const exp = explicar(ev)
    let texto = exp.texto
    texto += textoAprobado(modo, resultado)
    if (resultado?.metaCumplida) texto += ' **¡Cumpliste tus 5 minutos de hoy!**'
    if (resultado?.vidas?.despues > resultado?.vidas?.antes) texto += ' **¡+1 vida!**'
    if (fin) texto += ' **¡Se acabaron las vidas!**'
    accion = {
      label: 'Continuar',
      onClick: fin ? terminar : nueva,
      feedback: { tipo: ev.buena ? 'bien' : 'mal', titulo: exp.titulo, texto },
    }
  }

  const avance = avanceNivel(datos, { dificultad })
  const nivelVisto = jugando && ronda ? (resultado?.subio ? resultado.nuevoNivel : ronda.nivel) : datos.nivel
  const vidasVista = jugando && vidas && !vidas.infinitas && { actual: vidas.actual, max: Math.max(1, vidas.max) }

  // Gesto del botón: solo pasa a la siguiente ronda ya evaluada.
  const navegacion = jugando
    ? {
        invertido: sentidoGesto === 'invertido',
        puede: (dir) => dir > 0 && fase === 'evaluada',
        ir: (dir) => {
          if (dir > 0) (resultado?.vidas?.fin ? terminar : nueva)()
        },
      }
    : null

  // Pad: la cuenta en la entrada y «Toca» en tu turno; mientras suena el patrón de Eco, en blanco y apagado (lo hace el
  // pad de seguimiento de arriba).
  let contenidoPad = 'Toca'
  if (tipo === 'entrada') contenidoPad = <span className="font-dato text-6xl font-medium tabular-nums">{Math.max(0, reloj?.tiempo ?? 0) + 1}</span>
  else if (tipo === 'demo') contenidoPad = <span className="block size-14" />
  const latido = sonando && k >= 0 ? k * TIEMPOS + reloj.tiempo : -1

  if (fin) {
    return (
      <FinPartida
        resumen={fin}
        titulo={modo.titulo}
        Icono={Metronomo}
        acento={`var(--color-dificultad-${dificultad})`}
        volver={rutas.practicar('ritmo')}
        etiquetaVolver="Volver a Entrenar"
        onOtra={() => setFin(null)}
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraEntrenador
        volver={rutas.practicar('ritmo')}
        etiquetaVolver="Volver a Entrenar"
        golpes={golpes}
        barra={{ clave: `${modo.id}-${jugando}`, avance, lleno: Boolean(resultado?.aprobado), acento: `var(--color-dificultad-${dificultad})` }}
        vidas={vidasVista || null}
        // La bocina solo se habilita con tu turno terminado (pedido del usuario): entonces toca la respuesta correcta.
        bocina={jugando ? { onClick: escuchar, disabled: !ronda || fase !== 'evaluada', sonando: repaso && Boolean(sonando) } : null}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4">
        {!jugando ? (
          <ArranqueOido modo={modo} datos={datos} tienda={tiendaRitmo} Icono={Metronomo} />
        ) : (
          <motion.div
            // En Seguir (pedido del usuario) la ronda nueva no se desliza: las casillas solo se apagan y se encienden
            // con el patrón nuevo; la transición queda para cuando cambia el nivel. En Eco, cada ronda entra.
            key={eco ? ronda.n : `nivel-${ronda.nivel}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
            className="flex flex-col gap-4"
            data-ronda={ronda.n}
            data-fase={fase ?? tipo ?? ''}
            data-repaso={repaso || undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tinta(modo.acento) }}>
                <Metronomo className="size-[18px]" />
                Ritmo · {modo.titulo}
              </span>
              <motion.span
                key={nivelVisto}
                initial={resultado?.subio ? { scale: 0.6, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={RESORTE.pulsar}
                data-nivel={nivelVisto}
                className="font-juego text-lg font-semibold tracking-wide"
                style={{ color: tinta(modo.acento) }}
              >
                Nivel {nivelVisto}
              </motion.span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{modo.pregunta}</h1>
              <span className="shrink-0 font-dato text-base font-medium tabular-nums text-zinc-500">{ronda.bpm} BPM</span>
            </div>

            <Contador
              tiempos={TIEMPOS}
              division={ronda.porTiempo}
              // Ya evaluada, el cabezal se esconde: así se ven todas las casillas (salvo al repasar con la bocina).
              actual={sonando && k >= 0 && (fase !== 'evaluada' || repaso) ? reloj.casilla : -1}
              patron={patron}
              color={modo.acento}
              estados={estadosContador}
              colorCabezal={colorCabezal}
            />

            {!eco && <Medidor error={error} tolerancia={margenEfectivo(margen, ronda, pulsoDe(ronda))} vacio="" guia={guia} />}

            <Historial filas={eco && !evaluacion ? null : porCompas} toques={toquesEco} />

            {/* Eco es pregunta y respuesta: el pad de seguimiento toca primero lo que hay que copiar. */}
            {eco && (
              <Pad
                soloVer
                chico
                color={modo.acento}
                destello={{ n: destellos.demo, fuerza: 1 }}
                atenuado={tipo !== 'demo'}
                data-pad-seguimiento={tipo === 'demo' ? 'suena' : ''}
                data-destellos={destellos.demo}
              >
                <Oreja className="size-8" />
              </Pad>
            )}

            <Pad
              onToque={toque}
              color={modo.acento}
              latido={latido}
              mostrarLatido={latido >= 0}
              atenuado={tipo === 'demo'}
              destello={{ n: destellos.respuesta, fuerza: 1 }}
              data-pad={tipo ?? ''}
              data-destellos={destellos.respuesta}
            >
              {contenidoPad}
            </Pad>
          </motion.div>
        )}
      </main>

      <BarraAccion accion={accion} navegacion={navegacion} />
    </div>
  )
}

/**
 * Puntitos bajo el contador. Seguir: una fila por pasada (verde = a tiempo, oro = fuera del margen, contorno de oro =
 * faltó, gris = aún no llega). Eco mientras se toca: un puntito neutro por toque (`toques`).
 */
function Historial({ filas, toques }) {
  if (!filas) {
    return (
      <div className="flex min-h-3 flex-wrap justify-center gap-1.5" data-historial="eco">
        {Array.from({ length: toques }, (_, i) => (
          <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={RESORTE.pulsar} className="size-3 rounded-full bg-zinc-400" />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1.5" data-historial="filas">
      {filas.map((fila, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {fila.map((e, j) => (
            <motion.span
              key={j}
              data-punto={e ?? 'pendiente'}
              animate={e ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`size-3 rounded-full transition-colors duration-200 ${
                e === 'bien' ? 'bg-bien-relleno' : e === 'casi' ? 'bg-fijate' : e === 'falta' ? 'border-2 border-fijate' : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
