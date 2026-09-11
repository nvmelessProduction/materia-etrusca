CREATE TYPE "public"."exposure" AS ENUM('sole', 'mezzombra', 'ombra');--> statement-breakpoint
CREATE TYPE "public"."variant_finish" AS ENUM('grezzo', 'levigato', 'ocra', 'antracite');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'paypal', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."shipping_method" AS ENUM('courier', 'pallet', 'floor_delivery', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."design_request_status" AS ENUM('new', 'in_progress', 'sent', 'converted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."style_wanted" AS ENUM('minimale', 'mediterraneo', 'scenografico');--> statement-breakpoint
CREATE TYPE "public"."image_type" AS ENUM('studio', 'ambientata', 'dettaglio', 'scala', 'video');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."space_type" AS ENUM('terrazzo', 'giardino', 'ingresso', 'interno', 'commerciale');--> statement-breakpoint
CREATE TYPE "public"."shipping_zone" AS ENUM('italia', 'isole', 'estero');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" varchar(40) NOT NULL,
	"provider" varchar(80) NOT NULL,
	"provider_account_id" varchar(200) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(80),
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"line1" varchar(200) NOT NULL,
	"line2" varchar(200),
	"city" varchar(120) NOT NULL,
	"postal_code" varchar(12) NOT NULL,
	"province" varchar(4) NOT NULL,
	"country" varchar(2) DEFAULT 'IT' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"guest_token" uuid,
	"email" varchar(320),
	"postal_code" varchar(12),
	"discount_code" varchar(40),
	"reminder_sent_at" timestamp with time zone,
	"converted_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(140) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text,
	"hero_image_url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"seo_title" varchar(180),
	"seo_description" varchar(320),
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"title" varchar(200),
	"body" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"group" varchar(60) DEFAULT 'pagina' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" varchar(320) NOT NULL,
	"name" varchar(200),
	"phone" varchar(40),
	"stripe_customer_id" varchar(80),
	"vat_number" varchar(20),
	"sdi_code" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_proposal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"render_image_url" text,
	"artisan_message" text DEFAULT '' NOT NULL,
	"total_estimate_cents" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_request_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"url" text NOT NULL,
	"storage_key" varchar(200),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(40),
	"city" varchar(120),
	"postal_code" varchar(12),
	"space_type" "space_type" NOT NULL,
	"width_m" numeric(5, 2),
	"depth_m" numeric(5, 2),
	"exposure" "exposure",
	"style_wanted" "style_wanted",
	"budget_range" varchar(40),
	"free_notes" text,
	"status" "design_request_status" DEFAULT 'new' NOT NULL,
	"internal_notes" text,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"photos_purged_at" timestamp with time zone,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"type" "discount_type" NOT NULL,
	"value" integer NOT NULL,
	"min_order_cents" integer DEFAULT 0 NOT NULL,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"source" varchar(60) DEFAULT 'sito' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"product_name_snapshot" varchar(200) NOT NULL,
	"variant_snapshot" jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(24) DEFAULT 'ME-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0') NOT NULL,
	"customer_id" uuid,
	"email" varchar(320) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"discount_code" varchar(40),
	"shipping_method" "shipping_method" NOT NULL,
	"payment_method" "payment_method" DEFAULT 'stripe' NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"phone" varchar(40),
	"delivery_notes" text,
	"invoice_requested" boolean DEFAULT false NOT NULL,
	"vat_number" varchar(20),
	"sdi_code" varchar(10),
	"tracking_carrier" varchar(80),
	"tracking_number" varchar(120),
	"stripe_payment_intent_id" varchar(120),
	"stripe_session_id" varchar(200),
	"paypal_order_id" varchar(120),
	"project_id" uuid,
	"notes" text,
	"review_request_sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_webhook_events" (
	"id" varchar(200) PRIMARY KEY NOT NULL,
	"provider" varchar(40) NOT NULL,
	"type" varchar(120) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"alt" varchar(300) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"type" "image_type" DEFAULT 'studio' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(64) NOT NULL,
	"height_cm" numeric(6, 1) NOT NULL,
	"diameter_cm" numeric(6, 1) NOT NULL,
	"weight_kg" numeric(7, 2) NOT NULL,
	"finish" "variant_finish" NOT NULL,
	"price_cents" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"package_weight_kg" numeric(7, 2) NOT NULL,
	"package_volume_l" numeric(8, 2) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(200) NOT NULL,
	"collection_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"story" text,
	"base_price_cents" integer NOT NULL,
	"is_unique" boolean DEFAULT false NOT NULL,
	"is_made_to_order" boolean DEFAULT false NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"suitable_indoor" boolean DEFAULT true NOT NULL,
	"suitable_outdoor" boolean DEFAULT true NOT NULL,
	"frost_resistant" boolean DEFAULT false NOT NULL,
	"care_instructions" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"seo_title" varchar(180),
	"seo_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"order_id" uuid,
	"customer_name" varchar(120) NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"photo_url" text,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"min_weight_kg" numeric(7, 2) NOT NULL,
	"max_weight_kg" numeric(7, 2) NOT NULL,
	"method" "shipping_method" NOT NULL,
	"price_cents" integer NOT NULL,
	"zone" "shipping_zone" DEFAULT 'italia' NOT NULL,
	"eta_days" integer DEFAULT 5 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200),
	"email" varchar(320) NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_proposal_items" ADD CONSTRAINT "design_proposal_items_proposal_id_design_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."design_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_proposal_items" ADD CONSTRAINT "design_proposal_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_proposals" ADD CONSTRAINT "design_proposals_request_id_design_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."design_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_request_photos" ADD CONSTRAINT "design_request_photos_request_id_design_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."design_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_project_id_design_requests_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."design_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "addresses_customer_idx" ON "addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "addresses_postal_idx" ON "addresses" USING btree ("postal_code");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_variant_key" ON "cart_items" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_guest_token_key" ON "carts" USING btree ("guest_token");--> statement-breakpoint
CREATE INDEX "carts_customer_idx" ON "carts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "carts_updated_idx" ON "carts" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_key" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "collections_position_idx" ON "collections" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "content_blocks_key_key" ON "content_blocks" USING btree ("key");--> statement-breakpoint
CREATE INDEX "content_blocks_group_idx" ON "content_blocks" USING btree ("group","position");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_key" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_user_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customers_stripe_idx" ON "customers" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "design_proposal_items_proposal_idx" ON "design_proposal_items" USING btree ("proposal_id","position");--> statement-breakpoint
CREATE INDEX "design_proposal_items_variant_idx" ON "design_proposal_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "design_proposals_request_idx" ON "design_proposals" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "design_request_photos_request_idx" ON "design_request_photos" USING btree ("request_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "design_requests_token_key" ON "design_requests" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "design_requests_status_idx" ON "design_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "design_requests_created_idx" ON "design_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "design_requests_email_idx" ON "design_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "design_requests_expires_idx" ON "design_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "discount_codes_active_idx" ON "discount_codes" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_key" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_stripe_session_key" ON "orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_project_idx" ON "orders" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "processed_webhook_events_provider_idx" ON "processed_webhook_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX "product_images_variant_idx" ON "product_images" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_height_idx" ON "product_variants" USING btree ("height_cm");--> statement-breakpoint
CREATE INDEX "product_variants_price_idx" ON "product_variants" USING btree ("price_cents");--> statement-breakpoint
CREATE INDEX "product_variants_finish_idx" ON "product_variants" USING btree ("finish");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_key" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_collection_idx" ON "products" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_created_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id","approved");--> statement-breakpoint
CREATE INDEX "reviews_order_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipping_rates_zone_weight_idx" ON "shipping_rates" USING btree ("zone","min_weight_kg","max_weight_kg");--> statement-breakpoint
CREATE INDEX "shipping_rates_method_idx" ON "shipping_rates" USING btree ("method");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");