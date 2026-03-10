import Navbar from "../components/Navbar"

export default function Pricing() {
  return (
    <div className="text-white max-w-4xl mx-auto">
      <Navbar />
      <h1 className="text-4xl font-bold mb-8">Pricing</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-8 rounded-xl">
          <h2 className="text-2xl mb-4">Free</h2>
          <ul className="space-y-2 text-gray-300">
            <li>10 minute sessions</li>
            <li>Basic sound generator</li>
            <li>No audio export</li>
          </ul>
        </div>
        <div className="bg-slate-900 p-8 rounded-xl border border-yellow-400">
          <h2 className="text-2xl mb-4">Pro — €9.99/month</h2>
          <ul className="space-y-2 text-gray-300">
            <li>Unlimited sessions</li>
            <li>Unlimited exports</li>
            <li>Commercial use allowed</li>
            <li>Royalty-free audio</li>
          </ul>
        </div>
      </div>
    </div>
  )
}