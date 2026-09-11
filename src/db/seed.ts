import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  cartItems,
  carts,
  collections,
  contentBlocks,
  designProposalItems,
  designProposals,
  designRequestPhotos,
  designRequests,
  discountCodes,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  reviews,
  shippingRates,
  type Finitura,
  type NuovaProductVariant,
} from '@/db/schema'

/**
 * Dati di esempio. Le foto sono segnaposto: vanno sostituite con gli scatti
 * veri appena arrivano, sono la cosa che conta di più su un prodotto artigianale.
 */

function foto(seme: string, larghezza = 1600, altezza = 2000): string {
  return `https://picsum.photos/seed/${seme}/${larghezza}/${altezza}`
}

type DefinizioneVariante = {
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  finitura: Finitura
  prezzoCents: number
  giacenza: number
}

type DefinizioneProdotto = {
  slug: string
  nome: string
  collezione: string
  descrizione: string
  storia: string
  prezzoBaseCents: number
  pezzoUnico?: boolean
  suOrdinazione?: boolean
  giorniDiAttesa?: number
  interno?: boolean
  esterno?: boolean
  resistenteGelo?: boolean
  seoTitle: string
  seoDescription: string
  varianti: DefinizioneVariante[]
}

const CURA_STANDARD = `Il cemento vive: nei primi mesi può affiorare un velo biancastro di calce, si toglie con una spazzola morbida e acqua.
D'inverno solleva il vaso da terra di un paio di centimetri, con dei piedini o due listelli di legno: il gelo non rompe il cemento, rompe l'acqua ferma sotto.
Non usare acidi né prodotti anticalcare. Se vuoi fermare il colore, una cera per pietra naturale una volta all'anno basta e avanza.`

const COLLEZIONI = [
  {
    slug: 'buccheri',
    nome: 'Buccheri',
    descrizione:
      'Il bucchero era ceramica nera lucidata fino a sembrare metallo. Qui il cemento prende lo stesso nero profondo, ma resta ruvido dove la mano non arriva.',
    heroImageUrl: foto('bucchero-hero', 2400, 1400),
    posizione: 1,
    seoTitle: 'Buccheri — vasi in cemento nero fatti a mano',
    seoDescription:
      'Vasi-scultura in cemento pigmentato nero, ispirati al bucchero etrusco. Colati a mano a Cerveteri, per interno ed esterno.',
  },
  {
    slug: 'olle-e-dolii',
    nome: 'Olle e Dolii',
    descrizione:
      'I contenitori da dispensa degli Etruschi: pance larghe, bocche strette, nessuna decorazione. Sono i pezzi che reggono un ulivo o un limone senza sembrare un vaso da giardino.',
    heroImageUrl: foto('olla-hero', 2400, 1400),
    posizione: 2,
    seoTitle: 'Olle e Dolii — vasi grandi da esterno in cemento',
    seoDescription:
      'Fioriere di design per terrazzo e giardino, dai 60 ai 95 cm. Cemento colato a mano, resistente al gelo.',
  },
  {
    slug: 'cippi',
    nome: 'Cippi',
    descrizione:
      'Colonne basse, stele, basamenti. Nascono dai segnacoli delle tombe della Banditaccia: verticali, silenziosi, fatti per stare da soli.',
    heroImageUrl: foto('cippo-hero', 2400, 1400),
    posizione: 3,
    seoTitle: 'Cippi — vasi scultura verticali in cemento',
    seoDescription:
      'Vasi-scultura verticali ispirati ai cippi etruschi. Pezzi unici e su ordinazione, dal laboratorio di Cerveteri.',
  },
] as const

