// Plain-language labels for raw schema values. Wording follows
// "BCCNS context .md": never guess, and never present institution-level
// policy as a record-specific fact.

export const DIGITIZATION_LABELS = {
  digitized: "Digitized",
  partially_digitized: "Partially digitized",
  not_digitized: "Not digitized",
  unknown: "Digitization status not available",
};

export const ACCESS_LEVEL_LABELS = {
  record: "Stated in the source record",
  institution: "General access policy for this institution — not specific to this record",
  unknown: "Access information not available in the indexed record",
};

export const RESOURCE_TYPE_LABELS = {
  document: "Document",
  letter: "Letter",
  register: "Register",
  photograph: "Photograph",
  audio: "Audio",
  exhibit: "Exhibit",
  collection: "Collection",
  book: "Book",
  newspaper: "Newspaper",
  map: "Map",
  other: "Other",
};

export const NOT_PROVIDED = "Not provided in the indexed record";

const label = (table, value, fallback) => table[value] || fallback;

export const digitizationLabel = (v) => label(DIGITIZATION_LABELS, v, DIGITIZATION_LABELS.unknown);
export const accessLevelLabel = (v) => label(ACCESS_LEVEL_LABELS, v, ACCESS_LEVEL_LABELS.unknown);
export const resourceTypeLabel = (v) => label(RESOURCE_TYPE_LABELS, v, v || "Other");

// A field counts as "added by THREADS" when the record lists it in
// derived_fields; absent means it came straight from the source.
export function isDerived(record, field) {
  return Boolean(record.derived_fields && record.derived_fields[field]);
}

// Short badge text for the Access Card's access block.
export const ACCESS_BADGES = {
  record: "From the record",
  institution: "General policy · not specific to this record",
  unknown: "Not stated",
};
export const accessBadge = (v) => ACCESS_BADGES[v] || ACCESS_BADGES.unknown;

export const NO_ACCESS_INFO = "Access information not available in the indexed record.";
