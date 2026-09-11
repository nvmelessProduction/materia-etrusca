'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Accordion = AccordionPrimitive.Root

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn('border-bordo border-b', className)} {...props} />
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'group hover:text-terracotta flex flex-1 items-center justify-between gap-4 py-5 text-left text-base font-medium transition-colors duration-300',
          className,
        )}
        {...props}
      >
        {children}
        <span aria-hidden className="text-testo-tenue shrink-0">
          <Plus className="size-4 group-data-[state=open]:hidden" />
          <Minus className="hidden size-4 group-data-[state=open]:block" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden data-[state=closed]:animate-none"
      {...props}
    >
      <div className={cn('text-testo-tenue pb-6 text-sm leading-relaxed', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}
