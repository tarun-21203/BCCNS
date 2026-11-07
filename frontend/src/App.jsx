import { SearchRoutes, SiteHeader } from "./modules/search";

// Dev-only wrapper. Member 5 replaces this with the shared application shell
// and mounts <SearchRoutes /> under whichever path the shell chooses.
export default function App() {
  return (
    <div className="app">
      <SiteHeader />
      <main>
        <SearchRoutes />
      </main>
    </div>
  );
}
