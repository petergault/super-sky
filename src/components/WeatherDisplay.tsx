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
  formatTimeAgo
  // formatPressure,
  // formatVisibility 
} from '../utils/helpers';

// Temporary inline functions to avoid import issues
const formatPressure = (pressure: number | undefined | null, unit = 'inHg'): string => {
  if (pressure === undefined || pressure === null) return 'N/A';
  const value = Math.round(pressure * 100) / 100;
  return `${value} ${unit}`;
};

const formatVisibility = (visibility: number | undefined | null, unit = 'mi'): string => {
  if (visibility === undefined || visibility === null) return 'N/A';
  const value = Math.round(visibility * 10) / 10;
  return `${value} ${unit}`;
};

interface WeatherDisplayProps {
  zipCode: string;
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  onZipCodeChange?: (zipCode: string) => void;
  onRefresh?: () => void;
  showComparison?: boolean;
  onComparisonToggle?: () => void;
  comparisonData?: any;
  isLoadingComparison?: boolean;
  comparisonError?: string | null;
}

/**
 * WeatherDisplay Component
 * Displays weather information and handles comparison view
 */
const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  weatherData,
  isLoading,
  error,
  onRefresh,
  showComparison = false,
  onComparisonToggle,
  // Destructure but don't use these props to avoid unused variable errors
  zipCode,
  onZipCodeChange,
  comparisonData,
  isLoadingComparison,
  comparisonError,
}) => {
  // Early returns for loading and error states
  if (isLoading) {
    return (
      <div className="weather-loading">
        <div className="loading-spinner"></div>
        <p>Loading weather data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-error">
        <h3>Error</h3>
        <p>{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="retry-button">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="weather-empty">
        <p>Enter a ZIP code to get weather information</p>
      </div>
    );
  }

  // Handle different data structures (single vs comparison)
  const isComparison = Array.isArray(weatherData) || (weatherData && typeof weatherData === 'object' && 'services' in weatherData);

  if (isComparison) {
    return (
      <ComparisonView 
        data={weatherData as any}
        onToggleView={onComparisonToggle}
        showComparison={showComparison}
      />
    );
  }

  // Single service weather display
  const { service, location, current, forecast, hourly, cached, timestamp } = weatherData;

  return (
    <div className="weather-display">
      {/* Header with location and service info */}
      <div className="weather-header">
        <h2>{location.city}, {location.state}</h2>
        <div className="weather-meta">
          <span className="weather-service">via {service}</span>
          {cached && <span className="weather-cached">cached</span>}
          <span className="weather-timestamp">{formatTimeAgo(timestamp)}</span>
        </div>
      </div>

      {/* Current conditions */}
      <div className="weather-current">
        <div className="weather-main">
          <span className="weather-temp">{formatTemperature(current.temperature)}</span>
          <span className="weather-feels-like">
            Feels like {formatTemperature(current.feelsLike)}
          </span>
        </div>
        
        <div className="weather-description">
          <p>{current.description}</p>
        </div>

        <div className="weather-details">
          <div className="weather-detail">
            <span className="label">Humidity</span>
            <span className="value">{current.humidity}%</span>
          </div>
          
          <div className="weather-detail">
            <span className="label">Wind</span>
            <span className="value">{formatWindSpeed(current.windSpeed)} {current.windDirection}°</span>
          </div>
          
          <div className="weather-detail">
            <span className="label">Pressure</span>
            <span className="value">{formatPressure(current.pressure)}</span>
          </div>
          
          <div className="weather-detail">
            <span className="label">Visibility</span>
            <span className="value">{formatVisibility(current.visibility)}</span>
          </div>
          
          <div className="weather-detail">
            <span className="label">UV Index</span>
            <span className="value">{current.uvIndex}</span>
          </div>
          
          <div className="weather-detail">
            <span className="label">Cloud Cover</span>
            <span className="value">{current.cloudCover}%</span>
          </div>
        </div>
      </div>

      {/* Toggle comparison button */}
      {onComparisonToggle && (
        <div className="weather-actions">
          <button 
            onClick={onComparisonToggle}
            className="comparison-toggle"
          >
            {showComparison ? 'Hide Comparison' : 'Show Comparison'}
          </button>
        </div>
      )}

      {/* Forecast and hourly data would go here */}
      {forecast && forecast.length > 0 && (
        <div className="weather-forecast">
          <h3>Forecast</h3>
          {/* Forecast implementation */}
        </div>
      )}

      {hourly && hourly.length > 0 && (
        <div className="weather-hourly">
          <h3>Hourly</h3>
          {/* Hourly implementation */}
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;