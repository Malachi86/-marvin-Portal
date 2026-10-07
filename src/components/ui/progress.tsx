"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/* ---------------------------------------------
   SIZE VARIANTS
--------------------------------------------- */

const sizeStyles = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4"
}

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
}

/* ---------------------------------------------
   COMPONENT
--------------------------------------------- */

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
({ className, value = 0, size = "md", showValue = false, ...props }, ref) => {

  const safeValue = Math.min(Math.max(value, 0), 100)

  return (
    <div className="w-full space-y-1">

      {showValue && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{safeValue}%</span>
        </div>
      )}

      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeStyles[size],
          className
        )}
        aria-valuenow={safeValue}
        {...props}
      >

        <ProgressPrimitive.Indicator
          className={cn(
            "h-full transition-transform duration-500 ease-out",
            "bg-primary"
          )}
          style={{
            transform: `translateX(-${100 - safeValue}%)`
          }}
        />

      </ProgressPrimitive.Root>

    </div>
  )
})

Progress.displayName = "Progress"

export { Progress }