'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close
export const SheetTitle = DialogPrimitive.Title
export const SheetDescription = DialogPrimitive.Description

type Lato = 'destra' | 'sinistra' | 'basso'

const posizione: Record<Lato, string> = {
  destra: 'inset-y-0 right-0 h-full w-full max-w-md border-l',
  sinistra: 'inset-y-0 left-0 h-full w-full max-w-sm border-r',
  basso: 'inset-x-0 bottom-0 max-h-[85vh] w-full border-t',
}

export function SheetContent({
  className,
  children,
  lato = 'destra',
  titolo,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { lato?: Lato; titolo: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-antracite/40 fixed inset-0 z-50 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'border-bordo bg-calce shadow-sollevato fixed z-50 flex flex-col outline-none',
          posizione[lato],
          className,
        )}
        {...props}
      >
        <div className="border-bordo flex items-center justify-between border-b px-5 py-4">
          <DialogPrimitive.Title className="font-display text-2xl font-light">
            {titolo}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="text-testo-tenue hover:text-antracite p-2 transition-colors duration-300"
            aria-label="Chiudi"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
