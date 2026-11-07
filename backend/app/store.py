import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
SAMPLE_DIR = DATA_DIR / "sample"


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_records():
    return load_json(SAMPLE_DIR / "records.json")


def load_communities():
    return load_json(SAMPLE_DIR / "communities.json")


def load_crosswalk():
    return load_json(DATA_DIR / "crosswalk.json")


def load_edges():
    return load_json(SAMPLE_DIR / "edges.json")


def load_mappings():
    mappings = {}
    for path in sorted((BASE_DIR / "mappings").glob("*.json")):
        mapping = load_json(path)
        mappings[mapping["source_id"]] = mapping
    return mappings
