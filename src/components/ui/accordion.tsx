"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/* ------------------------------------------------ */
/* ROOT */
/* ------------------------------------------------ */

const Accordion = AccordionPrimitive.Root


/* ------------------------------------------------ */
/* ITEM */
/* ------------------------------------------------ */

const AccordionItem = React.forwardRef<
React.ElementRef<typeof AccordionPrimitive.Item>,
React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className,...props },ref)=>(

<AccordionPrimitive.Item
ref={ref}
className={cn(
"border-b border-muted/40",
"transition-colors",
className
)}
{...props}
/>

))

AccordionItem.displayName="AccordionItem"


/* ------------------------------------------------ */
/* TRIGGER */
/* ------------------------------------------------ */

const AccordionTrigger = React.forwardRef<
React.ElementRef<typeof AccordionPrimitive.Trigger>,
React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className,children,...props },ref)=>(

<AccordionPrimitive.Header className="flex">

<AccordionPrimitive.Trigger
ref={ref}
className={cn(

"flex flex-1 items-center justify-between",

"py-4",

"text-sm sm:text-base",

"font-semibold",

"transition-all",

"hover:text-primary",

"focus:outline-none",

"group",

"[&[data-state=open]>svg]:rotate-180",

className
)}

{...props}
>

<span className="text-left">
{children}
</span>

<ChevronDown
className="
h-4 w-4
text-muted-foreground
transition-transform
duration-300
group-hover:text-primary
"
/>

</AccordionPrimitive.Trigger>

</AccordionPrimitive.Header>

))

AccordionTrigger.displayName="AccordionTrigger"


/* ------------------------------------------------ */
/* CONTENT */
/* ------------------------------------------------ */

const AccordionContent = React.forwardRef<
React.ElementRef<typeof AccordionPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className,children,...props },ref)=>(

<AccordionPrimitive.Content
ref={ref}

className={cn(

"overflow-hidden",

"text-sm",

"data-[state=open]:animate-accordion-down",

"data-[state=closed]:animate-accordion-up",

className

)}

{...props}
>

<div className="pb-4 pt-1 text-muted-foreground">

{children}

</div>

</AccordionPrimitive.Content>

))

AccordionContent.displayName="AccordionContent"


/* ------------------------------------------------ */
/* EXPORTS */
/* ------------------------------------------------ */

export {
Accordion,
AccordionItem,
AccordionTrigger,
AccordionContent
}