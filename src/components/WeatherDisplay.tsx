'use client';

import React from 'react';
import { WeatherData } from '../hooks/useWeather';
import ComparisonView from './ComparisonView';
import { 
  formatTemperature, 
  formatWindSpeed, 
  formatProbability, 
  formatDate, 
  formatTime, 
  formatTimeAgo,
  formatPressure,
  formatVisibility 
} from '../utils/helpers';

interface WeatherDisplayProps {
  zipCode: string;
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  showComparison?: boolean; // For comparison mode toggle
  comparisonData?: any; // For comparison mode
  isLoadingComparison?: boolean;
  comparisonError?: string | null;
}

/**
 * SkeletonLoader Component for loading states
 */
const SkeletonLoader: React.FC<{ type?: string }> = ({ type = "weather" }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};

/**
 * WeatherDisplay Component - Displays weather information for a location
 */
const WeatherDisplay: React.FC<WeatherDisplayProps> = React.memo(({ 
  zipCode, 
  weatherData, 
  isLoading, 
  error,
  showComparison = false,
  comparisonData,
  isLoadingComparison,
  comparisonError
}) => {
  if (isLoading) {
    return <SkeletonLoader type="weather" />;
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label="Weather information error">
        <div className="text-center" role="alert">
          <div className="text-red-600 text-xl font-semibold mb-2">Error</div>
          <p className="text-gray-700 mb-2">{error}</p>
          <p className="text-gray-600 text-sm">Please try again or check your internet connection.</p>
        </div>
      </div>
    );
  }
  
  if (!weatherData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label="Weather information placeholder">
        <div className="text-center text-gray-500">
          <p>Enter a ZIP code to see weather information</p>
        </div>
      </div>
    );
  }

  // Handle both single weather data and comparison data
  const isComparisonData = 'services' in weatherData;
  
  // If we're in comparison mode and have comparison data, show the comparison view
  if (showComparison && isComparisonData) {
    return (
      <ComparisonView
        weatherData={(weatherData as any).services || {}}
        isLoading={isLoading}
        error={error}
      />
    );
  }
  
  // For single view, get the current weather data
  const currentWeather = isComparisonData 
    ? (weatherData as any).services?.azure 
    : weatherData;

  if (!currentWeather) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label="Weather information error">
        <div className="text-center" role="alert">
          <div className="text-red-600 text-xl font-semibold mb-2">No Data Available</div>
          <p className="text-gray-700">Weather data is not available at this time.</p>
        </div>
      </div>
    );
  }
  
  // Display weather information with cache status
  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label={`Weather information for ${currentWeather.location.city}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Weather for {currentWeather.location.city}, {currentWeather.location.state} ({currentWeather.location.zipCode})
        </h2>
        
        <div className="space-y-6">
          {/* Current Weather Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Current Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-blue-600">
                  {formatTemperature(currentWeather.current.temperature)}
                </div>
                <div className="text-lg text-gray-600 capitalize">
                  {currentWeather.current.description}
                </div>
                <div className="text-sm text-gray-500">
                  Feels like: {formatTemperature(currentWeather.current.feelsLike)}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Humidity:</span>
                  <span className="font-medium">{currentWeather.current.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wind:</span>
                  <span className="font-medium">
                    {formatWindSpeed(currentWeather.current.windSpeed)} 
                    {currentWeather.current.windDirection ? ` (${currentWeather.current.windDirection}°)` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pressure:</span>
                  <span className="font-medium">{formatPressure(currentWeather.current.pressure)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visibility:</span>
                  <span className="font-medium">{formatVisibility(currentWeather.current.visibility)}</span>
                </div>
                {currentWeather.current.uvIndex !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">UV Index:</span>
                    <span className="font-medium">{currentWeather.current.uvIndex}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Cloud Cover:</span>
                  <span className="font-medium">{currentWeather.current.cloudCover}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Source and Cache Info */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <span className="font-medium">Data Source:</span> {currentWeather.service}
            </div>
            <div className="flex items-center gap-4">
              {currentWeather.cached && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Cached
                </span>
              )}
              <span>
                Updated: {formatTimeAgo(currentWeather.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

WeatherDisplay.displayName = 'WeatherDisplay';

export default WeatherDisplay;