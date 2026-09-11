import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------ *
 * Enumerazioni
 * ------------------------------------------------------------------ */

export const statoProdottoEnum = pgEnum('product_status', ['draft', 'active', 'archived'])

export const finituraEnum = pgEnum('variant_finish', ['grezzo', 'levigato', 'ocra', 'antracite'])

export const tipoImmagineEnum = pgEnum('image_type', [
  'studio',
  'ambientata',
  'dettaglio',
  'scala',
  'video',
])

export const statoOrdineEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

export const metodoSpedizioneEnum = pgEnum('shipping_method', [
  'courier',
  'pallet',
  'floor_delivery',
  'pickup',
])

export const zonaSpedizioneEnum = pgEnum('shipping_zone', ['italia', 'isole', 'estero'])

export const metodoPagamentoEnum = pgEnum('payment_method', ['stripe', 'paypal', 'bank_transfer'])

export const tipoSpazioEnum = pgEnum('space_type', [
  'terrazzo',
  'giardino',
  'ingresso',
  'interno',
  'commerciale',
])

export const esposizioneEnum = pgEnum('exposure', ['sole', 'mezzombra', 'ombra'])

export const stileEnum = pgEnum('style_wanted', ['minimale', 'mediterraneo', 'scenografico'])

export const statoRichiestaEnum = pgEnum('design_request_status', [
  'new',
  'in_progress',
  'sent',
  'converted',
  'expired',
])

export const tipoScontoEnum = pgEnum('discount_type', ['percent', 'fixed'])

export const ruoloUtenteEnum = pgEnum('user_role', ['customer', 'admin'])

/* ------------------------------------------------------------------ *
 * Catalogo
 * ------------------------------------------------------------------ */

export const collections = pgTable(
  'collections',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 140 }).notNull(),
    name: varchar({ length: 180 }).notNull(),
    description: text(),
    heroImageUrl: text(),
    position: integer().notNull().default(0),
    seoTitle: varchar({ length: 180 }),
    seoDescription: varchar({ length: 320 }),
    archivedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('collections_slug_key').on(t.slug),
    index('collections_position_idx').on(t.position),
  ],
)

export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: varchar({ length: 160 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    collectionId: uuid().references(() => collections.id, { onDelete: 'set null' }),
    /** Descrizione commerciale, HTML sanificato in fase di salvataggio. */
    description: text().notNull().default(''),
    /** Due righe sull'ispirazione etrusca del pezzo. */
    story: text(),
    basePriceCents: integer().notNull(),
    isUnique: boolean().notNull().default(false),
    isMadeToOrder: boolean().notNull().default(false),
    leadTimeDays: integer().notNull().default(0),
    suitableIndoor: boolean().notNull().default(true),
    suitableOutdoor: boolean().notNull().default(true),
    frostResistant: boolean().notNull().default(false),
    careInstructions: text(),
    status: statoProdottoEnum().notNull().default('draft'),
    seoTitle: varchar({ length: 180 }),
    seoDescription: varchar({ length: 320 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('products_slug_key').on(t.slug),
    index('products_collection_idx').on(t.collectionId),
    index('products_status_idx').on(t.status),
    index('products_created_idx').on(t.createdAt),
  ],
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar({ length: 64 }).notNull(),
    heightCm: numeric({ precision: 6, scale: 1 }).notNull(),
    diameterCm: numeric({ precision: 6, scale: 1 }).notNull(),
    weightKg: numeric({ precision: 7, scale: 2 }).notNull(),
    finish: finituraEnum().notNull(),
    priceCents: integer().notNull(),
    stock: integer().notNull().default(0),
    /** Peso a imballo fatto: è questo che paga il corriere. */
    packageWeightKg: numeric({ precision: 7, scale: 2 }).notNull(),
    packageVolumeL: numeric({ precision: 8, scale: 2 }).notNull(),
    position: integer().notNull().default(0),
    archivedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_variants_sku_key').on(t.sku),
    index('product_variants_product_idx').on(t.productId),
    index('product_variants_height_idx').on(t.heightCm),
    index('product_variants_price_idx').on(t.priceCents),
    index('product_variants_finish_idx').on(t.finish),
  ],
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid().references(() => productVariants.id, { onDelete: 'set null' }),
    url: text().notNull(),
    alt: varchar({ length: 300 }).notNull(),
    position: integer().notNull().default(0),
    type: tipoImmagineEnum().notNull().default('studio'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('product_images_product_idx').on(t.productId, t.position),
    index('product_images_variant_idx').on(t.variantId),
  ],
)

/* ------------------------------------------------------------------ *
 * Auth.js — l'account è facoltativo, serve solo a chi vuole lo storico
 * ------------------------------------------------------------------ */

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 200 }),
    email: varchar({ length: 320 }).notNull(),
    emailVerified: timestamp({ withTimezone: true }),
    image: text(),
    role: ruoloUtenteEnum().notNull().default('customer'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_key').on(t.email)],
)

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar({ length: 40 }).notNull(),
    provider: varchar({ length: 80 }).notNull(),
    providerAccountId: varchar({ length: 200 }).notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: varchar({ length: 80 }),
    scope: text(),
    id_token: text(),
    session_state: text(),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index('accounts_user_idx').on(t.userId),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
)

