const fs = require("fs");
const path = require("path");

const DEFAULT_OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const FOOD = new Set([
  "restaurant", "cafe", "fast_food", "bar", "pub", "ice_cream",
  "food_court", "biergarten",
]);
const FOOD_SHOPS = new Set([
  "farm", "deli", "bakery", "cheese", "coffee", "tea", "alcohol",
  "beverages", "seafood", "greengrocer", "confectionery", "chocolate",
]);
const LOCAL_SHOPS = new Set([
  "craft", "gift", "antiques", "art", "books", "florist",
]);
const FAMILY_LEISURE = new Set([
  "playground", "water_park", "miniature_golf",
]);
const FAMILY_TOURISM = new Set(["zoo", "theme_park"]);
const ACTIVITIES = new Set([
  "golf_course", "horse_riding", "swimming_pool", "water_park", "miniature_golf",
  "playground", "disc_golf_course", "bowling_alley", "escape_game",
]);
const VISITOR_SPORTS = new Set([
  "surfing", "climbing", "canoe", "kayaking", "sailing", "golf",
  "horse_racing", "disc_golf",
]);
const NATURE = new Set([
  "peak", "cliff", "cave_entrance", "spring", "rock", "stone", "waterfall",
  "wetland", "wood", "heath",
]);
const CATEGORY_ORDER = [
  "strand", "mat", "sevardhet", "smultronstallen", "natur", "familj",
  "aktivitet", "shopping",
];
const LEGACY_EXCLUDED_DESCRIPTIONS = new Set([
  "Aktivitet", "Aktivitet och idrott", "Apotek", "Bensinstation", "Butik", "Färjeterminal", "Idrottsanläggning",
  "Laddstation", "Service", "Sjukhus", "Småbåtshamn", "Träningsanläggning",
  "Vårdcentral",
]);
const GOTLAND_BBOX = "56.85,17.80,58.45,19.55";

const OVERPASS_SELECTORS = [
  '["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|biergarten)$"]["name"]',
  '["tourism"~"^(museum|gallery|attraction|artwork)$"]["name"]',
  '["historic"]["name"]',
  '["amenity"="place_of_worship"]["name"]',
  '["natural"="beach"]["name"]',
  '["leisure"~"^(beach_resort|bathing_place)$"]["name"]',
  '["leisure"~"^(golf_course|horse_riding|swimming_pool|water_park|miniature_golf|playground|disc_golf_course|bowling_alley|escape_game|nature_reserve|picnic_site)$"]["name"]',
  '["sport"~"^(surfing|climbing|canoe|kayaking|sailing|golf|horse_racing|disc_golf)$"]["name"]',
  '["amenity"~"^(bicycle_rental|boat_rental)$"]["name"]',
  '["natural"~"^(peak|cliff|cave_entrance|spring|rock|stone|waterfall|wetland|wood|heath)$"]["name"]',
  '["boundary"="protected_area"]["name"]',
  '["tourism"="viewpoint"]["name"]',
  '["shop"~"^(farm|deli|bakery|cheese|coffee|tea|alcohol|beverages|seafood|greengrocer|confectionery|chocolate)$"]["name"]',
  '["shop"~"^(craft|gift|antiques|art|books|florist)$"]["name"]',
  '["tourism"~"^(zoo|theme_park)$"]["name"]',
];

