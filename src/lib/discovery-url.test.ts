import { describe, expect, it } from "vitest"

import { buildDiscoverySearch, parseDiscoverySearch } from "@/lib/discovery-url"

describe("shareable discovery URL state", () => {
  it("parses supported filters, map view, and a place selection", () => {
    expect(
      parseDiscoverySearch("?q=raukar&kategori=sevardheter&vy=karta&plats=hovs-hallar-n123"),
    ).toEqual({
      query: "raukar",
      category: "Sevärdheter",
      mapView: true,
      selectedPlaceId: "hovs-hallar-n123",
    })
  })

  it("ignores unknown or unsafe values", () => {
    expect(parseDiscoverySearch("?kategori=service&vy=extern&plats=../admin")).toEqual({
      query: "",
      category: "Allt",
      mapView: false,
      selectedPlaceId: null,
    })
  })

  it("builds a compact canonical query and omits defaults", () => {
    expect(
      buildDiscoverySearch({
        query: "  saffranspannkaka  ",
        category: "Mat & dryck",
        mapView: true,
        selectedPlaceId: "bakfickan-n123",
      }),
    ).toBe("?q=saffranspannkaka&kategori=mat&vy=karta&plats=bakfickan-n123")

    expect(
      buildDiscoverySearch({ query: "", category: "Allt", mapView: false, selectedPlaceId: null }),
    ).toBe("")
  })

  it("round-trips every public category slug", () => {
    const categories = [
      "Mat & dryck",
      "Sevärdheter",
      "Bad",
      "Natur",
      "Aktiviteter",
      "Familj",
      "Lokalt",
    ] as const

    for (const category of categories) {
      const search = buildDiscoverySearch({ query: "", category, mapView: false, selectedPlaceId: null })
      expect(parseDiscoverySearch(search).category).toBe(category)
    }
  })
})
