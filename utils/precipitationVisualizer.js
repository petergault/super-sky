/**
 * Precipitation Visualizer
 *
 * This file contains utility functions for visualizing precipitation data
 * according to the Phase 2 requirements of the Super Sky app redesign.
 */

/**
 * Determines the appropriate CSS class for precipitation visualization
 * based on amount and weather conditions
 * 
 * @param {number} precipAmount - Precipitation amount in mm
 * @param {string} weatherCondition - Weather condition (e.g., 'thunderstorm', 'sunny', 'cloudy')
 * @returns {Object} - Object containing CSS classes and display properties
 */
/**
 * Determines the appropriate CSS class and visualization properties for precipitation data
 *
 * This is a core function for the precipitation visualization feature. It analyzes
 * precipitation amount and weather conditions to determine how to visually represent
 * the data in the hourly grid.
 *
 * The function handles several cases:
 * 1. Missing precipitation data but with weather conditions
 * 2. Zero or trace precipitation amounts
 * 3. Different precipitation intensities (drizzle, light, moderate, heavy)
 * 4. Special weather conditions like thunderstorms
 *
 * @param {number} precipAmount - Precipitation amount in mm or inches
 * @param {string} weatherCondition - Weather condition (e.g., 'thunderstorm', 'sunny', 'cloudy')
 * @param {string} precipUnit - Unit of precipitation ('mm' or 'inches')
 * @returns {Object} - Object containing CSS classes and display properties
 */
function getPrecipitationVisualization(precipAmount, weatherCondition, precipUnit = 'mm') {
  // Default to no visualization
  const result = {
    className: 'precip-none',
    hasThunderstorm: false,
    showVisualization: false,
    description: 'No precipitation'
  };
  
  // HANDLING MISSING PRECIPITATION DATA:
  // If precipitation amount is null/undefined, we still want to show
  // weather conditions like thunderstorms, sunny, or cloudy
  if (precipAmount === null || precipAmount === undefined) {
    result.description = 'No data';
    result.showVisualization = false;
    
    // Check for thunderstorms even with missing precipitation data
    // This ensures thunderstorm indicators appear even when precipitation data is missing
    if (weatherCondition && weatherCondition.toLowerCase().includes('thunder')) {
      result.hasThunderstorm = true;
      result.description = 'Thunderstorms';
    }
    
    // Check for other weather conditions if no precipitation data
    // This allows showing sunny or cloudy indicators when there's no rain
    if (weatherCondition) {
      const condition = weatherCondition.toLowerCase();
      
      if (condition.includes('sunny') || condition.includes('clear') || condition.includes('partly cloudy')) {
        // Sunny/Partially Cloudy: Yellow box
        result.className = 'weather-sunny';
        result.showVisualization = true;
        result.description = 'Sunny/Partly Cloudy';
      } else if (condition.includes('cloud') && !condition.includes('partly')) {
        // Heavy Clouds: Grey box
        result.className = 'weather-cloudy';
        result.showVisualization = true;
        result.description = 'Heavy Clouds';
      }
    }
    
    return result;
  }
  
  // UNIT CONVERSION:
  // Convert to mm for consistent visualization thresholds, but keep original for display
  // This ensures consistent visualization regardless of the source unit (mm or inches)
  let amountInMm = precipAmount;
  if (precipUnit === 'inches') {
    amountInMm = precipAmount * 25.4; // 1 inch = 25.4 mm
  }
  
  // THUNDERSTORM DETECTION:
  // Check for thunderstorms in the weather condition
  // This adds special styling (yellow border) to thunderstorm hours
  if (weatherCondition && weatherCondition.toLowerCase().includes('thunder')) {
    result.hasThunderstorm = true;
    result.description = 'Thunderstorms';
  }
  
  // PRECIPITATION CLASSIFICATION SYSTEM:
  // Determine visualization based on precipitation amount
  // This classification system was carefully designed to provide meaningful
  // visual differentiation between different precipitation intensities
  //
  // - Drizzle: 0.1mm - 0.3mm - light grey
  // - Light Rain: 0.4mm to 2mm - light blue
  // - Moderate Rain: 2mm to 5mm - medium blue
  // - Heavy Rain: >5mm - purple
  if (amountInMm < 0.1) {
    // Values below 0.1mm: Display as no precipitation
    // This threshold eliminates "trace" amounts that aren't meaningful
    result.showVisualization = false;
  } else if (amountInMm >= 0.1 && amountInMm <= 0.3) {
    // Drizzle (0.1mm-0.3mm): Light grey box
    // This represents very light precipitation that's barely noticeable
    result.className = 'precip-drizzle';
    result.showVisualization = true;
    result.description = 'Drizzle';
  } else if (amountInMm > 0.3 && amountInMm <= 2) {
    // Light Rain (0.4mm-2mm): Light blue box
    // This represents light rain that doesn't require an umbrella
    result.className = 'precip-light-rain';
    result.showVisualization = true;
    result.description = 'Light Rain';
  } else if (amountInMm > 2 && amountInMm <= 5) {
    // Moderate Rain (2mm-5mm): Medium blue box
    // This represents moderate rain that would require an umbrella
    result.className = 'precip-moderate-rain';
    result.showVisualization = true;
    result.description = 'Moderate Rain';
  } else if (amountInMm > 5) {
    // Heavy Rain (>5mm): Purple box
    // This represents heavy rain that could cause flooding
    result.className = 'precip-heavy-rain';
    result.showVisualization = true;
    result.description = 'Heavy Rain';
  }
  
  // Check for other weather conditions if no precipitation visualization
  if (!result.showVisualization && weatherCondition) {
    const condition = weatherCondition.toLowerCase();
    
    if (condition.includes('sunny') || condition.includes('clear') || condition.includes('partly cloudy')) {
      // Sunny/Partially Cloudy: Yellow box
      result.className = 'weather-sunny';
      result.showVisualization = true;
      result.description = 'Sunny/Partly Cloudy';
    } else if (condition.includes('cloud') && !condition.includes('partly')) {
      // Heavy Clouds: Grey box
      result.className = 'weather-cloudy';
      result.showVisualization = true;
      result.description = 'Heavy Clouds';
    }
  }
  
  return result;
}