const DESCRIPTION_LABELS = {
  "amenity:restaurant": "Restaurang",
  "amenity:cafe": "Café",
  "amenity:fast_food": "Snabbmat",
  "amenity:bar": "Bar",
  "amenity:pub": "Pub",
  "amenity:ice_cream": "Glass",
  "amenity:place_of_worship": "Kyrka och besöksmål",
  "tourism:museum": "Museum",
  "tourism:gallery": "Galleri",
  "tourism:attraction": "Besöksmål",
  "tourism:viewpoint": "Utsiktsplats",
  "tourism:zoo": "Djurpark",
  "tourism:theme_park": "Temapark",
  "natural:beach": "Badstrand",
  "leisure:beach_resort": "Badplats",
  "leisure:bathing_place": "Badplats",
  "leisure:playground": "Lekplats",
  "leisure:nature_reserve": "Naturreservat",
  "leisure:picnic_site": "Rast- och picknickplats",
  "leisure:golf_course": "Golfbana",
  "leisure:horse_riding": "Ridning",
  "leisure:swimming_pool": "Bad och simning",
  "leisure:miniature_golf": "Minigolf",
  "leisure:water_park": "Vattenpark",
  "leisure:disc_golf_course": "Discgolfbana",
  "leisure:bowling_alley": "Bowling",
  "leisure:escape_game": "Escape room",
  "boundary:protected_area": "Skyddat naturområde",
  "amenity:bicycle_rental": "Cykeluthyrning",
  "amenity:boat_rental": "Båtuthyrning",
  "natural:peak": "Utsikts- och höjdpunkt",
  "natural:cliff": "Klint och naturupplevelse",
  "natural:cave_entrance": "Grotta",
  "natural:spring": "Källa",
  "natural:rock": "Rauk- och klippformation",
  "natural:stone": "Stenformation",
  "natural:waterfall": "Vattenfall",
  "natural:wetland": "Våtmark",
  "natural:wood": "Skogsområde",
  "natural:heath": "Hedmark",
  "historic:castle": "Slott eller borg",
  "historic:ruins": "Historisk ruin",
  "historic:archaeological_site": "Fornlämning",
  "historic:fort": "Historisk befästning",
  "historic:city_gate": "Historisk stadsport",
  "historic:manor": "Historisk herrgård",
  "historic:memorial": "Minnesmärke",
  "historic:monument": "Monument",
  "shop:farm": "Gårdsbutik",
  "shop:deli": "Delikatessbutik",
  "shop:bakery": "Bageri",
  "shop:cheese": "Ostbutik",
  "shop:coffee": "Kaffehandel",
  "shop:tea": "Tehandel",
  "shop:alcohol": "Dryckesbutik",
  "shop:beverages": "Dryckesbutik",
  "shop:seafood": "Fisk och skaldjur",
  "shop:greengrocer": "Frukt och grönt",
  "shop:confectionery": "Konfektyr",
  "shop:chocolate": "Chokladbutik",
  "shop:craft": "Lokalt hantverk",
  "shop:gift": "Present- och souvenirbutik",
  "shop:antiques": "Antikhandel",
  "shop:art": "Konstbutik",
  "shop:books": "Bokhandel",
  "shop:florist": "Blomsterbutik",
  "sport:surfing": "Surfing",
  "sport:climbing": "Klättring",
  "sport:canoe": "Kanotpaddling",
  "sport:kayaking": "Kajakpaddling",
  "sport:sailing": "Segling",
  "sport:golf": "Golf",
  "sport:horse_racing": "Hästsport",
  "sport:disc_golf": "Discgolf",
};

const CUISINE_LABELS = {
  regional: "gotländskt och regionalt",
  swedish: "svenskt",
  seafood: "fisk och skaldjur",
  pizza: "pizza",
  burger: "burgare",
  italian: "italienskt",
  thai: "thailändskt",
  indian: "indiskt",
  asian: "asiatiskt",
  kebab: "kebab",
  coffee_shop: "kaffe och fika",
};

function buildOverpassQuery(selected = OVERPASS_SELECTORS) {
  const selectors = selected
    .map((selector) => `  nwr(${GOTLAND_BBOX})${selector};`)
    .join("\n");
  return `[out:json][timeout:90];\n(\n${selectors}\n);\nout center tags;`;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "plats";
}

function has(tags, key, values) {
  return values.has(tags[key]);
}