const PRODOTTI: DefinizioneProdotto[] = [
  {
    slug: 'kyathos',
    nome: 'Kyathos',
    collezione: 'buccheri',
    descrizione:
      'Coppa alta su stelo corto, con una sola ansa che sale oltre il bordo. È il pezzo con cui ho cominciato: il primo dove il cemento ha smesso di sembrare cemento.',
    storia:
      'Il kyathos serviva ad attingere il vino dal cratere. L’ansa esagerata non è decorazione: era la presa.',
    prezzoBaseCents: 21000,
    interno: true,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Kyathos — vaso in cemento con ansa alta',
    seoDescription:
      'Vaso-scultura in cemento colato a mano, coppa su stelo con ansa alta. Tre altezze, quattro finiture.',
    varianti: [
      {
        altezzaCm: 32,
        diametroCm: 24,
        pesoKg: 11,
        finitura: 'grezzo',
        prezzoCents: 18000,
        giacenza: 6,
      },
      {
        altezzaCm: 32,
        diametroCm: 24,
        pesoKg: 11,
        finitura: 'antracite',
        prezzoCents: 19500,
        giacenza: 4,
      },
      {
        altezzaCm: 45,
        diametroCm: 30,
        pesoKg: 22,
        finitura: 'grezzo',
        prezzoCents: 26000,
        giacenza: 3,
      },
      {
        altezzaCm: 45,
        diametroCm: 30,
        pesoKg: 22,
        finitura: 'levigato',
        prezzoCents: 29000,
        giacenza: 2,
      },
    ],
  },
  {
    slug: 'kantharos',
    nome: 'Kantharos',
    collezione: 'buccheri',
    descrizione:
      'Due anse simmetriche che partono dal piede e arrivano sopra il bordo. Sta bene al centro di un tavolo, anche vuoto.',
    storia:
      'Era la coppa di Dioniso. Sulle tombe di Cerveteri compare ovunque, sempre con quelle due anse sproporzionate.',
    prezzoBaseCents: 24000,
    resistenteGelo: true,
    seoTitle: 'Kantharos — coppa in cemento a due anse',
    seoDescription:
      'Coppa-scultura in cemento con due anse alte, colata a mano. Per interno ed esterno, resistente al gelo.',
    varianti: [
      {
        altezzaCm: 28,
        diametroCm: 34,
        pesoKg: 14,
        finitura: 'antracite',
        prezzoCents: 24000,
        giacenza: 5,
      },
      {
        altezzaCm: 28,
        diametroCm: 34,
        pesoKg: 14,
        finitura: 'ocra',
        prezzoCents: 24000,
        giacenza: 3,
      },
      {
        altezzaCm: 40,
        diametroCm: 44,
        pesoKg: 29,
        finitura: 'antracite',
        prezzoCents: 34000,
        giacenza: 2,
      },
    ],
  },
  {
    slug: 'oinochoe',
    nome: 'Oinochoe',
    collezione: 'buccheri',
    descrizione:
      'Brocca con la bocca a trifoglio, inclinata come se stesse già versando. Il taglio del bordo lo faccio a mano sul getto ancora fresco, quindi non ce n’è uno uguale a un altro.',
    storia:
      'L’oinochoe versava il vino nelle coppe. La bocca a trifoglio serviva a dirigere il getto senza sgocciolare.',
    prezzoBaseCents: 27000,
    resistenteGelo: true,
    seoTitle: 'Oinochoe — brocca scultura in cemento',
    seoDescription:
      'Brocca-scultura in cemento con bocca a trifoglio rifinita a mano. Ogni pezzo ha un profilo diverso.',
    varianti: [
      {
        altezzaCm: 38,
        diametroCm: 22,
        pesoKg: 13,
        finitura: 'grezzo',
        prezzoCents: 27000,
        giacenza: 4,
      },
      {
        altezzaCm: 38,
        diametroCm: 22,
        pesoKg: 13,
        finitura: 'ocra',
        prezzoCents: 27000,
        giacenza: 4,
      },
      {
        altezzaCm: 52,
        diametroCm: 28,
        pesoKg: 26,
        finitura: 'grezzo',
        prezzoCents: 38000,
        giacenza: 1,
      },
    ],
  },
  {
    slug: 'calice-nero',
    nome: 'Calice nero',
    collezione: 'buccheri',
    descrizione:
      'Il più essenziale della serie: una coppa bassa su un piede tronco. Nero pieno, senza anse, senza bordi.',
    storia:
      'Nei corredi funebri il calice compare a decine, tutti uguali e tutti leggermente diversi. Mi è sembrata una buona indicazione.',
    prezzoBaseCents: 15000,
    resistenteGelo: true,
    seoTitle: 'Calice nero — vaso basso in cemento antracite',
    seoDescription:
      'Vaso basso su piede in cemento pigmentato antracite. Forma essenziale, colata a mano a Cerveteri.',
    varianti: [
      {
        altezzaCm: 22,
        diametroCm: 30,
        pesoKg: 9,
        finitura: 'antracite',
        prezzoCents: 15000,
        giacenza: 8,
      },
      {
        altezzaCm: 30,
        diametroCm: 40,
        pesoKg: 18,
        finitura: 'antracite',
        prezzoCents: 22000,
        giacenza: 5,
      },
      {
        altezzaCm: 30,
        diametroCm: 40,
        pesoKg: 18,
        finitura: 'levigato',
        prezzoCents: 25000,
        giacenza: 2,
      },
    ],
  },
  {
    slug: 'olla',
    nome: 'Olla',
    collezione: 'olle-e-dolii',
    descrizione:
      'Pancia larga, bocca stretta, nessun ornamento. Regge un ulivo piccolo o un’agave senza che la pianta sembri infilata dentro un contenitore.',
    storia:
      'L’olla stava nella cucina di ogni casa etrusca. Serviva a conservare, non a mostrare: per questo non ha decorazioni.',
    prezzoBaseCents: 39000,
    esterno: true,
    interno: true,
    resistenteGelo: true,
    seoTitle: 'Olla — fioriera grande in cemento per terrazzo',
    seoDescription:
      'Fioriera di design in cemento colato a mano, dai 55 ai 75 cm. Resistente al gelo, con foro di drenaggio.',
    varianti: [
      {
        altezzaCm: 55,
        diametroCm: 52,
        pesoKg: 42,
        finitura: 'grezzo',
        prezzoCents: 39000,
        giacenza: 3,
      },
      {
        altezzaCm: 55,
        diametroCm: 52,
        pesoKg: 42,
        finitura: 'ocra',
        prezzoCents: 41000,
        giacenza: 2,
      },
      {
        altezzaCm: 75,
        diametroCm: 68,
        pesoKg: 78,
        finitura: 'grezzo',
        prezzoCents: 62000,
        giacenza: 2,
      },
    ],
  },
  {
    slug: 'dolio',
    nome: 'Dolio',
    collezione: 'olle-e-dolii',
    descrizione:
      'Il pezzo più grande che riesco a colare in un getto solo. Serve in due persone per spostarlo, e va messo dove resterà.',
    storia:
      'I dolii erano interrati fino a metà per tenere il vino fresco. Il profilo tronco-conico nasce da lì.',
    prezzoBaseCents: 89000,
    suOrdinazione: true,
    giorniDiAttesa: 35,
    esterno: true,
    interno: false,
    resistenteGelo: true,
    seoTitle: 'Dolio — vaso grande da esterno in cemento, 95 cm',
    seoDescription:
      'Vaso da esterno in cemento alto 95 cm, colato a mano su ordinazione. Consegna al piano su richiesta.',
    varianti: [
      {
        altezzaCm: 95,
        diametroCm: 82,
        pesoKg: 132,
        finitura: 'grezzo',
        prezzoCents: 89000,
        giacenza: 0,
      },
      {
        altezzaCm: 95,
        diametroCm: 82,
        pesoKg: 132,
        finitura: 'antracite',
        prezzoCents: 94000,
        giacenza: 0,
      },
    ],
  },
  {
    slug: 'pithos',
    nome: 'Pithos',
    collezione: 'olle-e-dolii',
    descrizione:
      'Versione più snella del dolio, con il bordo ribattuto in fuori. Sopporta bene l’acqua ferma: l’ho provato due inverni sul mio terrazzo.',
    storia:
      'Il pithos è il contenitore da granaio: alto, stretto, con il labbro sporgente per legarci sopra un telo.',
    prezzoBaseCents: 54000,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Pithos — vaso alto in cemento per giardino',
    seoDescription:
      'Vaso in cemento alto con labbro sporgente, per giardino e terrazzo. Colato a mano, resistente al gelo.',
    varianti: [
      {
        altezzaCm: 62,
        diametroCm: 46,
        pesoKg: 51,
        finitura: 'grezzo',
        prezzoCents: 54000,
        giacenza: 2,
      },
      {
        altezzaCm: 62,
        diametroCm: 46,
        pesoKg: 51,
        finitura: 'ocra',
        prezzoCents: 56000,
        giacenza: 1,
      },
      {
        altezzaCm: 80,
        diametroCm: 58,
        pesoKg: 88,
        finitura: 'grezzo',
        prezzoCents: 74000,
        giacenza: 1,
      },
    ],
  },
  {
    slug: 'anfora-da-terra',
    nome: 'Anfora da terra',
    collezione: 'olle-e-dolii',
    descrizione:
      'Due anse laterali basse e un fondo piatto, perché le anfore vere non stavano in piedi da sole e questa deve farlo.',
    storia:
      'Le anfore da trasporto avevano il fondo a punta: si infilavano nella sabbia della stiva. Questa no, ma la forma è quella.',
    prezzoBaseCents: 47000,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Anfora da terra — vaso scultura in cemento',
    seoDescription:
      'Anfora-scultura in cemento con anse laterali e fondo piatto. Per ingressi, terrazzi e giardini.',
    varianti: [
      {
        altezzaCm: 58,
        diametroCm: 40,
        pesoKg: 44,
        finitura: 'grezzo',
        prezzoCents: 47000,
        giacenza: 2,
      },
      {
        altezzaCm: 58,
        diametroCm: 40,
        pesoKg: 44,
        finitura: 'levigato',
        prezzoCents: 52000,
        giacenza: 1,
      },
    ],
  },
  {
    slug: 'cippo',
    nome: 'Cippo',
    collezione: 'cippi',
    descrizione:
      'Colonna bassa con la sommità scavata. Non è un vaso che contiene: è un vaso che sorregge. Ci sta bene una pianta sola, piccola.',
    storia:
      'I cippi segnavano le tombe a dado della Banditaccia. Quelli maschili erano colonnine, quelli femminili casette.',
    prezzoBaseCents: 33000,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Cippo — vaso scultura verticale in cemento',
    seoDescription:
      'Colonna-vaso in cemento ispirata ai cippi etruschi di Cerveteri. Tre altezze, colata a mano.',
    varianti: [
      {
        altezzaCm: 50,
        diametroCm: 20,
        pesoKg: 31,
        finitura: 'grezzo',
        prezzoCents: 33000,
        giacenza: 4,
      },
      {
        altezzaCm: 70,
        diametroCm: 22,
        pesoKg: 48,
        finitura: 'grezzo',
        prezzoCents: 44000,
        giacenza: 2,
      },
      {
        altezzaCm: 70,
        diametroCm: 22,
        pesoKg: 48,
        finitura: 'antracite',
        prezzoCents: 47000,
        giacenza: 1,
      },
    ],
  },
  {
    slug: 'stele',
    nome: 'Stele',
    collezione: 'cippi',
    descrizione:
      'Una lastra spessa che si alza dal suolo, con una fenditura verticale che tiene l’acqua. Sta bene addossata a un muro chiaro.',
    storia:
      'Le stele funerarie erano lastre piatte con il nome inciso. Qui l’incisione è vuota: la riempie la pianta.',
    prezzoBaseCents: 58000,
    pezzoUnico: true,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Stele — pezzo unico in cemento colato a mano',
    seoDescription:
      'Stele-vaso in cemento, pezzo unico. Lastra verticale con fenditura, alta 85 cm.',
    varianti: [
      {
        altezzaCm: 85,
        diametroCm: 30,
        pesoKg: 72,
        finitura: 'grezzo',
        prezzoCents: 58000,
        giacenza: 1,
      },
    ],
  },
  {
    slug: 'ara',
    nome: 'Ara',
    collezione: 'cippi',
    descrizione:
      'Basamento squadrato con la vasca ricavata in cima. Lo uso come tavolino basso quando non ci metto niente dentro.',
    storia: 'L’ara era l’altare domestico: un blocco, una superficie piana, nient’altro.',
    prezzoBaseCents: 68000,
    suOrdinazione: true,
    giorniDiAttesa: 28,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Ara — basamento vaso in cemento su ordinazione',
    seoDescription:
      'Basamento-vaso squadrato in cemento, colato su ordinazione in 28 giorni. Finitura grezza o levigata.',
    varianti: [
      {
        altezzaCm: 45,
        diametroCm: 45,
        pesoKg: 64,
        finitura: 'grezzo',
        prezzoCents: 68000,
        giacenza: 0,
      },
      {
        altezzaCm: 45,
        diametroCm: 45,
        pesoKg: 64,
        finitura: 'levigato',
        prezzoCents: 76000,
        giacenza: 1,
      },
    ],
  },
  {
    slug: 'tumulo',
    nome: 'Tumulo',
    collezione: 'cippi',
    descrizione:
      'Una calotta bassa e larga, quasi un sasso. È il pezzo che le persone toccano per prime quando entrano in laboratorio.',
    storia:
      'I tumuli della Banditaccia sono colline artificiali di tufo. Visti da lontano sembrano terra, da vicino sono architettura.',
    prezzoBaseCents: 29000,
    interno: true,
    esterno: true,
    resistenteGelo: true,
    seoTitle: 'Tumulo — vaso basso e largo in cemento',
    seoDescription:
      'Vaso basso a calotta in cemento colato a mano. Diametro fino a 60 cm, per interno ed esterno.',
    varianti: [
      {
        altezzaCm: 18,
        diametroCm: 44,
        pesoKg: 16,
        finitura: 'grezzo',
        prezzoCents: 29000,
        giacenza: 6,
      },
      {
        altezzaCm: 18,
        diametroCm: 44,
        pesoKg: 16,
        finitura: 'ocra',
        prezzoCents: 29000,
        giacenza: 3,
      },
      {
        altezzaCm: 24,
        diametroCm: 60,
        pesoKg: 33,
        finitura: 'grezzo',
        prezzoCents: 42000,
        giacenza: 2,
      },
    ],
  },
]

