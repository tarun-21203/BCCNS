# Data contract

## Purpose

This repository holds the data foundation for a discovery platform for the
Black Cultural Centre for Nova Scotia. The platform indexes metadata from
other institutions and links to their authoritative records. It does not
copy or republish archival files.

## Record model

Every searchable item is a `Record` (see `data/schema/record.schema.json`).
The required fields are:

| Field | Meaning |
| --- | --- |
| `id` | Stable internal identifier, e.g. `bccns-001`. |
| `title` | Title as given by the source. |
| `institution` | Institution holding the original record. |
| `original_id` | Identifier used by the source, or the collection name where no identifier is published. |
| `original_url` | Link to the authoritative record or collection page. |
| `access_status` | `digitized`, `partially_digitized`, `on_site`, `request_required`, or `unknown`. |
| `resource_type` | `document`, `letter`, `register`, `photograph`, `audio`, `exhibit`, `collection`, `book`, `newspaper`, `map`, or `other`. |

Optional fields cover people, places, communities, subjects, dates,
language, rights, and access instructions. Dates are stored as
`date_start` / `date_end` (years, where known) plus `date_label` for the
form shown by the source, e.g. `c. 1783-1784`. Where a date is not known,
the year fields are `null` and `uncertain` is `true`.

## Provenance

Provenance is part of the record, not an annotation added later. Every
record carries:

- `institution`
- `original_id`
- `original_url`
- `harvested_at`
- `field_mapping`

`field_mapping` records which source field supplied each normalized field.
Search results must display the institution, the access status, and the
link to the original record.

Only metadata and links are stored. Original files are not copied into
this repository.

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

See `GET /api/records` in `backend/app/main.py` for the implemented
parameters. Filters combine with AND. A query that matches no record
returns an empty list, not a generated answer.

## Coverage

Counts shown anywhere in the platform are counts of indexed records only.
A low count for a community or topic means limited coverage in the indexed
sources. It does not mean that no historical records exist.

`data/sample/communities.json` lists the communities used in the sample
dataset, with coordinates marked as approximate where they are. Counts in
that file are derived from `data/sample/records.json` and must be
regenerated if the dataset changes.

## Terminology

`data/sample/terminology.json` maps current terms to terms used in source
catalogues, including historical document titles. Historical terms are
retained in `original_terms` on the record for matching. They are not used
as display labels.

## Adding a source

See `docs/INGESTION.md`.
