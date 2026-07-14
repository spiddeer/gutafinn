const fs = require("fs");
const path = require("path");
const db = require("./db");

const { count } = db.prepare("SELECT COUNT(*) AS count FROM places").get();
if (count > 0) {
  console.log(`Seed skipped – ${count} places already in database.`);
  process.exit(0);
}

const seedPath = path.join(__dirname, "seed-data.json");
const places = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const insert = db.prepare(
  "INSERT INTO places (id, name, category, lat, lng, description) VALUES (@id, @name, @category, @lat, @lng, @description)"
);
const insertAll = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});
insertAll(places);

console.log(`Seeded ${places.length} places.`);
