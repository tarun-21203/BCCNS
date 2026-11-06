# Ingestion

## Adding a source

1. Collect the source metadata as a CSV file. One row per record.
   Use the columns in `scripts/sample_input.csv` as the starting point.
   Keep the source's own wording in the CSV; do not rewrite titles or
   catalogue terms.
2. Write a mapping file for the source at `mappings/<source_id>.json`
   (see the `mappings/` directory for the format). Adding an institution
   means adding a mapping file, not changing the normalizer. The
   mapping file records the institution, its website, how the sample
   was harvested, and which native field maps to each common field.
3. Run the normalizer:

   ```sh
   python3 scripts/normalize.py --input <source.csv> --output data/sample/records.json --source-id <source_id>
   ```

   The normalizer appends to the existing dataset and assigns the next
   available internal `id`. It does not overwrite existing records.
   It sets `source_institution` and `field_mapping` from the mapping
   file and records `harvested_at`.
4. Run validation:

   ```sh
   python3 scripts/validate.py
   ```

5. Review the new records before they are published: check the title,
   `source_institution`, `original_id`, `original_url`, and
   `digitization_status` for every row. A record with no working link
   to the source must not be published.

## Rules

- Store metadata and links only. Do not upload archival files.
- Preserve the source identifier and URL. If either is missing, record
  `original_id` as the collection name and `digitization_status` as
  `unknown` until it can be confirmed.
- Do not invent dates, names, or identifiers. Use `null` and set
  `date_approximate` to `true` where the source does not state a value.
- Keep historical catalogue terms in `original_terms`. Do not use them
  as display labels.
- Access information that describes an institution's general policy is
  labelled `access_info_level: institution`, never as record-specific.
- Values added by the team (such as community or place labels) are
  recorded in `derived_fields` with the method and reviewer, so they
  can be checked before they are used in coverage or relationship views.
- The terminology crosswalk (`data/crosswalk.json`) is a draft for
  community review, not an authoritative vocabulary.
