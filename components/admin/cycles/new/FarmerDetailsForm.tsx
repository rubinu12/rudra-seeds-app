// components/admin/cycles/new/FarmerDetailsForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { FarmerDetails } from '@/lib/definitions';
import { User, FilePenLine } from 'lucide-react';

type Props = {
  farmer: FarmerDetails | null;
};

// A small component for our read-only display fields for cleanliness
const DisplayField = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="form-display-field">
    <span className="form-display-key">{label}:</span>
    <span className="form-display-value">{value || 'N/A'}</span>
  </div>
);

export default function FarmerDetailsForm({ farmer }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  // When a new farmer is selected from the search, reset to display mode.
  // If no farmer is selected (cleared search), switch to edit/create mode.
  useEffect(() => {
    setIsEditing(farmer === null);
  }, [farmer]);

  return (
    <div className="form-section-card" style={{ background: 'rgba(234, 221, 255, 0.25)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary-container p-3 rounded-m3-large shadow-sm">
            <User className="h-6 w-6 text-on-primary-container" />
          </div>
          <h2 className="text-2xl font-normal text-on-surface">Farmer Details</h2>
        </div>
        {farmer && !isEditing && (
          <button 
            type="button" 
            onClick={() => setIsEditing(true)}
            className="btn px-4 py-2 font-medium rounded-m3-full text-primary bg-primary-container/60 hover:bg-primary-container flex items-center gap-2 text-sm"
          >
            <FilePenLine className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {/* Hidden input to pass the farmer_id to the Server Action */}
      {farmer && <input type="hidden" name="farmer_id" value={farmer.farmer_id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {isEditing ? (
          <>
            {/* EDITABLE FORM MODE */}
            <div>
              <label htmlFor="farmer_name" className="form-label">Farmer Name</label>
              <input type="text" id="farmer_name" name="farmer_name" className="form-input" defaultValue={farmer?.name} required />
            </div>
            <div>
              <label htmlFor="mobile_number" className="form-label">Mobile Number</label>
              <input type="text" id="mobile_number" name="mobile_number" className="form-input" defaultValue={farmer?.mobile_number} required />
            </div>
            <div>
              <label htmlFor="village" className="form-label">Village</label>
              <input type="text" id="village" name="village" className="form-input" defaultValue={farmer?.village} required />
            </div>
            <div>
              <label htmlFor="aadhar_number" className="form-label">Aadhar No.</label>
              <input type="text" id="aadhar_number" name="aadhar_number" className="form-input" defaultValue={farmer?.aadhar_number} required />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="home_address" className="form-label">Home Address</label>
              <textarea id="home_address" name="home_address" rows={2} className="form-input h-auto py-3" defaultValue={farmer?.home_address} required />
            </div>
          </>
        ) : (
          <>
            {/* READ-ONLY DISPLAY MODE */}
            <DisplayField label="Farmer Name" value={farmer?.name} />
            <DisplayField label="Mobile" value={farmer?.mobile_number} />
            <DisplayField label="Village" value={farmer?.village} />
            <DisplayField label="Aadhar No" value={farmer?.aadhar_number} />
            <div className="md:col-span-2">
                <DisplayField label="Address" value={farmer?.home_address} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}