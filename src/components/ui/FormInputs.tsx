// components/ui/FormInputs.tsx
"use client";

import React from 'react';
import { ChevronsUpDown } from 'lucide-react';

// A styled container that provides the border and background for all inputs
const InputContainer = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative bg-input-bg rounded-xl border border-outline focus-within:border-primary focus-within:border-2 ${className}`}>
        {children}
    </div>
);

// A styled label that floats when the input is focused or has a value
const FloatingLabel = ({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) => (
    <label 
        htmlFor={htmlFor} 
        className="absolute text-base text-on-surface-variant duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-primary"
    >
        {children}
    </label>
);

// --- EXPORTED COMPONENTS ---

export const Input = (props: React.ComponentPropsWithoutRef<'input'> & { label: string }) => {
  const { id, label, className, ...rest } = props;
  return (
    <InputContainer className={className}>
      <input 
        id={id} 
        className="peer block w-full h-[56px] px-4 pt-5 pb-2 bg-transparent text-on-surface outline-none ring-0" 
        placeholder=" " 
        {...rest} 
      />
      <FloatingLabel htmlFor={id!}>{label}</FloatingLabel>
    </InputContainer>
  );
};

export const Textarea = (props: React.ComponentPropsWithoutRef<'textarea'> & { label: string }) => {
    const { id, label, className, rows = 3, ...rest } = props;
    return (
      <InputContainer className={className}>
        <textarea 
            id={id} 
            className="peer block w-full min-h-[56px] px-4 pt-6 pb-2 bg-transparent text-on-surface outline-none ring-0" 
            placeholder=" " 
            rows={rows}
            {...rest}
        ></textarea>
        <FloatingLabel htmlFor={id!}>{label}</FloatingLabel>
    </InputContainer>
    );
};
  
export const Select = (props: React.ComponentPropsWithoutRef<'select'> & { label: string }) => {
    const { id, label, children, className, ...rest } = props;
    return (
        <InputContainer className={className}>
            <select 
                id={id} 
                className="peer block w-full h-[56px] px-4 pt-5 pb-2 bg-transparent text-on-surface outline-none ring-0 appearance-none"
                {...rest}
            >
                <option value="" disabled></option>
                {children}
            </select>
            <FloatingLabel htmlFor={id!}>{label}</FloatingLabel>
            <div className="absolute top-0 right-0 h-full flex items-center px-4 pointer-events-none">
                <ChevronsUpDown className="h-5 w-5 text-on-surface-variant" />
            </div>
        </InputContainer>
    );
};