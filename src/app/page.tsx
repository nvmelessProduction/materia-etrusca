import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'

export default function Home() {
  return (
    <>
      <section className="contenitore py-20 md:py-32">
        <p className="occhiello">Cerveteri, laboratorio</p>
        <h1 className="font-display mt-6 max-w-4xl text-5xl font-light md:text-7xl lg:text-8xl">
          {site.manifesto}
        </h1>
        <p className="text-testo-tenue mt-8 max-w-xl text-lg leading-relaxed">
          Vasi-scultura ispirati alle forme etrusche. Ogni pezzo è colato e rifinito a mano: le
          piccole variazioni sono la firma, non un difetto.
        </p>
        <div className="mt-12">
          <Button asChild size="lg">
            <Link href="/collezioni">Guarda le collezioni</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
