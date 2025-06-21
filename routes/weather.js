const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import transformer functions
const transformers = require('../utils/transformers');

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const GOOGLE_WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for expensive Google Weather calls

// In-memory cache for server-side caching
const serverCache = new Map();

/**
 * Get data from server cache
 */
function getFromServerCache(key, maxAge = CACHE_DURATION) {
  const cached = serverCache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > maxAge) {
    serverCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Save data to server cache
 */
function saveToServerCache(key, data, maxAge = CACHE_DURATION) {
  serverCache.set(key, {
    data,
    timestamp: Date.now(),
    maxAge
  });
  
  // Clean up expired entries periodically
  if (serverCache.size > 100) {
    const now = Date.now();
    for (const [cacheKey, cached] of serverCache.entries()) {
      if (now - cached.timestamp > cached.maxAge) {
        serverCache.delete(cacheKey);
      }
    }
  }
}

/**
 * Generate cache key for weather data
 */
function getCacheKey(zipCode, source = null) {
  return source ? `weather_${zipCode}_${source}` : `weather_${zipCode}`;
}

// Helper function to validate ZIP code
const validateZipCode = (zipCode) => {
  const zipRegex = /^\d{5}$/;
  return zipRegex.test(zipCode);
};

/**
 * Fetch location data from Azure Maps API using ZIP code
 */
async function fetchAzureMapsLocation(zipCode) {
  try {
    const apiKey = process.env.AZURE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Azure Maps API key not configured');
    }
    
    const url = `${process.env.AZURE_MAPS_BASE_URL}/search/address/json`;
    
    const response = await axios.get(url, {
      params: {
        'api-version': '1.0',
        'subscription-key': apiKey,
        'query': zipCode,
        'countrySet': 'US',
        'limit': '1'
      }
    });
    
    if (!response.data || !response.data.results || response.data.results.length === 0) {
      throw new Error(`No location found for ZIP code: ${zipCode}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Azure Maps location:', error);
    throw error;
  }
}

/**
 * Fetch daily forecast from Azure Maps API
 */
async function fetchAzureMapsDailyForecast(latitude, longitude) {
  try {
    const apiKey = process.env.AZURE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Azure Maps API key not configured');
    }
    
    const url = `${process.env.AZURE_MAPS_BASE_URL}/weather/forecast/daily/json`;
    
    const response = await axios.get(url, {
      params: {
        'api-version': '1.1',
        'subscription-key': apiKey,
        'query': `${latitude},${longitude}`,
        'duration': '10',
        'unit': 'imperial'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Azure Maps daily forecast:', error);
    throw error;
  }
}

/**
 * Fetch hourly forecast from Azure Maps API
 */
async function fetchAzureMapsHourlyForecast(latitude, longitude) {
  try {
    const apiKey = process.env.AZURE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Azure Maps API key not configured');
    }
    
    const url = `${process.env.AZURE_MAPS_BASE_URL}/weather/forecast/hourly/json`;
    
    const response = await axios.get(url, {
      params: {
        'api-version': '1.1',
        'subscription-key': apiKey,
        'query': `${latitude},${longitude}`,
        'duration': '240',
        'unit': 'imperial',
        'language': 'en-US'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Azure Maps hourly forecast:', error);
    throw error;
  }
}

/**
 * Fetch Open Meteo forecast data
 */
async function fetchOpenMeteoForecast(latitude, longitude) {
  try {
    const url = `${process.env.OPEN_METEO_BASE_URL}/v1/forecast`;
    
    const params = {
      latitude,
      longitude,
      timezone: 'auto',
      current_weather: true,
      forecast_days: 10,
      models: 'best_match',
      hourly: [
        'temperature_2m',
        'relativehumidity_2m',
        'apparent_temperature',
        'precipitation',
        'weathercode',
        'surface_pressure',
        'visibility',
        'windspeed_10m',
        'winddirection_10m',
        'uv_index',
        'is_day'
      ].join(','),
      daily: [
        'weathercode',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'precipitation_sum',
        'precipitation_probability_max',
        'windspeed_10m_max',
        'winddirection_10m_dominant',
        'uv_index_max'
      ].join(','),
      temperature_unit: 'fahrenheit',
      windspeed_unit: 'mph',
      precipitation_unit: 'inch'
    };
    
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching Open Meteo forecast:', error);
    throw error;
  }
}

/**
 * Fetch Foreca location ID via RapidAPI
 */
async function fetchForecaLocationId(zipCode) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;
    
    if (!rapidApiKey || !rapidApiHost) {
      throw new Error('RapidAPI key or host not configured for Foreca');
    }
    
    // Search for the location using RapidAPI
    const response = await axios.get(`https://${rapidApiHost}/location/search/${zipCode}`, {
      headers: {
        'x-rapidapi-host': rapidApiHost,
        'x-rapidapi-key': rapidApiKey
      },
      params: {
        country: 'us'
      }
    });
    
    if (!response.data || !response.data.locations || response.data.locations.length === 0) {
      throw new Error(`No Foreca location found for ZIP code: ${zipCode}`);
    }
    
    return {
      locationId: response.data.locations[0].id
    };
  } catch (error) {
    console.error('Error fetching Foreca location ID via RapidAPI:', error);
    throw error;
  }
}

