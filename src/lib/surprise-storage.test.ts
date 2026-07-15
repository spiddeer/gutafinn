import { describe, expect, it } from "vitest"

import {
  MAX_SURPRISE_HISTORY,
  SURPRISE_STORAGE_KEYS,
  addRecentCategory,
  addRecentHistoryItem,
  normalizeRecentHistory,
  parseRecentCategories,
  parseRecentPlaceIds,
  parseTimeBudget,
  parseTravelMode,
  readSurpriseState,
  serializeRecentHistory,
  type StorageLike,
  writeRecentCategories,
  writeRecentPlaceIds,
  writeTimeBudget,
  writeTravelMode,
} from "./surprise-storage"

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  return { storage, values }
}

describe("surprise storage parsing", () => {
  it("accepts known selections and rejects invalid values", () => {
    expect(parseTimeBudget("30")).toBe("30")
    expect(parseTimeBudget("whenever")).toBeNull()
    expect(parseTravelMode("walk")).toBe("walk")
    expect(parseTravelMode("teleport")).toBeNull()
  })

  it("resets corrupt or wrongly shaped history safely", () => {
    expect(parseRecentPlaceIds("{not-json")).toEqual([])
    expect(parseRecentPlaceIds(JSON.stringify({ id: "one" }))).toEqual([])
    expect(parseRecentCategories("[not-json")).toEqual([])
  })

  it("filters invalid IDs and non-product categories", () => {
    expect(parseRecentPlaceIds(JSON.stringify([" one ", 12, "", "two", "one"]))).toEqual([
      "one",
      "two",
    ])
    expect(
      parseRecentCategories(JSON.stringify(["Natur", "Allt", "Bad", "unknown", "Natur"])),
    ).toEqual(["Natur", "Bad", "Natur"])
  })

  it("bounds parsed and serialized history to twenty unique entries", () => {
    const ids = Array.from({ length: 25 }, (_, index) => `place-${index}`)
    expect(parseRecentPlaceIds(JSON.stringify(ids))).toHaveLength(MAX_SURPRISE_HISTORY)
    expect(JSON.parse(serializeRecentHistory(ids))).toEqual(ids.slice(0, MAX_SURPRISE_HISTORY))
    expect(normalizeRecentHistory(ids, 5)).toEqual(ids.slice(0, 5))
  })

  it("moves a repeated item to the front without growing the history", () => {
    expect(addRecentHistoryItem(["two", "one", "three"], "one")).toEqual([
      "one",
      "two",
      "three",
    ])
  })

  it("keeps a bounded category sequence so older category choices can expire", () => {
    const categories = Array.from(
      { length: 25 },
      (_, index) => (["Aktiviteter", "Natur", "Mat & dryck"] as const)[index % 3],
    )

    expect(parseRecentCategories(JSON.stringify(categories))).toEqual(
      categories.slice(0, MAX_SURPRISE_HISTORY),
    )
    expect(addRecentCategory(categories, "Mat & dryck")).toEqual(
      ["Mat & dryck", ...categories].slice(0, MAX_SURPRISE_HISTORY),
    )
  })
})

describe("surprise storage integration", () => {
  it("reads all persisted state through an injected storage implementation", () => {
    const { storage } = memoryStorage({
      [SURPRISE_STORAGE_KEYS.timeBudget]: "half-day",
      [SURPRISE_STORAGE_KEYS.travelMode]: "bicycle",
      [SURPRISE_STORAGE_KEYS.recentPlaceIds]: JSON.stringify(["place-2", "place-1"]),
      [SURPRISE_STORAGE_KEYS.recentCategories]: JSON.stringify(["Mat & dryck", "Natur"]),
    })

    expect(readSurpriseState(storage)).toEqual({
      timeBudget: "half-day",
      travelMode: "bicycle",
      recentPlaceIds: ["place-2", "place-1"],
      recentCategories: ["Mat & dryck", "Natur"],
    })
  })

  it("writes each state field under a clear Gutafinn key", () => {
    const { storage, values } = memoryStorage()

    writeTimeBudget(storage, "1-2h")
    writeTravelMode(storage, "car")
    writeRecentPlaceIds(storage, ["place-2", "place-1"])
    writeRecentCategories(storage, ["Aktiviteter", "Mat & dryck"])

    expect(values.get("gutafinn_surprise_time_budget")).toBe("1-2h")
    expect(values.get("gutafinn_surprise_travel_mode")).toBe("car")
    expect(values.get("gutafinn_surprise_recent_place_ids")).toBe('["place-2","place-1"]')
    expect(values.get("gutafinn_surprise_recent_categories")).toBe('["Aktiviteter","Mat & dryck"]')
  })

  it("returns safe defaults when storage itself throws", () => {
    const throwingStorage: StorageLike = {
      getItem: () => {
        throw new Error("blocked")
      },
      setItem: () => {
        throw new Error("blocked")
      },
    }

    expect(readSurpriseState(throwingStorage)).toEqual({
      timeBudget: null,
      travelMode: null,
      recentPlaceIds: [],
      recentCategories: [],
    })
    expect(() => writeRecentPlaceIds(throwingStorage, ["place-1"])).not.toThrow()
  })
})
