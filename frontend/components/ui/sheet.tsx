"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Sheet is a styled, accessible side panel (drawer) component for displaying content over the main UI.
 *
 * @example
 *   <Sheet open={open} onOpenChange={setOpen}>
 *     <SheetTrigger>Open Sheet</SheetTrigger>
 *     <SheetContent side="right">
 *       <SheetHeader>
 *         <SheetTitle>Panel Title</SheetTitle>
 *         <SheetDescription>Panel description goes here.</SheetDescription>
 *       </SheetHeader>
 *       <div>Panel body content...</div>
 *       <SheetFooter>
 *         <button onClick={() => setOpen(false)}>Close</button>
 *       </SheetFooter>
 *     </SheetContent>
 *   </Sheet>
 *
 * @see SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose, SheetPortal, SheetOverlay
 * @prop {React.ReactNode} [children] - Sheet content and subcomponents.
 * @returns A styled sheet root component.
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

/**
 * SheetTrigger is a button or element that opens the sheet when interacted with.
 *
 * @example
 *   <SheetTrigger>Open</SheetTrigger>
 *
 * @see Sheet, SheetContent
 * @prop {React.ReactNode} [children] - The trigger element content.
 * @returns A trigger element for the sheet.
 */
function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

/**
 * SheetClose is a button or element that closes the sheet when interacted with.
 *
 * @example
 *   <SheetClose>Close</SheetClose>
 *
 * @see Sheet, SheetContent
 * @prop {React.ReactNode} [children] - The close button content.
 * @returns A close element for the sheet.
 */
function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

/**
 * SheetPortal renders sheet content in a React portal, outside the DOM hierarchy of the parent component.
 *
 * @example
 *   <SheetPortal>
 *     <SheetContent>...</SheetContent>
 *   </SheetPortal>
 *
 * @see SheetContent
 * @prop {React.ReactNode} [children] - Portal content.
 * @returns A portal for sheet content.
 */
function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/**
 * SheetOverlay is a semi-transparent background overlay for the sheet.
 * It blocks interaction with the rest of the UI while the sheet is open.
 *
 * @example
 *   <SheetOverlay />
 *
 * @see SheetContent
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled overlay element for the sheet.
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * SheetContent is the main content area of the sheet, rendered above the overlay.
 * Supports an optional close button, custom children, and configurable side.
 *
 * @example
 *   <SheetContent side="left">Panel body</SheetContent>
 *
 * @see SheetHeader, SheetFooter, SheetClose, SheetOverlay
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Sheet content.
 * @prop {"top"|"right"|"bottom"|"left"} [side="right"] - Side of the screen to anchor the sheet.
 * @returns The main sheet content area.
 */
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-6 right-6 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

/**
 * SheetHeader is a styled container for the sheet's header section.
 *
 * @example
 *   <SheetHeader>
 *     <SheetTitle>Title</SheetTitle>
 *     <SheetDescription>Description</SheetDescription>
 *   </SheetHeader>
 *
 * @see SheetTitle, SheetDescription
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Header content.
 * @returns A styled header container for the sheet.
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

/**
 * SheetFooter is a styled container for the sheet's footer section, typically for actions.
 *
 * @example
 *   <SheetFooter>
 *     <button>Cancel</button>
 *     <button>Save</button>
 *   </SheetFooter>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Footer content.
 * @returns A styled footer container for the sheet.
 */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * SheetTitle is a styled component for the sheet's title text.
 *
 * @example
 *   <SheetTitle>Panel Title</SheetTitle>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Title content.
 * @returns A styled title element for the sheet.
 */
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

/**
 * SheetDescription is a styled component for the sheet's description text.
 *
 * @example
 *   <SheetDescription>Some details about this panel.</SheetDescription>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Description content.
 * @returns A styled description element for the sheet.
 */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
