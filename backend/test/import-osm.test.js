const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CATEGORY_ORDER,
  categoriesFor,
  categoryCounts,
  curateExistingPlaces,
  dedupePlaces,
  renderFrontendSnapshot,
  transformElement,
  transformElements,
} = require("../import-osm");

test("OSM tags map to primary and secondary guide categories", () => {
  assert.deepEqual(
    categoriesFor({ tourism: "viewpoint" }),
    ["smultronstallen", "natur"]
  );
  assert.deepEqual(
    categoriesFor({ leisure: "playground" }),
    ["familj", "aktivitet"]
  );
  assert.deepEqual(
    categoriesFor({ tourism: "camp_site", leisure: "nature_reserve" }),
    ["natur"]
  );
  assert.deepEqual(categoriesFor({ tourism: "hotel" }), []);
  assert.deepEqual(categoriesFor({ amenity: "fuel" }), []);
  assert.deepEqual(categoriesFor({ amenity: "charging_station" }), []);
  assert.deepEqual(categoriesFor({ tourism: "information", information: "board" }), []);
  assert.deepEqual(categoriesFor({ tourism: "information", information: "office" }), []);
});

test("an OSM element becomes a sourced, enriched place", () => {
  const place = transformElement({
    type: "node",
    id: 123,
    lat: 57.64,
    lon: 18.29,
    tags: {
      name: "Gårdsbutik Åkanten",
      shop: "farm",
      opening_hours: "Mo-Fr 10:00-18:00",
      website: "https://example.test",
      "addr:street": "Testvägen",
      "addr:housenumber": "1",
      "addr:city": "Visby",
    },
  }, "2026-07-14");

  assert.equal(place.id, "gardsbutik-akanten-n123");
  assert.equal(place.category, "mat");
  assert.deepEqual(place.categories, ["mat", "shopping"]);
  assert.equal(place.description, "Gårdsbutik.");
  assert.equal(place.address.street, "Testvägen 1");
  assert.equal(place.contacts.websites[0].value, "https://example.test");
  assert.equal(place.openingHours.raw, "Mo-Fr 10:00-18:00");
  assert.equal(place.source.sourceUrl, "https://www.openstreetmap.org/node/123");
});

test("existing snapshots are curated without losing relevant enrichment", () => {
  const places = curateExistingPlaces([
    {
      id: "charger",
      name: "Laddplats",
      category: "service",
      categories: ["service"],
      description: "Laddstation",
    },
    {
      id: "hotel-restaurant",
      name: "Krogen",
      category: "boende",
      categories: ["boende", "mat"],
      description: "Restaurang",
      address: { locality: "Visby" },
    },
    {
      id: "generic-shop",
      name: "Vanlig butik",
      category: "shopping",
      categories: ["shopping"],
      description: "Butik",
    },
  ]);

  assert.deepEqual(places.map((place) => place.id), ["hotel-restaurant"]);
  assert.equal(places[0].category, "mat");
  assert.deepEqual(places[0].categories, ["mat"]);
  assert.equal(places[0].address.locality, "Visby");
});

test("duplicate Overpass elements are collapsed and every category can be counted", () => {
  const elements = CATEGORY_ORDER.map((category, index) => {
    const tagsByCategory = {
      strand: { natural: "beach" },
      mat: { amenity: "restaurant" },
      sevardhet: { historic: "ruins" },
      smultronstallen: { tourism: "viewpoint" },
      natur: { leisure: "nature_reserve" },
      familj: { leisure: "playground" },
      aktivitet: { sport: "surfing" },
      shopping: { shop: "craft" },
    };
    return {
      type: "node",
      id: index + 1,
      lat: 57 + index / 100,
      lon: 18 + index / 100,
      tags: { name: `Plats ${index + 1}`, ...tagsByCategory[category] },
    };
  });
  const places = transformElements([...elements, elements[0]], "2026-07-14");
  assert.equal(places.length, CATEGORY_ORDER.length);
  for (const count of Object.values(categoryCounts(places))) assert.ok(count > 0);
});

test("nearby node and way representations of the same place are merged", () => {
  const base = {
    name: "Samma gård",
    category: "shopping",
    categories: ["shopping"],
    lat: 57.5,
    lng: 18.5,
    description: "Gårdsbutik",
    source: { sourceUrl: "https://www.openstreetmap.org/node/1" },
  };
  const places = dedupePlaces([
    { ...base, id: "samma-gard-n1" },
    {
      ...base,
      id: "samma-gard-w2",
      lat: 57.5002,
      lng: 18.5002,
      categories: ["shopping", "familj"],
      contacts: { websites: [{ value: "https://example.test" }] },
      source: { sourceUrl: "https://www.openstreetmap.org/way/2" },
    },
    { ...base, id: "samma-gard-n3", lat: 57.6, lng: 18.6 },
  ]);

  assert.equal(places.length, 2);
  const enriched = places.find((place) => place.website || place.contacts?.websites?.length);
  assert.deepEqual(enriched.categories, ["familj", "shopping"]);
  assert.equal(enriched.contacts.websites[0].value, "https://example.test");
});

test("frontend snapshot generation preserves loader functions after the data array", () => {
  const source = `const CATEGORIES = {};\n\nconst MOCK_PLACES = [\n  { id: "old" }\n];\n\n/**\n * Hämtar platser.\n */\nasync function loadPlaces() { return MOCK_PLACES; }\n`;
  const output = renderFrontendSnapshot(source, [{ id: "new" }]);
  assert.match(output, /"id": "new"/);
  assert.doesNotMatch(output, /id: "old"/);
  assert.match(output, /async function loadPlaces/);
});
