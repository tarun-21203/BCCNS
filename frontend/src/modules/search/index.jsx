import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import RecordPage from "./pages/RecordPage.jsx";
import InstitutionsPage from "./pages/InstitutionsPage.jsx";
import PageFade from "./components/PageFade.jsx";
import "./search.css";

// Public entry point of the search module. The shell mounts this at /search/*,
// so every route here is relative to that:
//   /search                 map dashboard
//   /search/results         search + filters
//   /search/records/:id     record detail (target of recordHref in shell/links.js)
//   /search/institutions    the indexed sources, read from the mapping files
export function SearchRoutes() {
  return (
    <PageFade>
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="results" element={<SearchPage />} />
      <Route path="records/:id" element={<RecordPage />} />
      <Route path="institutions" element={<InstitutionsPage />} />
      <Route path="*" element={<SearchPage />} />
    </Routes>
    </PageFade>
  );
}