/**
 * Fetch Foreca current weather via RapidAPI
 */
async function fetchForecaCurrent(locationId) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;
    
    if (!rapidApiKey || !rapidApiHost) {
      throw new Error('RapidAPI key or host not configured for Foreca');
    }
    
    const response = await axios.get(`https://${rapidApiHost}/current/${locationId}`, {
      headers: {
        'x-rapidapi-host': rapidApiHost,
        'x-rapidapi-key': rapidApiKey
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Foreca current weather via RapidAPI:', error);
    throw error;
  }
}

/**
 * Fetch Foreca forecast via RapidAPI - REMOVED
 * Daily forecast functionality has been removed
 */
async function fetchForecaForecast(locationId) {
  console.log('Foreca daily forecast functionality has been removed');
  return { forecast: [] };
}

/**
 * Fetch Foreca hourly forecast via RapidAPI
 */
async function fetchForecaHourlyForecast(locationId) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;
    
    if (!rapidApiKey || !rapidApiHost) {
      throw new Error('RapidAPI key or host not configured for Foreca');
    }
    
    const response = await axios.get(`https://${rapidApiHost}/forecast/hourly/${locationId}`, {
      headers: {
        'x-rapidapi-host': rapidApiHost,
        'x-rapidapi-key': rapidApiKey
      },
      params: {
        periods: 168, // 7 days * 24 hours = 168 hours (maximum allowed by Foreca API)
        dataset: 'full' // Get full dataset with all available parameters
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Foreca hourly forecast via RapidAPI:', error);
    
    // If we hit a rate limit, return a specific error object
    if (error.response && error.response.status === 429) {
      return { status: 429, message: 'Rate limit exceeded' };
    }
    
    throw error;
  }
}

/**
 * Fetch Google Weather API forecast with proper pagination and caching
 *
 * This function uses the correct pagination approach for the Google Weather API:
 * 1. Makes an initial request for 240 hours with pageSize=240
 * 2. Uses the returned nextPageToken to make subsequent paginated requests
 * 3. Continues until all 240 hours are collected or no more tokens available
 * 4. Each request returns ~24 hours, so ~10 requests needed for 240 hours
 * 5. Implements aggressive caching due to expensive pagination
 */
async function fetchGoogleWeatherForecast(latitude, longitude, totalHours = 240, pageSize = 240) {
  // Check cache first (longer cache duration for expensive Google Weather calls)
  const cacheKey = `google_weather_${latitude}_${longitude}_${totalHours}`;
  const cached = getFromServerCache(cacheKey, GOOGLE_WEATHER_CACHE_DURATION);
  if (cached) {
    console.log('Returning cached Google Weather data');
    return cached;
  }
  try {
    console.log(`Fetching Google Weather API data for ${totalHours} hours using proper pagination...`);
    
    const apiKey = process.env.GOOGLE_WEATHER_API_KEY || 'AIzaSyD15QYUz9DPvooY80RV_ZvgG4VteWKWjtQ';
    
    if (!apiKey) {
      throw new Error('Google Weather API key not configured');
    }
    
    const baseUrl = `${process.env.GOOGLE_WEATHER_BASE_URL || 'https://weather.googleapis.com'}/v1/forecast/hours:lookup`;
    
    let allForecastHours = [];
    let nextPageToken = null;
    let requestCount = 0;
    const maxRequests = Math.ceil(totalHours / 24); // API returns ~24 hours per request
    
    console.log(`Expected to make ~${maxRequests} requests to get ${totalHours} hours`);
    
    do {
      requestCount++;
      
      // Construct the URL for this request
      let requestUrl = `${baseUrl}?key=${apiKey}&location.latitude=${latitude}&location.longitude=${longitude}&hours=${totalHours}&pageSize=${pageSize}`;
      
      // Add pageToken if we have one (for subsequent requests)
      if (nextPageToken) {
        requestUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
      }
      
      console.log(`Making request ${requestCount}/${maxRequests}${nextPageToken ? ' with pageToken' : ' (initial)'}`);
      
      try {
        const response = await axios({
          method: 'get',
          url: requestUrl,
          headers: {
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 second timeout per request
        });
        
        // Check if we got data
        if (!response.data || !response.data.forecastHours) {
          console.warn(`No forecast hours in response for request ${requestCount}`);
          break;
        }
        
        const hours = response.data.forecastHours;
        console.log(`Received ${hours.length} hours from request ${requestCount}`);
        
        // Add the hours to our collection
        allForecastHours.push(...hours);
        
        // Get the next page token for the next request
        nextPageToken = response.data.nextPageToken;
        
        // Store timezone from first response
        if (requestCount === 1 && response.data.timeZone) {
          allForecastHours.timeZone = response.data.timeZone;
        }
        
        console.log(`Total hours collected: ${allForecastHours.length}, Has nextPageToken: ${!!nextPageToken}`);
        
        // Stop if we have enough hours or no more pages
        if (allForecastHours.length >= totalHours || !nextPageToken) {
          break;
        }
        
        // Reduced delay between requests for better performance
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (requestError) {
        console.error(`Error in request ${requestCount}:`, requestError.message);
        
        if (requestError.response) {
          console.error('Response status:', requestError.response.status);
          console.error('Response data:', JSON.stringify(requestError.response.data, null, 2));
        }
        
        // If this is the first request, throw the error
        if (requestCount === 1) {
          throw requestError;
        }
        
        // For subsequent requests, log the error but continue with what we have
        console.warn(`Continuing with ${allForecastHours.length} hours from ${requestCount - 1} successful requests`);
        break;
      }
      
    } while (nextPageToken && requestCount < maxRequests && allForecastHours.length < totalHours);
    
    // Limit to requested hours if we got more
    if (allForecastHours.length > totalHours) {
      allForecastHours = allForecastHours.slice(0, totalHours);
    }
    
    console.log(`Google Weather API pagination complete: ${allForecastHours.length} hours from ${requestCount} requests`);
    
    // Return the complete response object
    const result = {
      forecastHours: allForecastHours,
      timeZone: allForecastHours.timeZone || {
        id: "America/Los_Angeles",
        version: ""
      },
      paginationInfo: {
        totalHoursRetrieved: allForecastHours.length,
        maxHoursRequested: totalHours,
        requestsMade: requestCount,
        approach: "proper-pagination-with-pageToken"
      }
    };
    
    // Cache the result for future requests
    saveToServerCache(cacheKey, result, GOOGLE_WEATHER_CACHE_DURATION);
    
    return result;
  } catch (error) {
    console.error('Error in Google Weather forecast function:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(`Google Weather API failed: ${error.message}. Unable to retrieve weather data.`);
  }
}

// GET /api/weather/:zipCode
router.get('/:zipCode', async (req, res, next) => {
  try {
    const { zipCode } = req.params;
    const { source = 'azuremaps', forceRefresh = 'false' } = req.query;
    
    // Validate ZIP code
    if (!validateZipCode(zipCode)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid ZIP code. Must be 5 digits.'
      });
    }
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = getCacheKey(zipCode, source);
    if (forceRefresh !== 'true') {
      const cached = getFromServerCache(cacheKey);
      if (cached) {
        console.log(`Returning cached data for ${source} - ${zipCode}`);
        return res.json(cached);
      }
    }
    
    // Fetch location data first (common for all sources)
    const locationData = await fetchAzureMapsLocation(zipCode);
    
    // Extract coordinates
    const coordinates = locationData.results?.[0]?.position;
    
    if (!coordinates || !coordinates.lat || !coordinates.lon) {
      return res.status(404).json({
        error: true,
        message: `Could not determine coordinates for ZIP code: ${zipCode}`
      });
    }
    
    // Prepare location object
    const location = {
      zipCode,
      city: locationData.results[0].address.municipality || 'Unknown',
      state: locationData.results[0].address.countrySubdivision || 'Unknown',
      country: locationData.results[0].address.country || 'US',
      coordinates: {
        latitude: coordinates.lat,
        longitude: coordinates.lon
      }
    };
    
    let weatherData;
    
    // Fetch weather data based on requested source
    switch (source.toLowerCase()) {
      case 'azuremaps':
        // Fetch both daily and hourly forecasts in parallel
        const [dailyData, hourlyData] = await Promise.all([
          fetchAzureMapsDailyForecast(coordinates.lat, coordinates.lon),
          fetchAzureMapsHourlyForecast(coordinates.lat, coordinates.lon)
        ]);
        
        // Transform the data using the transformer utility functions
        const azureTransformedDaily = transformers.transformAzureMapsDaily(dailyData);
        
        // Transform hourly data properly
        const azureTransformedHourly = transformers.transformAzureMapsHourly(hourlyData);
        
        // Combine all data
        weatherData = transformers.combineAzureMapsData(location, azureTransformedDaily);
        
        // Replace the hourly data with properly transformed hourly data
        weatherData.hourly = azureTransformedHourly;
        break;
        
      case 'openmeteo':
        const meteoData = await fetchOpenMeteoForecast(coordinates.lat, coordinates.lon);
        
        // Transform the data properly using transformers
        const meteoTransformedHourly = transformers.transformOpenMeteoHourly(meteoData);
        const meteoTransformedDaily = transformers.transformOpenMeteoDaily(meteoData);
        const meteoTransformedCurrent = transformers.createOpenMeteoCurrent(meteoData);
        
        // Create properly structured weather data
        weatherData = {
          location,
          current: meteoTransformedCurrent,
          daily: meteoTransformedDaily,
          hourly: meteoTransformedHourly,
          source: 'OpenMeteo',
          lastUpdated: Date.now()
        };
        break;
        
      case 'foreca':
        try {
          // Updated to use RapidAPI for Foreca data
          const { locationId } = await fetchForecaLocationId(zipCode);
          // No longer fetching daily forecast data
          const [currentData, hourlyData] = await Promise.all([
            fetchForecaCurrent(locationId),
            fetchForecaHourlyForecast(locationId)
          ]);
          
          // Check if we hit rate limits
          const isRateLimited =
            (currentData && currentData.status === 429) ||
            (hourlyData && hourlyData.status === 429);
          
          if (isRateLimited) {
            throw new Error('Foreca API rate limit exceeded (429)');
          }
          
          // Use the new combineForecaData function
          // Pass null for dailyData since we've removed that functionality
          weatherData = transformers.combineForecaData(
            location,
            currentData,
            null,
            hourlyData
          );
        } catch (error) {
          console.error('Error processing Foreca data:', error.message);
          
          // Check if it's a rate limit error
          const isRateLimited = error.message.includes('429') || error.message.includes('rate limit');
          
          // Create a properly structured response with error information
          // Use our new combineForecaData function with null data to handle the error gracefully
          weatherData = transformers.combineForecaData(
            location,
            isRateLimited ? { status: 429 } : null,
            null,
            isRateLimited ? { status: 429 } : null
          );
          
          // Add error information
          weatherData.isError = true;
          weatherData.rateLimited = isRateLimited;
          weatherData.errorMessage = isRateLimited
            ? 'Rate limit exceeded (429). Using mock data.'
            : `Error fetching Foreca data: ${error.message}`;
        }
        
        // No need for this block anymore as it's handled in the try/catch above
        break;
        
      case 'googleweather':
        try {
          // Fetch Google Weather API forecast
          const googleWeatherData = await fetchGoogleWeatherForecast(coordinates.lat, coordinates.lon);
          
          // Transform the data using our transformer functions
          weatherData = transformers.combineGoogleWeatherData(location, googleWeatherData);
          
          // Check if the data is from the real API or mock data
          // The real API response has a different structure than the mock data
          // Mock data has forecastHours with simple objects, while real data has more complex nested objects
          const isMockData = googleWeatherData.forecastHours &&
                            googleWeatherData.forecastHours.length > 0 &&
                            !googleWeatherData.forecastHours[0].weatherCondition;
          
          if (isMockData) {
            // Add a note that this is mock data due to API error
            weatherData.isMockData = true;
            weatherData.mockDataReason = "Google Weather API request failed";
          }
        } catch (error) {
          console.error('Error processing Google Weather data:', error.message);
          
          // Create a properly structured response with error information
          weatherData = {
            location,
            current: {
              temperature: 72,
              feelsLike: 70,
              humidity: 65,
              windSpeed: 8,
              windDirection: 270,
              description: 'Partly Cloudy',
              icon: 'partly-sunny',
              precipitation: {
                probability: 20,
                amount: 0.1,
                type: 'rain'
              }
            },
            hourly: [],
            daily: [],
            source: 'GoogleWeather',
            lastUpdated: Date.now(),
            isError: true,
            isMockData: true,
            mockDataReason: "Google Weather API is currently unavailable",
            errorMessage: `Error fetching Google Weather data: ${error.message}`
          };
        }
        break;
        
      default:
        return res.status(400).json({
          error: true,
          message: `Unsupported weather source: ${source}`
        });
    }
    
    // Cache the result for future requests
    saveToServerCache(cacheKey, weatherData);
    
    // Return the weather data
    res.json(weatherData);
  } catch (error) {
    next(error);
  }
});

// GET /api/weather/:zipCode/triple
router.get('/:zipCode/triple', async (req, res, next) => {
  try {
    const { zipCode } = req.params;
    const { forceRefresh = 'false' } = req.query;
    
    // Validate ZIP code
    if (!validateZipCode(zipCode)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid ZIP code. Must be 5 digits.'
      });
    }
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = getCacheKey(zipCode, 'triple');
    if (forceRefresh !== 'true') {
      const cached = getFromServerCache(cacheKey);
      if (cached) {
        console.log(`Returning cached triple check data for ${zipCode}`);
        return res.json(cached);
      }
    }
    
    // Fetch location data first (needed for all sources)
    const locationData = await fetchAzureMapsLocation(zipCode);
    const coordinates = locationData.results?.[0]?.position;
    
    if (!coordinates || !coordinates.lat || !coordinates.lon) {
      return res.status(404).json({
        error: true,
        message: `Could not determine coordinates for ZIP code: ${zipCode}`
      });
    }
    
    // Prepare location object
    const location = {
      zipCode,
      city: locationData.results[0].address.municipality || 'Unknown',
      state: locationData.results[0].address.countrySubdivision || 'Unknown',
      country: locationData.results[0].address.country || 'US',
      coordinates: {
        latitude: coordinates.lat,
        longitude: coordinates.lon
      }
    };

    // Fetch data from all four sources in parallel using direct API calls
    // Order changed to: Google → AccuWeather → Foreca → NOAA (OpenMeteo)
    const promises = [
      // Google Weather (first row)
      fetchGoogleWeatherForecast(coordinates.lat, coordinates.lon).then(googleWeatherData => {
        const weatherData = transformers.combineGoogleWeatherData(location, googleWeatherData);
        
        // Check if the data is from the real API or mock data
        const isMockData = googleWeatherData.forecastHours &&
                          googleWeatherData.forecastHours.length > 0 &&
                          !googleWeatherData.forecastHours[0].weatherCondition;
        
        if (isMockData) {
          weatherData.isMockData = true;
          weatherData.mockDataReason = "Google Weather API request failed";
        }
        return weatherData;
      }).catch(error => ({
        location,
        current: {
          temperature: 72,
          feelsLike: 70,
          humidity: 65,
          windSpeed: 8,
          windDirection: 270,
          description: 'Partly Cloudy',
          icon: 'partly-sunny',
          precipitation: {
            probability: 20,
            amount: 0.1,
            type: 'rain'
          }
        },
        hourly: [],
        daily: [],
        source: 'GoogleWeather',
        lastUpdated: Date.now(),
        isError: true,
        isMockData: true,
        mockDataReason: "Google Weather API is currently unavailable",
        errorMessage: `Error fetching Google Weather data: ${error.message}`
      })),

      // Azure Maps / AccuWeather (second row)
      Promise.all([
        fetchAzureMapsDailyForecast(coordinates.lat, coordinates.lon),
        fetchAzureMapsHourlyForecast(coordinates.lat, coordinates.lon)
      ]).then(([dailyData, hourlyData]) => {
        const azureTransformedDaily = transformers.transformAzureMapsDaily(dailyData);
        const azureTransformedHourly = transformers.transformAzureMapsHourly(hourlyData);
        const weatherData = transformers.combineAzureMapsData(location, azureTransformedDaily);
        weatherData.hourly = azureTransformedHourly;
        return weatherData;
      }).catch(error => ({
        location,
        source: 'AzureMaps',
        isError: true,
        errorMessage: error.message || 'Failed to fetch Azure Maps data'
      })),

      // Foreca (third row)
      fetchForecaLocationId(zipCode).then(({ locationId }) =>
        Promise.all([
          fetchForecaCurrent(locationId),
          fetchForecaHourlyForecast(locationId)
        ]).then(([currentData, hourlyData]) => {
          // Check if we hit rate limits
          const isRateLimited =
            (currentData && currentData.status === 429) ||
            (hourlyData && hourlyData.status === 429);
          
          if (isRateLimited) {
            throw new Error('Foreca API rate limit exceeded (429)');
          }
          
          return transformers.combineForecaData(location, currentData, null, hourlyData);
        })
      ).catch(error => {
        const isRateLimited = error.message.includes('429') || error.message.includes('rate limit');
        const weatherData = transformers.combineForecaData(
          location,
          isRateLimited ? { status: 429 } : null,
          null,
          isRateLimited ? { status: 429 } : null
        );
        
        weatherData.isError = true;
        weatherData.rateLimited = isRateLimited;
        weatherData.errorMessage = isRateLimited
          ? 'Rate limit exceeded (429). Using mock data.'
          : `Error fetching Foreca data: ${error.message}`;
        return weatherData;
      }),

      // Open Meteo / NOAA (fourth row)
      fetchOpenMeteoForecast(coordinates.lat, coordinates.lon).then(meteoData => {
        const meteoTransformedHourly = transformers.transformOpenMeteoHourly(meteoData);
        const meteoTransformedDaily = transformers.transformOpenMeteoDaily(meteoData);
        const meteoTransformedCurrent = transformers.createOpenMeteoCurrent(meteoData);
        
        return {
          location,
          current: meteoTransformedCurrent,
          daily: meteoTransformedDaily,
          hourly: meteoTransformedHourly,
          source: 'OpenMeteo',
          lastUpdated: Date.now()
        };
      }).catch(error => ({
        location,
        source: 'OpenMeteo',
        isError: true,
        errorMessage: error.message || 'Failed to fetch Open Meteo data'
      }))
    ];
    
    const results = await Promise.all(promises);
    
    // Cache the results for future requests
    saveToServerCache(cacheKey, results);
    
    // Return the combined data
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// No longer need cache clear endpoint

module.exports = router;