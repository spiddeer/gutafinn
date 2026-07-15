import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router"

const description =
  "Hitta saker att göra, se och äta på Gotland — baserat på var du står just nu."

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: "Gutafinn — Upptäck Gotland just nu" },
      { name: "description", content: description },
      { property: "og:title", content: "Gutafinn — Upptäck Gotland just nu" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  )
}
