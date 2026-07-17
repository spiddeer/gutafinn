import { describe, expect, it } from "vitest"

import { buildDayPlan } from "@/lib/day-planner"
import type { ApiPlace } from "@/lib/places"

const place = (id: string, lat: number, lng: number): ApiPlace => ({
  id,
  name: id,
  category: "sevardhet",
  lat,
  lng,
  description: id,
})

describe("day planner", () => {
  it("orders saved places by the nearest next stop from GPS", () => {
    const plan = buildDayPlan({
      places: [place("far", 57.7, 18.3), place("near", 57.501, 18.501), place("middle", 57.55, 18.5)],
      origin: { lat: 57.5, lng: 18.5 },
      travelMode: "bicycle",
    })

    expect(plan.stops.map((stop) => stop.place.id)).toEqual(["near", "middle", "far"])
    expect(plan.stops.every((stop) => stop.origin !== null)).toBe(true)
    expect(plan.totalDistanceKm).toBeGreaterThan(0)
    expect(plan.totalTravelMinutes).toBeGreaterThan(0)
  })

  it("starts at the first saved place when GPS is unavailable", () => {
    const plan = buildDayPlan({
      places: [place("first-saved", 57.5, 18.5), place("next", 57.51, 18.5)],
      origin: null,
      travelMode: "walk",
    })

    expect(plan.stops[0]).toMatchObject({
      place: { id: "first-saved" },
      origin: null,
      distanceFromPreviousKm: null,
      travelMinutes: null,
    })
    expect(plan.stops[1].origin).toEqual({ lat: 57.5, lng: 18.5 })
  })

  it("deduplicates, ignores invalid coordinates, and caps long plans", () => {
    const valid = Array.from({ length: 10 }, (_, index) => place(`place-${index}`, 57.5 + index / 100, 18.5))
    const plan = buildDayPlan({
      places: [valid[0], valid[0], place("invalid", Number.NaN, 18.5), ...valid.slice(1)],
      origin: { lat: 57.49, lng: 18.5 },
      travelMode: "car",
      maxStops: 3,
    })

    expect(plan.stops).toHaveLength(3)
    expect(plan.omittedCount).toBe(7)
    expect(new Set(plan.stops.map((stop) => stop.place.id)).size).toBe(3)
  })
})
