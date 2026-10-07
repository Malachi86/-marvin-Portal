"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------- */
/* CARD ROOT */
/* ---------------------------------------------------------------- */

const Card = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className,...props },ref)=>(

<div
ref={ref}

className={cn(

"rounded-xl border bg-card text-card-foreground",

"shadow-sm",

"transition-all",

className

)}

{...props}
/>

))

Card.displayName="Card"


/* ---------------------------------------------------------------- */
/* CARD HEADER */
/* ---------------------------------------------------------------- */

const CardHeader = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className,...props },ref)=>(

<div
ref={ref}

className={cn(

"flex flex-col gap-1.5",

"p-6",

className

)}

{...props}
/>

))

CardHeader.displayName="CardHeader"


/* ---------------------------------------------------------------- */
/* CARD TITLE */
/* ---------------------------------------------------------------- */

const CardTitle = React.forwardRef<
HTMLHeadingElement,
React.HTMLAttributes<HTMLHeadingElement>
>(({ className,...props },ref)=>(

<h3
ref={ref}

className={cn(

"text-lg font-semibold",

"leading-none tracking-tight",

className

)}

{...props}
/>

))

CardTitle.displayName="CardTitle"


/* ---------------------------------------------------------------- */
/* CARD DESCRIPTION */
/* ---------------------------------------------------------------- */

const CardDescription = React.forwardRef<
HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>
>(({ className,...props },ref)=>(

<p
ref={ref}

className={cn(

"text-sm text-muted-foreground",

className

)}

{...props}
/>

))

CardDescription.displayName="CardDescription"


/* ---------------------------------------------------------------- */
/* CARD CONTENT */
/* ---------------------------------------------------------------- */

const CardContent = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className,...props },ref)=>(

<div
ref={ref}

className={cn(

"p-6 pt-0",

className

)}

{...props}
/>

))

CardContent.displayName="CardContent"


/* ---------------------------------------------------------------- */
/* CARD FOOTER */
/* ---------------------------------------------------------------- */

const CardFooter = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className,...props },ref)=>(

<div
ref={ref}

className={cn(

"flex items-center justify-between",

"p-6 pt-0",

className

)}

{...props}
/>

))

CardFooter.displayName="CardFooter"


/* ---------------------------------------------------------------- */
/* EXPORT */
/* ---------------------------------------------------------------- */

export {

Card,
CardHeader,
CardFooter,
CardTitle,
CardDescription,
CardContent

}