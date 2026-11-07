import { Routes, Route } from "react-router-dom";
import ThreadViewPage from "./pages/ThreadViewPage.jsx";

// Public entry point of the Thread View module. The shell mounts this.
export function ThreadRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<ThreadViewPage />} />
    </Routes>
  );
}
