import React, { useState, memo } from 'react';
import { debounce } from '../utils/helpers';

/**
 * Validates a US ZIP code
 * @param {string} zipCode - The ZIP code to validate
 * @returns {Object} - Validation result with isValid and error properties
 */
const validateZipCode = (zipCode) => {
  if (!zipCode || zipCode.trim() === '') {
    return { isValid: false, error: 'ZIP code is required' };
  }
  
  const zipRegex = /^\d{5}$/;
  if (!zipRegex.test(zipCode)) {
    return { isValid: false, error: 'ZIP code must be 5 digits' };
  }
  
  return { isValid: true, error: null };
};

/**
 * ZipCodeInput Component - Allows users to enter a ZIP code
 * Memoized for performance
 */
const ZipCodeInput = memo(({ onSubmit, recentZipCodes = [] }) => {
  const [zipCode, setZipCode] = useState('');
  const [validation, setValidation] = useState({ isValid: true, error: null });
  const [showRecent, setShowRecent] = useState(false);
  
  // Debounced input handler for performance
  const handleChange = debounce((e) => {
    const value = e.target.value;
    setZipCode(value);
    
    // Clear validation errors when user types
    if (validation.error) {
      setValidation({ isValid: true, error: null });
    }
  }, 300);
  
  // Immediate handler for controlled component behavior
  const handleInputChange = (e) => {
    setZipCode(e.target.value);
    handleChange(e);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const result = validateZipCode(zipCode);
    setValidation(result);
    
    if (result.isValid) {
      onSubmit(zipCode);
      setShowRecent(false);
    }
  };
  
  const handleRecentZipCodeClick = (zip) => {
    onSubmit(zip);
    setZipCode(zip);
    setShowRecent(false);
  };
  
  const toggleRecentZipCodes = () => {
    setShowRecent(!showRecent);
  };
  
  return (
    <div className="card" role="region" aria-label="ZIP code input">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="zipCode" className="form-label">Enter ZIP Code</label>
          <div className="input-with-dropdown">
            <input
              id="zipCode"
              type="text"
              className="form-input"
              value={zipCode}
              onChange={handleInputChange}
              placeholder="e.g., 10001"
              maxLength={5}
              aria-required="true"
              aria-invalid={validation.error ? "true" : "false"}
              aria-describedby={validation.error ? "zipcode-error" : undefined}
            />
            {recentZipCodes.length > 0 && (
              <button
                type="button"
                className="recent-toggle"
                onClick={toggleRecentZipCodes}
                aria-label="Show recent ZIP codes"
              >
                ▼
              </button>
            )}
          </div>
          {validation.error && (
            <div className="form-error" id="zipcode-error" role="alert">{validation.error}</div>
          )}
          {showRecent && recentZipCodes.length > 0 && (
            <div className="recent-zip-codes">
              <h4>Recent ZIP Codes</h4>
              <ul>
                {recentZipCodes.map((zip, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleRecentZipCodeClick(zip)}
                    >
                      {zip}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="submit" className="btn">Get Weather</button>
      </form>
    </div>
  );
});

// Set display name for debugging
ZipCodeInput.displayName = 'ZipCodeInput';

export default ZipCodeInput;