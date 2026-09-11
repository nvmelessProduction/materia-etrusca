import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Select nativo: su mobile apre la ruota di sistema, che è più rapida
 * di qualunque menu costruito a mano, e non costa JavaScript.
 */
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'border-bordo bg-calce text-antracite h-12 w-full appearance-none border px-3 pr-10 transition-colors duration-300',
          'focus:border-antracite focus-visible:outline-antracite focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1',
          'disabled:bg-tufo disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-testo-tenue pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  )
}