/**
 * PERFORMANCE OPTIMIZATION: Pre-generates and caches tooltip content for hourly data
 * 
 * This function processes an entire day's worth of hourly data and pre-generates
 * all tooltip strings, storing them in a cached format. This eliminates the need
 * to generate tooltip content on every hover event, significantly improving performance.
 *
 * @param {Array} hoursData - Array of 24 hourly weather data objects
 * @returns {Array} - Array of hourly data with cached tooltip content
 */
function preGenerateTooltipCache(hoursData) {
  if (!hoursData || !Array.isArray(hoursData)) {
    return [];
  }

  return hoursData.map((hour, hourIndex) => {
    if (!hour) {
      return {
        ...hour,
        _cachedTooltip: `${formatHourDisplay(hourIndex)}: No data available`
      };
    }

    // Generate tooltip content once and cache it
    const tooltipContent = generatePrecipitationTooltipOptimized(hour, hourIndex);
    
    return {
      ...hour,
      _cachedTooltip: tooltipContent
    };
  });
}

/**
 * OPTIMIZED: Fast tooltip content generation with minimal processing
 * 
 * This optimized version of the tooltip generator reduces string operations
 * and uses more efficient formatting techniques for better performance.
 *
 * @param {Object} hourData - Hourly weather data object
 * @param {number} hourIndex - Hour index (0-23) for display
 * @returns {string} - Optimized tooltip content
 */
