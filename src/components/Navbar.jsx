import { Link } from "react-router-dom"

export default function Navbar() {

  return (

    <nav className="flex justify-between items-center mb-12 text-white">

      <Link to="/" className="text-2xl font-bold">
        Neurial
      </Link>

      <div className="flex gap-6 text-gray-300">

        <Link to="/features" className="hover:text-white">
          Features
        </Link>

        <Link to="/pricing" className="hover:text-white">
          Pricing
        </Link>

        <Link to="/use-cases" className="hover:text-white">
          Use Cases
        </Link>

        <Link
          to="/app"
          className="text-yellow-400 font-semibold"
        >
          Generator
        </Link>

      </div>

    </nav>

  )

}