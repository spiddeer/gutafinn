import { CheckCircle2, MessageSquare, Send, X } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const issueOptions = [
  ["hours", "Öppettider"],
  ["contact", "Kontaktuppgifter"],
  ["location", "Position på kartan"],
  ["accessibility", "Tillgänglighet"],
  ["closed", "Platsen är permanent stängd"],
  ["other", "Annat"],
] as const

export function VisitorCorrectionForm({ placeId, placeName }: { placeId: string; placeName: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!navigator.onLine) {
      setStatus("error")
      setError("Du är offline. Anslut till internet och försök igen.")
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)
    setStatus("sending")
    setError("")
    try {
      const response = await fetch(`/api/places/${encodeURIComponent(placeId)}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType: data.get("issueType"),
          message: data.get("message"),
          email: data.get("email"),
          website: data.get("website"),
        }),
      })
      if (!response.ok) {
        if (response.status === 429) throw new Error("För många förslag har skickats. Vänta en stund och försök igen.")
        if (response.status === 400) throw new Error("Kontrollera att alla uppgifter är korrekt ifyllda.")
        throw new Error("Förslaget kunde inte skickas just nu. Försök igen senare.")
      }
      form.reset()
      setStatus("sent")
    } catch (submitError) {
      setStatus("error")
      setError(submitError instanceof Error ? submitError.message : "Förslaget kunde inte skickas.")
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" className="w-full" onClick={() => setOpen(true)}>
        <MessageSquare className="size-4" aria-hidden="true" />
        Föreslå en rättelse
      </Button>
    )
  }

  if (status === "sent") {
    return (
      <Card className="border-meadow/30 bg-secondary/65 p-5 text-center" role="status">
        <CheckCircle2 className="mx-auto size-7 text-meadow" aria-hidden="true" />
        <h3 className="mt-3 font-display text-xl font-semibold text-sea-deep">Tack för hjälpen</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Förslaget ligger nu i redaktörernas granskningskö. Platsen ändras inte automatiskt.
        </p>
        <Button type="button" variant="ghost" className="mt-3" onClick={() => { setOpen(false); setStatus("idle") }}>
          Stäng
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-5" aria-labelledby="correction-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="correction-heading" className="font-display text-xl font-semibold text-sea-deep">Föreslå en rättelse</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Om {placeName}. Förslaget granskas innan något ändras.</p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Stäng rättelseformuläret" onClick={() => setOpen(false)}>
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <form className="mt-4 grid gap-4" onSubmit={submit}>
        <label className="grid gap-1.5 text-sm font-bold text-sea-deep">
          Vad gäller det?
          <select name="issueType" required className="min-h-11 rounded-xl border border-border bg-card px-3 font-normal text-foreground">
            {issueOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-sea-deep">
          Vad behöver rättas?
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder="Beskriv vad som inte stämmer och gärna var uppgiften kan kontrolleras."
            className="rounded-xl border border-border bg-card px-3 py-2 font-normal leading-6 text-foreground"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-sea-deep">
          E-post (valfritt)
          <input name="email" type="email" maxLength={254} autoComplete="email" className="min-h-11 rounded-xl border border-border bg-card px-3 font-normal text-foreground" />
          <span className="text-xs font-normal leading-5 text-muted-foreground">Används bara om redaktören behöver ställa en följdfråga.</span>
        </label>
        <label className="pointer-events-none absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
          Webbplats
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        {status === "error" && <p className="text-sm font-semibold text-poppy" role="alert">{error}</p>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Avbryt</Button>
          <Button type="submit" variant="poppy" disabled={status === "sending"}>
            <Send className="size-4" aria-hidden="true" />
            {status === "sending" ? "Skickar…" : "Skicka för granskning"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
