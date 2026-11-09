// Plain-language labels for provenance values. Where a value is not one we
// know, the raw value is shown rather than guessing a friendlier wording.

export const HARVEST_LABELS = {
  manual_catalogue_sample: "Hand-collected from public catalogue pages",
  csv_export: "CSV export from the institution",
  api: "Institution API",
  oai_pmh: "OAI-PMH harvest",
};

export const METHOD_LABELS = {
  curated: "Curated by the project team",
  llm_extracted: "Extracted by a language model",
  rule_based: "Added by a rule",
};

export const FIELD_LABELS = {
  title: "Title",
  description: "Description",
  original_id: "Original ID",
  original_url: "Original URL",
  date_display: "Date",
  people: "People",
  places: "Places",
  communities: "Communities",
  subjects: "Subjects",
  resource_type: "Resource type",
  digitization_status: "Digitization status",
  access_information: "Access information",
};

export const harvestLabel = (v) => HARVEST_LABELS[v] || v || "Not recorded";
export const methodLabel = (v) => METHOD_LABELS[v] || v || "Method not recorded";
export const fieldLabel = (v) => FIELD_LABELS[v] || v;

export function formatHarvested(iso) {
  if (!iso) return "Not recorded";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}, ${d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
}