function categoriesFor(tags) {
  const matches = new Set();

  if (tags.natural === "beach" || ["beach_resort", "bathing_place"].includes(tags.leisure)) {
    matches.add("strand");
  }
  if (has(tags, "amenity", FOOD)) matches.add("mat");
  if (has(tags, "shop", FOOD_SHOPS)) {
    matches.add("mat");
    matches.add("shopping");
  }
  if (has(tags, "shop", LOCAL_SHOPS)) matches.add("shopping");

  if (has(tags, "leisure", FAMILY_LEISURE) || has(tags, "tourism", FAMILY_TOURISM)) {
    matches.add("familj");
  }
  if (has(tags, "leisure", ACTIVITIES) || has(tags, "sport", VISITOR_SPORTS)
    || ["bicycle_rental", "boat_rental"].includes(tags.amenity)) {
    matches.add("aktivitet");
  }
  if (tags.tourism === "viewpoint" || tags.leisure === "picnic_site") {
    matches.add("smultronstallen");
  }
  if (has(tags, "natural", NATURE) || tags.leisure === "nature_reserve"
    || tags.boundary === "protected_area" || tags.tourism === "viewpoint"
    || tags.leisure === "picnic_site") {
    matches.add("natur");
  }
  if (["museum", "gallery", "attraction", "artwork"].includes(tags.tourism)
    || tags.historic || tags.amenity === "place_of_worship") {
    matches.add("sevardhet");
  }

  return CATEGORY_ORDER.filter((category) => matches.has(category));
}

function describe(tags, primaryCategory) {
  const sourcedDescription = String(tags["description:sv"] || tags.description || "")
    .replace(/\s+/g, " ").trim();
  if (sourcedDescription) return sourcedDescription.slice(0, 320);

  let label = null;
  for (const key of ["amenity", "tourism", "leisure", "natural", "boundary", "historic", "shop", "sport"]) {
    const candidate = DESCRIPTION_LABELS[`${key}:${tags[key]}`];
    if (candidate) {
      label = candidate;
      break;
    }
  }
  if (!label && tags.historic) label = "Historisk plats";
  if (!label && tags.shop) label = "Lokalt besöksmål";
  if (!label && tags.sport) label = "Aktivitet";
  if (!label) label = {
    strand: "Badplats",
    mat: "Mat och dryck",
    shopping: "Lokalt besöksmål",
    familj: "Familjeaktivitet",
    aktivitet: "Aktivitet",
    smultronstallen: "Utflyktsmål",
    natur: "Naturupplevelse",
    sevardhet: "Sevärdhet",
  }[primaryCategory];

  const facts = [];
  const cuisines = uniqueValues(tags.cuisine)
    .map((value) => CUISINE_LABELS[value] || value.replace(/_/g, " "));
  if (cuisines.length) facts.push(`Kök: ${cuisines.join(", ")}.`);
  if (tags.outdoor_seating === "yes") facts.push("Uteservering finns.");
  if (tags.takeaway === "yes") facts.push("Takeaway finns.");
  if (tags["diet:vegan"] === "yes" || tags["diet:vegetarian"] === "yes") {
    facts.push("Vegetariska eller veganska alternativ finns.");
  }
  return [`${label}.`, ...facts].join(" ");
}

function uniqueValues(...values) {
  return [...new Set(values.flatMap((value) => String(value || "").split(";"))
    .map((value) => value.trim()).filter(Boolean))];
}

function addressFor(tags) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = {
    street: street || null,
    postalCode: tags["addr:postcode"] || null,
    locality: tags["addr:city"] || tags["addr:place"] || null,
    municipality: tags["addr:municipality"] || null,
  };
  return Object.values(address).some(Boolean) ? address : undefined;
}

function osmTypePrefix(type) {
  return { node: "n", way: "w", relation: "r" }[type] || type[0];
}

