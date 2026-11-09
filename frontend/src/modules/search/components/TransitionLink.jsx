import { Link, useNavigate } from "react-router-dom";
import { runTransition } from "../lib/transition.js";

// A normal <Link> that navigates inside a View Transition. Modified clicks
// (new tab, new window) and links that open elsewhere behave as usual.
// `morph` makes the surrounding [data-morph] card glide into the next page.
export default function TransitionLink({ to, state, morph = false, onClick, children, ...rest }) {
  const navigate = useNavigate();

  function handleClick(e) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target && rest.target !== "_self") return;
    e.preventDefault();
    const scope = morph ? e.currentTarget.closest("[data-morph]") : null;
    runTransition(() => navigate(to, { state }), scope);
  }

  return (
    <Link to={to} state={state} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
