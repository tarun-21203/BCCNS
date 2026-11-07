import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";

export { default as SiteHeader } from "./components/SiteHeader.jsx";

// Public entry point of the search module. The shell mounts this component.
// Paths are absolute (/ and /search) until the shell fixes the base path.
export function SearchRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="*" element={<SearchPage />} />
    </Routes>
  );
}
