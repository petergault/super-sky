/**
 * HourlyComparisonGrid Component - Multi-Day Vertical Layout
 *
 * MAJOR ARCHITECTURAL CHANGE: Transformed from single-day view to multi-day vertical scrolling layout.
 * 
 * This component now displays hourly precipitation forecasts from multiple weather services 
 * for ALL available days in a vertical scrolling format. Each day gets its own section with:
 * - High temperature and date header (e.g., "Wednesday, June 18          High: 68°F")
 * - Complete precipitation grid with all weather services
 * - 24-hour timeline for that specific day
 *
 * Key Changes:
 * - REMOVED: Day selector buttons (no longer needed)
 * - ADDED: Multi-day vertical layout with each day as a separate section
 * - ENHANCED: Automatic grouping of hourly data by day
 * - IMPROVED: Vertical scrolling to see all forecast data at once
 * - UPDATED: Header format changed from "High: 68°F Wednesday, Jun 18" to "Wednesday, June 18          High: 68°F"
 * - ENHANCED: Hide odd-numbered hours (show only even hours: 12am, 2am, 4am, etc.)
 *
 * Weather Services:
 * - Azure AccuWeather API (top row)
 * - Open Meteo API (middle row) 
 * - Foreca Rapid API (bottom row)
 * - Google Weather API (when available)
 *
 * Features:
 * - Precipitation visualization with color-coded indicators
 * - Tooltip system for detailed precipitation information
 * - Smart Display Logic for dry vs. rainy days
 * - Service indicators for each weather source
 * - Responsive design for all device sizes
 * - Borderless design with consistent spacing
 */

// Simulate React hooks
const { useState, useCallback, useMemo, memo, useEffect } = React;

/**
 * Multi-Day Hourly Comparison Grid component
 * @param {Object} props - Component props
 * @param {Array} props.weatherData - Array of weather data from different sources
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {string} props.error - Error message if any
 * @returns {JSX.Element} - Rendered component
 */
