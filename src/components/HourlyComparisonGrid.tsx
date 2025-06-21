'use client';

/**
 * HourlyComparisonGrid Component - Multi-Day Vertical Layout
 *
 * This component displays hourly precipitation forecasts from multiple weather services 
 * for ALL available days in a vertical scrolling format. Each day gets its own section with:
 * - High temperature and date header (e.g., "Wednesday, June 18          High: 68°F")
 * - Complete precipitation grid with all weather services
 * - 24-hour timeline for that specific day
 *
 * Weather Services:
 * - Azure AccuWeather API (top row)
 * - Open Meteo API (middle row) 
 * - Foreca Rapid API (bottom row)
 * - Google Weather API (when available)
 *
 * Features:
 * - Precipitation visualization with color-coded indicators
 * - Smart Display Logic for dry vs. rainy days
 * - Service indicators for each weather source
 * - Responsive design for all device sizes
 * - Borderless design with consistent spacing
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { formatTemperature } from '../utils/helpers';
import styles from './HourlyComparisonGrid.module.css';

interface WeatherService {
  source: string;
  location?: {
    city: string;
    state: string;
    zipCode: string;
  };
  current?: any;
  daily?: any[];
  hourly?: any[];
  isError?: boolean;
  rateLimited?: boolean;
  errorMessage?: string;
  temperatureUnit?: string;
}

interface HourlyComparisonGridProps {
  weatherData: WeatherService[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Multi-Day Hourly Comparison Grid component
 */