function generatePrecipitationTooltipOptimized(hourData, hourIndex = null) {
  // FAST PATH: Handle missing data quickly
  if (!hourData) {
    const hourDisplay = hourIndex !== null ? formatHourDisplay(hourIndex) : '';
    return hourDisplay ? `${hourDisplay}: No data available` : 'No data available';
  }
  
  // EXTRACT DATA: Single destructuring operation for efficiency
  const { precipitation, weatherCondition, timestamp } = hourData;
  const precipAmount = precipitation?.amount;
  const precipUnit = precipitation?.unit || 'mm';
  const precipProbability = precipitation?.probability || 0;
  
  // FAST VISUALIZATION: Reuse classification logic efficiently
  const visualInfo = getPrecipitationVisualization(precipAmount, weatherCondition, precipUnit);
  
  // OPTIMIZED FORMATTING: Build tooltip parts efficiently
  const parts = [];
  
  // Add time header - ALWAYS include time for 3-row format
  if (hourIndex !== null && hourIndex !== undefined) {
    parts.push(formatHourDisplay(hourIndex));
  } else if (timestamp) {
    const date = new Date(timestamp);
    parts.push(formatHourDisplay(date.getHours()));
  } else {
    // Fallback: if no time info available, still add a time placeholder
    parts.push('Time: Unknown');
  }
  
  // Add precipitation info with optimized formatting
  if (precipAmount !== null && precipAmount !== undefined) {
    // Convert to mm for consistent display
    const displayAmount = precipUnit === 'inches' ? precipAmount * 25.4 : precipAmount;
    parts.push(`Precipitation: ${displayAmount.toFixed(1)} mm`);
  } else {
    parts.push('Precipitation: No precipitation');
  }
  
  // Add probability if meaningful
  if (precipProbability !== "n/a" && precipProbability !== 0) {
    parts.push(`Probability: ${precipProbability}%`);
  }
  
  // Add condition description
  if (visualInfo.description && visualInfo.description !== 'No precipitation') {
    parts.push(`Condition: ${visualInfo.description}`);
  }
  
  // FAST JOIN: Single join operation instead of multiple concatenations
  return parts.join('\n');
}

/**
 * LEGACY COMPATIBILITY: Original tooltip function for backward compatibility
 * 
 * This function maintains the original API while internally using the optimized version.
 * It's kept for any existing code that might still call it directly.
 *
 * @param {Object} hourData - Hourly weather data object
 * @param {number} hourIndex - Hour index (0-23) for display
 * @returns {string} - HTML content for tooltip
 */
function generatePrecipitationTooltip(hourData, hourIndex = null) {
  // Check if we have cached tooltip content
  if (hourData && hourData._cachedTooltip) {
    return hourData._cachedTooltip;
  }
  
  // Fall back to optimized generation
  return generatePrecipitationTooltipOptimized(hourData, hourIndex);
}

/**
 * Formats hour index into readable time display
 * @param {number} hourIndex - Hour index (0-23)
 * @returns {string} - Formatted time string
 */
function formatHourDisplay(hourIndex) {
  if (hourIndex === 0) return '12:00 AM';
  if (hourIndex < 12) return `${hourIndex}:00 AM`;
  if (hourIndex === 12) return '12:00 PM';
  return `${hourIndex - 12}:00 PM`;
}

/**
 * Gets the color for a specific precipitation amount
 * @param {number} precipAmount - Precipitation amount
 * @param {string} precipUnit - Precipitation unit
 * @returns {string} - Background color for the segment
 */
/**
 * Gets the background color for a specific precipitation amount
 *
 * This function determines the appropriate color to use for visualizing
 * precipitation in the hourly grid. It uses a color scale that corresponds
 * to different precipitation intensities.
 *
 * The color scale is carefully designed to provide clear visual differentiation
 * between different precipitation intensities while maintaining a cohesive
 * visual language.
 *
 * @param {number} precipAmount - Precipitation amount
 * @param {string} precipUnit - Precipitation unit ('mm' or 'inches')
 * @returns {string} - CSS color value (hex code)
 */
