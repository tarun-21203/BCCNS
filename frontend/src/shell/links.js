// Cross-module links. Import these instead of hard-coding paths.

// A record's Access Card. Search (Member 2) owns this page; update here if
// its route changes.
export const recordHref = (id) => `/search/records/${encodeURIComponent(id)}`;

// Thread View focused on an entity or record node id, e.g. "community:africville".
export const threadHref = (nodeId) => `/threads?focus=${encodeURIComponent(nodeId)}`;