const HourlyComparisonGrid = memo<HourlyComparisonGridProps>(({ weatherData, isLoading, error }) => {
  console.log('[DEBUG] HourlyComparisonGrid component rendered with weatherData:', !!weatherData);
  
  // Process data safely - must be done before any hooks that depend on it
  const validData = weatherData && Array.isArray(weatherData) ? weatherData : [];
  
  // Log services for debugging
  validData.forEach(data => {
    console.log(`Service ${data.source} included (isError=${data.isError})`);
  });
  
  // Safely get location info - use the first non-error service for location info
  const nonErrorData = validData.filter(data => !data.isError);
  const location = nonErrorData.length > 0 ? nonErrorData[0]?.location :
                  (validData.length > 0 ? validData[0]?.location : null);
  
  // Generate an array of available days with weather data
  const availableDays = useMemo(() => {
    const result = [];
    const today = new Date();
    
    // Get the maximum number of days available from any service
    let maxDays = 7; // Default to 7 days
    validData.forEach(source => {
      if (source.daily && Array.isArray(source.daily)) {
        maxDays = Math.max(maxDays, source.daily.length);
      }
    });
    
    // Limit to 10 days maximum for performance
    maxDays = Math.min(maxDays, 10);
    
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Format the day name (e.g., "Monday")
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Format the date (e.g., "Jan 1")
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      result.push({
        dayName,
        dateStr,
        date,
        index: i
      });
    }
    
    return result;
  }, [validData]);
  
  // Get high temperature and weather info for a day from Azure Maps (first source)
  const getDayStats = useCallback((dayIndex: number) => {
    // Use the first source (Azure Maps) for these stats
    const azureData = validData.find(source => source.source === 'AzureMaps') || validData[0];
    
    if (!azureData || !azureData.daily || !Array.isArray(azureData.daily) || azureData.daily.length <= dayIndex) {
      console.log(`[DIAGNOSTIC] getDayStats for day ${dayIndex}: No Azure Maps daily data available`);
      return {
        highTemp: 'N/A',
        weatherIcon: 'unknown',
        longDescription: 'No data available'
      };
    }
    
    const dayData = azureData.daily[dayIndex];
    
    // Extract values with proper null checks
    const highTemp = dayData?.temperature?.high !== null && dayData?.temperature?.high !== undefined ?
      formatTemperature(dayData.temperature.high, azureData.temperatureUnit || 'F') :
      'N/A';
    
    const weatherIcon = dayData?.icon || 'unknown';
    const longDescription = dayData?.longDescription || dayData?.description || 'No description available';
    
    // DIAGNOSTIC LOGGING: Log extracted values for debugging
    console.log(`[DIAGNOSTIC] getDayStats for day ${dayIndex}:`, {
      hasAzureData: !!azureData,
      hasDailyData: !!(azureData?.daily),
      dailyDataLength: azureData?.daily?.length,
      dayData: dayData,
      highTemp: highTemp,
      weatherIcon: weatherIcon,
      longDescription: longDescription
    });
    
    // Extract values with proper null checks
    const extractedValues = {
      highTemp,
      weatherIcon,
      longDescription
    };
    
    console.log(`[DIAGNOSTIC] Extracted values for day ${dayIndex}:`, extractedValues);
    
    return extractedValues;
  }, [validData]);
  
  // Weather icon mapping function
  const renderWeatherIcon = useCallback((weatherIcon: string) => {
    // Comprehensive icon mapping for Azure Maps weather icons
    const iconMap: Record<string, string> = {
      // Clear/Sunny conditions
      'sunny': '☀️',
      'clear': '☀️',
      'clear-day': '☀️',
      'mostly-sunny': '🌤️',
      'partly-sunny': '⛅',
      'partly-cloudy': '⛅',
      'partly-cloudy-day': '⛅',
      
      // Cloudy conditions
      'cloudy': '☁️',
      'overcast': '☁️',
      'mostly-cloudy': '☁️',
      'mostly-cloudy-day': '☁️',
      'intermittent-clouds': '🌤️',
      'hazy-sunshine': '🌤️',
      'dreary': '☁️',
      'hazy': '🌫️',
      'fog': '🌫️',
      'windy': '💨',
      'hot': '🥵',
      'cold': '🥶',
      
      // Precipitation
      'rain': '🌧️',
      'showers': '🌦️',
      'light-rain': '🌦️',
      'heavy-rain': '🌧️',
      'drizzle': '🌦️',
      'thunderstorms': '⛈️',
      'thunderstorm': '⛈️',
      'severe-thunderstorms': '⛈️',
      'isolated-thunderstorms': '⛈️',
      'scattered-thunderstorms': '⛈️',
      
      // Mixed precipitation
      'partly-cloudy-showers': '🌦️',
      'mostly-cloudy-showers': '🌦️',
      'partly-sunny-showers': '🌦️',
      'partly-cloudy-thunderstorms': '⛈️',
      'mostly-cloudy-thunderstorms': '⛈️',
      'partly-sunny-thunderstorms': '⛈️',
      
      // Snow/Winter
      'snow': '🌨️',
      'light-snow': '🌨️',
      'heavy-snow': '❄️',
      'flurries': '🌨️',
      'blizzard': '❄️',
      'freezing-rain': '🌨️',
      'sleet': '🌨️',
      'ice': '🧊',
      'mostly-cloudy-flurries': '🌨️',
      'mostly-cloudy-snow': '🌨️',
      'partly-sunny-flurries': '🌨️',
      'rain-and-snow': '🌨️',
      
      // Night variations
      'clear-night': '🌙',
      'partly-cloudy-night': '☁️',
      'mostly-clear-night': '🌙',
      'intermittent-clouds-night': '☁️',
      'hazy-night': '🌙',
      'mostly-cloudy-night': '☁️',
      
      // Night precipitation
      'partly-cloudy-showers-night': '🌦️',
      'mostly-cloudy-showers-night': '🌦️',
      'partly-cloudy-thunderstorms-night': '⛈️',
      'mostly-cloudy-thunderstorms-night': '⛈️',
      'mostly-cloudy-flurries-night': '🌨️',
      'mostly-cloudy-snow-night': '🌨️',
      
      // Default fallback
      'unknown': '❓'
    };
    
    // DIAGNOSTIC LOGGING: Log icon mapping attempts
    const mappedIcon = iconMap[weatherIcon];
    const finalIcon = mappedIcon || iconMap['unknown'];
    
    console.log(`[DIAGNOSTIC] renderWeatherIcon:`, {
      inputIcon: weatherIcon,
      inputType: typeof weatherIcon,
      hasMapping: !!mappedIcon,
      mappedIcon: mappedIcon,
      finalIcon: finalIcon,
      availableIcons: Object.keys(iconMap)
    });
    
    // Return the mapped icon or default to unknown
    return finalIcon;
  }, []);
  
  // Get hourly data for a specific day from all sources
  const getHourlyDataForDay = useCallback((dayIndex: number) => {
    // Check if we have valid hourly data
    const hasValidHourlyData = validData.some(source =>
      source.hourly && Array.isArray(source.hourly) && source.hourly.length > 0
    );
    
    // If we don't have valid hourly data, return empty data
    if (!hasValidHourlyData) {
      console.log(`No valid hourly data available for day ${dayIndex}`);
      return validData.map(source => ({
        source: source.source,
        hours: [],
        isError: true,
        errorMessage: "No data available"
      }));
    }
    
    const result: any[] = [];
    
    // For each source
    validData.forEach(source => {
      // If source is rate limited, return empty data
      if (source.rateLimited) {
        console.log(`Source ${source.source} is rate limited, no data will be shown`);
        result.push({
          source: source.source,
          hours: [],
          rateLimited: true,
          isError: true,
          errorMessage: "Rate limit exceeded. No data available."
        });
        return;
      }
      
      // Skip if no hourly data
      if (!source.hourly || !Array.isArray(source.hourly)) {
        result.push({
          source: source.source,
          hours: []
        });
        return;
      }
      
      // Get the selected day's date at midnight
      const selectedDate = new Date(availableDays[dayIndex].date);
      selectedDate.setHours(0, 0, 0, 0);
      
      // Filter hourly data for the selected day
      const hoursForDay = source.hourly.filter(hour => {
        if (!hour || !hour.timestamp) return false;
        
        const hourDate = new Date(hour.timestamp);
        const hourDay = new Date(hourDate);
        hourDay.setHours(0, 0, 0, 0);
        
        return hourDay.getTime() === selectedDate.getTime();
      });
      
      // Special handling for Google Weather API which may not have all 24 hours
      if (source.source === 'GoogleWeather' && hoursForDay.length > 0 && hoursForDay.length < 24) {
        console.log(`Google Weather API has ${hoursForDay.length} hours for day ${dayIndex}`);
        
        // Create an array with the available hours (may not be all 24)
        const hourlyData = Array(24).fill(null);
        
        hoursForDay.forEach(hour => {
          if (!hour || !hour.timestamp) return;
          
          const hourDate = new Date(hour.timestamp);
          const hourIndex = hourDate.getHours();
          hourlyData[hourIndex] = hour;
        });
        
        // Add a note about limited data
        result.push({
          source: source.source,
          hourly: hourlyData,
          limitedData: true,
          hoursAvailable: hoursForDay.length
        });
        return;
      }
      
      // Standard handling for other sources
      // Group by hour (0-23)
      const hourlyData = Array(24).fill(null);
      
      hoursForDay.forEach(hour => {
        if (!hour || !hour.timestamp) return;
        
        const hourDate = new Date(hour.timestamp);
        const hourIndex = hourDate.getHours();
        hourlyData[hourIndex] = hour;
      });
      
      // Log for debugging
      console.log(`Source ${source.source} has ${hoursForDay.length} hours for day ${dayIndex}`);
      
      result.push({
        source: source.source,
        hourly: hourlyData
      });
      
      // Debug: Log the hourly data structure
      const validHours = hourlyData.filter(h => h !== null);
      const precipValues = validHours.map(h => h.precipitation);
      console.log(`[DEBUG] ${source.source} hourly data for day ${dayIndex}:`, {
        hasData: validHours.length > 0,
        validHourCount: validHours.length,
        sampleHour: validHours[0],
        precipitationValues: precipValues.slice(0, 10),
        hasPrecipitation: precipValues.some(p => p > 0),
        maxPrecipitation: Math.max(...precipValues.filter(p => p !== null && p !== undefined))
      });
    });
    
    return result;
  }, [validData, availableDays]);

  /**
   * Renders a service indicator based on the source name
   */
  const renderServiceIndicator = useCallback((sourceName: string) => {
    // Service name mapping
    const serviceInfo = getServiceInfo(sourceName);
    
    return (
      <div className={`${styles.serviceIndicator} ${styles[serviceInfo.colorClass]}`}
           aria-label={serviceInfo.displayName}
           title={serviceInfo.displayName}>
        {serviceInfo.letter}
      </div>
    );
  }, []);

  /**
   * Determines the CSS class for a precipitation segment based on intensity.
   */
  const getPrecipitationClass = (precipValue: number) => {
    if (precipValue > 5) return styles.precipHeavyRain;
    if (precipValue > 2) return styles.precipModerateRain;
    if (precipValue > 0.4) return styles.precipLightRain;
    if (precipValue > 0.1) return styles.precipDrizzle;
    return '';
  };

  /**
   * Renders the precipitation grid for a single day
   */
  const renderDaySection = useCallback((dayIndex: number, day: any) => {
    const hourlyData = getHourlyDataForDay(dayIndex);
    const { highTemp, weatherIcon, longDescription } = getDayStats(dayIndex);
    
    // Convert abbreviated month to full month name
    const fullDateStr = day.dateStr.replace(/(\w+) (\d+)/, (match: string, month: string, date: string) => {
      const monthMap: Record<string, string> = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
      };
      return `${monthMap[month] || month} ${date}`;
    });
    
    return (
      <div key={dayIndex} className={styles.daySection} role="region" aria-label={`Weather forecast for ${day.dayName}, ${fullDateStr}`}>
        {/* Day header with weather info: "Wednesday, June 18 [weather icon + description] High: 68°F" */}
        <div className={styles.dayHeader}>
          <h3 className={styles.dayTitle}>
            <span className={styles.dayDateSection}>{day.dayName}, {fullDateStr}</span>
            <span className={styles.dayWeatherSection}>
              <span className={styles.weatherIcon} data-icon={weatherIcon} title={longDescription}>
                {renderWeatherIcon(weatherIcon)}
              </span>
              <span className={styles.weatherDescription}>{longDescription}</span>
            </span>
            <span className={styles.dayTempSection}>High: {highTemp}</span>
          </h3>
        </div>
        
        {/* Hourly grid for this day */}
        <div className={styles.hourlyGridContainer}>
          <table className={styles.hourlyGrid}>
            {/* Time header row */}
            <thead>
              <tr className={`${styles.hourlyRow} ${styles.headerRow}`}>
                <th className={`${styles.hourlyCell} ${styles.sourceCell}`}>Source</th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className={`${styles.hourlyCell} ${styles.timeCell}`}>
                    <div style={{lineHeight: '1.1'}}>
                      {/* Hide odd-numbered hours but keep columns */}
                      {i % 2 === 0 ? (
                        <>
                          <div>{i === 0 ? '12' : i <= 12 ? i : i-12}</div>
                          <div style={{fontSize: '0.6rem'}}>{i < 12 ? 'am' : 'pm'}</div>
                        </>
                      ) : (
                        <div style={{visibility: 'hidden'}}>
                          <div>{i === 0 ? '12' : i <= 12 ? i : i-12}</div>
                          <div style={{fontSize: '0.6rem'}}>{i < 12 ? 'am' : 'pm'}</div>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Data rows for each source */}
            <tbody>
              {hourlyData.map((sourceData: any, sourceIndex: number) => (
                <tr key={sourceIndex} className={`${styles.hourlyRow} ${styles.precipitationRow}`}>
                  <th className={`${styles.hourlyCell} ${styles.sourceCell}`}>
                    <div className={styles.serviceCellContent}>
                      {renderServiceIndicator(sourceData.source)}
                      <span className={styles.serviceNameText} title={sourceData.source}>
                        {getServiceInfo(sourceData.source).displayName}
                        {sourceData.rateLimited && <small style={{color: '#e74c3c', marginLeft: '5px'}}>(Rate Limited)</small>}
                      </span>
                    </div>
                  </th>
                  {sourceData.isError || sourceData.rateLimited ? (
                    // Display error message when the service has an error or is rate limited
                    <td className={`${styles.hourlyCell} ${styles.noDataAvailable}`} colSpan={24}>
                      <div className={`${styles.noDataMessage} ${styles.errorMessage}`}>
                        {sourceData.errorMessage || "No data available"}
                      </div>
                    </td>
                  ) : sourceData.hourly && sourceData.hourly.length > 0 ? (
                    // Single cell spanning all 24 hours with precipitation bar visualization
                    <td className={`${styles.hourlyCell} ${styles.barChartCell}`} colSpan={24}>
                      <div className={styles.precipitationBarContainer}>
                        {sourceData.hourly.map((hour: any, index: number) => {
                          const precipValue = hour && hour.precipitation ? hour.precipitation.amount : null;

                          // Skip rendering if precipitation is below the threshold
                          if (precipValue === null || precipValue <= 0.1) {
                            return <div key={index} className={styles.precipSegment} style={{ flexBasis: '4.1666%' }}></div>;
                          }

                          const precipClass = getPrecipitationClass(precipValue);
                          const precipText = precipValue.toFixed(1);

                          return (
                            <div 
                              key={index} 
                              className={`${styles.precipSegment} ${precipClass}`}
                              style={{ flexBasis: '4.1666%' }}
                              title={`${precipText}mm precipitation`}
                            >
                              <div className={styles.precipBarContent}>
                                {precipText}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ) : (
                    // No data available
                    <td className={`${styles.hourlyCell} ${styles.noDataAvailable}`} colSpan={24}>
                      <div className={styles.noDataMessage}>
                        No hourly data available
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [getHourlyDataForDay, getDayStats, renderWeatherIcon, renderServiceIndicator]);

  // Early returns for loading, error, and empty states
  if (isLoading) {
    return <SkeletonLoader type="comparison" />;
  }

  if (error) {
    return (
      <div className={styles.hourlyComparisonError}>
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error Loading Comparison Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!weatherData || !Array.isArray(weatherData) || weatherData.length === 0) {
    return (
      <div className={styles.hourlyComparisonPlaceholder}>
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">No Weather Data</h3>
          <p>Enter a ZIP code and enable comparison view to see weather data from multiple sources.</p>
        </div>
      </div>
    );
  }

  if (validData.length === 0) {
    return (
      <div className={styles.hourlyComparisonError}>
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Service Error</h3>
          <p>Unable to fetch weather data from any source. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hourlyComparisonGrid}>
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Multi-Service Weather Comparison
      </h2>
      
      {/* Multi-day sections */}
      <div className={styles.daysContainer}>
        {availableDays.slice(0, 3).map((day, index) => renderDaySection(index, day))}
      </div>
    </div>
  );
});

// Set display name for debugging
HourlyComparisonGrid.displayName = 'HourlyComparisonGrid';

// Helper function to get service information
function getServiceInfo(sourceName: string) {
  const serviceMap: Record<string, { displayName: string; letter: string; colorClass: string }> = {
    'AzureMaps': {
      displayName: 'Azure Maps (AccuWeather)',
      letter: 'A',
      colorClass: 'serviceIndicatorAccuweather'
    },
    'OpenMeteo': {
      displayName: 'Open Meteo',
      letter: 'O',
      colorClass: 'serviceIndicatorOpenmeteo'
    },
    'Foreca': {
      displayName: 'Foreca',
      letter: 'F',
      colorClass: 'serviceIndicatorForeca'
    },
    'GoogleWeather': {
      displayName: 'Google Weather',
      letter: 'G',
      colorClass: 'serviceIndicatorGoogle'
    }
  };

  return serviceMap[sourceName] || {
    displayName: sourceName,
    letter: sourceName.charAt(0).toUpperCase(),
    colorClass: 'serviceIndicatorDefault'
  };
}

// Simple skeleton loader for comparison view
const SkeletonLoader: React.FC<{ type?: string }> = ({ type = "comparison" }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyComparisonGrid;