'use client';

import React, { useState } from 'react';
import { useWeather } from '../hooks/useWeather';
import ZipCodeInput from '../components/ZipCodeInput';
import WeatherDisplay from '../components/WeatherDisplay';

/**
 * Main App Component for Super Sky Weather App
 */
export default function Home() {
  // Use our custom hook to manage weather data
  const {
    zipCode,
    data: weatherData,
    isLoading,
    error,
    recentZipCodes,
    setZipCodeAndFetch,
    setZipCodeAndFetchTriple,
    refreshData
  } = useWeather();
  
  // State to track if we're showing comparison view
  const [showComparison, setShowComparison] = useState(false);

  // Handler for ZIP code submission
  const handleZipCodeSubmit = (zipCode: string) => {
    if (showComparison) {
      setZipCodeAndFetchTriple(zipCode);
    } else {
      setZipCodeAndFetch(zipCode);
    }
  };

  // Handler for refresh button
  const handleRefresh = () => {
    if (showComparison && zipCode) {
      setZipCodeAndFetchTriple(zipCode);
    } else {
      refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Super Sky Weather
            </h1>
            <p className="text-gray-600">
              Get accurate weather information from multiple sources
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ZIP Code Input Section */}
        <div className="mb-8">
          <ZipCodeInput
            onSubmit={handleZipCodeSubmit}
            isLoading={isLoading}
            recentZipCodes={recentZipCodes}
            placeholder="Enter ZIP code (e.g., 12345)"
          />
        </div>

        {/* Controls Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Comparison Toggle */}
          <div className="flex items-center gap-3">
            <label htmlFor="comparison-toggle" className="text-sm font-medium text-gray-700">
              Comparison View
            </label>
            <button
              id="comparison-toggle"
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${showComparison ? 'bg-blue-600' : 'bg-gray-200'}
              `}
              role="switch"
              aria-checked={showComparison}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${showComparison ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Refresh Button */}
          {weatherData && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                border border-gray-300 bg-white text-gray-700
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isLoading ? 'cursor-wait' : ''}
              `}
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Weather Display Section */}
        <WeatherDisplay
          zipCode={zipCode}
          weatherData={weatherData}
          isLoading={isLoading}
          error={error}
          showComparison={showComparison}
        />

        {/* Help Text */}
        {!weatherData && !isLoading && !error && (
          <div className="mt-8 text-center">
            <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome to Super Sky Weather
              </h3>
              <p className="text-blue-700 mb-4">
                Enter a ZIP code above to get current weather conditions and forecasts.
              </p>
              <div className="text-sm text-blue-600 space-y-1">
                <p>• Toggle "Comparison View" to see data from multiple weather services</p>
                <p>• Recent searches are saved for quick access</p>
                <p>• Data is cached for faster loading</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Super Sky Weather App - Powered by multiple weather services
            </p>
            <p className="text-sm">
              Data sources: Azure Maps (AccuWeather), Foreca, Open Meteo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
