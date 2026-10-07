"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------- */
/* VARIANTS */
/* ---------------------------------------------------------------- */

const badgeVariants = cva(
  `
  inline-flex items-center gap-1
  rounded-full border
  px-2.5 py-0.5
  text-xs font-medium
  transition-colors
  whitespace-nowrap
  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
  `,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",

        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",

        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",

        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600",

        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",

        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",

        outline:
          "border-border bg-transparent text-foreground",
      },

      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

/* ---------------------------------------------------------------- */
/* TYPES */
/* ---------------------------------------------------------------- */

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/* ---------------------------------------------------------------- */
/* COMPONENT */
/* ---------------------------------------------------------------- */

function Badge({ className, variant, size, ...props }: BadgeProps) {

  return (

    <div
      className={cn(
        badgeVariants({ variant, size }),
        className
      )}
      {...props}
    />

  )

}

/* ---------------------------------------------------------------- */
/* EXPORT */
/* ---------------------------------------------------------------- */

export {
  Badge,
  badgeVariants
}