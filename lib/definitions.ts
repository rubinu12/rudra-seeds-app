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