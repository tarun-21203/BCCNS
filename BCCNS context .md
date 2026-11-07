# BCCNS Hackathon --- Project Context

> **Purpose of this file:** Give Claude Code and all five team members
> one shared source of truth for the problem, product scope,
> requirements, data model, judging criteria, work ownership,
> dependencies, and demo expectations.
>
> **Project working title:** THREADS --- Black History Discovery &
> Connection Hub\
> **Client / challenge owner:** Black Cultural Centre for Nova Scotia
> (BCCNS)\
> **Hackathon constraint:** 2 days, 5 team members\
> **Build approach:** Use LLM-assisted development where useful, but
> keep the implementation small, verifiable, and demo-ready.
>
> **Revision 2 (Nov 5) --- what changed:** sample-source selection is now
> an explicit kickoff gate with candidate sources (Section 15);
> institution-level access fallback for Access Cards; per-field
> source-vs-derived provenance; date display fields; per-source mapping
> files promoted to P0; Silence Map sampling and on-map disclaimer
> rules; Thread View built from shared normalized entities; workload
> rebalanced (crosswalk → Member 4, entity enrichment → Member 3);
> kickoff stack decision; cached AI fallback for demo resilience.

------------------------------------------------------------------------

## 1. The problem we are solving

### Problem statement

Black history resources in Canada are spread across museums, archives,
libraries, universities, governments, community organizations, digital
repositories, and private collections. These sources use different
catalogues, metadata structures, terminology, and access rules.

As a result, someone researching Black history may need to know which
institution to search before they even begin. They may not know:

-   What resources exist.
-   Which institution holds a resource.
-   Whether it has been digitized.
-   How to access it.
-   How records held by different institutions relate to one another.

BCCNS wants to provide a trusted national discovery point that makes
this distributed landscape easier to navigate **without moving or
duplicating every collection**.

### The gap

There is no simple, trusted discovery layer connecting Black history
resources across institutions while preserving the ownership and
authority of the original source.

Metadata is inconsistent. Some collections are only partly digitized.
Useful information can be buried in finding aids, PDFs, websites,
spreadsheets, or local databases. Manually aggregating everything would
be difficult for a small organization to maintain.

### Desired outcome

Build a scalable proof of concept that can ingest or reference metadata
from multiple sample sources, normalize it into a common structure, and
allow users to search by:

-   People
-   Places
-   Communities
-   Subjects
-   Dates
-   Institutions
-   Resource type

Each result must identify the source institution, explain where and how
the resource can be accessed, link to the authoritative record, and
preserve provenance.

Any AI-assisted search must be grounded in source records and must not
invent information.

### Proof-of-concept focus from the challenge

Demonstrate a searchable experience using **at least two or three sample
data sources**. The prototype may include a common metadata model,
search and filtering, source links, institution or location views,
relationship mapping, and/or grounded natural-language search.

The platform should **index or reference third-party resources rather
than copy complete collections**.

------------------------------------------------------------------------

## 2. Our proposed solution

### One-line description

**THREADS is a trusted discovery layer that helps people find Black
history resources across institutions, understand how records connect,
see the coverage of the sources currently indexed, and reach the
original records.**

### What the product should feel like

A person should be able to search for a Black community, person, place,
event, or topic without first knowing which archive owns the relevant
material. The platform should surface relevant records from multiple
institutions, explain the access route, show the source and provenance,
and help the user explore related material.

### Main user journey

1.  **Search:** The user searches by keyword, person, place, community,
    date, subject, institution, resource type, or a natural-language
    question.
2.  **Discover:** The platform searches a normalized index of records
    from multiple sample sources. Language Bridge can expand the query
    to relevant historical terms or spelling variants.
3.  **Verify:** The user sees the institution, original record link,
    access details, and provenance. AI-generated explanations are tied
    to source records.
4.  **Explore coverage:** The Silence Map shows what is represented in
    the sources indexed for the prototype and where the indexed coverage
    is limited.
5.  **Connect:** Thread View reveals a small number of documented
    relationships between records, people, places, communities, and
    events.
6.  **Access:** The user follows the authoritative link or uses the
    access information to contact or visit the holding institution.

The journey is a product narrative, not a requirement to build every
step as a separate complex workflow.

------------------------------------------------------------------------

## 3. Non-negotiable product and data principles

These principles come directly from the challenge requirements and the
gaps identified during our planning.

### 3.1 Reference records; do not copy archival collections

-   Store normalized **reference metadata** needed for discovery.
-   Store the authoritative URL or reference to the original record.
-   Do **not** download, re-host, or duplicate complete archival files
    or collections.
-   Do not imply that BCCNS owns the material.
-   The source institution remains the authority for the original record
    and its access conditions.
-   If a sample source explicitly permits use of a thumbnail or preview,
    confirm that permission before using it. The safe default is to
    display metadata and link to the source.

### 3.2 Preserve provenance

Every normalized record must retain enough information to trace it back
to the original source and explain how it entered our index.