/** Il corriere paga sul peso a imballo, non su quello del pezzo. */
function pesoImballo(pesoKg: number): number {
  return Math.round((pesoKg * 1.12 + 2.5) * 100) / 100
}

function volumeImballo(altezzaCm: number, diametroCm: number): number {
  const lato = diametroCm + 12
  return Math.round(((lato * lato * (altezzaCm + 14)) / 1000) * 100) / 100
}

function sku(slugProdotto: string, altezza: number, finitura: Finitura): string {
  const radice = slugProdotto
    .replace(/[^a-z]/g, '')
    .slice(0, 4)
    .toUpperCase()
  return `ME-${radice}-${altezza}-${finitura.slice(0, 3).toUpperCase()}`
}

async function svuota(): Promise<void> {
  // L'ordine conta: prima i figli, poi i padri.
  await db.delete(designProposalItems)
  await db.delete(designProposals)
  await db.delete(designRequestPhotos)
  await db.delete(orderItems)
  await db.delete(reviews)
  await db.delete(orders)
  await db.delete(designRequests)
  await db.delete(cartItems)
  await db.delete(carts)
  await db.delete(productImages)
  await db.delete(productVariants)
  await db.delete(products)
  await db.delete(collections)
  await db.delete(shippingRates)
  await db.delete(discountCodes)
  await db.delete(contentBlocks)
}

