import { pgTable, serial, varchar, numeric, unique, boolean, index, check, foreignKey, integer, date, text, jsonb, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const virtualWallets = pgTable("virtual_wallets", {
	walletId: serial("wallet_id").primaryKey().notNull(),
	walletName: varchar("wallet_name", { length: 50 }).notNull(),
	balance: numeric({ precision: 15, scale:  2 }).default('0.00'),
});

export const villages = pgTable("villages", {
	villageId: serial("village_id").primaryKey().notNull(),
	villageName: varchar("village_name", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("villages_village_name_key").on(table.villageName),
]);

export const users = pgTable("users", {
	userId: serial("user_id").primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: varchar({ length: 20 }).notNull(),
	mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
	defaultLocation: varchar("default_location", { length: 100 }),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_users_mobile_number").using("btree", table.mobileNumber.asc().nullsLast().op("text_ops")),
	unique("users_email_key").on(table.email),
	unique("users_mobile_number_key").on(table.mobileNumber),
	check("users_role_check", sql`(role)::text = ANY ((ARRAY['admin'::character varying, 'employee'::character varying])::text[])`),
]);

export const companyPayments = pgTable("company_payments", {
	paymentId: serial("payment_id").primaryKey().notNull(),
	destCompanyId: integer("dest_company_id"),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	paymentDate: date("payment_date").default(sql`CURRENT_DATE`),
	targetWalletId: integer("target_wallet_id"),
	paymentMode: varchar("payment_mode", { length: 20 }),
	referenceNumber: varchar("reference_number", { length: 50 }),
	remarks: text(),
}, (table) => [
	foreignKey({
			columns: [table.destCompanyId],
			foreignColumns: [destinationCompanies.destCompanyId],
			name: "company_payments_dest_company_id_fkey"
		}),
	foreignKey({
			columns: [table.targetWalletId],
			foreignColumns: [virtualWallets.walletId],
			name: "company_payments_target_wallet_id_fkey"
		}),
]);

export const bankAccounts = pgTable("bank_accounts", {
	accountId: serial("account_id").primaryKey().notNull(),
	farmerId: integer("farmer_id"),
	accountName: varchar("account_name", { length: 100 }).notNull(),
	accountNo: varchar("account_no", { length: 50 }).notNull(),
	ifscCode: varchar("ifsc_code", { length: 20 }).notNull(),
	bankName: varchar("bank_name", { length: 20 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.farmerId],
			foreignColumns: [farmers.farmerId],
			name: "bank_accounts_farmer_id_fkey"
		}),
]);

export const landmarks = pgTable("landmarks", {
	landmarkId: serial("landmark_id").primaryKey().notNull(),
	landmarkName: varchar("landmark_name", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("landmarks_landmark_name_key").on(table.landmarkName),
]);

export const farmers = pgTable("farmers", {
	farmerId: serial("farmer_id").primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	mobileNumber: varchar("mobile_number", { length: 15 }),
	homeAddress: text("home_address"),
	aadharNumber: varchar("aadhar_number", { length: 12 }),
	bankDetails: jsonb("bank_details"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_farmers_search").using("btree", table.name.asc().nullsLast().op("text_ops"), table.mobileNumber.asc().nullsLast().op("text_ops")),
	unique("farmers_mobile_number_key").on(table.mobileNumber),
	unique("farmers_aadhar_number_key").on(table.aadharNumber),
]);

export const employeeAssignments = pgTable("employee_assignments", {
	assignmentId: serial("assignment_id").primaryKey().notNull(),
	userId: integer("user_id"),
	seedId: integer("seed_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "employee_assignments_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.seedId],
			foreignColumns: [seeds.seedId],
			name: "employee_assignments_seed_id_fkey"
		}).onDelete("cascade"),
	unique("employee_assignments_user_id_seed_id_key").on(table.userId, table.seedId),
]);

export const seeds = pgTable("seeds", {
	seedId: serial("seed_id").primaryKey().notNull(),
	varietyName: varchar("variety_name", { length: 100 }).notNull(),
	cropType: varchar("crop_type", { length: 50 }).notNull(),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	colorCode: varchar("color_code", { length: 20 }).default('#2563eb'),
	destCompanyId: integer("dest_company_id"),
}, (table) => [
	foreignKey({
			columns: [table.destCompanyId],
			foreignColumns: [destinationCompanies.destCompanyId],
			name: "fk_seed_company"
		}),
]);

export const walletTransactions = pgTable("wallet_transactions", {
	transactionId: serial("transaction_id").primaryKey().notNull(),
	walletId: integer("wallet_id"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	transactionType: varchar("transaction_type", { length: 20 }).notNull(),
	description: text(),
	referenceId: integer("reference_id"),
	transactionDate: timestamp("transaction_date", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [virtualWallets.walletId],
			name: "wallet_transactions_wallet_id_fkey"
		}),
]);

export const shipmentCompanies = pgTable("shipment_companies", {
	companyId: serial("company_id").primaryKey().notNull(),
	companyName: varchar("company_name", { length: 100 }).notNull(),
	ownerName: varchar("owner_name", { length: 100 }),
	ownerMobile: varchar("owner_mobile", { length: 20 }),
	totalShipmentsDone: integer("total_shipments_done").default(0),
	totalPaymentDue: numeric("total_payment_due", { precision: 12, scale:  2 }).default('0.00'),
	totalPaymentMade: numeric("total_payment_made", { precision: 12, scale:  2 }).default('0.00'),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("shipment_companies_company_name_key").on(table.companyName),
]);

export const seedPrices = pgTable("seed_prices", {
	priceId: serial("price_id").primaryKey().notNull(),
	year: integer().notNull(),
	pricePerBag: numeric("price_per_bag", { precision: 10, scale:  2 }).notNull(),
});

export const appSettings = pgTable("app_settings", {
	settingKey: varchar("setting_key", { length: 50 }).primaryKey().notNull(),
	settingValue: varchar("setting_value", { length: 100 }),
});

export const shipmentItems = pgTable("shipment_items", {
	itemId: serial("item_id").primaryKey().notNull(),
	shipmentId: integer("shipment_id").notNull(),
	cropCycleId: integer("crop_cycle_id").notNull(),
	bagsLoaded: integer("bags_loaded").notNull(),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	loadedBy: integer("loaded_by"),
}, (table) => [
	index("idx_shipment_items_added_at").using("btree", table.shipmentId.asc().nullsLast().op("timestamptz_ops"), table.cropCycleId.asc().nullsLast().op("int4_ops"), table.addedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.shipmentId],
			foreignColumns: [shipments.shipmentId],
			name: "shipment_items_shipment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.cropCycleId],
			foreignColumns: [cropCycles.cropCycleId],
			name: "shipment_items_crop_cycle_id_fkey"
		}),
]);

