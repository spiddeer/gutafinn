const ISSUE_TYPES = new Set([
  "hours",
  "contact",
  "location",
  "accessibility",
  "closed",
  "other",
]);

function validateCorrection(input) {
  const errors = [];
  const issueType = typeof input.issueType === "string" ? input.issueType.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const contactEmail = typeof input.email === "string" ? input.email.trim() : "";

  if (!ISSUE_TYPES.has(issueType)) errors.push("issueType is invalid");
  if (message.length < 10 || message.length > 1000) {
    errors.push("message must be between 10 and 1000 characters");
  }
  if (contactEmail.length > 254 || (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) {
    errors.push("email is invalid");
  }

  return {
    errors,
    values: { issueType, message, contactEmail: contactEmail || null },
  };
}

function createCorrection(database, placeId, input) {
  const parsed = validateCorrection(input);
  if (parsed.errors.length) return parsed;

  const place = database.prepare(
    "SELECT id FROM places WHERE id = ? AND is_active = 1"
  ).get(placeId);
  if (!place) return { ...parsed, notFound: true };

  const result = database.prepare(`
    INSERT INTO visitor_corrections (place_id, issue_type, message, contact_email)
    VALUES (?, ?, ?, ?)
  `).run(
    placeId,
    parsed.values.issueType,
    parsed.values.message,
    parsed.values.contactEmail,
  );
  return { ...parsed, id: Number(result.lastInsertRowid) };
}

module.exports = { ISSUE_TYPES, createCorrection, validateCorrection };
