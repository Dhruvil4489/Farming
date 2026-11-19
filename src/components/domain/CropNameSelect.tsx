'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  PlusCircle,
  RotateCcw,
  AlertCircle,
  X,
  Sprout,
  Wheat,
} from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import {
  AGRICULTURAL_CROP_GROUPS,
  PREDEFINED_CROP_NAMES,
  searchAgriculturalCrops,
  isPredefinedCrop,
  SearchResultItem,
} from '@/lib/agricultural-crops';

export interface CropNameSelectProps {
  value: string;
  onChange: (value: string) => void;
  existingNames?: string[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
  disabled?: boolean;
}

export function CropNameSelect({
  value,
  onChange,
  existingNames = [],
  label = 'Crop Name *',
  placeholder = 'Search or select a crop',
  required = true,
  error,
  id = 'crop-name-select',
  disabled = false,
}: CropNameSelectProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [forceCustom, setForceCustom] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const optionListRef = useRef<HTMLDivElement>(null);

  // Check if current value is in the agricultural crop database
  const isPredefined = useMemo(() => isPredefinedCrop(value), [value]);

  // Active custom mode is true if explicitly forced OR if a non-empty non-predefined value is set
  const isCustomMode = forceCustom || Boolean(value && !isPredefined);

  // Filter crops using the smart search (name + aliases + scientific name)
  const { groups: filteredGroups, totalMatches } = useMemo(() => {
    return searchAgriculturalCrops(searchTerm, AGRICULTURAL_CROP_GROUPS);
  }, [searchTerm]);

  // Flattened array of visible options for index-based keyboard navigation
  const flatOptions = useMemo<SearchResultItem[]>(() => {
    return filteredGroups.flatMap((grp) => grp.options);
  }, [filteredGroups]);

  // Reset highlighted option when search term or open state changes
  useEffect(() => {
    setHighlightedIndex(flatOptions.length > 0 ? 0 : -1);
  }, [searchTerm, isOpen, flatOptions.length]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Focus custom input when entering custom mode
  useEffect(() => {
    if (isCustomMode && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isCustomMode]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionListRef.current) {
      const highlightedEl = optionListRef.current.querySelector(
        `[data-option-index="${highlightedIndex}"]`
      ) as HTMLElement | null;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelectOption = useCallback(
    (name: string) => {
      setForceCustom(false);
      onChange(name);
      setIsOpen(false);
      setSearchTerm('');
    },
    [onChange]
  );

  const handleEnableCustomMode = useCallback(
    (initialVal?: string) => {
      setForceCustom(true);
      setIsOpen(false);
      setSearchTerm('');
      onChange(initialVal !== undefined ? initialVal : '');
    },
    [onChange]
  );

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBackToPredefined = () => {
    setForceCustom(false);
    onChange('');
    setIsOpen(true);
  };

  // Keyboard navigation handler for the search bar and options list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < flatOptions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : flatOptions.length - 1
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < flatOptions.length) {
        handleSelectOption(flatOptions[highlightedIndex].name);
      } else if (searchTerm.trim()) {
        handleEnableCustomMode(searchTerm.trim());
      }
      return;
    }
  };

  const isDuplicate = useMemo(() => {
    if (!value) return false;
    const lower = value.trim().toLowerCase();
    return existingNames.some((n) => n.trim().toLowerCase() === lower);
  }, [value, existingNames]);

  return (
    <div className="w-full space-y-1.5" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-semibold text-stone-800">
            {label}
          </label>
          {isCustomMode && (
            <button
              type="button"
              onClick={handleBackToPredefined}
              className="text-xs text-[#2F7D4F] hover:text-[#143D2A] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} /> {t('choose_from_list', 'Select from predefined crop list')}
            </button>
          )}
        </div>
      )}

