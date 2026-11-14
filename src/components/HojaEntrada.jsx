import { useState } from 'react'
import { datosPrueba, pendientes, pruebaModulo, pruebaTramo } from '../content/pruebas/index.js'
import { getPrueba, useProgreso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { oscuro, tinta } from '../ui/color.js'
import Hoja from '../ui/Hoja.jsx'
import { MarcaBien, Reproducir, Saltar } from '../ui/Iconos.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import { Cuadrito } from './NavegadorModulos.jsx'
import { useRuta } from './rutaModulo.js'

/**
 * HOJAS DE ENTRADA (pedido del usuario: la prueba rápida «¿Ya lo sabes?» sale al presionar el botón del módulo o de
 * la ruta, sin botón aparte). Al tocar el cuadrito de un módulo o de una ruta (Inicio, entradas de las prácticas)
 * sube una hoja corta con dos caminos: el botón grande ENTRA como siempre y el de vidrio, con doble flecha, abre la
 * prueba. Solo mientras quede algo por hacer: con todo hecho, el cuadrito entra directo (`useEntrada`).
 */

/** Las lecciones que la prueba de un módulo aún puede saltar. */
export function pendientesModulo(numero, progreso) {
  return pendientes(datosPrueba(pruebaModulo(numero)), progreso)
}

/** Tramos de una ruta con lo que su prueba aún puede saltar. */
function tramosConPrueba(id, tramos, progreso) {
  return tramos.map((t) => ({ ...t, pendientes: pendientes(datosPrueba(pruebaTramo(id, t.id)), progreso) }))
}

/** ¿Una ruta tiene algo que la prueba pueda saltar? */
export function rutaConPrueba(id, tramos, progreso) {
  return tramosConPrueba(id, tramos, progreso).some((t) => t.pendientes.length > 0)
}

/**
 * El toque de un cuadrito (un enlace con `href`): si hay prueba que ofrecer, en vez de seguir el enlace abre la
 * hoja; si no, el enlace entra directo como siempre. Devuelve { abierta, cerrar, tocar }.
 */
export function useEntrada(hayPrueba) {
  const [abierta, setAbierta] = useState(false)
  return {
    abierta,
    cerrar: () => setAbierta(false),
    tocar: (e) => {
      if (!hayPrueba) return
      e.preventDefault()
      setAbierta(true)
    },
  }
}

/** Hoja de un módulo: su cuadrito, cuántas lecciones llevas, «Empezar / Seguir» y «¿Ya lo sabes?». */
export function HojaModulo({ abierta, onCerrar, modulo: m }) {
  const progreso = useProgreso()
  const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const total = m.lecciones.length
  const pend = pendientesModulo(m.numero, progreso)
  const prueba = datosPrueba(pruebaModulo(m.numero))
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta={`Módulo ${m.numero}: ${m.titulo}`}>
      <div className="flex flex-col gap-5" data-hoja-entrada={`modulo-${m.numero}`}>
        <Encabezado modulo={m} etiqueta={`Módulo ${m.numero} · ${hechas}/${total}`} titulo={m.titulo} />
        <BarraProgreso valor={total ? hechas / total : 0} color={m.acento} fondo="bg-zinc-100" alto="h-2" alAparecer={false} />
        <Botones
          acento={m.acento}
          entrar={{ texto: hechas ? 'Seguir' : 'Empezar', onClick: () => navegar(rutas.modulo(m.numero)) }}
          prueba={pend.length > 0 && { texto: `¿Ya lo sabes? · ${pend.length} ${pend.length === 1 ? 'pregunta' : 'preguntas'}`, onClick: () => navegar(rutas.prueba(prueba.id)) }}
          ultima={getPrueba(prueba.clave)}
        />
      </div>
    </Hoja>
  )
}

/**
 * Hoja de una ruta: su cuadrito, sus tramos (✓ los hechos; el marcado es el de la prueba) y los dos botones.
 * La prueba es la del tramo en el que vas; tocar otro tramo la cambia a ese.
 */
