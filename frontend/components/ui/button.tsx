import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * buttonVariants defines the style and size variants for the Button component using class-variance-authority (CVA).
 * It manages visual appearance based on the 'variant' and 'size' props (e.g., default, secondary, destructive, outline, ghost, link).
 *
 * @type {import("class-variance-authority").VariantProps}
 * @prop {"default"|"secondary"|"destructive"|"outline"|"ghost"|"link"} variant - The visual style of the button.
 * @prop {"default"|"sm"|"lg"|"icon"|"icon-sm"|"icon-lg"} size - The size of the button.
 * @returns {string} A string of CSS classes for the selected variant and size.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button is a flexible, styled component for user actions and navigation.
 * It provides consistent styling, supports multiple variants and sizes, and can render as a native button or custom element.
 *
 * @example
 *   <Button variant="secondary" size="lg">Click me</Button>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {"default"|"secondary"|"destructive"|"outline"|"ghost"|"link"} [variant] - Visual style of the button.
 * @prop {"default"|"sm"|"lg"|"icon"|"icon-sm"|"icon-lg"} [size] - Size of the button.
 * @prop {boolean} [asChild] - Render as child component (using Slot) instead of button.
 * @prop {React.ReactNode} children - Button content.
 * @returns A styled button component.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
