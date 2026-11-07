-- BCCNS Discovery Platform -- database schema (SQLite)
--
-- This is a relational view of the same data contract already defined in
-- data/schema/record.schema.json and docs/DATA_CONTRACT.md. It is NOT a
-- replacement for that contract: the JSON files remain the source of
-- truth, and the API in backend/app/main.py reads them directly.
-- This file exists so teammates who prefer SQL can load the same 13
-- sample records into a local database and start querying immediately.
--
-- Load it with:
--   sqlite3 bccns.db < db/schema.sql
--
-- Tables: sources, records, record_people, record_places,
-- record_communities, record_subjects, record_original_terms,
-- record_search_terms, record_derived_fields, record_relationships,
-- communities, crosswalk, crosswalk_historical_terms.
-- Relationships are derived from the records themselves (see
-- GET /entities/{id}/relationships); there is no separate edges table.
-- Views: v_record_search, v_coverage_by_institution,
-- v_coverage_by_community.
-- Only metadata and links are stored. No archival files are copied.
-- Counts are for indexed sources only; limited indexed coverage does
-- not mean no historical records exist.

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;


CREATE TABLE sources (
    source_id TEXT PRIMARY KEY,
    source_institution TEXT NOT NULL,
    institution_url TEXT,
    harvest_method TEXT,
    licence_or_terms_url TEXT,
    institution_access_summary TEXT,
    institution_access_source_url TEXT
);

CREATE TABLE records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date_display TEXT NOT NULL DEFAULT '',
    start_date INTEGER,
    end_date INTEGER,
    date_approximate INTEGER NOT NULL DEFAULT 0 CHECK (date_approximate IN (0, 1)),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('document','letter','register','photograph','audio','exhibit','collection','book','newspaper','map','other')),
    source_id TEXT NOT NULL REFERENCES sources(source_id),
    source_institution TEXT NOT NULL,
    original_id TEXT NOT NULL,
    original_url TEXT NOT NULL,
    digitization_status TEXT NOT NULL CHECK (digitization_status IN ('digitized','not_digitized','partially_digitized','unknown')),
    access_information TEXT NOT NULL DEFAULT '',
    access_info_level TEXT NOT NULL DEFAULT 'unknown' CHECK (access_info_level IN ('record','institution','unknown')),
    content_note TEXT,
    harvested_at TEXT,
    field_mapping TEXT
);

CREATE TABLE record_people (
    record_id TEXT NOT NULL REFERENCES records(id),
    person TEXT NOT NULL,
    PRIMARY KEY (record_id, person)
);
CREATE TABLE record_places (
    record_id TEXT NOT NULL REFERENCES records(id),
    place TEXT NOT NULL,
    PRIMARY KEY (record_id, place)
);
CREATE TABLE record_communities (
    record_id TEXT NOT NULL REFERENCES records(id),
    community TEXT NOT NULL,
    PRIMARY KEY (record_id, community)
);
CREATE TABLE record_subjects (
    record_id TEXT NOT NULL REFERENCES records(id),
    subject TEXT NOT NULL,
    PRIMARY KEY (record_id, subject)
);
CREATE TABLE record_original_terms (
    record_id TEXT NOT NULL REFERENCES records(id),
    term TEXT NOT NULL,
    PRIMARY KEY (record_id, term)
);
CREATE TABLE record_search_terms (
    record_id TEXT NOT NULL REFERENCES records(id),
    term TEXT NOT NULL,
    PRIMARY KEY (record_id, term)
);
CREATE TABLE record_derived_fields (
    record_id TEXT NOT NULL REFERENCES records(id),
    field_name TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('curated','llm_extracted','rule_based')),
    produced_by TEXT,
    reviewed INTEGER NOT NULL DEFAULT 0 CHECK (reviewed IN (0, 1)),
    PRIMARY KEY (record_id, field_name)
);
CREATE TABLE record_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT NOT NULL REFERENCES records(id),
    target_entity TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    evidence_record_id TEXT NOT NULL,
    evidence_original_url TEXT
);

