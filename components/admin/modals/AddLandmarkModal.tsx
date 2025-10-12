// src/components/admin/modals/AddLandmarkModal.tsx
"use client";

import { addLandmark } from '@/app/admin/actions';
import Modal from '@/components/ui/Modal';
import { Milestone, Save } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react'; // Updated import

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const initialState = {
  error: '',
  success: false,
};

export default function AddLandmarkModal({ isOpen, onClose }: Props) {
  // Updated to use useActionState
  const [state, formAction] = useActionState(addLandmark, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      alert('Landmark added successfully!');
      formRef.current?.reset();
      onClose();
    }
  }, [state, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Landmark">
      <form ref={formRef} action={formAction}>
        <div>
          <label htmlFor="landmark_name" className="form-label">Landmark Name</label>
          <input
            type="text"
            id="landmark_name"
            name="landmark_name"
            className="form-input"
            placeholder="e.g., Near Canal"
            required
          />
        </div>
        {state?.error && <p className="text-sm text-error mt-2">{state.error}</p>}
        <div className="flex justify-end gap-4 pt-8">
          <button type="submit" className="btn px-8 py-3 font-medium rounded-m3-full text-on-primary bg-primary hover:bg-primary/90 shadow-m3-active flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Landmark
          </button>
        </div>
      </form>
    </Modal>
  );
}