import { relations } from "drizzle-orm/relations";
import { destinationCompanies, companyPayments, virtualWallets, farmers, bankAccounts, users, employeeAssignments, seeds, walletTransactions, shipments, shipmentItems, cropCycles, farms, companyLedger, landmarks, villages, shipmentCompanies, fieldVisits } from "./schema";

export const companyPaymentsRelations = relations(companyPayments, ({one}) => ({
	destinationCompany: one(destinationCompanies, {
		fields: [companyPayments.destCompanyId],
		references: [destinationCompanies.destCompanyId]
	}),
	virtualWallet: one(virtualWallets, {
		fields: [companyPayments.targetWalletId],
		references: [virtualWallets.walletId]
	}),
}));

export const destinationCompaniesRelations = relations(destinationCompanies, ({many}) => ({
	companyPayments: many(companyPayments),
	seeds: many(seeds),
	companyLedgers: many(companyLedger),
	shipments_destCompanyId: many(shipments, {
		relationName: "shipments_destCompanyId_destinationCompanies_destCompanyId"
	}),
	
}));

export const virtualWalletsRelations = relations(virtualWallets, ({many}) => ({
	companyPayments: many(companyPayments),
	walletTransactions: many(walletTransactions),
}));

export const bankAccountsRelations = relations(bankAccounts, ({one}) => ({
	farmer: one(farmers, {
		fields: [bankAccounts.farmerId],
		references: [farmers.farmerId]
	}),
}));

export const farmersRelations = relations(farmers, ({many}) => ({
	bankAccounts: many(bankAccounts),
	cropCycles: many(cropCycles),
	farms: many(farms),
}));

export const employeeAssignmentsRelations = relations(employeeAssignments, ({one}) => ({
	user: one(users, {
		fields: [employeeAssignments.userId],
		references: [users.userId]
	}),
	seed: one(seeds, {
		fields: [employeeAssignments.seedId],
		references: [seeds.seedId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	employeeAssignments: many(employeeAssignments),
	cropCycles_harvestedBy: many(cropCycles, {
		relationName: "cropCycles_harvestedBy_users_userId"
	}),
	cropCycles_sampledBy: many(cropCycles, {
		relationName: "cropCycles_sampledBy_users_userId"
	}),
	cropCycles_weighedBy: many(cropCycles, {
		relationName: "cropCycles_weighedBy_users_userId"
	}),
	fieldVisits: many(fieldVisits),
}));

export const seedsRelations = relations(seeds, ({one, many}) => ({
	employeeAssignments: many(employeeAssignments),
	destinationCompany: one(destinationCompanies, {
		fields: [seeds.destCompanyId],
		references: [destinationCompanies.destCompanyId]
	}),
	cropCycles: many(cropCycles),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({one}) => ({
	virtualWallet: one(virtualWallets, {
		fields: [walletTransactions.walletId],
		references: [virtualWallets.walletId]
	}),
}));

export const shipmentItemsRelations = relations(shipmentItems, ({one}) => ({
	shipment: one(shipments, {
		fields: [shipmentItems.shipmentId],
		references: [shipments.shipmentId]
	}),
	cropCycle: one(cropCycles, {
		fields: [shipmentItems.cropCycleId],
		references: [cropCycles.cropCycleId]
	}),
}));

export const shipmentsRelations = relations(shipments, ({one, many}) => ({
	shipmentItems: many(shipmentItems),
	cropCycles: many(cropCycles),
	shipmentCompany_shipmentCompanyId: one(shipmentCompanies, {
		fields: [shipments.shipmentCompanyId],
		references: [shipmentCompanies.companyId],
		relationName: "shipments_shipmentCompanyId_shipmentCompanies_companyId"
	}),
	destinationCompany_destCompanyId: one(destinationCompanies, {
		fields: [shipments.destCompanyId],
		references: [destinationCompanies.destCompanyId],
		relationName: "shipments_destCompanyId_destinationCompanies_destCompanyId"
	}),
	
}));

export const cropCyclesRelations = relations(cropCycles, ({one, many}) => ({
	shipmentItems: many(shipmentItems),
	farmer: one(farmers, {
		fields: [cropCycles.farmerId],
		references: [farmers.farmerId]
	}),
	farm: one(farms, {
		fields: [cropCycles.farmId],
		references: [farms.farmId]
	}),
	seed: one(seeds, {
		fields: [cropCycles.seedId],
		references: [seeds.seedId]
	}),
	shipment: one(shipments, {
		fields: [cropCycles.shipmentId],
		references: [shipments.shipmentId]
	}),
	user_harvestedBy: one(users, {
		fields: [cropCycles.harvestedBy],
		references: [users.userId],
		relationName: "cropCycles_harvestedBy_users_userId"
	}),
	user_sampledBy: one(users, {
		fields: [cropCycles.sampledBy],
		references: [users.userId],
		relationName: "cropCycles_sampledBy_users_userId"
	}),
	user_weighedBy: one(users, {
		fields: [cropCycles.weighedBy],
		references: [users.userId],
		relationName: "cropCycles_weighedBy_users_userId"
	}),
	fieldVisits: many(fieldVisits),
}));

export const farmsRelations = relations(farms, ({one, many}) => ({
	cropCycles: many(cropCycles),
	farmer: one(farmers, {
		fields: [farms.farmerId],
		references: [farmers.farmerId]
	}),
	landmark: one(landmarks, {
		fields: [farms.landmarkId],
		references: [landmarks.landmarkId]
	}),
	village: one(villages, {
		fields: [farms.villageId],
		references: [villages.villageId]
	}),
}));

export const companyLedgerRelations = relations(companyLedger, ({one}) => ({
	destinationCompany: one(destinationCompanies, {
		fields: [companyLedger.companyId],
		references: [destinationCompanies.destCompanyId]
	}),
}));

export const landmarksRelations = relations(landmarks, ({many}) => ({
	farms: many(farms),
}));

export const villagesRelations = relations(villages, ({many}) => ({
	farms: many(farms),
}));

export const shipmentCompaniesRelations = relations(shipmentCompanies, ({many}) => ({
	shipments_shipmentCompanyId: many(shipments, {
		relationName: "shipments_shipmentCompanyId_shipmentCompanies_companyId"
	}),
	
}));

export const fieldVisitsRelations = relations(fieldVisits, ({one}) => ({
	cropCycle: one(cropCycles, {
		fields: [fieldVisits.cropCycleId],
		references: [cropCycles.cropCycleId]
	}),
	user: one(users, {
		fields: [fieldVisits.employeeId],
		references: [users.userId]
	}),
}));