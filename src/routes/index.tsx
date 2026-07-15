import { createFileRoute } from "@tanstack/react-router"
import {
  Bookmark,
  Camera,
  Clock3,
  Footprints,
  Heart,
  Home,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  Star,
  Sun,
  Sunset,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import heroCoast from "@/assets/hero-coast.webp"
import raukarSea from "@/assets/raukar-sea.webp"
import saffronPancake from "@/assets/saffron-pancake.webp"
import toftaBeach from "@/assets/tofta-beach.webp"
import visbyRoses from "@/assets/visby-roses.webp"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({
  component: GutafinnPage,
})

type Category = "Allt" | "Göra" | "Se" | "Äta"
type PlaceCategory = Exclude<Category, "Allt">

type Place = {
  name: string
  kind: PlaceCategory
  tag: string
  distance: string
  walk: string
  rating: number
  img: string
  open: boolean
}

const places: Place[] = [
  {
    name: "Raukar vid Folhammar",
    kind: "Se",
    tag: "Naturupplevelse",
    distance: "1,2 km",
    walk: "16 min",
    rating: 4.8,
    img: raukarSea,
    open: true,
  },
  {
    name: "Surfers Cove Tofta",
    kind: "Göra",
    tag: "Strand & surf",
    distance: "3,4 km",
    walk: "42 min",
    rating: 4.7,
    img: toftaBeach,
    open: true,
  },
  {
    name: "Bakfickan Visby",
    kind: "Äta",
    tag: "Gotländska smaker",
    distance: "4,1 km",
    walk: "51 min",
    rating: 4.6,
    img: saffronPancake,
    open: true,
  },
  {
    name: "Ringmuren & rosorna",
    kind: "Se",
    tag: "Historia",
    distance: "4,8 km",
    walk: "58 min",
    rating: 4.9,
    img: visbyRoses,
    open: false,
  },
]

const categoryItems: Array<{ label: Category; icon: LucideIcon }> = [
  { label: "Allt", icon: Sun },
  { label: "Göra", icon: Waves },
  { label: "Se", icon: Camera },
  { label: "Äta", icon: Utensils },
]

const navItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Hem", icon: Home },
  { label: "Karta", icon: MapIcon },
  { label: "Nära", icon: LocateFixed },
  { label: "Sparat", icon: Bookmark },
]

