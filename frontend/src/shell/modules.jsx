// Single registry of the modules the shell mounts.
// To plug in a module: export `<XRoutes />` from src/modules/<x>/index.jsx,
// then replace its `element` here. Keep `path` stable so links keep working.
import { SearchRoutes } from "../modules/search";
import { ThreadRoutes } from "../modules/threads";
import Placeholder from "./Placeholder.jsx";

export const MODULES = [
  {
    path: "search",
    label: "Search",
    owner: "Member 2",
    element: <SearchRoutes />,
  },
  {
    path: "ask",
    label: "Ask the archive",
    owner: "Member 3",
    element: (
      <Placeholder
        title="Ask the archive"
        owner="Member 3"
        contract="POST /api/ai/search with { question } — answers cite indexed records or abstain."
      />
    ),
  },
  {
    path: "map",
    label: "Silence Map",
    owner: "Member 4",
    element: (
      <Placeholder
        title="Silence Map"
        owner="Member 4"
        contract="GET /api/coverage and GET /api/communities — counts describe our index, not history."
      />
    ),
  },
  {
    path: "threads",
    label: "Thread View",
    owner: "Member 5",
    element: <ThreadRoutes />,
  },
];

// Cross-module link helpers live in ./links.js (recordHref, threadHref).
