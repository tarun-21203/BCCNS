import { Routes, Route } from "react-router-dom";
import SilenceMapPage from "./pages/SilenceMapPage.jsx";
import "./map.css";

// Public entry point of the Silence Map module. The shell mounts this.
export function MapRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<SilenceMapPage />} />
    </Routes>
  );
}
