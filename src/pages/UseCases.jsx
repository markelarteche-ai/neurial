import Navbar from "../components/Navbar"

export default function UseCases() {
  return (
    <div className="text-white max-w-4xl mx-auto">
      <Navbar />
      <h1 className="text-4xl font-bold mb-6">Use Cases</h1>
      <p className="text-gray-300 mb-4">
        Neurial can generate audio environments for focus, meditation, productivity and sleep.
      </p>
      <ul className="space-y-3 text-gray-300">
        <li>Focus and deep work</li>
        <li>Meditation soundscapes</li>
        <li>Sleep sounds</li>
        <li>YouTube background audio</li>
      </ul>
    </div>
  )
}