async function seminaFasceSpedizione(): Promise<void> {
  const italia = [
    { min: 0, max: 5, prezzo: 900, eta: 3 },
    { min: 5, max: 15, prezzo: 1500, eta: 3 },
    { min: 15, max: 30, prezzo: 2500, eta: 4 },
    { min: 30, max: 50, prezzo: 3900, eta: 5 },
    { min: 50, max: 70, prezzo: 5900, eta: 6 },
  ]

  await db.insert(shippingRates).values([
    ...italia.map((fascia) => ({
      minWeightKg: String(fascia.min),
      maxWeightKg: String(fascia.max),
      method: 'courier' as const,
      priceCents: fascia.prezzo,
      zone: 'italia' as const,
      etaDays: fascia.eta,
    })),
    // Isole: stesse fasce, sovrapprezzo del corriere.
    ...italia.map((fascia) => ({
      minWeightKg: String(fascia.min),
      maxWeightKg: String(fascia.max),
      method: 'courier' as const,
      priceCents: Math.round(fascia.prezzo * 1.45),
      zone: 'isole' as const,
      etaDays: fascia.eta + 3,
    })),
    ...italia.map((fascia) => ({
      minWeightKg: String(fascia.min),
      maxWeightKg: String(fascia.max),
      method: 'courier' as const,
      priceCents: Math.round(fascia.prezzo * 2.4),
      zone: 'estero' as const,
      etaDays: fascia.eta + 6,
    })),
    // Oltre i 70 kg si va su pallet: prezzo indicativo, si conferma a voce.
    {
      minWeightKg: '70',
      maxWeightKg: '250',
      method: 'pallet' as const,
      priceCents: 14900,
      zone: 'italia' as const,
      etaDays: 10,
    },
    {
      minWeightKg: '0',
      maxWeightKg: '250',
      method: 'floor_delivery' as const,
      priceCents: 4900,
      zone: 'italia' as const,
      etaDays: 10,
    },
    {
      minWeightKg: '0',
      maxWeightKg: '9999',
      method: 'pickup' as const,
      priceCents: 0,
      zone: 'italia' as const,
      etaDays: 2,
    },
  ])
}

