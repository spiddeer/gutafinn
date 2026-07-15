import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full bg-sand px-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-sea-deep",
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
