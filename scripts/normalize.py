"""Normalize a source CSV into the record format in data/schema/record.schema.json.

Usage:
    python3 scripts/normalize.py --input <source.csv> --output data/sample/records.json --source-id <source_id>

The source_id must have a mapping file in mappings/<source_id>.json.
The input CSV must contain at least: title, original_id, original_url,
digitization_status, resource_type. Optional columns: description,
people, places, communities, subjects, date_display, start_date,
end_date, date_approximate, access_information, access_info_level,
original_terms, search_terms, derived_fields. List columns use ';'
as the separator. derived_fields, where given, is JSON.
"""

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

REQUIRED = ["title", "original_id", "original_url", "digitization_status", "resource_type"]
DIGITIZATION_STATUSES = {"digitized", "not_digitized", "partially_digitized", "unknown"}
ACCESS_INFO_LEVELS = {"record", "institution", "unknown"}


def _split(value):
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def _year(value):
    if not value:
        return None
    return int(value)


def normalize_row(row, mapping, next_id):
    for field in REQUIRED:
        if not row.get(field):
            raise ValueError(f"Missing required field: {field}")
    if row["digitization_status"] not in DIGITIZATION_STATUSES:
        raise ValueError(f"Unknown digitization_status: {row['digitization_status']}")
    access_info_level = row.get("access_info_level") or "unknown"
    if access_info_level not in ACCESS_INFO_LEVELS:
        raise ValueError(f"Unknown access_info_level: {access_info_level}")
    derived_fields = {}
    if row.get("derived_fields"):
        derived_fields = json.loads(row["derived_fields"])
    return {
        "id": f"bccns-{next_id:03d}",
        "title": row["title"],
        "description": row.get("description", ""),
        "people": _split(row.get("people")),
        "places": _split(row.get("places")),
        "communities": _split(row.get("communities")),
        "subjects": _split(row.get("subjects")),
        "date_display": row.get("date_display", ""),
        "start_date": _year(row.get("start_date")),
        "end_date": _year(row.get("end_date")),
        "date_approximate": row.get("date_approximate", "").lower() == "true",
        "resource_type": row["resource_type"],
        "source_id": mapping["source_id"],
        "source_institution": mapping["source_institution"],
        "original_id": row["original_id"],
        "original_url": row["original_url"],
        "digitization_status": row["digitization_status"],
        "access_information": row.get("access_information", ""),
        "access_info_level": access_info_level,
        "original_terms": _split(row.get("original_terms")),
        "search_terms": _split(row.get("search_terms")),
        "content_note": None,
        "derived_fields": derived_fields,
        "harvested_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "field_mapping": f"mappings/{mapping['source_id']}.json",
        "relationships": [],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--source-id", required=True)
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent
    mapping_path = base_dir / "mappings" / f"{args.source_id}.json"
    if not mapping_path.exists():
        raise SystemExit(f"No mapping file for source_id: {args.source_id}")
    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))

    output = Path(args.output)
    records = []
    if output.exists():
        records = json.loads(output.read_text(encoding="utf-8"))
    next_id = len(records) + 1

    with open(args.input, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            records.append(normalize_row(row, mapping, next_id))
            next_id += 1

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(records)} records to {output}")


if __name__ == "__main__":
    main()
