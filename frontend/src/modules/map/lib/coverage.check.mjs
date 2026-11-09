// Sanity checks for the Silence Map coverage builder against the sample data.
// Run from the repo root: node frontend/src/modules/map/lib/coverage.check.mjs
import fs from "node:fs";
const c = await import(new URL("./coverage.js", import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const records = read(process.argv[2] || "data/sample/records.json");
const communities = read(process.argv[3] || "data/sample/communities.json");
const assert = (ok, m) => { if (!ok) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok  ", m); };

const cov = c.buildCoverage(communities, records);
for (const r of cov.rows) {
  console.log(`${r.name.padEnd(16)} ${String(r.count).padStart(2)}  ${r.status.padEnd(8)}`, JSON.stringify(r.byStatus), Object.keys(r.byInstitution).join(", "));
}

assert(cov.rows.length === communities.length, "one row per community");
assert(cov.rows.every((r) => Object.values(r.byStatus).reduce((a, b) => a + b, 0) === r.count), "digitization split sums to count");
assert(cov.rows.every((r) => Object.values(r.byInstitution).reduce((a, b) => a + b, 0) === r.count), "institution split sums to count");
assert(cov.rows.every((r) => r.records.every((x) => x.original_url && x.source_institution)), "every counted record has URL + institution");
// Precomputed counts in communities.json should agree with the records (warn if stale).
for (const r of cov.rows) {
  const src = communities.find((x) => x.name === r.name);
  if (src.indexed_count !== undefined && src.indexed_count !== r.count)
    console.warn(`warn  communities.json indexed_count for ${r.name} is ${src.indexed_count}, records give ${r.count}`);
}

// Unreviewed derived community values must not count.
const test = JSON.parse(JSON.stringify(records.slice(0, 1)));
test[0].derived_fields = { communities: { method: "llm_extracted", reviewed: false } };
const cov2 = c.buildCoverage([{ name: test[0].communities[0] }], test);
assert(cov2.rows[0].count === 0 && cov2.excluded.length === 1, "unreviewed derived communities excluded");

// Zero matches => limited, never "absent".
const cov3 = c.buildCoverage([{ name: "Nowhere Test" }], records);
assert(cov3.rows[0].status === "limited" && cov3.rows[0].count === 0, "zero indexed records labelled limited coverage");
assert(!Object.values(c.COVERAGE_LABELS).some((l) => /absent|undocumented|no history/i.test(l.label)), "no label implies historical absence");
