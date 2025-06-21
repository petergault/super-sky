'use client';

import React, { useState, useCallback } from 'react';
import { debounce, isValidZipCode } from '../utils/helpers';

interface ZipCodeInputProps {
  onSubmit: (zipCode: string) => void;
  isLoading?: boolean;
  recentZipCodes?: string[];
  placeholder?: string;
}

/**
 * ZipCodeInput Component
 * Handles ZIP code input with validation and recent searches
 */
const ZipCodeInput: React.FC<ZipCodeInputProps> = ({
  onSubmit,
  isLoading = false,
  recentZipCodes = [],
  placeholder = "Enter ZIP code (e.g., 12345)"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced validation function
  const debouncedValidation = useCallback(
    debounce((value: string) => {
      if (value.trim() === '') {
        setIsValid(true);
        return;
      }
      setIsValid(isValidZipCode(value.trim()));
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedValidation(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    
    if (!trimmed) {
      setIsValid(false);
      return;
    }
    
    if (!isValidZipCode(trimmed)) {
      setIsValid(false);
      return;
    }
    
    setShowDropdown(false);
    onSubmit(trimmed);
  };

  const handleRecentZipClick = (zipCode: string) => {
    setInputValue(zipCode);
    setIsValid(true);
    setShowDropdown(false);
    onSubmit(zipCode);
  };

  const handleInputFocus = () => {
    if (recentZipCodes.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow click events on dropdown items
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={isLoading}
            className={`
              w-full px-4 py-2 text-base border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${!isValid 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-gray-300 bg-white'
              }
            `}
            aria-label="ZIP code input"
            aria-invalid={!isValid}
            aria-describedby={!isValid ? "zip-error" : undefined}
          />
          
          {!isValid && (
            <div 
              id="zip-error" 
              className="absolute top-full left-0 mt-1 text-sm text-red-600"
              role="alert"
            >
              Please enter a valid ZIP code (e.g., 12345 or 12345-6789)
            </div>
          )}

          {/* Recent ZIP codes dropdown */}
          {showDropdown && recentZipCodes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Recent Searches
              </div>
              {recentZipCodes.map((zipCode, index) => (
                <button
                  key={`${zipCode}-${index}`}
                  type="button"
                  onClick={() => handleRecentZipClick(zipCode)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  {zipCode}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim() || !isValid}
          className={`
            px-6 py-2 text-white font-medium rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isLoading 
              ? 'bg-blue-400 cursor-wait' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }
          `}
          aria-label={isLoading ? "Loading weather data" : "Get weather"}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          ) : (
            'Get Weather'
          )}
        </button>
      </form>
    </div>
  );
};

export default ZipCodeInput;