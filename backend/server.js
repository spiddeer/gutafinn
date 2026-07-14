const express = require("express");
const db = require("./db");

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || "";

const app = express();
app.use(express.json());

const VALID_CATEGORIES = new Set(["strand", "sevardhet", "mat", "smultronstallen"]);

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

app.get("/api/places", (req, res) => {
  const places = db.prepare("SELECT id, name, category, lat, lng, description FROM places ORDER BY name").all();
  res.json(places);
});

function requireApiKey(req, res, next) {
  if (!API_KEY) return next(); // no key configured yet -> endpoint open, per current requirements
  if (req.get("X-API-Key") !== API_KEY) {
    return res.status(401).json({ error: "Invalid or missing API key." });
  }
  next();
}

app.post("/api/places", requireApiKey, (req, res) => {
  const { name, category, lat, lng, description } = req.body || {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required." });
  }
  if (!VALID_CATEGORIES.has(category)) {
    return res.status(400).json({ error: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` });
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat and lng must be numbers." });
  }

  let id = slugify(name);
  if (!id) id = "plats";
  const exists = db.prepare("SELECT 1 FROM places WHERE id = ?");
  let candidate = id;
  let suffix = 1;
  while (exists.get(candidate)) {
    candidate = `${id}-${++suffix}`;
  }
  id = candidate;

  db.prepare(
    "INSERT INTO places (id, name, category, lat, lng, description) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, name.trim(), category, lat, lng, description || null);

  const place = db.prepare("SELECT id, name, category, lat, lng, description FROM places WHERE id = ?").get(id);
  res.status(201).json(place);
});

app.listen(PORT, () => {
  console.log(`Gotlandsguiden API listening on port ${PORT}`);
});