const HourlyComparisonGrid = memo(({ weatherData, isLoading, error }) => {
  
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
  const getDayStats = useCallback((dayIndex) => {
    // Use the first source (Azure Maps) for these stats
    const azureData = validData.find(data => data.source === 'AzureMaps') || validData[0];
    
    // DIAGNOSTIC LOGGING: Log the data structure for debugging
    console.log(`[DIAGNOSTIC] getDayStats for day ${dayIndex}:`, {
      hasAzureData: !!azureData,
      azureDataSource: azureData?.source,
      hasDaily: !!azureData?.daily,
      dailyLength: azureData?.daily?.length,
      hasDayData: !!azureData?.daily?.[dayIndex],
      dayDataKeys: azureData?.daily?.[dayIndex] ? Object.keys(azureData.daily[dayIndex]) : [],
      dayDataSample: azureData?.daily?.[dayIndex]
    });
    
    if (!azureData || !azureData.daily || !azureData.daily[dayIndex]) {
      console.log(`[DIAGNOSTIC] No Azure Maps data available for day ${dayIndex}`);
      return { highTemp: 'N/A', weatherIcon: 'unknown', longDescription: 'Weather information unavailable' };
    }
    
    const dayData = azureData.daily[dayIndex];
    
    // Get high temperature
    const highTemp = dayData.temperatureMax !== undefined 
      ? window.helpers.formatTemperature(dayData.temperatureMax)
      : 'N/A';
    
    // Get weather icon from dayData.icon
    const weatherIcon = dayData.icon || 'unknown';
    
    // Get long description with fallbacks
    const longDescription = dayData.longDescription || 
                           dayData.shortDescription || 
                           dayData.description || 
                           'Weather conditions';
    
    // DIAGNOSTIC LOGGING: Log the extracted values
    console.log(`[DIAGNOSTIC] Extracted values for day ${dayIndex}:`, {
      highTemp,
      weatherIcon,
      longDescription,
      iconFromData: dayData.icon,
      longDescFromData: dayData.longDescription,
      shortDescFromData: dayData.shortDescription,
      descFromData: dayData.description
    });
    
    return { highTemp, weatherIcon, longDescription };
  }, [validData]);
  
  // Render weather icon using Unicode symbols
  const renderWeatherIcon = useCallback((weatherIcon) => {
    const iconMap = {
      // Basic day conditions
      'sunny': '☀️',
      'mostly-sunny': '🌤️',
      'partly-sunny': '⛅',
      'cloudy': '☁️',
      'rain': '🌧️',
      'thunderstorms': '⛈️',
      'snow': '🌨️',
      'fog': '🌫️',
      
      // Extended Azure Maps day conditions
      'intermittent-clouds': '☁️',
      'hazy-sunshine': '🌤️',
      'mostly-cloudy': '☁️',
      'dreary': '☁️', // Overcast/gray conditions
      
      // Rain variations
      'showers': '🌦️',
      'mostly-cloudy-showers': '🌦️',
      'partly-sunny-showers': '🌦️',
      
      // Thunderstorm variations
      'mostly-cloudy-thunderstorms': '⛈️',
      'partly-sunny-thunderstorms': '⛈️',
      
      // Snow variations
      'flurries': '🌨️',
      'mostly-cloudy-flurries': '🌨️',
      'partly-sunny-flurries': '🌨️',
      'mostly-cloudy-snow': '🌨️',
      
      // Ice and mixed precipitation
      'ice': '🧊',
      'sleet': '🌨️',
      'freezing-rain': '🌨️',
      'rain-and-snow': '🌨️',
      
      // Temperature extremes
      'hot': '🌡️',
      'cold': '❄️', // Could also use 🥶 for cold face
      
      // Wind conditions
      'windy': '💨',
      
      // Night conditions
      'clear-night': '🌙',
      'mostly-clear-night': '🌙',
      'partly-cloudy-night': '☁️', // Could also use 🌃
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
  const getHourlyDataForDay = useCallback((dayIndex) => {
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
    
    const result = [];
    
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
   * @param {string} sourceName - The name of the weather service
   * @returns {JSX.Element} - The service indicator
   */
  const renderServiceIndicator = useCallback((sourceName) => {
    // Use the service name mapper to get display name and indicator info
    const displayName = window.serviceNameMapper ?
      window.serviceNameMapper.getServiceDisplayName(sourceName) :
      sourceName;
    
    const indicatorInfo = window.serviceNameMapper ?
      window.serviceNameMapper.getServiceIndicator(sourceName) :
      { letter: sourceName.charAt(0).toUpperCase(), colorClass: 'service-indicator-default' };
    
    return (
      <div className={`service-indicator ${indicatorInfo.colorClass}`}
           aria-label={displayName}
           title={displayName}>
        {indicatorInfo.letter}
      </div>
    );
  }, []);

  /**
   * Renders the precipitation grid for a single day
   * @param {number} dayIndex - The index of the day to render
   * @param {Object} day - The day object with date information
   * @returns {JSX.Element} - The rendered day section
   */
  const renderDaySection = useCallback((dayIndex, day) => {
    const hourlyData = getHourlyDataForDay(dayIndex);
    const { highTemp, weatherIcon, longDescription } = getDayStats(dayIndex);
    
    // Convert abbreviated month to full month name
    const fullDateStr = day.dateStr.replace(/(\w+) (\d+)/, (match, month, date) => {
      const monthMap = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
      };
      return `${monthMap[month] || month} ${date}`;
    });
    
    return (
      <div key={dayIndex} className="day-section" role="region" aria-label={`Weather forecast for ${day.dayName}, ${fullDateStr}`}>
        {/* Day header with weather info: "Wednesday, June 18 [weather icon + description] High: 68°F" */}
        <div className="day-header">
          <h3 className="day-title">
            <span className="day-date-section">{day.dayName}, {fullDateStr}</span>
            <span className="day-weather-section">
              <span className="weather-icon" data-icon={weatherIcon} title={longDescription}>
                {renderWeatherIcon(weatherIcon)}
              </span>
              <span className="weather-description">{longDescription}</span>
            </span>
            <span className="day-temp-section">High: {highTemp}</span>
          </h3>
        </div>
        
        {/* Hourly grid for this day */}
        <div className="hourly-grid-container">
          <table className="hourly-grid">
            {/* Time header row */}
            <thead>
              <tr className="hourly-row header-row">
                <th className="hourly-cell source-cell">Source</th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className="hourly-cell time-cell">
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
              {hourlyData.map((sourceData, sourceIndex) => (
                <React.Fragment key={sourceIndex}>
                  {/* Combined row with service name and precipitation bars */}
                  <tr className="hourly-row data-row precipitation-row">
                    <th className="hourly-cell source-cell">
                      <div className="service-cell-content">
                        {renderServiceIndicator(sourceData.source)}
                        <span className="service-name-text" title={sourceData.source}>
                          {window.ServiceTooltip ? (
                            React.createElement(window.ServiceTooltip, {
                              serviceName: sourceData.source
                            }, 
                              window.serviceNameMapper ?
                                window.serviceNameMapper.getServiceDisplayName(sourceData.source) :
                                sourceData.source
                            )
                          ) : (
                            window.serviceNameMapper ?
                              window.serviceNameMapper.getServiceDisplayName(sourceData.source) :
                              sourceData.source
                          )}
                          {sourceData.rateLimited && <small style={{color: '#e74c3c', marginLeft: '5px'}}>(Rate Limited)</small>}
                        </span>
                      </div>
                    </th>
                    {sourceData.isError || sourceData.rateLimited ? (
                      // Display error message when the service has an error or is rate limited
                      <td className="hourly-cell data-cell no-data-available" colSpan="24">
                        <div className="no-data-message error-message">
                          {sourceData.errorMessage || "No data available"}
                        </div>
                      </td>
                    ) : sourceData.hourly && sourceData.hourly.length > 0 ? (
                      // Precipitation bar cell
                      <td className="hourly-cell data-cell bar-chart-cell" colSpan="24">
                        {(() => {
                          // Debug: Log what we're trying to render
                          const precipData = sourceData.hourly?.map(h => {
                            if (!h) return null;
                            // Handle nested precipitation object
                            if (h.precipitation && typeof h.precipitation === 'object') {
                              return h.precipitation.amount;
                            }
                            return h.precipitation;
                          }) || [];
                          console.log(`[DEBUG] Rendering precipitation for ${sourceData.source} day ${dayIndex}:`, JSON.stringify({
                            hasHourly: !!sourceData.hourly,
                            hourCount: sourceData.hourly?.length || 0,
                            precipitationArray: precipData,
                            nonNullCount: precipData.filter(p => p !== null).length,
                            hasAnyPrecip: precipData.some(p => p > 0),
                            maxPrecip: Math.max(...precipData.filter(p => p !== null && p !== undefined)),
                            hoursLength: sourceData.hourly?.length,
                            isArray: Array.isArray(sourceData.hourly),
                            firstHour: sourceData.hourly?.[0],
                            firstHourPrecip: sourceData.hourly?.[0]?.precipitation
                          }, null, 2));
                          
                          // Check if we have valid hours data
                          if (!sourceData.hourly || !Array.isArray(sourceData.hourly) || sourceData.hourly.length < 24) {
                            console.log(`[DEBUG] No valid hours data for ${sourceData.source} day ${dayIndex}`);
                            return <div className="precipitation-bar-container"><div className="no-data">—</div></div>;
                          }
                          
                          // Check if precipitationVisualizer is available
                          if (!window.precipitationVisualizer || !window.precipitationVisualizer.getPrecipitationColor) {
                            return <div className="no-data">Loading...</div>;
                          }
                          
                          // Render precipitation bars inline using JSX
                          return (
                            <div className="precipitation-bar-container segmented" style={{
                              display: 'flex',
                              width: '100%',
                              height: '20px',
                              alignItems: 'center',
                              position: 'relative',
                              minWidth: '100%'
                            }}>
                              {Array.from({ length: 24 }, (_, hourIndex) => {
                                const hour = sourceData.hourly[hourIndex];
                                
                                // Handle missing hour data
                                if (!hour) {
                                  return (
                                    <div
                                      key={`hour-segment-${hourIndex}`}
                                      className="precipitation-hour-segment no-data"
                                      data-hour={hourIndex}
                                      style={{
                                        backgroundColor: '#f0f0f0',
                                        flex: '1',
                                        height: '16px',
                                        opacity: 0.3
                                      }}
                                      aria-label={`Hour ${hourIndex}: No data available`}
                                    />
                                  );
                                }
                                
                                // Extract precipitation data with proper null checks
                                const precipAmount = hour.precipitation?.amount;
                                const precipUnit = hour.precipitation?.unit || 'mm';
                                const weatherCondition = hour.weatherCondition;
                                
                                // Convert to mm for consistent threshold checking
                                let amountInMm = precipAmount;
                                if (precipUnit === 'inches' && precipAmount !== null && precipAmount !== undefined) {
                                  amountInMm = precipAmount * 25.4;
                                }
                                const hasPrecipitation = precipAmount !== null && precipAmount !== undefined && amountInMm >= 0.1;
                                
                                // Get the background color for this hour based on precipitation amount
                                const backgroundColor = hasPrecipitation ?
                                  window.precipitationVisualizer.getPrecipitationColor(precipAmount, precipUnit) :
                                  'transparent';
                                
                                // Check for thunderstorms for special styling
                                const hasThunderstorm = weatherCondition && weatherCondition.toLowerCase().includes('thunder');
                                
                                // Determine border radius based on neighboring hours
                                const prevHour = hourIndex > 0 ? sourceData.hourly[hourIndex - 1] : null;
                                const nextHour = hourIndex < 23 ? sourceData.hourly[hourIndex + 1] : null;
                                
                                // Proper checking of previous hour precipitation with unit conversion
                                let prevHasPrecip = false;
                                if (prevHour?.precipitation?.amount !== null && prevHour?.precipitation?.amount !== undefined) {
                                  let prevAmountInMm = prevHour.precipitation.amount;
                                  if (prevHour.precipitation.unit === 'inches') {
                                    prevAmountInMm = prevHour.precipitation.amount * 25.4;
                                  }
                                  prevHasPrecip = prevAmountInMm >= 0.1;
                                }
                                
                                // Proper checking of next hour precipitation with unit conversion
                                let nextHasPrecip = false;
                                if (nextHour?.precipitation?.amount !== null && nextHour?.precipitation?.amount !== undefined) {
                                  let nextAmountInMm = nextHour.precipitation.amount;
                                  if (nextHour.precipitation.unit === 'inches') {
                                    nextAmountInMm = nextHour.precipitation.amount * 25.4;
                                  }
                                  nextHasPrecip = nextAmountInMm >= 0.1;
                                }
                                
                                // Apply border radius based on precipitation pattern
                                let borderRadius = {};
                                if (hasPrecipitation) {
                                  if (!prevHasPrecip && nextHasPrecip) {
                                    // First hour with precipitation
                                    borderRadius = {
                                      borderTopLeftRadius: '8px',
                                      borderBottomLeftRadius: '8px'
                                    };
                                  } else if (prevHasPrecip && !nextHasPrecip) {
                                    // Last hour with precipitation
                                    borderRadius = {
                                      borderTopRightRadius: '8px',
                                      borderBottomRightRadius: '8px'
                                    };
                                  } else if (!prevHasPrecip && !nextHasPrecip) {
                                    // Isolated hour with precipitation
                                    borderRadius = {
                                      borderRadius: '8px'
                                    };
                                  }
                                }
                                
                                // Generate tooltip content with detailed precipitation information
                                const tooltipContent = window.precipitationVisualizer.generatePrecipitationTooltip(hour, hourIndex);
                                
                                // Check if this hour should have a tooltip
                                const visualInfo = window.precipitationVisualizer.getPrecipitationVisualization(
                                  precipAmount, 
                                  hour?.weatherCondition || '', 
                                  precipUnit
                                );
                                const shouldShowTooltip = hasPrecipitation || visualInfo.showVisualization;
                                
                                // DEBUG: Log tooltip decision for 0.0mm cases
                                if (precipAmount === 0 || (precipAmount !== null && precipAmount !== undefined && amountInMm < 0.1)) {
                                  console.log(`DEBUG Tooltip Decision - Hour ${hourIndex}:`, {
                                    precipAmount,
                                    amountInMm,
                                    hasPrecipitation,
                                    showVisualization: visualInfo.showVisualization,
                                    shouldShowTooltip,
                                    tooltipContent: tooltipContent.substring(0, 50) + '...'
                                  });
                                }
                                
                                // Properly structured hour segment with consistent styling and conditional tooltip
                                return (
                                  <div
                                    key={`hour-segment-${hourIndex}`}
                                    className="precipitation-hour-segment"
                                    data-hour={hourIndex}
                                    data-precipitation={precipAmount || 0}
                                    data-has-precipitation={hasPrecipitation}
                                    aria-label={`Hour ${hourIndex}: ${hasPrecipitation ? `${precipAmount?.toFixed(1) || '0.0'} ${precipUnit} precipitation` : 'No precipitation'}`}
                                    {...(shouldShowTooltip ? { 'data-tooltip': tooltipContent } : {})}
                                    style={{
                                      backgroundColor: backgroundColor,
                                      flex: '1 1 auto',
                                      height: '20px',
                                      border: hasThunderstorm ? '2px solid #ffcc00' : '1px solid rgba(0, 0, 0, 0.3)',
                                      boxSizing: 'border-box',
                                      minWidth: 'calc(100% / 24)',
                                      ...borderRadius
                                    }}
                                  />
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>
                    ) : (
                      // Empty cell if no hourly data
                      <td className="hourly-cell data-cell no-data-available" colSpan="24">
                        <div className="no-data-message">No precipitation data available</div>
                      </td>
                    )}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [getHourlyDataForDay, getDayStats, renderServiceIndicator, renderWeatherIcon]);
  
  // Handle early returns after all hooks are defined
  if (isLoading) {
    return <SkeletonLoader type="hourly-grid" />;
  }
  
  if (error) {
    return (
      <div className="hourly-comparison-grid card" role="region" aria-label="Hourly weather comparison error">
        <div className="error" role="alert">
          <h3>Error</h3>
          <p>{error}</p>
          <p>Please try again or check your internet connection.</p>
        </div>
      </div>
    );
  }
  
  if (!weatherData || !Array.isArray(weatherData) || weatherData.length === 0) {
    return (
      <div className="hourly-comparison-grid card" role="region" aria-label="Hourly weather comparison placeholder">
        <div className="weather-placeholder">
          <p>Enter a ZIP code to see hourly weather comparisons</p>
        </div>
      </div>
    );
  }
  
  if (validData.length === 0) {
    return (
      <div className="hourly-comparison-grid card" role="region" aria-label="Hourly weather comparison error">
        <div className="error" role="alert">
          <h3>Error</h3>
          <p>Unable to fetch weather data from any source. Please try again.</p>
          <p>This may be due to network issues or service unavailability.</p>
        </div>
      </div>
    );
  }
  
  // Render the multi-day vertical layout
  return (
    <div className="hourly-comparison-grid card multi-day-layout" role="region" aria-label="Multi-day hourly weather comparison">
      {/* Header row with location and legend */}
      <div className="header-row-container">
        <h2 className="location-header">
          {(() => {
            console.log('DEBUG: Location object:', location);
            console.log('DEBUG: Location city:', location?.city);
            console.log('DEBUG: Location state:', location?.state);
            console.log('DEBUG: Location zipCode:', location?.zipCode);
            console.log('DEBUG: Valid data length:', validData.length);
            console.log('DEBUG: Non-error data length:', nonErrorData.length);
            if (nonErrorData.length > 0) {
              console.log('DEBUG: First non-error data location:', nonErrorData[0]?.location);
            }
            if (validData.length > 0) {
              console.log('DEBUG: First valid data location:', validData[0]?.location);
            }
            
            if (location?.city && location?.state && location?.zipCode) {
              return `${location.city}, ${location.state} (${location.zipCode})`;
            } else if (location?.city && location?.state) {
              return `${location.city}, ${location.state}`;
            } else if (location?.city) {
              return location.city;
            } else {
              return 'Location not available';
            }
          })()}
        </h2>
        
        {/* Precipitation Legend */}
        <div className="header-precipitation-legend">
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color precip-drizzle"></div>
              <span>Drizzle (0.1-0.3mm)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color precip-light-rain"></div>
              <span>Light Rain (0.4-2mm)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color precip-moderate-rain"></div>
              <span>Moderate Rain (2-5mm)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color precip-heavy-rain"></div>
              <span>Heavy Rain ({'>'}5mm)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render each day as a separate section */}
      <div className="days-container">
        {availableDays.map((day, index) => renderDaySection(index, day))}
      </div>
    </div>
  );
});

/**
 * Renders the precipitation visualization for an hour
 *
 * This function creates a visualization element for a single hour's precipitation data.
 * It handles different cases:
 * - No data available
 * - Zero precipitation
 * - Various precipitation amounts with appropriate styling
 *
 * The visualization includes:
 * - Color-coded background based on precipitation amount
 * - Special styling for thunderstorms
 * - Detailed tooltip on hover
 *
 * @param {Object} hour - Hour data object containing precipitation and weather condition
 * @returns {JSX.Element} - Rendered visualization component with tooltip
 */
function renderPrecipitationVisualization(hour) {
  // Handle case where hour data or precipitation data is missing
  if (!hour || !hour.precipitation) {
    return (
      <div className="no-precip-data">—</div>
    );
  }
  
  // Extract precipitation data with proper null checks
  const precipAmount = hour.precipitation.amount;
  const precipUnit = hour.precipitation.unit || 'mm';
  
  // Handle case where precipitation amount is null/undefined
  if (precipAmount === null || precipAmount === undefined) {
    return (
      <div className="no-precip-data">—</div>
    );
  }
  
  // Get weather condition if available
  const weatherCondition = hour.weatherCondition || '';
  
  // Get visualization info based on precipitation amount and weather condition
  const visualInfo = window.precipitationVisualizer.getPrecipitationVisualization(
    precipAmount,
    weatherCondition,
    precipUnit
  );
  
  // For zero precipitation or no visualization, show completely blank cell WITHOUT tooltip
  if (!visualInfo.showVisualization) {
    return (
      <div className="precip-blank-cell">
        {/* Completely blank - no text, no tooltip */}
      </div>
    );
  }
  
  // Generate tooltip content only for cells that will show visualization
  const tooltipContent = window.precipitationVisualizer.generatePrecipitationTooltip(hour);
  
  
  
  // Render color-only visualization with tooltip - NO text display
  return (
    <window.Tooltip content={tooltipContent} position="top">
      <div
        className={`precip-visualization ${visualInfo.className} ${visualInfo.hasThunderstorm ? 'has-thunderstorm' : ''}`}
      >
        {/* No text content - only color background and optional thunderstorm border */}
      </div>
    </window.Tooltip>
  );
}

// Set display name for debugging
HourlyComparisonGrid.displayName = 'HourlyComparisonGrid';

// Export the component
window.HourlyComparisonGrid = HourlyComparisonGrid;