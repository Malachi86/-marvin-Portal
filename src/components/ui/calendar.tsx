"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------- */
/* VARIANTS */
/* ---------------------------------------------------------------- */

const buttonVariants = cva(
  `
  inline-flex items-center justify-center gap-2
  whitespace-nowrap
  rounded-md
  text-sm font-medium
  transition-colors
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  disabled:pointer-events-none disabled:opacity-50
  [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
  `,
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        ghost:
          "hover:bg-accent hover:text-accent-foreground",

        link:
          "text-primary underline-offset-4 hover:underline",

        success:
          "bg-green-600 text-white hover:bg-green-700",

        warning:
          "bg-yellow-500 text-white hover:bg-yellow-600",

        info:
          "bg-blue-600 text-white hover:bg-blue-700",
      },

      size: {
        sm: "h-9 px-3",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-10 w-10",
      },

      fullWidth: {
        true: "w-full",
      }
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/* ---------------------------------------------------------------- */
/* TYPES */
/* ---------------------------------------------------------------- */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {

  asChild?: boolean

  loading?: boolean
}

/* ---------------------------------------------------------------- */
/* COMPONENT */
/* ---------------------------------------------------------------- */

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
(
  {
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    children,
    disabled,
    ...props
  },
  ref
) => {

  const Comp = asChild ? Slot : "button"

  return (

    <Comp
      ref={ref}

      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        className
      )}

      disabled={loading || disabled}

      {...props}
    >

      {loading && (
        <Loader2 className="animate-spin" />
      )}

      {children}

    </Comp>

  )
})

Button.displayName = "Button"

/* ---------------------------------------------------------------- */
/* EXPORT */
/* ---------------------------------------------------------------- */

export {
  Button,
  buttonVariants
}