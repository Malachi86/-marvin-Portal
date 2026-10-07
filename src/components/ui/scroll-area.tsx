"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------
   ROOT SCROLL AREA
--------------------------------------------------- */

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (

  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn(
      "relative overflow-hidden",
      className
    )}
    {...props}
  >

    <ScrollAreaPrimitive.Viewport
      className="
      h-full
      w-full
      rounded-[inherit]
      overflow-auto
      scroll-smooth
      overscroll-contain
      "
    >
      {children}
    </ScrollAreaPrimitive.Viewport>

    <ScrollBar orientation="vertical" />
    <ScrollBar orientation="horizontal" />

    <ScrollAreaPrimitive.Corner />

  </ScrollAreaPrimitive.Root>

))

ScrollArea.displayName = "ScrollArea"

/* ---------------------------------------------------
   SCROLL BAR
--------------------------------------------------- */

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(
({ className, orientation = "vertical", ...props }, ref) => (

  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(

      "flex touch-none select-none transition-opacity duration-200",

      orientation === "vertical" &&
        "w-2.5 h-full border-l border-transparent p-[1px]",

      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-transparent p-[1px]",

      className
    )}
    {...props}
  >

    <ScrollAreaPrimitive.ScrollAreaThumb
      className="
      relative
      flex-1
      rounded-full
      bg-muted-foreground/30
      hover:bg-muted-foreground/60
      active:bg-muted-foreground/70
      transition-colors
      "
    />

  </ScrollAreaPrimitive.ScrollAreaScrollbar>

))

ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }