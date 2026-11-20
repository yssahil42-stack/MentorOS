import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CURRENCY_OPTIONS, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { cn } from '../../utils/cn';

export interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  format?: 'short' | 'full' | 'code-symbol';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  id?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  format = 'code-symbol',
  className,
  buttonClassName,
  menuClassName,
  disabled = false,
  align = 'left',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize current currency
  const normalizedValue = (value || 'INR').toUpperCase();
  const currentCurrency = SUPPORTED_CURRENCIES[normalizedValue] || SUPPORTED_CURRENCIES.INR;

  // Filter out the currently selected currency so it never appears in the dropdown list
  const availableOptions = CURRENCY_OPTIONS.filter((c) => c.value !== normalizedValue);

  // Close on click outside or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const renderLabel = (
    c: { code?: string; value?: string; symbol: string; name?: string; flag: string },
    labelFormat: 'short' | 'full' | 'code-symbol'
  ) => {
    const code = c.code || c.value || 'INR';
    if (labelFormat === 'short') {
      return (
        <span className="flex items-center gap-1.5 font-bold">
          <span>{c.flag}</span>
          <span>{code}</span>
        </span>
      );
    }
    if (labelFormat === 'full') {
      return (
        <span className="flex items-center gap-1.5 font-bold">
          <span>{c.flag}</span>
          <span>
            {code} ({c.symbol})
          </span>
          {c.name && <span className="font-normal text-text-muted text-3xs">· {c.name}</span>}
        </span>
      );
    }
    // Default: 'code-symbol' (e.g. "🇮🇳 INR (₹)")
    return (
      <span className="flex items-center gap-1.5 font-bold">
        <span>{c.flag}</span>
        <span>
          {code} ({c.symbol})
        </span>
      </span>
    );
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex items-center justify-between gap-1.5 text-xs font-bold text-text-primary bg-transparent focus:outline-none cursor-pointer rounded-lg transition-colors select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          buttonClassName
        )}
      >
        <span className="truncate">{renderLabel(currentCurrency, format)}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-text-muted transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-amber-500'
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute z-50 mt-1 min-w-[170px] w-max max-w-[260px] bg-white dark:bg-[#161922] border border-[#eee7e0] dark:border-stone-800 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto no-scrollbar focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {availableOptions.map((option) => (
            <button
              key={option.value}
              role="option"
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-[#c04b1e] dark:hover:text-orange-400 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-medium truncate">
                <span className="shrink-0">{option.flag}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#c04b1e] dark:group-hover:text-orange-400">
                  {option.value}
                </span>
                <span className="text-stone-500 dark:text-stone-400">({option.symbol})</span>
              </div>
              <span className="text-3xs text-stone-400 dark:text-stone-500 shrink-0 hidden sm:inline truncate">
                {option.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
