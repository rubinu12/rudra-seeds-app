// components/ui/FloatingLabelSelect.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

type FloatingLabelSelectProps = {
  id: string;
  name: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  [x: string]: any; // Allow for other props
};

export default function FloatingLabelSelect({
  id,
  name,
  label,
  children,
  className = '',
  ...props
}: FloatingLabelSelectProps) {
  return (
    <div className={`relative rounded-t-lg bg-input-bg/50 border-b-2 border-outline focus-within:border-primary ${className}`}>
      <select
        id={id}
        name={name}
        className="peer block w-full appearance-none bg-transparent pt-6 pb-2 px-4 text-on-surface outline-none focus:ring-0"
        {...props}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className="absolute top-4 left-4 text-on-surface-variant duration-300 transform -translate-y-4 scale-75 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-primary rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
      >
        {label}
      </label>
      <div className="absolute top-0 right-0 h-full flex items-center px-4 pointer-events-none">
        <ChevronDown className="h-5 w-5 text-on-surface-variant" />
      </div>
    </div>
  );
}