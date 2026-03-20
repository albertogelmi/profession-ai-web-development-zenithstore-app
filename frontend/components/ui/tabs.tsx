"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * Tabs is a styled, accessible component for tabbed navigation and content panels.
 * It wraps Radix UI's Tabs and provides a consistent structure for tabbed interfaces.
 *
 * @example
 *   // Basic usage with triggers and content
 *   <Tabs defaultValue="account">
 *     <TabsList>
 *       <TabsTrigger value="account">Account</TabsTrigger>
 *       <TabsTrigger value="password">Password</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="account">Account content</TabsContent>
 *     <TabsContent value="password">Password content</TabsContent>
 *   </Tabs>
 *
 * @see TabsList, TabsTrigger, TabsContent
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled root component for tab navigation and content switching.
 */
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * TabsList is a styled container for tab triggers.
 *
 * @example
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *
 * @see Tabs, TabsTrigger
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled container for tab triggers.
 */
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * TabsTrigger is a styled, clickable element that activates a tab.
 *
 * @example
 *   <TabsTrigger value="account">Account</TabsTrigger>
 *
 * @see Tabs, TabsList
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled trigger for switching tabs.
 */
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * TabsContent is a styled container for the content of the active tab.
 *
 * @example
 *   <TabsContent value="account">Account content</TabsContent>
 *
 * @see Tabs
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled container for tab content.
 */
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