async function seminaCatalogo(): Promise<Map<string, { id: string; varianti: string[] }>> {
  const idCollezioni = new Map<string, string>()

  for (const collezione of COLLEZIONI) {
    const [riga] = await db
      .insert(collections)
      .values({
        slug: collezione.slug,
        name: collezione.nome,
        description: collezione.descrizione,
        heroImageUrl: collezione.heroImageUrl,
        position: collezione.posizione,
        seoTitle: collezione.seoTitle,
        seoDescription: collezione.seoDescription,
      })
      .returning({ id: collections.id })
    if (riga) idCollezioni.set(collezione.slug, riga.id)
  }

  const risultato = new Map<string, { id: string; varianti: string[] }>()

  for (const [indice, definizione] of PRODOTTI.entries()) {
    const [prodotto] = await db
      .insert(products)
      .values({
        slug: definizione.slug,
        name: definizione.nome,
        collectionId: idCollezioni.get(definizione.collezione) ?? null,
        description: definizione.descrizione,
        story: definizione.storia,
        basePriceCents: definizione.prezzoBaseCents,
        isUnique: definizione.pezzoUnico ?? false,
        isMadeToOrder: definizione.suOrdinazione ?? false,
        leadTimeDays: definizione.giorniDiAttesa ?? 0,
        suitableIndoor: definizione.interno ?? true,
        suitableOutdoor: definizione.esterno ?? true,
        frostResistant: definizione.resistenteGelo ?? false,
        careInstructions: CURA_STANDARD,
        status: 'active',
        seoTitle: definizione.seoTitle,
        seoDescription: definizione.seoDescription,
        // Date scaglionate, così l'ordinamento per novità ha un senso.
        createdAt: new Date(Date.now() - indice * 1000 * 60 * 60 * 36),
      })
      .returning({ id: products.id })

    if (!prodotto) continue

    const valoriVarianti: NuovaProductVariant[] = definizione.varianti.map(
      (variante, posizione) => ({
        productId: prodotto.id,
        sku: sku(definizione.slug, variante.altezzaCm, variante.finitura),
        heightCm: String(variante.altezzaCm),
        diameterCm: String(variante.diametroCm),
        weightKg: String(variante.pesoKg),
        finish: variante.finitura,
        priceCents: variante.prezzoCents,
        stock: variante.giacenza,
        packageWeightKg: String(pesoImballo(variante.pesoKg)),
        packageVolumeL: String(volumeImballo(variante.altezzaCm, variante.diametroCm)),
        position: posizione,
      }),
    )

    const varianti = await db
      .insert(productVariants)
      .values(valoriVarianti)
      .returning({ id: productVariants.id })

    await db.insert(productImages).values([
      {
        productId: prodotto.id,
        url: foto(`${definizione.slug}-1`),
        alt: `${definizione.nome} in cemento grezzo, ripreso di tre quarti su fondo neutro`,
        position: 0,
        type: 'studio',
      },
      {
        productId: prodotto.id,
        url: foto(`${definizione.slug}-2`),
        alt: `${definizione.nome} su un terrazzo, accanto a una pianta di ulivo`,
        position: 1,
        type: 'ambientata',
      },
      {
        productId: prodotto.id,
        url: foto(`${definizione.slug}-3`, 1600, 1600),
        alt: `Dettaglio della superficie del ${definizione.nome}: porosità e segni del cassero`,
        position: 2,
        type: 'dettaglio',
      },
      {
        productId: prodotto.id,
        url: foto(`${definizione.slug}-4`, 1600, 1600),
        // La foto di scala risponde alla domanda che tutti fanno: "ma quanto è grande?"
        alt: `${definizione.nome} accanto a una sedia, per capirne le proporzioni reali`,
        position: 3,
        type: 'scala',
      },
    ])

    risultato.set(definizione.slug, {
      id: prodotto.id,
      varianti: varianti.map((variante) => variante.id),
    })
  }

  return risultato
}

