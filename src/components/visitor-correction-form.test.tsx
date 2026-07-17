/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VisitorCorrectionForm } from "@/components/visitor-correction-form"

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>'
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function changeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLSelectElement
    ? HTMLSelectElement.prototype
    : element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value)
  element.dispatchEvent(new Event("change", { bubbles: true }))
  element.dispatchEvent(new Event("input", { bubbles: true }))
}

describe("visitor correction form", () => {
  it("submits a correction to the selected place and confirms manual review", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    }))
    vi.stubGlobal("fetch", fetchMock)
    const root = createRoot(document.getElementById("root")!)
    await act(async () => root.render(<VisitorCorrectionForm placeId="test-place" placeName="Testplats" />))

    const openButton = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Föreslå en rättelse"),
    )!
    await act(async () => openButton.click())

    changeValue(document.querySelector('select[name="issueType"]')!, "location")
    changeValue(document.querySelector('textarea[name="message"]')!, "Markören ligger på fel sida av vägen.")
    changeValue(document.querySelector('input[name="email"]')!, "visitor@example.test")
    await act(async () => {
      document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/places/test-place/corrections")
    expect(JSON.parse(options.body)).toMatchObject({
      issueType: "location",
      message: "Markören ligger på fel sida av vägen.",
      email: "visitor@example.test",
    })
    expect(document.body.textContent).toContain("Förslaget ligger nu i redaktörernas granskningskö")

    await act(async () => root.unmount())
  })

  it("does not queue a correction locally while offline", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false)
    const root = createRoot(document.getElementById("root")!)
    await act(async () => root.render(<VisitorCorrectionForm placeId="test-place" placeName="Testplats" />))

    const openButton = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Föreslå en rättelse"),
    )!
    await act(async () => openButton.click())
    await act(async () => {
      document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("Du är offline")

    await act(async () => root.unmount())
  })

  it("explains the rate limit returned by the API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429 })))
    const root = createRoot(document.getElementById("root")!)
    await act(async () => root.render(<VisitorCorrectionForm placeId="test-place" placeName="Testplats" />))

    const openButton = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Föreslå en rättelse"),
    )!
    await act(async () => openButton.click())
    changeValue(document.querySelector('textarea[name="message"]')!, "Det här är ett giltigt rättelseförslag.")
    await act(async () => {
      document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })

    expect(document.querySelector('[role="alert"]')?.textContent).toContain("För många förslag")

    await act(async () => root.unmount())
  })
})
