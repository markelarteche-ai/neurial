import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import UseCases from "./pages/UseCases";
import AdvancedSoundEngine from "./AdvancedSoundEngine";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/app" element={<AdvancedSoundEngine />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;