import { Link, NavLink } from "react-router-dom";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="THREADS home">
        <span className="brand-name">THREADS</span>
        <span className="brand-tag">Black history · Canadian archives</span>
      </Link>
      <nav className="site-nav" aria-label="Main">
        <NavLink to="/" end>Explore</NavLink>
        <NavLink to="/search">Search</NavLink>
        <Link className="nav-cta" to="/search">Search the index</Link>
      </nav>
    </header>
  );
}
