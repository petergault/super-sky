/**
 * Mock Data Generator
 *
 * This file contains utility functions for generating mock weather data
 * for testing and development purposes.
 * 
 * It's particularly useful for demonstrating the Phase 3 Smart Display Logic
 * when the API connection is not available.
 */

/**
 * Generates mock hourly data for a day with specified precipitation characteristics
 * @param {boolean} isRainy - Whether the day should have rain
 * @param {string} source - The source name (e.g., 'AzureMaps', 'OpenMeteo', 'Foreca')
 * @returns {Object} - Mock hourly data for a day
 */
function generateMockHourlyData(isRainy, source) {
  const hours = [];
  const now = new Date();
  
  // Generate 24 hours of data
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now);
    hour.setHours(i, 0, 0, 0);
    
    // Determine if this hour should have rain
    // For rainy days, make it rain in the afternoon (hours 12-18)
    const hasRain = isRainy && (i >= 12 && i <= 18);
    
    // Generate precipitation amount
    // For rainy hours, use values between 0.5mm and 4mm
    // For non-rainy hours, use values between 0mm and 0.4mm
    // For OpenMeteo on Saturday, use exactly 6.5mm (0.256 inches) of rain
    // This is to test the specific issue with 6.5mm of rain
    const isSaturday = new Date().getDay() === 6 ||
                      (new Date().getDay() === 5 && i >= 18) ||
                      (new Date().getDay() === 0 && i <= 6);
    
    const precipAmount = (source === 'OpenMeteo' && isSaturday && hasRain)
      ? 0.256  // 0.256 inches = 6.5mm
      : hasRain
        ? 0.5 + Math.random() * 3.5
        : Math.random() * 0.4;
    
    // Generate precipitation probability
    // For rainy hours, use values between 50% and 100%
    // For non-rainy hours, use values between 0% and 30%
    const precipProbability = hasRain 
      ? 50 + Math.floor(Math.random() * 51) 
      : Math.floor(Math.random() * 31);
    
    // Generate temperature (warmer during the day, cooler at night)
    const baseTemp = 65;
    const hourFactor = i >= 6 && i <= 18 
      ? (i - 6) / 12 // 0 to 1 during day hours
      : i < 6 
        ? 0 // early morning
        : (24 - i) / 6; // evening
    const tempVariation = 15 * hourFactor;
    const temperature = baseTemp + tempVariation;
    
    // Generate weather condition
    let weatherCondition;
    if (hasRain) {
      weatherCondition = Math.random() > 0.7 ? 'thunderstorm' : 'rain';
    } else {
      if (i >= 6 && i <= 18) { // Daytime
        weatherCondition = Math.random() > 0.5 ? 'sunny' : 'partly cloudy';
      } else { // Nighttime
        weatherCondition = Math.random() > 0.5 ? 'clear' : 'partly cloudy';
      }
    }
    
    hours.push({
      timestamp: hour.getTime(),
      date: hour.toLocaleDateString(),
      time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: temperature,
      feelsLike: temperature - 2,
      humidity: 50 + Math.floor(Math.random() * 30),
      windSpeed: 5 + Math.floor(Math.random() * 10),
      windDirection: Math.floor(Math.random() * 360),
      weatherCondition: weatherCondition,
      precipitation: {
        probability: precipProbability,
        amount: precipAmount,
        type: hasRain ? 'rain' : undefined
      }
    });
  }
  
  return {
    source: source,
    hours: hours
  };
}

/**
 * Generates mock weather data for multiple days and sources
 * @param {number} days - Number of days to generate data for
 * @returns {Object} - Mock weather data
 */
function generateMockWeatherData(days = 7) {
  const sources = ['AzureMaps', 'OpenMeteo', 'Foreca'];
  const result = [];
  
  // Generate data for each source
  sources.forEach(source => {
    const sourceData = {
      source: source,
      location: {
        zipCode: '10001',
        city: 'New York',
        state: 'NY',
        country: 'US',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      },
      daily: [],
      hourly: [],
      isError: false
    };
    
    // Generate daily data
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Make even days dry and odd days rainy for demonstration
      const isRainy = i % 2 !== 0;
      
      sourceData.daily.push({
        timestamp: date.getTime(),
        date: date.toLocaleDateString(),
        temperatureMin: 60 + Math.floor(Math.random() * 5),
        temperatureMax: 70 + Math.floor(Math.random() * 10),
        humidity: 50 + Math.floor(Math.random() * 30),
        precipitation: {
          probability: isRainy ? 70 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 30),
          // For Saturday (usually day index 5 or 6 depending on current day), use exactly 6.5mm for Open Meteo
          // This is to test the specific issue with 6.5mm of rain
          amount: (source === 'OpenMeteo' && (i === 5 || i === 6)) ? 0.256 : // 0.256 inches = 6.5mm
                 isRainy ? 2 + Math.random() * 10 : Math.random() * 0.4,
          type: isRainy ? 'rain' : undefined
        }
      });
    }
    
    result.push(sourceData);
  });
  
  return result;
}

/**
 * Gets mock hourly data for a specific day
 * @param {number} dayIndex - The day index (0-6)
 * @returns {Array} - Array of hourly data for each source
 */
function getMockHourlyDataForDay(dayIndex) {
  const sources = ['AzureMaps', 'OpenMeteo', 'Foreca'];
  const result = [];
  
  // Generate data for each source
  sources.forEach(source => {
    // Make even days dry and odd days rainy for demonstration
    const isRainy = dayIndex % 2 !== 0;
    result.push(generateMockHourlyData(isRainy, source));
  });
  
  return result;
}

// Export the functions
window.mockDataGenerator = {
  generateMockHourlyData,
  generateMockWeatherData,
  getMockHourlyDataForDay
};