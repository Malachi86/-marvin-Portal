import * as React from "react"
import { cn } from "@/lib/utils"

/* =====================================================
   TABLE CONTAINER
===================================================== */

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full overflow-x-auto rounded-lg border">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          "border-collapse",
          className
        )}
        {...props}
      />
    </div>
  )
})
Table.displayName = "Table"

/* =====================================================
   TABLE HEADER
===================================================== */

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-muted/40 sticky top-0 z-10 backdrop-blur",
      "[&_tr]:border-b",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

/* =====================================================
   TABLE BODY
===================================================== */

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      "[&_tr:nth-child(even)]:bg-muted/20", // striped rows
      className
    )}
    {...props}
  />
))
TableBody.displayName = "TableBody"

/* =====================================================
   TABLE FOOTER
===================================================== */

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium",
      "[&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

/* =====================================================
   TABLE ROW
===================================================== */

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors",
      "hover:bg-muted/50",
      "data-[state=selected]:bg-muted",
      "cursor-default",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

/* =====================================================
   TABLE HEAD
===================================================== */

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle",
      "font-semibold text-muted-foreground",
      "whitespace-nowrap",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

/* =====================================================
   TABLE CELL
===================================================== */

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle",
      "whitespace-nowrap",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

/* =====================================================
   TABLE CAPTION
===================================================== */

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-4 text-sm text-muted-foreground text-center",
      className
    )}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

/* =====================================================
   EXPORTS
===================================================== */

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}