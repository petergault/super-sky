/**
 * Configuration Module
 *
 * This module handles configuration settings for the application.
 * API keys are now managed on the server side for enhanced security.
 */

/**
 * Get an environment variable with fallback
 * This function is maintained for backward compatibility
 * but now returns empty strings for API keys since they're managed server-side
 *
 * @param {string} key - The environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} - The value
 */
function getEnvVar(key, defaultValue = '') {
  // For API keys, always return empty string as they're now managed on the server
  if (key.includes('API_KEY')) {
    console.log(`API key '${key}' is now managed on the server side.`);
    return '';
  }
  
  // For other environment variables, check localStorage
  const localStorageValue = localStorage.getItem(`ENV_${key}`);
  if (localStorageValue) return localStorageValue;
  
  return defaultValue;
}

/**
 * Set an environment variable (in localStorage for development)
 * This function is maintained for backward compatibility
 * but now logs a message for API keys since they're managed server-side
 *
 * @param {string} key - The environment variable key
 * @param {string} value - The value to set
 */
function setEnvVar(key, value) {
  // For API keys, log a message but don't actually store them
  if (key.includes('API_KEY')) {
    console.log(`API key '${key}' is now managed on the server side.`);
    return;
  }
  
  // For other environment variables, store in localStorage
  localStorage.setItem(`ENV_${key}`, value);
}

/**
 * Clear a development environment variable
 * This function is maintained for backward compatibility
 *
 * @param {string} key - The environment variable key to clear
 */
function clearEnvVar(key) {
  // For API keys, log a message
  if (key.includes('API_KEY')) {
    console.log(`API key '${key}' is now managed on the server side.`);
    return;
  }
  
  // For other environment variables, remove from localStorage
  localStorage.removeItem(`ENV_${key}`);
}

/**
 * Check if we're running in demo mode
 * @returns {boolean} - True if in demo mode
 */
function isDemoMode() {
  // Demo mode is determined by the server
  return localStorage.getItem('DEMO_MODE') === 'true';
}

/**
 * Get API configuration
 * API keys are now omitted as they're managed on the server
 * @returns {Object} - API configuration
 */
function getApiConfig() {
  return {
    azureMaps: {
      baseUrl: 'https://atlas.microsoft.com',
      endpoints: {
        search: '/search/address/json',
        dailyForecast: '/weather/forecast/daily/json'
      }
    },
    openMeteo: {
      baseUrl: 'https://api.open-meteo.com/v1',
      endpoints: {
        forecast: '/forecast'
      }
    },
    foreca: {
      baseUrl: 'https://pfa.foreca.com/api/v1',
      endpoints: {
        location: '/location/search',
        current: '/current/{locationId}',
        forecast: '/forecast/daily/{locationId}'
      }
    },
    googleWeather: {
      baseUrl: 'https://weather.googleapis.com',
      endpoints: {
        forecast: '/v1/forecast/hours:lookup'
      }
    }
  };
}

// Export the configuration functions
window.config = {
  getEnvVar,
  setEnvVar,
  clearEnvVar,
  isDemoMode,
  getApiConfig
};