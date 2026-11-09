import { flushSync } from "react-dom";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Run a navigation inside a View Transition when the browser supports it.
// Without support, or with reduced motion on, it just runs the update.
//
// `scope` (optional) is the card being opened. Its title and institution line
// are given matching transition names so they glide into the record page's
// heading. Names must be unique in the old page, so any element on the current
// page that already carries one is switched off first.
export function runTransition(update, scope) {
  if (!document.startViewTransition || reducedMotion()) {
    update();
    return;
  }

  const touched = [];
  const name = (el, value) => {
    if (!el) return;
    el.style.setProperty("view-transition-name", value);
    touched.push(el);
  };

  document.querySelectorAll("[data-vt-target]").forEach((el) => name(el, "none"));
  if (scope) {
    name(scope.querySelector("[data-morph-title]"), "rec-title");
    name(scope.querySelector("[data-morph-inst]"), "rec-inst");
  }

  const root = document.documentElement;
  root.classList.add("vt-running");
  const transition = document.startViewTransition(() => {
    flushSync(update);
  });
  transition.finished.catch(() => {}).finally(() => {
    root.classList.remove("vt-running");
    touched.forEach((el) => el.style.removeProperty("view-transition-name"));
  });
}