      {/* Main Dropdown Button (when not in custom manual mode) */}
      {!isCustomMode ? (
        <div className="relative">
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`w-full px-3.5 py-2.5 bg-white border ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-[#2F7D4F]'
            } rounded-xl text-sm text-left flex items-center justify-between gap-2 shadow-xs hover:border-stone-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all min-h-[46px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <span className="flex items-center gap-2 truncate">
              {value ? (
                <>
                  <Sprout size={16} className="text-[#2F7D4F] shrink-0" />
                  <span className="font-bold text-stone-900 truncate">{value}</span>
                </>
              ) : (
                <span className="text-stone-400 font-normal">{placeholder}</span>
              )}
            </span>
            <ChevronDown
              size={18}
              className={`text-stone-500 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180 text-[#2F7D4F]' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Popover */}
          {isOpen && (
            <div
              className="absolute z-50 mt-1.5 w-full bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[420px] flex flex-col"
              role="listbox"
            >
              {/* Search bar within dropdown */}
              <div className="p-2.5 border-b border-stone-100 bg-[#FAF9F5] shrink-0">
                <div className="relative flex items-center">
                  <Search size={15} className="absolute left-3 text-stone-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search_crop_name', 'Search crops (e.g. Wheat, Chana, Cotton)...')}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 p-0.5 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-[11px] text-stone-500 mt-1.5 px-1">
                    Found {totalMatches} matching {totalMatches === 1 ? 'crop' : 'crops'}
                  </p>
                )}
              </div>

              {/* Scrollable list of options */}
              <div
                ref={optionListRef}
                className="overflow-y-auto p-2 space-y-3 flex-1 overscroll-contain"
              >
                {filteredGroups.map((grp) => (
                  <div key={grp.group} className="space-y-1">
                    {/* Category Header */}
                    <div className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/80 bg-emerald-50/70 rounded-lg flex items-center justify-between">
                      <span>{grp.group}</span>
                      <span className="text-[10px] font-semibold text-emerald-700/70">
                        {grp.options.length}
                      </span>
                    </div>

                    {/* Crop Options */}
                    <div className="space-y-0.5 pt-0.5">
                      {grp.options.map((opt) => {
                        const isSelected = value === opt.name;
                        const optionIndex = flatOptions.findIndex((o) => o.name === opt.name);
                        const isHighlighted = optionIndex === highlightedIndex;
                        const isTaken = existingNames.some(
                          (n) => n.trim().toLowerCase() === opt.name.toLowerCase()
                        );

                        return (
                          <button
                            key={opt.name}
                            type="button"
                            role="option"
                            data-option-index={optionIndex}
                            aria-selected={isSelected}
                            onClick={() => handleSelectOption(opt.name)}
                            onMouseEnter={() => setHighlightedIndex(optionIndex)}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 text-[#143D2A] font-bold border border-emerald-200'
                                : isHighlighted
                                ? 'bg-stone-100 text-stone-900'
                                : 'text-stone-800 hover:bg-stone-100/80'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="truncate">{opt.name}</span>
                              {opt.matchedAlias && (
                                <span className="text-[10px] font-normal text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                  {opt.matchedAlias}
                                </span>
                              )}
                              {isTaken && (
                                <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shrink-0">
                                  On this farm
                                </span>
                              )}
                            </span>
                            {isSelected && <Check size={16} className="text-[#2F7D4F] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {filteredGroups.length === 0 && (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-stone-500">
                      No predefined crop matching &ldquo;{searchTerm}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => handleEnableCustomMode(searchTerm.trim())}
                      className="text-xs font-bold text-[#2F7D4F] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Add &ldquo;{searchTerm}&rdquo; as custom crop
                    </button>
                  </div>
                )}
              </div>

              {/* Other / Custom Crop Option Footer */}
              <div className="p-2 border-t border-stone-100 bg-[#FAF9F5] shrink-0">
                <button
                  type="button"
                  onClick={() => handleEnableCustomMode()}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-bold text-[#2F7D4F] hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <PlusCircle size={16} />
                  <span>{t('custom_crop_name', 'Other Crop (Enter custom crop name)...')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Custom Crop Name Input Mode */
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              ref={customInputRef}
              id={id}
              type="text"
              required={required}
              value={value}
              onChange={handleCustomChange}
              placeholder="e.g. Dragon Fruit, Stevia, Quinoa, Chia Seeds"
              className={`w-full px-3.5 py-2.5 bg-white border ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-[#2F7D4F]'
              } rounded-xl text-sm font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all min-h-[46px]`}
            />
          </div>
          <p className="text-[11px] text-stone-500">
            Custom crop mode active. Click &ldquo;Select from predefined crop list&rdquo; above to return to standard crops.
          </p>
        </div>
      )}

      {/* Duplicate warning on same farm */}
      {isDuplicate && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span>A field with crop &ldquo;{value}&rdquo; already exists on this farm.</span>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}
