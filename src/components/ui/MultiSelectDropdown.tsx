import React, { useState, useRef, useEffect } from 'react';

type MultiSelectDropdownProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
};

export function MultiSelectDropdown({ options, selected, onChange, placeholder = 'Filtrar...' }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeSelected = Array.isArray(selected) ? selected : [];

  const toggleOption = (opt: string) => {
    if (safeSelected.includes(opt)) {
      onChange(safeSelected.filter((s) => s !== opt));
    } else {
      onChange([...safeSelected, opt]);
    }
  };

  const displayText = safeSelected.length === 0 
    ? placeholder 
    : safeSelected.length === 1 
      ? safeSelected[0].length > 15 ? safeSelected[0].substring(0, 15) + '...' : safeSelected[0]
      : `${safeSelected.length} seleccionados`;

  return (
    <div className="relative w-full text-black" ref={containerRef}>
      <button
        type="button"
        className="form-input text-xs p-1 h-8 w-full text-left bg-white flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        title={safeSelected.join(', ')}
      >
        <span className="truncate">{displayText}</span>
        <span className="text-[10px] ml-1">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border shadow-lg max-h-60 overflow-y-auto text-sm rounded">
          <div className="p-2 border-b flex justify-between bg-surface-hover">
            <button 
              type="button" 
              className="text-primary text-xs font-bold"
              onClick={() => onChange([...options])}
            >
              Todos
            </button>
            <button 
              type="button" 
              className="text-danger text-xs font-bold"
              onClick={() => onChange([])}
            >
              Ninguno
            </button>
          </div>
          <div className="p-1">
            {options.map((opt) => (
              <label key={opt} className="flex items-center p-1.5 hover:bg-surface-hover cursor-pointer rounded">
                <input
                  type="checkbox"
                  className="mr-2 rounded"
                  checked={safeSelected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                <span className="truncate flex-1" title={opt}>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
