import { AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion } from 'motion/react'
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { estadoLeccion, getLeccion, getModulo, leccionAnterior, moduloDisponible } from '../content/index.js'
import { HERRAMIENTAS } from '../content/rutas.js'
import { useOpciones } from '../progress/opciones.js'
import { guardarReto, reiniciarLeccion } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Cerrar, Check, Cuadritos, MarcaBien, Reproducir, Saltar, Trofeo } from '../ui/Iconos.jsx'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import useDeslizar from '../ui/useDeslizar.js'
import useRuedaMouse from '../ui/useRuedaMouse.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import Hoja from '../ui/Hoja.jsx'
import NavegadorModulos from './NavegadorModulos.jsx'
import { pruebaDeModulo, pruebaDeRuta } from './yaLoSabes.js'

const ISLA = 80 // diámetro de cada isla (px)
const INSIGNIA = 72 // cuadrado con el número del módulo, al inicio del camino
const FILA = 196 // separación vertical entre islas en el celular
const ETIQUETA = 168 // ancho máximo del título de cada isla
const ONDA = 26 // ondulación del camino horizontal
const PUNTO = 16 // diámetro del puntito de la isla actual (los demás, la mitad)
// Con el camino cerrado, los puntitos de las islas que se ven en pantalla se inflan un poco (pedido del usuario: que
// la barra diga qué parte del módulo estás viendo al explorar): de 0,5 a 0,5 + VISTO_INFLA (abierta = 1).
const VISTO_INFLA = 0.2
const ALTO_CABECERA_CAMINO = 80 // la cabecera fija de arriba (CabeceraModulo: ALTO_CABECERA)
// TRAMOS de una ruta (content/rutas.js): un letrero al empezar cada uno. En el celular, el camino deja LETRERO px
// más antes de la primera isla del tramo; en pantallas anchas, una franja de LETRERO_ARRIBA px encima de los títulos.
const LETRERO = 72
const LETRERO_ARRIBA = 86
const HUECO_TRAMO = 8 // px entre los grupos de puntitos de cada tramo
const HUECO_REGLA = 20 // en la regla (barra que se desliza), el hueco entre tramos lleva su número
const BORDE_REGLA = 36 // px del desvanecido de las orillas de la regla
/**
 * Arrastre de la regla (pedido del usuario, en lugar del joystick): la tira de puntitos sigue al dedo 1:1, en el
 * sentido del arrastre. Al soltar se asienta con un puntito en el centro: el más cercano a donde la llevaría la
 * inercia (velocidad del dedo × `inercia` ms, medida en los últimos `muestra` ms). Pasado el primero o el último,
 * goma (`goma` = fracción de lo que se jala de más que se mueve).
 */