/* ------------------------------------------------------------------ *
 * Clienti e indirizzi
 * ------------------------------------------------------------------ */

export const customers = pgTable(
  'customers',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    email: varchar({ length: 320 }).notNull(),
    name: varchar({ length: 200 }),
    phone: varchar({ length: 40 }),
    stripeCustomerId: varchar({ length: 80 }),
    vatNumber: varchar({ length: 20 }),
    sdiCode: varchar({ length: 10 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('customers_email_key').on(t.email),
    index('customers_user_idx').on(t.userId),
    index('customers_stripe_idx').on(t.stripeCustomerId),
  ],
)

export const addresses = pgTable(
  'addresses',
  {
    id: uuid().primaryKey().defaultRandom(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    line1: varchar({ length: 200 }).notNull(),
    line2: varchar({ length: 200 }),
    city: varchar({ length: 120 }).notNull(),
    postalCode: varchar({ length: 12 }).notNull(),
    province: varchar({ length: 4 }).notNull(),
    country: varchar({ length: 2 }).notNull().default('IT'),
    isDefault: boolean().notNull().default(false),
    /** ZTL, piano alto senza ascensore, cortile stretto: cose che il corriere deve sapere. */
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('addresses_customer_idx').on(t.customerId),
    index('addresses_postal_idx').on(t.postalCode),
  ],
)

/* ------------------------------------------------------------------ *
 * Ordini
 * ------------------------------------------------------------------ */

/** Numerazione leggibile e progressiva: ME-2026-00042. */
export const orderNumberSeq = pgSequence('order_number_seq', { startWith: 1, increment: 1 })

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderNumber: varchar({ length: 24 })
      .notNull()
      .default(
        sql`'ME-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0')`,
      ),
    customerId: uuid().references(() => customers.id, { onDelete: 'set null' }),
    email: varchar({ length: 320 }).notNull(),
    status: statoOrdineEnum().notNull().default('pending'),
    subtotalCents: integer().notNull(),
    shippingCents: integer().notNull().default(0),
    discountCents: integer().notNull().default(0),
    totalCents: integer().notNull(),
    discountCode: varchar({ length: 40 }),
    shippingMethod: metodoSpedizioneEnum().notNull(),
    paymentMethod: metodoPagamentoEnum().notNull().default('stripe'),
    /** Fotografia dell'indirizzo al momento dell'ordine: non deve cambiare mai più. */
    shippingAddress: jsonb().notNull(),
    phone: varchar({ length: 40 }),
    deliveryNotes: text(),
    invoiceRequested: boolean().notNull().default(false),
    vatNumber: varchar({ length: 20 }),
    sdiCode: varchar({ length: 10 }),
    trackingCarrier: varchar({ length: 80 }),
    trackingNumber: varchar({ length: 120 }),
    stripePaymentIntentId: varchar({ length: 120 }),
    stripeSessionId: varchar({ length: 200 }),
    paypalOrderId: varchar({ length: 120 }),
    projectId: uuid().references(() => designRequests.id, { onDelete: 'set null' }),
    notes: text(),
    /** Promemoria già spediti: evitano di scrivere due volte allo stesso cliente. */
    reviewRequestSentAt: timestamp({ withTimezone: true }),
    paidAt: timestamp({ withTimezone: true }),
    shippedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('orders_number_key').on(t.orderNumber),
    uniqueIndex('orders_stripe_session_key').on(t.stripeSessionId),
    index('orders_customer_idx').on(t.customerId),
    index('orders_email_idx').on(t.email),
    index('orders_status_idx').on(t.status),
    index('orders_created_idx').on(t.createdAt),
    index('orders_project_idx').on(t.projectId),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid().references(() => productVariants.id, { onDelete: 'set null' }),
    /** Nome e misure congelati: se il prodotto cambia, l'ordine resta leggibile com'era. */
    productNameSnapshot: varchar({ length: 200 }).notNull(),
    variantSnapshot: jsonb().notNull(),
    quantity: integer().notNull(),
    unitPriceCents: integer().notNull(),
    totalCents: integer().notNull(),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_variant_idx').on(t.variantId),
  ],
)

