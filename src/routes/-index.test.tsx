/* @vitest-environment jsdom */

// The leading dash keeps this co-located test outside TanStack's route tree.

import { act } from "react"
import { createRoot } from "react-dom/client"
import { beforeEach, describe, expect, it } from "vitest"

import type { PlaceViewModel } from "@/lib/places"
import { PlaceDetailsDialog } from "./index"

const place: PlaceViewModel = {
  id: "testplats",
  name: "Testplatsen",
  category: "mat",
  categories: ["mat"],
  categoryDetails: [
    { id: "mat", isPrimary: true, label: "Mat & dryck", emoji: "🍽️" },
  ],
  lat: 57.64,
  lng: 18.29,
  description: "Restaurang med gotländska råvaror.",
  address: { formatted: "Strandgatan 1, Visby" },
  accessibility: "limited",
  website: "https://example.test",
  phone: "+46 498 00 00 00",
  email: "hej@example.test",
  openingHours: { raw: "Mo-Fr 10:00-18:00" },
  sources: [
    {
      sourceType: "OpenStreetMap",
      sourceUrl: "https://www.openstreetmap.org/node/1",
      lastVerifiedAt: "2026-07-14",
    },
  ],
  lastVerifiedAt: "2026-07-14",
  kind: "Mat & dryck",
  kinds: ["Mat & dryck"],
  tag: "Mat & dryck",
  distanceKm: null,
  distanceLabel: null,
  walkLabel: null,
  opening: { kind: "known", label: "Öppettider finns" },
  verifiedLabel: "14 juli 2026",
}

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>'
})

describe("PlaceDetailsDialog", () => {
  it("shows all sourced information for an enriched place", async () => {
    const root = createRoot(document.getElementById("root")!)
    await act(async () => {
      root.render(
        <PlaceDetailsDialog
          place={place}
          isSaved={false}
          onClose={() => {}}
          onToggleSaved={() => {}}
          onNavigate={() => {}}
        />,
      )
    })

    expect(document.body.textContent).toContain("Strandgatan 1, Visby")
    expect(document.body.textContent).toContain("Mo-Fr 10:00-18:00")
    expect(document.body.textContent).toContain("Delvis tillgängligt med rullstol")
    expect(document.body.textContent).toContain("+46 498 00 00 00")
    expect(document.querySelector('a[href="https://www.openstreetmap.org/node/1"]')).not.toBeNull()

    await act(async () => root.unmount())
  })

  it("states honestly when optional facts are unavailable", async () => {
    const root = createRoot(document.getElementById("root")!)
    await act(async () => {
      root.render(
        <PlaceDetailsDialog
          place={{
            ...place,
            address: null,
            accessibility: null,
            website: null,
            phone: null,
            email: null,
            openingHours: null,
            sources: [],
            verifiedLabel: null,
          }}
          isSaved={false}
          onClose={() => {}}
          onToggleSaved={() => {}}
          onNavigate={() => {}}
        />,
      )
    })

    expect(document.body.textContent).toContain("Gatuadress saknas i källan")
    expect(document.body.textContent).toContain("Kontaktuppgifter saknas i källan")
    expect(document.body.textContent).toContain("Länk till källa saknas")

    await act(async () => root.unmount())
  })
})
