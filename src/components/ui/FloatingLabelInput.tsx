// src/components/ui/FloatingLabelInput.tsx
import React from 'react';

type FloatingLabelInputProps = React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & {
  id: string;
  name: string;
  label: string;
  as?: 'input' | 'textarea';
  rows?: number;
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
  
  const baseClass = `peer block w-full bg-transparent pt-6 pb-2 px-4 text-on-surface outline-none focus:ring-0 ${className}`;

  return (
    <div className={`relative rounded-t-lg bg-input-bg/50 border-b-2 border-outline focus-within:border-primary ${className}`}>
      {as === 'textarea' ? (
        <textarea 
            id={id}
            name={name}
            className={baseClass}
            placeholder=" "
            rows={props.rows || 3}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input 
            id={id}
            name={name}
            type={type}
            className={baseClass}
            placeholder=" "
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
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