At minimum, preserve these fields:

  -----------------------------------------------------------------------
  Field                               Meaning
  ----------------------------------- -----------------------------------
  `source_institution`                Institution that holds, maintains,
                                      or provides the source record

  `original_id`                       Identifier assigned by the original
                                      institution

  `original_url`                      Link to the authoritative original
                                      record

  `harvested_at`                      Date/time when our system retrieved
                                      or imported the metadata

  `field_mapping`                     Mapping between source-specific
                                      field names and our common metadata
                                      fields
  -----------------------------------------------------------------------

These provenance details should be visible on the Access Card or in an
immediately accessible provenance/details view. Do not hide the source
institution or original link behind the AI answer.

### 3.3 Ground AI in retrieved records

-   AI must only make claims supported by records retrieved from our
    indexed sources.
-   Include source links or record references alongside the claims they
    support.
-   If the retrieved records do not answer the question, say that the
    indexed sources do not provide enough evidence.
-   Never invent people, dates, events, relationships, collection
    details, or access instructions.
-   Clearly distinguish a source's original wording from our explanatory
    summary.
-   Historical or outdated terminology may be shown when needed to
    locate a record, but preserve the original catalogue wording and
    provide respectful context. Do not silently rewrite the historical
    record.

### 3.4 Be honest about coverage

A search returning few or no results does **not** prove that no
historical records exist.

Use precise labels such as: - **Found in indexed sources:** Records
available in the sample sources currently included in our prototype. -
**Limited indexed coverage:** Few or no matching records were found in
the sources currently indexed. - **Not yet indexed / known collection:**
A collection or finding aid is known to the project but has not yet been
processed, if we have evidence for that. - **Unknown:** We do not have
enough information to make a claim.

Never label a community as undocumented or historically absent merely
because our sample index has few records.

### 3.5 Respect original terminology and communities

-   Preserve source titles, descriptions, and original catalogue terms.
-   Add modern search synonyms or historical-term mappings as separate
    search metadata.
-   Add a contextual note when a historical term is outdated or harmful.
-   Do not present an automatically generated terminology mapping as an
    authoritative community-approved vocabulary.
-   Avoid inferring identity or merging people based only on similar
    names.

------------------------------------------------------------------------

## 4. Final feature list and scope

The priorities below reflect both the challenge requirements and the
need to finish a credible two-day prototype.

### P0 --- Must-have

#### Feature 1: Unified Discovery & Search

**What it means:** Bring records from at least two, ideally three,
sample institutions into one searchable experience. Each institution may
use different column names and metadata formats. We map those formats
into one common structure.

**Required functionality:** - Ingest or reference sample metadata from
2--3 sources. - Normalize records into the shared schema. - Search
across all indexed records. - Filter by available fields such as people,
places, communities, dates, subjects, institutions, and resource type. -
Preserve the original source identifier and authoritative URL. - Make it
clear which institutions and sample sources are included.

**Per-source mapping files (P0, cheap, and our scalability proof):**
Each source gets one small declarative mapping file (for example
`mappings/dal_archives.json`) that maps its native field names to our
common fields and records institution-level facts (name, website,
reading-room/access policy URL). The ingestion script reads the mapping
file; it does not contain source-specific logic. Adding a new
institution should mean writing a new mapping file, not new code.

**Two-day scope:** Use a small, credible sample of records from each
source (roughly 30--80 records per source is enough). Hand-collected
metadata from public catalogue pages is acceptable as long as every
record keeps its real `original_url` and `original_id`. A robust
national ingestion pipeline is not required for the hackathon.

**Sampling rule:** Deliberately select sample records that overlap on
the 4--6 communities and topics used in the demo, so search, the
Silence Map, and Thread View all have something meaningful to show.
State this sampling choice openly; it is a demo sample, not a
measure of what exists.

#### Feature 2: Access Cards + Provenance

**What it means:** A search result must do more than show a title. It
should tell the user where the original material is held and how to
reach it.

Every result card should show, when the source provides the
information: - Resource title and short description. - Source
institution. - Resource type. - Relevant people, places, dates,
communities, and subjects. - Digitization status. - Plain-language
access information (online, on-site, appointment/request required,
restricted, or unknown). - Link to the authoritative original record. -
Original record ID. - Provenance details, including when the metadata
was harvested and how source fields were mapped.

**Important:** Do not guess access rules. If the source does not say,
show "Access information not available in the indexed record" and link
to the institution.

**Institution-level access fallback:** Most catalogue records do not
state record-specific access rules or digitization status. To avoid a
wall of "unknown" cards, each source's mapping file may carry
institution-level access information taken from the institution's own
website (how to visit the reading room, how to request copies, contact
link). Show it with an explicit label, for example *"General access
policy for [Institution] --- not specific to this record"*, and record
which level applies in `access_info_level` (`record`, `institution`, or
`unknown`). Never present institution-level policy as a record-specific
fact.

