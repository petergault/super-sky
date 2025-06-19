/**
 * Service Name Mapper Utility
 * 
 * This utility provides mapping between internal API service names and display names
 * while maintaining the original API names for functionality.
 */

/**
 * Mapping of internal API service names to display names
 */
const SERVICE_DISPLAY_NAMES = {
  'azuremaps': 'AccuWeather',
  'AzureMaps': 'AccuWeather',
  'Azure Maps': 'AccuWeather',
  'openmeteo': 'NOAA',
  'OpenMeteo': 'NOAA',
  'Open Meteo': 'NOAA',
  'foreca': 'Foreca',
  'Foreca': 'Foreca',
  'googleweather': 'Google',
  'GoogleWeather': 'Google',
  'Google Weather': 'Google'
};

/**
 * Get display name for a service
 * @param {string} serviceName - The internal service name
 * @returns {string} - The display name
 */
function getServiceDisplayName(serviceName) {
  if (!serviceName) return 'Unknown';
  
  // Check for exact matches first
  if (SERVICE_DISPLAY_NAMES[serviceName]) {
    return SERVICE_DISPLAY_NAMES[serviceName];
  }
  
  // Check for partial matches (case-insensitive)
  const lowerServiceName = serviceName.toLowerCase();
  for (const [key, displayName] of Object.entries(SERVICE_DISPLAY_NAMES)) {
    if (lowerServiceName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerServiceName)) {
      return displayName;
    }
  }
  
  // Fallback to original name if no mapping found
  return serviceName;
}

/**
 * Get service indicator letter and color class
 * @param {string} serviceName - The internal service name
 * @returns {Object} - Object with letter and colorClass properties
 */
function getServiceIndicator(serviceName) {
  const displayName = getServiceDisplayName(serviceName);
  
  switch (displayName) {
    case 'AccuWeather':
      return { letter: 'A', colorClass: 'service-indicator-accuweather' };
    case 'NOAA':
      return { letter: 'N', colorClass: 'service-indicator-noaa' };
    case 'Foreca':
      return { letter: 'F', colorClass: 'service-indicator-foreca' };
    case 'Google':
      return { letter: 'G', colorClass: 'service-indicator-google' };
    default:
      return { letter: serviceName.charAt(0).toUpperCase(), colorClass: 'service-indicator-default' };
  }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
  window.serviceNameMapper = {
    getServiceDisplayName,
    getServiceIndicator,
    SERVICE_DISPLAY_NAMES
  };
}

// Also support Node.js module exports if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getServiceDisplayName,
    getServiceIndicator,
    SERVICE_DISPLAY_NAMES
  };
}