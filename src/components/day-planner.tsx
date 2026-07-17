import {
  ArrowLeft,
  Bike,
  Car,
  Footprints,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Timer,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { buildDayPlan } from "@/lib/day-planner"
import { formatDistance, toProductCategory, type ApiPlace, type Coordinates } from "@/lib/places"
import type { TravelMode } from "@/lib/surprise"
import { cn } from "@/lib/utils"

const travelOptions: Array<{ value: TravelMode; label: string; icon: LucideIcon }> = [
  { value: "walk", label: "Till fots", icon: Footprints },
  { value: "bicycle", label: "Cykel", icon: Bike },
  { value: "car", label: "Bil", icon: Car },
]

export function DayPlanner({
  places,
  position,
  locationState,
  onBack,
  onRequestLocation,
  onNavigate,
}: {
  places: ApiPlace[]
  position: Coordinates | null
  locationState: "idle" | "loading" | "ready" | "unavailable"
  onBack: () => void
  onRequestLocation: () => void
  onNavigate: (origin: Coordinates | null, place: ApiPlace, travelMode: TravelMode) => void
}) {
  const [travelMode, setTravelMode] = useState<TravelMode>("car")
  const plan = useMemo(
    () => buildDayPlan({ places, origin: position, travelMode }),
    [places, position, travelMode],
  )

  return (
    <section className="min-h-screen bg-background px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <header className="grid grid-cols-[44px_1fr_44px] items-center">
        <Button type="button" variant="secondary" size="icon" aria-label="Tillbaka till sparade platser" onClick={onBack}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-sea">Dagsplan</p>
        <span aria-hidden="true" />
      </header>

      <h1 className="mt-5 font-display text-[2.7rem] leading-[0.95] font-semibold tracking-[-0.035em] text-sea-deep">
        Din dag
        <span className="block italic">på Gotland.</span>
      </h1>
      <p className="mt-3 max-w-[38ch] text-[0.95rem] leading-6 text-muted-foreground">
        Vi ordnar dina sparade platser med närmaste nästa stopp. Avstånd och restid är uppskattningar – öppna varje etapp för faktisk väg.
      </p>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-bold text-sea-deep">Jag tar mig fram</legend>
        <div className="grid grid-cols-3 gap-2">
          {travelOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={travelMode === value}
              onClick={() => setTravelMode(value)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                travelMode === value
                  ? "border-sea-deep bg-sea-deep text-sea-deep-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {locationState !== "ready" && (
        <Card className="mt-5 flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-sea-deep">Starta från din position</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Utan GPS börjar planen vid platsen du sparade först.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onRequestLocation} disabled={locationState === "loading"}>
            {locationState === "loading" ? "Söker…" : "GPS"}
          </Button>
        </Card>
      )}

      {plan.stops.length === 0 ? (
        <Card className="mt-6 border-dashed p-6 text-center" role="status">
          <RouteIcon className="mx-auto size-7 text-sea" aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl font-semibold text-sea-deep">Spara ett par stopp först</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Gå tillbaka och tryck på hjärtat vid platser du vill hinna med.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mt-6 grid grid-cols-3 gap-2 p-4 text-center">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Stopp</p>
              <p className="mt-1 font-display text-2xl font-semibold text-sea-deep">{plan.stops.length}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Sträcka ca</p>
              <p className="mt-1 font-display text-2xl font-semibold text-sea-deep">
                {plan.totalDistanceKm > 0 ? formatDistance(plan.totalDistanceKm) : "0 km"}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Restid ca</p>
              <p className="mt-1 font-display text-2xl font-semibold text-sea-deep">{plan.totalTravelMinutes} min</p>
            </div>
          </Card>

          <ol className="mt-5 grid gap-3" aria-label="Föreslagen ordning för sparade platser">
            {plan.stops.map((stop, index) => (
              <li key={stop.place.id}>
                <Card className="flex items-start gap-3 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sea-deep text-sm font-extrabold text-sea-deep-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sea">
                      {toProductCategory(stop.place.category)}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold leading-tight text-sea-deep">{stop.place.name}</h2>
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
                      {stop.distanceFromPreviousKm == null ? (
                        <span>Första sparade stoppet</span>
                      ) : (
                        <>
                          <span>{formatDistance(stop.distanceFromPreviousKm)} från föregående</span>
                          <span className="inline-flex items-center gap-1"><Timer className="size-3.5" aria-hidden="true" /> ca {stop.travelMinutes} min</span>
                        </>
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3"
                      onClick={() => onNavigate(stop.origin, stop.place, travelMode)}
                    >
                      <Navigation className="size-4" aria-hidden="true" />
                      {stop.origin ? "Öppna etappen" : "Visa platsen"}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ol>

          {plan.omittedCount > 0 && (
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground" role="status">
              {plan.omittedCount} sparade platser är inte med. En dagsplan visar högst åtta stopp.
            </p>
          )}
        </>
      )}
    </section>
  )
}
