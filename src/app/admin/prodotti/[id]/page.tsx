import Link from 'next/link'
import { notFound } from 'next/navigation'
import { elencoCollezioniAdmin, prodottoAdmin } from '@/db/queries/admin'
import { EditorProdotto } from '@/components/admin/editor-prodotto'
import { EditorVarianti, type VarianteEditor } from '@/components/admin/editor-varianti'
import { EditorImmagini } from '@/components/admin/editor-immagini'
import { AzioneConConferma } from '@/components/admin/azione'
import { Stato, TitoloAdmin } from '@/components/admin/guscio'
import { cambiaStatoProdotto } from '@/lib/admin/azioni'
import { numero } from '@/db/queries/mappatori'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Prodotto' }

export default async function PaginaProdotto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [prodotto, collezioni] = await Promise.all([prodottoAdmin(id), elencoCollezioniAdmin()])
  if (!prodotto) notFound()

  const varianti: VarianteEditor[] = prodotto.variants
    .filter((variante) => variante.archivedAt === null)
    .map((variante) => ({
      id: variante.id,
      sku: variante.sku,
      altezzaCm: numero(variante.heightCm),
      diametroCm: numero(variante.diameterCm),
      pesoKg: numero(variante.weightKg),
      finitura: variante.finish,
      prezzoCents: variante.priceCents,
      giacenza: variante.stock,
      pesoImballoKg: numero(variante.packageWeightKg),
      volumeImballoL: numero(variante.packageVolumeL),
      posizione: variante.position,
    }))

  return (
    <div className="space-y-10">
      <TitoloAdmin
        titolo={prodotto.name}
        sottotitolo={`/prodotti/${prodotto.slug}`}
        azione={
          <div className="flex items-center gap-3">
            <Stato stato={prodotto.status} />
            <Link
              href={`/prodotti/${prodotto.slug}`}
              target="_blank"
              className="text-testo-tenue text-xs underline underline-offset-4"
            >
              Vedi in vetrina
            </Link>
          </div>
        }
      />

      <section>
        <h2 className="occhiello">Varianti</h2>
        <p className="text-testo-tenue mt-2 text-sm">
          Altezze e finiture, ognuna con prezzo, peso e giacenza propri.
        </p>
        <div className="mt-5">
          <EditorVarianti productId={prodotto.id} varianti={varianti} />
        </div>
      </section>

      <section>
        <h2 className="occhiello">Foto</h2>
        <p className="text-testo-tenue mt-2 text-sm">
          La prima è la copertina. Serve almeno una foto di proporzioni: è la domanda che fanno
          tutti.
        </p>
        <div className="mt-5">
          <EditorImmagini
            productId={prodotto.id}
            immagini={prodotto.images.map((immagine) => ({
              id: immagine.id,
              url: immagine.url,
              alt: immagine.alt,
              tipo: immagine.type,
            }))}
          />
        </div>
      </section>

      <section>
        <h2 className="occhiello">Scheda</h2>
        <div className="mt-5">
          <EditorProdotto
            iniziale={{
              id: prodotto.id,
              nome: prodotto.name,
              slug: prodotto.slug,
              collezioneId: prodotto.collectionId,
              descrizione: prodotto.description,
              storia: prodotto.story ?? '',
              prezzoBaseCents: prodotto.basePriceCents,
              pezzoUnico: prodotto.isUnique,
              suOrdinazione: prodotto.isMadeToOrder,
              giorniDiAttesa: prodotto.leadTimeDays,
              interno: prodotto.suitableIndoor,
              esterno: prodotto.suitableOutdoor,
              resistenteGelo: prodotto.frostResistant,
              cura: prodotto.careInstructions ?? '',
              stato: prodotto.status,
              seoTitle: prodotto.seoTitle ?? '',
              seoDescription: prodotto.seoDescription ?? '',
            }}
            collezioni={collezioni.map((collezione) => ({
              id: collezione.id,
              nome: collezione.nome,
            }))}
          />
        </div>
      </section>

      {prodotto.status !== 'archived' ? (
        <section className="border-bordo border-t pt-6">
          <AzioneConConferma
            variant="tenue"
            titolo="Archiviare questo prodotto?"
            descrizione="Sparisce dalla vetrina e dalle ricerche. Gli ordini già fatti restano leggibili, e puoi rimetterlo in vetrina quando vuoi. Non si cancella niente."
            conferma="Archivia"
            esegui={async () => {
              'use server'
              return cambiaStatoProdotto(prodotto.id, 'archived')
            }}
          >
            Archivia il prodotto
          </AzioneConConferma>
        </section>
      ) : null}
    </div>
  )
}