/* ------------------------------------------------------------------ *
 * Progetta il tuo angolo
 * ------------------------------------------------------------------ */

export const designRequests = pgTable(
  'design_requests',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Token dell'URL privato: non indovinabile, non indicizzato. */
    publicToken: uuid().notNull().defaultRandom(),
    name: varchar({ length: 200 }).notNull(),
    email: varchar({ length: 320 }).notNull(),
    phone: varchar({ length: 40 }),
    city: varchar({ length: 120 }),
    postalCode: varchar({ length: 12 }),
    spaceType: tipoSpazioEnum().notNull(),
    widthM: numeric({ precision: 5, scale: 2 }),
    depthM: numeric({ precision: 5, scale: 2 }),
    exposure: esposizioneEnum(),
    styleWanted: stileEnum(),
    budgetRange: varchar({ length: 40 }),
    freeNotes: text(),
    status: statoRichiestaEnum().notNull().default('new'),
    internalNotes: text(),
    marketingConsent: boolean().notNull().default(false),
    /** Le foto si cancellano dopo 12 mesi: qui si tiene traccia di quando è successo. */
    photosPurgedAt: timestamp({ withTimezone: true }),
    reminderSentAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('design_requests_token_key').on(t.publicToken),
    index('design_requests_status_idx').on(t.status),
    index('design_requests_created_idx').on(t.createdAt),
    index('design_requests_email_idx').on(t.email),
    index('design_requests_expires_idx').on(t.expiresAt),
  ],
)

export const designRequestPhotos = pgTable(
  'design_request_photos',
  {
    id: uuid().primaryKey().defaultRandom(),
    requestId: uuid()
      .notNull()
      .references(() => designRequests.id, { onDelete: 'cascade' }),
    url: text().notNull(),
    /** Chiave del file sul servizio di storage: serve per cancellarlo davvero. */
    storageKey: varchar({ length: 200 }),
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('design_request_photos_request_idx').on(t.requestId, t.position)],
)

export const designProposals = pgTable(
  'design_proposals',
  {
    id: uuid().primaryKey().defaultRandom(),
    requestId: uuid()
      .notNull()
      .references(() => designRequests.id, { onDelete: 'cascade' }),
    renderImageUrl: text(),
    /** Il messaggio dell'artigiano che spiega le scelte: è il cuore della proposta. */
    artisanMessage: text().notNull().default(''),
    totalEstimateCents: integer().notNull().default(0),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('design_proposals_request_idx').on(t.requestId)],
)

export const designProposalItems = pgTable(
  'design_proposal_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    proposalId: uuid()
      .notNull()
      .references(() => designProposals.id, { onDelete: 'cascade' }),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer().notNull().default(1),
    note: text(),
    position: integer().notNull().default(0),
  },
  (t) => [
    index('design_proposal_items_proposal_idx').on(t.proposalId, t.position),
    index('design_proposal_items_variant_idx').on(t.variantId),
  ],
)

