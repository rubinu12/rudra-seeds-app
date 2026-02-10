// src/components/ui/Modal.tsx
"use client";

import { X } from 'lucide-react';
import React from 'react'; // Import React

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // *** CHANGE: title type from string to React.ReactNode ***
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // Optional: Allow customizing width
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-md" // Default width
}: ModalProps) {
  if (!isOpen) return null;

  // Determine if the title is a simple string or a more complex ReactNode
  const isTitleString = typeof title === 'string';

  return (
    // Backdrop
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" // Darker backdrop, added padding
        onClick={onClose}
        role="dialog" // Accessibility
        aria-modal="true"
        // Use aria-label if title isn't a string, otherwise aria-labelledby
        aria-label={!isTitleString ? 'Modal' : undefined}
        aria-labelledby={isTitleString ? 'modal-title' : undefined}
    >
      {/* Modal Content */}
      <div
        className={`bg-surface-container rounded-3xl shadow-xl w-full ${maxWidth} transform transition-all flex flex-col max-h-[90vh]`} // M3 rounding, shadow, vertical flex, max height
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline/30 flex-shrink-0"> {/* Increased padding */}
          {/* *** CHANGE: Render title differently based on type *** */}
          {isTitleString ? (
            <h2 id="modal-title" className="text-xl font-medium text-on-surface">{title}</h2>
          ) : (
            // If title is not a string, render it directly (assuming it's a component like the custom header)
            <div id="modal-title" className="flex-grow">{title}</div>
          )}
          <button
              onClick={onClose}
              // Adjust margin if title is complex to ensure spacing
              className={`p-2 rounded-full text-on-surface-variant hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-primary ${!isTitleString ? 'ml-4' : ''}`} // Added ml-4 conditionally
              aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-grow"> {/* Increased padding, handles scrolling */}
          {children}
        </div>
      </div>
    </div>
  );
}