import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea
 *
 * A styled textarea component for multi-line text input.
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A multi-line text input field with consistent styling.
 *
 * @example
 * // Basic usage
 * <Textarea placeholder="Type your message..." />
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
