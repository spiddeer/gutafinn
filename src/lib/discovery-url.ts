import type { Category } from "@/lib/places"

const CATEGORY_SLUGS: Record<Exclude<Category, "Allt">, string> = {
  "Mat & dryck": "mat",
  "Sevärdheter": "sevardheter",
  Bad: "bad",
  Natur: "natur",
  Aktiviteter: "aktiviteter",
  Familj: "familj",
  Lokalt: "lokalt",
}

const SLUG_CATEGORIES = new Map(
  Object.entries(CATEGORY_SLUGS).map(([category, slug]) => [slug, category as Category]),
)
const PLACE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type DiscoveryUrlState = {
  query: string
  category: Category
  mapView: boolean
  selectedPlaceId: string | null
}

export function parseDiscoverySearch(search: string): DiscoveryUrlState {
  const params = new URLSearchParams(search)
  const query = (params.get("q") ?? "").trim().slice(0, 100)
  const category = SLUG_CATEGORIES.get(params.get("kategori") ?? "") ?? "Allt"
  const requestedPlaceId = params.get("plats")?.trim() ?? ""

  return {
    query,
    category,
    mapView: params.get("vy") === "karta",
    selectedPlaceId: PLACE_ID_PATTERN.test(requestedPlaceId) ? requestedPlaceId : null,
  }
}

export function buildDiscoverySearch(state: DiscoveryUrlState) {
  const params = new URLSearchParams()
  const query = state.query.trim().slice(0, 100)
  if (query) params.set("q", query)
  if (state.category !== "Allt") params.set("kategori", CATEGORY_SLUGS[state.category])
  if (state.mapView) params.set("vy", "karta")
  if (state.selectedPlaceId && PLACE_ID_PATTERN.test(state.selectedPlaceId)) {
    params.set("plats", state.selectedPlaceId)
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}
