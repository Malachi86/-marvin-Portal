"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------- */
/* VARIANTS */
/* ---------------------------------------------------------------- */

const alertVariants = cva(
  `
  relative w-full rounded-xl border p-4
  flex gap-3 items-start
  text-sm
  [&>svg]:h-5 [&>svg]:w-5
  `,
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border-border",

        destructive:
          "border-destructive/40 text-destructive bg-destructive/5 [&>svg]:text-destructive",

        success:
          "border-green-500/40 text-green-700 bg-green-50 dark:bg-green-950/30 [&>svg]:text-green-600",

        warning:
          "border-yellow-500/40 text-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 [&>svg]:text-yellow-600",

        info:
          "border-blue-500/40 text-blue-800 bg-blue-50 dark:bg-blue-950/30 [&>svg]:text-blue-600",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  }
)

/* ---------------------------------------------------------------- */
/* ALERT */
/* ---------------------------------------------------------------- */

const Alert = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (

<div
ref={ref}
role="alert"

className={cn(
alertVariants({ variant }),
className
)}

{...props}
/>

))

Alert.displayName = "Alert"

/* ---------------------------------------------------------------- */
/* TITLE */
/* ---------------------------------------------------------------- */

const AlertTitle = React.forwardRef<
HTMLHeadingElement,
React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (

<h5
ref={ref}

className={cn(
"font-semibold leading-none tracking-tight",
className
)}

{...props}
/>

))

AlertTitle.displayName = "AlertTitle"

/* ---------------------------------------------------------------- */
/* DESCRIPTION */
/* ---------------------------------------------------------------- */

const AlertDescription = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (

<div
ref={ref}

className={cn(
"text-sm text-muted-foreground leading-relaxed",
className
)}

{...props}
/>

))

AlertDescription.displayName = "AlertDescription"

/* ---------------------------------------------------------------- */
/* EXPORT */
/* ---------------------------------------------------------------- */

export {
Alert,
AlertTitle,
AlertDescription
}