export function HojaRuta({ abierta, onCerrar, id }) {
  const { ruta, modulo, estado, progreso } = useRuta(id)
  const tramos = tramosConPrueba(id, estado.tramos, progreso)
  const actual = tramos.find((t) => estado.actual >= t.desde && estado.actual <= t.hasta)
  const porDefecto = (actual?.pendientes.length ? actual : tramos.find((t) => t.pendientes.length)) ?? tramos[0]
  const [elegido, setElegido] = useState(null)
  const tramo = tramos.find((t) => t.id === elegido && t.pendientes.length) ?? porDefecto
  const varios = tramos.length > 1
  const n = tramo.pendientes.length
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta={ruta.titulo}>
      <div className="flex flex-col gap-5" data-hoja-entrada={`ruta-${id}`}>
        <Encabezado modulo={modulo} etiqueta={`Ruta · ${estado.hechas}/${estado.total}`} titulo={ruta.titulo} />
        {varios ? (
          <ol className="flex flex-col gap-1.5">
            {tramos.map((t) => {
              const hecho = t.hechas === t.total
              const marcado = t.id === tramo.id && n > 0
              return (
                <li key={t.id}>
                  <Pulsable
                    tipo="tarjeta"
                    onClick={() => t.pendientes.length && setElegido(t.id)}
                    aria-pressed={marcado}
                    data-tramo-hoja={t.id}
                    data-marcado={marcado || undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-3 py-1.5 text-left ${marcado ? '' : 'border-transparent'}`}
                    style={marcado ? { borderColor: t.acento, backgroundColor: 'color-mix(in srgb, ' + t.acento + ' 12%, var(--color-white))' } : undefined}
                  >
                    {hecho ? (
                      <MarcaBien className="size-7" />
                    ) : (
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-full font-dato text-sm font-medium"
                        style={{ backgroundColor: marcado ? oscuro(t.acento) : 'var(--color-zinc-100)', color: marcado ? 'var(--color-blanco)' : 'var(--color-zinc-600)' }}
                      >
                        {t.numero}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 text-base font-semibold leading-snug text-zinc-900">{t.titulo}</span>
                    <span className="font-dato text-sm tabular-nums text-zinc-500">
                      {t.hechas}/{t.total}
                    </span>
                  </Pulsable>
                </li>
              )
            })}
          </ol>
        ) : (
          <BarraProgreso valor={estado.total ? estado.hechas / estado.total : 0} color={modulo.acento} fondo="bg-zinc-100" alto="h-2" alAparecer={false} />
        )}
        <Botones
          acento={modulo.acento}
          entrar={{ texto: estado.hechas ? 'Seguir' : 'Empezar', onClick: () => navegar(rutas.ruta(id)) }}
          prueba={
            n > 0 && {
              texto: varios ? `¿Ya lo sabes? · tramo ${tramo.numero}` : `¿Ya lo sabes? · ${n} ${n === 1 ? 'pregunta' : 'preguntas'}`,
              onClick: () => navegar(rutas.prueba(pruebaTramo(id, tramo.id))),
            }
          }
          ultima={getPrueba(`T-${tramo.id}`)}
        />
      </div>
    </Hoja>
  )
}

function Encabezado({ modulo, etiqueta, titulo }) {
  return (
    <div className="flex items-center gap-4 pr-10">
      <Cuadrito modulo={modulo} tam={56} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-dato text-sm font-medium uppercase tracking-wider" style={{ color: tinta(modulo.acento) }}>
          {etiqueta}
        </span>
        <h2 className="font-titulo text-2xl font-bold leading-tight tracking-tight [text-wrap:balance]">{titulo}</h2>
      </div>
    </div>
  )
}

/** El botón grande (entra, en el color del módulo) y el de vidrio de la prueba (doble flecha). */
function Botones({ acento, entrar, prueba, ultima }) {
  return (
    <div className="flex flex-col gap-3">
      <Pulsable
        onClick={entrar.onClick}
        data-foco
        data-entrar
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-semibold text-blanco"
        style={{ backgroundColor: oscuro(acento) }}
      >
        <Reproducir className="size-5" />
        {entrar.texto}
      </Pulsable>
      {prueba && (
        <Pulsable
          onClick={prueba.onClick}
          data-ya-lo-sabes
          className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-semibold ${VIDRIO}`}
          style={{ color: tinta(acento) }}
        >
          <Saltar className="size-5" grosor={2.4} />
          {prueba.texto}
        </Pulsable>
      )}
      {prueba && ultima && (
        <p className="text-center font-dato text-sm text-zinc-500">
          Última vez: {ultima.aciertos} de {ultima.total}
        </p>
      )}
    </div>
  )
}
