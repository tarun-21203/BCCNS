// Same wording as the search module's labels, so Access Card language stays consistent.
// Never guess, and never present institution-level policy as a record-specific fact.

const DIGITIZATION = {
  digitized: "Digitized",
  partially_digitized: "Partially digitized",
  not_digitized: "Not digitized",
  unknown: "Digitization status not available",
};

const ACCESS_LEVEL = {
  record: "Stated in the source record",
  institution: "General access policy for this institution — not specific to this record",
  unknown: "Access information not available in the indexed record",
};

export const digitizationLabel = (v) => DIGITIZATION[v] || DIGITIZATION.unknown;
export const accessLevelLabel = (v) => ACCESS_LEVEL[v] || ACCESS_LEVEL.unknown;

const CHIP_KIND = {
  date: "Date",
  resource_type: "Type",
  institution: "Institution",
  community: "Community",
  place: "Place",
  person: "Person",
  subject: "Subject",
};
export const chipKindLabel = (k) => CHIP_KIND[k] || k;

// Number citations by record, in order of first appearance across all claims.
export function numberCitations(claims) {
  const order = new Map();
  for (const claim of claims) {
    for (const c of claim.citations) {
      if (!order.has(c.record_id)) order.set(c.record_id, { n: order.size + 1, citation: c, quotes: [] });
      const entry = order.get(c.record_id);
      if (!entry.quotes.includes(c.quote)) entry.quotes.push(c.quote);
    }
  }
  return order;
}