**Source vs. derived fields:** If people, places, or communities were
extracted or curated by our team rather than supplied by the source,
the card must show that distinction (for example a small "added by
THREADS" marker with the method on hover).

**Two-day scope:** A clear result card and a simple expandable "Record
provenance" section are enough. This is a core requirement, not an
optional enhancement.

#### Feature 3: Language Bridge + Cite or Stay Silent AI

**What it means:** Users may not know the exact words used in older
catalogues. A modern search such as "Black community history" should be
able to find relevant records even when the original catalogue uses
older terms or spelling variants.

**Language Bridge:** - Expand a query using a small, curated set of
relevant synonyms, historical terms, and spelling variants. - Keep the
original query visible. - Preserve the original source terminology on
the record. - Add a respectful contextual note where needed. - Do not
pretend the crosswalk is a complete or authoritative vocabulary. -
Label the crosswalk in the UI and in code as a **draft for community
review**; in a real rollout BCCNS and community members would validate
it. - Store it as a small standalone file (for example
`data/crosswalk.json`) with a short note per mapping explaining why it
exists, so it can be reviewed and edited without touching code.

**Cite or Stay Silent AI:** - Accept a natural-language question. -
Retrieve relevant records from the normalized index. - Generate a
concise answer based only on those records. - Provide clickable source
record links for supporting claims. - If the evidence is insufficient,
explicitly say so and suggest following the source links or contacting
the holding institution.

**Two-day scope:** A small retrieval-based assistant over the sample
records is sufficient. Avoid a general-purpose chatbot that answers from
unverified model knowledge.

**Demo resilience:** The live AI depends on an API key, the network,
and response latency. Pre-run the planned demo questions (including at
least one question the index cannot answer, to show abstention) and
store the responses with the record IDs they cited. Provide a config
flag that serves these cached responses if the live call fails or is
too slow. Cached responses must be real outputs from our pipeline over
our index, never hand-written.

### P1 --- High-value differentiators

#### Feature 4: Silence Map --- Archive Coverage Intelligence

**What it means:** A map or dashboard showing what the prototype's
indexed sources currently contain for selected Black communities and
topics, including record counts and digitization information where
available.

**Possible display:** - Selected historical Black communities and
locations. - Number of matching records in the indexed sample sources. -
Digitized / non-digitized / unknown counts, only when supported by
source data. - Institutions represented in the indexed results. - A
clear indication of limited indexed coverage. - A short explanation of
what the map does and does not measure.

**Why it matters:** It can help BCCNS identify discovery gaps,
prioritize further indexing, and support conversations about
digitization, partnerships, or funding.

**Accuracy rule:** The map represents the coverage of the sources
indexed in this prototype. It must never imply that low counts mean a
community has little or no history or that no records exist elsewhere.

**Two-day scope:** A small number of selected communities and a simple
interactive map or map-like visualization with seeded/sample data
clearly labelled where appropriate. Use real record counts from the
prototype index whenever possible.

**Making it read correctly with a small index:** With a sample of a
few hundred records, raw totals will be tiny and can look like a bug
or imply absence. Therefore:

-   Choose demo communities that the sample records actually touch (see
    the sampling rule in Feature 1).
-   Lead with the *shape* of coverage rather than totals: which
    institutions hold records for a community, and the digitized /
    not digitized / unknown split.
-   Place the "this measures our current index, not history" note
    directly on the map view, visible without clicking, not in a
    footnote.
-   Take community names and locations from a verifiable source (for
    example the Government of Nova Scotia open dataset listing
    traditional African Nova Scotian communities; see Section 15) and
    cite it in the map legend.

#### Feature 5: Small Thread View --- Historical Relationships

**What it means:** Show how a few records connect through documented
people, places, communities, organizations, or events.

**Possible interactions:** - Select a community or person. - Display a
small set of related records and entities. - Click a relationship to see
the record that supports it. - Navigate from an entity to the original
institutional records.

**Accuracy rule:** Every displayed relationship must be supported by a
source record. Do not infer that two people are the same person just
because their names look similar.

**Two-day scope:** A small, curated relationship graph or
connected-record view is enough. Do not attempt a large, automatically
generated national knowledge graph.

**Recommended construction:** Build the graph as records linked through
shared normalized entities --- record → place/community/subject/
organization → other records --- rather than direct record-to-record
claims. A connection then means "both records are described with this
entity", which is automatically evidenced by the records themselves
and needs no extra research. Person nodes are linked only when the
name string is supplied by the source (or curated with evidence); never
merge two people because their names are similar. Mark edges that rest
on derived (non-source) entity values differently from source-supplied
ones.

### P2 --- Stretch goals only

#### Feature 6: Research Trail

**What it means:** When a record is not digitized, has restricted
access, or requires an in-person visit, help the user plan the next
step.

Potential functionality: - Identify the holding institution and
collection. - Show the original record ID and known access
instructions. - Suggest practical questions to ask the institution. -
Generate a ready-to-edit email to the reference desk using only verified
details.

The basic access information belongs in the P0 Access Cards. The
research-planning and email-generation workflow is optional.

#### Feature 7: Finding-Aid PDF Reader

**What it means:** Process one sample finding-aid PDF and extract
candidate collection titles, people, places, dates, and subjects.

If implemented: - Keep a reference to the original PDF and page number
for each extracted item. - Show extracted information as a candidate,
not verified fact. - Require human review before adding extracted
metadata to searchable records.

#### Feature 8: Institution Spreadsheet Upload

**What it means:** Let an institution upload a spreadsheet and map its
column names (for example, `Item Name`) to our common fields (for
example, `title`).

This is a future partner-onboarding capability, not necessary for the
core demo. For the hackathon, ingestion scripts for selected sample
files are enough.

#### Feature 9: English and French Search

Start with lightweight French query support or a small French
terminology mapping if time permits. A complete bilingual interface and
fully translated metadata are future work unless the team has already
completed the core features.

#### Feature 10: Advanced Search Insights / Silence Report

A future dashboard could show frequently searched topics with
insufficient results, requested resources, or known undigitized
collections.

Do not claim to have real user analytics unless actual search logs
exist. Any seeded demonstration data must be clearly labelled as
sample/demo data.

------------------------------------------------------------------------

## 5. Shared metadata model

The backend/data owner should propose and publish one common schema
before the other modules become tightly coupled. The following is a
starting point; keep it simple and adapt only when a real sample source
requires it.

### Suggested normalized record

``` json
{
  "id": "internal-record-id",
  "title": "Title from the source record",
  "description": "Short source-based description",
  "people": [],
  "places": [],
  "communities": [],
  "subjects": [],
  "date_display": "circa 1960s",
  "start_date": "1960",
  "end_date": "1969",
  "date_approximate": true,
  "resource_type": "Photograph",
  "source_id": "dal_archives",
  "source_institution": "Institution name",
  "original_id": "SOURCE-123",
  "original_url": "https://institution.example/record/123",
  "digitization_status": "digitized",
  "access_information": "Available online at the source institution",
  "access_info_level": "record",
  "original_terms": [],
  "search_terms": [],
  "content_note": null,
  "derived_fields": {
    "communities": { "method": "curated", "by": "team", "reviewed": true },
    "places": { "method": "llm_extracted", "reviewed": false }
  },
  "harvested_at": "2026-11-05T12:00:00Z",
  "field_mapping": "mappings/dal_archives.json",
  "relationships": []
}
```

### Suggested per-source mapping file

``` json
{
  "source_id": "dal_archives",
  "source_institution": "Institution name",
  "institution_url": "https://institution.example",
  "harvest_method": "manual_catalogue_sample | csv_export | api | oai_pmh",
  "licence_or_terms_url": "https://institution.example/terms",
  "institution_access": {
    "summary": "General access policy text taken from the institution's own site",
    "source_url": "https://institution.example/visit"
  },
  "fields": {
    "title": "Title",
    "original_id": "Reference code",
    "original_url": "Permalink",
    "date_display": "Date(s)",
    "description": "Scope and content",
    "subjects": "Subject access points",
    "places": "Place access points",
    "people": "Name access points"
  }
}
```

These examples are illustrative only; replace every value with what the
real source provides.

### Schema notes

-   `id` is our internal stable identifier. `original_id` is the
    identifier from the source institution. Do not confuse them.
-   `original_url` must point to the source's authoritative record, not
    a guessed URL.
-   `digitization_status` should use a controlled set such as
    `digitized`, `not_digitized`, `partially_digitized`, and `unknown`,
    but only map a value when supported by source data.
-   `access_information` should be source-derived. Use an explicit
    unknown value when the source does not provide access details.
-   `original_terms` preserves the catalogue language.
-   `search_terms` holds query synonyms or terminology expansions. It
    must not overwrite original terms.
-   `field_mapping` records how the source's original fields map to our
    common fields. Keep the original mapping or a source-level mapping
    reference if repeating it on every record becomes too large.
-   `harvested_at` records when we imported or refreshed the metadata.
-   `relationships` should contain only source-supported links or
    explicitly curated relationships with evidence references.
-   Dates may be approximate or ranges. Do not invent exact dates when
    the source gives only an approximate period. `date_display` keeps
    the source's own wording; `start_date`/`end_date` are normalized
    (year precision is fine) for filtering; `date_approximate` flags
    uncertainty.
-   `access_info_level` is `record` (stated in the record),
    `institution` (general policy from the mapping file, labelled as
    such in the UI), or `unknown`.
-   `derived_fields` lists any field whose values were not supplied by
    the source, with the method (`curated`, `llm_extracted`,
    `rule_based`) and whether a person reviewed it. A field absent from
    `derived_fields` is assumed to come directly from the source. Only
    reviewed derived values should drive the Silence Map and Thread
    View.
-   `source_id` points to the per-source mapping file;
    `field_mapping` stores that file's path so the mapping is not
    repeated on every record.

### Example relationship object

``` json
{
  "target_entity": "Africville",
  "relationship_type": "located_in",
  "evidence_record_id": "internal-record-id",
  "evidence_original_url": "https://institution.example/record/123"
}
```

This is illustrative data only. Do not present example people, records,
institutions, or relationships as real collection facts.

------------------------------------------------------------------------

## 6. Suggested API contract

The team may adapt these endpoint names to its chosen backend. The
important part is agreeing on request and response shapes early.

  ------------------------------------------------------------------------------------
  Endpoint                             Purpose                 Primary consumer
  ------------------------------------ ----------------------- -----------------------
  `GET /records`                       Search and filter       Search UI
                                       normalized records      

  `GET /records/{id}`                  Retrieve one record     Access Card / detail
                                       with access and         view
                                       provenance details      

  `GET /entities/{id}/relationships`   Retrieve                Thread View
                                       source-supported        
                                       connected entities and  
                                       records                 

  `GET /coverage`                      Retrieve record counts  Silence Map
                                       and digitization        
                                       summaries by selected   
                                       community/place         

  `POST /ai/search`                    Run grounded            AI / Language Bridge
                                       natural-language        
                                       retrieval and answer    
                                       generation              
  ------------------------------------------------------------------------------------

For a two-day build, a smaller number of endpoints or a single API route
with query parameters is acceptable. Do not over-engineer the API.

### Mock-first integration rule

Every member should be able to start with a small local JSON fixture
that follows the shared schema. Once the backend endpoint is ready,
replace the fixture with real API responses.

Do not block frontend, AI, map, or graph work while ingestion is being
completed.

------------------------------------------------------------------------

## 7. Five-member work distribution

Member numbers are placeholders. The team should assign actual names
during kickoff.

### Member 1 --- Data, Common Schema, Ingestion, and Backend

**Owns:** - Lead the source-selection gate at kickoff (with Member 4
helping; see Section 9). - Define and publish the common metadata
schema. - Write one mapping file per source. - Write ingestion/normalization scripts. - Preserve provenance
and authoritative source links. - Expose normalized records through API
endpoints. - Validate record counts, missing values, source URLs, and
field mappings.

**Deliverable:** A normalized sample dataset and working API.

**Must communicate early:** Schema, sample JSON, field definitions,
endpoint shapes, and known data limitations.

### Member 2 --- Search UI and Access Cards

**Owns:** - Main application search experience. - Search box and
filters. - Results list and record detail view. - Access Cards with
source institution, digitization status, access information,
authoritative URL, original ID, and provenance. - Clear unknown states
when source data does not provide an answer. - Responsive, readable UI.

**Deliverable:** A user can search and understand where/how to access
each result.

**Can start with:** Mock normalized JSON from Member 1.

### Member 3 --- AI Search, Language Bridge, and Evidence

**Owns:** - Natural-language search interaction. - Applying the
Language Bridge crosswalk (curated by Member 4) to expand queries. -
Retrieval from the normalized record index. - Grounded answer
generation. - Source citations/links for supporting claims. -
Insufficient-evidence response and abstention behavior. - Respectful
display of historical catalogue terminology. - Entity enrichment:
extracting candidate people/places/communities from record text where
the source does not supply them, writing them to `derived_fields` with
method and review status, and providing a quick way for a teammate to
approve or reject candidates. - Cached-response fallback for the demo
questions.

**Deliverable:** A working AI-assisted discovery experience that uses
real indexed records and provides evidence.

**Can start with:** A local fixture containing a small set of normalized
records and source URLs.

### Member 4 --- Silence Map and Coverage Intelligence

**Owns:** - Help Member 1 with source selection at kickoff (checking
access methods, available fields, and terms of use for candidate
sources). - Curate the Language Bridge crosswalk file (draft for
community review), with a short rationale per mapping; hand it to
Member 3 to apply. - Choose a small set of relevant Black
communities/locations for the demo, using verified sources. - Map or
map-like visualization. -
Coverage counts based on the indexed dataset. - Digitization breakdown
where the data supports it. - Legend and clear definitions of coverage
labels. - Warnings/notes that limited indexed coverage is not proof of
historical absence.

**Deliverable:** A working map/dashboard that honestly visualizes the
prototype's indexed coverage.

**Can start with:** A local fixture of selected places, coordinates, and
clearly labelled sample counts. Replace sample counts with API data
later.

### Member 5 --- Thread View, Application Shell, and Integration

**Owns:** - Small source-backed relationship graph or connected-record
view. - Entity and relationship display. - Evidence/source reference for
each displayed connection. - Shared navigation/application shell and
module integration. - End-to-end testing and demo flow. - Optional
Research Trail if core integration is stable.

**Deliverable:** A coherent integrated application with a working small
Thread View.

**Can start with:** A local fixture of entities, edges, and evidence
record IDs. Coordinate with Member 1 on the relationship response shape.

**Important workload note:** Integration is a real task, not something
to postpone until the final hour. Member 5 should establish the shared
app shell and integration conventions early. Other members must keep
their modules independently runnable and provide clear integration
instructions.

------------------------------------------------------------------------

## 8. Dependencies and parallel development

### Main dependency

The main shared dependency is the **common metadata schema**, not a
completed backend.

Member 1 should publish: 1. A first version of the schema. 2. One or two
representative JSON records. 3. The initial endpoint contract. 4. A list
of fields that are optional or may be unknown.

After that, all five members can begin in parallel.

### Dependency flow

``` text
                 MEMBER 1
       Common schema + sample JSON
                    |
       +------------+-------------+
       |            |             |
       v            v             v
   MEMBER 2     MEMBER 3       MEMBER 4
 Search +       AI search +    Silence Map
 Access Cards   entity         + Coverage +
                enrichment     crosswalk file
                     ^              |
                     +--------------+
                  (crosswalk handed to M3)
       |            |             |
       +------------+-------------+
                    |
                    v
                 MEMBER 5
        Thread View + Integration
                    |
                    v
          End-to-end testing/demo
```

Member 5 can build Thread View in parallel using mock relationship data;
the diagram shows the later integration dependency, not a reason to
wait.

### Start-now checklist

  -----------------------------------------------------------------------
  Member                  Can start immediately?  Initial input
  ----------------------- ----------------------- -----------------------
  1                       Yes                     Sample source files /
                                                  dataset links

  2                       Yes                     Shared schema draft and
                                                  mock records

  3                       Yes                     Mock records with
                                                  original terms and
                                                  source URLs

  4                       Yes                     Selected community
                                                  names, verified
                                                  locations, mock
                                                  coverage fixture

  5                       Yes                     Mock entities and
                                                  source-backed
                                                  relationship fixture
  -----------------------------------------------------------------------

### Integration checkpoints

**Checkpoint A --- Shared contract** - Schema and sample JSON
published. - All members agree on field names and unknown-value
handling. - API request/response shapes agreed.

**Checkpoint B --- Independent modules** - Each module runs with mock
data. - Each member documents how to run it and what API/data shape it
expects.

**Checkpoint C --- Real data integration** - Mock fixtures replaced by
API responses where available. - Search, Access Cards, AI, map, and
graph use the same normalized records. - Provenance and source links are
checked end-to-end.

**Checkpoint D --- Demo freeze** - Stop adding major features. - Fix
broken links, incorrect claims, missing source attribution, and
integration bugs. - Confirm the cached AI fallback works with the
network off. - Rehearse the full demo.

------------------------------------------------------------------------

## 9. Two-day build strategy

This is a sequence of milestones, not a rigid hourly schedule.

### Kickoff decisions (first hour, before coding)

**Gate 1 --- Sample sources (critical path).** Before anything else,
ask the organizers whether BCCNS is providing sample datasets or has
preferred partner sources. If not, Members 1 and 4 pick 2--3 sources
from Section 15 within the first hour. For each chosen source, write
down: how we get the metadata (API, export, OAI-PMH, or manual sample
from public pages), which fields actually exist, whether access or
digitization information is present, and its terms of use. If a source
cannot be confirmed in that hour, drop it for one that can.

**Gate 2 --- Stack.** Agree on one stack and one repository so five
people do not diverge. A recommended minimal option: a single
repository with a small Python (FastAPI) or Node API, records stored
as JSON or SQLite, keyword search plus optional embeddings, and one
web frontend (React/Next.js or plain Vite) that hosts every module as
a page or tab. Use whatever the team is fastest in; the point is to
decide once.

### Day 1 --- Establish the contract and build in parallel

1.  Close Gates 1 and 2.
2.  Member 1 publishes the schema, sample JSON, and endpoint contract
    early.
3.  All members build their modules independently using mock data.
4.  Member 1 continues ingestion and API development.
5.  Member 5 establishes the application shell and integration
    conventions.
6.  End the day with a first integration attempt and a list of blockers.

### Day 2 --- Connect real data, verify, and demo

1.  Replace mock data with normalized API records.
2.  Connect search and Access Cards to the backend.
3.  Connect AI retrieval to the same records.
4.  Connect Silence Map counts and Thread View relationships.
5.  Verify provenance, authoritative URLs, access information, and
    evidence links.
6.  Test empty results, missing access information, and insufficient AI
    evidence.
7.  Freeze features, fix issues, and rehearse the demo.

### If time gets tight

Protect these in order: 1. Real searchable records from at least two
sample sources. 2. Access Cards, authoritative links, and provenance. 3.
Grounded AI / Language Bridge with safe abstention. 4. A basic Silence
Map that accurately describes indexed coverage. 5. A small source-backed
Thread View. 6. Research Trail and all other stretch goals.

A small working feature is better than a large unfinished feature.

------------------------------------------------------------------------

## 10. Judging criteria and how our solution addresses them

The judging criteria provided to the team are **equally weighted**:

1.  Impact
2.  Functionality
3.  Innovation
4.  Presentation
5.  Overall Execution

The following explains how to demonstrate each criterion. It is a
preparation guide, not a claim that judges will use additional
sub-scores.

### 10.1 Impact

**What judges should understand:** This addresses a real discovery
problem for people researching Black history and helps BCCNS make
distributed resources easier to find.

**Evidence in our demo:** - Search across multiple institutions from one
place. - Show the original holding institution and how to access the
record. - Show limited indexed coverage honestly, so BCCNS can see where
more discovery work may be needed. - Demonstrate how a researcher can
move from a broad question to useful original sources.

**Avoid:** Claiming the prototype represents all Black history
collections in Canada. Be clear about which sample sources are included.

### 10.2 Functionality

**What judges should see working:** - Records from at least 2--3 sample
sources, if available. - A common metadata structure. - Search and
meaningful filters. - Access Cards with source institution, access
information, authoritative URL, and provenance. - AI retrieval grounded
in the records. - Source-backed relationships and a functioning coverage
view, even if small.

**Demo test:** Search for a topic and follow a result all the way to its
original institutional record.

### 10.3 Innovation

**What makes the solution distinctive:** - Language Bridge helps people
discover records despite different or historical catalogue
terminology. - Cite or Stay Silent makes AI evidence visible and allows
it to abstain. - Silence Map turns indexed coverage limitations into
useful discovery intelligence. - Thread View helps users navigate
connections across institutions.

**Avoid:** Presenting a generic AI chatbot or an unverified knowledge
graph as the main innovation.

### 10.4 Presentation

**What judges should experience:** - A clear, simple story with one
complete researcher journey. - A polished and readable search
experience. - Access Cards that make the next step obvious. - A visual
Silence Map and a small, understandable Thread View. - Clear
explanations of what is real, what is sample data, and what is future
scope.

**Suggested demo story:** Search for a selected community using modern
language; show Language Bridge finding relevant source records; open an
Access Card to verify the institution, provenance, and access; explore
indexed coverage on the Silence Map; then follow a documented connection
in Thread View.

### 10.5 Overall Execution

**What demonstrates strong execution:** - The application runs reliably
from beginning to end. - The same normalized records power the different
modules. - Original source links work. - Provenance is preserved and
visible. - AI answers are evidence-grounded and abstain when needed. -
No unsupported historical claims or invented access instructions. - The
team can explain the architecture, data flow, limitations, and future
scalability. - The demo is rehearsed and does not depend on fragile
manual steps.

------------------------------------------------------------------------

## 11. Acceptance checklist before the final demo

### Problem coverage

-   [ ] At least two sample data sources are represented; aim for three.
-   [ ] Records are normalized into one common schema.
-   [ ] Search supports the key fields available in the sample data.
-   [ ] Results identify the source institution.
-   [ ] Results explain access where the source provides that
    information.
-   [ ] Results link to the authoritative original record.
-   [ ] Provenance is preserved and accessible.
-   [ ] The platform references third-party resources rather than
    copying complete collections.
-   [ ] Each source has a mapping file; ingestion has no
    source-specific code paths.
-   [ ] Institution-level access info is labelled as general policy,
    never as record-specific.
-   [ ] Derived (non-source) field values are marked in the data and
    the UI.

### AI trust and terminology

-   [ ] AI retrieves from the indexed source records.
-   [ ] Answers provide supporting record links.
-   [ ] AI abstains when the available evidence is insufficient.
-   [ ] Historical terms are preserved as source terminology and
    contextualized where appropriate.
-   [ ] Query expansion does not silently change original record text.
-   [ ] Crosswalk is labelled as a draft for community review.
-   [ ] Cached fallback responses exist for every planned demo
    question and work offline.

### Coverage and relationships

-   [ ] Silence Map counts come from the indexed records or are clearly
    labelled as sample data.
-   [ ] The map does not equate low indexed coverage with historical
    absence, and the disclaimer is visible on the map itself.
-   [ ] Community names/locations on the map cite their source.
-   [ ] Thread View relationships have supporting source records.
-   [ ] Uncertain identity matches are not automatically merged.

### Usability and execution

-   [ ] Search, filters, cards, map, and graph work in the integrated
    application.
-   [ ] Empty and unknown states are understandable.
-   [ ] External source links are checked.
-   [ ] No feature claims more than the data supports.
-   [ ] Demo path is rehearsed.
-   [ ] Team can explain the schema, provenance, data flow, and
    limitations.

------------------------------------------------------------------------

## 12. Suggested final demo script

Keep the demo focused on one user story rather than clicking through
every feature independently.

1.  **Start with the problem:** Black history resources are distributed
    across institutions with different catalogues and access rules.
2.  **Search:** Enter a community, person, place, or topic using
    everyday language.
3.  **Discover:** Show results from multiple sample institutions and
    explain how the common metadata structure makes them searchable
    together.
4.  **Language Bridge:** Show how a modern query can discover a record
    with different historical catalogue terminology.
5.  **Verify and access:** Open an Access Card. Point out the source
    institution, original ID, access information, authoritative URL, and
    provenance. Explain that the platform references metadata and links
    rather than copying the collection.
6.  **Coverage:** Open the Silence Map and explain what the indexed
    sample sources cover and where coverage is limited. State the
    limitations clearly.
7.  **Connect:** Open Thread View and show one or two source-backed
    relationships.
8.  **Close with impact:** Explain how this proof of concept could grow
    by onboarding more institutions and metadata sources while leaving
    original collections under their institutions' authority.

### Suggested closing message

"THREADS does not replace archives or move their collections. It gives
people one trusted place to discover what exists across them, understand
where the original material lives, and follow the evidence back to the
institutions that hold it."

------------------------------------------------------------------------

## 13. Instructions for Claude Code

Use this document as the project context and source of truth.

When helping implement the project:

1.  **Inspect the existing repository first.** Do not overwrite existing
    work or assume a framework before checking the project.
2.  Identify the current stack, entry points, package scripts, existing
    components, data files, and environment configuration.
3.  Recommend the smallest architecture that can satisfy the P0
    requirements in a two-day hackathon.
4.  Keep the implementation modular so five people can work in parallel.
5.  Treat the common metadata schema and provenance fields in this
    document as shared contracts. If a change is necessary, explain it
    and update the shared contract before changing multiple modules.
6.  Build against mock JSON fixtures when the backend or real sample
    data is not ready. Keep fixtures clearly labelled as sample data.
7.  Do not invent real archival records, institutions, source URLs,
    digitization status, access conditions, historical relationships, or
    community coverage statistics.
8.  Keep source institution, original ID, original URL, harvested
    timestamp, and field mapping available throughout ingestion,
    storage, API responses, and the UI.
9.  Do not download or re-host archival files. Store reference metadata
    and authoritative links only, unless the team verifies explicit
    permission for a particular preview asset.
10. Keep AI retrieval grounded in the normalized dataset. Make evidence
    visible and implement an insufficient-evidence response.
11. Keep historical terminology respectful and contextualized. Preserve
    original catalogue wording rather than overwriting it.
12. Ensure map and relationship visualizations clearly communicate their
    data limitations.
13. Do not add complex stretch features before the P0 requirements work
    end-to-end.
14. Add concise setup/run instructions and document environment
    variables. Never commit secrets or API keys.
15. Before declaring a feature complete, run the relevant checks and
    report what was actually tested. Do not claim an endpoint,
    integration, or feature works if it has not been run.
16. When multiple members work in parallel, avoid changing shared files
    or schemas without coordination. Keep module boundaries and
    integration contracts explicit.

### First task for Claude Code

After inspecting the repository, provide: - A brief summary of the
existing project structure and stack. - A recommended minimal
architecture for this challenge. - A proposed folder/module ownership
map for the five members. - The first version of the normalized record
schema and API contracts. - A short implementation sequence that allows
all five members to start independently.

Do not begin a large rewrite before presenting this assessment. Preserve
existing working code wherever possible.

------------------------------------------------------------------------

## 14. Known limitations and items the team must confirm

This context captures the problem statement and decisions made during
brainstorming. It does not establish that particular datasets, APIs, or
permissions have already been secured.

Before implementation, the team must confirm: - Whether the organizers
/ BCCNS are providing sample data or preferred sources. - Which 2--3
real sample sources will be used (see Section 15). - Whether each source permits metadata harvesting
and what attribution/linking rules apply. - Which fields are actually
available in each source. - Whether access and digitization information
is explicitly provided. - Which community locations are appropriate and
can be verified for the map. - Which source records support each
relationship in Thread View. - Which French terminology or translation
support can be responsibly included, if attempted.

If a field or fact is not supported by the source data, represent it as
unknown or omit it. Do not fill gaps with guesses.

**The goal is a small, honest, working proof of concept that clearly
satisfies the challenge---not a claim that we have already built a
complete national archive.**

------------------------------------------------------------------------

## 15. Candidate sample sources (to verify at kickoff)

Unless the organizers supply data, the team finds its own sources. The
candidates below were identified from public websites on Nov 5, 2026.
None has been confirmed for field availability, harvesting method, or
terms of use; Gate 1 in Section 9 must confirm each before use. Do not
treat anything here as a verified record.

| Candidate | What it offers | Likely way to get metadata | Why it is useful |
|---|---|---|---|
| **Dalhousie University Archives** (findingaids.library.dal.ca) | Archival descriptions down to file level, e.g. files from the Africville Relocation Study (UA-26) with box/folder locations | Public AtoM catalogue pages; check whether the instance exposes OAI-PMH or Dublin Core/EAD export, otherwise hand-collect a sample | University source; many records are physical files, which makes Access Cards and digitization status meaningful |
| **Nova Scotia Archives** (archives.novascotia.ca, plus its AtoM catalogue) | *Looking Back, Moving Forward* African Nova Scotian heritage resource, the *African Nova Scotians in the Age of Slavery and Abolition* virtual exhibit, and catalogue descriptions such as an African Nova Scotian Affairs fonds | Exhibit pages are curated lists linking to item/search pages; catalogue is AtoM (same checks as above) | Provincial government archive; mixes digitized items and descriptions |
| **Government of Nova Scotia open data: "African Nova Scotian Family Names by Region"** (open.canada.ca / NS open data portal) | Traditional family names by region and the traditional African Nova Scotian communities in each region | Direct CSV/XML download under the Open Government Licence -- Nova Scotia | Verifiable, openly licensed list of communities for the Silence Map and for curating community entities; it is reference data, not archival records |
| **Library and Archives Canada** (Collection Search and its Black Canadians research guide) | National-level records, e.g. Loyalist-era records relevant to Black Loyalists | Public search pages; check for any export or API | Adds a national institution, supporting the "national hub" story |
| **Wikidata** (query.wikidata.org SPARQL) | Identifiers, coordinates, and alternate names for places and organizations | Open SPARQL endpoint, CC0 | Optional enrichment for map coordinates and name variants; never use it as evidence for archival claims |
| **Canadiana** (canadiana.ca) | Digitized Canadian heritage documents | Public search; check current API/IIIF availability | Possible third source if the above fall through |

Recommended starting combination: **Dalhousie + Nova Scotia Archives**
as the two archival sources (both AtoM-based, so one mapping approach
covers both, and the overlap on Africville gives a strong demo thread),
**LAC** as the third for national scope if time permits, and the
**NS open data community list** as reference data for the map.

For every source used: collect only metadata and links, respect robots
rules and terms of use, keep the record's real URL and identifier, and
record the harvest method in the mapping file.
