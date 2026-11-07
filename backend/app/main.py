from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from app.store import (
    load_communities,
    load_crosswalk,
    load_mappings,
    load_records,
)

app = FastAPI(title="BCCNS Discovery API")


class AiSearchRequest(BaseModel):
    question: str
    limit: int = 5


def _matches_text(record, query):
    haystack = " ".join(
        [
            record.get("title", ""),
            record.get("description", ""),
            *record.get("people", []),
            *record.get("places", []),
            *record.get("communities", []),
            *record.get("subjects", []),
            *record.get("original_terms", []),
            *record.get("search_terms", []),
        ]
    ).lower()
    return query.lower() in haystack


def _matches_list(record, field, value):
    if value is None:
        return True
    values = [v.lower() for v in record.get(field, [])]
    return value.lower() in values


def _citation(record):
    return {
        "id": record["id"],
        "title": record["title"],
        "source_institution": record["source_institution"],
        "original_url": record["original_url"],
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/records")
def list_records(
    search: str | None = Query(default=None),
    people: str | None = Query(default=None),
    place: str | None = Query(default=None),
    community: str | None = Query(default=None),
    subject: str | None = Query(default=None),
    institution: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    from_year: int | None = Query(default=None),
    to_year: int | None = Query(default=None),
):
    records = load_records()
    results = []
    for record in records:
        if search and not _matches_text(record, search):
            continue
        if people and not _matches_list(record, "people", people):
            continue
        if place and not _matches_list(record, "places", place):
            continue
        if community and not _matches_list(record, "communities", community):
            continue
        if subject and not _matches_list(record, "subjects", subject):
            continue
        if institution and record.get("source_institution", "").lower() != institution.lower():
            continue
        if resource_type and record.get("resource_type") != resource_type:
            continue
        if from_year is not None and (record.get("end_date") or 0) < from_year:
            continue
        if to_year is not None and (record.get("start_date") or 9999) > to_year:
            continue
        results.append(record)
    return {"count": len(results), "results": results}


@app.get("/records/{record_id}")
def get_record(record_id: str):
    for record in load_records():
        if record["id"] == record_id:
            return record
    raise HTTPException(status_code=404, detail="Record not found")


@app.get("/entities/{entity_id}/relationships")
def entity_relationships(entity_id: str):
    """Relationships derived from the records themselves.

    Every relationship comes from entities that co-occur in a record
    (people, places, communities, subjects) or from a record's own
    relationships list. There is no separate edges file: a connection
    exists only where a record supports it, and each one cites the
    record it came from.
    """
    records = load_records()
    entity = entity_id.replace("_", " ")
    entity_lower = entity.lower()

    entity_fields = [
        ("people", "person"),
        ("places", "place"),
        ("communities", "community"),
        ("subjects", "subject"),
    ]

    def entity_type(record, name):
        if record["id"].lower() == name.lower():
            return "record"
        for field, label in entity_fields:
            if name.lower() in [v.lower() for v in record.get(field, [])]:
                return label
        return "entity"

    related_records = []
    for record in records:
        entities = (
            record.get("people", [])
            + record.get("places", [])
            + record.get("communities", [])
            + record.get("subjects", [])
            + [record["id"]]
        )
        if entity_lower in [e.lower() for e in entities]:
            related_records.append(record)
    if not related_records:
        raise HTTPException(status_code=404, detail="Entity not found")

    seen = set()
    relationships = []

    def add_relationship(from_entity, from_type, to_entity, to_type, record, relationship_type):
        key = (from_entity.lower(), to_entity.lower(), record["id"])
        if key in seen:
            return
        seen.add(key)
        relationships.append(
            {
                "from": from_entity,
                "from_type": from_type,
                "to": to_entity,
                "to_type": to_type,
                "relationship_type": relationship_type,
                "source_record_id": record["id"],
                "evidence_original_url": record["original_url"],
            }
        )

    for record in related_records:
        if record["id"].lower() == entity_lower:
            # The entity is a record: link it to every entity it contains.
            for field, label in entity_fields:
                for value in record.get(field, []):
                    add_relationship(
                        record["id"], "record", value, label, record, f"record_has_{label}"
                    )
        else:
            # The entity is a person, place, community, or subject:
            # link it to its record and to every other entity in that record.
            from_type = entity_type(record, entity)
            add_relationship(
                entity, from_type, record["id"], "record", record, "appears_in_record"
            )
            for field, label in entity_fields:
                for value in record.get(field, []):
                    if value.lower() == entity_lower:
                        continue
                    add_relationship(
                        entity, from_type, value, label, record, f"shares_{label}"
                    )
        # Source-supported relationships declared on the record itself.
        for rel in record.get("relationships", []):
            add_relationship(
                record["id"],
                "record",
                rel["target_entity"],
                "entity",
                record,
                rel["relationship_type"],
            )

    return {
        "entity": entity_id,
        "relationships": relationships,
        "records": related_records,
    }


@app.get("/coverage")
def coverage():
    communities = load_communities()
    records = load_records()
    by_institution = {}
    by_digitization = {}
    for record in records:
        by_institution[record["source_institution"]] = (
            by_institution.get(record["source_institution"], 0) + 1
        )
        by_digitization[record["digitization_status"]] = (
            by_digitization.get(record["digitization_status"], 0) + 1
        )
    return {
        "note": "Counts are for indexed sources only. Limited indexed coverage does not mean no historical records exist.",
        "total_records": len(records),
        "by_institution": by_institution,
        "by_digitization_status": by_digitization,
        "communities": communities,
    }


@app.get("/communities")
def list_communities():
    communities = load_communities()
    return {"count": len(communities), "results": communities}


@app.get("/crosswalk")
def list_crosswalk():
    crosswalk = load_crosswalk()
    return crosswalk


@app.get("/mappings")
def list_mappings():
    mappings = load_mappings()
    return {"count": len(mappings), "results": list(mappings.values())}


@app.post("/ai/search")
def ai_search(request: AiSearchRequest):
    """Retrieval only. Returns records matching the question.

    Answer generation is a separate step: it must use only the records
    returned here, with their citations, and must state that the indexed
    sources do not provide enough evidence when no records match.
    """
    records = load_records()
    words = [w for w in request.question.lower().split() if len(w) > 3]
    scored = []
    for record in records:
        haystack = " ".join(
            [
                record.get("title", ""),
                record.get("description", ""),
                *record.get("people", []),
                *record.get("places", []),
                *record.get("communities", []),
                *record.get("subjects", []),
                *record.get("original_terms", []),
                *record.get("search_terms", []),
            ]
        ).lower()
        score = sum(1 for word in words if word in haystack)
        if score:
            scored.append((score, record))
    scored.sort(key=lambda item: item[0], reverse=True)
    results = [record for _, record in scored[: request.limit]]
    if not results:
        return {
            "question": request.question,
            "sufficient_evidence": False,
            "message": "The indexed sources do not provide enough evidence to answer this question.",
            "results": [],
            "citations": [],
        }
    return {
        "question": request.question,
        "sufficient_evidence": True,
        "results": results,
        "citations": [_citation(record) for record in results],
    }