function transformElement(element, verifiedAt = new Date().toISOString().slice(0, 10)) {
  const tags = element.tags || {};
  const categories = categoriesFor(tags);
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!tags.name || !categories.length || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const prefix = osmTypePrefix(element.type);
  const id = `${slugify(tags.name)}-${prefix}${element.id}`;
  const websiteValues = uniqueValues(tags.website, tags["contact:website"]);
  const phoneValues = uniqueValues(tags.phone, tags["contact:phone"]);
  const emailValues = uniqueValues(tags.email, tags["contact:email"]);
  const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;

  return {
    id,
    name: tags.name,
    category: categories[0],
    categories,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    description: describe(tags, categories[0]),
    ...(addressFor(tags) ? { address: addressFor(tags) } : {}),
    ...(tags.wheelchair ? { accessibility: tags.wheelchair } : {}),
    ...(websiteValues.length || phoneValues.length || emailValues.length ? {
      contacts: {
        websites: websiteValues.map((value) => ({ value })),
        phones: phoneValues.map((value) => ({ value })),
        emails: emailValues.map((value) => ({ value })),
      },
    } : {}),
    ...(tags.opening_hours ? { openingHours: { raw: tags.opening_hours } } : {}),
    source: { sourceUrl, externalId: id, lastVerifiedAt: verifiedAt },
  };
}

function transformElements(elements, verifiedAt) {
  const places = new Map();
  for (const element of elements) {
    const place = transformElement(element, verifiedAt);
    if (place) places.set(`${element.type}/${element.id}`, place);
  }
  return dedupePlaces([...places.values()])
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

function normalizedName(value) {
  return slugify(value).replace(/-/g, "");
}

function distanceKm(a, b) {
  const meanLat = ((a.lat + b.lat) / 2) * Math.PI / 180;
  const latKm = (a.lat - b.lat) * 111.32;
  const lngKm = (a.lng - b.lng) * 111.32 * Math.cos(meanLat);
  return Math.hypot(latKm, lngKm);
}

function richness(place) {
  return (place.address ? 5 : 0)
    + (place.contacts?.websites?.length || 0) * 3
    + (place.contacts?.phones?.length || 0) * 2
    + (place.contacts?.emails?.length || 0) * 2
    + (place.openingHours?.raw ? 2 : 0)
    + (place.accessibility ? 1 : 0)
    + (place.categories?.length || 0);
}

function mergeContactLists(primary = {}, secondary = {}) {
  const contacts = {};
  for (const type of ["websites", "phones", "emails"]) {
    const values = [...(primary[type] || []), ...(secondary[type] || [])];
    const unique = new Map(values.filter((item) => item?.value).map((item) => [item.value, item]));
    contacts[type] = [...unique.values()];
  }
  return Object.values(contacts).some((items) => items.length) ? contacts : undefined;
}

function mergeNearbyPlaces(a, b) {
  const [primary, secondary] = richness(a) >= richness(b) ? [a, b] : [b, a];
  const categories = CATEGORY_ORDER.filter((category) => (
    primary.categories.includes(category) || secondary.categories.includes(category)
  ));
  return {
    ...primary,
    category: categories[0],
    categories,
    address: primary.address || secondary.address,
    accessibility: primary.accessibility || secondary.accessibility,
    contacts: mergeContactLists(primary.contacts, secondary.contacts),
    openingHours: primary.openingHours || secondary.openingHours,
  };
}

function dedupePlaces(places, thresholdKm = 0.25) {
  const groups = new Map();
  for (const place of places) {
    const key = normalizedName(place.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(place);
  }

  const result = [];
  for (const group of groups.values()) {
    const merged = [];
    for (const place of group) {
      const matchIndex = merged.findIndex((candidate) => distanceKm(candidate, place) <= thresholdKm);
      if (matchIndex < 0) merged.push(place);
      else merged[matchIndex] = mergeNearbyPlaces(merged[matchIndex], place);
    }
    result.push(...merged);
  }
  return result;
}

function categoryCounts(places) {
  return Object.fromEntries(CATEGORY_ORDER.map((category) => [
    category,
    places.filter((place) => place.categories.includes(category)).length,
  ]));
}

function curateExistingPlaces(places) {
  return places.flatMap((place) => {
    if (LEGACY_EXCLUDED_DESCRIPTIONS.has(place.description)) return [];
    const categories = CATEGORY_ORDER.filter((category) => (
      category === place.category || place.categories?.includes(category)
    ));
    if (categories.length === 0) return [];
    return [{ ...place, category: categories[0], categories }];
  });
}

function chunks(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => (
    values.slice(index * size, (index + 1) * size)
  ));
}

async function fetchOsmElements(urls = DEFAULT_OVERPASS_URLS) {
  const batches = chunks(OVERPASS_SELECTORS, 2);
  const elements = [];

  for (const [batchIndex, selectors] of batches.entries()) {
    const query = buildOverpassQuery(selectors);
    let lastError;
    let payload;

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "user-agent": "Gutafinn/1.0 (https://gutafinn.tobtech.se)",
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(105_000),
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        payload = await response.json();
        if (!Array.isArray(payload.elements)) throw new Error("Overpass-svaret saknar elements");
        break;
      } catch (error) {
        lastError = new Error(`Overpass ${url}: ${error.message}`);
      }
    }
    if (!payload) throw lastError;
    elements.push(...payload.elements);
    console.log(`Databatch ${batchIndex + 1}/${batches.length}: ${payload.elements.length} OSM-objekt`);
  }

  return elements;
}

