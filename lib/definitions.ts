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

// Type for the employee's dashboard list
export type CropCycleForEmployee = {
  crop_cycle_id: number;
  farmer_name: string;
  village: string;
  farm_location: string;
  seed_variety: string;
  visit_count: number;
};

// NEW: Type for the detailed data needed on the Visit Form page
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

// NEW: Type for the list of farmers under the same landmark
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

export type Village = {
  village_id: number;
  village_name: string;
};