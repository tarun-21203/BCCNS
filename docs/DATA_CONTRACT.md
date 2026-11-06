# Data contract

## Purpose

This repository holds the data foundation for a discovery platform for
the Black Cultural Centre for Nova Scotia. The platform indexes
metadata from other institutions and links to their authoritative
records. It does not copy or republish archival files.

## Record model

Every searchable item is a `Record` (see
`data/schema/record.schema.json`). The required fields are:

| Field | Meaning |
| --- | --- |
| `id` | Stable internal identifier, e.g. `bccns-001`. |
| `title` | Title as given by the source. |
| `source_id` | Identifier of the per-source mapping file, e.g. `ns_archives`. |
| `source_institution` | Institution holding the original record. |
| `original_id` | Identifier used by the source, or the collection name where no identifier is published. |
| `original_url` | Link to the authoritative record or collection page. |
| `digitization_status` | `digitized`, `not_digitized`, `partially_digitized`, or `unknown`. |
| `resource_type` | `document`, `letter`, `register`, `photograph`, `audio`, `exhibit`, `collection`, `book`, `newspaper`, `map`, or `other`. |

Dates are stored as `date_display` (the source's own wording, e.g.
`c. 1783-1784`), `start_date` / `end_date` (years, where known), and
`date_approximate` (true where the date is approximate or a range).
Where a date is not known, the year fields are `null` and
`date_approximate` is `true`. Do not invent exact dates.

## Provenance

Provenance is part of the record, not an annotation added later. Every
record carries:

- `source_id`
- `source_institution`
- `original_id`
- `original_url`
- `harvested_at`
- `field_mapping` — path to the per-source mapping file, e.g.
  `mappings/ns_archives.json`

`field_mapping` records how the source's original fields map to the
common fields. The mapping itself lives in the mapping file, not on
every record.

Only metadata and links are stored. Original files are not copied into
this repository.

## Per-source mapping files

Each source has one mapping file in `mappings/`, for example
`mappings/ns_archives.json`. It records the source institution,
institution URL, harvest method, licence or terms URL, institution-level
access information, and the field mapping from native field names to
common fields. The ingestion script reads the mapping file; it contains
no source-specific code. Adding a new institution means writing a new
mapping file, not new code.

## Access information

`access_information` is source-derived. Where the source does not
provide access details, use an explicit unknown value and link to the
institution.

`access_info_level` records which level applies:

- `record` — stated in the record itself.
- `institution` — general policy from the mapping file, labelled in the
  UI as general policy for that institution, never as a record-specific
  fact.
- `unknown` — not provided.

Do not guess access rules.

## Derived fields

If people, places, or communities were extracted or curated by the team
rather than supplied by the source, they are listed in
`derived_fields`, with the method (`curated`, `llm_extracted`,
`rule_based`), who produced them, and whether a person reviewed them.
A field absent from `derived_fields` is assumed to come directly from
the source. Only reviewed derived values should drive the coverage map
and Thread View.

`search_terms` holds query synonyms or terminology expansions. It must
not overwrite `original_terms`, which preserves the catalogue language.

## Search

Records are searchable and filterable by:

- free text (title, description, people, places, communities, subjects)
- people
- places
- communities
- subjects
- institutions
- resource type
- date range (`from_year`, `to_year`)

See `GET /records` in `backend/app/main.py` for the implemented
parameters. Filters combine with AND. A query that matches no record
returns an empty list, not a generated answer.

## Coverage

Counts shown anywhere in the platform are counts of indexed records
only. A low count for a community or topic means limited coverage in
the indexed sources. It does not mean that no historical records exist.

Use the labels in the platform, not looser wording:

- Found in indexed sources
- Limited indexed coverage
- Not yet indexed / known collection
- Unknown

`data/sample/communities.json` lists the communities used in the
sample dataset. Community names are taken from the Government of Nova
Scotia dataset "African Nova Scotian Family Names by Region"
(https://data.novascotia.ca/datasets/kbzq-tfz7), which lists 48+
traditional African Nova Scotian communities. Coordinates in the file
are marked as approximate where they are. Counts in that file are
derived from `data/sample/records.json` and must be regenerated if the
dataset changes.

## Terminology

`data/crosswalk.json` maps current terms to terms used in source
catalogues, including historical document titles, with a short note per
mapping explaining why it exists. It is labelled in the file as a draft
for community review; it is not an authoritative community-approved
vocabulary. Historical terms are retained in `original_terms` on the
record for matching. They are not used as display labels.

## Adding a source

See `docs/INGESTION.md`.
