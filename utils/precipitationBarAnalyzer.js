/**
 * Precipitation Bar Analyzer
 *
 * This utility analyzes hourly precipitation data to create connected bar chart segments.
 * It groups consecutive hours with precipitation into continuous bars and identifies
 * isolated single-hour precipitation events.
 */

/**
 * Analyzes precipitation data for a row and creates bar segments
 * @param {Array} hours - Array of 24 hourly data objects
 * @returns {Array} - Array of bar segments with start, end, and precipitation info
 */
function analyzePrecipitationBars(hours) {
  if (!hours || !Array.isArray(hours) || hours.length !== 24) {
    return [];
  }

  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < 24; i++) {
    const hour = hours[i];
    const hasPrecipitation = hour && 
                           hour.precipitation && 
                           hour.precipitation.amount !== null && 
                           hour.precipitation.amount !== undefined &&
                           hour.precipitation.amount >= 0.1; // Use same threshold as visualizer

    if (hasPrecipitation) {
      if (currentSegment === null) {
        // Start new segment
        currentSegment = {
          startHour: i,
          endHour: i,
          hours: [hour],
          maxIntensity: hour.precipitation.amount,
          avgIntensity: hour.precipitation.amount,
          visualClass: getSegmentVisualClass(hour.precipitation.amount, hour.precipitation.unit),
          hasThunderstorm: hour.weatherCondition && hour.weatherCondition.toLowerCase().includes('thunder')
        };
      } else {
        // Extend current segment
        currentSegment.endHour = i;
        currentSegment.hours.push(hour);
        
        // Update intensity metrics
        const amount = convertToMm(hour.precipitation.amount, hour.precipitation.unit);
        const maxAmount = convertToMm(currentSegment.maxIntensity, currentSegment.hours[0].precipitation.unit);
        
        if (amount > maxAmount) {
          currentSegment.maxIntensity = hour.precipitation.amount;
          currentSegment.visualClass = getSegmentVisualClass(hour.precipitation.amount, hour.precipitation.unit);
        }
        
        // Update average intensity
        const totalAmount = currentSegment.hours.reduce((sum, h) => {
          return sum + convertToMm(h.precipitation.amount, h.precipitation.unit);
        }, 0);
        currentSegment.avgIntensity = totalAmount / currentSegment.hours.length;
        
        // Check for thunderstorms in any hour of the segment
        if (hour.weatherCondition && hour.weatherCondition.toLowerCase().includes('thunder')) {
          currentSegment.hasThunderstorm = true;
        }
      }
    } else {
      if (currentSegment !== null) {
        // End current segment
        segments.push(currentSegment);
        currentSegment = null;
      }
    }
  }

  // Don't forget the last segment if it extends to the end
  if (currentSegment !== null) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Converts precipitation amount to mm for consistent comparison
 * @param {number} amount - Precipitation amount
 * @param {string} unit - Unit (mm or inches)
 * @returns {number} - Amount in mm
 */
function convertToMm(amount, unit) {
  if (unit === 'inches') {
    return amount * 25.4;
  }
  return amount;
}

/**
 * Gets the visual class for a precipitation segment based on intensity
 * @param {number} amount - Precipitation amount
 * @param {string} unit - Unit (mm or inches)
 * @returns {string} - CSS class name
 */
function getSegmentVisualClass(amount, unit = 'mm') {
  const amountInMm = convertToMm(amount, unit);
  
  if (amountInMm >= 0.1 && amountInMm <= 0.2) {
    return 'precip-drizzle';
  } else if (amountInMm > 0.2 && amountInMm <= 2) {
    return 'precip-light-rain';
  } else if (amountInMm > 2 && amountInMm <= 5) {
    return 'precip-moderate-rain';
  } else if (amountInMm > 5) {
    return 'precip-heavy-rain';
  }
  
  return 'precip-none';
}

/**
 * Determines the border radius classes for a segment
 * @param {Object} segment - Precipitation segment
 * @returns {Object} - Object with border radius classes
 */
function getSegmentBorderRadius(segment) {
  const isIsolated = segment.startHour === segment.endHour;
  
  return {
    isIsolated,
    startRounded: true, // Always round the start
    endRounded: true,   // Always round the end
    className: isIsolated ? 'bar-isolated' : 'bar-connected'
  };
}

/**
 * Creates bar chart data structure for rendering
 * @param {Array} segments - Precipitation segments
 * @returns {Array} - Array of bar elements for rendering
 */
function createBarChartData(segments) {
  const bars = [];
  
  segments.forEach(segment => {
    const borderInfo = getSegmentBorderRadius(segment);
    
    bars.push({
      startHour: segment.startHour,
      endHour: segment.endHour,
      width: segment.endHour - segment.startHour + 1, // Number of hours spanned
      visualClass: segment.visualClass,
      hasThunderstorm: segment.hasThunderstorm,
      borderRadius: borderInfo,
      hours: segment.hours,
      maxIntensity: segment.maxIntensity,
      avgIntensity: segment.avgIntensity
    });
  });
  
  return bars;
}

/**
 * Main function to process hourly data into bar chart format
 * @param {Array} hours - Array of 24 hourly data objects
 * @returns {Object} - Object containing bars and metadata
 */
function processHourlyDataForBars(hours) {
  const segments = analyzePrecipitationBars(hours);
  const bars = createBarChartData(segments);
  
  return {
    bars,
    totalSegments: segments.length,
    hasAnyPrecipitation: segments.length > 0,
    isolatedHours: segments.filter(s => s.startHour === s.endHour).length,
    connectedSegments: segments.filter(s => s.startHour !== s.endHour).length
  };
}

// Export the functions
window.precipitationBarAnalyzer = {
  analyzePrecipitationBars,
  createBarChartData,
  processHourlyDataForBars,
  getSegmentVisualClass,
  getSegmentBorderRadius,
  convertToMm
};