"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/* =====================================================
   ROOT
===================================================== */

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-3", className)}
    {...props}
  />
))

RadioGroup.displayName = "RadioGroup"

/* =====================================================
   ITEM
===================================================== */

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex h-5 w-5 items-center justify-center rounded-full",
      "border border-primary",

      "text-primary",
      "transition-colors",

      "hover:bg-primary/10",

      "focus:outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "ring-offset-background",

      "disabled:cursor-not-allowed disabled:opacity-50",

      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      className={cn(
        "flex items-center justify-center",
        "transition-transform duration-200"
      )}
    >
      <Circle className="h-2.5 w-2.5 fill-current text-current" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))

RadioGroupItem.displayName = "RadioGroupItem"

/* =====================================================
   EXPORT
===================================================== */

export { RadioGroup, RadioGroupItem }