async function seminaRecensioni(
  catalogo: Map<string, { id: string; varianti: string[] }>,
): Promise<void> {
  const daInserire = [
    {
      slug: 'olla',
      nome: 'Chiara D.',
      voto: 5,
      testo:
        'Arrivata imballata benissimo, due persone per portarla su. Il colore dal vivo è più caldo che nelle foto. Ci ho messo un ulivo, sta esattamente come speravo.',
      foto: foto('rec-olla', 1200, 1200),
    },
    {
      slug: 'olla',
      nome: 'Marco T.',
      voto: 4,
      testo:
        'Bellissima. Toglierei mezza stella solo perché ho aspettato tre giorni più del previsto, ma mi avevano avvisato.',
      foto: null,
    },
    {
      slug: 'kyathos',
      nome: 'Silvia R.',
      voto: 5,
      testo:
        'Ho scritto per chiedere se stava bene nel mio ingresso, mi è arrivata una proposta con la foto del mio corridoio. Ho comprato quello e un tumulo.',
      foto: foto('rec-kyathos', 1200, 1200),
    },
    {
      slug: 'cippo',
      nome: 'Studio Vento',
      voto: 5,
      testo: 'Presi tre pezzi per una hall. Il cliente li ha notati prima dei divani.',
      foto: null,
    },
    {
      slug: 'tumulo',
      nome: 'Anna P.',
      voto: 5,
      testo: 'Pesante il giusto, non si muove col vento. La superficie è viva, si sente la mano.',
      foto: null,
    },
  ]

  for (const recensione of daInserire) {
    const prodotto = catalogo.get(recensione.slug)
    if (!prodotto) continue
    await db.insert(reviews).values({
      productId: prodotto.id,
      customerName: recensione.nome,
      rating: recensione.voto,
      body: recensione.testo,
      photoUrl: recensione.foto,
      approved: true,
    })
  }
}

