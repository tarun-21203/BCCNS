"""Try the pipeline from a terminal:  python -m threads_ai.cli "What records exist about Africville?" """

from __future__ import annotations

import argparse
import json

from .pipeline import Engine


def main() -> None:
    p = argparse.ArgumentParser(description="Ask THREADS a question.")
    p.add_argument("question")
    p.add_argument("--json", action="store_true", help="print the raw JSON response")
    p.add_argument("--records-only", action="store_true", help="keyword search only, no AI")
    args = p.parse_args()

    engine = Engine.from_settings()
    if args.records_only:
        out = engine.search_records(args.question)
        if args.json:
            print(json.dumps(out, indent=2, ensure_ascii=False))
            return
        _print_bridge(out["language_bridge"])
        for r in out["results"]:
            _print_hit(r)
        return

    out = engine.ask(args.question)
    if args.json:
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return
    print(f"\nStatus: {out['status']}   (served from: {out.get('served_from')})")
    chips = out.get("understood", {}).get("chips", [])
    if chips:
        print("Understood: " + ", ".join(f"{c['kind']}={c['label']}" for c in chips))
    _print_bridge(out.get("language_bridge", {}))
    if out.get("answer"):
        print("\nAnswer:")
        for c in out["answer"]["claims"]:
            refs = ", ".join(f"{x['record_id']} \"{x['quote']}\"" for x in c["citations"])
            print(f"  - {c['text']}\n      [{refs}]")
    else:
        print("\n" + out.get("message", ""))
        for step in out.get("suggested_next_steps", []):
            print(f"  - {step}")
    if out.get("gaps"):
        print(f"\nNot covered by these records: {out['gaps']}")
    v = out.get("verification")
    if v:
        print(f"\nVerification: {v['claims_shown']}/{v['claims_proposed']} claims shown, "
              f"{v['citations_rejected']} citation(s) rejected")
    print("\nRecords:")
    for r in out.get("records", []):
        _print_hit(r)
    print(f"\n{out.get('disclaimer', '')}")


def _print_bridge(bridge: dict) -> None:
    for m in bridge.get("matched", []):
        print(f"Language Bridge: '{m['matched_term']}' -> also searched related terms ({m['label']})")


def _print_hit(h: dict) -> None:
    r = h["record"]
    via = "  [found via Language Bridge]" if h.get("found_via_bridge") else ""
    print(f"  {r['id']}  {r['title']}  ({r.get('source_institution')}){via}")
    if h.get("content_note"):
        print(f"      Note: {h['content_note']}")


if __name__ == "__main__":
    main()
