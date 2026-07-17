import { distanceKilometers, type ApiPlace, type Coordinates } from "@/lib/places"
import { estimateTravelMinutes, type TravelMode } from "@/lib/surprise"

export const MAX_DAY_PLAN_STOPS = 8

export type DayPlanStop = {
  place: ApiPlace
  origin: Coordinates | null
  distanceFromPreviousKm: number | null
  travelMinutes: number | null
}

export type DayPlan = {
  stops: DayPlanStop[]
  totalDistanceKm: number
  totalTravelMinutes: number
  omittedCount: number
}

function validCoordinates(value: Coordinates | null): value is Coordinates {
  return Boolean(
    value &&
      Number.isFinite(value.lat) &&
      value.lat >= -90 &&
      value.lat <= 90 &&
      Number.isFinite(value.lng) &&
      value.lng >= -180 &&
      value.lng <= 180,
  )
}

function placeCoordinates(place: ApiPlace): Coordinates | null {
  const coordinates = { lat: place.lat, lng: place.lng }
  return validCoordinates(coordinates) ? coordinates : null
}

export function buildDayPlan({
  places,
  origin,
  travelMode,
  maxStops = MAX_DAY_PLAN_STOPS,
}: {
  places: readonly ApiPlace[]
  origin: Coordinates | null
  travelMode: TravelMode
  maxStops?: number
}): DayPlan {
  const seen = new Set<string>()
  const remaining = places.filter((place) => {
    if (seen.has(place.id) || !placeCoordinates(place)) return false
    seen.add(place.id)
    return true
  })
  const stopLimit = Math.max(1, Math.floor(maxStops))
  const eligibleCount = remaining.length
  const stops: DayPlanStop[] = []
  let current = validCoordinates(origin) ? origin : null

  if (!current && remaining.length > 0) {
    const first = remaining.shift()!
    stops.push({
      place: first,
      origin: null,
      distanceFromPreviousKm: null,
      travelMinutes: null,
    })
    current = placeCoordinates(first)
  }

  while (current && remaining.length > 0 && stops.length < stopLimit) {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    for (let index = 0; index < remaining.length; index += 1) {
      const coordinates = placeCoordinates(remaining[index])!
      const distance = distanceKilometers(current, coordinates)
      if (distance < nearestDistance) {
        nearestIndex = index
        nearestDistance = distance
      }
    }

    const [place] = remaining.splice(nearestIndex, 1)
    const nextCoordinates = placeCoordinates(place)!
    stops.push({
      place,
      origin: current,
      distanceFromPreviousKm: nearestDistance,
      travelMinutes: estimateTravelMinutes(nearestDistance, travelMode),
    })
    current = nextCoordinates
  }

  return {
    stops,
    totalDistanceKm: stops.reduce((total, stop) => total + (stop.distanceFromPreviousKm ?? 0), 0),
    totalTravelMinutes: stops.reduce((total, stop) => total + (stop.travelMinutes ?? 0), 0),
    omittedCount: Math.max(0, eligibleCount - stops.length),
  }
}
