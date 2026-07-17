function getMediaAsset(database, id) {
  if (!/^[0-9a-f]{32}$/.test(id)) return null;
  return database.prepare(`SELECT id, filename, mime_type, bytes, size_bytes
    FROM media_assets WHERE id=?`).get(id) || null;
}

module.exports = { getMediaAsset };