export const cropCycles = pgTable("crop_cycles", {
	cropCycleId: serial("crop_cycle_id").primaryKey().notNull(),
	farmerId: integer("farmer_id").notNull(),
	farmId: integer("farm_id").notNull(),
	seedId: integer("seed_id").notNull(),
	season: varchar({ length: 50 }),
	sowingDate: date("sowing_date"),
	seedBagsPurchased: integer("seed_bags_purchased"),
	seedCost: numeric("seed_cost", { precision: 10, scale:  2 }),
	seedPaymentStatus: varchar("seed_payment_status", { length: 20 }),
	harvestingDate: date("harvesting_date"),
	dustPercentage: numeric("dust_percentage", { precision: 5, scale:  2 }),
	colorGrade: varchar("color_grade", { length: 20 }),
	grading: varchar({ length: 20 }),
	purchaseRate: numeric("purchase_rate", { precision: 10, scale:  2 }),
	quantityInBags: integer("quantity_in_bags"),
	shipmentId: integer("shipment_id"),
	totalPayment: numeric("total_payment", { precision: 12, scale:  2 }),
	finalPayment: numeric("final_payment", { precision: 12, scale:  2 }),
	billNumber: varchar("bill_number", { length: 50 }),
	chequeDueDate: date("cheque_due_date"),
	isFarmerPaid: boolean("is_farmer_paid").default(false),
	seedBagsReturned: integer("seed_bags_returned").default(0),
	goodsCollectionMethod: varchar("goods_collection_method", { length: 50 }),
	cropCycleYear: integer("crop_cycle_year"),
	bankAccounts: jsonb("bank_accounts"),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }),
	amountRemaining: numeric("amount_remaining", { precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('Growing'),
	bagsRemainingToLoad: integer("bags_remaining_to_load").default(0),
	lotNo: varchar("lot_no", { length: 255 }),
	pricingDate: timestamp("pricing_date", { withTimezone: true, mode: 'string' }),
	isProductionFlagged: boolean("is_production_flagged").default(false),
	sampleCollectionDate: timestamp("sample_collection_date", { withTimezone: true, mode: 'string' }),
	samplingDate: timestamp("sampling_date", { withTimezone: true, mode: 'string' }),
	sampleRemarks: text("sample_remarks"),
	sampleMoisture: numeric("sample_moisture", { precision: 5, scale:  2 }),
	samplePurity: numeric("sample_purity", { precision: 5, scale:  2 }),
	sampleNonSeed: varchar("sample_non_seed", { length: 50 }),
	temporaryPricePerMan: numeric("temporary_price_per_man", { precision: 10, scale:  2 }),
	weighingDate: timestamp("weighing_date", { withTimezone: true, mode: 'string' }),
	loadingDate: timestamp("loading_date", { withTimezone: true, mode: 'string' }),
	chequeDetails: jsonb("cheque_details"),
	finalPaymentDate: date("final_payment_date"),
	harvestedBy: integer("harvested_by"),
	sampledBy: integer("sampled_by"),
	weighedBy: integer("weighed_by"),
	paymentClearedDate: timestamp("payment_cleared_date", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_crop_cycles_status_sampling").using("btree", table.status.asc().nullsLast().op("text_ops"), table.sampleCollectionDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_cycles_farm").using("btree", table.farmId.asc().nullsLast().op("int4_ops")),
	index("idx_cycles_farmer").using("btree", table.farmerId.asc().nullsLast().op("int4_ops")),
	index("idx_cycles_harvest_date").using("btree", table.harvestingDate.asc().nullsLast().op("date_ops")),
	index("idx_cycles_price_date").using("btree", table.pricingDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_cycles_seed").using("btree", table.seedId.asc().nullsLast().op("int4_ops")),
	index("idx_cycles_year_status").using("btree", table.cropCycleYear.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.farmerId],
			foreignColumns: [farmers.farmerId],
			name: "crop_cycles_farmer_id_fkey"
		}),
	foreignKey({
			columns: [table.farmId],
			foreignColumns: [farms.farmId],
			name: "crop_cycles_farm_id_fkey"
		}),
	foreignKey({
			columns: [table.seedId],
			foreignColumns: [seeds.seedId],
			name: "crop_cycles_seed_id_fkey"
		}),
	foreignKey({
			columns: [table.shipmentId],
			foreignColumns: [shipments.shipmentId],
			name: "crop_cycles_shipment_id_fkey"
		}),
	foreignKey({
			columns: [table.harvestedBy],
			foreignColumns: [users.userId],
			name: "crop_cycles_harvested_by_fkey"
		}),
	foreignKey({
			columns: [table.sampledBy],
			foreignColumns: [users.userId],
			name: "crop_cycles_sampled_by_fkey"
		}),
	foreignKey({
			columns: [table.weighedBy],
			foreignColumns: [users.userId],
			name: "crop_cycles_weighed_by_fkey"
		}),
	check("crop_cycles_seed_payment_status_check", sql`(seed_payment_status)::text = ANY ((ARRAY['Paid'::character varying, 'Credit'::character varying, 'Partial'::character varying])::text[])`),
]);

