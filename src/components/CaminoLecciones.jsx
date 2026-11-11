import { AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { estadoLeccion, getLeccion, getModulo, leccionAnterior, moduloDisponible } from '../content/index.js'
import { guardarReto, reiniciarLeccion } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Cerrar, Check, MarcaBien, Reproducir, Trofeo } from '../ui/Iconos.jsx'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import useDeslizar from '../ui/useDeslizar.js'
import Hoja from '../ui/Hoja.jsx'
import NavegadorModulos from './NavegadorModulos.jsx'

const ISLA = 80 // diámetro de cada isla (px)
const INSIGNIA = 72 // cuadrado con el número del módulo, al inicio del camino
const FILA = 196 // separación vertical entre islas en el celular
const ETIQUETA = 168 // ancho máximo del título de cada isla
const ONDA = 26 // ondulación del camino horizontal
const PUNTO = 16 // diámetro del puntito de la isla actual (los demás, la mitad)
// Isla abierta = «isla + bocadillo»: la isla crece hasta BOLA (con su aro de avance) y debajo
// cuelga un globo con la información. El centro de la bola queda en el punto del camino.
const BOLA = 112 // diámetro de la isla abierta
// «Tilt» de la isla abierta al chocar con un extremo del camino (px, grados, ms).
const TILT = { x: 12, grados: 3, vuelve: 250 }
// Barra de puntitos (dos animaciones):
//  - FLOTA: mientras el dedo está apoyado, la barra lo sigue con resistencia (como si flotara): en
//    vertical siempre; en horizontal solo si el dedo sale más allá del primer o del último puntito.
//    Se acerca a `max` px sin llegar nunca; al soltar vuelve a su sitio con RESORTE.suave.
//  - MATRACA: cada vez que el dedo llega a otro puntito, la barra da un golpe de inclinación que depende
//    SOLO de la posición de ese puntito en la barra (no del dedo): a la izquierda del centro gira en
//    sentido antihorario y a la derecha en sentido horario; la magnitud crece con la distancia al centro,
//    de 0° en el puntito central a `max` en los de las orillas (con 7: 3 · 2 · 1 · 0 · 1 · 2 · 3).
//    La inclinación vuelve a 0 a los `vuelve` ms. Contra un extremo, golpe del puntito de la orilla.
const FLOTA = { factor: 0.5, max: 14 }
// (Pedido del usuario: el doble de inclinación y la mitad de tiempo.) Los resortes son los de siempre
// (RESORTE.pulsar para el golpe y RESORTE.suave para volver) con rigidez ×4 y amortiguación ×2: igual de
// «secos», pero duran la mitad.
const MATRACA = {
  max: 3,
  vuelve: 50,
  golpe: { ...RESORTE.pulsar, stiffness: RESORTE.pulsar.stiffness * 4, damping: RESORTE.pulsar.damping * 2 },
  vuelta: { ...RESORTE.suave, stiffness: RESORTE.suave.stiffness * 4, damping: RESORTE.suave.damping * 2 },
}
const BARRA_ALTO = 124 // alto de la zona de la barra de puntitos (con su desvanecido): la isla abierta queda por encima
const ARO = 16 // el aro de avance sobresale de la bola
const SEPARA = 30 // de la bola al globo (deja sitio al labio y al piquito)
const ALTO_ESTIMADO = BOLA + SEPARA + 210 // alto de bola + globo hasta medirlo
const Y_ANCHO = 124 // altura del centro de la isla abierta en pantallas anchas
// Pantallas anchas: todo el camino se AMPLÍA (islas, bola, globo y camino a la vez) para llenar el
// espacio. Con el camino cerrado, según el ancho (columna por isla) hasta `maxCerrado`; con una isla
// abierta, además, que quepan el globo y sus vecinas (`anchoAbierta`) y que la bola y el globo quepan
// sobre la barra de puntitos, hasta `maxAbierta` (así el globo no queda gigante). Al abrir o cerrar,
// el zoom pasa de uno a otro con el mismo resorte.
const ZOOM = { maxCerrado: 1.8, maxAbierta: 1.5, anchoAbierta: 760, columna: 130, margenAlto: 96 }
// Desenfoque con una isla abierta (como fuera de foco), según la DISTANCIA a ella en islas: las de al
// lado apenas (el número se sigue leyendo), las siguientes más, y así. `pasos[d]` = px de desenfoque a
// distancia d (antes del zoom); más lejos, el último. Cada línea se desenfoca como la media de sus dos islas.
const DESENFOQUE = { pasos: [0, 1, 2.2, 3.4, 4.5] }

