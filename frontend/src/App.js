import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Admin from "@/pages/Admin";
import { Toaster } from "@/components/ui/sonner";
import { pingBackendHealth } from "@/lib/api";

function App() {
  useEffect(() => {
    pingBackendHealth();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
