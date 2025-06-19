// App.jsx
const { useState, useEffect, useCallback, useMemo, memo } = React;


// Type definitions (simulating TypeScript)
/**
 * @typedef {Object} ZipCodeValidation
 * @property {boolean} isValid - Whether the ZIP code is valid
 * @property {string|null} error - Error message if invalid
 */

/**
 * Validates a US ZIP code
 * @param {string} zipCode - The ZIP code to validate
 * @returns {ZipCodeValidation} - Validation result
 */
const validateZipCode = (zipCode) => {
  if (!zipCode || zipCode.trim() === '') {
    return { isValid: false, error: 'ZIP code is required' };
  }
  
  const zipRegex = /^\d{5}$/;
  if (!zipRegex.test(zipCode)) {
    return { isValid: false, error: 'ZIP code must be 5 digits' };
  }
  
  return { isValid: true, error: null };
};

// ZipCodeInput Component - Memoized for performance
const ZipCodeInput = memo(({ onSubmit, recentZipCodes = [] }) => {
  const [zipCode, setZipCode] = useState('');
  const [validation, setValidation] = useState({ isValid: true, error: null });
  const [showRecent, setShowRecent] = useState(false);
  
  // Simplified input handler
  const handleInputChange = (e) => {
    const value = e.target.value;
    setZipCode(value);
    
    // Clear validation errors when user types
    if (validation.error) {
      setValidation({ isValid: true, error: null });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Trim the zipCode to remove any whitespace
    const trimmedZipCode = zipCode.trim();
    
    const result = validateZipCode(trimmedZipCode);
    setValidation(result);
    
    if (result.isValid) {
      onSubmit(trimmedZipCode);
      setShowRecent(false);
    }
  };
  
  const handleRecentZipCodeClick = (zip) => {
    onSubmit(zip);
    setZipCode(zip);
    setShowRecent(false);
  };
  
  const toggleRecentZipCodes = () => {
    setShowRecent(!showRecent);
  };
  
  return (
    <div className="card" role="region" aria-label="ZIP code input">
      <form onSubmit={handleSubmit} className="header-form">
        <div className="form-group">
          <label htmlFor="zipCode" className="form-label">Enter ZIP Code</label>
          <div className="input-with-dropdown">
            <input
              id="zipCode"
              type="text"
              className="form-input"
              value={zipCode}
              onChange={handleInputChange}
              placeholder="e.g., 10001"
              maxLength={5}
              aria-required="true"
              aria-invalid={validation.error ? "true" : "false"}
              aria-describedby={validation.error ? "zipcode-error" : undefined}
            />
            {recentZipCodes.length > 0 && (
              <button
                type="button"
                className="recent-toggle"
                onClick={toggleRecentZipCodes}
                aria-label="Show recent ZIP codes"
              >
                ▼
              </button>
            )}
          </div>
          {validation.error && (
            <div className="form-error" id="zipcode-error" role="alert">{validation.error}</div>
          )}
          {showRecent && recentZipCodes.length > 0 && (
            <div className="recent-zip-codes">
              <h4>Recent ZIP Codes</h4>
              <ul>
                {recentZipCodes.map((zip, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleRecentZipCodeClick(zip)}
                    >
                      {zip}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="submit" className="btn">Get Weather</button>
      </form>
    </div>
  );
});

// Set display name for debugging
ZipCodeInput.displayName = 'ZipCodeInput';

// WeatherDisplay Component - Memoized for performance
const WeatherDisplay = memo(({ zipCode, weatherData, isLoading, error }) => {
  if (isLoading) {
    return <SkeletonLoader type="weather" />;
  }
  
  if (error) {
    return (
      <div className="weather-display card" role="region" aria-label="Weather information error">
        <div className="error" role="alert">
          <h3>Error</h3>
          <p>{error}</p>
          <p>Please try again or check your internet connection.</p>
        </div>
      </div>
    );
  }
  
  if (!weatherData) {
    return (
      <div className="weather-display card" role="region" aria-label="Weather information placeholder">
        <div className="weather-placeholder">
          <p>Enter a ZIP code to see weather information</p>
        </div>
      </div>
    );
  }
  
  // Display weather information with cache status
  return (
    <div className="weather-display card" role="region" aria-label="Weather information for ${weatherData.location.city}">
      <div>
        <h2>Weather for {weatherData.location.city}, {weatherData.location.state} ({weatherData.location.zipCode})</h2>
        
        <div className="weather-info">
          <div className="current-weather">
            <h3>Current Conditions</h3>
            <p className="temperature">
              {weatherData.hourly && weatherData.hourly[0] && weatherData.hourly[0].temperature ?
                (window.helpers && typeof window.helpers.formatTemperature === 'function'
                  ? window.helpers.formatTemperature(weatherData.hourly[0].temperature.value)
                  : `${weatherData.hourly[0].temperature.value}°F`)
                : (weatherData.current && weatherData.current.temperature ?
                    (window.helpers && typeof window.helpers.formatTemperature === 'function'
                      ? window.helpers.formatTemperature(weatherData.current.temperature)
                      : `${weatherData.current.temperature}°F`)
                    : 'N/A')}
            </p>
            <p className="description">{weatherData.current ? (weatherData.current.shortPhrase || weatherData.current.iconPhrase || 'N/A') : 'N/A'}</p>
            <p>Feels like: {weatherData.hourly && weatherData.hourly[0] && weatherData.hourly[0].realFeelTemperature ?
                (window.helpers && typeof window.helpers.formatTemperature === 'function'
                  ? window.helpers.formatTemperature(weatherData.hourly[0].realFeelTemperature.value)
                  : `${weatherData.hourly[0].realFeelTemperature.value}°F`)
                : (weatherData.current && weatherData.current.feelsLike ?
                    (window.helpers && typeof window.helpers.formatTemperature === 'function'
                      ? window.helpers.formatTemperature(weatherData.current.feelsLike)
                      : `${weatherData.current.feelsLike}°F`)
                    : 'N/A')}</p>
            <p>Humidity: {weatherData.hourly && weatherData.hourly[0] && weatherData.hourly[0].relativeHumidity ?
                `${weatherData.hourly[0].relativeHumidity}%`
                : (weatherData.current && weatherData.current.humidity ?
                    `${weatherData.current.humidity}%`
                    : 'N/A')}</p>
            <p>Wind: {weatherData.current && weatherData.current.wind && weatherData.current.wind.speed ?
                (window.helpers && typeof window.helpers.formatWindSpeed === 'function'
                  ? window.helpers.formatWindSpeed(weatherData.current.wind.speed.value)
                  : `${weatherData.current.wind.speed.value} ${weatherData.current.wind.speed.unit}`)
                : (weatherData.current && weatherData.current.windSpeed ?
                    (window.helpers && typeof window.helpers.formatWindSpeed === 'function'
                      ? window.helpers.formatWindSpeed(weatherData.current.windSpeed)
                      : `${weatherData.current.windSpeed} mph`)
                    : 'N/A')}</p>
            <p>Precipitation: {weatherData.current && weatherData.current.precipitationProbability !== undefined ?
                (window.helpers && typeof window.helpers.formatProbability === 'function'
                  ? window.helpers.formatProbability(weatherData.current.precipitationProbability)
                  : `${weatherData.current.precipitationProbability}%`)
                : (weatherData.hourly && weatherData.hourly[0] && weatherData.hourly[0].precipitationProbability !== undefined ?
                    (window.helpers && typeof window.helpers.formatProbability === 'function'
                      ? window.helpers.formatProbability(weatherData.hourly[0].precipitationProbability)
                      : `${weatherData.hourly[0].precipitationProbability}%`)
                    : 'N/A')}</p>
          </div>
          <div className="source-info">
            <p>Source: {weatherData.source}</p>
            <p>Last Updated: {
              window.helpers && typeof window.helpers.formatDate === 'function' && typeof window.helpers.formatTime === 'function'
                ? `${window.helpers.formatDate(weatherData.lastUpdated)} ${window.helpers.formatTime(weatherData.lastUpdated)}`
                : new Date(weatherData.lastUpdated).toLocaleString()
            }</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
WeatherDisplay.displayName = 'WeatherDisplay';

// RefreshButton Component
const RefreshButton = memo(({ onRefresh, isLoading }) => {
  return (
    <div className="refresh-controls" role="region" aria-label="Data refresh controls">
      <button
        className="btn btn-secondary"
        onClick={onRefresh}
        disabled={isLoading}
        aria-busy={isLoading ? "true" : "false"}
      >
        <span aria-hidden="true">↻</span> Refresh Data
      </button>
    </div>
  );
});

// Set display name for debugging
RefreshButton.displayName = 'RefreshButton';

// Main App Component
const App = () => {
  // Use our custom hook to manage weather data
  const {
    zipCode,
    data: weatherData,
    isLoading,
    error,
    recentZipCodes,
    setZipCode,
    setZipCodeAndFetchTriple,
    refreshData
  } = window.useWeather();
  
  // Always show comparison view by default (Phase 1 change)
  // No longer need state to track this as we always show comparison view
  
  // Memoized handler for ZIP code submission
  const handleZipCodeSubmit = useCallback((zipCode) => {
    // Always fetch from all three sources (Phase 1 change)
    setZipCodeAndFetchTriple(zipCode);
  }, [setZipCodeAndFetchTriple]);
  
  // Memoized handler for refreshing data
  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);
  
  // Check if we're in demo mode - now handled by the server
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  useEffect(() => {
    // Check if we're in demo mode based on server configuration
    // The server will now handle API keys, so we just check if we're in demo mode
    fetch('/api/status')
      .then(response => response.json())
      .catch(() => ({ demoMode: false }))
      .then(data => {
        const demoMode = data.demoMode || false;
        setIsDemoMode(demoMode);
        // Store demo mode status in localStorage for the config module
        localStorage.setItem('DEMO_MODE', demoMode.toString());
      });
      
    // If we have a ZIP code on first load, fetch data from all three sources (Phase 1 change)
    if (zipCode) {
      setZipCodeAndFetchTriple(zipCode);
    }
  }, [zipCode, setZipCodeAndFetchTriple]);
  
  return (
    <div className="app-container">
      <header className="header" role="banner">
        <div className="container header-container">
          <div className="header-title">
            <img src="icons/logo.png" alt="Super Sky Logo" className="header-logo" />
            <h1>Super Sky</h1>
          </div>
          
          <div id="zip-code-input" className="header-zip-input">
            <ZipCodeInput
              onSubmit={handleZipCodeSubmit}
              recentZipCodes={recentZipCodes}
            />
          </div>
          
          <div id="refresh-controls" className="header-refresh">
            <RefreshButton
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          </div>
          
          {isDemoMode && (
            <div className="demo-mode-banner" role="alert">
              <p>Running in Demo Mode - Using sample data</p>
            </div>
          )}
        </div>
      </header>
      <main className="main-content" role="main">
        <div className="container">
          <div className="row">
            <div className="col">
              
              <ComparisonView
                weatherData={weatherData}
                isLoading={isLoading}
                error={error}
              />
              
              {/* Settings and Help Container removed */}
              
            </div>
          </div>
        </div>
      </main>
      
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-logo">
            <img src="Super Sky Full Logo.png" alt="Super Sky Full Logo" className="footer-logo-image" />
          </div>
          <p><em>Dedicated to my dog Sky.</em></p>
        </div>
      </footer>
    </div>
  );
};

// Export the App component
window.App = App;