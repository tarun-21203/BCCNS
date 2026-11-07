// Sanity checks for the Thread View graph builder against the sample data.
// Run from the repo root: node frontend/src/modules/threads/lib/graph.check.mjs
import fs from "node:fs";
const g = await import(new URL("./graph.js", import.meta.url));
const records = JSON.parse(fs.readFileSync(process.argv[2] || "data/sample/records.json", "utf8"));
const graph = g.buildGraph(records);
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok  ", m); };
const ents = [...graph.nodes.values()].filter(n => n.type !== "record");
console.log("nodes", graph.nodes.size, "edges", graph.edges.length, "excluded", graph.excluded.length);
console.log("generic:", ents.filter(n => n.generic).map(n => n.id));
assert(graph.edges.every(e => e.evidence.original_url && e.evidence.source_institution), "every edge has evidence with URL + institution");
assert(graph.nodes.get("community:africville") && graph.nodes.get("subject:africville") && graph.nodes.get("community:africville") !== graph.nodes.get("subject:africville"), "Africville community and subject stay separate nodes");
assert(graph.nodes.get("place:nova scotia").generic, "Nova Scotia flagged generic");
assert(graph.edges.filter(e => e.field === "communities").every(e => e.provenance.origin === "derived"), "community edges marked derived");
assert(graph.edges.filter(e => e.field === "people").every(e => e.provenance.origin === "source"), "people edges marked source");
const t = g.getThread(graph, "community:africville", { hideLeaves: true });
console.log("Africville thread:", t.nodes.length, "nodes,", t.edges.length, "edges");
console.log("  ", t.nodes.map(n => n.type + ":" + n.label.slice(0, 40)).join(" | "));
assert(!t.nodes.some(n => n.generic), "generic hidden by default");
assert(t.edges.every(e => t.nodes.some(n => n.id === e.source) && t.nodes.some(n => n.id === e.target)), "thread edges reference shown nodes");
const r = g.connectedRecords(graph, "bccns-001");
console.log("bccns-001 connected:", r.map(x => x.record.id + " via " + x.via.map(v => v.entity.label).join(",")).join(" ; "));
assert(r.every(x => x.via.every(v => v.edges[0] && v.edges[1])), "each connection has both supporting edges");
// unreviewed derived values are excluded
const test = JSON.parse(JSON.stringify(records.slice(0, 2)));
test[0].derived_fields.people = { method: "llm_extracted", reviewed: false }; test[0].people = ["Someone Unreviewed"];
const g2 = g.buildGraph(test);
assert(!g2.nodes.has("person:someone unreviewed") && g2.excluded.length === 1, "unreviewed derived values excluded");
assert(g.listEntities(graph).length === ents.filter(n => !n.generic).length, "listEntities hides generic");
