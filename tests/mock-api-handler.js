/**
 * Mock API Handler
 * 
 * This script intercepts API requests and returns mock responses for testing purposes.
 * It simulates the backend API endpoints without requiring an actual server.
 */

class MockApiHandler {
  constructor() {
    this.isActive = false;
    this.originalFetch = window.fetch;
    this.mockResponses = new Map();
    this.requestLog = [];
    this.cacheStore = new Map();
  }

  /**
   * Start the mock API handler
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    window.fetch = this.handleFetch.bind(this);
    this.setupDefaultMocks();
    
    console.log('Mock API Handler started');
    return true;
  }

  /**
   * Stop the mock API handler
   */
  stop() {
    if (!this.isActive) return false;
    
    window.fetch = this.originalFetch;
    this.isActive = false;
    
    console.log('Mock API Handler stopped');
    return true;
  }

  /**
   * Set up default mock responses for common API endpoints
   */
  setupDefaultMocks() {
    // Mock response for single source weather data
    this.mockResponses.set(/\/api\/weather\/(\d{5})\?source=(\w+)/, (url, match) => {
      const zipCode = match[1];
      const source = match[2];
      const cacheKey = `${zipCode}_${source}`;
      
      // Check if we should return cached data
      if (url.includes('forceRefresh=true')) {
        // Force refresh requested, don't use cache
        this.cacheStore.delete(cacheKey);
      } else if (this.cacheStore.has(cacheKey)) {
        // Return cached data with cache metadata
        const cachedData = this.cacheStore.get(cacheKey);
        return {
          ...cachedData,
          fromCache: true,
          cacheTimestamp: cachedData.lastUpdated
        };
      }
      
      // Generate fresh data
      const data = this.generateMockWeatherData(zipCode, source);
      
      // Store in cache
      this.cacheStore.set(cacheKey, data);
      
      return data;
    });

    // Mock response for super sky weather data
    this.mockResponses.set(/\/api\/weather\/(\d{5})\/triple/, (url, match) => {
      const zipCode = match[1];
      const cacheKey = `${zipCode}_triple`;
      
      // Check if we should return cached data
      if (url.includes('forceRefresh=true')) {
        // Force refresh requested, don't use cache
        this.cacheStore.delete(cacheKey);
      } else if (this.cacheStore.has(cacheKey)) {
        // Return cached data with cache metadata
        const cachedData = this.cacheStore.get(cacheKey);
        return cachedData.map(data => ({
          ...data,
          fromCache: true,
          cacheTimestamp: data.lastUpdated
        }));
      }
      
      // Generate fresh data for all three sources
      const data = [
        this.generateMockWeatherData(zipCode, 'AzureMaps'),
        this.generateMockWeatherData(zipCode, 'OpenMeteo'),
        this.generateMockWeatherData(zipCode, 'Foreca')
      ];
      
      // Store in cache
      this.cacheStore.set(cacheKey, data);
      
      return data;
    });

    // Mock response for cache clear
    this.mockResponses.set(/\/api\/weather\/cache\/clear/, () => {
      this.cacheStore.clear();
      return { success: true, message: 'Cache cleared successfully' };
    });

    // Mock response for invalid ZIP codes
    this.mockResponses.set(/\/api\/weather\/([^\d].*)\?source=(\w+)/, (url, match) => {
      return {
        error: true,
        message: `Invalid ZIP code: ${match[1]}. Must be 5 digits.`
      };
    });
  }

  /**
   * Handle fetch requests and return mock responses
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} - Promise resolving to a Response object
   */
  async handleFetch(url, options = {}) {
    if (!this.isActive) {
      return this.originalFetch(url, options);
    }

    // Log the request
    this.requestLog.push({
      url,
      options,
      timestamp: Date.now()
    });

    // Check if we have a mock response for this URL
    let responseData = null;
    let status = 200;
    let statusText = 'OK';

    for (const [pattern, handler] of this.mockResponses.entries()) {
      const match = url.match(pattern);
      if (match) {
        try {
          responseData = handler(url, match);
          break;
        } catch (error) {
          console.error('Error in mock handler:', error);
          responseData = {
            error: true,
            message: 'Mock API handler error',
            details: error.message
          };
          status = 500;
          statusText = 'Internal Server Error';
        }
      }
    }

    // If no mock response found, return a 404
    if (responseData === null) {
      responseData = {
        error: true,
        message: 'Not found'
      };
      status = 404;
      statusText = 'Not Found';
    }

    // Create a mock Response object
    return new Promise(resolve => {
      // Add a small delay to simulate network latency
      setTimeout(() => {
        const response = new Response(JSON.stringify(responseData), {
          status,
          statusText,
          headers: {
            'Content-Type': 'application/json',
            'X-Mock-API': 'true'
          }
        });
        resolve(response);
      }, 100);
    });
  }

