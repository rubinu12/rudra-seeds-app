-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "virtual_wallets" (
	"wallet_id" serial PRIMARY KEY NOT NULL,
	"wallet_name" varchar(50) NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0.00'
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"village_id" serial PRIMARY KEY NOT NULL,
	"village_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "villages_village_name_key" UNIQUE("village_name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"mobile_number" varchar(15) NOT NULL,
	"default_location" varchar(100),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_mobile_number_key" UNIQUE("mobile_number"),
	CONSTRAINT "users_role_check" CHECK ((role)::text = ANY ((ARRAY['admin'::character varying, 'employee'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "company_payments" (
	"payment_id" serial PRIMARY KEY NOT NULL,
	"dest_company_id" integer,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" date DEFAULT CURRENT_DATE,
	"target_wallet_id" integer,
	"payment_mode" varchar(20),
	"reference_number" varchar(50),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"account_id" serial PRIMARY KEY NOT NULL,
	"farmer_id" integer,
	"account_name" varchar(100) NOT NULL,
	"account_no" varchar(50) NOT NULL,
	"ifsc_code" varchar(20) NOT NULL,
	"bank_name" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landmarks" (
	"landmark_id" serial PRIMARY KEY NOT NULL,
	"landmark_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "landmarks_landmark_name_key" UNIQUE("landmark_name")
);
--> statement-breakpoint
CREATE TABLE "farmers" (
	"farmer_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"mobile_number" varchar(15),
	"home_address" text,
	"aadhar_number" varchar(12),
	"bank_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "farmers_mobile_number_key" UNIQUE("mobile_number"),
	CONSTRAINT "farmers_aadhar_number_key" UNIQUE("aadhar_number")
);
--> statement-breakpoint
CREATE TABLE "employee_assignments" (
	"assignment_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"seed_id" integer,
	CONSTRAINT "employee_assignments_user_id_seed_id_key" UNIQUE("user_id","seed_id")
);
--> statement-breakpoint
CREATE TABLE "seeds" (
	"seed_id" serial PRIMARY KEY NOT NULL,
	"variety_name" varchar(100) NOT NULL,
	"crop_type" varchar(50) NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"color_code" varchar(20) DEFAULT '#2563eb',
	"dest_company_id" integer
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer,
	"amount" numeric(12, 2) NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"description" text,
	"reference_id" integer,
	"transaction_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipment_companies" (
	"company_id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(100) NOT NULL,
	"owner_name" varchar(100),
	"owner_mobile" varchar(20),
	"total_shipments_done" integer DEFAULT 0,
	"total_payment_due" numeric(12, 2) DEFAULT '0.00',
	"total_payment_made" numeric(12, 2) DEFAULT '0.00',
	"is_active" boolean DEFAULT true,
	CONSTRAINT "shipment_companies_company_name_key" UNIQUE("company_name")
);
--> statement-breakpoint
CREATE TABLE "seed_prices" (
	"price_id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"price_per_bag" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"setting_key" varchar(50) PRIMARY KEY NOT NULL,
	"setting_value" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "shipment_items" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"crop_cycle_id" integer NOT NULL,
	"bags_loaded" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now(),
	"loaded_by" integer
);
--> statement-breakpoint
CREATE TABLE "crop_cycles" (
	"crop_cycle_id" serial PRIMARY KEY NOT NULL,
	"farmer_id" integer NOT NULL,
	"farm_id" integer NOT NULL,
	"seed_id" integer NOT NULL,
	"season" varchar(50),
	"sowing_date" date,
	"seed_bags_purchased" integer,
	"seed_cost" numeric(10, 2),
	"seed_payment_status" varchar(20),
	"harvesting_date" date,
	"dust_percentage" numeric(5, 2),
	"color_grade" varchar(20),
	"grading" varchar(20),
	"purchase_rate" numeric(10, 2),
	"quantity_in_bags" integer,
	"shipment_id" integer,
	"total_payment" numeric(12, 2),
	"final_payment" numeric(12, 2),
	"bill_number" varchar(50),
	"cheque_due_date" date,
	"is_farmer_paid" boolean DEFAULT false,
	"seed_bags_returned" integer DEFAULT 0,
	"goods_collection_method" varchar(50),
	"crop_cycle_year" integer,
	"bank_accounts" jsonb,
	"amount_paid" numeric(10, 2),
	"amount_remaining" numeric(10, 2),
	"status" varchar(20) DEFAULT 'Growing',
	"bags_remaining_to_load" integer DEFAULT 0,
	"lot_no" varchar(255),
	"pricing_date" timestamp with time zone,
	"is_production_flagged" boolean DEFAULT false,
	"sample_collection_date" timestamp with time zone,
	"sampling_date" timestamp with time zone,
	"sample_remarks" text,
	"sample_moisture" numeric(5, 2),
	"sample_purity" numeric(5, 2),
	"sample_non_seed" varchar(50),
	"temporary_price_per_man" numeric(10, 2),
	"weighing_date" timestamp with time zone,
	"loading_date" timestamp with time zone,
	"cheque_details" jsonb,
	"final_payment_date" date,
	"harvested_by" integer,
	"sampled_by" integer,
	"weighed_by" integer,
	"payment_cleared_date" timestamp with time zone,
	CONSTRAINT "crop_cycles_seed_payment_status_check" CHECK ((seed_payment_status)::text = ANY ((ARRAY['Paid'::character varying, 'Credit'::character varying, 'Partial'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "company_ledger" (
	"ledger_id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"transaction_date" timestamp with time zone DEFAULT now(),
	"transaction_type" varchar(10),
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"reference_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "company_ledger_transaction_type_check" CHECK ((transaction_type)::text = ANY ((ARRAY['DEBIT'::character varying, 'CREDIT'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"farm_id" serial PRIMARY KEY NOT NULL,
	"farmer_id" integer NOT NULL,
	"location_name" varchar(255),
	"area_in_vigha" numeric(10, 2),
	"landmark_id" integer,
	"gps_longitude" numeric(9, 6),
	"gps_latitude" numeric(9, 6),
	"village_id" integer
);
--> statement-breakpoint
CREATE TABLE "destination_companies" (
	"dest_company_id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"address" text,
	"city" varchar(100),
	CONSTRAINT "destination_companies_company_name_key" UNIQUE("company_name")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"shipment_id" serial PRIMARY KEY NOT NULL,
	"vehicle_number" varchar(20),
	"driver_name" varchar(100),
	"dispatch_date" timestamp with time zone,
	"confirmation_date" date,
	"company_payment" numeric(12, 2),
	"payment_date" date,
	"shipment_company_id" integer,
	"dest_company_id" integer,
	"driver_mobile" varchar(20),
	"capacity_in_tonnes" numeric(10, 2),
	"employee_ids" integer[],
	"status" varchar(20) DEFAULT 'Loading' NOT NULL,
	"target_bag_capacity" integer,
	"total_bags" integer DEFAULT 0 NOT NULL,
	"creation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_company_payment_received" boolean DEFAULT false NOT NULL,
	"allowed_seed_ids" integer[],
	"location" varchar(50),
	"landmark_id" integer,
	"created_by" integer,
	"dispatch_by" integer
);
--> statement-breakpoint
CREATE TABLE "field_visits" (
	"visit_id" serial PRIMARY KEY NOT NULL,
	"crop_cycle_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"visit_date" date NOT NULL,
	"rouging_percentage" numeric(5, 2),
	"crop_condition" varchar(20),
	"disease_notes" text,
	"irrigation_count" integer,
	"fertilizer_notes" text,
	"image_url" varchar(255),
	"visit_number" integer,
	"next_visit_days" integer,
	"farmer_cooperation" varchar(50),
	"remarks" text,
	"fertilizer_data" jsonb,
	"disease_data" jsonb,
	CONSTRAINT "field_visits_plant_health_check" CHECK ((crop_condition)::text = ANY ((ARRAY['Good'::character varying, 'Average'::character varying, 'Poor'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "company_payments" ADD CONSTRAINT "company_payments_dest_company_id_fkey" FOREIGN KEY ("dest_company_id") REFERENCES "public"."destination_companies"("dest_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_payments" ADD CONSTRAINT "company_payments_target_wallet_id_fkey" FOREIGN KEY ("target_wallet_id") REFERENCES "public"."virtual_wallets"("wallet_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("farmer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_seed_id_fkey" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("seed_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeds" ADD CONSTRAINT "fk_seed_company" FOREIGN KEY ("dest_company_id") REFERENCES "public"."destination_companies"("dest_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."virtual_wallets"("wallet_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("shipment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_crop_cycle_id_fkey" FOREIGN KEY ("crop_cycle_id") REFERENCES "public"."crop_cycles"("crop_cycle_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("farmer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("farm_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_seed_id_fkey" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("seed_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("shipment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_harvested_by_fkey" FOREIGN KEY ("harvested_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_sampled_by_fkey" FOREIGN KEY ("sampled_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_weighed_by_fkey" FOREIGN KEY ("weighed_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_ledger" ADD CONSTRAINT "company_ledger_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."destination_companies"("dest_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("farmer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_landmark_id_fkey" FOREIGN KEY ("landmark_id") REFERENCES "public"."landmarks"("landmark_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("village_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipment_company_id_fkey" FOREIGN KEY ("shipment_company_id") REFERENCES "public"."shipment_companies"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_dest_company_id_fkey" FOREIGN KEY ("dest_company_id") REFERENCES "public"."destination_companies"("dest_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "fk_shipment_company" FOREIGN KEY ("shipment_company_id") REFERENCES "public"."shipment_companies"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "fk_dest_company" FOREIGN KEY ("dest_company_id") REFERENCES "public"."destination_companies"("dest_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_crop_cycle_id_fkey" FOREIGN KEY ("crop_cycle_id") REFERENCES "public"."crop_cycles"("crop_cycle_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_mobile_number" ON "users" USING btree ("mobile_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_farmers_search" ON "farmers" USING btree ("name" text_ops,"mobile_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shipment_items_added_at" ON "shipment_items" USING btree ("shipment_id" timestamptz_ops,"crop_cycle_id" int4_ops,"added_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_crop_cycles_status_sampling" ON "crop_cycles" USING btree ("status" text_ops,"sample_collection_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_cycles_farm" ON "crop_cycles" USING btree ("farm_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_cycles_farmer" ON "crop_cycles" USING btree ("farmer_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_cycles_harvest_date" ON "crop_cycles" USING btree ("harvesting_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_cycles_price_date" ON "crop_cycles" USING btree ("pricing_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_cycles_seed" ON "crop_cycles" USING btree ("seed_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_cycles_year_status" ON "crop_cycles" USING btree ("crop_cycle_year" text_ops,"status" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_company_ledger_company" ON "company_ledger" USING btree ("company_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_farms_landmark" ON "farms" USING btree ("landmark_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_farms_village" ON "farms" USING btree ("village_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_shipments_status" ON "shipments" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_visits_cycle" ON "field_visits" USING btree ("crop_cycle_id" int4_ops);
*/