async function seminaSconti(): Promise<void> {
  await db.insert(discountCodes).values([
    {
      code: 'BENVENUTO10',
      type: 'percent',
      value: 10,
      minOrderCents: 15000,
      usageLimit: null,
      active: true,
    },
    {
      code: 'LABORATORIO25',
      type: 'fixed',
      value: 2500,
      minOrderCents: 40000,
      usageLimit: 50,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      active: true,
    },
  ])
}

async function seminaRichiesteProgetto(
  catalogo: Map<string, { id: string; varianti: string[] }>,
): Promise<void> {
  // 1) Richiesta appena arrivata, ancora da lavorare.
  const [nuova] = await db
    .insert(designRequests)
    .values({
      publicToken: randomUUID(),
      name: 'Giulia Ferrante',
      email: 'giulia.ferrante@example.com',
      phone: '+39 333 1122334',
      city: 'Roma',
      postalCode: '00195',
      spaceType: 'terrazzo',
      widthM: '4.20',
      depthM: '2.10',
      exposure: 'sole',
      styleWanted: 'mediterraneo',
      budgetRange: '500-1000',
      freeNotes:
        'Terrazzo all’ultimo piano, molto ventoso. Vorrei due o tre pezzi alti che facciano da schermo verso il palazzo di fronte. Non ho ascensore.',
      status: 'new',
    })
    .returning({ id: designRequests.id })

  if (nuova) {
    await db.insert(designRequestPhotos).values([
      { requestId: nuova.id, url: foto('progetto-giulia-1', 1600, 1200), position: 0 },
      { requestId: nuova.id, url: foto('progetto-giulia-2', 1600, 1200), position: 1 },
    ])
  }

  // 2) Richiesta già lavorata, con proposta pubblicata: serve a vedere la pagina privata.
  const inviataIl = new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
  const [inviata] = await db
    .insert(designRequests)
    .values({
      publicToken: '11111111-2222-4333-8444-555555555555',
      name: 'Davide Corsi',
      email: 'davide.corsi@example.com',
      phone: '+39 347 9988776',
      city: 'Ladispoli',
      postalCode: '00055',
      spaceType: 'ingresso',
      widthM: '2.00',
      depthM: '1.20',
      exposure: 'mezzombra',
      styleWanted: 'minimale',
      budgetRange: '250-500',
      freeNotes: 'Ingresso stretto, pavimento in cotto. Cerco una cosa sola, alta e sottile.',
      status: 'sent',
      sentAt: inviataIl,
      expiresAt: new Date(inviataIl.getTime() + 1000 * 60 * 60 * 24 * 30),
    })
    .returning({ id: designRequests.id })

  if (!inviata) return

  await db
    .insert(designRequestPhotos)
    .values([{ requestId: inviata.id, url: foto('progetto-davide-1', 1600, 1200), position: 0 }])

  const cippo = catalogo.get('cippo')
  const tumulo = catalogo.get('tumulo')

  const [proposta] = await db
    .insert(designProposals)
    .values({
      requestId: inviata.id,
      renderImageUrl: foto('proposta-davide', 1600, 1200),
      artisanMessage: `Davide, ho guardato la foto: il cotto è caldo e il corridoio è stretto, quindi eviterei qualsiasi cosa larga.

Ti metto un Cippo da 70 cm sulla sinistra, contro il muro chiaro: prende poco spazio a terra e alza lo sguardo. Nella finitura grezza, che sul cotto sta meglio dell'antracite.

Sotto, un Tumulo basso vicino alla porta: serve a chiudere l'angolo e a non lasciare quel vuoto. Se preferisci un pezzo solo, togli pure il secondo dalla lista: il totale si aggiorna da sé.`,
      totalEstimateCents: 44000 + 29000,
      publishedAt: inviataIl,
    })
    .returning({ id: designProposals.id })

  if (!proposta) return

  const vociProposta: { variantId: string; quantita: number; nota: string; posizione: number }[] =
    []
  if (cippo?.varianti[1]) {
    vociProposta.push({
      variantId: cippo.varianti[1],
      quantita: 1,
      nota: 'Settanta centimetri, grezzo. È il pezzo che regge tutto l’ingresso.',
      posizione: 0,
    })
  }
  if (tumulo?.varianti[0]) {
    vociProposta.push({
      variantId: tumulo.varianti[0],
      quantita: 1,
      nota: 'Basso, vicino alla porta. Se lo togli non cambia il senso della cosa.',
      posizione: 1,
    })
  }

  if (vociProposta.length > 0) {
    await db.insert(designProposalItems).values(
      vociProposta.map((voce) => ({
        proposalId: proposta.id,
        variantId: voce.variantId,
        quantity: voce.quantita,
        note: voce.nota,
        position: voce.posizione,
      })),
    )
  }
}

