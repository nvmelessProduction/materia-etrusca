import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'border-bordo bg-calce text-antracite h-12 w-full border px-3 transition-colors duration-300',
        'placeholder:text-testo-tenue/70',
        'focus:border-antracite focus-visible:outline-antracite focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1',
        'disabled:bg-tufo disabled:cursor-not-allowed disabled:opacity-60',
        'aria-[invalid=true]:border-errore',
        className,
      )}
      {...props}
    />
  )
}
