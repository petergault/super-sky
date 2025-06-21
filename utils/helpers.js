/**
 * Helper Utilities
 *
 * This file contains utility functions that can be used across the application.
 *
 * Phase 4 enhancements:
 * - Added formatTimeAgo for displaying cache age
 * - Added throttle function for performance optimization
 * - Enhanced debounce implementation
 * - Added retry utility for API requests
 */

/**
 * Formats a temperature value with the appropriate unit
 * @param {number} temp - The temperature value
 * @param {string} unit - The unit to use ('F' or 'C')
 * @returns {string} - Formatted temperature string
 */
function formatTemperature(temp, unit = 'F') {
  if (typeof temp !== 'number') return 'N/A';
  return `${Math.round(temp)}°${unit}`;
}

/**
 * Formats a date object or timestamp into a human-readable string
 * @param {Date|number} date - Date object or timestamp
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
function formatDate(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Formats a time object or timestamp into a human-readable string
 * @param {Date|number} time - Date object or timestamp
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted time string
 */
function formatTime(time, options = {}) {
  const timeObj = time instanceof Date ? time : new Date(time);
  
  const defaultOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  return timeObj.toLocaleTimeString('en-US', defaultOptions);
}

/**
 * Formats a wind speed value with the appropriate unit
 * @param {number} speed - The wind speed value
 * @param {string} unit - The unit to use ('mph' or 'km/h')
 * @returns {string} - Formatted wind speed string
 */
function formatWindSpeed(speed, unit = 'mph') {
  if (typeof speed !== 'number') return 'N/A';
  return `${Math.round(speed)} ${unit}`;
}

/**
 * Formats a precipitation probability as a percentage
 * @param {number} probability - The precipitation probability (0-100)
 * @returns {string} - Formatted probability string
 */
function formatProbability(probability) {
  if (typeof probability !== 'number') return 'N/A';
  return `${Math.round(probability)}%`;
}

/**
 * Gets a description for a precipitation probability
 * @param {number} probability - The precipitation probability (0-100)
 * @returns {string} - Description of the probability
 */
function getPrecipProbabilityDescription(probability) {
  if (typeof probability !== 'number') return 'Unknown';
  
  if (probability < 15) return 'Very Low';
  if (probability < 35) return 'Low';
  if (probability < 65) return 'Medium';
  if (probability < 85) return 'High';
  return 'Very High';
}

/**
 * Formats a precipitation amount with the appropriate unit
 * @param {number} amount - The precipitation amount
 * @param {string} unit - The unit to use ('in' or 'mm')
 * @returns {string} - Formatted precipitation amount string
 */
function formatPrecipitation(amount, unit = 'mm') {
  if (typeof amount !== 'number') return 'N/A';
  
  // Apply new rounding rules:
  // - Below 0.1mm: Display as 0.0mm (no more "Trace" category)
  // - 0.1mm to 0.9mm: Keep one decimal place
  // - Above 1.0mm: Round to nearest one decimal place
  
  let formattedAmount;
  if (amount < 0.1) {
    formattedAmount = '0.0';
  } else if (amount >= 0.1 && amount < 1.0) {
    formattedAmount = amount.toFixed(1);
  } else {
    // For values >= 1.0, round to nearest one decimal place
    formattedAmount = Math.round(amount * 10) / 10;
    formattedAmount = formattedAmount.toFixed(1);
  }
  
  return formattedAmount;
}

/**
 * Applies standardized precipitation rounding rules
 * @param {number} amount - The precipitation amount in mm
 * @returns {number} - Rounded precipitation amount
 */
function roundPrecipitation(amount) {
  if (typeof amount !== 'number') return 0;
  
  // Apply new rounding rules:
  // - Below 0.1mm: Return 0.0 (no more "Trace" category)
  // - 0.1mm to 0.9mm: Keep one decimal place
  // - Above 1.0mm: Round to nearest one decimal place
  
  if (amount < 0.1) {
    return 0.0;
  } else if (amount >= 0.1 && amount < 1.0) {
    return Math.round(amount * 10) / 10;  // Keep one decimal place
  } else {
    // For values >= 1.0, round to nearest one decimal place
    return Math.round(amount * 10) / 10;
  }
}
/**
 * Gets a description for a precipitation amount
 * @param {number} amount - The precipitation amount
 * @returns {string} - Description of the amount
 */
function getPrecipAmountDescription(amount) {
  if (typeof amount !== 'number') return 'None';
  
  if (amount < 0.1) return 'None';  // Values below 0.1mm are now treated as "None"
  if (amount < 0.3) return 'Light';
  if (amount < 0.5) return 'Moderate';
  if (amount < 1.0) return 'Heavy';
  return 'Extreme';
}

/**
 * Formats a time difference as a human-readable string
 * @param {number} timeMs - Time difference in milliseconds
 * @returns {string} - Formatted time ago string
 */
function formatTimeAgo(timeMs) {
  const seconds = Math.floor(timeMs / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @param {boolean} immediate - Whether to call the function immediately
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttles a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Retries a function multiple times with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with the function result
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Validates a ZIP code
 * @param {string} zipCode - The ZIP code to validate
 * @returns {Object} - Validation result with isValid flag and error message
 */
function validateZipCode(zipCode) {
  if (!zipCode) {
    return {
      isValid: false,
      error: 'ZIP code is required'
    };
  }
  
  // Basic US ZIP code validation (5 digits)
  const zipRegex = /^\d{5}$/;
  if (!zipRegex.test(zipCode)) {
    return {
      isValid: false,
      error: 'ZIP code must be 5 digits'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
}

// Export the functions
window.helpers = {
  formatTemperature,
  formatDate,
  formatTime,
  formatTimeAgo,
  formatWindSpeed,
  formatProbability,
  getPrecipProbabilityDescription,
  formatPrecipitation,
  getPrecipAmountDescription,
  roundPrecipitation,
  debounce,
  throttle,
  retry,
  validateZipCode
};