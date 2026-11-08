import BotonSonido from '../BotonSonido.jsx'
import Rich from '../Rich.jsx'
import Nota from './Nota.jsx'

/** Paso de explicación: párrafos, botones de sonido opcionales y una nota al pie. */
export default function PasoTexto({ paso }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 text-lg leading-relaxed text-zinc-600">
        {paso.parrafos?.map((p, i) => (
          <p key={i}>
            <Rich>{p}</Rich>
          </p>
        ))}
      </div>

      {paso.sonidos?.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {paso.sonidos.map((s, i) => (
            <BotonSonido key={i} sonido={s} />
          ))}
        </div>
      )}

      {paso.nota && <Nota>{paso.nota}</Nota>}
    </div>
  )
}
