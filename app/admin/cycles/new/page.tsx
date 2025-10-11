// src/app/admin/cycles/new/page.tsx
import {
  User,
  MapPin,
  Home,
  Phone,
  Tractor,
  Wheat,
  ShoppingBag,
  CalendarDays,
  BadgeIndianRupee,
  Save,
  XCircle,
} from "lucide-react";

// Helper component for consistent form sections
const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-wireframe-border rounded-lg p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-brand-light p-2 rounded-lg">{icon}</div>
      <h2 className="text-xl font-semibold text-neutral-heading">{title}</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

// Helper component for consistent form fields
const FormField = ({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-text mb-1">
      {label}
    </label>
    {children}
  </div>
);

export default function NewCyclePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-neutral-heading">
          Start a New Sowing Cycle
        </h1>
        <p className="text-neutral-text mt-1">
          Register a new farmer or select an existing one to begin a new crop cycle.
        </p>
      </header>

      <form className="space-y-8">
        {/* Section 1: Farmer Details */}
        <FormSection title="Farmer Details" icon={<User className="h-6 w-6 text-brand-primary" />}>
          
          {/* Farmer Name with Autocomplete */}
          <div className="md:col-span-2 relative">
            <FormField label="Farmer Name" id="farmerName">
              <input
                type="text"
                id="farmerName"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="Start typing farmer's name..."
              />
            </FormField>
            {/* This is a static representation of the autocomplete dropdown */}
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Ramesh Patel - Navsari</li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Ramesh Kumar - Surat</li>
              </ul>
            </div>
          </div>

          {/* Other Farmer Fields */}
          <FormField label="Mobile Number" id="mobileNumber">
            <input type="text" id="mobileNumber" placeholder="Auto-populated, but editable" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
          </FormField>
          <FormField label="Village" id="village">
            <input type="text" id="village" placeholder="Auto-populated, but editable" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Home Address" id="homeAddress">
              <textarea id="homeAddress" rows={2} placeholder="Auto-populated, but editable" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"></textarea>
            </FormField>
          </div>
        </FormSection>

        {/* Section 2: Farm & Sowing Details */}
        <FormSection title="Farm & Sowing Details" icon={<Tractor className="h-6 w-6 text-brand-primary" />}>
          <FormField label="Select Farm" id="farm">
            <select id="farm" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
              <option>Select a farm...</option>
              <option>Field near river (15 Vigha)</option>
              <option>North Field (10 Vigha)</option>
              <option>Add New Farm...</option>
            </select>
          </FormField>
          <FormField label="Seed Variety" id="seedVariety">
            <select id="seedVariety" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
                <option>Select a variety...</option>
                <option>T-91 (Lokwan)</option>
                <option>GW-496</option>
                <option>Durum</option>
            </select>
          </FormField>
          <FormField label="Seed Bags Purchased" id="seedBags">
            <input type="number" id="seedBags" placeholder="e.g., 10" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
          </FormField>
          <FormField label="Sowing Date" id="sowingDate">
            <input type="date" id="sowingDate" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
          </FormField>
        </FormSection>
        
        {/* Section 3: Payment */}
        <FormSection title="Payment Details" icon={<BadgeIndianRupee className="h-6 w-6 text-brand-primary" />}>
           <div>
              <p className="block text-sm font-medium text-neutral-text mb-1">Total Seed Cost</p>
              <p className="text-2xl font-bold text-neutral-heading">₹ 12,500.00</p>
              <p className="text-xs text-gray-500">(auto-calculated)</p>
           </div>
           <div>
              <p className="block text-sm font-medium text-neutral-text mb-2">Payment Status</p>
              <div className="flex gap-6">
                <div className="flex items-center">
                  <input id="paid" name="payment-status" type="radio" className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary" defaultChecked />
                  <label htmlFor="paid" className="ml-2 block text-sm text-gray-900">Paid</label>
                </div>
                <div className="flex items-center">
                  <input id="credit" name="payment-status" type="radio" className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary" />
                  <label htmlFor="credit" className="ml-2 block text-sm text-gray-900">Credit</label>
                </div>
              </div>
           </div>
        </FormSection>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
            <button type="button" className="btn px-6 py-2 text-sm font-semibold rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancel
            </button>
            <button type="submit" className="btn px-6 py-2 text-sm font-semibold rounded-md text-white bg-brand-primary hover:bg-green-800 flex items-center gap-2">
                <Save className="h-5 w-5" />
                Save and Create Cycle
            </button>
        </div>
      </form>
    </div>
  );
}