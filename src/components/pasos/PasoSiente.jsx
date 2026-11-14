import { acentoLeccion } from '../../content/index.js'
import BotonSonido from '../BotonSonido.jsx'
import Nota from './Nota.jsx'

/** Tarjeta "¿Qué se siente?": conecta el concepto con la emoción que produce. */
export default function PasoSiente({ paso, leccionId }) {
  const color = acentoLeccion(leccionId)
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {paso.lados.map((lado) => (
          <section key={lado.etiqueta} className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
            <h3 className="font-titulo text-2xl font-bold tracking-tight">{lado.etiqueta}</h3>
            <p className="text-lg font-medium text-zinc-800">{lado.emociones}</p>
            <p className="text-base text-zinc-500">{lado.ejemplos}</p>
            {lado.sonido && <BotonSonido sonido={lado.sonido} ver color={color} className="-mx-2 mt-1" />}
          </section>
        ))}
      </div>

      {paso.nota && <Nota titulo="En producción">{paso.nota}</Nota>}
    </div>
  )
}
