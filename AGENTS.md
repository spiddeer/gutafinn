# Gotlandsguiden – Agent Instructions

A Swedish location/place guide for Gotland with interactive Leaflet mapping, category filtering, search, and favorites management.

## Project Overview

- **Framework**: Vanilla JavaScript + Leaflet.js (mapping library)
- **Architecture**: Single-page app with state management (see `state` object in `js/app.js`)
- **Styling**: CSS custom properties (mobile-first, responsive)
- **Data**: Currently mock data from OpenStreetMap; can be replaced with API via `loadPlaces()`
- **Language**: Swedish (sv)
- **Key Features**:
  - Interactive map centered on Gotland (57.4684°N, 18.4867°E)
  - Place search & filtering by category (beaches, attractions, food & drink, hidden gems)
  - User location detection + map centering
  - Favorites system (localStorage: `gg_favorites`)
  - Category-specific markers with color and emoji

## Code Organization

```
index.html              # Single HTML page; Leaflet CSS injected; semantic structure
css/style.css           # Mobile-first responsive design; CSS custom properties (--color-*, --shadow-*, --radius)
js/app.js               # Core logic: map, markers, state management, event handlers
js/places-data.js       # Place data (mock) + category definitions (emoji, color, label)
```

## State Management

All app state lives in the `state` object (top of `app.js`):

```javascript
const state = {
  places: [],              // All places from loadPlaces()
  userLatLng: null,        // User's current position (from geolocation)
  activeCategory: "all",   // Filter: "all" | "favorites" | category key (e.g., "strand")
  query: "",               // Current search term (lowercased)
  favorites: {},           // User's favorited place IDs (from localStorage)
  selectedId: null,        // Currently selected place (for detail panel)
};
```

**Pattern**: All UI is derived from `state` via `render()`. Modify state, then call `render()` to update the DOM.

## Key Functions & Hooks

### Data Loading

- **`loadPlaces()`**: Returns `Promise<Array>` of place objects. Edit this to swap mock data for an API call.
- **Place schema**: `{ id, name, category, lat, lng, description }`

### Rendering & DOM

- **`render()`**: Main render function. Rebuilds the places list UI based on current filters and search.
- **`updateMapMarkers()`**: Adds/removes Leaflet markers for visible places.
- **`renderDetailPanel(placeId)`**: Shows place details (name, description, distance).

### Filtering & Search

- **`filterPlaces()`**: Applies `activeCategory` and `query` filters to `state.places`.
- **`setActiveCategory(key)`**: Updates `activeCategory`, re-filters, re-renders.
- **`setSearchQuery(text)`**: Updates `query`, re-filters, re-renders.

### Favorites

- **`toggleFavorite(placeId)`**: Adds/removes place from favorites, persists to localStorage (`gg_favorites`).
- **`loadFavorites()`**: Reads favorites from localStorage on app init.

### Map & Location

- **`map`**: Global Leaflet map instance (L.map).
- **`locateUser()`**: Uses Geolocation API; centers map on user's position.
- **`GOTLAND_CENTER`**: Default map center `[57.4684, 18.4867]`.
- **Zoom levels**: `DEFAULT_ZOOM: 9` (island view), `LOCATED_ZOOM: 12` (user found), `FOCUS_ZOOM: 14` (place detail).

## Categories

Defined in `places-data.js`:

```javascript
const CATEGORIES = {
  strand:          { label: "Stränder", color: "#3f9bc0", emoji: "🏖️" },
  sevardhet:       { label: "Sevärdheter", color: "#e0a458", emoji: "🏛️" },
  mat:             { label: "Mat & dryck", color: "#c0603f", emoji: "🍽️" },
  smultronStallen: { label: "Smultronställen", color: "#60a074", emoji: "🌿" },
};
```

When adding/modifying categories, update both the `CATEGORIES` object and the Leaflet marker logic.

## Common Tasks

### Adding a New Place

1. Add entry to `MOCK_PLACES` in `places-data.js`:
   ```javascript
   { id: "unique-id", name: "Place Name", category: "strand", lat: 57.xxx, lng: 18.xxx, description: "Short description" }
   ```
2. Ensure category key exists in `CATEGORIES`.
3. Call `render()` to refresh UI (automatic on app load).

### Connecting a Backend API

Edit `loadPlaces()` in `app.js`:

```javascript
async function loadPlaces() {
  const res = await fetch("/api/places");
  return await res.json();
}
```

Ensure returned data matches the place schema: `{ id, name, category, lat, lng, description }`.

### Modifying Styling

- **Colors**: Edit CSS custom properties in `:root` (top of `style.css`).
- **Responsive**: Media queries target `(max-width: 1023px)` for tablet/desktop.
- **Typography**: System font stack; adjust `font-family` or add Google Fonts.

### Adding a Feature

1. **Plan the state**: Does it require new properties in the `state` object?
2. **Add event listeners**: Attach to buttons/inputs in `index.html` or dynamically in `app.js`.
3. **Update state**: Modify `state` properties in response to user input.
4. **Implement render logic**: Add/update rendering logic in `render()` or related functions.
5. **Test on mobile**: Use mobile viewport or device emulation.

## Performance & Accessibility

- **Accessibility**: Semantic HTML (`<button>`, `<input>`), `aria-label`, `aria-hidden` attributes on decorative elements.
- **Performance**: Limit places rendered in DOM (consider pagination or virtualization if >500 places).
- **Mobile first**: Test on small screens; `100dvh` respects mobile browser UI.
- **Leaflet optimization**: Marker clustering available via Leaflet.markercluster plugin if needed for large datasets.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge).
- Relies on: Geolocation API, localStorage, ES6+ JavaScript.
- Leaflet: Supports IE 11+, but project targets modern browsers.

## Development Workflow

1. **Edit files** directly (no build step).
2. **Open `index.html`** in a browser (local server recommended to avoid CORS issues with geolocation).
3. **Check console** for errors (`F12` → Console).
4. **Test search, filtering, favorites, map interaction** on mobile emulation.

## Debugging Tips

- **State inspection**: Open console, type `state` to inspect current app state.
- **Geolocation issues**: May fail if page isn't HTTPS or user denies permission.
- **Marker rendering**: Check `markersById` object for marker references; compare with `state.places`.
- **Search edge cases**: Query is lowercased; ensure place names and descriptions are searchable.
