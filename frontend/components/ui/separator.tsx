"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

/**
 * Separator is a styled, accessible horizontal or vertical divider for visually separating content.
 *
 * @example
 *   <Separator />
 *   <Separator orientation="vertical" />
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {"horizontal"|"vertical"} [orientation="horizontal"] - Divider orientation.
 * @prop {boolean} [decorative=true] - Whether the separator is decorative (not announced by screen readers).
 * @returns A styled separator element.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
