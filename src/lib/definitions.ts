// lib/definitions.ts

import { ReactNode } from "react";

export type Landmark = {
  landmark_id: number;
  landmark_name: string;
};

export type SeedVariety = {
  seed_id: number;
  variety_name: string;
};

export type BankAccount = {
    bank_name: ReactNode;

    account_id: number;
    account_name: string;
    account_no: string;
    farmer_id: number;
};

export type Farm = {
    village_id: string; // Keep as string if DB is varchar, or change to number if INT
    farm_id: number;
    location_name: string;
    area_in_vigha: number;
};

export type FarmerDetails = {
    farmer_id: number;
    name: string;
    mobile_number: string;
    village: string; // Keep village name from farmers table if that's the source
    home_address: string;
    aadhar_number: string;
    bank_accounts: BankAccount[];
    farms: Farm[];
};

// Base type for employee dashboard lists
export type CropCycleForEmployee = {
  crop_cycle_id: number;
  farmer_name: string;
  village: string; // Village name
  farm_location: string;
  seed_variety: string;
  status: string;
  goods_collection_method?: string | null; // Nullable
  mobile_number?: string | null; // Nullable
  visit_count?: number;
};

// Extended type for Weighing List including specific fields
export type CropCycleForEmployeeWeighing = CropCycleForEmployee & {
    landmark_name?: string | null; // Nullable
    seed_bags_purchased?: number | null; // Nullable
    seed_bags_returned?: number | null; // Nullable
    lot_no?: string | null; // Nullable
    quantity_in_bags?: number | null; // Nullable
    bags_remaining_to_load?: number | null; // Nullable
};

// Type for the detailed data needed on the Visit Form page
export type CycleForVisit = {
  crop_cycle_id: number;
  farm_id: number;
  farmer_name: string;
  first_visit_date: string | null;
  sowing_date: string;
  farm_location: string;
  seed_variety: string;
  landmark_id: number;
  landmark_name: string;
};

// Type for the list of farmers under the same landmark
export type FarmerByLandmark = {
    crop_cycle_id: number;
    farmer_name: string;
    mobile_number: string;
    seed_variety: string;
    farm_location: string;
};

// Type for the visit form details
export type VisitDetails = {
    visit_id: number;
    crop_cycle_id: number;
    employee_id: number; // Assuming employee ID exists
    visit_date: string;
    rouging_percentage: number | null; // Allow null
    crop_condition: string;
    disease_data: any | null; // Allow null
    irrigation_count: number | null; // Allow null
    fertilizer_data: any | null; // Allow null
    image_url: string | null; // Allow null
    visit_number: number;
    next_visit_days: number | null; // Allow null
    farmer_cooperation: string;
    remarks: string | null; // Allow null
    gps_latitude?: string | null; // Added based on visit action
    gps_longitude?: string | null; // Added based on visit action
    rouging_remaining?: number | null; // Added based on visit action
};

export type Village = {
  village_id: number; // Use number if DB is INT
  village_name: string;
};

// *** ADDED: Generic type for simple master data items (like Landmark, Village, Company) ***
export type MasterDataItem = {
    id: number;
    name: string;
    is_active: boolean;
};

// Type for the comprehensive data needed on the Harvesting/Sample form
export type CycleForHarvesting = {
    crop_cycle_id: number;
    farmer_name: string;
    mobile_number: string | null;
    farm_location: string;
    village_name: string;
    landmark_name: string | null;
    seed_variety: string;
    harvesting_date: string | null;
    goods_collection_method: string | null;
    lot_no: string | null;
    seed_bags_purchased: number | null;
    seed_bags_returned: number | null;
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null;
    sample_colors: string | null;
    sample_non_seed: string | null;
    sample_remarks: string | null;
    temporary_price_per_man: number | null;
    final_price_per_man: number | null; // Mapped from purchase_rate
    total_bags_weighed: number | null; // Mapped from quantity_in_bags (synonym)
};

// Type for the list of cycles pending sample entry (Admin Task 1)
export type CycleForSampleEntry = {
    crop_cycle_id: number;
    farmer_name: string;
    seed_variety: string;
    sample_collection_date: string | null;
};

// Type for the list of cycles pending temporary price approval (Admin Task 2 / Phase 5)
export type CycleForPriceApproval = {
    crop_cycle_id: number;
    farmer_name: string;
    seed_variety: string;
    sampling_date: string | null;
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null;
    sample_colors: string | null;
    sample_non_seed: string | null;
};

// Type for cycles pending final price verification (Admin Task 3 / Phase 6)
export type CycleForPriceVerification = {
    sample_seed_quality: string;
    lot_number: ReactNode;
    variety_name: ReactNode;
    village_name: ReactNode;
    crop_cycle_id: number;
    farmer_name: string;
    mobile_number: string | null; // Ensure nullable
    seed_variety: string;
    sampling_date: string | null;
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null;
    sample_colors: string | null;
    sample_non_seed: string | null;
    temporary_price_per_man: number | null;
};