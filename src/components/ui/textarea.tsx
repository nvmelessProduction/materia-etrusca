import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'border-bordo bg-calce text-antracite min-h-28 w-full border px-3 py-2.5 transition-colors duration-300',
        'placeholder:text-testo-tenue/70',
        'focus:border-antracite focus-visible:outline-antracite focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1',
        'aria-[invalid=true]:border-errore',
        className,
      )}
      {...props}
    />
  )
}