/* ------------------------------------------------------------------ *
 * Spedizioni, sconti, recensioni
 * ------------------------------------------------------------------ */

export const shippingRates = pgTable(
  'shipping_rates',
  {
    id: uuid().primaryKey().defaultRandom(),
    minWeightKg: numeric({ precision: 7, scale: 2 }).notNull(),
    maxWeightKg: numeric({ precision: 7, scale: 2 }).notNull(),
    method: metodoSpedizioneEnum().notNull(),
    priceCents: integer().notNull(),
    zone: zonaSpedizioneEnum().notNull().default('italia'),
    etaDays: integer().notNull().default(5),
    active: boolean().notNull().default(true),
  },
  (t) => [
    index('shipping_rates_zone_weight_idx').on(t.zone, t.minWeightKg, t.maxWeightKg),
    index('shipping_rates_method_idx').on(t.method),
  ],
)

export const discountCodes = pgTable(
  'discount_codes',
  {
    id: uuid().primaryKey().defaultRandom(),
    code: varchar({ length: 40 }).notNull(),
    type: tipoScontoEnum().notNull(),
    /** In percentuale (1–100) oppure in centesimi, a seconda di `type`. */
    value: integer().notNull(),
    minOrderCents: integer().notNull().default(0),
    usageLimit: integer(),
    usedCount: integer().notNull().default(0),
    expiresAt: timestamp({ withTimezone: true }),
    active: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('discount_codes_code_key').on(t.code),
    index('discount_codes_active_idx').on(t.active),
  ],
)

export const reviews = pgTable(
  'reviews',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    orderId: uuid().references(() => orders.id, { onDelete: 'set null' }),
    customerName: varchar({ length: 120 }).notNull(),
    rating: integer().notNull(),
    body: text(),
    photoUrl: text(),
    approved: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reviews_product_idx').on(t.productId, t.approved),
    index('reviews_order_idx').on(t.orderId),
  ],
)

/* ------------------------------------------------------------------ *
 * Carrello persistente per chi ha un account
 * ------------------------------------------------------------------ */

export const carts = pgTable(
  'carts',
  {
    id: uuid().primaryKey().defaultRandom(),
    customerId: uuid().references(() => customers.id, { onDelete: 'cascade' }),
    /** Identificativo anonimo salvato nel cookie dell'ospite. */
    guestToken: uuid(),
    email: varchar({ length: 320 }),
    postalCode: varchar({ length: 12 }),
    discountCode: varchar({ length: 40 }),
    /** Serve al promemoria del carrello abbandonato. */
    reminderSentAt: timestamp({ withTimezone: true }),
    convertedOrderId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('carts_guest_token_key').on(t.guestToken),
    index('carts_customer_idx').on(t.customerId),
    index('carts_updated_idx').on(t.updatedAt),
  ],
)

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer().notNull().default(1),
    addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cart_items_cart_variant_key').on(t.cartId, t.variantId),
    index('cart_items_cart_idx').on(t.cartId),
  ],
)

/* ------------------------------------------------------------------ *
 * Contenuti modificabili dal pannello, newsletter, idempotenza webhook
 * ------------------------------------------------------------------ */

export const contentBlocks = pgTable(
  'content_blocks',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Es. "faq", "spedizioni-e-resi", "home.manifesto". */
    key: varchar({ length: 120 }).notNull(),
    title: varchar({ length: 200 }),
    body: text().notNull().default(''),
    position: integer().notNull().default(0),
    /** Raggruppa le voci: "faq", "pagina", "home". */
    group: varchar({ length: 60 }).notNull().default('pagina'),
    published: boolean().notNull().default(true),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('content_blocks_key_key').on(t.key),
    index('content_blocks_group_idx').on(t.group, t.position),
  ],
)

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 320 }).notNull(),
    /** Il consenso alla newsletter è separato da quello sull'ordine. */
    consentedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp({ withTimezone: true }),
    source: varchar({ length: 60 }).notNull().default('sito'),
  },
  (t) => [uniqueIndex('newsletter_subscribers_email_key').on(t.email)],
)

