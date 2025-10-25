// lib/definitions.ts

// Add 'export' before each type definition
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

// Type for the employee's dashboard list
export type CropCycleForEmployee = {
  crop_cycle_id: number;
  farmer_name: string;
  village: string; // Village name
  farm_location: string;
  seed_variety: string;
  visit_count: number;
  status: string;
  goods_collection_method?: string; // Add this if needed for filtering
  mobile_number?: string; // Add if needed
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
  village_id: number; // Use number if DB is INT
  village_name: string;
};

// Type for the comprehensive data needed on the Harvesting/Sample form
export type CycleForHarvesting = {
    crop_cycle_id: number;
    farmer_name: string;
    mobile_number: string; // Added
    farm_location: string;
    village_name: string; // Added
    landmark_name: string;
    seed_variety: string;
    harvesting_date: string | null;
    goods_collection_method: 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard' | string; // Updated type
    lot_no: string | null;
    seed_bags_purchased: number;
    seed_bags_returned: number | null; // Still nullable if not tracked
    // Existing sample data for pre-filling
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null; // Mapped from dust_percentage
    sample_colors: string | null; // Mapped from color_grade, type depends on DB
    sample_non_seed: 'High' | 'Less' | 'Rare' | string | null; // Keep flexible or use ENUM type if defined
    sample_remarks: string | null;
    temporary_price_per_man: number | null; // Added
    final_price_per_man: number | null; // Mapped from purchase_rate
    total_bags_weighed: number | null; // Mapped from quantity_in_bags
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
    sampling_date: string | null; // Added
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null; // Mapped from dust_percentage
    sample_colors: string | null; // Mapped from color_grade
    sample_non_seed: string | null;
};

// Type for cycles pending final price verification (Admin Task 3 / Phase 6)
export type CycleForPriceVerification = {
    crop_cycle_id: number;
    farmer_name: string;
    seed_variety: string;
    sampling_date: string | null;
    sample_moisture: number | null;
    sample_purity: number | null;
    sample_dust: number | null;
    sample_colors: string | null;
    sample_non_seed: string | null;
    temporary_price_per_man: number | null; // Show the proposed price
};