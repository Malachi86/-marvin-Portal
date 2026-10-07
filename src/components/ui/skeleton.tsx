import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full"
}

function Skeleton({
  className,
  rounded = "md",
  ...props
}: SkeletonProps) {
  const roundedStyles = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        "before:absolute before:inset-0",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "dark:before:via-white/10",
        roundedStyles[rounded],
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }