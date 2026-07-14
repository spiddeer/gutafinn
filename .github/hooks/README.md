# Project-Specific Hooks for Gotlandsguiden

This directory contains automated validation and quality checks that run during code edits. Each hook enforces project-specific conventions and catches common issues early.

## Available Hooks

### 1. **data-validation.json**
Validates place data schema, category consistency, and coordinate bounds.

**Triggers:**
- `BeforeEdit`: Alerts before modifying `places-data.js`
- `AfterEdit`: Validates schema matches `{ id, name, category, lat, lng, description }`

**Use case:** Ensures place data integrity when adding or modifying the MOCK_PLACES array.

---

### 2. **code-quality.json**
Enforces code style, detects common pitfalls, and ensures consistency.

**Triggers:**
- `BeforeEdit` (JavaScript): Reminds about best practices
- `AfterEdit` (app.js): Detects console.log, floating promises, missing render() calls
- `AfterEdit` (style.css): Enforces CSS custom properties, checks for responsive design

**Use case:** Catches bugs like state mutations without render(), mixed async/await patterns, and hard-coded colors.

---

### 3. **performance-checks.json**
Detects blocking operations, unoptimized rendering, and performance anti-patterns.

**Triggers:**
- `AfterEdit` (app.js): Detects render() in loops, large datasets, missing debouncing
- `AfterEdit` (index.html): Checks for inline styles, missing integrity attributes, async/defer tags

**Use case:** Prevents performance regressions like rendering on every state change or loading large datasets synchronously.

---

### 4. **accessibility-seo.json**
Validates semantic HTML, ARIA labels, and accessibility attributes.

**Triggers:**
- `AfterEdit` (index.html): Checks for semantic elements, aria-labels, lang attribute, meta description
- `AfterEdit` (app.js): Checks for keyboard navigation, ARIA live regions, focus management

**Use case:** Ensures the app is accessible to screen readers and keyboard users, improves SEO.

---

### 5. **category-consistency.json**
Ensures place categories are consistent and data structure integrity.

**Triggers:**
- `AfterEdit` (places-data.js): Detects undefined/unused categories, validates category definitions

**Use case:** Catches typos in category keys (e.g., "strnad" instead of "strand") and orphaned category definitions.

---

## How Hooks Work

Hooks run automatically when you edit files matching their `path` glob patterns. They:

1. **Check** your code against project conventions
2. **Warn** if issues are found (non-blocking)
3. **Exit with code 1** if critical issues are detected (can block operations)

### Example Scenarios

**Adding a new place:**
```javascript
{ id: "my-place", name: "My Beach", category: "strnad", ... }
//                                      ↑
// Hook will catch: ⚠ Category 'strnad' used but not defined
```

**Modifying CSS colors:**
```css
.card {
  background: #3f9bc0;  /* Hard-coded color */
}
```
**Hook will suggest:** ⚠ Hard-coded colors detected (use CSS variables)

**Calling render() in a loop:**
```javascript
for (let place of places) {
  updateUI(place);
  render();  // ← Performance issue!
}
```
**Hook will catch:** ⚠ render() called in loop (will cause performance issues)

---

## Customizing Hooks

Each hook is a standalone JSON file. To modify:

1. **Edit the JSON** file (no special syntax needed)
2. **Update the `command`** field with your validation logic
3. **Test** by editing a matching file (hook runs automatically)

### Adding a New Hook

Create a new `.json` file in this directory:

```json
{
  "name": "my-hook",
  "description": "Validates X when editing Y",
  "hooks": [
    {
      "trigger": "AfterEdit",
      "path": "**/my-file.js",
      "command": "node -e \"console.log('My validation logic')\"",
      "description": "What this checks"
    }
  ]
}
```

---

## Integration with AI Agents

These hooks help AI coding agents:

1. **Catch mistakes** before code review (console.log left behind, wrong categories, etc.)
2. **Learn conventions** through repeated feedback
3. **Improve code quality** incrementally with project-specific guardrails

**For agents:** Hooks are non-intrusive. They provide guidance via console warnings but don't block operations unless critical issues are found.

---

## Troubleshooting

### Hooks not running?
- Verify the file path matches your glob pattern in the hook definition
- Check that the hook trigger matches your action (BeforeEdit, AfterEdit, etc.)

### Hook command not working?
- Test the Node.js command directly in a terminal
- Ensure file paths in the command are properly quoted
- Use `{FILE}` placeholder to reference the file being edited

### Too many warnings?
- Review the hook command logic (conditions are in the Node script)
- Adjust severity levels or disable specific checks as needed

---

## Performance Notes

Hooks run synchronously and should complete within 1-2 seconds. If a hook takes too long:

1. Simplify the validation logic
2. Use faster alternatives (regex instead of parsing entire AST)
3. Cache results across sequential edits if applicable

---

## Related

- [AGENTS.md](../AGENTS.md) — Project overview and architecture
- [places-data.js](../../js/places-data.js) — Place data schema and categories
- [app.js](../../js/app.js) — Core state management and render logic
