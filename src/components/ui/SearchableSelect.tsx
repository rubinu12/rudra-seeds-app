// components/ui/SearchableSelect.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  name: string;
  id: string;
};

export default function SearchableSelect({ options, value, onChange, label, name, id }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const filteredOptions = searchTerm
    ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const displayValue = isOpen ? searchTerm : (selectedOption?.label || '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(selectedOption?.label || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            const selected = filteredOptions[highlightedIndex];
            onChange(selected.value);
            setSearchTerm(selected.label);
            setIsOpen(false);
            inputRef.current?.blur();
          }
        } else if (e.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.blur();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, filteredOptions, onChange]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} id={id} value={value} />
      <div className="relative rounded-t-lg bg-input-bg/50 border-b-2 border-outline focus-within:border-primary">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange('');
          }}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          placeholder=" "
          className="peer block w-full appearance-none bg-transparent pt-6 pb-2 px-4 text-on-surface outline-none focus:ring-0"
        />
        <label htmlFor={id} className="absolute top-4 left-4 text-on-surface-variant duration-300 transform -translate-y-4 scale-75 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-primary">
          {label}
        </label>
        <button type="button" className="absolute top-0 right-0 h-full flex items-center px-4" onClick={() => setIsOpen(!isOpen)}>
          <ChevronsUpDown className="h-5 w-5 text-on-surface-variant" />
        </button>
      </div>

      {isOpen && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-surface-container border border-outline rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer ${highlightedIndex === index ? 'bg-primary/10' : 'hover:bg-primary/10'}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                  setSearchTerm(option.label);
                  setIsOpen(false);
                  inputRef.current?.blur();
                }}
              >
                <span className="text-on-surface">{option.label}</span>
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