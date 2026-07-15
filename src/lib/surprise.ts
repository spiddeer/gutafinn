import {
  distanceKilometers,
  formatDistance,
  formatVerifiedDate,
  toProductCategory,
  type ApiPlace,
  type Coordinates,
  type PlaceCategory,
} from "@/lib/places"

export type TimeBudget = "30" | "1-2h" | "half-day"
export type TravelMode = "walk" | "bicycle" | "car"

export const DEFAULT_TIME_BUDGET: TimeBudget = "30"
export const DEFAULT_TRAVEL_MODE: TravelMode = "walk"
export const MAX_SURPRISE_RADIUS_KM = 10
export const SURPRISE_EXCLUDED_CATEGORIES = new Set(["boende", "service"])

export const TRAVEL_SPEED_KM_PER_HOUR: Record<TravelMode, number> = {
  walk: 4.8,
  bicycle: 15,
  car: 40,
}

export const ONE_WAY_ALLOWANCE_MINUTES: Record<TimeBudget, number> = {
  "30": 10,
  "1-2h": 25,
  "half-day": 45,
}

export const OSM_DIRECTION_ENGINES: Record<TravelMode, string> = {
  walk: "fossgis_osrm_foot",
  bicycle: "fossgis_osrm_bike",
  car: "fossgis_osrm_car",
}

export type SurpriseCandidate = {
  place: ApiPlace
  distanceKm: number
  productCategory: PlaceCategory
}

export type SurpriseCandidatePool = {
  candidates: SurpriseCandidate[]
  radiusKm: number
}

export type SurpriseRecommendation = SurpriseCandidate & {
  estimatedTravelMinutes: number
  reasons: string[]
}

type CandidateOptions = {
  places: ApiPlace[]
  position: Coordinates | null
  timeBudget: TimeBudget
  travelMode: TravelMode
  minimumCandidateCount?: number
}

type RecommendationOptions = CandidateOptions & {
  recentIds?: readonly string[]
  recentCategories?: readonly PlaceCategory[]
  random?: () => number
}

type ReasonOptions = {
  distanceKm?: number | null
  productCategory?: PlaceCategory | null
  recentCategories?: readonly PlaceCategory[]
  lastVerifiedAt?: string | null
}

function isValidCoordinates(value: Coordinates | null): value is Coordinates {
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

function hasValidPlaceCoordinates(place: ApiPlace) {
  return isValidCoordinates({ lat: place.lat, lng: place.lng })
}

function getVerifiedLabel(value?: string | null) {
  if (!value) return null

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const date = new Date(`${value}T12:00:00Z`)
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() + 1 !== Number(month) ||
      date.getUTCDate() !== Number(day)
    ) {
      return null
    }
  } else if (Number.isNaN(new Date(value).getTime())) {
    return null
  }

  return formatVerifiedDate(value)
}

export function getInitialRadiusKm(timeBudget: TimeBudget, travelMode: TravelMode) {
  const travelHours = ONE_WAY_ALLOWANCE_MINUTES[timeBudget] / 60
  return Math.min(MAX_SURPRISE_RADIUS_KM, TRAVEL_SPEED_KM_PER_HOUR[travelMode] * travelHours)
}

export function estimateTravelMinutes(distanceKm: number, travelMode: TravelMode) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null
  return Math.max(1, Math.round((distanceKm / TRAVEL_SPEED_KM_PER_HOUR[travelMode]) * 60))
}

export function buildOpenStreetMapDirectionsUrl(
  origin: Coordinates,
  destination: Coordinates,
  travelMode: TravelMode,
) {
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) return null

  const url = new URL("https://www.openstreetmap.org/directions")
  url.searchParams.set("engine", OSM_DIRECTION_ENGINES[travelMode])
  url.searchParams.set(
    "route",
    `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`,
  )
  return url.toString()
}

export function getSurpriseCandidates({
  places,
  position,
  timeBudget,
  travelMode,
  minimumCandidateCount = 5,
}: CandidateOptions): SurpriseCandidatePool | null {
  if (!isValidCoordinates(position)) return null

  const validCandidates = places
    .filter(
      (place) =>
        hasValidPlaceCoordinates(place) && !SURPRISE_EXCLUDED_CATEGORIES.has(place.category),
    )
    .map((place) => ({
      place,
      distanceKm: distanceKilometers(position, { lat: place.lat, lng: place.lng }),
      productCategory: toProductCategory(place.category),
    }))
    .filter((candidate) => Number.isFinite(candidate.distanceKm))

  const targetCount = Math.max(1, Math.floor(minimumCandidateCount))
  let radiusKm = getInitialRadiusKm(timeBudget, travelMode)
  let candidates = validCandidates.filter((candidate) => candidate.distanceKm <= radiusKm)

  while (candidates.length < targetCount && radiusKm < MAX_SURPRISE_RADIUS_KM) {
    radiusKm = Math.min(MAX_SURPRISE_RADIUS_KM, radiusKm + 1)
    candidates = validCandidates.filter((candidate) => candidate.distanceKm <= radiusKm)
  }

  return { candidates, radiusKm }
}

export function buildRecommendationReasons({
  distanceKm,
  productCategory,
  recentCategories = [],
  lastVerifiedAt,
}: ReasonOptions) {
  const reasons: string[] = []

  if (distanceKm != null && Number.isFinite(distanceKm) && distanceKm >= 0) {
    reasons.push(`${formatDistance(distanceKm)} bort`)
  }

  if (productCategory && !recentCategories.includes(productCategory)) {
    reasons.push("En kategori du inte sett nyligen")
  }

  const verifiedLabel = getVerifiedLabel(lastVerifiedAt)
  if (verifiedLabel) reasons.push(`Verifierad ${verifiedLabel}`)

  return reasons.length > 0 ? reasons.slice(0, 2) : ["Ett oväntat stopp nära dig"]
}

export function selectSurpriseRecommendation({
  recentIds = [],
  recentCategories = [],
  random = Math.random,
  ...candidateOptions
}: RecommendationOptions): SurpriseRecommendation | null {
  const result = getSurpriseCandidates(candidateOptions)
  if (!result || result.candidates.length === 0) return null

  const recentIdSet = new Set(recentIds)
  const candidatesWithoutRecent = result.candidates.filter(
    (candidate) => !recentIdSet.has(candidate.place.id),
  )
  let selectionPool = candidatesWithoutRecent.length > 0 ? candidatesWithoutRecent : result.candidates

  const recentCategorySet = new Set(recentCategories)
  const diverseCandidates = selectionPool.filter(
    (candidate) => !recentCategorySet.has(candidate.productCategory),
  )
  if (diverseCandidates.length > 0) selectionPool = diverseCandidates

  const verifiedCandidates = selectionPool.filter((candidate) =>
    Boolean(getVerifiedLabel(candidate.place.lastVerifiedAt)),
  )
  if (verifiedCandidates.length > 0) selectionPool = verifiedCandidates

  const randomValue = random()
  const normalizedRandom = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
    : 0
  const selected = selectionPool[Math.floor(normalizedRandom * selectionPool.length)]
  const estimatedTravelMinutes = estimateTravelMinutes(selected.distanceKm, candidateOptions.travelMode)

  return {
    ...selected,
    estimatedTravelMinutes: estimatedTravelMinutes ?? 1,
    reasons: buildRecommendationReasons({
      distanceKm: selected.distanceKm,
      productCategory: selected.productCategory,
      recentCategories,
      lastVerifiedAt: selected.place.lastVerifiedAt,
    }),
  }
}
