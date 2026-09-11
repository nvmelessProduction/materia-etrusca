import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type Briciola = { href?: string; etichetta: string }

export function Briciole({ voci }: { voci: Briciola[] }) {
  return (
    <nav aria-label="Percorso" className="text-testo-tenue text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-antracite transition-colors duration-300">
            Home
          </Link>
        </li>
        {voci.map((voce, indice) => (
          <li key={`${voce.etichetta}-${indice}`} className="flex items-center gap-1.5">
            <ChevronRight aria-hidden className="text-cemento size-3" />
            {voce.href ? (
              <Link
                href={voce.href}
                className="hover:text-antracite transition-colors duration-300"
              >
                {voce.etichetta}
              </Link>
            ) : (
              <span aria-current="page" className="text-antracite">
                {voce.etichetta}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
