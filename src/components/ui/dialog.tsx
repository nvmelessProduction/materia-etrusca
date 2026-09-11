'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogDescription = DialogPrimitive.Description

export function DialogContent({
  className,
  children,
  titolo,
  descrizione,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  titolo: string
  descrizione?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-antracite/40 fixed inset-0 z-50 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'border-bordo bg-calce shadow-sollevato fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border p-6 outline-none',
          className,
        )}
        {...props}
      >
        <div className="mb-4 pr-8">
          <DialogPrimitive.Title className="font-display text-2xl font-light">
            {titolo}
          </DialogPrimitive.Title>
          {descrizione ? (
            <DialogPrimitive.Description className="text-testo-tenue mt-1.5 text-sm">
              {descrizione}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <DialogPrimitive.Close
          className="text-testo-tenue hover:text-antracite absolute top-4 right-4 p-2 transition-colors duration-300"
          aria-label="Chiudi"
        >
          <X className="size-5" />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