function writeSnapshots(places) {
  const backendPath = path.join(__dirname, "seed-data.json");
  const frontendPath = path.join(__dirname, "..", "public", "js", "places-data.js");
  fs.writeFileSync(backendPath, `${JSON.stringify(places, null, 2)}\n`);

  if (!fs.existsSync(frontendPath)) {
    console.warn("Frontend-snapshoten finns inte i denna miljö; endast seed-data.json uppdaterades.");
    return;
  }
  const existingFrontend = fs.readFileSync(frontendPath, "utf8");
  const corePlaces = places.map(({ id, name, category, lat, lng, description }) => ({
    id, name, category, lat, lng, description,
  }));
  fs.writeFileSync(frontendPath, renderFrontendSnapshot(existingFrontend, corePlaces));
}

function renderFrontendSnapshot(existingFrontend, corePlaces) {
  const marker = "const MOCK_PLACES = ";
  const suffixMarker = "\n/**\n * Hämtar platser.";
  const markerIndex = existingFrontend.indexOf(marker);
  const suffixIndex = existingFrontend.indexOf(suffixMarker, markerIndex);
  if (markerIndex < 0 || suffixIndex < 0) {
    throw new Error("Kunde inte avgränsa MOCK_PLACES i frontend-snapshoten");
  }
  return `${existingFrontend.slice(0, markerIndex)}${marker}${JSON.stringify(corePlaces, null, 2)};${existingFrontend.slice(suffixIndex)}`;
}

async function main() {
  if (process.argv.includes("--curate-existing")) {
    const seedPath = path.join(__dirname, "seed-data.json");
    const currentPlaces = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    const places = curateExistingPlaces(currentPlaces);
    writeSnapshots(places);
    console.log(`Renodlade ${currentPlaces.length} platser till ${places.length} besöksmål.`);
    console.table(categoryCounts(places));
    return;
  }

  const urls = process.env.OVERPASS_URL
    ? [process.env.OVERPASS_URL]
    : DEFAULT_OVERPASS_URLS;
  console.log("Hämtar namngivna Gotlandsplatser från OpenStreetMap …");
  const elements = await fetchOsmElements(urls);
  const places = transformElements(elements);
  const counts = categoryCounts(places);
  const empty = Object.entries(counts).filter(([, count]) => count === 0);
  if (empty.length) throw new Error(`Tomma kategorier: ${empty.map(([name]) => name).join(", ")}`);
  writeSnapshots(places);
  console.log(`Skrev ${places.length} platser.`);
  console.table(counts);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  CATEGORY_ORDER,
  buildOverpassQuery,
  categoriesFor,
  categoryCounts,
  curateExistingPlaces,
  dedupePlaces,
  renderFrontendSnapshot,
  describe,
  slugify,
  transformElement,
  transformElements,
  writeSnapshots,
};
