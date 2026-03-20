import { cn } from "@/lib/utils"

/**
 * Skeleton
 *
 * Visual placeholder for loading content, rendered as a pulsing, rounded rectangle.
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled skeleton placeholder for use during content loading.
 *
 * @example
 * // Basic usage
 * <Skeleton className="h-6 w-32" />
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