export const companyLedger = pgTable("company_ledger", {
	ledgerId: serial("ledger_id").primaryKey().notNull(),
	companyId: integer("company_id"),
	transactionDate: timestamp("transaction_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	transactionType: varchar("transaction_type", { length: 10 }),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	description: text(),
	referenceId: integer("reference_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_company_ledger_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [destinationCompanies.destCompanyId],
			name: "company_ledger_company_id_fkey"
		}),
	check("company_ledger_transaction_type_check", sql`(transaction_type)::text = ANY ((ARRAY['DEBIT'::character varying, 'CREDIT'::character varying])::text[])`),
]);

export const farms = pgTable("farms", {
	farmId: serial("farm_id").primaryKey().notNull(),
	farmerId: integer("farmer_id").notNull(),
	locationName: varchar("location_name", { length: 255 }),
	areaInVigha: numeric("area_in_vigha", { precision: 10, scale:  2 }),
	landmarkId: integer("landmark_id"),
	gpsLongitude: numeric("gps_longitude", { precision: 9, scale:  6 }),
	gpsLatitude: numeric("gps_latitude", { precision: 9, scale:  6 }),
	villageId: integer("village_id"),
}, (table) => [
	index("idx_farms_landmark").using("btree", table.landmarkId.asc().nullsLast().op("int4_ops")),
	index("idx_farms_village").using("btree", table.villageId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.farmerId],
			foreignColumns: [farmers.farmerId],
			name: "farms_farmer_id_fkey"
		}),
	foreignKey({
			columns: [table.landmarkId],
			foreignColumns: [landmarks.landmarkId],
			name: "farms_landmark_id_fkey"
		}),
	foreignKey({
			columns: [table.villageId],
			foreignColumns: [villages.villageId],
			name: "farms_village_id_fkey"
		}),
]);

