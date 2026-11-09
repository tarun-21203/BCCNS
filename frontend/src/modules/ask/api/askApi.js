import fixtureRecords from "@data/sample/records.json";

// Calls go through the dev proxy (/api -> backend). AI answers can take a while, so the
// timeout is generous. If the API cannot be reached at all, we fall back to a simple keyword
// match over the shared data/sample/records.json and never show an AI answer.
const BASE = import.meta.env.VITE_API_BASE || "/api";
const TIMEOUT_MS = 90000;

export async function askQuestion(question, filters) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters ? { question, filters } : { question }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return { ...(await res.json()), offline: false };
  } catch {
    return offlineAnswer(question);
  } finally {
    clearTimeout(timer);
  }
}

const STOP = new Set(
  "a an and are as at be by did do does for from had has have how in is it of on or the their there this to was were what when where which who why with any about records record".split(" ")
);

function offlineAnswer(question) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const scored = fixtureRecords
    .map((record) => {
      const hay = [record.title, record.description, ...(record.places || []), ...(record.communities || []),
        ...(record.subjects || []), ...(record.people || [])].join(" ").toLowerCase();
      return { record, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((h) => ({ ...h, matched_terms: [], found_via_bridge: false, content_note: h.record.content_note }));

  return {
    question,
    status: "records_only",
    answer: null,
    message: "The AI service could not be reached, so no answer was generated. These are keyword matches from a copy of the sample records.",
    records: scored,
    understood: { chips: [] },
    language_bridge: { matched: [] },
    disclaimer:
      "Answers use only the catalogue records in the sources indexed by this prototype. Few or no results do not mean that no records exist.",
    served_from: "offline",
    offline: true,
  };
}
