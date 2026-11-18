import assert from "node:assert/strict";
import { buildGeocodeQueries, dedupeGeocodeHits, proximityForArea } from "../src/lib/ppaGeocode.ts";

const queries = buildGeocodeQueries("UI sec.", "Ibadan North, Oyo");
assert.ok(queries.some((query) => query.includes("Secretariat")));
assert.ok(queries.some((query) => query.includes("Ibadan North, Oyo")));
assert.equal(proximityForArea("Ibadan North, Oyo"), "3.947,7.3775");
assert.equal(proximityForArea("Minna, Niger"), "6.547,9.5836");
assert.equal(proximityForArea("Somewhere, Nigeria"), "8.6753,9.082");

const hits = dedupeGeocodeHits([
  { id: "1", label: "University of Ibadan", lng: 3.9, lat: 7.44 },
  { id: "2", label: "University of Ibadan", lng: 3.9004, lat: 7.4402 },
  { id: "3", label: "Outside", lng: 20, lat: 40 },
]);
assert.equal(hits.length, 1);

console.log(JSON.stringify({ ok: true }));
