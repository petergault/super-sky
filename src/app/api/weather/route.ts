import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const GOOGLE_WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for expensive Google Weather calls

// In-memory cache for server-side caching
const serverCache = new Map();

/**
 * Get data from server cache
 */
function getFromServerCache(key: string, maxAge = CACHE_DURATION) {
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
function saveToServerCache(key: string, data: any, maxAge = CACHE_DURATION) {
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
 * Transform Azure Maps weather data to our standard format
 */
function transformAzureMapsWeather(data: any, zipCode: string, locationInfo?: any) {
  if (!data || !data.results || !data.results[0]) {
    throw new Error('Invalid Azure Maps weather data received');
  }

  const result = data.results[0];
  
  // Use location info from the search if available, otherwise fallback to weather data
  const location = {
    city: locationInfo?.address?.municipality || result.location?.city || 'Unknown',
    state: locationInfo?.address?.countrySubdivision || result.location?.countrySubdivision || 'Unknown',
    zipCode: zipCode
  };
  
  return {
    service: 'Azure Maps (AccuWeather)',
    location,
    current: {
      temperature: result.temperature?.value || 0,
      feelsLike: result.realFeelTemperature?.value || 0,
      description: result.phrase || 'Unknown',
      humidity: result.relativeHumidity || 0,
      windSpeed: result.wind?.speed?.value || 0,
      windDirection: result.wind?.direction?.degrees || 0,
      pressure: result.pressure?.value || 0,
      visibility: result.visibility?.value || 0,
      uvIndex: result.uvIndex || 0,
      cloudCover: result.cloudCover || 0
    },
    forecast: [],
    hourly: [],
    cached: false,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch location data from Azure Maps API using ZIP code
 */
async function fetchAzureMapsLocation(zipCode: string) {
  const apiKey = process.env.AZURE_MAPS_API_KEY;
  const baseUrl = process.env.AZURE_MAPS_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    throw new Error('Azure Maps API credentials not configured');
  }

  const url = `${baseUrl}/search/address/json`;
  
  try {
    const response = await axios.get(url, {
      params: {
        'api-version': '1.0',
        'subscription-key': apiKey,
        'query': zipCode,
        'countrySet': 'US',
        'limit': '1'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Super-Sky-Weather-App/1.0'
      }
    });

    if (!response.data || !response.data.results || response.data.results.length === 0) {
      throw new Error(`No location found for ZIP code: ${zipCode}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Azure Maps location API error:', error.message);
    if (error.response) {
      console.error('Azure Maps location API response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch weather data from Azure Maps API using coordinates
 */
async function fetchAzureMapsWeather(zipCode: string) {
  const apiKey = process.env.AZURE_MAPS_API_KEY;
  const baseUrl = process.env.AZURE_MAPS_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    throw new Error('Azure Maps API credentials not configured');
  }

  try {
    // First, get coordinates from ZIP code
    const locationData = await fetchAzureMapsLocation(zipCode);
    const coordinates = locationData.results?.[0]?.position;
    
    if (!coordinates || !coordinates.lat || !coordinates.lon) {
      throw new Error(`Could not determine coordinates for ZIP code: ${zipCode}`);
    }

    // Now fetch weather using coordinates
    const weatherUrl = `${baseUrl}/weather/currentConditions/json?api-version=1.0&query=${coordinates.lat},${coordinates.lon}&subscription-key=${apiKey}`;
    
    const response = await axios.get(weatherUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Super-Sky-Weather-App/1.0'
      }
    });

    if (!response.data) {
      throw new Error('No data received from Azure Maps API');
    }

    return transformAzureMapsWeather(response.data, zipCode, locationData.results[0]);
  } catch (error: any) {
    console.error('Azure Maps API error:', error.message);
    if (error.response) {
      console.error('Azure Maps API response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch comparison weather data from multiple services
 */
async function fetchComparisonWeatherData(zipCode: string) {
  const cacheKey = `comparison-weather-${zipCode}`;
  const cached = getFromServerCache(cacheKey);
  
  if (cached) {
    return { ...cached, cached: true };
  }

  const services = [];
  
  try {
    // Fetch Azure Maps data
    try {
      const azureData = await fetchAzureMapsWeather(zipCode);
      services.push({
        source: 'AzureMaps',
        ...azureData,
        isError: false
      });
    } catch (error) {
      console.error('Azure Maps service error:', error);
      services.push({
        source: 'AzureMaps',
        isError: true,
        errorMessage: 'Failed to fetch Azure Maps data',
        location: { zipCode }
      });
    }

    // Mock data for other services until they're implemented
    // OpenMeteo service (placeholder)
    services.push({
      source: 'OpenMeteo',
      isError: true,
      errorMessage: 'Service not implemented yet',
      location: { zipCode }
    });

    // Foreca service (placeholder)
    services.push({
      source: 'Foreca',
      isError: true,
      errorMessage: 'Service not implemented yet',
      location: { zipCode }
    });

    // Google Weather service (placeholder)
    services.push({
      source: 'GoogleWeather',
      isError: true,
      errorMessage: 'Service not implemented yet',
      location: { zipCode }
    });

    const result = {
      zipCode,
      services,
      timestamp: new Date().toISOString(),
      cached: false
    };

    saveToServerCache(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error('Error fetching comparison weather data:', error.message);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const zipCode = searchParams.get('zipCode');
  const service = searchParams.get('service') || 'azure';
  const type = searchParams.get('type') || 'current';

  if (!zipCode) {
    return NextResponse.json(
      { error: 'ZIP code is required' },
      { status: 400 }
    );
  }

  // Validate ZIP code format (5 digits, optionally followed by dash and 4 more digits)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zipCode)) {
    return NextResponse.json(
      { error: 'Invalid ZIP code format' },
      { status: 400 }
    );
  }

  try {
    if (type === 'comparison') {
      const data = await fetchComparisonWeatherData(zipCode);
      return NextResponse.json(data);
    } else {
      // Single service request
      let data;
      switch (service) {
        case 'azure':
          data = await fetchAzureMapsWeather(zipCode);
          break;
        default:
          return NextResponse.json(
            { error: 'Unsupported weather service' },
            { status: 400 }
          );
      }
      
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Weather API error:', error.message);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}