// src/components/ui/Modal.tsx
"use client";

import { X } from 'lucide-react';
import React from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="form-section-card w-full max-w-md transform transition-all" 
        style={{ background: 'rgba(255, 251, 254, 0.85)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-outline/30">
          <h2 className="text-2xl font-normal text-on-surface">{title}</h2>
          <button onClick={onClose} className="btn p-2 rounded-full hover:bg-black/10">
            <X className="h-6 w-6 text-on-surface-variant" />
          </button>
        </div>
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}