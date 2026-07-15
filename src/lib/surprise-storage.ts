import type { PlaceCategory } from "./places"
import type { TimeBudget, TravelMode } from "./surprise"

export const SURPRISE_STORAGE_KEYS = {
  timeBudget: "gutafinn_surprise_time_budget",
  travelMode: "gutafinn_surprise_travel_mode",
  recentPlaceIds: "gutafinn_surprise_recent_place_ids",
  recentCategories: "gutafinn_surprise_recent_categories",
} as const

export const MAX_SURPRISE_HISTORY = 20

const TIME_BUDGET_VALUES = ["30", "1-2h", "half-day"] as const
const TRAVEL_MODE_VALUES = ["walk", "bicycle", "car"] as const
const PRODUCT_CATEGORY_VALUES: readonly PlaceCategory[] = ["Göra", "Se", "Äta"]

export type StorageLike = Pick<Storage, "getItem" | "setItem">

export type StoredSurpriseState = {
  timeBudget: TimeBudget | null
  travelMode: TravelMode | null
  recentPlaceIds: string[]
  recentCategories: PlaceCategory[]
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.some((item) => item === value)
}

export function parseTimeBudget(value: string | null): TimeBudget | null {
  if (value == null) return null
  return isOneOf(value, TIME_BUDGET_VALUES) ? (value as TimeBudget) : null
}

export function parseTravelMode(value: string | null): TravelMode | null {
  if (value == null) return null
  return isOneOf(value, TRAVEL_MODE_VALUES) ? (value as TravelMode) : null
}

export function normalizeRecentHistory(
  values: unknown,
  limit = MAX_SURPRISE_HISTORY,
  deduplicate = true,
): string[] {
  if (!Array.isArray(values) || limit <= 0) return []

  const normalized: string[] = []
  for (const value of values) {
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (!trimmed || (deduplicate && normalized.includes(trimmed))) continue
    normalized.push(trimmed)
    if (normalized.length === limit) break
  }
  return normalized
}

export function parseRecentPlaceIds(value: string | null): string[] {
  if (value == null) return []
  try {
    return normalizeRecentHistory(JSON.parse(value))
  } catch {
    return []
  }
}

export function parseRecentCategories(value: string | null): PlaceCategory[] {
  if (value == null) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return normalizeRecentHistory(
      parsed.filter(
        (category): category is PlaceCategory =>
          typeof category === "string" && isOneOf(category.trim(), PRODUCT_CATEGORY_VALUES),
      ),
      MAX_SURPRISE_HISTORY,
      false,
    ) as PlaceCategory[]
  } catch {
    return []
  }
}

export function serializeRecentHistory(values: readonly string[]): string {
  return JSON.stringify(normalizeRecentHistory(values))
}

export function serializeRecentCategories(values: readonly PlaceCategory[]): string {
  return JSON.stringify(normalizeRecentHistory(values, MAX_SURPRISE_HISTORY, false))
}

export function addRecentHistoryItem(history: readonly string[], value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed) return normalizeRecentHistory(history)
  return normalizeRecentHistory([trimmed, ...history.filter((item) => item !== trimmed)])
}

export function addRecentCategory(
  history: readonly PlaceCategory[],
  value: PlaceCategory,
): PlaceCategory[] {
  return normalizeRecentHistory([value, ...history], MAX_SURPRISE_HISTORY, false) as PlaceCategory[]
}

function safelyRead(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safelyWrite(storage: StorageLike, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private modes or when its quota is full.
  }
}

export function readSurpriseState(storage: StorageLike): StoredSurpriseState {
  return {
    timeBudget: parseTimeBudget(safelyRead(storage, SURPRISE_STORAGE_KEYS.timeBudget)),
    travelMode: parseTravelMode(safelyRead(storage, SURPRISE_STORAGE_KEYS.travelMode)),
    recentPlaceIds: parseRecentPlaceIds(safelyRead(storage, SURPRISE_STORAGE_KEYS.recentPlaceIds)),
    recentCategories: parseRecentCategories(
      safelyRead(storage, SURPRISE_STORAGE_KEYS.recentCategories),
    ),
  }
}

export function writeTimeBudget(storage: StorageLike, value: TimeBudget) {
  safelyWrite(storage, SURPRISE_STORAGE_KEYS.timeBudget, value)
}

export function writeTravelMode(storage: StorageLike, value: TravelMode) {
  safelyWrite(storage, SURPRISE_STORAGE_KEYS.travelMode, value)
}

export function writeRecentPlaceIds(storage: StorageLike, values: readonly string[]) {
  safelyWrite(storage, SURPRISE_STORAGE_KEYS.recentPlaceIds, serializeRecentHistory(values))
}

export function writeRecentCategories(storage: StorageLike, values: readonly PlaceCategory[]) {
  safelyWrite(storage, SURPRISE_STORAGE_KEYS.recentCategories, serializeRecentCategories(values))
}