  /**
   * Generate mock weather data
   * @param {string} zipCode - ZIP code
   * @param {string} source - Data source
   * @returns {Object} - Mock weather data
   */
  generateMockWeatherData(zipCode, source) {
    const now = Date.now();
    const cityNames = {
      '10001': 'New York',
      '90210': 'Beverly Hills',
      '60601': 'Chicago',
      '02108': 'Boston',
      '75201': 'Dallas'
    };
    
    const cityName = cityNames[zipCode] || 'Unknown City';
    
    return {
      location: {
        zipCode,
        city: cityName,
        state: 'State',
        country: 'US',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      },
      current: {
        temperature: 70 + Math.floor(Math.random() * 10),
        feelsLike: 68 + Math.floor(Math.random() * 10),
        humidity: 60 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.floor(Math.random() * 10),
        windDirection: 270,
        pressure: 1015,
        uvIndex: 5,
        visibility: 10,
        cloudCover: 50,
        description: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: {
          probability: 20,
          amount: 0
        }
      },
      hourly: Array.from({ length: 24 }, (_, i) => ({
        timestamp: now + i * 3600 * 1000,
        temperature: 65 + Math.floor(Math.random() * 15),
        feelsLike: 63 + Math.floor(Math.random() * 15),
        humidity: 60 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.floor(Math.random() * 10),
        windDirection: 270,
        description: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: {
          probability: Math.floor(Math.random() * 50),
          amount: Math.random() * 0.5
        }
      })),
      daily: Array.from({ length: 5 }, (_, i) => ({
        timestamp: now + i * 24 * 3600 * 1000,
        temperatureMin: 60 + Math.floor(Math.random() * 10),
        temperatureMax: 70 + Math.floor(Math.random() * 15),
        temperature: 65 + Math.floor(Math.random() * 15),
        feelsLike: 63 + Math.floor(Math.random() * 15),
        humidity: 60 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.floor(Math.random() * 10),
        windDirection: 270,
        description: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: {
          probability: Math.floor(Math.random() * 50),
          amount: Math.random() * 0.5
        },
        sunrise: now + (6 * 3600 * 1000),
        sunset: now + (20 * 3600 * 1000)
      })),
      source,
      lastUpdated: now
    };
  }

  /**
   * Get the request log
   * @returns {Array} - Array of logged requests
   */
  getRequestLog() {
    return this.requestLog;
  }

  /**
   * Clear the request log
   */
  clearRequestLog() {
    this.requestLog = [];
  }

  /**
   * Get the current status
   * @returns {Object} - Status object
   */
  getStatus() {
    return {
      isActive: this.isActive,
      requestCount: this.requestLog.length,
      cacheEntries: this.cacheStore.size
    };
  }
}

// Create and export the handler
window.mockApiHandler = new MockApiHandler();

// Auto-start the handler if in test mode
if (window.location.pathname.includes('/tests/')) {
  document.addEventListener('DOMContentLoaded', () => {
    window.mockApiHandler.start();
    
    // Add UI controls
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mock-api-controls';
    controlsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
    `;

    controlsContainer.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px;">Mock API Controls</h3>
      <div style="margin-bottom: 10px;">
        <span id="mock-api-status">Active</span>
        <span id="mock-api-requests">(0 requests)</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="toggle-mock-api" style="flex: 1; padding: 8px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Stop</button>
        <button id="clear-mock-cache" style="flex: 1; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Cache</button>
      </div>
    `;

    document.body.appendChild(controlsContainer);

    // Set up event listeners
    const toggleButton = document.getElementById('toggle-mock-api');
    const clearCacheButton = document.getElementById('clear-mock-cache');
    const statusSpan = document.getElementById('mock-api-status');
    const requestsSpan = document.getElementById('mock-api-requests');

    // Update status display
    function updateStatus() {
      const status = window.mockApiHandler.getStatus();
      statusSpan.textContent = status.isActive ? 'Active' : 'Inactive';
      requestsSpan.textContent = `(${status.requestCount} requests, ${status.cacheEntries} cache entries)`;
      toggleButton.textContent = status.isActive ? 'Stop' : 'Start';
      toggleButton.style.backgroundColor = status.isActive ? '#dc3545' : '#28a745';
    }

    // Toggle button
    toggleButton.addEventListener('click', () => {
      if (window.mockApiHandler.isActive) {
        window.mockApiHandler.stop();
      } else {
        window.mockApiHandler.start();
      }
      updateStatus();
    });

    // Clear cache button
    clearCacheButton.addEventListener('click', () => {
      window.mockApiHandler.cacheStore.clear();
      updateStatus();
    });

    // Update status every second
    setInterval(updateStatus, 1000);
  });
}