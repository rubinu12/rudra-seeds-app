// components/ui/FloatingLabelInput.tsx
import React from 'react';

// Define the props for the component
type FloatingLabelInputProps = {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'tel' | 'number' | 'date';
  as?: 'input' | 'textarea';
  className?: string;
  [x: string]: any; // Allow for other props like defaultValue, onChange, etc.
};

export default function FloatingLabelInput({
  id,
  name,
  label,
  type = 'text',
  as = 'input',
  className = '',
  ...props
}: FloatingLabelInputProps) {
  const commonProps = {
    id,
    name,
    className: `peer block w-full bg-transparent pt-6 pb-2 px-4 text-on-surface outline-none focus:ring-0`,
    placeholder: ' ', // The space is crucial for the :placeholder-shown selector to work
    ...props,
  };

  return (
    <div className={`relative rounded-t-lg bg-input-bg/50 border-b-2 border-outline focus-within:border-primary ${className}`}>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={props.rows || 3}></textarea>
      ) : (
        <input type={type} {...commonProps} />
      )}
      <label
        htmlFor={id}
        className="absolute top-4 left-4 text-on-surface-variant duration-300 transform -translate-y-4 scale-75 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-primary rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
      >
        {label}
      </label>
    </div>
  );
}