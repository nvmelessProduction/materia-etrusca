import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-wide transition-colors duration-300 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /* Un solo pulsante primario per schermata: usalo con parsimonia. */
        primario: 'bg-terracotta text-calce hover:bg-terracotta-scuro',
        secondario:
          'border border-antracite bg-transparent text-antracite hover:bg-antracite hover:text-calce',
        tenue: 'border border-bordo bg-tufo text-antracite hover:border-antracite',
        scuro: 'bg-antracite text-calce hover:bg-antracite-chiaro',
        fantasma: 'bg-transparent text-antracite hover:bg-tufo',
        collegamento:
          'bg-transparent p-0 text-antracite underline underline-offset-4 hover:text-terracotta',
        distruttivo: 'bg-errore text-calce hover:opacity-90',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        /* 48px: bersaglio comodo da pollice. */
        md: 'h-12 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
        icona: 'size-12',
        nessuna: '',
      },
    },
    defaultVariants: { variant: 'primario', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
