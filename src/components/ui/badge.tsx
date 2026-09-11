import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 border px-2 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em]',
  {
    variants: {
      variant: {
        neutro: 'border-bordo bg-transparent text-testo-tenue',
        pieno: 'border-antracite bg-antracite text-calce',
        accento: 'border-terracotta bg-terracotta text-calce',
        positivo: 'border-oliva bg-transparent text-oliva',
        attenzione: 'border-terracotta bg-transparent text-terracotta',
      },
    },
    defaultVariants: { variant: 'neutro' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
