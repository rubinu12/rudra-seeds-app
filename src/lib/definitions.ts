// src/lib/definitions.ts
import { ReactNode } from "react";

// --- MASTER DATA ---
export type Landmark = {
  landmark_id: number;
  landmark_name: string;
};

export type SeedVariety = {
  seed_id: number;
  variety_name: string;
};

export type Village = {
  village_id: number;
  village_name: string;
};

export type MasterDataItem = {
    id: number;
    name: string;
    is_active: boolean;
};

// --- FARMER & BANK ---
export type BankAccount = {
    bank_name: ReactNode; 
    account_id: number;
    account_name: string;
    account_no: string;
    farmer_id: number;
};

export type Farm = {
    village_id: string; 
    farm_id: number;
    location_name: string;
    area_in_vigha: number;
};

export type FarmerDetails = {
    farmer_id: number;
    name: string;
    mobile_number: string;
    village: string;
    home_address: string;
    aadhar_number: string;
    bank_accounts: BankAccount[];
    farms: Farm[];
};

// --- EMPLOYEE DASHBOARD TYPES ---
export type CropCycleForEmployee = {
  crop_cycle_id: number;
  farmer_name: string;
  village: string;
  farm_location: string;
  seed_variety: string;
  status: string;
  goods_collection_method?: string | null;
  mobile_number?: string | null;
  visit_count?: number;
};

export type CropCycleForEmployeeWeighing = CropCycleForEmployee & {
    landmark_name?: string | null;
    seed_bags_purchased?: number | null;
    seed_bags_returned?: number | null;
    lot_no?: string | null;
    quantity_in_bags?: number | null;
    bags_remaining_to_load?: number | null;
};

// --- VISIT & FARMING ---
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

export type FarmerByLandmark = {
    crop_cycle_id: number;
    farmer_name: string;
    mobile_number: string;
    seed_variety: string;
    farm_location: string;
};

export type VisitDetails = {
    visit_id: number;
    crop_cycle_id: number;
    employee_id: number;
    visit_date: string;
    rouging_percentage: number | null;
    crop_condition: string;
    disease_data: Record<string, unknown> | null; 
    irrigation_count: number | null;
    fertilizer_data: Record<string, unknown> | null; 
    image_url: string | null;
    visit_number: number;
    next_visit_days: number | null;
    farmer_cooperation: string;
    remarks: string | null;
    gps_latitude?: string | null;
    gps_longitude?: string | null;
    rouging_remaining?: number | null;
};

// --- HARVEST & ADMIN LISTS ---
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
    final_price_per_man: number | null;
    total_bags_weighed: number | null;
};

export type CycleForSampleEntry = {
    crop_cycle_id: number;
    farmer_name: string;
    seed_variety: string;
    sample_collection_date: string | null;
};

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

// --- FIXED: Explicit Export for Verification ---
export type CycleForPriceVerification = {
    crop_cycle_id: number;
    farmer_name: string;
    mobile_number: string | null;
    seed_variety: string;
    variety_name?: string; // Optional alias
    
    sampling_date: string | null;
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null;
    sample_colors: string | null;
    sample_non_seed: string | null;
    temporary_price_per_man: number | null;
    
    // Verification UI Fields
    lot_number: string | null; 
    village_name: string | null;
    sample_seed_quality: string;
};