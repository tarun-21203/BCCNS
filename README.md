# THREADS - Black History Discovery Hub

THREADS is a discovery platform designed to make Black history resources across institutions easier to find, explore, and connect.

The platform brings together archival metadata from multiple sources into a unified search experience while keeping original collections with their respective institutions.

**Live demo:** https://bccns.vercel.app

## Key Features

- **Unified Discovery Search:** Search and filter records across multiple institutions.
- **Access Cards & Provenance:** View the holding institution, access information, original record links, and metadata provenance.
- **Language Bridge:** Find records described with historical catalogue terms using modern search language. The terminology mapping is a draft for community review.
- **Cite or Stay Silent AI:** Ask questions in natural language. Answers cite the indexed records they rely on, and say so when the records don't contain enough evidence.
- **Silence Map:** See which communities and places the indexed sources cover. It measures our current index, not how much history exists.
- **Thread View:** Follow how records connect through shared people, places, communities, and subjects, with the supporting record for every connection.

**Planned:** Research Trail (next steps for accessing non-digitized or restricted material).

## Our Approach

THREADS acts as a discovery layer rather than a centralized archive. It references collection metadata and directs users to authoritative records held by their original institutions.

We aim to make historical information more discoverable while maintaining transparency, source attribution, and respect for archival context.

## Prototype Data

This proof of concept indexes a small sample of records from Nova Scotia Archives, Library and Archives Canada, and Dalhousie University Archives, selected for the demo. Community names come from the Government of Nova Scotia's open dataset *African Nova Scotian Family Names by Region*. Few or no results mean limited coverage in our index, not that no records exist.

## Built With

- **Frontend:** React 18, Vite, React Router, Leaflet, d3-force
- **Backend:** Python, FastAPI
- **AI:** Groq (`openai/gpt-oss-120b`), with citations checked in code and saved answers as a fallback
- **Data:** Normalized JSON records, per-source mapping files, SQLite schema
- **Hosting:** Vercel (static frontend + Python serverless API)

## Running Locally

- API: see [docs/RUN.md](docs/RUN.md)
- Frontend: see [frontend/README.md](frontend/README.md)
- Data model and provenance: see [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md)
- Deployment: see [docs/DEPLOY.md](docs/DEPLOY.md)
- Demo walkthrough: see [docs/DEMO.md](docs/DEMO.md)

---

**Built for the Black Cultural Centre for Nova Scotia Hackathon.**

