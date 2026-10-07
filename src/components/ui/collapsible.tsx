"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

import { cn } from "@/lib/utils"

/* --------------------------------------------------
   ROOT
-------------------------------------------------- */

const Collapsible = CollapsiblePrimitive.Root

/* --------------------------------------------------
   TRIGGER
-------------------------------------------------- */

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between",
      "rounded-md px-3 py-2",
      "text-sm font-medium",
      "transition-colors",
      "hover:bg-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )}
    {...props}
  />
))

CollapsibleTrigger.displayName =
  CollapsiblePrimitive.CollapsibleTrigger.displayName

/* --------------------------------------------------
   CONTENT
-------------------------------------------------- */

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden text-sm",
      "data-[state=open]:animate-collapsible-down",
      "data-[state=closed]:animate-collapsible-up",
      className
    )}
    {...props}
  />
))

CollapsibleContent.displayName =
  CollapsiblePrimitive.CollapsibleContent.displayName

/* --------------------------------------------------
   EXPORTS
-------------------------------------------------- */

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
}