import { describe, expect, it } from "vitest"

import type { ApiPlace, Coordinates, PlaceCategory } from "@/lib/places"
import {
  MAX_SURPRISE_RADIUS_KM,
  buildOpenStreetMapDirectionsUrl,
  buildRecommendationReasons,
  estimateTravelMinutes,
  getInitialRadiusKm,
  getSurpriseCandidates,
  ONE_WAY_ALLOWANCE_MINUTES,
  selectSurpriseRecommendation,
  TRAVEL_SPEED_KM_PER_HOUR,
  type TimeBudget,
  type TravelMode,
} from "@/lib/surprise"

const origin: Coordinates = { lat: 57.333, lng: 18.711 }

function place(id: string, northKm: number, category = "natur", lastVerifiedAt: string | null = null): ApiPlace {
  return {
    id,
    name: `Plats ${id}`,
    category,
    lat: origin.lat + northKm / 111.2,
    lng: origin.lng,
    description: "En plats på Gotland",
    lastVerifiedAt,
  }
}

describe("surprise radius", () => {
  const budgets: TimeBudget[] = ["30", "1-2h", "half-day"]
  const modes: TravelMode[] = ["walk", "bicycle", "car"]

  for (const budget of budgets) {
    for (const mode of modes) {
      it(`calculates ${budget}/${mode} from its speed and one-way allowance`, () => {
        const expected = Math.min(
          MAX_SURPRISE_RADIUS_KM,
          TRAVEL_SPEED_KM_PER_HOUR[mode] * (ONE_WAY_ALLOWANCE_MINUTES[budget] / 60),
        )
        expect(getInitialRadiusKm(budget, mode)).toBeCloseTo(expected)
        expect(getInitialRadiusKm(budget, mode)).toBeLessThanOrEqual(MAX_SURPRISE_RADIUS_KM)
      })
    }
  }

  it("estimates travel time for each travel mode", () => {
    expect(estimateTravelMinutes(4.8, "walk")).toBe(60)
    expect(estimateTravelMinutes(15, "bicycle")).toBe(60)
    expect(estimateTravelMinutes(40, "car")).toBe(60)
    expect(estimateTravelMinutes(-1, "walk")).toBeNull()
  })
})

describe("OpenStreetMap directions", () => {
  const destination = { lat: 57.64, lng: 18.3 }

  for (const [mode, engine] of [
    ["walk", "fossgis_osrm_foot"],
    ["bicycle", "fossgis_osrm_bike"],
    ["car", "fossgis_osrm_car"],
  ] as const) {
    it(`uses the ${mode} engine`, () => {
      const value = buildOpenStreetMapDirectionsUrl(origin, destination, mode)
      const url = new URL(value!)

      expect(url.origin).toBe("https://www.openstreetmap.org")
      expect(url.searchParams.get("engine")).toBe(engine)
      expect(url.searchParams.get("route")).toBe("57.333,18.711;57.64,18.3")
    })
  }

  it("rejects invalid coordinates", () => {
    expect(
      buildOpenStreetMapDirectionsUrl(
        { lat: Number.NaN, lng: origin.lng },
        destination,
        "walk",
      ),
    ).toBeNull()
  })
})