const REGLA = { inercia: 160, muestra: 90, goma: 0.3 }
// Isla abierta = «isla + bocadillo»: la isla crece hasta BOLA (con su aro de avance) y debajo
// cuelga un globo con la información. El centro de la bola queda en el punto del camino.
const BOLA = 112 // diámetro de la isla abierta
// «Tilt» de la isla abierta al chocar con un extremo del camino (px, grados, ms).
const TILT = { x: 12, grados: 3, vuelve: 250 }
// Con una isla abierta, desplazar la página (dedo o rueda) la cierra cuando la isla y su tarjetita quedan
// enteras por ENCIMA o por DEBAJO de la mitad de la pantalla (pedido del usuario). Si al abrirla ya no tapaban
// la mitad, la línea se mete `margen` px dentro de ellas. Con el dedo aún apoyado, volver a traerlas a la línea
// la abre otra vez; al soltar ya no. `dedo`: px antes de decidir si el gesto es vertical (página) o de lado
// (cambiar de isla, no cuenta). `quieto`: ms sin desplazarse para dar por terminado el gesto (inercia, rueda).
const MITAD_CIERRA = { margen: 8, dedo: 10, quieto: 150 }
// Barra de puntitos (dos animaciones):
//  - FLOTA: mientras el dedo está apoyado, la barra lo sigue con resistencia (como si flotara): en
//    vertical siempre; en horizontal solo si el dedo sale más allá del primer o del último puntito.
//    Se acerca a `max` px sin llegar nunca; al soltar vuelve a su sitio con RESORTE.suave.
//  - MATRACA: cada vez que el dedo (o el ratón) llega a otro puntito, la barra da un golpe, COMO SI EL DEDO LA
//    JALARA (pedido del usuario): la inclinación depende de la posición del puntito en la barra (0° en el
//    central, `max` en las orillas: con 7, 3 · 2 · 1 · 0 · 1 · 2 · 3) y de dónde está el dedo respecto al EJE
//    de la barra (su línea horizontal del medio): por ENCIMA, a la derecha gira en sentido antihorario y a la
//    izquierda en horario; por DEBAJO, al revés; SOBRE el eje (± `eje` px) no se inclina, y crece hasta el
//    máximo a `eje + rango` px. Lo que no se va en inclinación se va en un golpe LATERAL (`lateral` px hacia
//    donde va el dedo): sobre el eje o en el puntito central, solo golpe lateral. Sin dedo que jale (flechas
//    del teclado, deslizar las islas, tocar otra isla), solo el golpe lateral. Todo vuelve a 0 a los `vuelve` ms.
//    Contra un extremo, golpe del puntito de la orilla.
const FLOTA = { factor: 0.5, max: 14 }
// (Pedido del usuario: el doble de inclinación y la mitad de tiempo.) Los resortes son los de siempre
// (RESORTE.pulsar para el golpe y RESORTE.suave para volver) con rigidez ×4 y amortiguación ×2: igual de
// «secos», pero duran la mitad.
const MATRACA = {
  max: 3,
  eje: 4,
  rango: 22,
  lateral: 4,
  vuelve: 50,
  golpe: { ...RESORTE.pulsar, stiffness: RESORTE.pulsar.stiffness * 4, damping: RESORTE.pulsar.damping * 2 },
  vuelta: { ...RESORTE.suave, stiffness: RESORTE.suave.stiffness * 4, damping: RESORTE.suave.damping * 2 },
}
const BARRA_ALTO = 112 // alto de la zona de la barra de puntitos (con su margen): la isla abierta queda por encima
// En una ruta, sobre la barra va el botón «Módulos y prácticas» (44 px + 8 de separación).
const BOTON_RUTA = 52
const ARO = 16 // el aro de avance sobresale de la bola
const SEPARA = 30 // de la bola al globo (deja sitio al labio y al piquito)
const ALTO_ESTIMADO = BOLA + SEPARA + 210 // alto de bola + globo hasta medirlo
const Y_ANCHO = 124 // altura del centro de la isla abierta en pantallas anchas
// Pantallas anchas: todo el camino se AMPLÍA (islas, bola, globo y camino a la vez) para llenar el
// espacio. Con el camino cerrado, según el ancho (columna por isla) hasta `maxCerrado`; con una isla
// abierta, además, que quepan el globo y sus vecinas (`anchoAbierta`) y que la bola y el globo quepan
// sobre la barra de puntitos, hasta `maxAbierta` (así el globo no queda gigante). Al abrir o cerrar,
// el zoom pasa de uno a otro con el mismo resorte.
const ZOOM = { maxCerrado: 2, maxAbierta: 1.5, anchoAbierta: 760, columna: 120, margenAlto: 96 }
// Pantallas anchas: como mucho VISIBLES nodos a la vez (pedido del usuario: «que las islas sean más grandes y se
// muestren solo unas cuantas»); si hay más, el camino cerrado es una TIRA que se arrastra de lado (o con la rueda o
// la barra de puntitos) columna por columna, con las reglas de los carruseles, y se desvanece en los bordes.
// Con una isla abierta, las vecinas guardan al menos `SEPARA_MIN` px entre sí (las lejanas quedan fuera, a los lados).
const VISIBLES = 6
const SEPARA_MIN = 120
// Desvanecido de los lados de la tira (pedidos del usuario: «más difuso» y luego «mucho más leve, que se sienta
// amplia»): el 8 % del ancho a cada lado (56–110 px), que casi no apaga hasta la orilla misma. Y la tira deja ese
// mismo MARGEN a cada lado: en los extremos, la primera y la última isla quedan enteras ANTES del desvanecido; solo
// lo que está a medio camino (hay más) asoma por él.
const bordeTira = (anchoReal) => limitar(anchoReal * 0.08, 56, 110)
const CURVA_TIRA = [[0, 0], [0.25, 0.35], [0.5, 0.7], [0.75, 0.92], [1, 1]]
const mascaraTira = (b) => {
  const izq = CURVA_TIRA.map(([f, a]) => `rgb(0 0 0 / ${a}) ${b * f}px`)
  const der = [...CURVA_TIRA].reverse().map(([f, a]) => `rgb(0 0 0 / ${a}) calc(100% - ${b * f}px)`)
  return `linear-gradient(to right, ${izq.join(', ')}, ${der.join(', ')})`
}
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
export default function CaminoLecciones({ modulo, progreso, onAbierta, onTira, ruta = null }) {
  const ref = useRef(null)
  const lienzo = useRef(null) // capa ampliada (zoom) dentro del contenedor
  const anchoReal = useAncho(ref)
  const altoVentana = useAltoVentana()
  // En una RUTA (`ruta` = { estado, nivelMax, enlaceMeta, iconosAbre, onVerModulos }; `modulo` = moduloDeRuta) las
  // islas son sus paradas (lección, práctica, se abre, reto) y no hay isla de Retos: el reto es una parada más.
  const lecciones = ruta ? ruta.estado.paradas.map((p) => ({ id: `p${p.i}`, titulo: p.titulo, parada: p })) : modulo.lecciones
  useOpciones() // el modo administrador (Opciones) abre las islas bloqueadas: volver a pintar al cambiarlo
  // Islas del camino: las lecciones y, al final (lado opuesto a la insignia), la isla de Retos.
  // El carrusel va por NODOS: el 0 es la insignia del módulo (también se abre con su tarjetita) y la
  // isla `i` es el nodo i + 1. Así la insignia tiene su puntito y desde ella se pasa al módulo anterior.
  const islasMeta = ruta ? lecciones : [...lecciones, { id: 'retos', titulo: 'Retos', esRetos: true }]
  const n = islasMeta.length // islas sin la insignia; los nodos van de 0 a n
  // Tramos de la ruta (con 2 o más): letrero al empezar cada uno y puntitos agrupados.
  const tramos = ruta && ruta.estado.tramos?.length > 1 ? ruta.estado.tramos : []
  const cortes = useMemo(() => tramos.map((t) => t.desde + 1), [tramos.map((t) => t.desde).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const retos = ruta ? [] : retosDelModulo(modulo, progreso)
  const retosHechos = retos.filter((r) => r.hecho).length
  const moduloCompleto = !ruta && lecciones.every((l) => progreso.lecciones[l.id]?.completada)
  const estados = ruta
    ? lecciones.map((l) => estadoParada(l.parada, progreso))
    : [...lecciones.map((l) => estadoLeccion(l.id, progreso)), retosHechos === retos.length ? 'hecha' : 'retos']
  const actual = estados.findIndex((e) => e === 'nueva' || e === 'empezada')
  const vecinoListo = (dir) => {
    const m = modulo.vecino ? modulo.vecino(dir) : getModulo(modulo.numero + dir)
    return Boolean(m && (m.esRuta ? m.disponible : moduloDisponible(m)))
  }
  const nombreModulo = modulo.nombre ?? `Módulo ${modulo.numero}`
  // Color de cada isla: en el Curso completo, el de SU área (cada parada trae su `acento`); si no, el del módulo.
  const acentoIsla = (i) => islasMeta[i]?.parada?.acento ?? modulo.acento
  const [verModulos, setVerModulos] = useState(false)
  const [verRetos, setVerRetos] = useState(false)
  const vertical = anchoReal < 560
  const [altos, setAltos] = useState({}) // alto real (bola + globo) de cada isla abierta, medido
  // Columnas a la vista en pantallas anchas (ver VISIBLES); si hay más nodos, el camino cerrado se arrastra de lado.
  const vis = vertical || !anchoReal ? n + 1 : Math.min(n + 1, VISIBLES, Math.max(3, Math.floor(anchoReal / ZOOM.columna)))
  const maxCorre = n + 1 - vis // columnas que se puede correr la tira
  const desborda = maxCorre > 0
  const barraAlto = BARRA_ALTO + (ruta ? BOTON_RUTA : 0)
  // Zoom en pantallas anchas (ver ZOOM). Cada disposición se calcula en su ancho «sin ampliar» y la capa
  // `lienzo` se escala; en el celular, zoom = 1.
  const zoomCerrado = vertical || !anchoReal ? 1 : limitar(anchoReal / (ZOOM.columna * vis), 1, ZOOM.maxCerrado)
  const zoom = vertical || !anchoReal
    ? 1
    : limitar(
        Math.min(
          anchoReal / ZOOM.anchoAbierta,
          anchoReal / (ZOOM.columna * vis),
          (altoVentana - barraAlto - ZOOM.margenAlto) / (Math.max(ALTO_ESTIMADO, ...Object.values(altos)) + ARO * 2),
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
  // Con el camino cerrado: la isla del centro de lo que se ve en pantalla (la regla de puntitos la centra).
  const [vista, setVista] = useState(null)
  const vistaRef = useRef(null)
  const abiertaRef = useRef(null) // isla abierta (destino) o null
  const base = useMotionValue(0) // índice continuo de la isla abierta, sin contar el arrastre
  const apertura = useMotionValue(0) // 0 = camino cerrado, 1 = una isla abierta
  const despliegue = useMotionValue(0) // segundos desde que empezó el despliegue inicial

  // Disposición del camino cerrado y con cada isla abierta.
  const layouts = useMemo(
    () =>
      ancho
        ? {
            cerrado: calcular({ ancho: anchoReal / zoomCerrado, vertical, n, abierta: null, grande, vis, cortes, margen: desborda ? bordeTira(anchoReal) / zoomCerrado : 0 }),
            abiertas: Array.from({ length: n + 1 }, (_, j) => calcular({ ancho, vertical, n, abierta: j, grande, alto: altos[j] ?? ALTO_ESTIMADO, cortes })),
          }
        : null,
    [ancho, anchoReal, zoomCerrado, vertical, n, grande, altos, vis, cortes, desborda],
  )

  // Elementos que se mueven a mano en cada fotograma.
  const els = useRef({ nodo: [], chica: [], difuso: [], grande: [], inclina: [], etiqueta: [], gris: [], color: [], linea: [], filtro: [], punto: [], letrero: [] }).current
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
    // Lo más alto de la barra de abajo: la píldora de puntitos o, en una ruta, el botón que va encima.
    const barra = document.querySelector('[data-puntitos] [data-encima-barra], [data-puntitos] [role=group]')?.getBoundingClientRect().top
    const piso = (barra != null ? barra - (ruta ? 0 : flotaY.get()) : window.innerHeight - barraAlto) - 12
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
  // `relleno: false` (cierre al desplazar con el dedo aún apoyado): se deja el relleno para que la página no
  // salte y la isla pueda volver a abrirse en el mismo sitio; se quita al soltar.
  const cerrar = ({ relleno: quitarRelleno = true } = {}) => {
    esperando.current = null
    if (quitarRelleno && relleno.current) relleno.current.style.height = '0px'
    // En la tira (pantallas anchas), el nodo que se cierra queda a la vista (con una columna de aire si se puede).
    const k = abiertaRef.current
    if (k != null && desborda) {
      const c = corridoRef.current
      const sig = k < c + 1 ? k - 1 : k > c + vis - 2 ? k - vis + 2 : c
      correA(limitar(sig, 0, maxCorre))
    }
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
  const golpe = useMotionValue(0) // golpe lateral de la matraca (px)
  const tiltBarra = useRef(null)
  const ultimaMatraca = useRef(0) // cuándo la movió el dedo por última vez (para no repetir con el cambio de isla)
  /**
   * Golpe de matraca al llegar al puntito `i` de `total` (ver MATRACA). `tiron` (−1 … 1): cuánto jala el dedo y
   * hacia dónde (negativo = por encima del eje, positivo = por debajo, 0 = sobre el eje o sin dedo). `dir`: hacia
   * dónde va (−1 izquierda, +1 derecha), para el golpe lateral.
   */
  const matraca = (i, total, { tiron = 0, dir = 0 } = {}) => {
    ultimaMatraca.current = performance.now()
    if (reducir) return
    clearTimeout(tiltBarra.current)
    const grados = gradosMatraca(i, total) * tiron
    animate(giro, grados, MATRACA.golpe)
    animate(golpe, dir * MATRACA.lateral * (1 - Math.abs(grados) / MATRACA.max), MATRACA.golpe)
    tiltBarra.current = setTimeout(() => {
      animate(giro, 0, MATRACA.vuelta)
      animate(golpe, 0, MATRACA.vuelta)
    }, MATRACA.vuelve)
  }
  // Cambio de isla sin el dedo en la barra (flechas, deslizar las islas, tocar otra): solo el golpe lateral.
  const abiertaAntes = useRef(null)
  useEffect(() => {
    const antes = abiertaAntes.current
    abiertaAntes.current = abierta
    if (antes == null || abierta == null || antes === abierta) return
    if (performance.now() - ultimaMatraca.current < 120) return // ya lo hizo la barra con el dedo
    matraca(abierta, n + 1, { dir: Math.sign(abierta - antes) })
  }, [abierta]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(tiltBarra.current), [])

  const islas = useDeslizar({ activo: abierta !== null, umbral: X, onPaso: paso, puede, acepta, alTope: inclinar })
  // Computadora: el scroll de lado (trackpad o Shift + rueda) pasa de isla; el vertical sigue siendo de la página.
  useRuedaMouse(ref, { activo: abierta !== null, conVertical: false, puede, onPaso: (dir) => irA(abiertaRef.current + dir) })

  // TIRA del camino cerrado en pantallas anchas (ver VISIBLES): `corre` = columnas corridas (continuo).
  // Arrastrar de lado la corre columna por columna con las reglas de los carruseles (useDeslizar); en los extremos
  // el gesto es de la página (cambiar de módulo). La rueda (de lado) también la corre.
  const corridoRef = useRef(0) // destino (entero)
  const correBase = useMotionValue(0)
  const [corrido, setCorrido] = useState(0)
  const puedeTira = (dir) => abiertaRef.current === null && corridoRef.current + dir >= 0 && corridoRef.current + dir <= maxCorre
  const correA = (c) => {
    corridoRef.current = c
    setCorrido(c)
    animate(correBase, c, resorte)
  }
  const pasoTira = (dir) => {
    const sig = corridoRef.current + dir
    const desfase = correBase.get() - corridoRef.current
    corridoRef.current = sig
    setCorrido(sig)
    correBase.jump(sig + desfase)
    if (Math.abs(desfase) > 0.001) animate(correBase, sig, resorte)
  }
  const tira = useDeslizar({ activo: abierta === null && desborda, umbral: anchoReal / vis || 1, onPaso: pasoTira, puede: puedeTira, acepta: puedeTira })
  useRuedaMouse(ref, { activo: abierta === null && desborda, conVertical: false, puede: puedeTira, onPaso: (dir) => correA(corridoRef.current + dir) })
  // Al conocer el ancho (o cambiarlo): dentro de los límites y, la primera vez, con la isla actual a la vista.
  const tiraLista = useRef(false)
  useLayoutEffect(() => {
    if (!anchoReal) return
    const c = tiraLista.current ? corridoRef.current : actual + 1 - (vis - 2)
    tiraLista.current = true
    const sig = limitar(c, 0, Math.max(0, maxCorre))
    corridoRef.current = sig
    setCorrido(sig)
    correBase.jump(sig)
  }, [anchoReal, vis, maxCorre]) // eslint-disable-line react-hooks/exhaustive-deps
  // Para el swipe de página: con la tira corrida, el gesto de lado es de la tira salvo en sus extremos.
  useEffect(
    () => onTira?.(desborda ? { inicio: corrido <= 0, fin: corrido >= maxCorre } : null),
    [desborda, corrido, maxCorre, onTira],
  )


  /** Coloca cada isla, camino, título y puntito según la posición continua. */
  const actualizar = () => {
    const L = layouts
    const cont = ref.current
    if (!L || !cont) return
    const caja = cont.getBoundingClientRect() // antes de escribir estilos (para ver qué islas están en pantalla)
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
    const vistos = [] // de 0 a 1: cuánto se ve cada isla en pantalla
    const td = despliegue.get()
    // Zoom de este fotograma: del cerrado al de isla abierta según la apertura. Las posiciones se
    // mezclan en píxeles reales y se pasan a la capa ampliada (dividiendo por z).
    const z = lerp(zoomCerrado, zoom, a)
    const corre = desborda ? correBase.get() + tira.progreso.get() : 0 // columnas corridas de la tira (cerrado)
    const dxCerrado = corre * (C.col ?? 0)
    if (lienzo.current) {
      lienzo.current.style.width = `${anchoReal / z}px`
      lienzo.current.style.transform = z !== 1 ? `scale(${z})` : ''
    }
    const difuso = [] // px de desenfoque de cada nodo (para las líneas)
    const sales = [] // cuánto ha salido cada nodo en el despliegue inicial (0 a 1)
    for (let m = 0; m <= n; m++) {
      const lo = A.nodos[m]
      const hi = B.nodos[m]
      const c = C.nodos[m]
      const cerca = Math.max(0, 1 - Math.abs(pc - m)) // 1 = es el nodo de p
      const o = a * cerca // cuánto está abierto este nodo
      let ox = lerp(lo.x, hi.x, f) - (fuera * X) / zoom
      // En vertical, la que se va sale un poco hacia el lado del dedo y la que llega entra por el otro.
      if (vertical) ox -= (pc - m) * cerca * ancho * 0.5
      let x = lerp((c.x - dxCerrado) * zoomCerrado, ox * zoom, a) / z
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
      sales.push(sale)
      // ¿Se ve esta isla? Entre la cabecera y la barra de puntitos, y (en la tira) fuera del desvanecido de los lados;
      // con una rampa de media isla para que el puntito se infle poco a poco al entrar.
      const sx = caja.left + x * z
      const sy = caja.top + y * z
      const rampa = (ISLA * z) / 2
      const margenX = desborda ? bordeTira(anchoReal) * 0.5 : 0
      vistos.push(
        limitar((sy - ALTO_CABECERA_CAMINO) / rampa, 0, 1) *
          limitar((window.innerHeight - barraAlto - sy) / rampa, 0, 1) *
          limitar((sx - caja.left - margenX) / rampa, 0, 1) *
          limitar((caja.right - margenX - sx) / rampa, 0, 1) *
          (m === 0 || sale > 0.97 ? 1 : 0), // (el último puede quedar en 0,9999 por redondeo)
      )
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
      if (punto) punto.style.transform = `scale(${0.5 + 0.5 * a * cerca + VISTO_INFLA * (1 - a) * vistos[m]})`
    }
    // Qué parte del camino se ve (solo cerrado): la media de las islas en pantalla, para la regla de puntitos.
    if (a < 0.01) {
      let peso = 0
      let suma = 0
      vistos.forEach((v, m) => {
        peso += v
        suma += v * m
      })
      const centro = peso > 0.5 ? Math.round(suma / peso) : null
      if (centro !== null && centro !== vistaRef.current) {
        vistaRef.current = centro
        setVista(centro)
      }
    }
    // Letreros de los tramos: con el camino cerrado, encima de la primera isla del tramo (celular) o como franja
    // sobre sus columnas (ancho); al abrir una isla se desvanecen, como los títulos.
    tramos.forEach((t, k) => {
      const el = els.letrero[k]
      if (!el) return
      const m = t.desde + 1
      const visible = opacidadTitulo(a) * limitar(sales[m] * 2 - 1, 0, 1)
      el.style.opacity = String(visible)
      el.style.visibility = visible > 0.01 ? 'visible' : 'hidden'
      if (vertical) {
        el.style.transform = `translate3d(${anchoReal / z / 2}px, ${pos[m].y - ISLA / 2 - 16}px, 0) translate(-50%, -100%)`
      } else {
        const col = C.col ?? 0
        el.style.width = `${(t.hasta - t.desde + 1) * col - 12}px`
        el.style.transform = `translate3d(${pos[m].x - col / 2 + 6}px, 6px, 0)`
      }
    })
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
  // Al desplazar la página (o cambiar el tamaño), los puntitos siguen a las islas que se ven.
  useEffect(() => {
    let cuadro = 0
    const pedir = () => {
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => actualizarRef.current())
    }
    window.addEventListener('scroll', pedir, { passive: true })
    window.addEventListener('resize', pedir)
    return () => {
      cancelAnimationFrame(cuadro)
      window.removeEventListener('scroll', pedir)
      window.removeEventListener('resize', pedir)
    }
  }, [])
  useEffect(() => {
    const quitar = [base, apertura, despliegue, islas.progreso, correBase, tira.progreso].map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [base, apertura, despliegue, islas.progreso, correBase, tira.progreso])

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

  // Desplazar la página cierra la isla abierta cuando ella y su tarjetita dejan la mitad de la pantalla (ver
  // MITAD_CIERRA). Se mira el GESTO (dedo, su inercia o la rueda), no cualquier scroll, porque la página también
  // se mueve sola (al abrir una isla o al pasar a otra). La posición sale de la medida al empezar el gesto y de
  // `scrollY` (no de lo que se ve), así «tirar más allá del borde» (que mueve la página con transform para
  // cambiar de módulo) no cuenta. Escucha siempre (también con la isla cerrada por el gesto, para reabrirla).
  const gestoMitad = useRef(null) // gesto en curso (el ajuste final no mueve la página mientras dura)
  const abrirYaRef = useRef(abrirYa)
  abrirYaRef.current = abrirYa
  // Al cerrarse con el dedo apoyado, el camino se acorta (sin el hueco de la tarjetita): el relleno de abajo
  // crece eso mismo, para que la página no se acorte bajo el dedo (cerca del final el navegador movería el
  // scroll solo y la isla se abriría y cerraría sin parar). Al reabrirla se devuelve; al soltar, se quita.
  const diferenciaAlto = (k) => (layouts ? Math.max(0, layouts.abiertas[k].alto * zoom - layouts.cerrado.alto * zoomCerrado) : 0)
  const diferenciaRef = useRef(diferenciaAlto)
  diferenciaRef.current = diferenciaAlto
  const sumarRelleno = (px) => {
    if (relleno.current) relleno.current.style.height = `${Math.max(0, relleno.current.offsetHeight + px)}px`
  }
  useEffect(() => {
    let g = null // { k, top, bottom (en la página), linea (en la pantalla), x0, y0, lado, suelto, cerrada }
    let quieto
    const poner = (v) => {
      g = v
      gestoMitad.current = v
    }
    const ignorar = (e) => e.target.closest?.('[data-puntitos], [role=dialog]')
    /** Medida de la isla abierta (bola + tarjetita) si está quieta en su sitio; si no, null. */
    const medir = (suelto) => {
      const k = abiertaRef.current
      const el = k == null ? null : els.grande[k]
      if (!el || apertura.get() < 0.99 || Math.abs(posicion() - k) > 0.01) return null
      const r = el.getBoundingClientRect()
      const { margen } = MITAD_CIERRA
      const linea = r.height > margen * 2 ? limitar(window.innerHeight / 2, r.top + margen, r.bottom - margen) : (r.top + r.bottom) / 2
      return { k, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, linea, suelto, cerrada: false }
    }
    const terminar = () => {
      clearTimeout(quieto)
      if (g?.cerrada && abiertaRef.current === null && relleno.current) relleno.current.style.height = '0px'
      poner(null)
    }
    const esperarQuieto = () => {
      clearTimeout(quieto)
      quieto = setTimeout(terminar, MITAD_CIERRA.quieto)
    }
    const revisar = () => {
      if (!g || g.lado) return
      const y = window.scrollY
      const dentro = g.top - y <= g.linea && g.bottom - y >= g.linea
      if (!g.cerrada && !dentro && abiertaRef.current === g.k) {
        g.cerrada = true
        g.extra = diferenciaRef.current(g.k)
        cerrarRef.current({ relleno: false })
        sumarRelleno(g.extra)
        if (g.suelto) terminar() // ya sin dedo (inercia o rueda): cerrada para siempre
      } else if (g.cerrada && dentro && !g.suelto && abiertaRef.current === null && esperando.current === null) {
        g.cerrada = false // dedo aún apoyado: vuelve a la mitad → se abre otra vez
        sumarRelleno(-g.extra)
        abrirYaRef.current(g.k)
      }
    }
    const empieza = (e) => {
      if (g?.cerrada) terminar()
      clearTimeout(quieto)
      if (e.touches.length !== 1 || ignorar(e)) return poner(null)
      const m = medir(false)
      if (m) Object.assign(m, { x0: e.touches[0].clientX, y0: e.touches[0].clientY, lado: null })
      poner(m)
    }
    const mueve = (e) => {
      if (!g || g.suelto) return
      if (e.touches.length !== 1) return terminar()
      if (g.lado === null) {
        const dx = Math.abs(e.touches[0].clientX - g.x0)
        const dy = Math.abs(e.touches[0].clientY - g.y0)
        if (Math.max(dx, dy) < MITAD_CIERRA.dedo) return
        g.lado = dx > dy // de lado = cambiar de isla: no es nuestro
        if (g.lado) return terminar()
      }
      revisar()
    }
    // Al soltar: si estaba cerrada, se queda cerrada; si no, la inercia aún puede cerrarla (no reabrirla).
    const suelta = (e) => {
      if (!g || e.touches.length > 0) return
      if (g.cerrada || g.lado === null) return terminar()
      g.suelto = true
      esperarQuieto()
    }
    const desplaza = () => {
      if (!g) return
      revisar()
      if (g?.suelto) esperarQuieto()
    }
    const gira = (e) => {
      if (ignorar(e)) return
      if (!g) poner(medir(true))
      if (g?.suelto) esperarQuieto()
    }
    document.addEventListener('touchstart', empieza, { passive: true })
    document.addEventListener('touchmove', mueve, { passive: true })
    document.addEventListener('touchend', suelta, { passive: true })
    document.addEventListener('touchcancel', suelta, { passive: true })
    window.addEventListener('scroll', desplaza, { passive: true })
    window.addEventListener('wheel', gira, { passive: true })
    return () => {
      document.removeEventListener('touchstart', empieza)
      document.removeEventListener('touchmove', mueve)
      document.removeEventListener('touchend', suelta)
      document.removeEventListener('touchcancel', suelta)
      window.removeEventListener('scroll', desplaza)
      window.removeEventListener('wheel', gira)
      clearTimeout(quieto)
      gestoMitad.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      if (gestoMitad.current) return // la abrió el dedo al volver a la mitad: se queda donde la dejó
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
      <div
        ref={ref}
        className="relative w-full select-none"
        data-tira={desborda ? corrido : undefined}
        style={{
          height: ancho ? undefined : FILA * n,
          touchAction: 'pan-y',
          // Tira (pantallas anchas con más nodos de los que caben): lo que se sale no ensancha la página y los
          // bordes se desvanecen (así se ve que hay más a los lados).
          ...(desborda && {
            overflowX: 'clip',
            maskImage: mascaraTira(bordeTira(anchoReal)),
          }),
        }}
        {...unirHandlers(islas.handlers, tira.handlers)}
      >
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
                  {(l.esRetos ? moduloCompleto : estados[s] !== 'bloqueada' && estados[s] !== 'proximamente' && estados[s] !== 'opcional') && (
                    <motion.path
                      ref={guardar('color', s)}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ ...RESORTE.suave, delay: montado ? 0 : DESPLIEGUE.espera + s * DESPLIEGUE.entre + 0.2 }}
                      fill="none"
                      style={{ stroke: acentoIsla(s) }}
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
                        aria-label={`${nombreModulo}: ${modulo.titulo}`}
                        className="grid place-items-center rounded-3xl font-titulo text-3xl font-bold text-blanco"
                        style={{ width: INSIGNIA, height: INSIGNIA, backgroundColor: oscuro(modulo.acento), boxShadow: `0 6px 0 ${labio(modulo.acento)}` }}
                      >
                        {modulo.Icono ? <modulo.Icono className="size-10" /> : modulo.numero}
                      </Pulsable>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div ref={guardar('grande', 0)} className="absolute left-0 top-0" style={{ visibility: 'hidden', opacity: 0, width: grande, transformOrigin: `50% ${BOLA / 2}px` }}>
                <div ref={guardar('inclina', 0)} style={{ transformOrigin: `50% ${BOLA / 2}px` }}>
                  <InsigniaAbierta
                    ruta={ruta}
                    modulo={modulo}
                    progreso={progreso}
                    actual={actual}
                    retosHechos={retosHechos}
                    totalRetos={retos.length}
                    onCerrar={cerrar}
                    onIr={irA}
                    onVerModulos={ruta ? ruta.onVerModulos : () => setVerModulos(true)}
                    total={n + 1}
                  />
                </div>
              </div>
            </div>

            {tramos.map((t, k) => (
              <Letrero key={t.id} tramo={t} total={tramos.length} vertical={vertical} ref={guardar('letrero', k)} />
            ))}

            {islasMeta.map((l, i) => {
              const estado = estados[i]
              const p = progreso.lecciones[l.id]
              const contenido = getLeccion(l.id)
              const texto = l.parada
                ? textoParada(l.parada, estado, progreso)
                : l.esRetos
                  ? `${retosHechos}/${retos.length} hechos`
                  : textoEstado(estado, p, contenido)
              return (
                <div key={l.id} ref={guardar('nodo', i + 1)} data-nodo className="absolute left-0 top-0 size-0">
                  <div>
                    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                      <div ref={guardar('difuso', i + 1)}>
                        <div ref={guardar('chica', i + 1)} style={{ opacity: 0 }}>
                          {l.esRetos || l.parada?.tipo === 'reto' ? (
                            <IslaRetos acento={acentoIsla(i)} completo={estado === 'hecha'} bloqueada={estado === 'bloqueada'} descripcion={texto} onClick={() => irA(i + 1)} />
                          ) : l.parada ? (
                            <Isla
                              leccion={l}
                              estado={estado}
                              esActual={i === actual}
                              avance={avanceParada(l.parada, estado, progreso)}
                              acento={acentoIsla(i)}
                              descripcion={texto}
                              etiqueta={l.titulo}
                              cuadrada={l.parada.tipo === 'abre'}
                              contenido={contenidoParada(l.parada, ruta, 'size-9')}
                              saltada={l.parada.tipo === 'leccion' && Boolean(progreso.lecciones[l.parada.id]?.saltada)}
                              onClick={() => irA(i + 1)}
                            />
                          ) : (
                            <Isla
                              leccion={l}
                              estado={estado}
                              esActual={i === actual}
                              avance={estado === 'empezada' && contenido ? p.paso / contenido.pasos.length : 0}
                              acento={modulo.acento}
                              descripcion={texto}
                              saltada={Boolean(p?.saltada)}
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
                        <span className={`line-clamp-2 text-center text-base font-semibold leading-snug ${estado === 'bloqueada' || estado === 'proximamente' || estado === 'opcional' ? 'text-zinc-500' : 'text-zinc-900'}`}>
                          {l.titulo}
                        </span>
                        {/* Opcional (Curso completo): la ficha punteada «Opcional» debajo (también en pantallas anchas). */}
                        {l.parada?.opcional && estado !== 'hecha' ? (
                          <span data-opcional className="mt-1 rounded-full border-2 border-dashed border-zinc-300 px-2.5 font-juego text-sm uppercase tracking-wide text-zinc-500">
                            Opcional
                          </span>
                        ) : (
                          vertical && (
                            <span className={`text-center text-sm font-semibold ${i === actual ? '' : 'text-zinc-500'}`} style={i === actual ? { color: tinta(acentoIsla(i)) } : undefined}>
                              {texto}
                            </span>
                          )
                        )}
                      </span>
                    </div>
                    <div ref={guardar('grande', i + 1)} className="absolute left-0 top-0" style={{ visibility: 'hidden', opacity: 0, width: grande, transformOrigin: `50% ${BOLA / 2}px` }}>
                      <div ref={guardar('inclina', i + 1)} style={{ transformOrigin: `50% ${BOLA / 2}px` }}>
                        {l.parada ? (
                          <ParadaAbierta
                            parada={l.parada}
                            estado={estado}
                            ruta={ruta}
                            acento={acentoIsla(i)}
                            progreso={progreso}
                            actual={actual >= 0 ? lecciones[actual] : null}
                            indice={i}
                            total={n}
                            onCerrar={cerrar}
                            onIr={(li) => irA(li + 1)}
                          />
                        ) : l.esRetos ? (
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
              lecciones={[{ id: 'insignia', titulo: modulo.titulo, esInsignia: true, numero: modulo.numero, nombre: nombreModulo }, ...islasMeta]}
              estados={['insignia', ...estados]}
              abierta={abierta}
              foco={abierta ?? vista ?? (actual >= 0 ? actual + 1 : 0)}
              acento={modulo.acento}
              guardar={guardar}
              onIr={irA}
              flotaX={flotaX}
              flotaY={flotaY}
              giro={giro}
              golpe={golpe}
              reducir={reducir}
              onMatraca={matraca}
              onVerModulos={ruta?.onVerModulos}
              textoVerModulos={ruta?.textoVerModulos}
              tramos={tramos}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
      {!ruta && <NavegadorModulos abierta={verModulos} onCerrar={() => setVerModulos(false)} actual={modulo.numero} />}
      {!ruta && <HojaRetos abierta={verRetos} onCerrar={() => setVerRetos(false)} modulo={modulo} retos={retos} progreso={progreso} />}
    </>
  )
}

/**
 * Barra de puntitos (de vidrio), siempre a la vista abajo en el módulo. Tocar un puntito abre su isla; arrastrar por la barra va **directo a la isla del
 * puntito más cercano al dedo** (siempre gana una: nunca se quedan dos islas a medio abrir), con el
 * resorte de pantalla. Además flota con el dedo y hace de matraca (ver FLOTA y MATRACA).
 *
 * REGLA (pedido del usuario: con muchas paradas los puntitos quedaban diminutos): si a 44 px no caben (celular con
 * una ruta o un módulo largo), la barra ocupa el ancho de la pantalla y los puntitos van en una **tira de 44 px por
 * puntito que se desliza**: el de `foco` (la isla abierta o, con el camino cerrado, la actual) queda **en el centro**
 * y las orillas se desvanecen. Entre tramos, un hueco con su número.
 * Deslizar sobre la regla (pedido del usuario) arrastra la tira en el sentido del dedo: cada puntito que pasa por el
 * centro abre su isla y da su golpe de matraca; al soltar, con inercia, la tira se acomoda con un puntito en el centro
 * (ver REGLA). Tocar (soltar sin haber movido) va al puntito que estaba bajo el dedo.
 */
function BarraPuntitos({ lecciones, estados, abierta, foco, acento, guardar, onIr, flotaX, flotaY, giro, golpe, reducir, onMatraca, onVerModulos, textoVerModulos = 'Módulos y prácticas', tramos = [] }) {
  const sep = DESLIZAR.puntitos.separacion
  const zonaMuerta = DESLIZAR.puntitos.zonaMuerta
  const ventana = useAnchoVentana()
  // Tramos de una ruta: un hueco antes del primer puntito de cada uno (el 0 es la insignia: puntito i = parada i − 1).
  const numeroTramo = new Map(tramos.map((t) => [t.desde + 1, t]))
  const total = lecciones.length
  // ¿Caben a 44 px? (la barra deja 16 px a cada lado de la pantalla y la píldora 12 px por dentro).
  const disponible = ventana - 32 - 24
  const regla = ventana > 0 && total * sep + numeroTramo.size * HUECO_TRAMO > disponible
  const hueco = regla ? HUECO_REGLA : HUECO_TRAMO
  // Centro de cada puntito dentro de la tira (px) y su ancho total.
  const { centros, largo } = useMemo(() => {
    let x = 0
    const c = []
    for (let i = 0; i < total; i++) {
      if (numeroTramo.has(i)) x += hueco
      c.push(x + sep / 2)
      x += sep
    }
    return { centros: c, largo: x }
  }, [total, hueco, sep, tramos.map((t) => t.desde).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const pildora = useRef(null)
  const vista = useRef(null) // ventana de la regla (la tira se corre dentro)
  const g = useRef(null) // gesto sobre la barra
  const ultimoArrastre = useRef(0)
  const corre = useMotionValue(0) // x de la tira (regla)
  const destino = (k) => disponible / 2 - centros[limitar(k, 0, total - 1)]
  /** Puntito que queda en el centro con la tira en `x`. */
  const enCentro = (x) => masCercano(centros, disponible / 2 - x)
  /** x de la tira con el dedo `dx` px desde donde empezó: 1:1 y, pasado el primero o el último, goma. */
  const arrastrada = (s, dx) => {
    const x = s.corre0 + dx
    const max = destino(0)
    const min = destino(total - 1)
    return x > max ? max + (x - max) * REGLA.goma : x < min ? min + (x - min) * REGLA.goma : x
  }

  // La regla sigue al foco: el puntito de la isla abierta (o la actual) siempre en el centro.
  const yaColocada = useRef(false)
  useLayoutEffect(() => {
    if (!regla || g.current?.movio) return // mientras se arrastra, la tira es del dedo
    const x = destino(foco)
    if (!yaColocada.current || reducir) corre.jump(x)
    else animate(corre, x, RESORTE.pantalla)
    yaColocada.current = true
  }, [regla, foco, disponible, centros]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Arrastre de la regla: la tira sigue al dedo; el puntito que llega al centro abre su isla y da su matraca. */
  const arrastrar = (s, e, tiron) => {
    const ahora = performance.now()
    s.muestras.push([ahora, e.clientX])
    while (s.muestras.length > 2 && ahora - s.muestras[0][0] > REGLA.muestra) s.muestras.shift()
    let dx = e.clientX - s.x0
    if (!s.movio) {
      if (Math.abs(dx) < zonaMuerta) return
      s.movio = true
      s.x0 += Math.sign(dx) * zonaMuerta // arranca desde aquí, sin salto
      dx = e.clientX - s.x0
      corre.stop()
      s.corre0 = corre.get()
    }
    const x = arrastrada(s, dx)
    corre.set(x)
    const p = enCentro(x)
    if (p !== s.punto) {
      onMatraca(1, 3, { tiron, dir: Math.sign(p - s.punto) }) // cambia en el centro: sin inclinarse por su lugar
      s.punto = p
      onIr(p)
    }
    // Contra un extremo (goma): un golpe de tope al llegar.
    const tope = x > destino(0) + 1 ? -1 : x < destino(total - 1) - 1 ? 1 : 0
    if (tope && tope !== s.tope) onMatraca(tope < 0 ? 0 : 2, 3, { tiron, dir: tope })
    s.tope = tope
  }

  const soltar = (e) => {
    const s = g.current
    if (s?.id !== e.pointerId) return
    g.current = null
    animate(flotaX, 0, RESORTE.suave)
    animate(flotaY, 0, RESORTE.suave)
    if (!s.regla) return
    if (s.movio) {
      // Se asienta con un puntito en el centro: el más cercano a donde la llevaría la inercia.
      ultimoArrastre.current = performance.now()
      const [t0, x0] = s.muestras[0]
      const [t1, x1] = s.muestras[s.muestras.length - 1]
      const quieto = performance.now() - t1 > 80
      const v = !quieto && t1 - t0 > 10 ? (x1 - x0) / (t1 - t0) : 0 // px/ms
      const k = enCentro(corre.get() + v * REGLA.inercia)
      animate(corre, destino(k), reducir ? { duration: 0 } : { ...RESORTE.pantalla, velocity: v * 1000 })
      if (k !== s.punto) {
        onMatraca(1, 3, { dir: Math.sign(k - s.punto) })
        onIr(k)
      }
      return
    }
    // Tocar (sin haber movido): va al puntito que estaba bajo el dedo (medido donde se ve, no calculado). El «click»
    // que llega después no cuenta: la tira ya se movió (sin animación, al instante) y caería en otro puntito.
    ultimoArrastre.current = performance.now()
    const cs = [...pildora.current.querySelectorAll('[data-punto]')].map((b) => {
      const c = b.getBoundingClientRect()
      return c.left + c.width / 2
    })
    const p = masCercano(cs, e.clientX)
    onMatraca(1, 3, {})
    onIr(p)
    if (p === foco) animate(corre, destino(p), RESORTE.pantalla)
  }

  /** Cuánto jala el dedo: su distancia al eje de la barra (que flota con él), con signo (− = por encima). */
  const tironDe = (s, e) => {
    const dy = e.clientY - (s.ejeY + flotaY.get())
    return Math.sign(dy) * limitar((Math.abs(dy) - MATRACA.eje) / MATRACA.rango, 0, 1)
  }

  return (
    <motion.div
      data-nodo
      data-puntitos
      data-regla={regla ? '' : undefined}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pt-12"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      initial={{ y: '120%' }}
      animate={{ y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={RESORTE.pantalla}
    >
      {/* En una ruta: «Módulos y prácticas» (pedido del usuario), un círculo de vidrio como la casita y Opciones. */}
      {onVerModulos && (
        <Pulsable
          data-encima-barra
          onClick={onVerModulos}
          aria-label={textoVerModulos}
          className={`pointer-events-auto grid size-11 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
        >
          <Cuadritos className="size-6" />
        </Pulsable>
      )}
      {/* Capa que flota con el dedo */}
      <motion.div style={{ x: flotaX, y: flotaY }} className={`relative ${regla ? 'w-full' : ''}`}>
        {/* Capa de la matraca (giro) */}
        <motion.div
          role="group"
          aria-label="Lecciones del módulo"
          ref={pildora}
          className={`pointer-events-auto relative flex h-11 select-none items-center rounded-full px-3 ${regla ? 'w-full' : ''} ${VIDRIO}`}
          style={{ touchAction: 'none', rotate: giro, x: golpe }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            try {
              e.currentTarget.setPointerCapture?.(e.pointerId)
            } catch {
              // (un puntero que ya no existe: sin captura)
            }
            flotaX.stop()
            flotaY.stop()
            const base = {
              id: e.pointerId,
              // Desde donde ya estaba (si aún volvía a su sitio), sin saltos.
              y0: e.clientY - desflotar(flotaY.get()),
              tope: 0, // −1 / +1 mientras el dedo está más allá del primer / último puntito
            }
            // Eje de la barra en reposo: se mide en la capa que flota (no gira; la inclinada mediría de más).
            const capa = pildora.current.parentElement.getBoundingClientRect()
            base.ejeY = capa.top + capa.height / 2 - flotaY.get()
            if (regla) {
              g.current = {
                ...base,
                regla: true,
                x0: e.clientX,
                corre0: corre.get(),
                punto: enCentro(corre.get()),
                muestras: [[performance.now(), e.clientX]],
                movio: false,
              }
              return
            }
            const cs = [...pildora.current.querySelectorAll('[data-punto]')].map((b) => {
              const c = b.getBoundingClientRect()
              return c.left + c.width / 2
            })
            g.current = { ...base, centros: cs, punto: masCercano(cs, e.clientX) }
            onMatraca(g.current.punto, cs.length, {}) // tocar un puntito no da golpe (solo lo marca como del dedo)
            onIr(g.current.punto) // tocar un puntito va directo a su isla
          }}
          onPointerMove={(e) => {
            const s = g.current
            if (!s || s.id !== e.pointerId) return
            if (!reducir) flotaY.set(flotar(e.clientY - s.y0)) // flota: sigue al dedo en vertical (con resistencia)
            const tiron = tironDe(s, e)
            if (s.regla) {
              arrastrar(s, e, tiron)
              return
            }
            // Flota: en horizontal solo fuera de los puntitos.
            if (!reducir) flotaX.set(flotar(e.clientX - limitar(e.clientX, s.centros[0], s.centros[s.centros.length - 1])))
            // Al pasar a otro puntito: su isla se abre (gana siempre una) y la barra da un golpe de matraca.
            const p = masCercano(s.centros, e.clientX)
            if (p !== s.punto) {
              onMatraca(p, s.centros.length, { tiron, dir: Math.sign(p - s.punto) })
              s.punto = p
              onIr(p)
            }
            // Contra un extremo (medio puntito más allá del primero o del último): un golpe al chocar.
            const mitad = (s.centros[1] - s.centros[0] || sep) / 2
            const tope = e.clientX < s.centros[0] - mitad ? -1 : e.clientX > s.centros[s.centros.length - 1] + mitad ? 1 : 0
            if (tope && tope !== s.tope) onMatraca(tope < 0 ? 0 : s.centros.length - 1, s.centros.length, { tiron, dir: tope })
            s.tope = tope
          }}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          <div
            ref={vista}
            className={regla ? 'h-full w-full overflow-hidden' : 'contents'}
            // `clip` (no solo `hidden`): la tira la mueve `corre`; si el navegador la desplazara (al enfocar un
            // puntito con el teclado o con scrollIntoView), lo que se ve dejaría de cuadrar con `corre`.
            style={regla ? { overflow: 'clip', maskImage: `linear-gradient(to right, transparent, black ${BORDE_REGLA}px, black calc(100% - ${BORDE_REGLA}px), transparent)` } : undefined}
          >
            <motion.div className={regla ? 'flex h-full w-max items-center' : 'contents'} style={regla ? { x: corre } : undefined}>
              {lecciones.map((l, i) => {
                const hecha = estados[i] === 'hecha'
                // Islas aún no desbloqueadas (o sin contenido): puntito gris.
                const cerrada = estados[i] === 'bloqueada' || estados[i] === 'proximamente'
                // Opcional sin hacer (Curso completo): puntito hueco gris.
                const opcional = estados[i] === 'opcional'
                const color = l.parada?.acento ?? acento
                const tramo = numeroTramo.get(i)
                return (
                  <Fragment key={l.id}>
                    {tramo &&
                      (regla ? (
                        <span
                          aria-hidden
                          className="grid h-full shrink-0 place-items-center font-dato text-sm font-medium tabular-nums"
                          style={{ width: HUECO_REGLA, color: tinta(tramo.acento) }}
                        >
                          {tramo.numero}
                        </span>
                      ) : (
                        <span aria-hidden className="shrink-0" style={{ width: HUECO_TRAMO }} />
                      ))}
                    <button
                      type="button"
                      data-punto={i}
                      data-inicio-tramo={tramo ? '' : undefined}
                      onClick={() => performance.now() - ultimoArrastre.current > 400 && onIr(i)}
                      aria-label={
                        l.esInsignia
                          ? `${l.nombre}: ${l.titulo}`
                          : l.esRetos
                            ? 'Retos del módulo'
                            : `${l.parada ? '' : `Lección ${l.id}: `}${l.titulo}${hecha ? ' (completada)' : cerrada ? ' (bloqueada)' : opcional ? ' (opcional)' : ''}`
                      }
                      aria-current={i === abierta ? 'true' : undefined}
                      className="grid h-full shrink-0 place-items-center"
                      // 44 px por puntito; si no caben, la regla (ver arriba).
                      style={{ width: sep }}
                    >
                      <span
                        ref={guardar('punto', i)}
                        className={`block ${l.esRetos || l.esInsignia || l.parada?.tipo === 'reto' || l.parada?.tipo === 'abre' ? 'rounded-[5px]' : 'rounded-full'}`}
                        style={{
                          width: PUNTO,
                          height: PUNTO,
                          // La insignia (el módulo): cuadradito del color del módulo, siempre opaco.
                          backgroundColor: opcional ? 'transparent' : cerrada ? 'var(--color-zinc-300)' : hecha || l.esInsignia ? oscuro(color) : color,
                          border: opcional ? '2px solid var(--color-zinc-300)' : undefined,
                          opacity: cerrada || hecha || opcional || l.esInsignia ? 1 : 0.35,
                          transform: `scale(${i === abierta ? 1 : 0.5})`,
                        }}
                      />
                    </button>
                  </Fragment>
                )
              })}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Letrero de un TRAMO de la ruta (al empezar sus islas): «TRAMO 2 · 3/7», su nombre (con ✓ si está hecho) y una
 * mini barra con lo hecho, en el color del módulo del que sale el tramo. Lo coloca `actualizar()` del camino;
 * sobre `bg-fondo` para que el camino pase por detrás, como los títulos de las islas.
 */
function Letrero({ tramo: t, total, vertical, ref }) {
  const hecho = t.hechas === t.total
  return (
    <div ref={ref} data-letrero={t.id} className="pointer-events-none absolute left-0 top-0" style={{ opacity: 0, visibility: 'hidden' }}>
      <div
        className={`flex flex-col gap-1 rounded-2xl bg-fondo px-3 py-1.5 ${vertical ? 'items-center text-center' : ''}`}
        style={vertical ? { minWidth: 176 } : undefined}
      >
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(t.acento) }}>
          Tramo {t.numero}
          <span className="sr-only">de {total}:</span>
          <span className="font-dato font-medium normal-case tracking-normal text-zinc-500 tabular-nums">
            {t.hechas}/{t.total}
          </span>
        </span>
        <span className="flex max-w-full items-center gap-1.5 font-titulo text-xl font-bold leading-tight tracking-tight">
          {hecho && <MarcaBien className="size-5 shrink-0" />}
          <span className="truncate">{t.titulo}</span>
        </span>
        <BarraProgreso valor={t.hechas / t.total} color={t.acento} alto="h-1.5" className="w-full" aria-hidden />
      </div>
    </div>
  )
}

/** Une dos juegos de handlers de puntero (cada uno decide si el gesto es suyo). */
function unirHandlers(a, b) {
  const r = { ...a }
  for (const k of Object.keys(b)) r[k] = a[k] ? (e) => (a[k](e), b[k](e)) : b[k]
  return r
}

/** Grados de la matraca para el puntito `i` de `total` jalando hacia ABAJO (`tiron` = 1): −max (orilla izquierda,
 * antihorario) … 0 (centro) … +max (orilla derecha, horario). Por encima del eje se multiplica por un tirón negativo. */
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
function calcular({ ancho, vertical, n, abierta, grande, alto: altoAbierta = ALTO_ESTIMADO, vis = n + 1, cortes = [], margen = 0 }) {
  // `cortes`: nodos con los que empieza un tramo (cada uno lleva su letrero encima).
  // Nodos: 0 = insignia, m = isla m − 1 (de 0 a n). `abierta` = nodo abierto (o null).
  const nodos = []
  if (!ancho) return { nodos: Array.from({ length: n + 1 }, () => ({ x: 0, y: 0, escala: 1 })), alto: 0 }
  const onda = (m) => ((m - 1) % 2 ? ONDA : -ONDA) // ondulación de la isla del nodo m (m ≥ 1)

  if (vertical) {
    const amplitud = Math.max(0, Math.min(72, ancho / 2 - ETIQUETA / 2 - 4))
    const y0 = INSIGNIA + 8 + 56 + ISLA / 2
    const letreros = (m) => cortes.filter((c) => c <= m).length * LETRERO
    const yBase = (m) => (m === 0 ? INSIGNIA / 2 + 8 : y0 + (m - 1) * FILA + letreros(m))
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
  const base = 52 + 16 + ISLA / 2 + ONDA + (cortes.length ? LETRERO_ARRIBA : 0)
  if (abierta === null) {
    // Una columna por nodo; con más nodos que `vis`, las columnas siguen fuera de la vista (tira que se corre).
    // `margen` (tira): el hueco del desvanecido a cada lado; las columnas visibles caben entre los dos.
    const col = (ancho - 2 * margen) / vis
    nodos.push({ x: margen + col / 2, y: base, escala: 1 })
    for (let m = 1; m <= n; m++) {
      nodos.push({ x: margen + col * (m + 0.5), y: base + onda(m), escala: 1, etiqueta: 'arriba', anchoEtiqueta: Math.min(ETIQUETA, col - 8) })
    }
    return { nodos, alto: base + ONDA + ISLA / 2 + 24, col }
  }

  const cy = Y_ANCHO // la bola abierta y los nodos de los lados, a la misma altura
  const alto = Math.max(base + ONDA + ISLA / 2 + 24, cy - BOLA / 2 + altoAbierta + 28)
  const hueco = 20
  const izq = abierta // nodos antes del abierto
  const der = n - abierta // nodos después
  const finIzq = ancho / 2 - grande / 2 - hueco
  const iniDer = ancho / 2 + grande / 2 + hueco
  // Reparte los nodos de un lado; si no caben a SEPARA_MIN, guardan esa separación desde la bola hacia fuera
  // (los lejanos quedan fuera de la vista; la tira los recorta).
  const lado = (j, cuenta, desde, hasta, haciaFuera) => {
    const s = Math.max((hasta - desde) / cuenta, SEPARA_MIN)
    return haciaFuera < 0 ? { x: hasta - s * (cuenta - j - 0.5), s } : { x: desde + s * (j + 0.5), s }
  }
  // Escala de los nodos laterales según el espacio que les queda.
  const escalaDe = (s) => Math.max(0.55, Math.min(1, s / 110))
  for (let m = 0; m <= n; m++) {
    if (m === abierta) {
      nodos.push({ x: ancho / 2, y: cy, escala: 1 })
      continue
    }
    const { x, s } = m < abierta ? lado(m, izq, 0, finIzq, -1) : lado(m - abierta - 1, der, iniDer, ancho, 1)
    const e = escalaDe(s)
    if (m === 0) nodos.push({ x, y: cy, escala: e })
    else nodos.push({ x, y: cy + onda(m) * e, escala: e, etiqueta: s >= 120 ? 'arriba' : null, anchoEtiqueta: Math.min(ETIQUETA, s - 8) })
  }
  return { nodos, alto }
}

export function textoEstado(estado, p, contenido) {
  if (estado === 'hecha') return p?.saltada ? 'Saltada' : 'Completada'
  if (estado === 'empezada') return `Paso ${p.paso + 1} de ${contenido.pasos.length}`
  if (estado === 'nueva') return 'Empezar'
  if (estado === 'bloqueada') return 'Bloqueada'
  return 'Próximamente'
}

// Isla bloqueada: gris del tema (claro u oscuro) y su labio, un poco más oscuro.
const GRIS = 'var(--color-zinc-200)'
const LABIO_GRIS = 'color-mix(in oklab, var(--color-zinc-200) 82%, black)'

/** Una isla pequeña: círculo con «labio» inferior que se hunde al tocarla. */
function Isla({ leccion, estado, esActual, avance, acento, descripcion, onClick, etiqueta = null, cuadrada = false, contenido = null, saltada = false }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const fondo = lleno ? oscuro(acento) : estado === 'bloqueada' ? GRIS : estado === 'opcional' ? 'var(--color-zinc-100)' : 'var(--color-white)'
  const sombra = lleno ? labio(acento) : estado === 'bloqueada' ? LABIO_GRIS : 'transparent'
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      {esActual && <Anillo tam={ISLA + 24} acento={acento} avance={avance} />}
      <Pulsable
        onClick={onClick}
        aria-expanded={false}
        aria-label={`${etiqueta ?? `Lección ${leccion.id}: ${leccion.titulo}`}. ${descripcion}`}
        className={`grid size-full place-items-center ${cuadrada ? 'rounded-3xl' : 'rounded-full'} font-titulo text-2xl font-bold ${lleno ? 'text-blanco' : estado === 'bloqueada' ? 'text-zinc-500' : estado === 'opcional' ? 'border-[3px] border-dashed border-zinc-300 text-zinc-500' : 'border-2 border-dashed border-zinc-300 text-zinc-500'}`}
        style={{ backgroundColor: fondo, boxShadow: `0 6px 0 ${sombra}` }}
      >
        {estado === 'bloqueada' ? <Candado className="size-8" grosor={2.2} /> : estado === 'proximamente' ? <span className="text-xl">…</span> : (contenido ?? leccion.id)}
      </Pulsable>
      {/* Hecha: el número sigue a la vista y el ✓ verde va en la esquina (verde = hecho en toda la app). Saltada con la
          prueba rápida: el ✓ en contorno. */}
      {estado === 'hecha' && <MarcaBien className="pointer-events-none absolute -right-1 -top-1 size-7" aro="var(--color-fondo)" saltada={saltada} />}
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
  useOpciones() // modo administrador
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
    detalle = p?.saltada ? (
      <>
        <MarcaBien className="size-5" saltada /> Saltada con la prueba
      </>
    ) : (
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
        {estado === 'hecha' && <MarcaBien className="absolute right-0 top-0 size-9" aro="var(--color-fondo)" saltada={Boolean(p?.saltada)} />}
      </Bola>
      <Globo tema={tema} acento={acento} onCerrar={onCerrar}>
        <h3 className="pr-10 font-titulo text-xl font-bold leading-tight tracking-tight [text-wrap:balance]">{meta.titulo}</h3>
        <p className={`flex flex-wrap items-center gap-1.5 text-base font-medium ${tema === 'color' ? 'text-blanco/90' : 'text-zinc-600'}`}>{detalle}</p>
        {lleno && (
          <BotonGlobo tema={tema} acento={acento} principal data-foco onClick={() => ir(estado === 'hecha')}>
            {estado !== 'hecha' && <Reproducir className="size-5" />}
            {estado === 'nueva' ? 'Empezar' : estado === 'empezada' ? 'Continuar' : p?.saltada ? 'Hacerla' : 'Repetir'}
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
function InsigniaAbierta({ ruta, modulo, progreso, actual, retosHechos, totalRetos, onCerrar, onIr, onVerModulos, total }) {
  if (ruta) return <InsigniaRuta ruta={ruta} modulo={modulo} progreso={progreso} actual={actual} onCerrar={onCerrar} onIr={onIr} onVerModulos={onVerModulos} />
  const hechas = modulo.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const siguiente = actual >= 0 ? modulo.lecciones[actual] : null
  const prueba = pruebaDeModulo(modulo.numero, progreso)
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
        {/* Mientras la prueba rápida pueda saltar algo, «¿Ya lo sabes?» va en lugar de «Ir a…» (pedido del usuario). */}
        {prueba ? (
          <BotonYaLoSabes acento={modulo.acento} prueba={prueba} />
        ) : siguiente ? (
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
 * La insignia de una RUTA abierta: su ícono en grande y la tarjetita (paradas, ir a la que toca, módulos y prácticas).
 * En el Curso completo, la de un BLOQUE: su número, «Bloque 2 · 4/12», la meta del bloque con trofeo, ir al paso que
 * toca (o al bloque donde está) y «Ver todos los bloques».
 */
function InsigniaRuta({ ruta, modulo, progreso, actual, onCerrar, onIr, onVerModulos }) {
  const { paradas, hechas, total } = ruta.estado
  // La prueba rápida del tramo en el que vas (no en los bloques del curso).
  const prueba = modulo.esBloque ? null : pruebaDeRuta(modulo.id, ruta.estado, progreso)
  const siguiente = actual >= 0 ? paradas[actual] : null
  const ir = siguiente ? () => onIr(actual + 1) : ruta.siguienteFuera?.ir
  const destino = siguiente ?? ruta.siguienteFuera
  return (
    <div className="flex flex-col items-center" role="group" aria-label={modulo.nombre}>
      <Bola acento={modulo.acento} estado="nueva" cuadrada onClick={onCerrar}>
        {modulo.Icono ? <modulo.Icono className="size-14" /> : modulo.numero}
      </Bola>
      <Globo tema="color" acento={modulo.acento} onCerrar={onCerrar}>
        {modulo.esBloque && <span className="font-juego text-base uppercase tracking-wide text-blanco/85">{modulo.nombre}</span>}
        <h3 className={`${modulo.esBloque ? '-mt-2 ' : ''}pr-10 font-titulo text-xl font-bold leading-tight tracking-tight [text-wrap:balance]`}>
          {modulo.esBloque ? modulo.titulo : modulo.nombre}
        </h3>
        <p className="text-base font-medium text-blanco/90">
          <span className="font-dato tabular-nums">{hechas}/{total}</span> {modulo.esBloque ? 'pasos' : 'paradas'}
        </p>
        {ruta.bloque ? (
          <p className="flex items-center gap-2 text-base font-semibold" data-meta-bloque>
            <Trofeo className="size-5 shrink-0" /> Meta: {ruta.bloque.meta}
          </p>
        ) : (
          modulo.descripcion && <p className="line-clamp-3 text-base text-blanco/90">{modulo.descripcion}</p>
        )}
        {prueba ? (
          <BotonYaLoSabes acento={modulo.acento} prueba={prueba} />
        ) : (
          destino &&
          ir && (
            <BotonGlobo tema="color" acento={modulo.acento} principal data-foco onClick={ir}>
              Ir a: {destino.titulo}
            </BotonGlobo>
          )
        )}
        <BotonGlobo tema="color" acento={modulo.acento} onClick={onVerModulos}>
          {ruta.textoVerModulos ?? 'Módulos y prácticas'}
        </BotonGlobo>
      </Globo>
      <span className="sr-only">Desliza a los lados para ver las paradas.</span>
    </div>
  )
}

/**
 * «¿Ya lo sabes?» en el globo de la insignia: el botón principal (doble flecha) abre la prueba rápida del módulo o del
 * tramo; debajo, si ya la hiciste, «Última vez: 5 de 7».
 */
function BotonYaLoSabes({ acento, prueba }) {
  return (
    <>
      <BotonGlobo tema="color" acento={acento} principal data-foco data-ya-lo-sabes onClick={() => navegar(rutas.prueba(prueba.id))}>
        <Saltar className="size-5" grosor={2.4} />
        ¿Ya lo sabes? · {prueba.tramo ? `tramo ${prueba.tramo}` : `${prueba.n} ${prueba.n === 1 ? 'pregunta' : 'preguntas'}`}
      </BotonGlobo>
      {prueba.ultima && (
        <p className="-mt-1 text-center font-dato text-sm text-blanco/85" data-ultima-prueba>
          Última vez: {prueba.ultima.aciertos} de {prueba.ultima.total}
        </p>
      )}
    </>
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
  else if (estado === 'opcional') estilo = { backgroundColor: 'var(--color-zinc-100)', borderWidth: 3 }
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
function IslaRetos({ acento, completo, descripcion, onClick, bloqueada = false }) {
  return (
    <div className="relative grid place-items-center" style={{ width: ISLA, height: ISLA }}>
      <Pulsable
        onClick={onClick}
        aria-label={`Retos. ${descripcion}`}
        className={`grid size-full place-items-center rounded-full ${bloqueada ? 'text-zinc-500' : completo ? 'text-blanco' : 'border-[3px]'}`}
        style={
          bloqueada
            ? { backgroundColor: GRIS, boxShadow: `0 6px 0 ${LABIO_GRIS}` }
            : completo
              ? { backgroundColor: oscuro(acento), boxShadow: `0 6px 0 ${labio(acento)}` }
              : { backgroundColor: 'var(--color-white)', borderColor: acento, color: tinta(acento), boxShadow: `0 6px 0 ${claro(acento)}` }
        }
      >
        {bloqueada ? <Candado className="size-8" grosor={2.2} /> : <Trofeo className="size-8" />}
      </Pulsable>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Paradas de una RUTA (content/rutas.js): mismas islas y globos que las lecciones de un módulo.
// ---------------------------------------------------------------------------

/** Estado de isla de una parada: 'hecha' | 'empezada' (lección a medias) | 'nueva' (actual o abierta) | 'bloqueada'. */
function estadoParada(p, progreso) {
  if (p.hecha) return 'hecha'
  if (p.estado === 'bloqueada') return 'bloqueada'
  if (p.estado === 'opcional') return 'opcional'
  if (p.tipo === 'leccion' && progreso.lecciones[p.id]?.paso > 0) return 'empezada'
  return 'nueva'
}

/** Texto corto bajo la isla (en el celular) y en su aria-label. */
function textoParada(p, estado, progreso) {
  if (estado === 'hecha') return p.tipo === 'leccion' ? (progreso.lecciones[p.id]?.saltada ? 'Saltada' : 'Completada') : 'Hecha'
  if (estado === 'bloqueada') return 'Bloqueada'
  if (estado === 'opcional') return 'Opcional'
  if (p.tipo === 'leccion') return getLeccion(p.id) ? textoEstado(estado, progreso.lecciones[p.id], getLeccion(p.id)) : 'Llega pronto'
  return { meta: 'Practicar', abre: 'Se abre', reto: 'Reto en FL' }[p.tipo]
}

/** Avance del aro de la isla actual (solo las lecciones a medias). */
function avanceParada(p, estado, progreso) {
  if (p.tipo !== 'leccion' || estado !== 'empezada') return 0
  const pasos = getLeccion(p.id)?.pasos.length
  return pasos ? progreso.lecciones[p.id].paso / pasos : 0
}

/** Lo de dentro de la isla: el número de la lección, el ícono de la práctica o el de lo que se abre. */
function contenidoParada(p, ruta, clase) {
  if (p.tipo === 'leccion') return p.id
  if (p.tipo === 'reto') return <Trofeo className={clase} />
  const Icono = p.Icono || (p.tipo === 'abre' && ruta.iconosAbre?.[p.herramienta]) || ruta.Icono
  return Icono ? <Icono className={clase} /> : null
}

/** Una parada abierta: la isla en grande y su globo (qué pide, cómo vas y el botón para ir). */
function ParadaAbierta({ parada: p, estado, ruta, acento, progreso, actual, indice, total, onCerrar, onIr }) {
  const lleno = estado === 'hecha' || estado === 'nueva' || estado === 'empezada'
  const reto = p.tipo === 'reto'
  const opcional = estado === 'opcional'
  const tema = estado === 'bloqueada' ? 'gris' : opcional ? 'blanco' : reto && !p.hecha ? 'borde' : 'color'
  const enColor = tema === 'color'
  const tipo = (p.opcional ? 'Opcional · ' : '') + { leccion: `Lección ${p.id}`, meta: 'Práctica', abre: 'Se abre', reto: 'Reto en FL Studio' }[p.tipo]
  // Lo que va antes: la isla actual de este camino o, en el Curso completo, el siguiente paso si está en otro bloque.
  const antes = actual ? { titulo: actual.titulo, ir: () => onIr(actual.parada.i) } : (ruta.siguienteFuera ?? null)
  const leccion = p.tipo === 'leccion' ? getLeccion(p.id) : null
  const lp = progreso.lecciones[p.id]
  const pasos = leccion?.pasos.length ?? 0
  const porcentaje = p.tipo !== 'leccion' ? (p.hecha ? 100 : 0) : estado === 'hecha' ? 100 : estado === 'empezada' ? Math.round((lp.paso / pasos) * 100) : 0

  let detalle = null
  let texto = p.texto ?? null
  if (estado === 'bloqueada')
    detalle = antes && (
      <>
        <Candado className="size-5" /> Antes: {antes.titulo}
      </>
    )
  else if (opcional) detalle = <>No cuenta para el bloque{leccion ? ` · ~${leccion.minutos} min` : ''}</>
  else if (estado === 'hecha')
    detalle = (
      <>
        <MarcaBien className="size-5" saltada={Boolean(lp?.saltada)} /> {p.tipo !== 'leccion' ? 'Hecha' : lp?.saltada ? 'Saltada con la prueba' : 'Completada'}
      </>
    )
  else if (p.tipo === 'leccion' && !leccion) detalle = 'Llega pronto'
  else if (p.tipo === 'leccion')
    detalle = estado === 'empezada' ? <>Paso {lp.paso + 1} de {pasos} · {porcentaje} %</> : <>~{leccion?.minutos} min · {pasos} pasos</>
  else if (p.tipo === 'meta') detalle = <span className="font-dato">{ruta.meta(p).detalle}</span>
  if (p.tipo === 'abre' && !p.hecha) texto = `${p.texto} Se abre al terminar la lección ${HERRAMIENTAS[p.herramienta].leccion}.`

  let boton = null
  if (estado === 'bloqueada') {
    if (antes) boton = { texto: `Ir a: ${antes.titulo}`, onClick: antes.ir }
  } else if (p.tipo === 'leccion' && leccion) {
    boton = {
      texto: opcional ? (lp?.paso > 0 ? 'Continuar' : 'Empezar') : estado === 'nueva' ? 'Empezar' : estado === 'empezada' ? 'Continuar' : lp?.saltada ? 'Hacerla' : 'Repetir',
      icono: estado !== 'hecha',
      onClick: () => {
        if (estado === 'hecha') reiniciarLeccion(p.id)
        navegar(rutas.leccion(p.id))
      },
    }
  } else if (p.tipo === 'meta') boton = { texto: 'Practicar', onClick: () => ruta.meta(p).ir() }
  else if (p.tipo === 'abre' && p.hecha && p.herramienta === 'flow') boton = { texto: 'Ir a Letras', onClick: () => navegar(rutas.letras()) }
  else if (p.tipo === 'abre' && p.hecha && p.herramienta === 'circulo') boton = { texto: 'Ir al círculo', onClick: () => navegar(rutas.circulo()) }
  else if (reto) boton = { texto: p.hecha ? '¡Hecho!' : 'Lo hice', check: p.hecha, onClick: () => guardarReto(p.id, { hecho: !p.hecha }) }

  return (
    <div className="flex flex-col items-center" role="group" aria-label={p.titulo}>
      <Bola acento={acento} estado={estado} avance={lleno ? porcentaje / 100 : null} retos={reto && estado !== 'bloqueada'} cuadrada={p.tipo === 'abre'} onClick={onCerrar}>
        {estado === 'bloqueada' ? <Candado className="size-10" /> : contenidoParada(p, ruta, 'size-12')}
        {estado === 'hecha' && <MarcaBien className="absolute right-0 top-0 size-9" aro="var(--color-fondo)" saltada={p.tipo === 'leccion' && Boolean(lp?.saltada)} />}
      </Bola>
      <Globo tema={tema} acento={acento} onCerrar={onCerrar}>
        <span className={`font-juego text-base uppercase tracking-wide ${enColor ? 'text-blanco/85' : ''}`} style={enColor ? undefined : { color: tinta(acento) }}>
          {tipo}
        </span>
        <h3 className="-mt-2 pr-10 font-titulo text-xl font-bold leading-tight tracking-tight [text-wrap:balance]">{p.titulo}</h3>
        {detalle && <p className={`flex flex-wrap items-center gap-1.5 text-base font-medium ${enColor ? 'text-blanco/90' : 'text-zinc-600'}`}>{detalle}</p>}
        {texto && estado !== 'bloqueada' && <p className={`line-clamp-4 text-base leading-snug ${enColor ? 'text-blanco/90' : 'text-zinc-700'}`}>{texto}</p>}
        {boton && (
          <BotonGlobo tema={tema} acento={acento} principal data-foco onClick={boton.onClick}>
            {boton.icono && <Reproducir className="size-5" />}
            {boton.check && <Check className="size-5" />}
            {boton.texto}
          </BotonGlobo>
        )}
      </Globo>
      <span className="sr-only">
        Parada {indice + 1} de {total}. Desliza a los lados para ver las demás.
      </span>
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

/** Ancho de la ventana (la barra de puntitos decide si cabe o va en regla). */
function useAnchoVentana() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth))
  useEffect(() => {
    const cambio = () => setW(window.innerWidth)
    window.addEventListener('resize', cambio)
    return () => window.removeEventListener('resize', cambio)
  }, [])
  return w
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
