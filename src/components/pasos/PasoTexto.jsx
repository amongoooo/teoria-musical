import { useState } from 'react'
import { acentoLeccion } from '../../content/index.js'
import BotonSonido from '../BotonSonido.jsx'
import { CirculoSonoro } from '../CirculoQuintas.jsx'
import Fichas from './Fichas.jsx'
import LetraAnalizada from '../LetraAnalizada.jsx'
import PianoRoll, { conIds } from '../PianoRoll.jsx'
import Rich from '../Rich.jsx'
import Nota from './Nota.jsx'

/** Paso de explicación: párrafos, una letra analizada (colores de rima, esquema, sílabas), Piano Roll de ejemplo, círculo de quintas, fichas que suenan y botones de sonido opcionales, y una nota al pie. */
export default function PasoTexto({ paso, leccionId }) {
  const [notasRoll] = useState(() => (paso.roll ? conIds(paso.roll.notas) : null))
  const color = acentoLeccion(leccionId)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 text-lg leading-relaxed text-zinc-600">
        {paso.parrafos?.map((p, i) => (
          <p key={i}>
            <Rich>{p}</Rich>
          </p>
        ))}
      </div>

      {paso.letra && <LetraAnalizada letra={paso.letra} />}

      {paso.roll && <PianoRoll roll={paso.roll} notas={notasRoll} color={color} />}

      {paso.circulo && <CirculoSonoro circulo={paso.circulo} color={color} />}

      {paso.fichas && <Fichas fichas={paso.fichas} />}

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