export const processedWebhookEvents = pgTable(
  'processed_webhook_events',
  {
    /** L'id dell'evento del fornitore: la chiave che rende il webhook idempotente. */
    id: varchar({ length: 200 }).primaryKey(),
    provider: varchar({ length: 40 }).notNull(),
    type: varchar({ length: 120 }).notNull(),
    processedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('processed_webhook_events_provider_idx').on(t.provider)],
)

/* ------------------------------------------------------------------ *
 * Relazioni
 * ------------------------------------------------------------------ */

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  collection: one(collections, {
    fields: [products.collectionId],
    references: [collections.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(reviews),
}))

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  images: many(productImages),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  addresses: many(addresses),
  orders: many(orders),
}))

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  designRequest: one(designRequests, {
    fields: [orders.projectId],
    references: [designRequests.id],
  }),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}))

export const designRequestsRelations = relations(designRequests, ({ many }) => ({
  photos: many(designRequestPhotos),
  proposals: many(designProposals),
  orders: many(orders),
}))

export const designRequestPhotosRelations = relations(designRequestPhotos, ({ one }) => ({
  request: one(designRequests, {
    fields: [designRequestPhotos.requestId],
    references: [designRequests.id],
  }),
}))

export const designProposalsRelations = relations(designProposals, ({ one, many }) => ({
  request: one(designRequests, {
    fields: [designProposals.requestId],
    references: [designRequests.id],
  }),
  items: many(designProposalItems),
}))

export const designProposalItemsRelations = relations(designProposalItems, ({ one }) => ({
  proposal: one(designProposals, {
    fields: [designProposalItems.proposalId],
    references: [designProposals.id],
  }),
  variant: one(productVariants, {
    fields: [designProposalItems.variantId],
    references: [productVariants.id],
  }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, { fields: [carts.customerId], references: [customers.id] }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}))

export const usersRelations = relations(users, ({ one }) => ({
  customer: one(customers, { fields: [users.id], references: [customers.userId] }),
}))

/* ------------------------------------------------------------------ *
 * Tipi derivati
 * ------------------------------------------------------------------ */

export type Collection = typeof collections.$inferSelect
export type NuovaCollection = typeof collections.$inferInsert
export type Product = typeof products.$inferSelect
export type NuovoProduct = typeof products.$inferInsert
export type ProductVariant = typeof productVariants.$inferSelect
export type NuovaProductVariant = typeof productVariants.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type NuovaProductImage = typeof productImages.$inferInsert
export type Customer = typeof customers.$inferSelect
export type Address = typeof addresses.$inferSelect
export type Order = typeof orders.$inferSelect
export type NuovoOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type DesignRequest = typeof designRequests.$inferSelect
export type NuovaDesignRequest = typeof designRequests.$inferInsert
export type DesignRequestPhoto = typeof designRequestPhotos.$inferSelect
export type DesignProposal = typeof designProposals.$inferSelect
export type DesignProposalItem = typeof designProposalItems.$inferSelect
export type ShippingRate = typeof shippingRates.$inferSelect
export type DiscountCode = typeof discountCodes.$inferSelect
export type Review = typeof reviews.$inferSelect
export type Cart = typeof carts.$inferSelect
export type CartItem = typeof cartItems.$inferSelect
export type ContentBlock = typeof contentBlocks.$inferSelect

export type Finitura = (typeof finituraEnum.enumValues)[number]
export type MetodoSpedizione = (typeof metodoSpedizioneEnum.enumValues)[number]
export type ZonaSpedizione = (typeof zonaSpedizioneEnum.enumValues)[number]
export type StatoOrdine = (typeof statoOrdineEnum.enumValues)[number]
export type StatoRichiesta = (typeof statoRichiestaEnum.enumValues)[number]
export type TipoImmagine = (typeof tipoImmagineEnum.enumValues)[number]
export type TipoSpazio = (typeof tipoSpazioEnum.enumValues)[number]
export type Esposizione = (typeof esposizioneEnum.enumValues)[number]
export type Stile = (typeof stileEnum.enumValues)[number]
export type MetodoPagamento = (typeof metodoPagamentoEnum.enumValues)[number]
