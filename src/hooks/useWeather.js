import { useState, useEffect, useCallback, useRef } from 'react';

// Maximum number of recent ZIP codes to store
const MAX_RECENT_ZIP_CODES = 5;

// Local storage key for recent ZIP codes
const RECENT_ZIP_CODES_KEY = 'recentZipCodes';

/**
 * Get ZIP code from URL parameters
 * @returns {string|null} - ZIP code from URL or null if not found
 */
export function getZipCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('zip');
}

/**
 * Update URL with ZIP code parameter
 * @param {string} zipCode - ZIP code to add to URL
 */
export function updateUrlWithZipCode(zipCode) {
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
export function getRecentZipCodes() {
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
export function saveRecentZipCode(zipCode) {
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
export function useWeather(initialZipCode) {
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
      
      // Fetch data from our API - always get fresh data
      const url = `/api/weather/${zip}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const weatherData = await response.json();
      
      // Only update state if this is still the most recent fetch
      if (lastFetchTime.current === fetchStartTime) {
        // Check if there was an error in the weather data
        if (weatherData.error) {
          setError(weatherData.message || 'Failed to fetch weather data.');
        }
        
        // No longer need to update cache status
        
        setData(weatherData);
      }
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Function to fetch weather data from multiple sources with optional force refresh
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
      
      // Fetch data from our API - always get fresh data
      const url = `/api/weather/${zip}/triple`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const tripleCheckData = await response.json();
      
      // Only update state if this is still the most recent fetch
      if (lastFetchTime.current === fetchStartTime) {
        // Check if all sources returned errors
        const allErrors = tripleCheckData.data.every(data => data.isError);
        if (allErrors) {
          setError('Failed to fetch weather data from all sources. Please try again.');
        }
        
        // No longer need to update cache status
        
        setData(tripleCheckData.data);
      }
    } catch (err) {
      console.error('Error fetching super sky data:', err);
      setError('Failed to fetch weather data from multiple sources. Please try again.');
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
  const refreshData = useCallback(() => {
    if (zipCode) {
      if (Array.isArray(data)) {
        // We're in triple check mode
        fetchTripleCheck(zipCode);
      } else {
        // We're in single source mode
        fetchWeather(zipCode);
      }
    }
  }, [zipCode, data, fetchWeather, fetchTripleCheck]);
  
  // Fetch weather data when zipCode changes, but only after the first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // If we have a ZIP code on first render, fetch data
      if (zipCode) {
        fetchWeather(zipCode);
      }
    } else if (zipCode) {
      fetchWeather(zipCode);
    }
  }, [zipCode, fetchWeather]);
  
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