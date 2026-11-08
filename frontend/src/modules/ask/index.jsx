import { Routes, Route } from "react-router-dom";
import AskPage from "./pages/AskPage.jsx";
import "./ask.css";

// Public entry point of the Ask the archive module (Member 3). The shell mounts this.
export function AskRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<AskPage />} />
    </Routes>
  );
}