export const destinationCompanies = pgTable("destination_companies", {
	destCompanyId: serial("dest_company_id").primaryKey().notNull(),
	companyName: varchar("company_name", { length: 100 }).notNull(),
	isActive: boolean("is_active").default(true),
	address: text(),
	city: varchar({ length: 100 }),
}, (table) => [
	unique("destination_companies_company_name_key").on(table.companyName),
]);

export const shipments = pgTable("shipments", {
	shipmentId: serial("shipment_id").primaryKey().notNull(),
	vehicleNumber: varchar("vehicle_number", { length: 20 }),
	driverName: varchar("driver_name", { length: 100 }),
	dispatchDate: timestamp("dispatch_date", { withTimezone: true, mode: 'string' }),
	confirmationDate: date("confirmation_date"),
	companyPayment: numeric("company_payment", { precision: 12, scale:  2 }),
	paymentDate: date("payment_date"),
	shipmentCompanyId: integer("shipment_company_id"),
	destCompanyId: integer("dest_company_id"),
	driverMobile: varchar("driver_mobile", { length: 20 }),
	capacityInTonnes: numeric("capacity_in_tonnes", { precision: 10, scale:  2 }),
	employeeIds: integer("employee_ids").array(),
	status: varchar({ length: 20 }).default('Loading').notNull(),
	targetBagCapacity: integer("target_bag_capacity"),
	totalBags: integer("total_bags").default(0).notNull(),
	creationDate: timestamp("creation_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isCompanyPaymentReceived: boolean("is_company_payment_received").default(false).notNull(),
	allowedSeedIds: integer("allowed_seed_ids").array(),
	location: varchar({ length: 50 }),
	landmarkId: integer("landmark_id"),
	villageId: integer("village_id"),
	createdBy: integer("created_by"),
	dispatchBy: integer("dispatch_by"),
}, (table) => [
	index("idx_shipments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.shipmentCompanyId],
			foreignColumns: [shipmentCompanies.companyId],
			name: "shipments_shipment_company_id_fkey"
		}),
	foreignKey({
			columns: [table.destCompanyId],
			foreignColumns: [destinationCompanies.destCompanyId],
			name: "shipments_dest_company_id_fkey"
		}),
	foreignKey({
			columns: [table.shipmentCompanyId],
			foreignColumns: [shipmentCompanies.companyId],
			name: "fk_shipment_company"
		}),
	foreignKey({
			columns: [table.destCompanyId],
			foreignColumns: [destinationCompanies.destCompanyId],
			name: "fk_dest_company"
		}),
]);

export const fieldVisits = pgTable("field_visits", {
	visitId: serial("visit_id").primaryKey().notNull(),
	cropCycleId: integer("crop_cycle_id").notNull(),
	employeeId: integer("employee_id").notNull(),
	visitDate: date("visit_date").notNull(),
	rougingPercentage: numeric("rouging_percentage", { precision: 5, scale:  2 }),
	cropCondition: varchar("crop_condition", { length: 20 }),
	diseaseNotes: text("disease_notes"),
	irrigationCount: integer("irrigation_count"),
	fertilizerNotes: text("fertilizer_notes"),
	imageUrl: varchar("image_url", { length: 255 }),
	visitNumber: integer("visit_number"),
	nextVisitDays: integer("next_visit_days"),
	farmerCooperation: varchar("farmer_cooperation", { length: 50 }),
	remarks: text(),
	fertilizerData: jsonb("fertilizer_data"),
	diseaseData: jsonb("disease_data"),
}, (table) => [
	index("idx_visits_cycle").using("btree", table.cropCycleId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cropCycleId],
			foreignColumns: [cropCycles.cropCycleId],
			name: "field_visits_crop_cycle_id_fkey"
		}),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [users.userId],
			name: "field_visits_employee_id_fkey"
		}),
	check("field_visits_plant_health_check", sql`(crop_condition)::text = ANY ((ARRAY['Good'::character varying, 'Average'::character varying, 'Poor'::character varying])::text[])`),
]);
