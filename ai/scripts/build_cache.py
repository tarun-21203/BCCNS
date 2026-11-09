"""Run the planned demo questions through the LIVE pipeline and save the real outputs.

    python scripts/build_cache.py                  # uses scripts/demo_questions.json
    python scripts/build_cache.py "Another question"

The saved answers are served when THREADS_AI_MODE=cache, or in auto mode if the live call fails.
Re-run this whenever the indexed records, crosswalk or prompt change.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from threads_ai.config import Settings  # noqa: E402
from threads_ai.pipeline import Engine  # noqa: E402

HERE = Path(__file__).resolve().parent


def main() -> None:
    questions = sys.argv[1:] or json.loads((HERE / "demo_questions.json").read_text())["questions"]
    engine = Engine.from_settings(Settings(mode="live"))
    # Groq's free tier allows roughly 3 questions a minute, so space out live calls.
    pause = 25.0 if engine.settings.provider == "groq" else 0.0
    failed = []
    for i, q in enumerate(questions):
        out = engine.ask(q)
        if out["status"] == "records_only":
            failed.append(q)
            print(f"SKIP (model unavailable)  {q}: {out.get('message')}")
            continue
        engine.cache.put(q, None, out)
        print(f"saved [{out['status']}]  {q}")
        if out.get("served_from") == "live" and pause and i < len(questions) - 1:
            time.sleep(pause)
    engine.cache.save()
    print(f"\nCache written to {engine.cache.path}")
    if failed:
        sys.exit(f"{len(failed)} question(s) not cached. Check GROQ_API_KEY and network, then re-run.")


if __name__ == "__main__":
    main()
