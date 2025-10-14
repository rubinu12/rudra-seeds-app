// @/components/ui/SearchableSelect.tsx
"use client";
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchableSelect({ options, value, onChange, placeholder = "Search..." }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    }
  }, [selectedOption]);

  const filteredOptions = searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div className="relative">
      <div className="input-container">
        <input
          type="text"
          className="form-input pr-10"
          placeholder=" "
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if(value) onChange(''); // Clear selection when user starts typing
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <label className="form-label">{placeholder}</label>
        <button type="button" className="absolute top-0 right-0 h-full px-4" onClick={() => setIsOpen(!isOpen)}>
          <ChevronsUpDown className="h-4 w-4 text-on-surface-variant" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-surface-container border border-outline rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.value}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-primary/10"
                onMouseDown={() => {
                  onChange(option.value);
                  setSearchTerm(option.label);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 text-primary" />}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-on-surface-variant">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}