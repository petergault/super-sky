/**
 * Weather Service
 *
 * This file contains functions for fetching weather data from different APIs.
 * It implements real API calls to Azure Maps, with fallback to mock data
 * when API keys are not available.
 *
 * Phase 4 enhancements:
 * - Caching strategy for API responses
 * - Retry logic for failed API requests
 * - Fallback mechanisms when services are unavailable
 * - Graceful degradation when one or more services fail
 */

// Maximum number of retry attempts for API requests
const MAX_RETRY_ATTEMPTS = 3;

// Delay between retry attempts (in milliseconds)
const RETRY_DELAY = 1000;

// No cache expiration needed anymore

/**
 * Fetches data with retry logic
 * @param {Function} fetchFunction - The function to fetch data
 * @param {Array} args - Arguments to pass to the fetch function
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<Object>} - A promise that resolves to the fetched data
 */
async function fetchWithRetry(fetchFunction, args = [], maxRetries = MAX_RETRY_ATTEMPTS, delay = RETRY_DELAY) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt to fetch data
      return await fetchFunction(...args);
    } catch (error) {
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        // Exponential backoff: increase delay with each retry
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // All retry attempts failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Fetches location data from Azure Maps API using ZIP code
 * @param {string} zipCode - The ZIP code to search for
 * @returns {Promise<Object>} - A promise that resolves to location data
 */
// This function has been removed as we now use the back-end API endpoint
// instead of making direct API calls to Azure Maps

/**
 * Fetches daily forecast from Azure Maps API
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} - A promise that resolves to daily forecast data
 */
// This function has been removed as we now use the back-end API endpoint
// instead of making direct API calls to Azure Maps

/**
 * Fetches complete weather data from Azure Maps for a given ZIP code
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchAzureMapsData(zipCode) {
  console.log(`Fetching Azure Maps data for ZIP code: ${zipCode}`);
  
  try {
    // Use the back-end API endpoint instead of direct API calls
    const url = `/api/weather/${zipCode}?source=azuremaps`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Azure Maps API error: ${response.status} ${response.statusText}`);
    }
    
    // The back-end already returns data in our standardized format
    return await response.json();
  } catch (error) {
    console.error('Error fetching Azure Maps data:', error);
    
    // Return error information in the weather data format
    return {
      location: {
        zipCode,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      hourly: [],
      daily: [],
      source: 'AzureMaps',
      lastUpdated: Date.now(),
      isError: true,
      errorMessage: error.message
    };
  }
}

/**
 * Fetches weather data for a given ZIP code with caching
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @param {boolean} forceRefresh - Whether to force a refresh (bypass cache)
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchWeatherData(zipCode, forceRefresh = false) {
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && window.cacheManager) {
      const cacheKey = window.cacheManager.getCacheKey(zipCode, 'azuremaps');
      const cached = window.cacheManager.getFromCache(cacheKey, window.cacheManager.WEATHER_CACHE_EXPIRATION);
      if (cached) {
        console.log('Returning cached weather data from client');
        return cached.data;
      }
    }

    // Fetch fresh data with retry logic
    const data = await fetchWithRetry(fetchAzureMapsData, [zipCode]);
    
    // Cache the result
    if (window.cacheManager && !data.isError) {
      const cacheKey = window.cacheManager.getCacheKey(zipCode, 'azuremaps');
      window.cacheManager.saveToCache(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching weather data with retries:', error);
    
    // Return error information in the weather data format
    return {
      location: {
        zipCode,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      hourly: [],
      daily: [],
      source: 'AzureMaps',
      lastUpdated: Date.now(),
      isError: true,
      errorMessage: `Failed to fetch weather data after multiple attempts: ${error.message}`
    };
  }
}

/**
 * Fetches location data from Open Meteo API using coordinates
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} - A promise that resolves to forecast data
 */
// This function has been removed as we now use the back-end API endpoint
// instead of making direct API calls to Open Meteo

/**
 * Fetches complete weather data from Open Meteo for a given ZIP code
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchOpenMeteoData(zipCode) {
  console.log(`Fetching Open Meteo data for ZIP code: ${zipCode}`);
  
  try {
    // Use the back-end API endpoint instead of direct API calls
    const url = `/api/weather/${zipCode}?source=openmeteo`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open Meteo API error: ${response.status} ${response.statusText}`);
    }
    
    // The back-end already returns data in our standardized format
    return await response.json();
  } catch (error) {
    console.error('Error fetching Open Meteo data:', error);
    
    // Return error information in the weather data format
    return {
      location: {
        zipCode,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      hourly: [],
      daily: [],
      source: 'OpenMeteo',
      lastUpdated: Date.now(),
      isError: true,
      errorMessage: error.message
    };
  }
}

/**
 * Gets mock Open Meteo forecast data
 * @returns {Object} - Mock Open Meteo forecast data
 */
function getMockOpenMeteoForecast() {
  const now = new Date();
  const hourlyTimes = [];
  const dailyTimes = [];
  
  // Generate hourly times for the next 24 hours
  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);
    hourlyTimes.push(time.toISOString().split('.')[0] + 'Z');
  }
  
  // Generate daily times for the next 7 days
  for (let i = 0; i < 7; i++) {
    const time = new Date(now);
    time.setDate(time.getDate() + i);
    time.setHours(0, 0, 0, 0);
    dailyTimes.push(time.toISOString().split('T')[0]);
  }
  
  return {
    latitude: 40.7128,
    longitude: -74.0060,
    generationtime_ms: 0.5,
    utc_offset_seconds: -14400,
    timezone: 'America/New_York',
    timezone_abbreviation: 'EDT',
    elevation: 10,
    current_weather: {
      temperature: 72,
      windspeed: 8,
      winddirection: 270,
      weathercode: 3,
      time: hourlyTimes[0]
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: Array(24).fill(0).map(() => 65 + Math.random() * 15),
      relativehumidity_2m: Array(24).fill(0).map(() => 50 + Math.random() * 40),
      apparent_temperature: Array(24).fill(0).map(() => 63 + Math.random() * 15),
      precipitation_probability: Array(24).fill(0).map(() => Math.random() * 100),
      precipitation: Array(24).fill(0).map(() => Math.random() * 0.2),
      weathercode: Array(24).fill(0).map(() => [0, 1, 2, 3, 45, 51, 61, 80][Math.floor(Math.random() * 8)]),
      surface_pressure: Array(24).fill(0).map(() => 1010 + Math.random() * 10),
      visibility: Array(24).fill(0).map(() => 20000 + Math.random() * 10000),
      windspeed_10m: Array(24).fill(0).map(() => 5 + Math.random() * 10),
      winddirection_10m: Array(24).fill(0).map(() => Math.random() * 360),
      uv_index: Array(24).fill(0).map(() => Math.random() * 10),
      is_day: Array(24).fill(0).map((_, i) => i >= 6 && i < 20 ? 1 : 0)
    },
    daily: {
      time: dailyTimes,
      weathercode: Array(7).fill(0).map(() => [0, 1, 2, 3, 45, 51, 61, 80][Math.floor(Math.random() * 8)]),
      temperature_2m_max: Array(7).fill(0).map(() => 70 + Math.random() * 15),
      temperature_2m_min: Array(7).fill(0).map(() => 55 + Math.random() * 10),
      apparent_temperature_max: Array(7).fill(0).map(() => 68 + Math.random() * 15),
      apparent_temperature_min: Array(7).fill(0).map(() => 53 + Math.random() * 10),
      sunrise: Array(7).fill(0).map((_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(6, 0, 0, 0);
        return date.toISOString().split('.')[0] + 'Z';
      }),
      sunset: Array(7).fill(0).map((_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(20, 0, 0, 0);
        return date.toISOString().split('.')[0] + 'Z';
      }),
      precipitation_sum: Array(7).fill(0).map(() => Math.random() * 0.5),
      precipitation_probability_max: Array(7).fill(0).map(() => Math.random() * 100),
      windspeed_10m_max: Array(7).fill(0).map(() => 8 + Math.random() * 12),
      winddirection_10m_dominant: Array(7).fill(0).map(() => Math.random() * 360),
      uv_index_max: Array(7).fill(0).map(() => Math.random() * 10)
    },
    hourly_units: {
      temperature_2m: '°F',
      relativehumidity_2m: '%',
      apparent_temperature: '°F',
      precipitation_probability: '%',
      precipitation: 'inch',
      weathercode: 'wmo code',
      surface_pressure: 'hPa',
      visibility: 'm',
      windspeed_10m: 'mph',
      winddirection_10m: '°',
      uv_index: 'index',
      is_day: 'boolean'
    },
    daily_units: {
      weathercode: 'wmo code',
      temperature_2m_max: '°F',
      temperature_2m_min: '°F',
      apparent_temperature_max: '°F',
      apparent_temperature_min: '°F',
      precipitation_sum: 'inch',
      precipitation_probability_max: '%',
      windspeed_10m_max: 'mph',
      winddirection_10m_dominant: '°',
      uv_index_max: 'index'
    }
  };
}

