/**
 * useWeather Hook
 *
 * This custom hook handles fetching and managing weather data.
 * It also manages URL parameters and local storage for recent ZIP codes.
 *
 * Phase 4 enhancements:
 * - Support for cached data with timestamp information
 * - Force refresh capability
 * - Enhanced error handling with retry status
 * - Loading state improvements
 */

// Simulate React hooks
const { useState, useEffect, useCallback, useRef } = React;

// Maximum number of recent ZIP codes to store
const MAX_RECENT_ZIP_CODES = 5;

// Local storage key for recent ZIP codes
const RECENT_ZIP_CODES_KEY = 'recentZipCodes';

/**
 * Get ZIP code from URL parameters
 * @returns {string|null} - ZIP code from URL or null if not found
 */
function getZipCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('zip');
}

/**
 * Update URL with ZIP code parameter
 * @param {string} zipCode - ZIP code to add to URL
 */
function updateUrlWithZipCode(zipCode) {
  if (!zipCode) return;
  
  const url = new URL(window.location);
  url.searchParams.set('zip', zipCode);
  
  // Update URL without reloading the page
  window.history.pushState({}, '', url);
}

/**
 * Get recent ZIP codes from local storage
 * @returns {string[]} - Array of recent ZIP codes
 */
function getRecentZipCodes() {
  try {
    const stored = localStorage.getItem(RECENT_ZIP_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading recent ZIP codes from localStorage:', error);
    return [];
  }
}

/**
 * Save a ZIP code to recent ZIP codes in local storage
 * @param {string} zipCode - ZIP code to save
 */
function saveRecentZipCode(zipCode) {
  if (!zipCode) return;
  
  try {
    // Get current list
    let recentZipCodes = getRecentZipCodes();
    
    // Remove this ZIP code if it already exists (to avoid duplicates)
    recentZipCodes = recentZipCodes.filter(zip => zip !== zipCode);
    
    // Add the new ZIP code to the beginning
    recentZipCodes.unshift(zipCode);
    
    // Limit to maximum number
    if (recentZipCodes.length > MAX_RECENT_ZIP_CODES) {
      recentZipCodes = recentZipCodes.slice(0, MAX_RECENT_ZIP_CODES);
    }
    
    // Save to localStorage
    localStorage.setItem(RECENT_ZIP_CODES_KEY, JSON.stringify(recentZipCodes));
    
    return recentZipCodes;
  } catch (error) {
    console.error('Error saving recent ZIP code to localStorage:', error);
    return [];
  }
}

/**
 * Custom hook for fetching and managing weather data
 * @param {string|null} initialZipCode - The initial ZIP code to fetch weather for
 * @returns {Object} - Weather data state and functions
 */
function useWeather(initialZipCode) {
  // Get ZIP code from URL if not provided
  const zipFromUrl = getZipCodeFromUrl();
  const [zipCode, setZipCode] = useState(initialZipCode || zipFromUrl || '');
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentZipCodes, setRecentZipCodes] = useState(getRecentZipCodes());
  const [retryCount, setRetryCount] = useState(0);
  
  // Keep track of whether this is the first render
  const isFirstRender = useRef(true);
  
  // Keep track of the last fetch time
  const lastFetchTime = useRef(null);
  
  // Function to fetch weather data with optional force refresh
  const fetchWeather = useCallback(async (zip, forceRefresh = false) => {
    if (!zip) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      
      // Update URL and recent ZIP codes
      updateUrlWithZipCode(zip);
      const updated = saveRecentZipCode(zip);
      setRecentZipCodes(updated);
      
      // Record fetch start time
      const fetchStartTime = Date.now();
      lastFetchTime.current = fetchStartTime;
      
      // Use the weatherService to fetch data with caching
      const weatherData = await window.weatherService.fetchWeatherData(zip, forceRefresh);
      
      // Only update state if this is still the most recent fetch
      if (lastFetchTime.current === fetchStartTime) {
        // Check if there was an error in the weather data
        if (weatherData.isError) {
          // Enhanced error handling for back-end API errors
          const errorMsg = weatherData.errorMessage || 'Failed to fetch weather data.';
          setError(errorMsg);
          
          // Log more detailed error information if available
          if (weatherData.errorDetails) {
            console.error('Detailed error information:', weatherData.errorDetails);
          }
        }
        
        setData(weatherData);
      }
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data from the server. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Function to fetch weather data from multiple sources with progressive loading
  const fetchTripleCheck = useCallback(async (zip, forceRefresh = false) => {
    if (!zip) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      
      // Update URL and recent ZIP codes
      updateUrlWithZipCode(zip);
      const updated = saveRecentZipCode(zip);
      setRecentZipCodes(updated);
      
      // Record fetch start time
      const fetchStartTime = Date.now();
      lastFetchTime.current = fetchStartTime;
      
      // Initialize with skeleton data for progressive loading
      const skeletonData = [
        { source: 'AzureMaps', isLoading: true, location: { zipCode: zip } },
        { source: 'OpenMeteo', isLoading: true, location: { zipCode: zip } },
        { source: 'Foreca', isLoading: true, location: { zipCode: zip } },
        { source: 'GoogleWeather', isLoading: true, location: { zipCode: zip } }
      ];
      setData(skeletonData);
      
      // Check cache first for instant display
      if (!forceRefresh && window.cacheManager) {
        const cacheKey = window.cacheManager.getCacheKey(zip, 'triple');
        const cached = window.cacheManager.getFromCache(cacheKey, window.cacheManager.WEATHER_CACHE_EXPIRATION);
        if (cached) {
          console.log('Displaying cached data immediately');
          setData(cached.data);
          setIsLoading(false);
          return;
        }
      }
      
      // Use the weatherService to fetch data from multiple sources
      const tripleCheckData = await window.weatherService.fetchTripleCheckWeather(zip, forceRefresh);
      
      // Only update state if this is still the most recent fetch
      if (lastFetchTime.current === fetchStartTime) {
        // Check if all sources returned errors
        const allErrors = tripleCheckData.every(data => data.isError);
        if (allErrors) {
          setError('Failed to fetch weather data from all sources. Please check your connection and try again.');
          
          // Log more detailed error information if available
          const errorDetails = tripleCheckData.map(data => data.errorMessage || 'Unknown error');
          console.error('All sources failed with errors:', errorDetails);
        } else {
          // Check if some sources returned errors and log them
          const partialErrors = tripleCheckData.some(data => data.isError);
          if (partialErrors) {
            const errorSources = tripleCheckData
              .filter(data => data.isError)
              .map(data => data.source);
            console.warn(`Some weather sources failed: ${errorSources.join(', ')}`);
          }
          
          setData(tripleCheckData);
        }
      }
    } catch (err) {
      console.error('Error fetching super sky weather data:', err);
      setError('Failed to fetch weather data from the server. Please check your connection and try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Function to set a new ZIP code and fetch data
  const setZipCodeAndFetch = useCallback((zip, forceRefresh = false) => {
    setZipCode(zip);
    fetchWeather(zip, forceRefresh);
  }, [fetchWeather]);
  
  // Function to set a new ZIP code and fetch triple check data
  const setZipCodeAndFetchTriple = useCallback((zip, forceRefresh = false) => {
    setZipCode(zip);
    fetchTripleCheck(zip, forceRefresh);
  }, [fetchTripleCheck]);
  
  // Function to refresh the current data
  // Phase 1 change: Always refresh from all three sources
  const refreshData = useCallback(() => {
    if (zipCode) {
      // Always use triple check mode
      fetchTripleCheck(zipCode, true); // Force refresh to get fresh data
    }
  }, [zipCode, fetchTripleCheck]);
  
  // Fetch weather data when zipCode changes, but only after the first render
  // Phase 1 change: Always fetch from all three sources by default
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // If we have a ZIP code on first render, fetch data from all three sources
      if (zipCode) {
        fetchTripleCheck(zipCode);
      }
    } else if (zipCode) {
      fetchTripleCheck(zipCode);
    }
  }, [zipCode, fetchTripleCheck]);
  
  // Return the state and functions
  return {
    zipCode,
    data,
    isLoading,
    error,
    recentZipCodes,
    retryCount,
    setZipCode: setZipCodeAndFetch,
    fetchWeather,
    fetchTripleCheck,
    setZipCodeAndFetchTriple,
    refreshData
  };
}

// Export the hook and utility functions
window.useWeather = useWeather;
window.weatherUtils = {
  getZipCodeFromUrl,
  updateUrlWithZipCode,
  getRecentZipCodes,
  saveRecentZipCode
};

// No longer need global cache clearing function