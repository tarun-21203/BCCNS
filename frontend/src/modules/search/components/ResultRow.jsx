import { resourceTypeLabel, NOT_PROVIDED } from "../lib/labels.js";

// Placeholder result row. Task 4 replaces this with the full Access Card.
export default function ResultRow({ record }) {
  return (
    <li className="result-row">
      <h2 className="result-title">{record.title}</h2>
      <p className="result-meta">
        {record.source_institution} · {resourceTypeLabel(record.resource_type)} ·{" "}
        {record.date_display || NOT_PROVIDED}
      </p>
    </li>
  );
}
