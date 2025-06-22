import { useState, useEffect, useCallback, useRef } from 'react';

// Maximum number of recent ZIP codes to store
const MAX_RECENT_ZIP_CODES = 5;

// Local storage key for recent ZIP codes
const RECENT_ZIP_CODES_KEY = 'recentZipCodes';

export interface WeatherData {
  service: string;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  current: {
    temperature: number;
    feelsLike: number;
    description: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    cloudCover: number;
  };
  forecast: any[];
  hourly: any[];
  cached: boolean;
  timestamp: string;
}

/**
 * Get ZIP code from URL parameters
 * @returns {string|null} - ZIP code from URL or null if not found
 */
export function getZipCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('zip');
}

/**
 * Update URL with ZIP code parameter
 * @param {string} zipCode - ZIP code to add to URL
 */
export function updateUrlWithZipCode(zipCode: string) {
  if (!zipCode || typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.set('zip', zipCode);
  
  // Update URL without reloading the page
  window.history.pushState({}, '', url);
}

/**
 * Get recent ZIP codes from local storage
 * @returns {string[]} - Array of recent ZIP codes
 */
export function getRecentZipCodes(): string[] {
  if (typeof window === 'undefined') return [];
  
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
export function saveRecentZipCode(zipCode: string) {
  if (!zipCode || typeof window === 'undefined') return;
  
  try {
    const recent = getRecentZipCodes();
    
    // Remove if already exists
    const filtered = recent.filter(code => code !== zipCode);
    
    // Add to beginning
    const updated = [zipCode, ...filtered].slice(0, MAX_RECENT_ZIP_CODES);
    
    localStorage.setItem(RECENT_ZIP_CODES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent ZIP code to localStorage:', error);
  }
}

/**
 * Weather Hook
 * Manages weather data fetching and state
 */
export function useWeather() {
  const [zipCode, setZipCode] = useState<string>('');
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentZipCodes, setRecentZipCodes] = useState<string[]>([]);
  
  // Use ref to track the current request to avoid race conditions
  const currentRequestRef = useRef<string>('');

  // Load recent ZIP codes on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setRecentZipCodes(getRecentZipCodes());
      
      // Load ZIP code from URL
      const urlZip = getZipCodeFromUrl();
      if (urlZip) {
        setZipCode(urlZip);
        fetchWeatherData(urlZip);
      }
    }
  }, []);

  /**
   * Fetch weather data for a given ZIP code
   */
  const fetchWeatherData = useCallback(async (zip: string, service = 'azure') => {
    if (!zip.trim()) {
      setError('Please enter a ZIP code');
      return;
    }

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zip.trim())) {
      setError('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
      return;
    }

    const cleanZip = zip.trim();
    const requestId = `${cleanZip}-${service}-${Date.now()}`;
    currentRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/weather?zipCode=${encodeURIComponent(cleanZip)}&service=${service}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const weatherData = await response.json();

      // Only update state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setData(weatherData);
        setError(null);
        
        // Save to recent ZIP codes
        saveRecentZipCode(cleanZip);
        setRecentZipCodes(getRecentZipCodes());
        
        // Update URL
        updateUrlWithZipCode(cleanZip);
      }
    } catch (err: any) {
      // Only update error if this is still the current request
      if (currentRequestRef.current === requestId) {
        console.error('Error fetching weather data:', err);
        setError(err.message || 'Failed to fetch weather data');
        setData(null);
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Fetch triple weather comparison data
   */
  const fetchTripleWeatherData = useCallback(async (zip: string) => {
    if (!zip.trim()) {
      setError('Please enter a ZIP code');
      return;
    }

    const cleanZip = zip.trim();
    const requestId = `${cleanZip}-triple-${Date.now()}`;
    currentRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/weather?zipCode=${encodeURIComponent(cleanZip)}&type=comparison`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const tripleData = await response.json();

      // Only update state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setData(tripleData);
        setError(null);
        
        // Save to recent ZIP codes
        saveRecentZipCode(cleanZip);
        setRecentZipCodes(getRecentZipCodes());
        
        // Update URL
        updateUrlWithZipCode(cleanZip);
      }
    } catch (err: any) {
      // Only update error if this is still the current request
      if (currentRequestRef.current === requestId) {
        console.error('Error fetching triple weather data:', err);
        setError(err.message || 'Failed to fetch weather data');
        setData(null);
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Set ZIP code and fetch weather data
   */
  const setZipCodeAndFetch = useCallback((zip: string, service = 'azure') => {
    setZipCode(zip);
    fetchWeatherData(zip, service);
  }, [fetchWeatherData]);

  /**
   * Set ZIP code and fetch triple weather data
   */
  const setZipCodeAndFetchTriple = useCallback((zip: string) => {
    setZipCode(zip);
    fetchTripleWeatherData(zip);
  }, [fetchTripleWeatherData]);

  /**
   * Refresh current weather data
   */
  const refreshData = useCallback(() => {
    if (zipCode) {
      fetchWeatherData(zipCode);
    }
  }, [zipCode, fetchWeatherData]);

  return {
    zipCode,
    data,
    isLoading,
    error,
    recentZipCodes,
    setZipCode,
    setZipCodeAndFetch,
    setZipCodeAndFetchTriple,
    refreshData,
    fetchWeatherData,
    fetchTripleWeatherData
  };
}