async function seminaContenuti(): Promise<void> {
  await db.insert(contentBlocks).values([
    {
      key: 'faq.tempi',
      group: 'faq',
      title: 'Quanto tempo passa fra l’ordine e la consegna?',
      body: 'I pezzi a magazzino partono in due giorni lavorativi e arrivano in tre o quattro. Quelli su ordinazione li colo apposta: il tempo è scritto sulla scheda, di solito fra le tre e le cinque settimane. Il cemento ha bisogno dei suoi giorni per fare presa, non si accorcia.',
      position: 0,
    },
    {
      key: 'faq.gelo',
      group: 'faq',
      title: 'Posso lasciarlo fuori d’inverno?',
      body: 'Sì, i pezzi segnati come resistenti al gelo restano fuori tutto l’anno. L’unica accortezza è sollevarli da terra di un paio di centimetri, così sotto non ristagna l’acqua. Non è il freddo a rompere il cemento: è il ghiaccio che si forma nell’acqua ferma.',
      position: 1,
    },
    {
      key: 'faq.differenze',
      group: 'faq',
      title: 'Il pezzo che ricevo sarà identico alla foto?',
      body: 'No, e non deve esserlo. Ogni getto prende il colore un po’ diverso, e le bolle d’aria cadono dove capita. Le piccole variazioni sono la firma, non un difetto. Se una differenza ti sembra eccessiva, scrivimi e ne parliamo.',
      position: 2,
    },
    {
      key: 'faq.peso',
      group: 'faq',
      title: 'Chi mi aiuta a portarlo su?',
      body: 'Il corriere consegna al piano strada. Per i pezzi sopra i 50 kg puoi aggiungere la consegna al piano al momento dell’ordine, oppure scrivermi: se abiti vicino a Cerveteri te lo porto io.',
      position: 3,
    },
    {
      key: 'faq.reso',
      group: 'faq',
      title: 'Se non mi piace posso renderlo?',
      body: 'Hai quattordici giorni per ripensarci. Il pezzo deve tornare integro e nel suo imballo: le spese di rientro sono a tuo carico perché il peso conta, e per i pezzi grandi non sono poche. I pezzi fatti su misura non si possono rendere.',
      position: 4,
    },
    {
      key: 'home.manifesto',
      group: 'home',
      title: 'Colo il cemento a mano, una forma alla volta.',
      body: 'Lavoro a Cerveteri, a due chilometri dalla necropoli. Le forme le prendo da lì: olle, cippi, buccheri. Il materiale no, quello è cemento, e si comporta come vuole lui.',
      position: 0,
    },
  ])
}

async function main(): Promise<void> {
  console.info('Svuoto le tabelle…')
  await svuota()

  console.info('Fasce di spedizione…')
  await seminaFasceSpedizione()

  console.info('Collezioni, prodotti, varianti e immagini…')
  const catalogo = await seminaCatalogo()

  console.info('Recensioni…')
  await seminaRecensioni(catalogo)

  console.info('Codici sconto…')
  await seminaSconti()

  console.info('Richieste di progetto…')
  await seminaRichiesteProgetto(catalogo)

  console.info('Contenuti editoriali…')
  await seminaContenuti()

  // La numerazione degli ordini riparte da uno a ogni seed.
  await db.execute(sql`alter sequence order_number_seq restart with 1`)

  console.info(`Fatto: ${COLLEZIONI.length} collezioni, ${PRODOTTI.length} prodotti.`)
}

main()
  .then(() => process.exit(0))
  .catch((errore: unknown) => {
    console.error('Seed fallito:', errore)
    process.exit(1)
  })