function GutafinnPage() {
  const [category, setCategory] = useState<Category>("Allt")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [activeNav, setActiveNav] = useState("Hem")
  const [routeTarget, setRouteTarget] = useState<string | null>(null)

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("sv")

    return places.filter((place) => {
      const matchesCategory = category === "Allt" || place.kind === category
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [place.name, place.kind, place.tag]
          .join(" ")
          .toLocaleLowerCase("sv")
          .includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  const featuredPlace = filteredPlaces[0] ?? places[0]

  function toggleSaved(placeName: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(placeName)) next.delete(placeName)
      else next.add(placeName)
      return next
    })
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[440px] overflow-x-hidden bg-background shadow-[var(--shadow-float)]">
      <Hero />

      <div className="safe-bottom relative z-10 -mt-7 space-y-8 px-5">
        <SearchBar query={query} onQueryChange={setQuery} />
        <CategoryFilter selected={category} onSelect={setCategory} />

        <section aria-labelledby="nearby-heading">
          <SectionHeading id="nearby-heading">Närmast dig nu</SectionHeading>
          <FeaturedPlace
            place={featuredPlace}
            isSaved={saved.has(featuredPlace.name)}
            onToggleSaved={() => toggleSaved(featuredPlace.name)}
            onNavigate={() => setRouteTarget(featuredPlace.name)}
          />
          <p className="sr-only" role="status" aria-live="polite">
            {routeTarget ? `Rutt till ${routeTarget} är vald.` : ""}
          </p>
        </section>

        <section aria-labelledby="tonight-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <SectionHeading id="tonight-heading" className="mb-0">
              I kväll runt Ljugarn
            </SectionHeading>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {filteredPlaces.length} tips
            </span>
          </div>

          {filteredPlaces.length > 0 ? (
            <div className="space-y-3">
              {filteredPlaces.map((place) => (
                <CompactPlace
                  key={place.name}
                  place={place}
                  isSaved={saved.has(place.name)}
                  onToggleSaved={() => toggleSaved(place.name)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed p-6 text-center">
              <p className="font-display text-xl text-sea-deep">Prova ett annat sökord</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Det finns fler raukar, bad och smaker att hitta i närheten.
              </p>
            </Card>
          )}
        </section>

        <WeatherStrip />
      </div>

      <BottomNavigation active={activeNav} onSelect={setActiveNav} />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative h-[440px] overflow-hidden rounded-b-[36px] text-overlay-foreground">
      <img
        src={heroCoast}
        alt="Gotländsk kalkstenskust i varmt kvällsljus"
        className="absolute inset-0 size-full object-cover"
        fetchPriority="high"
      />
      <div className="hero-scrim absolute inset-0" aria-hidden="true" />

      <div className="relative flex h-full flex-col justify-between px-5 pb-14 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="flex h-10 items-center gap-2 rounded-full bg-overlay px-4 text-xs font-semibold tracking-wide backdrop-blur-md">
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-meadow opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-meadow" />
            </span>
            Live GPS
          </div>

          <button
            type="button"
            aria-label="Öppna profil"
            className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-overlay-foreground/55"
          >
            <Avatar className="border border-overlay-foreground/25 backdrop-blur-md">
              <AvatarFallback>
                <span className="font-display text-lg font-semibold" aria-hidden="true">
                  G
                </span>
              </AvatarFallback>
            </Avatar>
          </button>
        </div>

        <div>
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4" aria-hidden="true" />
            Ljugarn, Gotland
          </p>
          <h1 className="max-w-[350px] font-display text-[2.75rem] leading-[0.98] font-semibold tracking-[-0.035em]">
            God kväll,
            <span className="block italic">upptäck närmast.</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-overlay-foreground/85">24 platser inom 5 km</p>
        </div>
      </div>
    </section>
  )
}

function SearchBar({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  return (
    <Card className="flex h-16 items-center gap-3 rounded-2xl border-card px-4 shadow-[var(--shadow-float)]">
      <Search className="size-5 shrink-0 text-sea" aria-hidden="true" />
      <label htmlFor="place-search" className="sr-only">
        Sök plats
      </label>
      <input
        id="place-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Sök raukar, kaffe, badplats…"
        className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Button size="icon" aria-label="Använd min position">
        <Navigation className="size-5" aria-hidden="true" />
      </Button>
    </Card>
  )
}

function CategoryFilter({ selected, onSelect }: { selected: Category; onSelect: (value: Category) => void }) {
  return (
    <nav className="scrollbar-hidden -mx-5 flex gap-2 overflow-x-auto px-5" aria-label="Filtrera kategori">
      {categoryItems.map(({ label, icon: Icon }) => {
        const isActive = selected === label
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-pressed={isActive}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
              isActive
                ? "border-sea-deep bg-sea-deep text-sea-deep-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

function SectionHeading({ id, className, children }: { id: string; className?: string; children: string }) {
  return (
    <h2 id={id} className={cn("mb-4 font-display text-[1.65rem] leading-tight font-semibold text-sea-deep", className)}>
      {children}
    </h2>
  )
}

function FeaturedPlace({
  place,
  isSaved,
  onToggleSaved,
  onNavigate,
}: {
  place: Place
  isSaved: boolean
  onToggleSaved: () => void
  onNavigate: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-[238px] overflow-hidden">
        <img src={place.img} alt={place.name} className="size-full object-cover" />
        <Badge className="absolute left-4 top-4 bg-card/92 text-sea-deep backdrop-blur-md">{place.tag}</Badge>
        <Button
          type="button"
          variant="overlay"
          size="icon"
          className="absolute right-4 top-4"
          aria-label={isSaved ? `Ta bort ${place.name} från sparade` : `Spara ${place.name}`}
          aria-pressed={isSaved}
          onClick={onToggleSaved}
        >
          <Heart className={cn("size-5", isSaved && "fill-current")} aria-hidden="true" />
        </Button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">{place.kind}</p>
            <h3 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold text-sea-deep">{place.name}</h3>
          </div>
          <span className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-sand px-3 text-sm font-bold text-sand-foreground">
            <Star className="size-4 fill-current" aria-hidden="true" />
            {place.rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-sea" aria-hidden="true" />
            {place.distance}
          </span>
          <span className="flex items-center gap-1.5">
            <Footprints className="size-4 text-sea" aria-hidden="true" />
            {place.walk}
          </span>
          <span className={cn("flex items-center gap-1.5", place.open ? "text-meadow" : "text-muted-foreground")}>
            <span className={cn("size-2 rounded-full", place.open ? "bg-meadow" : "bg-muted-foreground")} aria-hidden="true" />
            {place.open ? "Öppet nu" : "Stängt nu"}
          </span>
        </div>

        <Button variant="poppy" className="mt-5 w-full" onClick={onNavigate}>
          <Navigation className="size-4" aria-hidden="true" />
          Ta mig hit
        </Button>
      </div>
    </Card>
  )
}

function CompactPlace({
  place,
  isSaved,
  onToggleSaved,
}: {
  place: Place
  isSaved: boolean
  onToggleSaved: () => void
}) {
  return (
    <Card className="flex items-center gap-3 rounded-2xl p-3">
      <img src={place.img} alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-sea">{place.tag}</p>
        <h3 className="mt-1 truncate font-display text-lg leading-tight font-semibold text-sea-deep">{place.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-current text-sand-foreground" aria-hidden="true" />
            {place.rating.toFixed(1)}
          </span>
          <span>{place.distance}</span>
          {place.open && <span className="text-meadow">Öppet</span>}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10"
        aria-label={isSaved ? `Ta bort ${place.name} från sparade` : `Spara ${place.name}`}
        aria-pressed={isSaved}
        onClick={onToggleSaved}
      >
        <Heart className={cn("size-4", isSaved && "fill-current text-poppy")} aria-hidden="true" />
      </Button>
    </Card>
  )
}

function WeatherStrip() {
  return (
    <section className="flex items-center gap-4 rounded-3xl bg-sea-deep p-5 text-sea-deep-foreground" aria-label="Kvällens väder">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-sea-deep-foreground/65">Kväll · Ljugarn</p>
        <p className="mt-1 font-display text-2xl font-semibold">19° · lugn bris</p>
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-sea-deep-foreground/75">
          <Sunset className="size-4 text-sand" aria-hidden="true" />
          Solnedgång 21:42
          <Clock3 className="ml-1 size-4 text-sand" aria-hidden="true" />
        </p>
      </div>
      <Sun className="size-16 shrink-0 text-sand" strokeWidth={1.35} aria-hidden="true" />
    </section>
  )
}

function BottomNavigation({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  return (
    <nav
      className="nav-safe fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[408px] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl"
      aria-label="Huvudnavigation"
    >
      {navItems.map(({ label, icon: Icon }) => {
        const isActive = active === label
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-12 min-w-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/40",
              isActive ? "bg-sea-deep text-sea-deep-foreground" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-[1.15rem]" aria-hidden="true" />
            {isActive && <span>{label}</span>}
            {!isActive && <span className="sr-only">{label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