function getPrecipitationColor(precipAmount, precipUnit = 'mm') {
  // HANDLING MISSING DATA:
  // If precipitation amount is null/undefined, return a medium gray
  // This makes missing data visually distinct from zero precipitation
  if (precipAmount === null || precipAmount === undefined) {
    return '#b0b0b0'; // Medium gray for no data - more visible than light gray
  }
  
  // UNIT CONVERSION:
  // Convert to mm for consistent thresholds regardless of source unit
  let amountInMm = precipAmount;
  if (precipUnit === 'inches') {
    amountInMm = precipAmount * 25.4; // 1 inch = 25.4 mm
  }
  
  // TRACE PRECIPITATION HANDLING:
  // For very small amounts (below 0.1mm), return a medium gray
  // This threshold eliminates "trace" amounts that aren't meaningful
  if (amountInMm < 0.1) {
    return '#a0a0a0'; // Medium gray for no/trace precipitation
  }
  
  // COLOR SCALE:
  // Return colors based on precipitation intensity
  // This color scale provides clear visual differentiation between
  // different precipitation intensities
  if (amountInMm >= 0.1 && amountInMm <= 0.3) {
    return '#d0d0d0'; // Light grey for drizzle (0.1-0.3mm)
  } else if (amountInMm > 0.3 && amountInMm <= 2) {
    return '#5fb8e0'; // Light blue for light rain (0.4-2mm)
  } else if (amountInMm > 2 && amountInMm <= 5) {
    return '#3a6ea8'; // Medium blue for moderate rain (2-5mm)
  } else if (amountInMm > 5) {
    return '#6a006a'; // Saturated purple for heavy rain (>5mm)
  }
  
  // FALLBACK:
  // Default to medium gray if none of the above conditions match
  // This should never happen with valid data, but provides a safe fallback
  return '#a0a0a0';
}

/**
 * Renders precipitation bars for a row of hourly data
 * @param {Array} hours - Array of 24 hourly data objects
 * @returns {JSX.Element} - Rendered bar chart
 */
