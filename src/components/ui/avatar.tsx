"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------- */
/* AVATAR ROOT */
/* ---------------------------------------------------------------- */

const Avatar = React.forwardRef<
React.ElementRef<typeof AvatarPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className,...props },ref)=>(

<AvatarPrimitive.Root
ref={ref}

className={cn(

"relative flex shrink-0 overflow-hidden",

"rounded-full",

"h-10 w-10",

"border border-border",

"bg-muted",

className

)}

{...props}
/>

))

Avatar.displayName="Avatar"


/* ---------------------------------------------------------------- */
/* AVATAR IMAGE */
/* ---------------------------------------------------------------- */

const AvatarImage = React.forwardRef<
React.ElementRef<typeof AvatarPrimitive.Image>,
React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props },ref)=>(

<AvatarPrimitive.Image
ref={ref}
src={src || undefined}
className={cn(

"h-full w-full",

"object-cover",

"aspect-square",

className

)}

{...props}
/>

))

AvatarImage.displayName="AvatarImage"


/* ---------------------------------------------------------------- */
/* AVATAR FALLBACK */
/* ---------------------------------------------------------------- */

const AvatarFallback = React.forwardRef<
React.ElementRef<typeof AvatarPrimitive.Fallback>,
React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className,children,...props },ref)=>(

<AvatarPrimitive.Fallback
ref={ref}

className={cn(

"flex h-full w-full items-center justify-center",

"rounded-full",

"text-sm font-medium",

"bg-muted text-muted-foreground",

className

)}

{...props}
>

{children}

</AvatarPrimitive.Fallback>

))

AvatarFallback.displayName="AvatarFallback"


/* ---------------------------------------------------------------- */
/* EXPORT */
/* ---------------------------------------------------------------- */

export {
Avatar,
AvatarImage,
AvatarFallback
}
