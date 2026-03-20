"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * DropdownMenu is a styled, accessible component for displaying a menu of actions or options triggered by user interaction.
 * It wraps Radix UI's DropdownMenu and provides consistent structure and styling for dropdown menus.
 *
 * @example
 *   // Basic usage with groups, checkbox, and radio items
 *   <DropdownMenu>
 *     <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuLabel>Actions</DropdownMenuLabel>
 *       <DropdownMenuItem>Profile</DropdownMenuItem>
 *       <DropdownMenuItem>Settings</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuCheckboxItem checked={isChecked}>Enable feature</DropdownMenuCheckboxItem>
 *       <DropdownMenuRadioGroup value={selected} onValueChange={setSelected}>
 *         <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
 *         <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
 *       </DropdownMenuRadioGroup>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 *
 * @see DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuGroup
 *
 * @prop {React.ReactNode} [children] - Dropdown menu content and subcomponents.
 * @returns A styled dropdown menu root component.
 */
function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

/**
 * DropdownMenuPortal renders dropdown content in a React portal, outside the DOM hierarchy of the parent component.
 *
 * @example
 *   <DropdownMenuPortal>
 *     <DropdownMenuContent>...</DropdownMenuContent>
 *   </DropdownMenuPortal>
 *
 * @prop {React.ReactNode} [children] - Portal content.
 * @returns A portal for dropdown menu content.
 */
function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

/**
 * DropdownMenuTrigger is a button or element that opens the dropdown menu when interacted with.
 *
 * @example
 *   <DropdownMenuTrigger>Open</DropdownMenuTrigger>
 *
 * @prop {React.ReactNode} [children] - The trigger element content.
 * @returns A trigger element for the dropdown menu.
 */
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

/**
 * DropdownMenuContent is the main content area of the dropdown menu, rendered above the trigger.
 *
 * @example
 *   <DropdownMenuContent>
 *     <DropdownMenuItem>Item</DropdownMenuItem>
 *   </DropdownMenuContent>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {number} [sideOffset] - Offset for menu positioning (default: 4).
 * @returns The main dropdown menu content area.
 */
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

/**
 * DropdownMenuGroup is a container for grouping related dropdown menu items.
 *
 * @example
 *   <DropdownMenuGroup>
 *     <DropdownMenuItem>Item 1</DropdownMenuItem>
 *     <DropdownMenuItem>Item 2</DropdownMenuItem>
 *   </DropdownMenuGroup>
 *
 * @prop {React.ReactNode} [children] - Grouped menu items.
 * @returns A group container for dropdown menu items.
 */
function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

/**
 * DropdownMenuItem is a selectable item in the dropdown menu.
 *
 * @example
 *   <DropdownMenuItem>Profile</DropdownMenuItem>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {boolean} [inset] - Indent the item for visual hierarchy.
 * @prop {"default"|"destructive"} [variant] - Visual style of the item.
 * @returns A selectable dropdown menu item.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * DropdownMenuCheckboxItem is a dropdown menu item with a checkbox indicator for toggling options.
 *
 * @example
 *   <DropdownMenuCheckboxItem checked={true}>Enable feature</DropdownMenuCheckboxItem>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {boolean} [checked] - Whether the item is checked.
 * @prop {React.ReactNode} [children] - Item content.
 * @returns A checkbox item for the dropdown menu.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

/**
 * DropdownMenuRadioGroup is a container for grouping radio items in the dropdown menu.
 *
 * @example
 *   <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
 *     <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
 *     <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
 *   </DropdownMenuRadioGroup>
 *
 * @prop {React.ReactNode} [children] - Grouped radio items.
 * @returns A group container for dropdown menu radio items.
 */
function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * DropdownMenuRadioItem is a dropdown menu item with a radio indicator for single selection within a group.
 *
 * @example
 *   <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Item content.
 * @returns A radio item for the dropdown menu.
 */
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/**
 * DropdownMenuLabel is a styled label for grouping or describing dropdown menu sections.
 *
 * @example
 *   <DropdownMenuLabel>Section</DropdownMenuLabel>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {boolean} [inset] - Indent the label for visual hierarchy.
 * @returns A styled label for dropdown menu sections.
 */
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

/**
 * DropdownMenuSeparator is a visual separator for dividing dropdown menu sections.
 *
 * @example
 *   <DropdownMenuSeparator />
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled separator for dropdown menu sections.
 */
function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

/**
 * DropdownMenuShortcut is a styled element for displaying keyboard shortcuts in menu items.
 *
 * @example
 *   <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled shortcut element for dropdown menu items.
 */
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

/**
 * DropdownMenuSub is a container for nested dropdown menus (submenus).
 *
 * @example
 *   <DropdownMenuSub>
 *     <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
 *     <DropdownMenuSubContent>...</DropdownMenuSubContent>
 *   </DropdownMenuSub>
 *
 * @prop {React.ReactNode} [children] - Submenu content.
 * @returns A container for dropdown menu submenus.
 */
function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

/**
 * DropdownMenuSubTrigger is a trigger element for opening a submenu within the dropdown menu.
 *
 * @example
 *   <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {boolean} [inset] - Indent the trigger for visual hierarchy.
 * @prop {React.ReactNode} [children] - Trigger content.
 * @returns A trigger element for dropdown menu submenus.
 */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

/**
 * DropdownMenuSubContent is the content area for a submenu within the dropdown menu.
 *
 * @example
 *   <DropdownMenuSubContent>
 *     <DropdownMenuItem>Subitem</DropdownMenuItem>
 *   </DropdownMenuSubContent>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns The content area for a dropdown menu submenu.
 */
function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
