'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const valori = props.value ?? props.defaultValue ?? []

  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center py-3 select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-cemento relative h-px w-full grow">
        <SliderPrimitive.Range className="bg-antracite absolute h-px" />
      </SliderPrimitive.Track>
      {valori.map((_, indice) => (
        <SliderPrimitive.Thumb
          // Le maniglie non hanno identità propria: l'indice è la chiave giusta.
          key={indice}
          className="border-antracite bg-calce hover:bg-tufo focus-visible:outline-antracite block size-5 border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