function renderPrecipitationBars(hours) {
  console.log('[renderPrecipitationBars] Called with hours:', hours?.length);
  
  if (!hours || !Array.isArray(hours) || hours.length !== 24) {
    console.log('[renderPrecipitationBars] Invalid hours data, returning no-data div');
    return React.createElement('div', { className: 'precipitation-bar-container' },
      React.createElement('div', { className: 'no-data' }, '—')
    );
  }

  // Check if required dependencies are available
  if (!window.React) {
    console.error('[renderPrecipitationBars] React is not available');
    return null;
  }
  
  if (!window.Tooltip) {
    console.error('[renderPrecipitationBars] Tooltip component is not available');
    return null;
  }

  console.log('[renderPrecipitationBars] Creating segments for 24 hours');
  
  // Create a flex container with 24 segments
  const hourSegments = Array.from({ length: 24 }, (_, hourIndex) => {
    const hour = hours[hourIndex];
    const precipAmount = hour?.precipitation?.amount;
    const precipUnit = hour?.precipitation?.unit || 'mm';
    const weatherCondition = hour?.weatherCondition;
    
    // Get the background color for this hour
    const backgroundColor = getPrecipitationColor(precipAmount, precipUnit);
    
    // Check if this hour has precipitation (convert to mm for threshold check)
    let amountInMm = precipAmount;
    if (precipUnit === 'inches' && precipAmount !== null && precipAmount !== undefined) {
      amountInMm = precipAmount * 25.4;
    }
    const hasPrecipitation = precipAmount !== null && precipAmount !== undefined && amountInMm >= 0.1;
    
    // Check for thunderstorms
    const hasThunderstorm = weatherCondition && weatherCondition.toLowerCase().includes('thunder');
    
    // Determine border radius based on neighboring hours
    const prevHour = hourIndex > 0 ? hours[hourIndex - 1] : null;
    const nextHour = hourIndex < 23 ? hours[hourIndex + 1] : null;
    
    // Check previous hour precipitation (with unit conversion)
    let prevHasPrecip = false;
    if (prevHour?.precipitation?.amount !== null && prevHour?.precipitation?.amount !== undefined) {
      let prevAmountInMm = prevHour.precipitation.amount;
      if (prevHour.precipitation.unit === 'inches') {
        prevAmountInMm = prevHour.precipitation.amount * 25.4;
      }
      prevHasPrecip = prevAmountInMm >= 0.1;
    }
    
    // Check next hour precipitation (with unit conversion)
    let nextHasPrecip = false;
    if (nextHour?.precipitation?.amount !== null && nextHour?.precipitation?.amount !== undefined) {
      let nextAmountInMm = nextHour.precipitation.amount;
      if (nextHour.precipitation.unit === 'inches') {
        nextAmountInMm = nextHour.precipitation.amount * 25.4;
      }
      nextHasPrecip = nextAmountInMm >= 0.1;
    }
    
    let borderRadius = {};
    if (hasPrecipitation) {
      // First precipitation hour
      if (!prevHasPrecip && nextHasPrecip) {
        borderRadius = {
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px'
        };
      }
      // Last precipitation hour
      else if (prevHasPrecip && !nextHasPrecip) {
        borderRadius = {
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px'
        };
      }
      // Isolated precipitation hour
      else if (!prevHasPrecip && !nextHasPrecip) {
        borderRadius = {
          borderRadius: '8px'
        };
      }
      // Middle precipitation hour - no border radius
    }
    
    // Generate tooltip content
    const tooltipContent = generatePrecipitationTooltip(hour, hourIndex);
    
    // Create the segment with tooltip wrapper
    return React.createElement(window.Tooltip, {
      key: `hour-segment-${hourIndex}`,
      content: tooltipContent,
      position: 'top'
    }, React.createElement('div', {
      className: 'precipitation-hour-segment',
      'data-hour': hourIndex,
      'data-precipitation': precipAmount || 0,
      'data-has-precipitation': hasPrecipitation,
      'aria-label': `Hour ${hourIndex}: ${hasPrecipitation ? `${precipAmount?.toFixed(1) || '0.0'} ${precipUnit} precipitation` : 'No precipitation'}`,
      style: {
        backgroundColor: backgroundColor,
        flex: '1',
        height: '20px',
        border: hasThunderstorm ? '2px solid #ffcc00' :
               hasPrecipitation ? '1px solid rgba(0, 0, 0, 0.3)' : 'none',
        boxSizing: 'border-box',
        boxShadow: hasPrecipitation ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
        ...borderRadius
      }
    }));
  });

  console.log('[renderPrecipitationBars] Created', hourSegments.length, 'segments');
  
  // Create the container element
  const containerElement = React.createElement('div', {
    className: 'precipitation-bar-container segmented',
    style: {
      display: 'flex',
      width: '100%',
      height: '20px',
      alignItems: 'center'
    }
  }, hourSegments);
  
  // Log diagnostic information about the created element
  console.log('[renderPrecipitationBars] Container element type:', containerElement?.type);
  console.log('[renderPrecipitationBars] Container element props:', containerElement?.props);
  console.log('[renderPrecipitationBars] Number of children:', containerElement?.props?.children?.length);
  console.log('[renderPrecipitationBars] First child element:', containerElement?.props?.children?.[0]);
  console.log('[renderPrecipitationBars] Returning React element:', !!containerElement);
  
  return containerElement;
}

// Export the functions
window.precipitationVisualizer = {
  getPrecipitationVisualization,
  generatePrecipitationTooltip, // MAINTAINED - for backward compatibility
  generatePrecipitationTooltipOptimized, // NEW - optimized version
  preGenerateTooltipCache, // NEW - cache generation function
  renderPrecipitationBars,
  formatHourDisplay,
  getPrecipitationColor
};