/**
 * Utility functions for the Super Sky App
 */

/**
 * Debounces a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
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
export function formatTemperature(temp, unit = 'F') {
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
export function formatWindSpeed(speed, unit = 'mph') {
  if (speed === undefined || speed === null) return 'N/A';
  
  const value = Math.round(speed);
  return `${value} ${unit}`;
}

/**
 * Formats a probability value as a percentage
 * @param {number} probability - The probability value (0-100 or 0-1)
 * @returns {string} - Formatted probability string
 */
export function formatProbability(probability) {
  if (probability === undefined || probability === null) return 'N/A';
  
  // Check if the probability is in decimal form (0-1)
  const value = probability > 1 ? Math.round(probability) : Math.round(probability * 100);
  return `${value}%`;
}

/**
 * Formats a date value
 * @param {number|string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a time value
 * @param {number|string|Date} time - The time to format
 * @returns {string} - Formatted time string
 */
export function formatTime(time) {
  if (!time) return 'N/A';
  
  const dateObj = new Date(time);
  
  if (isNaN(dateObj.getTime())) return 'Invalid Time';
  
  return dateObj.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Formats a time ago string (e.g., "5 minutes ago")
 * @param {number} milliseconds - The time difference in milliseconds
 * @returns {string} - Formatted time ago string
 */
export function formatTimeAgo(milliseconds) {
  if (!milliseconds) return 'N/A';
  
  const seconds = Math.floor(milliseconds / 1000);
  
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
 * Gets a color for precipitation probability
 * @param {number} probability - The probability value (0-100)
 * @returns {string} - CSS color value
 */
export function getPrecipitationColor(probability) {
  if (probability === undefined || probability === null) return 'transparent';
  
  // Normalize probability to 0-100 range
  const value = probability > 1 ? probability : probability * 100;
  
  if (value < 20) {
    return 'rgba(173, 216, 230, 0.2)'; // Light blue, very transparent
  } else if (value < 40) {
    return 'rgba(135, 206, 235, 0.4)'; // Sky blue, somewhat transparent
  } else if (value < 60) {
    return 'rgba(65, 105, 225, 0.6)'; // Royal blue, medium transparency
  } else if (value < 80) {
    return 'rgba(0, 0, 205, 0.8)'; // Medium blue, less transparent
  } else {
    return 'rgba(0, 0, 139, 1)'; // Dark blue, opaque
  }
}

/**
 * Gets a border style for precipitation intensity
 * @param {number} intensity - The intensity value (0-1)
 * @returns {string} - CSS border style
 */
export function getPrecipitationBorder(intensity) {
  if (intensity === undefined || intensity === null) return 'none';
  
  if (intensity < 0.1) {
    return '1px solid rgba(0, 0, 139, 0.3)';
  } else if (intensity < 0.3) {
    return '2px solid rgba(0, 0, 139, 0.5)';
  } else if (intensity < 0.5) {
    return '3px solid rgba(0, 0, 139, 0.7)';
  } else {
    return '4px solid rgba(0, 0, 139, 0.9)';
  }
}

/**
 * Gets a description for a weather code
 * @param {number} code - The weather code
 * @returns {string} - Weather description
 */
export function getWeatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return descriptions[code] || 'Unknown';
}