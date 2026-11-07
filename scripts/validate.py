"""Validate data/sample/records.json against the record schema.

Checks required fields, digitization_status and access_info_level
values, resource_type values, source_id against mappings/, field_mapping
paths, and that every record has an original_url. Also checks that the
community counts in data/sample/communities.json match the dataset and
that data/crosswalk.json is present and labelled as a draft.
"""

import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = BASE_DIR / "data" / "schema" / "record.schema.json"
RECORDS_PATH = BASE_DIR / "data" / "sample" / "records.json"
COMMUNITIES_PATH = BASE_DIR / "data" / "sample" / "communities.json"
CROSSWALK_PATH = BASE_DIR / "data" / "crosswalk.json"
MAPPINGS_DIR = BASE_DIR / "mappings"

errors = []


def main():
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    records = json.loads(RECORDS_PATH.read_text(encoding="utf-8"))
    required = schema["required"]
    digitization_statuses = set(schema["properties"]["digitization_status"]["enum"])
    access_info_levels = set(schema["properties"]["access_info_level"]["enum"])
    resource_types = set(schema["properties"]["resource_type"]["enum"])
    mapping_ids = {path.stem for path in MAPPINGS_DIR.glob("*.json")}

    seen_ids = set()
    for record in records:
        for field in required:
            if field not in record or record[field] in (None, ""):
                errors.append(f"{record.get('id', '?')}: missing {field}")
        if record["id"] in seen_ids:
            errors.append(f"{record['id']}: duplicate id")
        seen_ids.add(record["id"])
        if record["digitization_status"] not in digitization_statuses:
            errors.append(
                f"{record['id']}: unknown digitization_status {record['digitization_status']}"
            )
        if record.get("access_info_level") not in access_info_levels:
            errors.append(f"{record['id']}: unknown access_info_level {record.get('access_info_level')}")
        if record["resource_type"] not in resource_types:
            errors.append(f"{record['id']}: unknown resource_type {record['resource_type']}")
        if record["source_id"] not in mapping_ids:
            errors.append(f"{record['id']}: unknown source_id {record['source_id']}")
        if not (BASE_DIR / record.get("field_mapping", "")).exists():
            errors.append(f"{record['id']}: field_mapping file not found: {record.get('field_mapping')}")
        if not str(record.get("original_url", "")).startswith("http"):
            errors.append(f"{record['id']}: original_url is not a URL")

    communities = json.loads(COMMUNITIES_PATH.read_text(encoding="utf-8"))
    for community in communities:
        name = community["name"]
        indexed = [r for r in records if name in r.get("communities", [])]
        digitized = [r for r in indexed if r["digitization_status"] == "digitized"]
        if community["indexed_count"] != len(indexed):
            errors.append(
                f"Community {name}: indexed_count is {community['indexed_count']}, dataset has {len(indexed)}"
            )
        if community["digitized_count"] != len(digitized):
            errors.append(
                f"Community {name}: digitized_count is {community['digitized_count']}, dataset has {len(digitized)}"
            )

    crosswalk = json.loads(CROSSWALK_PATH.read_text(encoding="utf-8"))
    if crosswalk.get("status") != "draft for community review":
        errors.append("Crosswalk is not labelled as a draft for community review")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print(f"OK: {len(records)} records, {len(communities)} communities")


if __name__ == "__main__":
    main()
