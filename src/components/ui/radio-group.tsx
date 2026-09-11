'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

export function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} {...props} />
}

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'border-cemento bg-calce aspect-square size-5 shrink-0 rounded-full border transition-colors duration-300',
        'data-[state=checked]:border-antracite',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{ borderRadius: '9999px' }}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex size-full items-center justify-center">
        <span
          aria-hidden
          className="bg-antracite block size-2.5"
          style={{ borderRadius: '9999px' }}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
