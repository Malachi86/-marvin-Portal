"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

/* ======================================================
   ROOT
====================================================== */

const Tabs = TabsPrimitive.Root

/* ======================================================
   TAB LIST
====================================================== */

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-start gap-1",
      "rounded-lg bg-muted p-1",
      "text-muted-foreground",
      "flex-wrap sm:flex-nowrap",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

/* ======================================================
   TAB TRIGGER
====================================================== */

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center",
      "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium",
      "transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",

      // active state
      "data-[state=active]:bg-background",
      "data-[state=active]:text-foreground",
      "data-[state=active]:shadow-sm",

      // hover
      "hover:bg-muted/70",

      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

/* ======================================================
   TAB CONTENT
====================================================== */

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 rounded-md",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "animate-in fade-in-50 duration-200",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

/* ======================================================
   EXPORT
====================================================== */

export { Tabs, TabsList, TabsTrigger, TabsContent }