describe("surprise candidates", () => {
  it("requires a valid GPS position", () => {
    const places = [place("near", 0.2)]
    expect(getSurpriseCandidates({ places, position: null, timeBudget: "30", travelMode: "walk" })).toBeNull()
    expect(
      getSurpriseCandidates({
        places,
        position: { lat: Number.NaN, lng: origin.lng },
        timeBudget: "30",
        travelMode: "walk",
      }),
    ).toBeNull()
    expect(
      selectSurpriseRecommendation({ places, position: null, timeBudget: "30", travelMode: "walk" }),
    ).toBeNull()
  })

  it("keeps the initial radius in a dense Visby-like pool", () => {
    const places = Array.from({ length: 6 }, (_, index) => place(`dense-${index}`, 0.1 + index * 0.1))
    const result = getSurpriseCandidates({ places, position: origin, timeBudget: "30", travelMode: "walk" })

    expect(result?.radiusKm).toBeCloseTo(0.8)
    expect(result?.candidates).toHaveLength(6)
  })

  it("expands a sparse pool in 1 km steps and excludes out-of-radius places", () => {
    const places = [
      place("one", 0.5),
      place("two", 1.5),
      place("three", 2.5),
      place("four", 3.5),
      place("five", 4.5),
      place("outside", 11),
    ]
    const result = getSurpriseCandidates({ places, position: origin, timeBudget: "30", travelMode: "walk" })

    expect(result?.radiusKm).toBeCloseTo(4.8)
    expect(result?.candidates.map((candidate) => candidate.place.id)).toEqual([
      "one",
      "two",
      "three",
      "four",
      "five",
    ])
  })

  it("stops sparse expansion at 10 km and ignores malformed coordinates", () => {
    const malformed = place("malformed", 0.2)
    malformed.lat = Number.NaN
    const result = getSurpriseCandidates({
      places: [place("near", 2), place("far", 12), malformed],
      position: origin,
      timeBudget: "30",
      travelMode: "walk",
    })

    expect(result?.radiusKm).toBe(MAX_SURPRISE_RADIUS_KM)
    expect(result?.candidates.map((candidate) => candidate.place.id)).toEqual(["near"])
  })

  it("excludes accommodation and service records from adventures", () => {
    const result = getSurpriseCandidates({
      places: [
        place("sight", 0.2, "sevardhet"),
        place("hotel", 0.3, "boende"),
        place("parking", 0.4, "service"),
      ],
      position: origin,
      timeBudget: "30",
      travelMode: "walk",
      minimumCandidateCount: 1,
    })

    expect(result?.candidates.map((candidate) => candidate.place.id)).toEqual(["sight"])
  })
})

describe("surprise selection", () => {
  it("does not repeat the first five suggestions when a pool of five permits it", () => {
    const places = Array.from({ length: 5 }, (_, index) => place(`place-${index}`, 0.2 + index * 0.1, "natur", "2026-07-14"))
    const recentIds: string[] = []

    for (let index = 0; index < 5; index += 1) {
      const recommendation = selectSurpriseRecommendation({
        places,
        position: origin,
        timeBudget: "30",
        travelMode: "walk",
        recentIds,
        random: () => 0,
      })
      expect(recommendation).not.toBeNull()
      recentIds.push(recommendation!.place.id)
    }

    expect(new Set(recentIds).size).toBe(5)
  })

  it("prefers a product category that was not recently shown over nearest-only ordering", () => {
    const recommendation = selectSurpriseRecommendation({
      places: [place("nearest", 0.1, "natur"), place("different", 0.6, "mat")],
      position: origin,
      timeBudget: "30",
      travelMode: "walk",
      minimumCandidateCount: 1,
      recentCategories: ["Natur"],
      random: () => 0,
    })

    expect(recommendation?.place.id).toBe("different")
    expect(recommendation?.productCategory).toBe("Mat & dryck")
  })

  it("uses injected randomness deterministically", () => {
    const places = [place("first", 0.1, "natur"), place("second", 0.2, "natur")]
    const options = {
      places,
      position: origin,
      timeBudget: "30" as const,
      travelMode: "walk" as const,
      minimumCandidateCount: 1,
    }

    expect(selectSurpriseRecommendation({ ...options, random: () => 0 })?.place.id).toBe("first")
    expect(selectSurpriseRecommendation({ ...options, random: () => 0.999 })?.place.id).toBe("second")
  })
})

describe("recommendation reasons", () => {
  it("returns at most two factual reasons", () => {
    expect(
      buildRecommendationReasons({
        distanceKm: 1.2,
        productCategory: "Mat & dryck",
        recentCategories: ["Natur"],
        lastVerifiedAt: "2026-07-14",
      }),
    ).toEqual(["1,2 km bort", "En kategori du inte sett nyligen"])
  })

  it("uses a valid verification date when the category is not new", () => {
    expect(
      buildRecommendationReasons({
        distanceKm: null,
        productCategory: "Sevärdheter",
        recentCategories: ["Sevärdheter"],
        lastVerifiedAt: "2026-07-14",
      }),
    ).toEqual(["Verifierad 14 juli 2026"])
  })

  it("rejects invalid dates and falls back for weak input", () => {
    expect(buildRecommendationReasons({ lastVerifiedAt: "2026-02-30" })).toEqual([
      "Ett oväntat stopp nära dig",
    ])
  })

  it("never emits opening-hours or weather claims", () => {
    const reasons = buildRecommendationReasons({
      distanceKm: 0.5,
      productCategory: "Aktiviteter",
      recentCategories: [] as PlaceCategory[],
      lastVerifiedAt: "2026-07-14",
    })
    expect(reasons.join(" ").toLocaleLowerCase("sv")).not.toMatch(/öppet|stängt|väder|regn|sol/)
  })
})
