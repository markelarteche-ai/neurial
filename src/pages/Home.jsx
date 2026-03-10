import Navbar from "../components/Navbar"

export default function Home() {
  return (
    <div className="text-white max-w-4xl mx-auto">
      <Navbar />
      <h1 className="text-5xl font-bold mb-6">Neurial</h1>
      <p className="text-gray-300 mb-8">
        Professional audio generator for focus, meditation, sleep and productivity.
      </p>
      <a href="/app" className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold">
        Start generating audio
      </a>
    </div>
  )
}