'use client';

import React, { useState, useCallback } from 'react';
import { debounce } from '../utils/helpers';

// Temporary inline function to avoid import issues
const isValidZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

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
  const [inputValue, setInputValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);

  // Debounced validation function
  const debouncedValidation = useCallback(
    debounce((value: string) => {
      if (value.trim()) {
        setIsValid(isValidZipCode(value.trim()));
      } else {
        setIsValid(true); // Empty input is considered valid
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedValidation(value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setIsValid(false);
      return;
    }
    
    if (!isValidZipCode(trimmedValue)) {
      setIsValid(false);
      return;
    }
    
    onSubmit(trimmedValue);
  };

  // Handle recent ZIP code selection
  const handleRecentSelect = (zipCode: string) => {
    setInputValue(zipCode);
    setIsValid(true);
    onSubmit(zipCode);
  };

  return (
    <div className="zip-code-input">
      <form onSubmit={handleSubmit} className="zip-form">
        <div className="input-group">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`zip-input ${!isValid ? 'invalid' : ''}`}
            disabled={isLoading}
            maxLength={10}
            pattern="[0-9]{5}(-[0-9]{4})?"
            title="Enter a valid ZIP code (e.g., 12345 or 12345-6789)"
          />
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? 'Loading...' : 'Get Weather'}
          </button>
        </div>
        
        {!isValid && (
          <div className="error-message">
            Please enter a valid ZIP code (e.g., 12345 or 12345-6789)
          </div>
        )}
      </form>

      {/* Recent ZIP codes */}
      {recentZipCodes.length > 0 && (
        <div className="recent-searches">
          <h4>Recent Searches</h4>
          <div className="recent-buttons">
            {recentZipCodes.map((zipCode) => (
              <button
                key={zipCode}
                onClick={() => handleRecentSelect(zipCode)}
                className="recent-button"
                disabled={isLoading}
              >
                {zipCode}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZipCodeInput;