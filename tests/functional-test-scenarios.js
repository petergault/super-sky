/**
 * Functional Test Scenarios
 * 
 * This file contains test scenarios for the Super Sky app.
 * These scenarios are designed to test various weather conditions and app functionality.
 */

// Test scenario configuration
const TEST_SCENARIOS = {
  // Rainy day scenarios
  rainyDays: [
    {
      name: 'Heavy Rain',
      zipCode: '98101', // Seattle
      expectedConditions: {
        precipitation: {
          probability: { min: 70, max: 100 },
          amount: { min: 0.2, max: null }
        },
        description: ['rain', 'shower', 'storm', 'precipitation'],
        displayMode: 'rain-focused'
      }
    },
    {
      name: 'Light Rain',
      zipCode: '97201', // Portland
      expectedConditions: {
        precipitation: {
          probability: { min: 40, max: 80 },
          amount: { min: 0.05, max: 0.2 }
        },
        description: ['light rain', 'drizzle', 'shower'],
        displayMode: 'rain-focused'
      }
    },
    {
      name: 'Thunderstorms',
      zipCode: '33101', // Miami
      expectedConditions: {
        precipitation: {
          probability: { min: 60, max: 100 },
          amount: { min: 0.1, max: null }
        },
        description: ['thunder', 'storm', 'lightning'],
        displayMode: 'rain-focused'
      }
    }
  ],
  
  // Dry day scenarios
  dryDays: [
    {
      name: 'Sunny Day',
      zipCode: '90210', // Beverly Hills
      expectedConditions: {
        precipitation: {
          probability: { min: 0, max: 15 },
          amount: { min: 0, max: 0.05 }
        },
        description: ['sunny', 'clear', 'fair'],
        displayMode: 'simplified'
      }
    },
    {
      name: 'Cloudy Day',
      zipCode: '94101', // San Francisco
      expectedConditions: {
        precipitation: {
          probability: { min: 0, max: 30 },
          amount: { min: 0, max: 0.1 }
        },
        description: ['cloudy', 'overcast', 'partly cloudy'],
        displayMode: 'simplified'
      }
    },
    {
      name: 'Hot Day',
      zipCode: '85001', // Phoenix
      expectedConditions: {
        temperature: { min: 85, max: null },
        precipitation: {
          probability: { min: 0, max: 10 },
          amount: { min: 0, max: 0.05 }
        },
        description: ['hot', 'sunny', 'clear'],
        displayMode: 'simplified'
      }
    }
  ],
  
  // Mixed conditions scenarios
  mixedConditions: [
    {
      name: 'Partly Cloudy with Chance of Rain',
      zipCode: '60601', // Chicago
      expectedConditions: {
        precipitation: {
          probability: { min: 30, max: 60 },
          amount: { min: 0, max: 0.2 }
        },
        description: ['partly cloudy', 'chance of rain', 'scattered showers'],
        displayMode: 'rain-focused'
      }
    },
    {
      name: 'Morning Fog',
      zipCode: '94133', // San Francisco (North)
      expectedConditions: {
        precipitation: {
          probability: { min: 0, max: 20 },
          amount: { min: 0, max: 0.1 }
        },
        description: ['fog', 'mist', 'haze'],
        displayMode: 'simplified'
      }
    }
  ],
  
  // Different data sources scenarios
  dataSources: [
    {
      name: 'All Sources Available',
      zipCode: '10001', // New York
      expectedSources: ['AzureMaps', 'OpenMeteo', 'Foreca'],
      expectedAgreement: { temperature: 'high', precipitation: 'medium' }
    },
    {
      name: 'Partial Sources Available',
      zipCode: '80201', // Denver
      expectedSources: ['AzureMaps', 'OpenMeteo'],
      expectedAgreement: { temperature: 'medium', precipitation: 'low' }
    }
  ]
};

/**
 * Validates if actual weather data matches the expected conditions
 * @param {Object} weatherData - The actual weather data
 * @param {Object} expectedConditions - The expected conditions
 * @returns {Object} - Validation result with success flag and details
 */
function validateWeatherConditions(weatherData, expectedConditions) {
  const results = {
    success: true,
    details: {}
  };
  
  // Check precipitation probability
  if (expectedConditions.precipitation && expectedConditions.precipitation.probability) {
    const { min, max } = expectedConditions.precipitation.probability;
    const actual = weatherData.current.precipitation.probability;
    
    const isValid = (min === null || actual >= min) && (max === null || actual <= max);
    results.details.precipitationProbability = {
      expected: `${min || 0} - ${max || '∞'}%`,
      actual: `${actual}%`,
      pass: isValid
    };
    
    if (!isValid) results.success = false;
  }
  
  // Check precipitation amount
  if (expectedConditions.precipitation && expectedConditions.precipitation.amount) {
    const { min, max } = expectedConditions.precipitation.amount;
    const actual = weatherData.current.precipitation.amount;
    
    const isValid = (min === null || actual >= min) && (max === null || actual <= max);
    results.details.precipitationAmount = {
      expected: `${min || 0} - ${max || '∞'} inches`,
      actual: `${actual} inches`,
      pass: isValid
    };
    
    if (!isValid) results.success = false;
  }
  
  // Check temperature
  if (expectedConditions.temperature) {
    const { min, max } = expectedConditions.temperature;
    const actual = weatherData.current.temperature;
    
    const isValid = (min === null || actual >= min) && (max === null || actual <= max);
    results.details.temperature = {
      expected: `${min || 0} - ${max || '∞'}°F`,
      actual: `${actual}°F`,
      pass: isValid
    };
    
    if (!isValid) results.success = false;
  }
  
  // Check description
  if (expectedConditions.description) {
    const descriptions = expectedConditions.description;
    const actual = weatherData.current.description.toLowerCase();
    
    const matchesAny = descriptions.some(desc => actual.includes(desc.toLowerCase()));
    results.details.description = {
      expected: descriptions.join(' or '),
      actual: weatherData.current.description,
      pass: matchesAny
    };
    
    if (!matchesAny) results.success = false;
  }
  
  return results;
}

/**
 * Validates if the display mode matches the expected mode based on conditions
 * @param {string} actualMode - The actual display mode
 * @param {string} expectedMode - The expected display mode
 * @returns {Object} - Validation result with success flag and details
 */
function validateDisplayMode(actualMode, expectedMode) {
  return {
    success: actualMode === expectedMode,
    details: {
      expected: expectedMode,
      actual: actualMode
    }
  };
}

/**
 * Validates if all expected data sources are available
 * @param {Array} weatherData - Array of weather data from different sources
 * @param {Array} expectedSources - Array of expected source names
 * @returns {Object} - Validation result with success flag and details
 */
function validateDataSources(weatherData, expectedSources) {
  const actualSources = weatherData.map(data => data.source);
  
  const missingSource = expectedSources.find(source => !actualSources.includes(source));
  const unexpectedSource = actualSources.find(source => !expectedSources.includes(source));
  
  return {
    success: !missingSource && !unexpectedSource,
    details: {
      expected: expectedSources.join(', '),
      actual: actualSources.join(', '),
      missing: missingSource || 'None',
      unexpected: unexpectedSource || 'None'
    }
  };
}

// Export the test scenarios and validation functions
window.functionalTestScenarios = {
  scenarios: TEST_SCENARIOS,
  validateWeatherConditions,
  validateDisplayMode,
  validateDataSources
};