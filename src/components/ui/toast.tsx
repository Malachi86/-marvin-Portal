"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/* =====================================================
   PROVIDER
===================================================== */

const ToastProvider = ToastPrimitives.Provider

/* =====================================================
   VIEWPORT
===================================================== */

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4",
      "top-0 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col",
      "md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

/* =====================================================
   VARIANTS
===================================================== */

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all",

  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",

        success:
          "border-green-500/30 bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100",

        destructive:
          "border-red-500/30 bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100",

        warning:
          "border-yellow-500/30 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100",

        info:
          "border-blue-500/30 bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  }
)

/* =====================================================
   ROOT TOAST
===================================================== */

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      toastVariants({ variant }),

      // animations
      "data-[state=open]:animate-in",
      "data-[state=closed]:animate-out",
      "data-[state=open]:slide-in-from-top-full",
      "sm:data-[state=open]:slide-in-from-bottom-full",
      "data-[state=closed]:fade-out-80",
      "data-[state=closed]:slide-out-to-right-full",

      className
    )}
    {...props}
  />
))
Toast.displayName = "Toast"

/* =====================================================
   ACTION BUTTON
===================================================== */

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-medium",
      "transition-colors hover:bg-muted",
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

/* =====================================================
   CLOSE BUTTON
===================================================== */

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/60 opacity-0 transition",
      "hover:text-foreground",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
      "group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = "ToastClose"

/* =====================================================
   TITLE
===================================================== */

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-none", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

/* =====================================================
   DESCRIPTION
===================================================== */

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

/* =====================================================
   TYPES
===================================================== */

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

/* =====================================================
   EXPORTS
===================================================== */

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}