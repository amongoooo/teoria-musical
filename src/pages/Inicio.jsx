import Piano from '../components/Piano.jsx'

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Teoría Musical</h1>
        <p className="text-lg text-zinc-500 sm:text-xl">
          Aprende teoría musical y producción en FL Studio, paso a paso y tocando.
        </p>
      </header>

      <section>
        <Piano />
      </section>
    </main>
  )
}