const lerp = (a, b, t) => a + (b - a) * t
const limitar = (v, a, b) => Math.min(b, Math.max(a, v))
/** Curva suave de 0 a 1 entre `a` y `b`. */
const suave = (v, a, b) => {
  const t = limitar((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
// Según lo abierta que está una isla (o, 0–1): primero el disco grande tapa a la pequeña
// (que sigue opaca debajo), después aparece su contenido. Nada de círculos translúcidos encima.
const opacidadDisco = (o) => suave(o, 0.12, 0.32)
const opacidadContenido = (o) => suave(o, 0.45, 0.85)
const opacidadChica = (o) => 1 - suave(o, 0.3, 0.36)
const opacidadTitulo = (o) => 1 - suave(o, 0, 0.25)
/** Rebote al final (las islas se despliegan desde la insignia y se pasan un poco de su sitio). */
const rebote = (t) => {
  const c = 1.4
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}
// Despliegue al entrar al módulo: cada isla sale de la insignia, una tras otra.
const DESPLIEGUE = { espera: 0.12, entre: 0.07, dura: 0.5 }

/** Px de desenfoque a una distancia (en islas, con decimales) de la isla abierta. */
const desenfoqueA = (d) => {
  const ps = DESENFOQUE.pasos
  const k = Math.floor(d)
  if (k >= ps.length - 1) return ps[ps.length - 1]
  return lerp(ps[k], ps[k + 1], d - k)
}
const filtro = (px) => (px > 0.05 ? `blur(${px.toFixed(2)}px)` : '')

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)

/** Retos del módulo: el reto del módulo (clave `M<número>`) y el reto de FL de cada lección que ya existe. */
export function retosDelModulo(modulo, progreso) {
  const lista = [{ clave: `M${modulo.numero}`, titulo: 'Reto del módulo', texto: modulo.reto, hecho: Boolean(progreso.retos[`M${modulo.numero}`]?.hecho) }]
  for (const l of modulo.lecciones) {
    const reto = getLeccion(l.id)?.pasos.find((p) => p.tipo === 'reto')
    if (!reto) continue
    lista.push({ clave: l.id, leccion: l, titulo: mayuscula(reto.titulo.replace(/^Reto en FL Studio:\s*/i, '')), texto: reto.objetivo, hecho: Boolean(progreso.retos[l.id]?.hecho) })
  }
  return lista
}

/**
 * Camino de lecciones en forma de islas.
 *  - Celular (< 560 px): vertical en zigzag. Pantallas anchas: horizontal y ondulado.
 *  - Empieza con un cuadrado con el número del módulo.
 *  - Al tocar una isla, crece (BOLA) y debajo sale un globo con su información y botones;
 *    las demás se apartan. Se cierra con ✕, tocando fuera o con Escape.
 *  - Con una isla abierta funciona como un CARRUSEL CONTINUO: la posición es un número real
 *    `p` (índice de la isla abierta + arrastre). Cada isla se coloca interpolando entre las
 *    disposiciones calculadas para «abierta = floor(p)» y «abierta = ceil(p)», y crece según lo
 *    cerca que esté de p. Deslizar de lado (useDeslizar, reglas de la skill) o arrastrar por la
 *    barra de puntitos de abajo mueve p; al soltar todo se asienta con resortes.
 *  - Las posiciones se escriben directamente en el DOM (sin re-render) en cada fotograma.
 */
export default function CaminoLecciones({ modulo, progreso, onAbierta }) {
  const ref = useRef(null)
  const lienzo = useRef(null) // capa ampliada (zoom) dentro del contenedor
  const anchoReal = useAncho(ref)
  const altoVentana = useAltoVentana()
  const lecciones = modulo.lecciones
  // Islas del camino: las lecciones y, al final (lado opuesto a la insignia), la isla de Retos.
  // El carrusel va por NODOS: el 0 es la insignia del módulo (también se abre con su tarjetita) y la
  // isla `i` es el nodo i + 1. Así la insignia tiene su puntito y desde ella se pasa al módulo anterior.
  const islasMeta = [...lecciones, { id: 'retos', titulo: 'Retos', esRetos: true }]
  const n = islasMeta.length // islas sin la insignia; los nodos van de 0 a n
  const retos = retosDelModulo(modulo, progreso)
  const retosHechos = retos.filter((r) => r.hecho).length
  const moduloCompleto = lecciones.every((l) => progreso.lecciones[l.id]?.completada)
  const estados = [...lecciones.map((l) => estadoLeccion(l.id, progreso)), retosHechos === retos.length ? 'hecha' : 'retos']
  const actual = estados.findIndex((e) => e === 'nueva' || e === 'empezada')
  const vecinoListo = (dir) => {
    const m = getModulo(modulo.numero + dir)
    return Boolean(m && moduloDisponible(m))
  }
  const [verModulos, setVerModulos] = useState(false)
  const [verRetos, setVerRetos] = useState(false)
  const vertical = anchoReal < 560
  const [altos, setAltos] = useState({}) // alto real (bola + globo) de cada isla abierta, medido
  // Zoom en pantallas anchas (ver ZOOM). Cada disposición se calcula en su ancho «sin ampliar» y la capa
  // `lienzo` se escala; en el celular, zoom = 1.
  const zoomCerrado = vertical || !anchoReal ? 1 : limitar(anchoReal / (ZOOM.columna * (n + 1)), 1, ZOOM.maxCerrado)
  const zoom = vertical || !anchoReal
    ? 1
    : limitar(
        Math.min(
          anchoReal / ZOOM.anchoAbierta,
          anchoReal / (ZOOM.columna * (n + 1)),
          (altoVentana - BARRA_ALTO - ZOOM.margenAlto) / (Math.max(ALTO_ESTIMADO, ...Object.values(altos)) + ARO * 2),
        ),
        1,
        ZOOM.maxAbierta,
      )
  const ancho = anchoReal / zoom // ancho sin ampliar con una isla abierta
  const grande = vertical ? Math.min(ancho - 24, 340) : 320 // ancho del globo
  const X = vertical ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho
  const reducir = useReducedMotion()
  const presente = useIsPresent() // false mientras la página se va (al cambiar de módulo)
  const resorte = reducir ? { duration: 0 } : RESORTE.pantalla

  const [abierta, setAbierta] = useState(null)
  const abiertaRef = useRef(null) // isla abierta (destino) o null
  const base = useMotionValue(0) // índice continuo de la isla abierta, sin contar el arrastre
  const apertura = useMotionValue(0) // 0 = camino cerrado, 1 = una isla abierta
  const despliegue = useMotionValue(0) // segundos desde que empezó el despliegue inicial

  // Disposición del camino cerrado y con cada isla abierta.
  const layouts = useMemo(
    () =>
      ancho
        ? {
            cerrado: calcular({ ancho: anchoReal / zoomCerrado, vertical, n, abierta: null, grande }),
            abiertas: Array.from({ length: n + 1 }, (_, j) => calcular({ ancho, vertical, n, abierta: j, grande, alto: altos[j] ?? ALTO_ESTIMADO })),
          }
        : null,
    [ancho, anchoReal, zoomCerrado, vertical, n, grande, altos],
  )

  // Elementos que se mueven a mano en cada fotograma.
  const els = useRef({ nodo: [], chica: [], difuso: [], grande: [], inclina: [], etiqueta: [], gris: [], color: [], linea: [], filtro: [], punto: [] }).current
  const uid = useId().replace(/:/g, '')
  const finDespliegue = DESPLIEGUE.espera + (n - 1) * DESPLIEGUE.entre + DESPLIEGUE.dura
  const guardar = (tipo, i) => (el) => (els[tipo][i] = el)

  const ultimaP = useRef(null)
  const posicion = () => base.get() + islas.progreso.get()

  // Abrir una isla (con el camino cerrado): si la isla y su globo no van a caber entre la parte de
  // arriba de la pantalla y la barra de puntitos, la página sube (o baja) PRIMERO y la isla se abre
  // cuando ya está en su sitio; así el globo nunca se mete bajo la barra. Si al final de la página no
  // hay sitio para subir, se añade el relleno justo debajo del camino.
  const relleno = useRef(null)
  const esperando = useRef(null) // isla que se abrirá al terminar de desplazar la página
  const abrir = (i) => {
    const L = layouts
    const cont = ref.current
    if (!L || !cont) return abrirYa(i)
    const dy = scrollPara(i) - window.scrollY
    if (Math.abs(dy) <= 4) return abrirYa(i)
    esperando.current = i
    desplazar(dy)
    alTerminarScroll(() => {
      if (esperando.current !== i) return
      esperando.current = null
      abrirYa(i)
    })
  }
  // Dónde debe estar la página con el nodo `k` abierto (pedido del usuario): si la isla (con su aro) y su
  // tarjetita caben enteras con la página ARRIBA DEL TODO, arriba del todo (así el título del módulo se ve
  // grande); si no, CENTRADAS en la zona libre entre la píldora de la cabecera y la barra de puntitos (si
  // tampoco caben, pegadas arriba de esa zona). Se calcula con la disposición, no con lo que se ve, así sirve
  // también a mitad de un cambio de isla.
  const scrollPara = (k) => {
    const L = layouts
    const cont = ref.current
    if (!L || !cont) return window.scrollY
    const top = cont.getBoundingClientRect().top + window.scrollY + (L.abiertas[k].nodos[k].y - BOLA / 2 - ARO) * zoom // en la página
    const alto = ((altos[k] ?? els.grande[k]?.offsetHeight ?? ALTO_ESTIMADO) + ARO) * zoom // aro + bola + globo
    const techo = (document.querySelector('[data-pildora-cabecera]')?.getBoundingClientRect().bottom ?? 60) + 12
    const barra = document.querySelector('[data-puntitos] [role=group]')?.getBoundingClientRect().top
    const piso = (barra != null ? barra - flotaY.get() : window.innerHeight - BARRA_ALTO) - 12
    if (top >= techo && top + alto <= piso) return 0
    return Math.max(0, top - (techo + Math.max(0, (piso - techo - alto) / 2)))
  }
  /** Relleno debajo del camino si la página no llega a `objetivo` (al final no hay sitio para subir). */
  const rellenar = (objetivo) => {
    if (!relleno.current) return
    const actual = relleno.current.offsetHeight
    const max = document.documentElement.scrollHeight - actual - window.innerHeight
    const falta = objetivo > max ? Math.ceil(objetivo - max) + 2 : 0
    if (Math.abs(falta - actual) > 1) relleno.current.style.height = `${falta}px`
  }
  /** Desplaza la página `dy` px (suave), con relleno si hace falta. */
  const desplazar = (dy) => {
    rellenar(window.scrollY + dy)
    window.scrollBy({ top: dy, behavior: reducir ? 'auto' : 'smooth' })
  }
  const abrirYa = (i) => {
    abiertaRef.current = i
    setAbierta(i)
    base.jump(i)
    animate(apertura, 1, resorte)
  }

  const irA = (i) => {
    if (i < 0 || i > n) return
    const antes = abiertaRef.current
    if (i === antes) return
    if (antes === null) return abrir(i)
    abiertaRef.current = i
    setAbierta(i)
    animate(base, i, resorte)
  }
  // Cerrar = vuelta a la vista completa del camino (sin desenfoque); la barra de puntitos sigue a la vista.
  const cerrar = () => {
    esperando.current = null
    if (relleno.current) relleno.current.style.height = '0px'
    abiertaRef.current = null
    setAbierta(null)
    animate(apertura, 0, resorte)
  }

  // Al pasar con un gesto: el índice cambia de golpe y useDeslizar compensa su progreso.
  const paso = (dir) => {
    const a = abiertaRef.current
    const sig = a + dir
    const desfase = base.get() - a // por si aún se movía hacia otra isla (p. ej. tras tocar un puntito)
    abiertaRef.current = sig
    setAbierta(sig)
    base.jump(sig + desfase)
    if (Math.abs(desfase) > 0.001) animate(base, sig, resorte)
  }
  const puede = (dir) => abiertaRef.current !== null && abiertaRef.current + dir >= 0 && abiertaRef.current + dir <= n
  // Hacia fuera desde la insignia (anterior) o desde Retos (siguiente), si ese módulo ya existe, el gesto
  // es de la página: cambia de módulo (useCambioModulo). Si no existe, aquí: «tilt».
  const acepta = (dir) => {
    const a = abiertaRef.current
    return !((a === 0 && dir < 0) || (a === n && dir > 0)) || !vecinoListo(dir)
  }

  // Para el swipe de página: con una isla abierta, solo desde los extremos (el resto es del camino).
  useEffect(
    () => onAbierta?.(abierta !== null ? { inicio: abierta === 0 && vecinoListo(-1), fin: abierta === n && vecinoListo(1) } : null),
    [abierta, onAbierta, n], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // En los extremos (no hay más islas) la isla abierta no se mueve: hace un pequeño «tilt» y un
  // desplazamiento corto hacia donde va el dedo, y a los 0,25 s vuelve a su sitio con un resorte.
  const tilt = useRef(null)
  const inclinar = (lado) => {
    const el = els.inclina[abiertaRef.current]
    if (!el || reducir) return
    clearTimeout(tilt.current)
    animate(el, { x: lado * TILT.x, rotate: lado * TILT.grados }, RESORTE.pulsar)
    tilt.current = setTimeout(() => animate(el, { x: 0, rotate: 0 }, RESORTE.suave), TILT.vuelve)
  }
  useEffect(() => () => clearTimeout(tilt.current), [])

  // Barra de puntitos: flota con el dedo (flotaX / flotaY) y hace de matraca (giro) al pasar de puntito.
  const flotaX = useMotionValue(0)
  const flotaY = useMotionValue(0)
  const giro = useMotionValue(0)
  const tiltBarra = useRef(null)
  /** Golpe de matraca al llegar al puntito `i` de `total`: sentido y magnitud según su lugar en la barra. */
  const matraca = (i, total) => {
    if (reducir) return
    clearTimeout(tiltBarra.current)
    animate(giro, gradosMatraca(i, total), MATRACA.golpe)
    tiltBarra.current = setTimeout(() => animate(giro, 0, MATRACA.vuelta), MATRACA.vuelve)
  }
  useEffect(() => () => clearTimeout(tiltBarra.current), [])

  const islas = useDeslizar({ activo: abierta !== null, umbral: X, onPaso: paso, puede, acepta, alTope: inclinar })


  /** Coloca cada isla, camino, título y puntito según la posición continua. */
  const actualizar = () => {
    const L = layouts
    const cont = ref.current
    if (!L || !cont) return
    const a = apertura.get()
    const p = posicion()
    const pc = limitar(p, 0, n)
    const fuera = p - pc // goma en los extremos: todo se desplaza un poco
    const i = Math.floor(pc)
    const j = Math.min(i + 1, n)
    const f = pc - i
    const A = L.abiertas[i]
    const B = L.abiertas[j]
    const C = L.cerrado
    const pos = []
    const td = despliegue.get()
    // Zoom de este fotograma: del cerrado al de isla abierta según la apertura. Las posiciones se
    // mezclan en píxeles reales y se pasan a la capa ampliada (dividiendo por z).
    const z = lerp(zoomCerrado, zoom, a)
    if (lienzo.current) {
      lienzo.current.style.width = `${anchoReal / z}px`
      lienzo.current.style.transform = z !== 1 ? `scale(${z})` : ''
    }
    const difuso = [] // px de desenfoque de cada nodo (para las líneas)
    for (let m = 0; m <= n; m++) {
      const lo = A.nodos[m]
      const hi = B.nodos[m]
      const c = C.nodos[m]
      const cerca = Math.max(0, 1 - Math.abs(pc - m)) // 1 = es el nodo de p
      const o = a * cerca // cuánto está abierto este nodo
      let ox = lerp(lo.x, hi.x, f) - (fuera * X) / zoom
      // En vertical, la que se va sale un poco hacia el lado del dedo y la que llega entra por el otro.
      if (vertical) ox -= (pc - m) * cerca * ancho * 0.5
      let x = lerp(c.x * zoomCerrado, ox * zoom, a) / z
      let y = lerp(c.y * zoomCerrado, lerp(lo.y, hi.y, f) * zoom, a) / z
      const esc = lerp(c.escala, lerp(lo.escala, hi.escala, f), a)
      // Despliegue inicial: la isla sale de la insignia (nodo 0) y llega a su sitio con un rebote.
      const sale = m === 0 ? 1 : limitar((td - DESPLIEGUE.espera - (m - 1) * DESPLIEGUE.entre) / DESPLIEGUE.dura, 0, 1)
      const dsp = m === 0 ? 1 : rebote(sale)
      if (m > 0 && sale < 1) {
        x = lerp(pos[0].x, x, dsp)
        y = lerp(pos[0].y, y, dsp)
      }
      pos.push({ x, y })
      const nodo = els.nodo[m]
      if (nodo) {
        nodo.style.transform = `translate3d(${x}px, ${y}px, 0)`
        nodo.style.zIndex = o > 0.001 ? String(10 + Math.round(o * 10)) : ''
      }
      const base = m === 0 ? INSIGNIA : ISLA // tamaño del nodo cerrado
      const tam = lerp(esc, BOLA / base, o) // escala del nodo pequeño (crece hasta el tamaño de la bola)
      // Desenfoque según la distancia a la isla abierta (solo con una abierta).
      const borroso = a * desenfoqueA(Math.abs(pc - m))
      difuso.push(borroso)
      if (els.difuso[m]) els.difuso[m].style.filter = filtro(borroso)
      const chica = els.chica[m]
      if (chica) {
        chica.style.transform = `scale(${tam * lerp(0.3, 1, Math.max(0, dsp))})`
        chica.style.opacity = String(opacidadChica(o) * limitar(sale * 4, 0, 1))
        chica.inert = o >= 0.5
      }
      const gr = els.grande[m]
      if (gr) {
        gr.style.transform = `translate(-50%, ${-BOLA / 2}px) scale(${(tam * base) / BOLA})`
        gr.style.opacity = String(opacidadDisco(o))
        gr.style.setProperty('--contenido', String(opacidadContenido(o)))
        gr.style.visibility = o > 0.002 ? 'visible' : 'hidden'
        gr.inert = o < 0.5
      }
      const et = els.etiqueta[m]
      if (et) {
        // Solo el texto (el fondo de la etiqueta, que tapa el camino, no se desenfoca).
        for (const hijo of et.children) hijo.style.filter = filtro(borroso)
        const conEtiqueta = lerp(c.etiqueta ? 1 : 0, lerp(lo.etiqueta ? 1 : 0, hi.etiqueta ? 1 : 0, f), a) * opacidadTitulo(o) * limitar(sale * 2 - 1, 0, 1)
        et.style.opacity = String(conEtiqueta)
        et.style.visibility = conEtiqueta > 0.01 ? 'visible' : 'hidden'
        et.style.width = `${lerp(c.anchoEtiqueta ?? ETIQUETA, lerp(lo.anchoEtiqueta ?? ETIQUETA, hi.anchoEtiqueta ?? ETIQUETA, f), a)}px`
      }
      const punto = els.punto[m]
      if (punto) punto.style.transform = `scale(${0.5 + 0.5 * a * cerca})`
    }
    const alto = lerp(C.alto * zoomCerrado, lerp(A.alto, B.alto, f) * zoom, a) // px reales
    cont.style.height = `${alto}px`
    if (lienzo.current) lienzo.current.style.height = `${alto / z}px`
    for (let s = 0; s < n; s++) {
      const d = curva(pos[s], pos[s + 1], vertical)
      if (els.gris[s]) els.gris[s].style.opacity = String(limitar(((td - DESPLIEGUE.espera - s * DESPLIEGUE.entre) / DESPLIEGUE.dura) * 3, 0, 1))
      els.gris[s]?.setAttribute('d', d)
      els.color[s]?.setAttribute('d', d)
      // La línea se desenfoca como la media de sus dos islas (filtro SVG con la zona justa de la línea).
      const bl = (difuso[s] + difuso[s + 1]) / 2
      const linea = els.linea[s]
      const fil = els.filtro[s]
      if (linea && fil) {
        if (bl > 0.05) {
          const mx = Math.min(pos[s].x, pos[s + 1].x) - 40
          const my = Math.min(pos[s].y, pos[s + 1].y) - 40
          fil.setAttribute('x', mx)
          fil.setAttribute('y', my)
          fil.setAttribute('width', Math.abs(pos[s].x - pos[s + 1].x) + 80)
          fil.setAttribute('height', Math.abs(pos[s].y - pos[s + 1].y) + 80)
          fil.firstChild.setAttribute('stdDeviation', bl.toFixed(2))
          linea.setAttribute('filter', `url(#${fil.id})`)
        } else linea.removeAttribute('filter')
      }
    }
    // Mientras se pasa de una isla a otra (también con el dedo aún apoyado, en la isla o en la barra), la
    // página va a la vez a donde debe quedar la isla que llega (ver scrollPara): al terminar ya está en su
    // sitio, sin esperar a soltar.
    if (a > 0.999 && p !== ultimaP.current && ultimaP.current !== null && esperando.current === null) {
      const objetivo = lerp(scrollPara(i), scrollPara(j), f)
      if (Math.abs(objetivo - window.scrollY) > 0.5) {
        rellenar(objetivo)
        window.scrollTo(0, objetivo)
      }
    }
    ultimaP.current = p
    cont.dataset.posicion = p.toFixed(3) // posición continua del carrusel (útil para pruebas)
  }
  // Mide el alto real de cada isla abierta (bola + globo) para apartar lo justo a las de abajo.
  useLayoutEffect(() => {
    if (!ancho || typeof ResizeObserver === 'undefined') return
    const medir = () =>
      setAltos((prev) => {
        let cambio = false
        const sig = { ...prev }
        els.grande.forEach((el, i) => {
          const h = el?.offsetHeight
          if (h && Math.abs((prev[i] ?? 0) - h) > 1) {
            sig[i] = h
            cambio = true
          }
        })
        return cambio ? sig : prev
      })
    medir()
    const ro = new ResizeObserver(medir)
    els.grande.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [ancho, grande, n, els])

  const actualizarRef = useRef(actualizar)
  actualizarRef.current = actualizar
  useLayoutEffect(() => actualizar())
  useEffect(() => {
    const quitar = [base, apertura, despliegue, islas.progreso].map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [base, apertura, despliegue, islas.progreso])

  // Al entrar al módulo, las islas se despliegan desde la insignia (sin movimiento si se pide reducirlo).
  const desplegado = useRef(false)
  useEffect(() => {
    if (!ancho || desplegado.current) return
    desplegado.current = true
    if (reducir) despliegue.set(finDespliegue)
    else animate(despliegue, finDespliegue, { duration: finDespliegue, ease: 'linear' })
  }, [ancho, reducir, despliegue, finDespliegue])

  // Escape, tocar fuera de las islas y de la barra o tocar la isla abierta la cierra (vista completa);
  // flechas: anterior / siguiente. (Tras un arrastre, useDeslizar anula ese «click», así que deslizar no cierra.)
  const abiertaSiNo = abierta !== null
  const irARef = useRef(irA)
  irARef.current = irA
  const cerrarRef = useRef(cerrar)
  cerrarRef.current = cerrar
  useEffect(() => {
    if (!abiertaSiNo) return
    const tecla = (e) => {
      if (document.querySelector('[role=dialog]')) return // la hoja abierta se encarga
      if (e.key === 'Escape') cerrarRef.current()
      else if (e.key === 'ArrowRight') irARef.current(abiertaRef.current + 1)
      else if (e.key === 'ArrowLeft') irARef.current(abiertaRef.current - 1)
    }
    const fuera = (e) => !e.target.closest?.('[data-nodo], [role=dialog]') && cerrarRef.current()
    document.addEventListener('keydown', tecla)
    document.addEventListener('click', fuera)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('click', fuera)
    }
  }, [abiertaSiNo])

  // Primera aparición: entrada escalonada; después, solo se mueven.
  const [montado, setMontado] = useState(false)
  useEffect(() => {
    if (!ancho) return
    const t = setTimeout(() => setMontado(true), 600)
    return () => clearTimeout(t)
  }, [ancho])

  // Ajuste final cuando la isla ya está en su sitio (p. ej. si su tarjetita resultó de otro alto).
  const ajusteRef = useRef(null)
  ajusteRef.current = { scrollPara, desplazar }
  useEffect(() => {
    if (abierta === null) return
    let t
    const revisar = () => {
      if (Math.abs(base.get() + islas.progreso.get() - abiertaRef.current) > 0.01 || apertura.get() < 0.99) return (t = setTimeout(revisar, 100))
      const dy = ajusteRef.current.scrollPara(abiertaRef.current) - window.scrollY
      if (Math.abs(dy) > 4) ajusteRef.current.desplazar(dy)
    }
    t = setTimeout(revisar, 300)
    return () => clearTimeout(t)
  }, [abierta, els, reducir, zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  const entrada = (indice) => ({
    initial: { scale: 0.6, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { ...RESORTE.suave, opacity: { duration: 0.2 }, delay: montado ? 0 : 0.05 + indice * 0.06 },
  })

  return (
    <>
      <div ref={ref} className="relative w-full select-none" style={{ height: ancho ? undefined : FILA * n, touchAction: 'pan-y' }} {...islas.handlers}>
        {ancho > 0 && (
          <div
            ref={lienzo}
            className="absolute left-0 top-0"
            style={{ transformOrigin: '0 0' }}
          >
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width="100%" height="100%" aria-hidden>
              {islasMeta.map((l, s) => (
                <g key={l.id} ref={guardar('linea', s)}>
                  <filter ref={guardar('filtro', s)} id={`difumina-${uid}-${s}`} filterUnits="userSpaceOnUse">
                    <feGaussianBlur stdDeviation="0" />
                  </filter>
                  <path ref={guardar('gris', s)} fill="none" stroke="var(--color-zinc-200)" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 14" style={{ opacity: 0 }} />
                  {(l.esRetos ? moduloCompleto : estados[s] !== 'bloqueada' && estados[s] !== 'proximamente') && (
                    <motion.path
                      ref={guardar('color', s)}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ ...RESORTE.suave, delay: montado ? 0 : DESPLIEGUE.espera + s * DESPLIEGUE.entre + 0.2 }}
                      fill="none"
                      style={{ stroke: modulo.acento }}
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Insignia del módulo (nodo 0): se abre como las islas, con su tarjetita */}
            <div ref={guardar('nodo', 0)} data-nodo className="absolute left-0 top-0 size-0">
              <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                <div ref={guardar('difuso', 0)}>
                  <div ref={guardar('chica', 0)} style={{ opacity: 0 }}>
                    <motion.div {...entrada(0)}>
                      <Pulsable
                        onClick={() => irA(0)}
                        aria-label={`Módulo ${modulo.numero}: ${modulo.titulo}`}
                        className="grid place-items-center rounded-3xl font-titulo text-3xl font-bold text-blanco"
                        style={{ width: INSIGNIA, height: INSIGNIA, backgroundColor: oscuro(modulo.acento), boxShadow: `0 6px 0 ${labio(modulo.acento)}` }}
                      >
                        {modulo.numero}
                      </Pulsable>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div ref={guardar('grande', 0)} className="absolute left-0 top-0" style={{ visibility: 'hidden', opacity: 0, width: grande, transformOrigin: `50% ${BOLA / 2}px` }}>
                <div ref={guardar('inclina', 0)} style={{ transformOrigin: `50% ${BOLA / 2}px` }}>
                  <InsigniaAbierta
                    modulo={modulo}
                    progreso={progreso}
                    actual={actual}
                    retosHechos={retosHechos}
                    totalRetos={retos.length}
                    onCerrar={cerrar}
                    onIr={irA}
                    onVerModulos={() => setVerModulos(true)}
                    total={n + 1}
                  />
                </div>
              </div>
            </div>

            {islasMeta.map((l, i) => {
              const estado = estados[i]
              const p = progreso.lecciones[l.id]
              const contenido = getLeccion(l.id)
              const texto = l.esRetos ? `${retosHechos}/${retos.length} hechos` : textoEstado(estado, p, contenido)
              return (
                <div key={l.id} ref={guardar('nodo', i + 1)} data-nodo className="absolute left-0 top-0 size-0">
                  <div>
                    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                      <div ref={guardar('difuso', i + 1)}>
                        <div ref={guardar('chica', i + 1)} style={{ opacity: 0 }}>
                          {l.esRetos ? (
                            <IslaRetos acento={modulo.acento} completo={estado === 'hecha'} descripcion={texto} onClick={() => irA(i + 1)} />
                          ) : (
                            <Isla
                              leccion={l}
                              estado={estado}
                              esActual={i === actual}
                              avance={estado === 'empezada' && contenido ? p.paso / contenido.pasos.length : 0}
                              acento={modulo.acento}
                              descripcion={texto}
                              onClick={() => irA(i + 1)}
                            />
                          )}
                        </div>
                      </div>
                      <span
                        ref={guardar('etiqueta', i + 1)}
                        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center rounded-xl bg-fondo px-2 py-0.5"
                        style={{ opacity: 0, ...(vertical ? { top: ISLA + 12 } : { bottom: ISLA + 10 }) }}
                      >
                        <span className={`line-clamp-2 text-center text-base font-semibold leading-snug ${estado === 'bloqueada' || estado === 'proximamente' ? 'text-zinc-500' : 'text-zinc-900'}`}>
                          {l.titulo}
                        </span>
                        {vertical && (
                          <span className={`text-center text-sm font-semibold ${i === actual ? '' : 'text-zinc-500'}`} style={i === actual ? { color: tinta(modulo.acento) } : undefined}>
                            {texto}
                          </span>
                        )}
                      </span>
                    </div>
                    <div ref={guardar('grande', i + 1)} className="absolute left-0 top-0" style={{ visibility: 'hidden', opacity: 0, width: grande, transformOrigin: `50% ${BOLA / 2}px` }}>
                      <div ref={guardar('inclina', i + 1)} style={{ transformOrigin: `50% ${BOLA / 2}px` }}>
                        {l.esRetos ? (
                          <RetosAbierta modulo={modulo} retos={retos} hechos={retosHechos} onCerrar={cerrar} onVer={() => setVerRetos(true)} />
                        ) : (
                          <IslaAbierta meta={l} modulo={modulo} progreso={progreso} indice={i} total={n} onCerrar={cerrar} onIr={(li) => irA(li + 1)} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Relleno para poder subir la página al abrir una isla del final (ver abrir()). */}
      <div ref={relleno} aria-hidden style={{ height: 0 }} />

      {createPortal(
        <AnimatePresence>
          {/* Siempre a la vista en el módulo (la de la página que se va se desvanece al cambiar de módulo). */}
          {ancho > 0 && presente && (
            <BarraPuntitos
              key="puntitos"
              lecciones={[{ id: 'insignia', titulo: modulo.titulo, esInsignia: true, numero: modulo.numero }, ...islasMeta]}
              estados={['insignia', ...estados]}
              abierta={abierta}
              acento={modulo.acento}
              guardar={guardar}
              onIr={irA}
              flotaX={flotaX}
              flotaY={flotaY}
              giro={giro}
              reducir={reducir}
              onMatraca={matraca}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
      <NavegadorModulos abierta={verModulos} onCerrar={() => setVerModulos(false)} actual={modulo.numero} />
      <HojaRetos abierta={verRetos} onCerrar={() => setVerRetos(false)} modulo={modulo} retos={retos} progreso={progreso} />
    </>
  )
}

/**
 * Barra de puntitos (de vidrio), siempre a la vista abajo en el módulo. Tocar un puntito abre su isla; arrastrar por la barra va **directo a la isla del
 * puntito más cercano al dedo** (siempre gana una: nunca se quedan dos islas a medio abrir), con el
 * resorte de pantalla. Además flota con el dedo y hace de matraca (ver FLOTA y MATRACA).
 */
function BarraPuntitos({ lecciones, estados, abierta, acento, guardar, onIr, flotaX, flotaY, giro, reducir, onMatraca }) {
  const sep = DESLIZAR.puntitos.separacion
  const pildora = useRef(null)
  const g = useRef(null) // gesto sobre la barra
  const soltar = (e) => {
    if (g.current?.id !== e.pointerId) return
    g.current = null
    animate(flotaX, 0, RESORTE.suave)
    animate(flotaY, 0, RESORTE.suave)
  }
  return (
    <motion.div
      data-nodo
      data-puntitos
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-12"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      initial={{ y: '120%' }}
      animate={{ y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={RESORTE.pantalla}
    >
      {/* Capa que flota con el dedo */}
      <motion.div style={{ x: flotaX, y: flotaY }}>
        {/* Capa de la matraca (giro) */}
        <motion.div
          role="group"
          aria-label="Lecciones del módulo"
          ref={pildora}
          className={`pointer-events-auto relative flex select-none items-center rounded-full px-3 ${VIDRIO}`}
          style={{ touchAction: 'none', rotate: giro }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            e.currentTarget.setPointerCapture?.(e.pointerId)
            const centros = [...pildora.current.querySelectorAll('[data-punto]')].map((b) => {
              const c = b.getBoundingClientRect()
              return c.left + c.width / 2
            })
            flotaX.stop()
            flotaY.stop()
            g.current = {
              id: e.pointerId,
              // Desde donde ya estaba (si aún volvía a su sitio), sin saltos.
              y0: e.clientY - desflotar(flotaY.get()),
              centros,
              punto: masCercano(centros, e.clientX),
              tope: 0, // −1 / +1 mientras el dedo está más allá del primer / último puntito
            }
            onIr(g.current.punto) // tocar un puntito va directo a su isla
          }}
          onPointerMove={(e) => {
            const s = g.current
            if (!s || s.id !== e.pointerId) return
            if (!reducir) {
              // Flota: sigue al dedo en vertical (con resistencia) y en horizontal solo fuera de los puntitos.
              flotaY.set(flotar(e.clientY - s.y0))
              const fuera = e.clientX - limitar(e.clientX, s.centros[0], s.centros[s.centros.length - 1])
              flotaX.set(flotar(fuera))
            }
            // Al pasar a otro puntito: su isla se abre (gana siempre una) y la barra da un golpe de matraca.
            const p = masCercano(s.centros, e.clientX)
            if (p !== s.punto) {
              onMatraca(p, s.centros.length)
              s.punto = p
              onIr(p)
            }
            // Contra un extremo (medio puntito más allá del primero o del último): un golpe al chocar.
            const mitad = (s.centros[1] - s.centros[0] || sep) / 2
            const tope = e.clientX < s.centros[0] - mitad ? -1 : e.clientX > s.centros[s.centros.length - 1] + mitad ? 1 : 0
            if (tope && tope !== s.tope) onMatraca(tope < 0 ? 0 : s.centros.length - 1, s.centros.length)
            s.tope = tope
          }}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          {lecciones.map((l, i) => {
            const hecha = estados[i] === 'hecha'
            // Islas aún no desbloqueadas (o sin contenido): puntito gris.
            const cerrada = estados[i] === 'bloqueada' || estados[i] === 'proximamente'
            return (
              <button
                key={l.id}
                type="button"
                data-punto={i}
                onClick={() => onIr(i)}
                aria-label={l.esInsignia ? `Módulo ${l.numero}: ${l.titulo}` : l.esRetos ? 'Retos del módulo' : `Lección ${l.id}: ${l.titulo}${hecha ? ' (completada)' : cerrada ? ' (bloqueada)' : ''}`}
                aria-current={i === abierta ? 'true' : undefined}
                className="grid h-14 place-items-center"
                // 44 px por puntito; si no caben (p. ej. 9 a 375 px), se estrechan para que la barra no se salga.
                style={{ width: `min(${sep}px, calc((100vw - 56px) / ${lecciones.length}))` }}
              >
                <span
                  ref={guardar('punto', i)}
                  className={`block ${l.esRetos || l.esInsignia ? 'rounded-[5px]' : 'rounded-full'}`}
                  style={{
                    width: PUNTO,
                    height: PUNTO,
                    // La insignia (el módulo): cuadradito del color del módulo, siempre opaco.
                    backgroundColor: cerrada ? 'var(--color-zinc-300)' : hecha || l.esInsignia ? oscuro(acento) : acento,
                    opacity: cerrada || hecha || l.esInsignia ? 1 : 0.35,
                    transform: `scale(${i === abierta ? 1 : 0.5})`,
                  }}
                />
              </button>
            )
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/** Grados de la matraca para el puntito `i` de `total`: −max (orilla izquierda, antihorario) … 0 (centro) … +max (orilla derecha, horario). */
export function gradosMatraca(i, total) {
  const centro = (total - 1) / 2
  return centro > 0 ? (MATRACA.max * (i - centro)) / centro : 0
}

/** Desplazamiento de la barra que flota: sigue al dedo cada vez más duro, sin pasar de FLOTA.max. */
function flotar(d) {
  const e = Math.abs(d) * FLOTA.factor
  return Math.sign(d) * (e / (1 + e / FLOTA.max))
}

/** Inversa de flotar(): cuánto dedo hace falta para ese desplazamiento. */
function desflotar(v) {
  const a = Math.min(Math.abs(v), FLOTA.max * 0.99)
  return (Math.sign(v) * (a / (1 - a / FLOTA.max))) / FLOTA.factor
}

/** Índice del valor de `centros` más cercano a x. */
function masCercano(centros, x) {
  let mejor = 0
  centros.forEach((c, i) => {
    if (Math.abs(c - x) < Math.abs(centros[mejor] - x)) mejor = i
  })
  return mejor
}

/** Llama a `fn` cuando la página deja de desplazarse (evento scrollend o, si no existe, sondeo). */
function alTerminarScroll(fn) {
  let ultimo = window.scrollY
  let quietos = 0
  let hecho = false
  const fin = () => {
    if (hecho) return
    hecho = true
    clearInterval(id)
    clearTimeout(tope)
    window.removeEventListener('scrollend', fin)
    fn()
  }
  const id = setInterval(() => {
    quietos = window.scrollY === ultimo ? quietos + 1 : 0
    ultimo = window.scrollY
    if (quietos >= 3) fin()
  }, 40)
  const tope = setTimeout(fin, 900)
  window.addEventListener('scrollend', fin)
}

/** Curva del camino entre dos puntos (vertical: en S de arriba abajo; horizontal: de lado). */
function curva(a, b, vertical) {
  return vertical ? `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}` : `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`
}

/** Posiciones de la insignia (nodo 0) y de cada isla, con o sin una isla abierta. */
function calcular({ ancho, vertical, n, abierta, grande, alto: altoAbierta = ALTO_ESTIMADO }) {
  // Nodos: 0 = insignia, m = isla m − 1 (de 0 a n). `abierta` = nodo abierto (o null).
  const nodos = []
  if (!ancho) return { nodos: Array.from({ length: n + 1 }, () => ({ x: 0, y: 0, escala: 1 })), alto: 0 }
  const onda = (m) => ((m - 1) % 2 ? ONDA : -ONDA) // ondulación de la isla del nodo m (m ≥ 1)

  if (vertical) {
    const amplitud = Math.max(0, Math.min(72, ancho / 2 - ETIQUETA / 2 - 4))
    const y0 = INSIGNIA + 8 + 56 + ISLA / 2
    const yBase = (m) => (m === 0 ? INSIGNIA / 2 + 8 : y0 + (m - 1) * FILA)
    const xBase = (m) => (m === 0 ? ancho / 2 : ancho / 2 + amplitud * Math.round(Math.sin((m * Math.PI) / 2)))
    if (abierta === null) {
      for (let m = 0; m <= n; m++) nodos.push({ x: xBase(m), y: yBase(m), escala: 1, ...(m > 0 ? { etiqueta: 'abajo', anchoEtiqueta: ETIQUETA } : {}) })
      return { nodos, alto: nodos[n].y + ISLA / 2 + 80 }
    }
    // Centro de la bola abierta y cuánto bajan los nodos siguientes para dejar sitio al globo.
    // Con la insignia abierta, todo baja lo justo para que su bola quepa arriba.
    const yAbierta = abierta === 0 ? BOLA / 2 + 8 : yBase(abierta) + 10
    const baja = abierta === 0 ? yAbierta - yBase(0) : 0
    const finAbierta = yAbierta - BOLA / 2 + altoAbierta
    const extra = abierta === n ? 0 : Math.max(0, finAbierta + 36 - (yBase(abierta + 1) + baja - ISLA / 2))
    for (let m = 0; m <= n; m++) {
      if (m === abierta) nodos.push({ x: ancho / 2, y: yAbierta, escala: 1 })
      else nodos.push({ x: xBase(m), y: yBase(m) + (m > abierta ? baja + extra : 0), escala: 1, ...(m > 0 ? { etiqueta: 'abajo', anchoEtiqueta: ETIQUETA } : {}) })
    }
    const alto = abierta === n ? finAbierta + 24 : nodos[n].y + ISLA / 2 + 80
    return { nodos, alto }
  }

  // Horizontal
  const base = 52 + 16 + ISLA / 2 + ONDA
  if (abierta === null) {
    const col = ancho / (n + 1)
    nodos.push({ x: col / 2, y: base, escala: 1 })
    for (let m = 1; m <= n; m++) {
      nodos.push({ x: col * (m + 0.5), y: base + onda(m), escala: 1, etiqueta: 'arriba', anchoEtiqueta: Math.min(ETIQUETA, col - 8) })
    }
    return { nodos, alto: base + ONDA + ISLA / 2 + 24 }
  }

  const cy = Y_ANCHO // la bola abierta y los nodos de los lados, a la misma altura
  const alto = Math.max(base + ONDA + ISLA / 2 + 24, cy - BOLA / 2 + altoAbierta + 28)
  const hueco = 20
  const izq = abierta // nodos antes del abierto
  const der = n - abierta // nodos después
  const finIzq = ancho / 2 - grande / 2 - hueco
  const iniDer = ancho / 2 + grande / 2 + hueco
  const lado = (j, cuenta, desde, hasta) => {
    const s = (hasta - desde) / cuenta
    return { x: desde + s * (j + 0.5), s }
  }
  // Escala de los nodos laterales según el espacio que les queda.
  const escalaDe = (s) => Math.max(0.55, Math.min(1, s / 110))
  for (let m = 0; m <= n; m++) {
    if (m === abierta) {
      nodos.push({ x: ancho / 2, y: cy, escala: 1 })
      continue
    }
    const { x, s } = m < abierta ? lado(m, izq, 0, finIzq) : lado(m - abierta - 1, der, iniDer, ancho)
    const e = escalaDe(s)
    if (m === 0) nodos.push({ x, y: cy, escala: e })
    else nodos.push({ x, y: cy + onda(m) * e, escala: e, etiqueta: s >= 120 ? 'arriba' : null, anchoEtiqueta: Math.min(ETIQUETA, s - 8) })
  }
  return { nodos, alto }
}

export function textoEstado(estado, p, contenido) {
  if (estado === 'hecha') return 'Completada'
  if (estado === 'empezada') return `Paso ${p.paso + 1} de ${contenido.pasos.length}`
  if (estado === 'nueva') return 'Empezar'
  if (estado === 'bloqueada') return 'Bloqueada'
  return 'Próximamente'
}

// Isla bloqueada: gris del tema (claro u oscuro) y su labio, un poco más oscuro.
const GRIS = 'var(--color-zinc-200)'
const LABIO_GRIS = 'color-mix(in oklab, var(--color-zinc-200) 82%, black)'

/** Una isla pequeña: círculo con «labio» inferior que se hunde al tocarla. */
function Isla({ leccion, estado, esActual, avance, acento, descripcion, onClick }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const fondo = lleno ? oscuro(acento) : estado === 'bloqueada' ? GRIS : 'var(--color-white)'
  const sombra = lleno ? labio(acento) : estado === 'bloqueada' ? LABIO_GRIS : 'transparent'
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      {esActual && <Anillo tam={ISLA + 24} acento={acento} avance={avance} />}
      <Pulsable
        onClick={onClick}
        aria-expanded={false}
        aria-label={`Lección ${leccion.id}: ${leccion.titulo}. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full font-titulo text-2xl font-bold ${lleno ? 'text-blanco' : estado === 'bloqueada' ? 'text-zinc-500' : 'border-2 border-dashed border-zinc-300 text-zinc-500'}`}
        style={{ backgroundColor: fondo, boxShadow: `0 6px 0 ${sombra}` }}
      >
        {estado === 'bloqueada' ? <Candado className="size-8" grosor={2.2} /> : estado === 'proximamente' ? <span className="text-xl">…</span> : leccion.id}
      </Pulsable>
      {/* Hecha: el número sigue a la vista y el ✓ verde va en la esquina (verde = hecho en toda la app). */}
      {estado === 'hecha' && <MarcaBien className="pointer-events-none absolute -right-1 -top-1 size-7" aro="var(--color-fondo)" />}
    </div>
  )
}

/** Anillo claro alrededor de una isla, con el arco de avance si está a medias. */
function Anillo({ tam, acento, avance = 0, grosor = 6 }) {
  const r = 50 - grosor / 2
  return (
    <svg className="pointer-events-none absolute" style={{ width: tam, height: tam }} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" style={{ stroke: claro(acento) }} strokeWidth={grosor} />
      {avance > 0 && (
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          style={{ stroke: acento }}
          strokeWidth={grosor}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: avance }}
          transition={{ ...RESORTE.suave, delay: 0.2 }}
        />
      )}
    </svg>
  )
}

/**
 * Isla abierta = «isla + bocadillo»: la isla crece hasta BOLA (con su aro de avance) y debajo
 * aparece un globo que apunta a ella con el título, el estado y los botones a lo ancho.
 * El globo sale de la isla con `--contenido` (lo escribe el carrusel en cada fotograma).
 */
function IslaAbierta({ meta, modulo, progreso, indice, total, onCerrar, onIr }) {
  const estado = estadoLeccion(meta.id, progreso)
  const leccion = getLeccion(meta.id)
  const p = progreso.lecciones[meta.id]
  const pasos = leccion?.pasos.length ?? 0
  const anterior = leccionAnterior(meta.id)
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const porcentaje = estado === 'hecha' ? 100 : estado === 'empezada' ? Math.round((p.paso / pasos) * 100) : 0
  const acento = modulo.acento
  const ir = (reiniciar = false) => {
    if (reiniciar) reiniciarLeccion(meta.id)
    navegar(rutas.leccion(meta.id))
  }
  const tema = lleno ? 'color' : estado === 'bloqueada' ? 'gris' : 'blanco'

  let detalle
  if (estado === 'nueva')
    detalle = (
      <>
        ~{leccion.minutos} min · {pasos} pasos
      </>
    )
  else if (estado === 'empezada')
    detalle = (
      <>
        Paso {p.paso + 1} de {pasos} · {porcentaje} % · ~{leccion.minutos} min
      </>
    )
  else if (estado === 'hecha')
    detalle = (
      <>
        <MarcaBien className="size-5" /> Completada{p?.total ? ` · ${p.aciertos}/${p.total} a la primera` : ''}
      </>
    )
  else if (estado === 'bloqueada')
    detalle = (
      <>
        <Candado className="size-5" /> Termina la {anterior?.id} antes
      </>
    )
  else detalle = <>Llega pronto</>

  return (
    <div className="flex flex-col items-center" role="group" aria-label={`Lección ${meta.id}: ${meta.titulo}`}>
      <Bola acento={acento} estado={estado} avance={lleno ? porcentaje / 100 : null} onClick={onCerrar}>
        {estado === 'bloqueada' ? <Candado className="size-10" /> : estado === 'proximamente' ? '…' : meta.id}
        {estado === 'hecha' && <MarcaBien className="absolute right-0 top-0 size-9" aro="var(--color-fondo)" />}
      </Bola>
      <Globo tema={tema} acento={acento} onCerrar={onCerrar}>
        <h3 className="pr-10 font-titulo text-xl font-bold leading-tight tracking-tight [text-wrap:balance]">{meta.titulo}</h3>
        <p className={`flex flex-wrap items-center gap-1.5 text-base font-medium ${tema === 'color' ? 'text-blanco/90' : 'text-zinc-600'}`}>{detalle}</p>
        {lleno && (
          <BotonGlobo tema={tema} acento={acento} principal data-foco onClick={() => ir(estado === 'hecha')}>
            {estado !== 'hecha' && <Reproducir className="size-5" />}
            {estado === 'nueva' ? 'Empezar' : estado === 'empezada' ? 'Continuar' : 'Repetir'}
          </BotonGlobo>
        )}
        {estado === 'empezada' && (
          <BotonGlobo tema={tema} acento={acento} onClick={() => ir(true)}>
            Empezar de cero
          </BotonGlobo>
        )}
        {estado === 'bloqueada' && anterior && (
          <BotonGlobo tema={tema} acento={acento} principal data-foco onClick={() => onIr(indice - 1)}>
            Ir a la {anterior.id}
          </BotonGlobo>
        )}
      </Globo>
      <span className="sr-only">
        Lección {indice + 1} de {total}. Desliza a los lados para ver las demás.
      </span>
    </div>
  )
}

/**
 * La insignia abierta: el cuadrito del módulo en grande y, debajo, su tarjetita (como las islas) con el
 * título, la descripción y cuántas lecciones van; ir a la lección que toca y ver todos los módulos.
 */
function InsigniaAbierta({ modulo, progreso, actual, retosHechos, totalRetos, onCerrar, onIr, onVerModulos, total }) {
  const hechas = modulo.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const siguiente = actual >= 0 ? modulo.lecciones[actual] : null
  return (
    <div className="flex flex-col items-center" role="group" aria-label={`Módulo ${modulo.numero}: ${modulo.titulo}`}>
      <Bola acento={modulo.acento} estado="nueva" cuadrada onClick={onCerrar}>
        {modulo.numero}
      </Bola>
      <Globo tema="color" acento={modulo.acento} onCerrar={onCerrar}>
        <h3 className="pr-10 font-titulo text-xl font-bold leading-tight tracking-tight [text-wrap:balance]">{modulo.titulo}</h3>
        <p className="text-base font-medium text-blanco/90">
          Módulo {modulo.numero} · <span className="font-dato tabular-nums">{hechas}/{modulo.lecciones.length}</span> lecciones
        </p>
        {modulo.descripcion && <p className="line-clamp-3 text-base text-blanco/90">{modulo.descripcion}</p>}
        {siguiente ? (
          <BotonGlobo tema="color" acento={modulo.acento} principal data-foco onClick={() => onIr(actual + 1)}>
            Ir a la {siguiente.id}
          </BotonGlobo>
        ) : (
          <BotonGlobo tema="color" acento={modulo.acento} principal data-foco onClick={() => onIr(total - 1)}>
            Ver retos · <span className="font-dato tabular-nums">{retosHechos}/{totalRetos}</span>
          </BotonGlobo>
        )}
        <BotonGlobo tema="color" acento={modulo.acento} onClick={onVerModulos}>
          Ver todos los módulos
        </BotonGlobo>
      </Globo>
      <span className="sr-only">Desliza a los lados para ver las lecciones; desde aquí, hacia atrás, pasas al módulo anterior.</span>
    </div>
  )
}

/**
 * La isla en grande (BOLA px) con su labio y, si se da `avance` (0–1), el aro de avance alrededor. `cuadrada` = la insignia.
 * Con `onClick`, se puede tocar (se hunde): tocar la isla abierta la cierra (vuelve la vista completa).
 */
function Bola({ acento, estado, avance = null, children, retos = false, cuadrada = false, onClick }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  let estilo
  if (retos) {
    estilo = lleno
      ? { backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }
      : { backgroundColor: 'var(--color-white)', border: `3px solid ${acento}`, color: tinta(acento), boxShadow: `0 7px 0 ${claro(acento)}` }
  } else if (lleno) estilo = { backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }
  else if (estado === 'bloqueada') estilo = { backgroundColor: GRIS, boxShadow: `0 7px 0 ${LABIO_GRIS}` }
  else estilo = { backgroundColor: 'var(--color-white)' }
  return (
    <Pulsable
      onClick={onClick}
      aria-label="Cerrar"
      className={`relative grid shrink-0 place-items-center ${cuadrada ? 'rounded-[2.25rem]' : 'rounded-full'}`}
      style={{ width: BOLA, height: BOLA }}
    >
      {avance !== null && <Anillo tam={BOLA + ARO * 2} acento={acento} avance={avance} grosor={7} />}
      <div
        className={`grid size-full place-items-center ${cuadrada ? 'rounded-[2.25rem] text-5xl' : 'rounded-full text-3xl'} font-titulo font-bold tabular-nums ${
          lleno ? 'text-blanco' : estado === 'bloqueada' ? 'text-zinc-500' : retos ? '' : 'border-2 border-dashed border-zinc-300 text-zinc-500'
        }`}
        style={estilo}
      >
        {children}
      </div>
    </Pulsable>
  )
}

/**
 * Globo bajo la isla abierta, con un piquito que apunta a ella y la ✕ arriba a la derecha.
 * tema: 'color' (acento oscurecido, texto blanco) · 'gris' (bloqueada) · 'blanco' (próximamente) · 'borde' (retos a medias).
 */
function Globo({ tema, acento, onCerrar, children }) {
  const fondo = { color: oscuro(acento), gris: GRIS, blanco: 'var(--color-white)', borde: 'var(--color-white)' }[tema]
  const borde = tema === 'blanco' ? '2px dashed var(--color-zinc-300)' : tema === 'borde' ? `2px solid ${acento}` : undefined
  return (
    <div
      className="w-full"
      style={{
        marginTop: SEPARA,
        opacity: 'var(--contenido, 1)',
        transform: 'translateY(calc((1 - var(--contenido, 1)) * -14px)) scale(calc(0.94 + 0.06 * var(--contenido, 1)))',
        transformOrigin: '50% 0',
      }}
    >
      <div className={`relative flex flex-col gap-3 rounded-3xl p-5 ${tema === 'color' ? 'text-blanco' : 'text-zinc-900'}`} style={{ backgroundColor: fondo, border: borde }}>
        {/* Piquito que apunta a la isla */}
        <span
          aria-hidden
          className="absolute left-1/2 top-0 size-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[4px]"
          style={{ backgroundColor: fondo, borderLeft: borde, borderTop: borde, marginTop: borde ? -1 : 0 }}
        />
        <Pulsable
          onClick={onCerrar}
          aria-label="Cerrar"
          className={`absolute right-2 top-2 grid size-11 place-items-center rounded-full ${VIDRIO} ${tema === 'color' ? 'vidrio-color text-blanco' : 'text-zinc-700'}`}
        >
          <Cerrar className="size-5" />
        </Pulsable>
        {children}
      </div>
    </div>
  )
}

/** Botón a lo ancho dentro del globo: principal (relleno) o secundario (con borde). */
function BotonGlobo({ tema, acento, principal = false, className = '', ...props }) {
  const enColor = tema === 'color'
  const clase = principal ? (enColor ? 'bg-blanco' : 'bg-zinc-900 text-white') : enColor ? 'border-2 border-blanco/35 text-blanco active:bg-blanco/10' : 'border-2 border-zinc-300 text-zinc-800'
  return (
    <Pulsable
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 font-bold ${principal ? 'min-h-13 text-lg' : 'min-h-12 text-base'} ${clase} ${className}`}
      style={principal && enColor ? { color: oscuro(acento) } : undefined}
    />
  )
}

/** Isla pequeña de Retos (al final del camino): trofeo; se rellena cuando todos los retos están hechos. */
function IslaRetos({ acento, completo, descripcion, onClick }) {
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      <Pulsable
        onClick={onClick}
        aria-label={`Retos del módulo. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full ${completo ? 'text-blanco' : 'border-[3px]'}`}
        style={
          completo
            ? { backgroundColor: oscuro(acento), boxShadow: `0 6px 0 ${labio(acento)}` }
            : { backgroundColor: 'var(--color-white)', borderColor: acento, color: tinta(acento), boxShadow: `0 6px 0 ${claro(acento)}` }
        }
      >
        <Trofeo className="size-8" />
      </Pulsable>
    </div>
  )
}

/** Isla de Retos abierta: trofeo en grande y globo con el reto del módulo, cuántos van y «Ver retos». */
function RetosAbierta({ modulo, retos, hechos, onCerrar, onVer }) {
  const completo = hechos === retos.length
  const tema = completo ? 'color' : 'borde'
  return (
    <div className="flex flex-col items-center" role="group" aria-label="Retos del módulo">
      <Bola acento={modulo.acento} estado={completo ? 'hecha' : 'retos'} avance={hechos / retos.length} retos onClick={onCerrar}>
        <Trofeo className="size-11" />
      </Bola>
      <Globo tema={tema} acento={modulo.acento} onCerrar={onCerrar}>
        <h3 className="pr-10 font-titulo text-xl font-bold leading-tight tracking-tight">Retos en FL Studio</h3>
        <p className={`line-clamp-3 text-base leading-snug ${completo ? 'text-blanco/90' : 'text-zinc-600'}`}>{modulo.reto}</p>
        <p className="font-dato text-base font-medium tabular-nums" style={completo ? undefined : { color: tinta(modulo.acento) }}>
          {hechos}/{retos.length} hechos
        </p>
        <BotonGlobo tema={tema} acento={modulo.acento} principal data-foco onClick={onVer}>
          Ver retos
        </BotonGlobo>
      </Globo>
    </div>
  )
}

/** Hoja con todos los retos del módulo: el del módulo (se marca aquí) y el de cada lección. */
function HojaRetos({ abierta, onCerrar, modulo, retos, progreso }) {
  const [delModulo, ...deLecciones] = retos
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta={`Retos del módulo ${modulo.numero}`}>
      <div className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto">
        <h2 className="flex items-center gap-2 font-titulo text-2xl font-bold tracking-tight">
          <Trofeo className="size-7" /> Retos · Módulo {modulo.numero}
        </h2>
        <section className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(modulo.acento) }}>
            Reto del módulo
          </span>
          <p className="text-lg leading-snug text-zinc-800">{delModulo.texto}</p>
          <Pulsable
            data-foco
            onClick={() => guardarReto(delModulo.clave, { hecho: !delModulo.hecho })}
            aria-pressed={delModulo.hecho}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl text-lg font-semibold ${delModulo.hecho ? 'bg-bien-relleno text-blanco' : 'border-2 border-zinc-900 text-zinc-900'}`}
          >
            {delModulo.hecho && <Check className="size-5" />}
            {delModulo.hecho ? '¡Hecho!' : 'Lo hice'}
          </Pulsable>
        </section>
        {deLecciones.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Retos de las lecciones</h3>
            {deLecciones.map((r) => {
              const hecha = progreso.lecciones[r.clave]?.completada
              const contenido = (
                <>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-base font-bold ${r.hecho ? 'bg-bien-relleno text-blanco' : 'bg-zinc-100 font-dato text-zinc-600'}`}>
                    {r.hecho ? <Check className="size-5" /> : r.clave}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-base font-semibold leading-snug text-zinc-900">{r.titulo}</span>
                    <span className="text-sm text-zinc-500">{r.hecho ? 'Hecho' : hecha ? 'Pendiente' : `Termina la lección ${r.clave} para llegar`}</span>
                  </span>
                  {hecha && (
                    <span aria-hidden className="text-2xl text-zinc-400">
                      ›
                    </span>
                  )}
                </>
              )
              const clase = 'flex min-h-16 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left'
              return hecha ? (
                <Pulsable key={r.clave} tipo="tarjeta" href={rutas.reto(r.clave)} className={clase}>
                  {contenido}
                </Pulsable>
              ) : (
                <div key={r.clave} className={clase}>
                  {contenido}
                </div>
              )
            })}
          </section>
        )}
      </div>
    </Hoja>
  )
}

/** Alto de la ventana (para saber cuánto se puede ampliar el camino en pantallas anchas). */
function useAltoVentana() {
  const [alto, setAlto] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  useEffect(() => {
    const medir = () => setAlto(window.innerHeight)
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])
  return alto
}

/** Ancho del contenedor (se actualiza al girar el teléfono o cambiar la ventana). */
function useAncho(ref) {
  const [ancho, setAncho] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setAncho(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return ancho
}