/**
 * Fetches weather data from multiple sources for a given ZIP code
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @returns {Promise<Object[]>} - A promise that resolves to an array of weather data from different sources
 */
/**
 * Fetches location ID from Foreca API using ZIP code
 * @param {string} zipCode - The ZIP code to search for
 * @returns {Promise<string|null>} - A promise that resolves to location ID or null
 */
// This function has been removed as we now use the back-end API endpoint
// instead of making direct API calls to Foreca

/**
 * Fetches current weather from Foreca API
 * @param {string} locationId - The Foreca location ID
 * @returns {Promise<Object>} - A promise that resolves to current weather data
 */
// This function has been removed as we now use the back-end API endpoint
// instead of making direct API calls to Foreca

/**
 * Fetches daily forecast from Foreca API
 * @param {string} locationId - The Foreca location ID
 * @returns {Promise<Object>} - A promise that resolves to daily forecast data
 */
// This function has been removed as we now use the back-end API endpoint
// instead of making direct API calls to Foreca

/**
 * Fetches complete weather data from Foreca for a given ZIP code
 * Note: Daily forecast functionality has been removed
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchForecaData(zipCode) {
  console.log(`Fetching Foreca data for ZIP code: ${zipCode}`);
  
  try {
    // Use the back-end API endpoint instead of direct API calls
    const url = `/api/weather/${zipCode}?source=foreca`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Foreca API error: ${response.status} ${response.statusText}`);
    }
    
    // The back-end already returns data in our standardized format
    return await response.json();
  } catch (error) {
    console.error('Error fetching Foreca data:', error);
    
    // Return error information in the weather data format
    return {
      location: {
        zipCode,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      hourly: [],
      daily: [], // Empty daily array since daily forecast functionality has been removed
      source: 'Foreca',
      lastUpdated: Date.now(),
      isError: true,
      errorMessage: error.message
    };
  }
}

/**
 * Gets mock Foreca current weather data
 * @returns {Object} - Mock Foreca current weather data
 */
