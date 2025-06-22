import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useWeather } from '../hooks/useWeather';
import ZipCodeInput from './ZipCodeInput';
import WeatherDisplay from './WeatherDisplay';
import ComparisonView from './ComparisonView';

/**
 * Main App Component
 */
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
  } = useWeather();
  
  // State to track if we're showing comparison view
  const [showComparison, setShowComparison] = useState(false);
  
  // Check if we're in demo mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  useEffect(() => {
    // Check if we're in demo mode by trying to fetch a test endpoint
    fetch('/api/status')
      .then(response => response.json())
      .then(data => {
        setIsDemoMode(data.demoMode || false);
      })
      .catch(() => {
        setIsDemoMode(true);
      });
  }, []);
  
  // Memoized handler for ZIP code submission
  const handleZipCodeSubmit = useCallback((zipCode) => {
    if (showComparison) {
      setZipCodeAndFetchTriple(zipCode);
    } else {
      setZipCode(zipCode);
    }
  }, [showComparison, setZipCodeAndFetchTriple, setZipCode]);
  
  // Memoized handler for toggling comparison view
  const toggleComparisonView = useCallback(() => {
    const newShowComparison = !showComparison;
    setShowComparison(newShowComparison);
    
    // If switching to comparison view, fetch data from multiple sources
    if (newShowComparison && zipCode) {
      setZipCodeAndFetchTriple(zipCode);
    }
  }, [showComparison, zipCode, setZipCodeAndFetchTriple]);
  
  // Memoized handler for refreshing data
  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="app-container">
      <header className="header" role="banner">
        <div className="container">
          <h1>Super Sky</h1>
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
            <div className="col" style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div className="controls-row">
                <div className="view-toggle" id="view-toggle">
                  <button
                    className={`btn ${!showComparison ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={toggleComparisonView}
                    aria-pressed={showComparison ? "true" : "false"}
                  >
                    {showComparison ? 'Single Source View' : 'Comparison View'}
                  </button>
                </div>
                
                <div id="refresh-controls">
                  <div className="refresh-controls" role="region" aria-label="Data refresh controls">
                    <button
                      className="btn btn-secondary"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      aria-busy={isLoading ? "true" : "false"}
                    >
                      <span aria-hidden="true">↻</span> Refresh Data
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="zip-code-input">
                <ZipCodeInput
                  onSubmit={handleZipCodeSubmit}
                  recentZipCodes={recentZipCodes}
                />
              </div>
              
              {showComparison ? (
                <ComparisonView
                  weatherData={weatherData}
                  isLoading={isLoading}
                  error={error}
                />
              ) : (
                <WeatherDisplay
                  zipCode={zipCode}
                  weatherData={Array.isArray(weatherData) ? weatherData[0] : weatherData}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="footer" role="contentinfo">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Super Sky</p>
          <p>
            <small>
              Node.js Implementation
              <br />
              Server-side API, React with Webpack, Express
            </small>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;