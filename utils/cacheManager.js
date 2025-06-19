/**
 * Cache Manager
 * 
 * This file contains utilities for managing API response caching.
 * It implements timestamp-based caching with configurable expiration.
 */

// Default cache expiration time (15 minutes in milliseconds)
const DEFAULT_CACHE_EXPIRATION = 15 * 60 * 1000;

// Aggressive cache expiration for weather data (30 minutes)
const WEATHER_CACHE_EXPIRATION = 30 * 60 * 1000;

// Cache storage key prefix
const CACHE_KEY_PREFIX = 'weather_cache_';

/**
 * Gets a cache key for a specific ZIP code and source
 * @param {string} zipCode - The ZIP code
 * @param {string} source - The data source (optional)
 * @returns {string} - Cache key
 */
function getCacheKey(zipCode, source = null) {
  return source 
    ? `${CACHE_KEY_PREFIX}${zipCode}_${source}` 
    : `${CACHE_KEY_PREFIX}${zipCode}`;
}

/**
 * Saves data to cache with timestamp
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @returns {boolean} - Success status
 */
function saveToCache(key, data) {
  try {
    const cacheEntry = {
      timestamp: Date.now(),
      data: data
    };
    
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    return true;
  } catch (error) {
    console.error('Error saving to cache:', error);
    return false;
  }
}

/**
 * Gets data from cache if it exists and is not expired
 * @param {string} key - Cache key
 * @param {number} expirationTime - Cache expiration time in milliseconds
 * @returns {Object|null} - Cached data or null if expired/not found
 */
function getFromCache(key, expirationTime = DEFAULT_CACHE_EXPIRATION) {
  try {
    const cachedData = localStorage.getItem(key);
    
    if (!cachedData) return null;
    
    const cacheEntry = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cacheEntry.timestamp > expirationTime) {
      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    }
    
    return {
      data: cacheEntry.data,
      timestamp: cacheEntry.timestamp,
      age: now - cacheEntry.timestamp
    };
  } catch (error) {
    console.error('Error retrieving from cache:', error);
    return null;
  }
}

/**
 * Invalidates (removes) a specific cache entry
 * @param {string} key - Cache key
 * @returns {boolean} - Success status
 */
function invalidateCache(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return false;
  }
}

/**
 * Invalidates all weather cache entries
 * @returns {boolean} - Success status
 */
function invalidateAllCache() {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Filter for weather cache keys
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    // Remove all cache entries
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (error) {
    console.error('Error invalidating all cache:', error);
    return false;
  }
}

/**
 * Gets cache status information
 * @returns {Object} - Cache status information
 */
function getCacheStatus() {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Filter for weather cache keys
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    // Get information about each cache entry
    const cacheEntries = cacheKeys.map(key => {
      try {
        const cachedData = localStorage.getItem(key);
        const cacheEntry = JSON.parse(cachedData);
        const now = Date.now();
        const age = now - cacheEntry.timestamp;
        const isExpired = age > DEFAULT_CACHE_EXPIRATION;
        
        return {
          key: key.replace(CACHE_KEY_PREFIX, ''),
          timestamp: cacheEntry.timestamp,
          age: age,
          isExpired: isExpired,
          expiresIn: isExpired ? 0 : DEFAULT_CACHE_EXPIRATION - age
        };
      } catch (e) {
        return {
          key: key.replace(CACHE_KEY_PREFIX, ''),
          error: 'Invalid cache entry'
        };
      }
    });
    
    return {
      totalEntries: cacheEntries.length,
      entries: cacheEntries
    };
  } catch (error) {
    console.error('Error getting cache status:', error);
    return {
      totalEntries: 0,
      entries: [],
      error: error.message
    };
  }
}

// Export the functions
window.cacheManager = {
  getCacheKey,
  saveToCache,
  getFromCache,
  invalidateCache,
  invalidateAllCache,
  getCacheStatus,
  DEFAULT_CACHE_EXPIRATION,
  WEATHER_CACHE_EXPIRATION
};