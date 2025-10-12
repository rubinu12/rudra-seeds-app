// src/components/admin/modals/AddVarietyModal.tsx
"use client";

import { addSeedVariety } from '@/app/admin/actions';
import Modal from '@/components/ui/Modal';
import { Save } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react'; // Updated import

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const initialState = {
    error: '',
    success: false,
};

export default function AddVarietyModal({ isOpen, onClose }: Props) {
  // Updated to use useActionState
  const [state, formAction] = useActionState(addSeedVariety, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      alert('Seed variety added successfully!');
      formRef.current?.reset();
      onClose();
    }
  }, [state, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Seed Variety">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label htmlFor="variety_name" className="form-label">Variety Name</label>
          <input
            type="text"
            id="variety_name"
            name="variety_name"
            className="form-input"
            placeholder="e.g., T-91 (Lokwan)"
            required
          />
        </div>
        <div>
          <label htmlFor="crop_type" className="form-label">Crop Type</label>
          <input
            type="text"
            id="crop_type"
            name="crop_type"
            className="form-input"
            placeholder="e.g., Wheat"
            required
          />
        </div>
        <div>
          <label htmlFor="company_name" className="form-label">Company Name</label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            className="form-input"
            placeholder="e.g., Pacifica"
            required
          />
        </div>
        <div className="flex items-center pt-2">
            <input
                id="is_default"
                name="is_default"
                type="checkbox"
                className="h-5 w-5 rounded text-primary border-outline/40 focus:ring-primary"
            />
            <label htmlFor="is_default" className="ml-3 block text-sm text-on-surface">
                Set as default variety
            </label>
        </div>

        {state?.error && <p className="text-sm text-error mt-2">{state.error}</p>}
        
        <div className="flex justify-end gap-4 pt-6">
          <button type="submit" className="btn px-8 py-3 font-medium rounded-m3-full text-on-primary bg-primary hover:bg-primary/90 shadow-m3-active flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Variety
          </button>
        </div>
      </form>
    </Modal>
  );
}