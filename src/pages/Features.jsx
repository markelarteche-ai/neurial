import Navbar from "../components/Navbar"

export default function Features() {
  return (
    <div className="text-white max-w-4xl mx-auto">
      <Navbar />
      <h1 className="text-4xl font-bold mb-6">Features</h1>
      <ul className="space-y-4 text-gray-300">
        <li>Multiple noise colors</li>
        <li>Nature sound layers</li>
        <li>Binaural brainwave frequencies</li>
        <li>Real-time sound generation</li>
        <li>Export long audio sessions</li>
      </ul>
    </div>
  )
}