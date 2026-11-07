import { digitizationLabel } from "../lib/labels.js";

// Four categorical states, each with its own icon shape, so the meaning never
// depends on colour alone and nothing implies a percentage.
export default function DigitizationBadge({ status }) {
  const known = ["digitized", "partially_digitized", "not_digitized"].includes(status);
  const key = known ? status : "unknown";
  return (
    <span className={`dig dig-${key}`}>
      <span className="dig-icon" aria-hidden="true" />
      {digitizationLabel(key)}
    </span>
  );
}
