import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { MODULES } from "./modules.jsx";
import "./shell.css";

// Shared layout: header, module tabs, and one route per module.
// Each module owns everything under /<path>/*.
export default function AppShell() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="shell-bar">
          <NavLink to="/" className="shell-brand">
            THREADS <span className="shell-tagline">Black History Discovery</span>
          </NavLink>
          <nav aria-label="Main" className="shell-nav">
            {MODULES.map((m) => (
              <NavLink key={m.path} to={`/${m.path}`} className="shell-tab">
                {m.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          {MODULES.map((m) => (
            <Route key={m.path} path={`/${m.path}/*`} element={m.element} />
          ))}
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <footer className="shell-footer">
        Prototype index of sample records from selected institutions. THREADS links to
        authoritative records and does not hold or copy the collections. Results reflect only
        the sources indexed here, not everything that exists.
      </footer>
    </div>
  );
}
