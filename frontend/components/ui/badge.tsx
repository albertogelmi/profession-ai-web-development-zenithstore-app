import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * badgeVariants defines the style variants for the Badge component using class-variance-authority (CVA).
 * It manages visual appearance based on the 'variant' prop (e.g., default, secondary, destructive, outline).
 *
 * @type {import("class-variance-authority").VariantProps}
 * @prop {"default"|"secondary"|"destructive"|"outline"} variant - The visual style of the badge.
 * @returns {string} A string of CSS classes for the selected variant.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Badge is a small, styled component for displaying status, labels, or counts.
 * It provides consistent styling and supports multiple visual variants.
 *
 * @example
 *   <Badge variant="secondary">New</Badge>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {"default"|"secondary"|"destructive"|"outline"} [variant] - Visual style of the badge.
 * @prop {boolean} [asChild] - Render as child component (using Slot) instead of span.
 * @prop {React.ReactNode} children - Badge content.
 * @returns A styled badge component.
 */
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
