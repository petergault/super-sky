import React, { memo } from 'react';
import SkeletonLoader from './SkeletonLoader';
import { formatTemperature, formatWindSpeed, formatProbability, formatDate, formatTime, formatTimeAgo } from '../utils/helpers';

/**
 * WeatherDisplay Component - Displays weather information for a location
 * Memoized for performance
 */
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
    <div className="weather-display card" role="region" aria-label={`Weather information for ${weatherData.location.city}`}>
      <div>
        <h2>Weather for {weatherData.location.city}, {weatherData.location.state} ({weatherData.location.zipCode})</h2>
        
        <div className="weather-info">
          <div className="current-weather">
            <h3>Current Conditions</h3>
            <p className="temperature">
              {formatTemperature(weatherData.current.temperature)}
            </p>
            <p className="description">{weatherData.current.description}</p>
            <p>Feels like: {formatTemperature(weatherData.current.feelsLike)}</p>
            <p>Humidity: {weatherData.current.humidity}%</p>
            <p>Wind: {formatWindSpeed(weatherData.current.windSpeed)}</p>
            <p>Precipitation: {formatProbability(weatherData.current.precipitation.probability)}</p>
          </div>
          <div className="source-info">
            <p>Source: {weatherData.source}</p>
            <p>Last Updated: {formatDate(weatherData.lastUpdated)} {formatTime(weatherData.lastUpdated)}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
WeatherDisplay.displayName = 'WeatherDisplay';

export default WeatherDisplay;