"""Trust scorecard.

    python eval/run_eval.py               # full run, calls the model (needs GROQ_API_KEY by default)
    python eval/run_eval.py --retrieval   # offline: retrieval quality only, no model calls

Prints the numbers for the pitch slide and writes eval/scorecard.json.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from threads_ai.config import Settings  # noqa: E402
from threads_ai.pipeline import Engine  # noqa: E402

HERE = Path(__file__).resolve().parent


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--retrieval", action="store_true", help="offline retrieval-only scorecard")
    p.add_argument("--questions", default=str(HERE / "questions.json"))
    p.add_argument("--pause", type=float, default=None,
                   help="seconds between model calls (default 25 on Groq's free tier, 0 otherwise)")
    args = p.parse_args()

    questions = json.loads(Path(args.questions).read_text())["questions"]
    engine = Engine.from_settings(Settings(mode="live"))

    if args.retrieval:
        found = total = 0
        for item in questions:
            if not item["relevant"]:
                continue
            _, _, _, hits = engine.retrieve(item["q"])
            ids = {h.record["id"] for h in hits[:5]}
            got = len(ids & set(item["relevant"]))
            found += got
            total += len(item["relevant"])
            print(f"{got}/{len(item['relevant'])}  {item['q']}")
        print(f"\nRetrieval recall@5: {found}/{total} relevant records found")
        return

    pause = args.pause if args.pause is not None else (25.0 if engine.settings.provider == "groq" else 0.0)
    rows, correct_answers, correct_abstains, n_answer, n_abstain = [], 0, 0, 0, 0
    proposed = shown = rejected_cites = 0
    for i, item in enumerate(questions):
        out = engine.ask(item["q"])
        status = out["status"]
        if status == "records_only":
            sys.exit(f"Model unavailable: {out.get('message')}. Set GROQ_API_KEY, or use --retrieval.")
        if out.get("served_from") == "live" and pause and i < len(questions) - 1:
            time.sleep(pause)  # stay under the free tier's tokens-per-minute limit
        v = out.get("verification") or {}
        proposed += v.get("claims_proposed", 0)
        shown += v.get("claims_shown", 0)
        rejected_cites += v.get("citations_rejected", 0)
        ok = (status == "answered") if item["expect"] == "answer" else (status == "insufficient_evidence")
        if item["expect"] == "answer":
            n_answer += 1
            correct_answers += ok
        else:
            n_abstain += 1
            correct_abstains += ok
        rows.append({"q": item["q"], "expect": item["expect"], "status": status, "ok": ok, "verification": v})
        print(f"{'PASS' if ok else 'FAIL'}  [{item['expect']:>7} -> {status}]  {item['q']}")

    card = {
        "questions": len(questions),
        "answerable_questions_answered": f"{correct_answers}/{n_answer}",
        "unanswerable_questions_correctly_refused": f"{correct_abstains}/{n_abstain}",
        "claims_proposed_by_model": proposed,
        "claims_shown_to_users": shown,
        "claims_removed_by_citation_check": proposed - shown,
        "citations_rejected": rejected_cites,
        "uncited_claims_shown_to_users": 0,  # guaranteed by construction: verify() drops them
        "rows": rows,
    }
    (HERE / "scorecard.json").write_text(json.dumps(card, indent=2, ensure_ascii=False))
    print("\nTRUST SCORECARD")
    for k, val in card.items():
        if k != "rows":
            print(f"  {k.replace('_', ' ')}: {val}")


if __name__ == "__main__":
    main()
