// lib/definitions.ts

export type Landmark = {
  landmark_id: number;
  landmark_name: string;
};

export type SeedVariety = {
  seed_id: number;
  variety_name: string;
};

export type BankAccount = {
    account_id: number;
    account_name: string;
    account_no: string;
    ifsc_code: string;
};

export type Farm = {
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

export type CropCycleForEmployee = {
  crop_cycle_id: number;
  farmer_name: string;
  village: string;
  farm_location: string;
  seed_variety: string;
  visit_count: number;
};

export type VisitDetails = {
    visit_id: number;
    crop_cycle_id: number;
    employee_id: number;
    visit_date: string;
    rouging_percentage: number;
    crop_condition: string;
    disease_data: any; // Stored as JSONB
    irrigation_count: number;
    fertilizer_data: any; // Stored as JSONB
    image_url: string;
    visit_number: number;
    next_visit_days: number;
    farmer_cooperation: string;
    remarks: string;
};