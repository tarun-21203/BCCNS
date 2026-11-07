import { Routes, Route } from "react-router-dom";
import RecordListPreview from "./pages/RecordListPreview.jsx";

// Public entry point of the search module. The shell mounts this component.
export function SearchRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<RecordListPreview />} />
    </Routes>
  );
}
