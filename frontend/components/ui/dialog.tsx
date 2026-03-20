"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dialog is a styled, accessible modal component for displaying content in a layer above the app UI.
 * It wraps Radix UI's Dialog and provides consistent structure and styling for dialogs.
 *
 * @example
 *   // Basic usage with header, content, and footer
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogTrigger>Open Dialog</DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Dialog Title</DialogTitle>
 *         <DialogDescription>Short description goes here.</DialogDescription>
 *       </DialogHeader>
 *       <div>Dialog body content...</div>
 *       <DialogFooter>
 *         <button onClick={() => setOpen(false)}>Close</button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * @see DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogOverlay, DialogPortal, DialogTrigger, DialogClose
 *
 * @prop {React.ReactNode} [children] - Dialog content and subcomponents.
 * @returns A styled dialog root component.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * DialogTrigger is a button or element that opens the dialog when interacted with.
 *
 * @example
 *   <DialogTrigger>Open</DialogTrigger>
 *
 * @prop {React.ReactNode} [children] - The trigger element content.
 * @returns A trigger element for the dialog.
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * DialogPortal renders dialog content in a React portal, outside the DOM hierarchy of the parent component.
 *
 * @example
 *   <DialogPortal>
 *     <DialogContent>...</DialogContent>
 *   </DialogPortal>
 *
 * @prop {React.ReactNode} [children] - Portal content.
 * @returns A portal for dialog content.
 */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * DialogClose is a button or element that closes the dialog when interacted with.
 *
 * @example
 *   <DialogClose>Close</DialogClose>
 *
 * @prop {React.ReactNode} [children] - The close button content.
 * @returns A close element for the dialog.
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * DialogOverlay is a semi-transparent background overlay for the dialog.
 * It blocks interaction with the rest of the UI while the dialog is open.
 *
 * @example
 *   <DialogOverlay />
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled overlay element for the dialog.
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * DialogContent is the main content area of the dialog, rendered above the overlay.
 * Supports an optional close button and custom children.
 *
 * @example
 *   <DialogContent showCloseButton={false}>Dialog body</DialogContent>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Dialog content.
 * @prop {boolean} [showCloseButton] - Whether to show the close button (default: true).
 * @returns The main dialog content area.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * DialogHeader is a styled container for the dialog's header section.
 *
 * @example
 *   <DialogHeader>
 *     <DialogTitle>Title</DialogTitle>
 *     <DialogDescription>Description</DialogDescription>
 *   </DialogHeader>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Header content (e.g., title, description).
 * @returns A styled header container for the dialog.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * DialogFooter is a styled container for the dialog's footer section, typically for actions.
 *
 * @example
 *   <DialogFooter>
 *     <button>Cancel</button>
 *     <button>Save</button>
 *   </DialogFooter>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Footer content (e.g., buttons).
 * @returns A styled footer container for the dialog.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * DialogTitle is a styled component for the dialog's title text.
 *
 * @example
 *   <DialogTitle>Dialog Title</DialogTitle>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Title content.
 * @returns A styled title element for the dialog.
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * DialogDescription is a styled component for the dialog's description text.
 *
 * @example
 *   <DialogDescription>Some details about this dialog.</DialogDescription>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Description content.
 * @returns A styled description element for the dialog.
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
