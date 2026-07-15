import * as AvatarPrimitive from "@radix-ui/react-avatar"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex size-11 shrink-0 overflow-hidden rounded-full bg-overlay text-overlay-foreground",
        className,
      )}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn("flex size-full items-center justify-center", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback }
