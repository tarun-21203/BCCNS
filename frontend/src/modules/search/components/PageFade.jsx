import { useLocation } from "react-router-dom";

// Soft entrance for each page of the module. Keyed on the path only, so
// changing a search or filter does not replay it.
export default function PageFade({ children }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="page-enter">{children}</div>;
}
