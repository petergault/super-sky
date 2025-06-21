/**
 * Utility functions for the Super Sky App
 */

/**
 * Debounces a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formats a temperature value with the appropriate unit
 * @param {number} temp - The temperature value
 * @param {string} unit - The unit to use (F or C)
 * @returns {string} - Formatted temperature string
 */
export function formatTemperature(temp: number | undefined | null, unit = 'F'): string {
  if (temp === undefined || temp === null) return 'N/A';
  
  const value = Math.round(temp);
  return `${value}°${unit}`;
}

/**
 * Formats a wind speed value with the appropriate unit
 * @param {number} speed - The wind speed value
 * @param {string} unit - The unit to use (mph or km/h)
 * @returns {string} - Formatted wind speed string
 */
export function formatWindSpeed(speed: number | undefined | null, unit = 'mph'): string {
  if (speed === undefined || speed === null) return 'N/A';
  
  const value = Math.round(speed);
  return `${value} ${unit}`;
}

/**
 * Formats a probability percentage
 * @param {number} probability - The probability value (0-100 or 0-1)
 * @returns {string} - Formatted probability string
 */
export function formatProbability(probability: number | undefined | null): string {
  if (probability === undefined || probability === null) return 'N/A';
  
  // Handle both 0-1 and 0-100 scales
  const percent = probability > 1 ? probability : probability * 100;
  return `${Math.round(percent)}%`;
}

/**
 * Formats a date to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Formats a time to a readable string
 * @param {string|Date} time - The time to format
 * @returns {string} - Formatted time string
 */
export function formatTime(time: string | Date | undefined | null): string {
  if (!time) return 'N/A';
  
  try {
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    return timeObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Formats a relative time (time ago)
 * @param {string|Date} date - The date to compare
 * @returns {string} - Formatted relative time string
 */
export function formatTimeAgo(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Validates a ZIP code format
 * @param {string} zipCode - The ZIP code to validate
 * @returns {boolean} - Whether the ZIP code is valid
 */
export function isValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
export function capitalizeWords(str: string | undefined | null): string {
  if (!str) return '';
  
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats pressure value with appropriate unit
 * @param {number} pressure - The pressure value
 * @param {string} unit - The unit to use (inHg, hPa, etc.)
 * @returns {string} - Formatted pressure string
 */
export function formatPressure(pressure: number | undefined | null, unit = 'inHg'): string {
  if (pressure === undefined || pressure === null) return 'N/A';
  
  const value = Math.round(pressure * 100) / 100; // Round to 2 decimal places
  return `${value} ${unit}`;
}

/**
 * Formats visibility value with appropriate unit
 * @param {number} visibility - The visibility value
 * @param {string} unit - The unit to use (mi, km, etc.)
 * @returns {string} - Formatted visibility string
 */
export function formatVisibility(visibility: number | undefined | null, unit = 'mi'): string {
  if (visibility === undefined || visibility === null) return 'N/A';
  
  const value = Math.round(visibility * 10) / 10; // Round to 1 decimal place
  return `${value} ${unit}`;
}