CREATE TABLE communities (
    name TEXT PRIMARY KEY,
    indexed_count INTEGER NOT NULL DEFAULT 0,
    digitized_count INTEGER NOT NULL DEFAULT 0,
    latitude REAL,
    longitude REAL,
    coordinates_approximate INTEGER NOT NULL DEFAULT 1 CHECK (coordinates_approximate IN (0, 1)),
    source TEXT
);

CREATE TABLE crosswalk (
    modern_term TEXT PRIMARY KEY,
    rationale TEXT,
    status TEXT NOT NULL DEFAULT 'draft for community review'
);
CREATE TABLE crosswalk_historical_terms (
    modern_term TEXT NOT NULL REFERENCES crosswalk(modern_term),
    historical_term TEXT NOT NULL,
    PRIMARY KEY (modern_term, historical_term)
);

CREATE INDEX idx_records_source ON records(source_id);
CREATE INDEX idx_records_digitization ON records(digitization_status);
CREATE INDEX idx_records_resource_type ON records(resource_type);
CREATE INDEX idx_records_start_date ON records(start_date);
CREATE INDEX idx_record_communities_community ON record_communities(community);
CREATE INDEX idx_record_people_person ON record_people(person);

INSERT INTO sources VALUES ('dal_archives', 'Dalhousie University Archives', 'https://findingaids.library.dal.ca/', 'manual_catalogue_sample', NULL, 'Contact the institution through its website for reading-room access and copy requests.', 'https://findingaids.library.dal.ca/');
INSERT INTO sources VALUES ('lac', 'Library and Archives Canada', 'https://www.bac-lac.gc.ca/', 'manual_catalogue_sample', NULL, 'Contact the institution through its website for access and copy requests.', 'https://www.bac-lac.gc.ca/');
INSERT INTO sources VALUES ('ns_archives', 'Nova Scotia Archives', 'https://archives.novascotia.ca/', 'manual_catalogue_sample', NULL, 'Contact the institution through its website for reading-room access and copy requests.', 'https://archives.novascotia.ca/');
INSERT INTO records VALUES ('bccns-001', 'African Nova Scotians in the Age of Slavery and Abolition', 'Virtual exhibit from Nova Scotia Archives exploring the lives of early Black settlers in Nova Scotia through digitized government documents, letters, newspaper articles, maps, and works of art, covering 1749 to 1834.', '1749-1834', 1749, 1834, 0, 'exhibit', 'ns_archives', 'Nova Scotia Archives', 'African Nova Scotians in the Age of Slavery and Abolition', 'https://archives.novascotia.ca/african-heritage/', 'digitized', 'View online at Nova Scotia Archives.', 'record', NULL, '2026-11-05T12:00:00Z', 'mappings/ns_archives.json');
INSERT INTO record_places VALUES ('bccns-001', 'Halifax');
INSERT INTO record_places VALUES ('bccns-001', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-001', 'Africville');
INSERT INTO record_communities VALUES ('bccns-001', 'Preston');
INSERT INTO record_communities VALUES ('bccns-001', 'Birchtown');
INSERT INTO record_subjects VALUES ('bccns-001', 'slavery');
INSERT INTO record_subjects VALUES ('bccns-001', 'abolition');
INSERT INTO record_subjects VALUES ('bccns-001', 'settlement');
INSERT INTO record_derived_fields VALUES ('bccns-001', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-001', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-002', 'African Nova Scotian Diaspora', 'Digitized and searchable government documents relating to early African Nova Scotian settlement patterns, including records of Black Refugees who arrived at the close of the War of 1812.', '1813-1816', 1813, 1816, 0, 'collection', 'ns_archives', 'Nova Scotia Archives', 'African Nova Scotian Diaspora', 'https://archives.novascotia.ca/african-heritage/', 'digitized', 'View online at Nova Scotia Archives.', 'record', NULL, '2026-11-05T12:00:00Z', 'mappings/ns_archives.json');
INSERT INTO record_places VALUES ('bccns-002', 'Nova Scotia');
INSERT INTO record_places VALUES ('bccns-002', 'Preston');
INSERT INTO record_places VALUES ('bccns-002', 'Hammonds Plains');
INSERT INTO record_communities VALUES ('bccns-002', 'Preston');
INSERT INTO record_communities VALUES ('bccns-002', 'Hammonds Plains');
INSERT INTO record_subjects VALUES ('bccns-002', 'Black Refugees');
INSERT INTO record_subjects VALUES ('bccns-002', 'War of 1812');
INSERT INTO record_subjects VALUES ('bccns-002', 'settlement');
INSERT INTO record_original_terms VALUES ('bccns-002', 'Black Refugees');
INSERT INTO record_search_terms VALUES ('bccns-002', 'Black Refugees');
INSERT INTO record_derived_fields VALUES ('bccns-002', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-002', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-003', 'Viola Desmond legal records', 'Surviving legal documents from the Magistrate''s Court and the Supreme Court relating to Viola Desmond, an African Nova Scotian businesswoman whose 1946 case marked a watershed for civil rights in Canada, with contemporary newspaper coverage.', '1946', 1946, 1946, 0, 'document', 'ns_archives', 'Nova Scotia Archives', 'Viola Desmond records', 'https://archives.novascotia.ca/african-heritage/', 'partially_digitized', 'View selected records online at Nova Scotia Archives; contact the Archives for the full file.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/ns_archives.json');
INSERT INTO record_people VALUES ('bccns-003', 'Viola Desmond');
INSERT INTO record_places VALUES ('bccns-003', 'New Glasgow');
INSERT INTO record_places VALUES ('bccns-003', 'Halifax');
INSERT INTO record_places VALUES ('bccns-003', 'Nova Scotia');
INSERT INTO record_subjects VALUES ('bccns-003', 'civil rights');
INSERT INTO record_subjects VALUES ('bccns-003', 'legal records');
INSERT INTO record_subjects VALUES ('bccns-003', 'discrimination');
INSERT INTO record_derived_fields VALUES ('bccns-003', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-003', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-004', 'Nominal Roll, No. 2 Construction Battalion, March 1917', 'Fully searchable nominal roll of officers, non-commissioned officers, and men of No. 2 Construction Battalion, providing biographical and family information about enlisted men and officers.', 'March 1917', 1917, 1917, 0, 'register', 'ns_archives', 'Nova Scotia Archives', 'Nominal Roll, No. 2 Construction Battalion', 'https://archives.novascotia.ca/african-heritage/', 'digitized', 'View online at Nova Scotia Archives.', 'record', NULL, '2026-11-05T12:00:00Z', 'mappings/ns_archives.json');
INSERT INTO record_places VALUES ('bccns-004', 'Nova Scotia');
INSERT INTO record_places VALUES ('bccns-004', 'Halifax');
INSERT INTO record_communities VALUES ('bccns-004', 'Africville');
INSERT INTO record_communities VALUES ('bccns-004', 'Preston');
INSERT INTO record_communities VALUES ('bccns-004', 'Cherry Brook');
INSERT INTO record_subjects VALUES ('bccns-004', 'First World War');
INSERT INTO record_subjects VALUES ('bccns-004', 'military service');
INSERT INTO record_subjects VALUES ('bccns-004', 'No. 2 Construction Battalion');
INSERT INTO record_derived_fields VALUES ('bccns-004', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-004', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-005', 'Book of Negroes, 1783', 'Register of Black people who evacuated New York on British ships to Nova Scotia from April to November 1783, following the American Revolution. Library and Archives Canada holds a searchable database of 2,831 references from the register.', '1783', 1783, 1783, 0, 'register', 'lac', 'Library and Archives Canada', 'Book of Negroes, MG23 B1, microfilm M-369', 'https://www.bac-lac.gc.ca/eng/discover/military-heritage/loyalists/book-of-negroes/Pages/introduction.aspx', 'digitized', 'Search the database and view the digitized register through Library and Archives Canada.', 'record', NULL, '2026-11-05T12:00:00Z', 'mappings/lac.json');
INSERT INTO record_places VALUES ('bccns-005', 'New York');
INSERT INTO record_places VALUES ('bccns-005', 'Nova Scotia');
INSERT INTO record_places VALUES ('bccns-005', 'Birchtown');
INSERT INTO record_places VALUES ('bccns-005', 'Shelburne');
INSERT INTO record_communities VALUES ('bccns-005', 'Birchtown');
INSERT INTO record_communities VALUES ('bccns-005', 'Shelburne');
INSERT INTO record_subjects VALUES ('bccns-005', 'Black Loyalists');
INSERT INTO record_subjects VALUES ('bccns-005', 'American Revolution');
INSERT INTO record_subjects VALUES ('bccns-005', 'migration');
INSERT INTO record_original_terms VALUES ('bccns-005', 'Book of Negroes');
INSERT INTO record_search_terms VALUES ('bccns-005', 'Book of Negroes');
INSERT INTO record_derived_fields VALUES ('bccns-005', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-005', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-006', 'Carleton Papers, British Headquarters Papers, 1774-1783', 'British Headquarters Papers, New York, including the Carleton Papers. Library and Archives Canada holds a microfilm copy and a searchable index covering loyalist soldiers and civilian refugees.', '1774-1783', 1774, 1783, 0, 'collection', 'lac', 'Library and Archives Canada', 'British Headquarters Papers, MG23 B1', 'https://www.bac-lac.gc.ca/eng/discover/military-heritage/loyalists/book-of-negroes/Pages/introduction.aspx', 'partially_digitized', 'Search the index through Library and Archives Canada; consult the access options on the source page for copies and microfilm.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/lac.json');
INSERT INTO record_places VALUES ('bccns-006', 'New York');
INSERT INTO record_places VALUES ('bccns-006', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-006', 'Birchtown');
INSERT INTO record_communities VALUES ('bccns-006', 'Shelburne');
INSERT INTO record_subjects VALUES ('bccns-006', 'Black Loyalists');
INSERT INTO record_subjects VALUES ('bccns-006', 'loyalists');
INSERT INTO record_subjects VALUES ('bccns-006', 'military records');
INSERT INTO record_derived_fields VALUES ('bccns-006', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-006', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-007', 'Muster Book of Free Black Settlement of Birchtown, Port Roseway, 1784', 'Register created in the summer of 1784 listing the names and ages of Black men, women, and children who established the settlement of Birchtown, near Shelburne, Nova Scotia, with details of professions, military rank, and family ties where recorded.', '1784', 1784, 1784, 0, 'register', 'lac', 'Library and Archives Canada', 'Muster Book of Free Black Settlement of Birchtown, Port Roseway, R16987, MG9 B9-14', 'https://heritage.canadiana.ca/view/oocihm.lac_reel_h984', 'digitized', 'View the digitized register through Canadiana Heritage, linked from Library and Archives Canada.', 'record', NULL, '2026-11-05T12:00:00Z', 'mappings/lac.json');
INSERT INTO record_places VALUES ('bccns-007', 'Birchtown');
INSERT INTO record_places VALUES ('bccns-007', 'Port Roseway');
INSERT INTO record_places VALUES ('bccns-007', 'Shelburne');
INSERT INTO record_places VALUES ('bccns-007', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-007', 'Birchtown');
INSERT INTO record_communities VALUES ('bccns-007', 'Shelburne');
INSERT INTO record_subjects VALUES ('bccns-007', 'Black Loyalists');
INSERT INTO record_subjects VALUES ('bccns-007', 'settlement');
INSERT INTO record_subjects VALUES ('bccns-007', 'muster roll');
INSERT INTO record_derived_fields VALUES ('bccns-007', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-007', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-008', 'Black Loyalist Refugees, 1782-1807', 'Records relating to Black Loyalist refugees who arrived in Nova Scotia between 1782 and 1807, held in the Port Roseway Associates series at Library and Archives Canada.', '1782-1807', 1782, 1807, 0, 'collection', 'lac', 'Library and Archives Canada', 'Port Roseway Associates series, R16987', 'https://heritage.canadiana.ca/view/oocihm.lac_reel_h984', 'partially_digitized', 'View digitized material through Canadiana Heritage; consult Library and Archives Canada for the full series.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/lac.json');
INSERT INTO record_places VALUES ('bccns-008', 'Shelburne');
INSERT INTO record_places VALUES ('bccns-008', 'Port Roseway');
INSERT INTO record_places VALUES ('bccns-008', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-008', 'Birchtown');
INSERT INTO record_communities VALUES ('bccns-008', 'Shelburne');
INSERT INTO record_subjects VALUES ('bccns-008', 'Black Loyalists');
INSERT INTO record_subjects VALUES ('bccns-008', 'refugees');
INSERT INTO record_subjects VALUES ('bccns-008', 'settlement');
INSERT INTO record_derived_fields VALUES ('bccns-008', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-008', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-011', 'Africville community records', 'Photographs, oral histories, and documents relating to Africville, a historic Black community in Halifax, held across Nova Scotia Archives and community collections.', 'c. 1840-1970', 1840, 1970, 1, 'collection', 'ns_archives', 'Nova Scotia Archives', 'Africville community records', 'https://archives.novascotia.ca/african-heritage/', 'partially_digitized', 'View selected records online at Nova Scotia Archives; contact the Archives for material held on site.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/ns_archives.json');
INSERT INTO record_places VALUES ('bccns-011', 'Africville');
INSERT INTO record_places VALUES ('bccns-011', 'Halifax');
INSERT INTO record_places VALUES ('bccns-011', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-011', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-011', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-011', 'community history');
INSERT INTO record_subjects VALUES ('bccns-011', 'oral history');
INSERT INTO record_derived_fields VALUES ('bccns-011', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-011', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-012', 'Helen Creighton: African Nova Scotian songs, Cherry Brook', 'Audio recordings collected by folklorist Helen Creighton, including songs performed by William Riley and others at Cherry Brook, Halifax County, in 1943, held by Nova Scotia Archives.', '1943', 1943, 1943, 0, 'audio', 'ns_archives', 'Nova Scotia Archives', 'Helen Creighton audio reels, Cherry Brook', 'https://archives.novascotia.ca/african-heritage/', 'partially_digitized', 'Search the Helen Creighton collection at Nova Scotia Archives; contact the Archives for access to specific reels.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/ns_archives.json');
INSERT INTO record_people VALUES ('bccns-012', 'William Riley');
INSERT INTO record_people VALUES ('bccns-012', 'Helen Creighton');
INSERT INTO record_places VALUES ('bccns-012', 'Cherry Brook');
INSERT INTO record_places VALUES ('bccns-012', 'Halifax');
INSERT INTO record_places VALUES ('bccns-012', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-012', 'Cherry Brook');
INSERT INTO record_subjects VALUES ('bccns-012', 'music');
INSERT INTO record_subjects VALUES ('bccns-012', 'folklore');
INSERT INTO record_subjects VALUES ('bccns-012', 'oral history');
INSERT INTO record_derived_fields VALUES ('bccns-012', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-012', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-013', 'Dalhousie University Institute of Public Affairs fonds (UA-26)', 'Finding aid for the Institute of Public Affairs fonds, including projects and working groups such as the Africville Relocation Project. Held at Dalhousie University Archives, Killam Memorial Library, Halifax.', '1890-1996', 1890, 1996, 0, 'collection', 'dal_archives', 'Dalhousie University Archives', 'UA-26', 'https://findingaids.library.dal.ca/downloads/dalhousie-university-institute-of-public-affairs-fonds.pdf', 'partially_digitized', 'Finding aid available online; records held on site at Dalhousie University Archives, Killam Memorial Library, Halifax.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/dal_archives.json');
INSERT INTO record_people VALUES ('bccns-013', 'Guy Henson');
INSERT INTO record_places VALUES ('bccns-013', 'Halifax');
INSERT INTO record_places VALUES ('bccns-013', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-013', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-013', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-013', 'relocation');
INSERT INTO record_subjects VALUES ('bccns-013', 'Institute of Public Affairs');
INSERT INTO record_derived_fields VALUES ('bccns-013', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-013', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-014', 'Guy Henson fonds (MS-2-373)', 'Fonds of Guy Henson (1910-1978), director of the Institute of Public Affairs (1957-1976), whose work included the Africville Relocation Project.', '1933-1978', 1933, 1978, 0, 'collection', 'dal_archives', 'Dalhousie University Archives', 'MS-2-373', 'https://findingaids.library.dal.ca/downloads/guy-henson-fonds.pdf', 'partially_digitized', 'Finding aid available online; records held on site at Dalhousie University Archives, Killam Memorial Library, Halifax.', 'institution', NULL, '2026-11-05T12:00:00Z', 'mappings/dal_archives.json');
INSERT INTO record_people VALUES ('bccns-014', 'Guy Henson');
INSERT INTO record_places VALUES ('bccns-014', 'Halifax');
INSERT INTO record_places VALUES ('bccns-014', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-014', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-014', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-014', 'relocation');
INSERT INTO record_subjects VALUES ('bccns-014', 'education');
INSERT INTO record_derived_fields VALUES ('bccns-014', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-014', 'places', 'curated', 'team', 1);
INSERT INTO records VALUES ('bccns-015', 'Photograph of a train running through Africville', 'Photograph of a CN train passing through Halifax''s Africville neighbourhood, used in Donald Clairmont''s Africville Relocation Report. Source: Dalhousie University Photographic Collection, PC1, Box 42, Folder 11, Items 1-2.', '[between 1950 and 1959]', 1950, 1959, 1, 'photograph', 'dal_archives', 'Dalhousie University Archives', 'PC1, Box 42, Folder 11, Items 1-2', 'https://digitalexhibits.library.dal.ca/items/show/674', 'digitized', 'View online at Dalhousie Libraries Digital Exhibits.', 'record', NULL, '2026-11-05T12:00:00Z', 'mappings/dal_archives.json');
INSERT INTO record_people VALUES ('bccns-015', 'Donald Clairmont');
INSERT INTO record_places VALUES ('bccns-015', 'Africville');
INSERT INTO record_places VALUES ('bccns-015', 'Halifax');
INSERT INTO record_places VALUES ('bccns-015', 'Nova Scotia');
INSERT INTO record_communities VALUES ('bccns-015', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-015', 'Africville');
INSERT INTO record_subjects VALUES ('bccns-015', 'relocation');
INSERT INTO record_subjects VALUES ('bccns-015', 'photograph');
INSERT INTO record_derived_fields VALUES ('bccns-015', 'communities', 'curated', 'team', 1);
INSERT INTO record_derived_fields VALUES ('bccns-015', 'places', 'curated', 'team', 1);
INSERT INTO communities VALUES ('Africville', 6, 3, 44.67, -63.62, 1, 'Government of Nova Scotia, African Nova Scotian Family Names by Region (https://data.novascotia.ca/datasets/kbzq-tfz7)');
INSERT INTO communities VALUES ('Preston', 3, 3, 44.71, -63.44, 1, 'Government of Nova Scotia, African Nova Scotian Family Names by Region (https://data.novascotia.ca/datasets/kbzq-tfz7)');
INSERT INTO communities VALUES ('Birchtown', 5, 3, 43.75, -65.37, 1, 'Government of Nova Scotia, African Nova Scotian Family Names by Region (https://data.novascotia.ca/datasets/kbzq-tfz7)');
INSERT INTO communities VALUES ('Cherry Brook', 2, 1, 44.7, -63.47, 1, 'Government of Nova Scotia, African Nova Scotian Family Names by Region (https://data.novascotia.ca/datasets/kbzq-tfz7)');
INSERT INTO communities VALUES ('Hammonds Plains', 1, 1, 44.7, -63.78, 1, 'Government of Nova Scotia, African Nova Scotian Family Names by Region (https://data.novascotia.ca/datasets/kbzq-tfz7)');
INSERT INTO communities VALUES ('Shelburne', 4, 2, 43.76, -65.32, 1, 'Government of Nova Scotia, African Nova Scotian Family Names by Region (https://data.novascotia.ca/datasets/kbzq-tfz7)');
INSERT INTO crosswalk VALUES ('Black Loyalist', 'Current term for people who arrived in Nova Scotia after the American Revolution and were recorded in the Book of Negroes and related registers.', 'draft for community review');
INSERT INTO crosswalk_historical_terms VALUES ('Black Loyalist', 'Book of Negroes');
INSERT INTO crosswalk_historical_terms VALUES ('Black Loyalist', 'Loyalist');
INSERT INTO crosswalk VALUES ('Black Refugee', 'Current term for people who arrived in Nova Scotia at the close of the War of 1812 and were recorded in government settlement documents.', 'draft for community review');
INSERT INTO crosswalk_historical_terms VALUES ('Black Refugee', 'Black Refugees');
INSERT INTO crosswalk_historical_terms VALUES ('Black Refugee', 'Refugees');
INSERT INTO crosswalk VALUES ('African Nova Scotian', 'Current term for people of African descent in Nova Scotia and their communities.', 'draft for community review');
INSERT INTO crosswalk_historical_terms VALUES ('African Nova Scotian', 'African Nova Scotian');
INSERT INTO crosswalk_historical_terms VALUES ('African Nova Scotian', 'Black Nova Scotian');
INSERT INTO crosswalk VALUES ('enslaved person', 'Use ''enslaved person'' rather than a noun that defines a person by enslavement. Historical records may use older wording; that wording is retained in original_terms only.', 'draft for community review');
INSERT INTO crosswalk VALUES ('No. 2 Construction Battalion', 'Unit raised in Nova Scotia during the First World War, recorded in the nominal roll held by Nova Scotia Archives.', 'draft for community review');
INSERT INTO crosswalk_historical_terms VALUES ('No. 2 Construction Battalion', 'No. 2 Construction Battalion');

CREATE VIEW v_record_search AS
SELECT r.id, r.title, r.description, r.date_display, r.start_date, r.end_date,
       r.resource_type, r.source_id, r.source_institution, r.original_id,
       r.original_url, r.digitization_status, r.access_information,
       r.access_info_level,
       group_concat(DISTINCT p.person) AS people,
       group_concat(DISTINCT pl.place) AS places,
       group_concat(DISTINCT c.community) AS communities,
       group_concat(DISTINCT s.subject) AS subjects
FROM records r
LEFT JOIN record_people p ON p.record_id = r.id
LEFT JOIN record_places pl ON pl.record_id = r.id
LEFT JOIN record_communities c ON c.record_id = r.id
LEFT JOIN record_subjects s ON s.record_id = r.id
GROUP BY r.id;

CREATE VIEW v_coverage_by_institution AS
SELECT source_institution, COUNT(*) AS record_count,
       SUM(CASE WHEN digitization_status = 'digitized' THEN 1 ELSE 0 END) AS digitized_count
FROM records GROUP BY source_institution;

CREATE VIEW v_coverage_by_community AS
SELECT community, COUNT(*) AS indexed_count,
       SUM(CASE WHEN r.digitization_status = 'digitized' THEN 1 ELSE 0 END) AS digitized_count
FROM record_communities rc JOIN records r ON r.id = rc.record_id
GROUP BY community;

COMMIT;