function getMockForecaCurrent() {
  return {
    current: {
      time: new Date().toISOString(),
      symbol: "d000",
      symbolPhrase: "clear",
      temperature: 72,
      feelsLikeTemp: 70,
      relHumidity: 65,
      dewPoint: 60,
      windSpeed: 5,
      windDir: 270,
      windDirString: "W",
      windGust: 8,
      precipProb: 20,
      precipAccum: 0,
      pressure: 1015,
      visibility: 10,
      uvIndex: 5,
      cloudiness: 50
    }
  };
}

/**
 * Gets mock Foreca forecast data - REMOVED
 * Daily forecast functionality has been removed
 * @returns {Object} - Empty forecast data
 */
function getMockForecaForecast() {
  return {
    forecast: []
  };
}

/**
 * Fetches weather data from multiple sources for a given ZIP code with caching
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @param {boolean} forceRefresh - Whether to force a refresh (bypass cache)
 * @returns {Promise<Object[]>} - A promise that resolves to an array of weather data from different sources
 */
async function fetchTripleCheckWeather(zipCode, forceRefresh = false) {
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && window.cacheManager) {
      const cacheKey = window.cacheManager.getCacheKey(zipCode, 'triple');
      const cached = window.cacheManager.getFromCache(cacheKey, window.cacheManager.WEATHER_CACHE_EXPIRATION);
      if (cached) {
        console.log('Returning cached triple check data from client');
        return cached.data;
      }
    }

    // Use the back-end API endpoint for fresh triple check data
    const url = `/api/weather/${zipCode}/triple${forceRefresh ? '?forceRefresh=true' : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Triple check API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const results = await response.json();
    
    // Cache the result if successful
    if (window.cacheManager && results && !results.every(r => r.isError)) {
      const cacheKey = window.cacheManager.getCacheKey(zipCode, 'triple');
      window.cacheManager.saveToCache(cacheKey, results);
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching super sky weather:', error);
    console.log('Using mock data generator for Phase 3 demonstration');
    
    // Return an array with error objects for each service
    // Order changed to match backend: Google → AccuWeather → Foreca → NOAA (OpenMeteo)
    return [
      {
        source: 'GoogleWeather',
        isError: true,
        errorMessage: `Failed to fetch weather data: ${error.message}`,
        location: { zipCode },
        hourly: [],
        daily: []
      },
      {
        source: 'AzureMaps',
        isError: true,
        errorMessage: `Failed to fetch weather data: ${error.message}`,
        location: { zipCode },
        hourly: [],
        daily: []
      },
      {
        source: 'Foreca',
        isError: true,
        errorMessage: `Failed to fetch weather data: ${error.message}`,
        location: { zipCode },
        hourly: [],
        daily: [] // Empty daily array since daily forecast functionality has been removed
      },
      {
        source: 'OpenMeteo',
        isError: true,
        errorMessage: `Failed to fetch weather data: ${error.message}`,
        location: { zipCode },
        hourly: [],
        daily: []
      }
    ];
  }
}

/**
 * Creates a mock variation of weather data to simulate different providers
 * @param {Object} baseData - Base weather data to create variation from
 * @param {string} source - The source name to use
 * @returns {Object} - Varied weather data
 */
function createMockVariation(baseData, source) {
  if (!baseData || baseData.isError) {
    return getMockWeatherForecast(baseData?.location?.zipCode || '10001', source);
  }
  
  // Create a deep copy
  const variation = JSON.parse(JSON.stringify(baseData));
  
  // Update the source
  variation.source = source;
  
  // Add slight variations to temperatures and precipitation
  if (variation.current) {
    variation.current.temperature += getRandomVariation(5);
    variation.current.feelsLike += getRandomVariation(5);
    variation.current.precipitation.probability += getRandomVariation(10);
    variation.current.precipitation.amount += getRandomVariation(0.2);
  }
  
  // Vary hourly forecasts
  if (variation.hourly && Array.isArray(variation.hourly)) {
    variation.hourly.forEach(hour => {
      hour.temperature += getRandomVariation(3);
      hour.feelsLike += getRandomVariation(3);
      hour.precipitation.probability += getRandomVariation(15);
      hour.precipitation.amount += getRandomVariation(0.3);
    });
  }
  
  // Vary daily forecasts
  if (variation.daily && Array.isArray(variation.daily)) {
    variation.daily.forEach(day => {
      day.temperature += getRandomVariation(4);
      day.feelsLike += getRandomVariation(4);
      if (day.temperatureMin) day.temperatureMin += getRandomVariation(3);
      if (day.temperatureMax) day.temperatureMax += getRandomVariation(3);
      day.precipitation.probability += getRandomVariation(20);
      day.precipitation.amount += getRandomVariation(0.4);
    });
  }
  
  return variation;
}

/**
 * Generates a random variation within a range
 * @param {number} range - The maximum range of variation
 * @returns {number} - Random variation
 */
function getRandomVariation(range) {
  return (Math.random() * range * 2) - range;
}

/**
 * Gets mock location data for Azure Maps
 * @param {string} zipCode - The ZIP code
 * @returns {Object} - Mock location data in Azure Maps format
 */
function getMockLocation(zipCode) {
  return {
    summary: {
      query: zipCode,
      queryType: 'postalCode',
      queryTime: 100,
      numResults: 1,
      offset: 0,
      totalResults: 1,
      fuzzyLevel: 1
    },
    results: [
      {
        type: 'Geography',
        id: 'mock-id',
        score: 1.0,
        address: {
          streetNumber: '',
          streetName: '',
          municipalitySubdivision: '',
          municipality: 'New York',
          countrySecondarySubdivision: '',
          countrySubdivision: 'New York',
          postalCode: zipCode || '10001',
          countryCode: 'US',
          country: 'United States',
          countryCodeISO3: 'USA',
          freeformAddress: 'New York, NY ' + (zipCode || '10001'),
          localName: 'New York'
        },
        position: {
          lat: 40.7128,
          lon: -74.0060
        },
        viewport: {
          topLeftPoint: {
            lat: 40.8,
            lon: -74.1
          },
          btmRightPoint: {
            lat: 40.7,
            lon: -74.0
          }
        }
      }
    ]
  };
}

/**
 * Gets mock current conditions data
 * @returns {Array} - Mock current conditions data
 */
function getMockCurrentConditions() {
  return [{
    LocalObservationDateTime: new Date().toISOString(),
    WeatherText: 'Partly Cloudy',
    WeatherIcon: 3,
    Temperature: {
      Metric: { Value: 22, Unit: 'C' },
      Imperial: { Value: 72, Unit: 'F' }
    },
    RealFeelTemperature: {
      Metric: { Value: 21, Unit: 'C' },
      Imperial: { Value: 70, Unit: 'F' }
    },
    RelativeHumidity: 65,
    Wind: {
      Direction: { Degrees: 270 },
      Speed: {
        Metric: { Value: 8, Unit: 'km/h' },
        Imperial: { Value: 5, Unit: 'mi/h' }
      }
    },
    UVIndex: 5,
    Visibility: {
      Metric: { Value: 16, Unit: 'km' },
      Imperial: { Value: 10, Unit: 'mi' }
    },
    CloudCover: 50,
    Pressure: {
      Metric: { Value: 1015, Unit: 'mb' },
      Imperial: { Value: 30, Unit: 'inHg' }
    },
    PrecipitationSummary: {
      Precipitation: {
        Metric: { Value: 0, Unit: 'mm' },
        Imperial: { Value: 0, Unit: 'in' }
      }
    }
  }];
}

/**
 * Gets mock hourly forecast data
 * @returns {Array} - Mock hourly forecast data
 */
function getMockHourlyForecast() {
  const now = new Date();
  
  return Array.from({ length: 12 }, (_, i) => {
    const forecastTime = new Date(now.getTime() + i * 3600 * 1000);
    
    return {
      DateTime: forecastTime.toISOString(),
      EpochDateTime: Math.floor(forecastTime.getTime() / 1000),
      WeatherIcon: 3,
      IconPhrase: 'Partly Cloudy',
      HasPrecipitation: Math.random() > 0.7,
      PrecipitationType: Math.random() > 0.7 ? 'Rain' : null,
      PrecipitationIntensity: 'Light',
      PrecipitationProbability: Math.floor(Math.random() * 50),
      Temperature: {
        Value: 70 + Math.floor(Math.random() * 10),
        Unit: 'F'
      },
      RealFeelTemperature: {
        Value: 68 + Math.floor(Math.random() * 10),
        Unit: 'F'
      },
      RelativeHumidity: 60 + Math.floor(Math.random() * 20),
      Wind: {
        Direction: { Degrees: 270 },
        Speed: { Value: 4 + Math.floor(Math.random() * 6), Unit: 'mi/h' }
      },
      IsDaylight: forecastTime.getHours() > 6 && forecastTime.getHours() < 20
    };
  });
}

/**
 * Gets mock daily forecast data for Azure Maps
 * @returns {Object} - Mock daily forecast data in Azure Maps format
 */
function getMockDailyForecast() {
  const now = new Date();
  
  return {
    forecasts: Array.from({ length: 5 }, (_, i) => {
      const forecastDate = new Date(now.getTime() + i * 24 * 3600 * 1000);
      forecastDate.setHours(12, 0, 0, 0); // Set to noon
      
      return {
        date: forecastDate.toISOString(),
        temperature: {
          minimum: {
            value: 60 + Math.floor(Math.random() * 10),
            unit: 'F'
          },
          maximum: {
            value: 70 + Math.floor(Math.random() * 15),
            unit: 'F'
          }
        },
        realFeelTemperature: {
          minimum: {
            value: 58 + Math.floor(Math.random() * 10),
            unit: 'F'
          },
          maximum: {
            value: 68 + Math.floor(Math.random() * 15),
            unit: 'F'
          }
        },
        day: {
          iconCode: 3,
          iconPhrase: 'Partly Sunny',
          hasPrecipitation: Math.random() > 0.6,
          precipitationType: 'Rain',
          precipitationIntensity: 'Light',
          shortPhrase: 'Partly sunny',
          longPhrase: 'Partly sunny',
          precipitationProbability: Math.floor(Math.random() * 50),
          thunderstormProbability: Math.floor(Math.random() * 20),
          rainProbability: Math.floor(Math.random() * 50),
          snowProbability: 0,
          iceProbability: 0,
          relativeHumidity: 60 + Math.floor(Math.random() * 20),
          wind: {
            speed: {
              value: 4 + Math.floor(Math.random() * 8),
              unit: 'mi/h'
            },
            direction: {
              degrees: 270,
              localizedDescription: 'W'
            }
          },
          windGust: {
            speed: {
              value: 6 + Math.floor(Math.random() * 10),
              unit: 'mi/h'
            }
          },
          totalLiquid: {
            value: Math.random() * 0.5,
            unit: 'in'
          },
          rain: {
            value: Math.random() * 0.5,
            unit: 'in'
          },
          snow: {
            value: 0,
            unit: 'in'
          },
          ice: {
            value: 0,
            unit: 'in'
          },
          hoursOfPrecipitation: Math.floor(Math.random() * 4),
          hoursOfRain: Math.floor(Math.random() * 4),
          hoursOfSnow: 0,
          hoursOfIce: 0,
          cloudCover: 50 + Math.floor(Math.random() * 30)
        },
        night: {
          iconCode: 35,
          iconPhrase: 'Partly Cloudy',
          hasPrecipitation: Math.random() > 0.7,
          precipitationType: 'Rain',
          precipitationIntensity: 'Light',
          shortPhrase: 'Partly cloudy',
          longPhrase: 'Partly cloudy',
          precipitationProbability: Math.floor(Math.random() * 40),
          thunderstormProbability: Math.floor(Math.random() * 10),
          rainProbability: Math.floor(Math.random() * 40),
          snowProbability: 0,
          iceProbability: 0,
          wind: {
            speed: {
              value: 3 + Math.floor(Math.random() * 5),
              unit: 'mi/h'
            },
            direction: {
              degrees: 270,
              localizedDescription: 'W'
            }
          },
          windGust: {
            speed: {
              value: 5 + Math.floor(Math.random() * 8),
              unit: 'mi/h'
            }
          },
          totalLiquid: {
            value: Math.random() * 0.3,
            unit: 'in'
          },
          rain: {
            value: Math.random() * 0.3,
            unit: 'in'
          },
          snow: {
            value: 0,
            unit: 'in'
          },
          ice: {
            value: 0,
            unit: 'in'
          },
          hoursOfPrecipitation: Math.floor(Math.random() * 3),
          hoursOfRain: Math.floor(Math.random() * 3),
          hoursOfSnow: 0,
          hoursOfIce: 0,
          cloudCover: 40 + Math.floor(Math.random() * 30)
        },
        sun: {
          rise: new Date(forecastDate.getTime()).setHours(6, 0, 0, 0),
          epochRise: Math.floor(new Date(forecastDate.getTime()).setHours(6, 0, 0, 0) / 1000),
          set: new Date(forecastDate.getTime()).setHours(20, 0, 0, 0),
          epochSet: Math.floor(new Date(forecastDate.getTime()).setHours(20, 0, 0, 0) / 1000)
        },
        moon: {
          rise: new Date(forecastDate.getTime()).setHours(22, 0, 0, 0),
          epochRise: Math.floor(new Date(forecastDate.getTime()).setHours(22, 0, 0, 0) / 1000),
          set: new Date(forecastDate.getTime()).setHours(10, 0, 0, 0),
          epochSet: Math.floor(new Date(forecastDate.getTime()).setHours(10, 0, 0, 0) / 1000),
          phase: 'WaningCrescent',
          age: 24
        }
      };
    })
  };
}

/**
 * Gets mock weather data for a single data point
 * @returns {Object} - Mock weather data
 */
function getMockWeatherData() {
  return {
    temperature: 72,
    feelsLike: 70,
    humidity: 65,
    windSpeed: 5,
    windDirection: 270,
    pressure: 30,
    uvIndex: 5,
    visibility: 10,
    cloudCover: 50,
    description: 'Partly Cloudy',
    icon: 'partly-cloudy',
    precipitation: {
      probability: 20,
      amount: 0
    }
  };
}

/**
 * Gets a complete mock weather forecast
 * @param {string} zipCode - The ZIP code
 * @param {string} source - The source name
 * @returns {Object} - Mock weather forecast
 */
function getMockWeatherForecast(zipCode, source = 'AzureMaps') {
  const now = new Date();
  
  return {
    location: {
      zipCode: zipCode || '10001',
      city: 'New York',
      state: 'New York',
      country: 'US',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    current: getMockWeatherData(),
    hourly: Array.from({ length: 24 }, (_, i) => {
      const timestamp = now.getTime() + i * 3600 * 1000;
      const hourDate = new Date(timestamp);
      
      return {
        timestamp: timestamp,
        date: hourDate.toLocaleDateString(),
        time: hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDay: hourDate.getHours() > 6 && hourDate.getHours() < 20,
        temperature: 70 + Math.floor(Math.random() * 10),
        feelsLike: 68 + Math.floor(Math.random() * 10),
        humidity: 60 + Math.floor(Math.random() * 20),
        windSpeed: 4 + Math.floor(Math.random() * 6),
        windDirection: 270,
        description: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: {
          probability: Math.floor(Math.random() * 50),
          amount: Math.random() * 0.5
        }
      };
    }),
    daily: Array.from({ length: 7 }, (_, i) => {
      const timestamp = now.getTime() + i * 24 * 3600 * 1000;
      const dayDate = new Date(timestamp);
      dayDate.setHours(12, 0, 0, 0); // Set to noon
      
      return {
        timestamp: timestamp,
        date: dayDate.toLocaleDateString(),
        time: '12:00 PM',
        temperatureMin: 60 + Math.floor(Math.random() * 10),
        temperatureMax: 70 + Math.floor(Math.random() * 15),
        temperature: 65 + Math.floor(Math.random() * 15),
        feelsLike: 63 + Math.floor(Math.random() * 15),
        humidity: 60 + Math.floor(Math.random() * 20),
        windSpeed: 4 + Math.floor(Math.random() * 8),
        windDirection: 270,
        description: 'Partly Cloudy',
        icon: 'partly-cloudy',
        precipitation: {
          probability: Math.floor(Math.random() * 50),
          amount: Math.random() * 0.8
        },
        sunrise: new Date(dayDate.getTime()).setHours(6, 0, 0, 0),
        sunset: new Date(dayDate.getTime()).setHours(20, 0, 0, 0)
      };
    }),
    source: source,
    lastUpdated: Date.now()
  };
}

/**
 * Fetches complete weather data from Google Weather API for a given ZIP code
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchGoogleWeatherData(zipCode) {
  console.log(`Fetching Google Weather data for ZIP code: ${zipCode}`);
  
  try {
    // Use the back-end API endpoint
    const url = `/api/weather/${zipCode}?source=googleweather`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Weather API error: ${response.status} ${response.statusText}`);
    }
    
    // The back-end already returns data in our standardized format
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google Weather data:', error);
    
    // Return error information in the weather data format
    return {
      location: {
        zipCode,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      hourly: [],
      daily: [],
      source: 'GoogleWeather',
      lastUpdated: Date.now(),
      isError: true,
      errorMessage: error.message
    };
  }
}

// Export the functions
window.weatherService = {
  fetchWeatherData,
  fetchTripleCheckWeather,
  fetchAzureMapsData,
  fetchOpenMeteoData,
  fetchForecaData,
  fetchGoogleWeatherData,
  fetchWithRetry,
  // Constants for configuration
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY
};