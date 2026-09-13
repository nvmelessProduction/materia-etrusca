import type { Metadata } from 'next'
import Link from 'next/link'
import { contenutiDelGruppo } from '@/db/queries/contenuti'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { DatiStrutturati } from '@/lib/seo/dati-strutturati'
import { schemaFaq } from '@/lib/seo/schemi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Domande frequenti',
  description:
    'Tempi di consegna, gelo, differenze fra un pezzo e l’altro, peso, resi: le domande che mi fanno più spesso, con le risposte.',
  alternates: { canonical: '/faq' },
}

export default async function PaginaFaq() {
  const voci = await contenutiDelGruppo('faq')

  return (
    <>
      {voci.length > 0 ? (
        <DatiStrutturati
          dati={schemaFaq(voci.map((voce) => ({ domanda: voce.titolo, risposta: voce.corpo })))}
        />
      ) : null}

      <PaginaTesto
        occhiello="Domande frequenti"
        titolo="Quello che mi chiedono sempre."
        introduzione="Se non trovi la tua, scrivimi: rispondo io, di solito in giornata."
      >
        <Accordion type="multiple" className="border-bordo border-t">
          {voci.map((voce) => (
            <AccordionItem key={voce.chiave} value={voce.chiave}>
              <AccordionTrigger>{voce.titolo}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-base">
                  {voce.corpo
                    .split('\n')
                    .filter(Boolean)
                    .map((paragrafo, indice) => (
                      <p key={indice}>{paragrafo}</p>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-10">
          <Link href="/contatti" className="hover:text-terracotta underline underline-offset-4">
            Scrivimi
          </Link>{' '}
          oppure{' '}
          <Link href="/progetto" className="hover:text-terracotta underline underline-offset-4">
            mandami la foto del tuo spazio
          </Link>
          .
        </p>
      </PaginaTesto>
    </>
  )
}
