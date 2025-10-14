// app/admin/cycles/new/FormInputs.tsx
"use client";

import React from 'react';

// This component is styled to exactly match the v9.html prototype
export const Input = (props: React.ComponentPropsWithoutRef<'input'> & { label: string }) => {
  const { id, label, className, ...rest } = props;
  return (
    <div className={`input-container ${className}`}>
      <input className="form-input" id={id} placeholder=" " {...rest} />
      <label htmlFor={id} className="form-label">{label}</label>
    </div>
  );
};

export const Textarea = (props: React.ComponentPropsWithoutRef<'textarea'> & { label: string }) => {
    const { id, label, className, rows = 3, ...rest } = props;
    const heightClass = rows >= 4 ? 'h-large' : 'h-small';
    return (
      <div className={`input-container ${heightClass} ${className}`}>
        <textarea className="form-input" id={id} placeholder=" " rows={rows} {...rest}></textarea>
        <label htmlFor={id} className="form-label">{label}</label>
    </div>
    );
};
  
export const Select = (props: React.ComponentPropsWithoutRef<'select'> & { label: string }) => {
    const { id, label, children, className, ...rest } = props;
    return (
        <div className={`input-container ${className}`}>
            <select className="form-input" id={id} {...rest}>
                <option value="" disabled></option>
                {children}
            </select>
            <label htmlFor={id} className="form-label">{label}</label>
            <div className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
        </div>
    );
};