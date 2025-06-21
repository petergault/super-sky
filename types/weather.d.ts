/**
 * Weather Types
 *
 * This file contains TypeScript type definitions for the weather data.
 * In a full TypeScript setup, these would be used for type checking.
 * In our current setup, they serve as documentation.
 */

/**
 * ZIP Code validation result
 */
interface ZipCodeValidation {
  isValid: boolean;
  error: string | null;
}

/**
 * Location information
 */
interface Location {
  zipCode: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  // AccuWeather specific
  locationKey?: string;
  // Foreca specific
  locationId?: string;
}

/**
 * Precipitation data
 */
interface Precipitation {
  probability: number; // 0-100
  amount: number; // in inches
  type?: 'rain' | 'snow' | 'ice' | 'mixed';
}

/**
 * Basic weather data structure
 */
interface WeatherData {
  temperature: number; // in Fahrenheit
  feelsLike: number; // in Fahrenheit
  humidity: number; // 0-100
  windSpeed: number; // in mph
  windDirection?: number; // in degrees
  windGust?: number; // in mph
  pressure?: number; // in inHg
  uvIndex?: number; // 0-11+
  visibility?: number; // in miles
  cloudCover?: number; // 0-100
  description: string;
  icon: string;
  precipitation: Precipitation;
  // Raw data from provider for reference/debugging
  rawData?: any;
}

/**
 * Weather forecast for a specific time period
 */
interface ForecastItem extends WeatherData {
  timestamp: number; // Unix timestamp
  date: string; // Formatted date
  time: string; // Formatted time
  isDay?: boolean; // Whether it's daytime
  // For daily forecasts
  temperatureMin?: number;
  temperatureMax?: number;
  sunrise?: number; // Unix timestamp
  sunset?: number; // Unix timestamp
}

/**
 * Complete weather forecast
 */
interface WeatherForecast {
  location: Location;
  current: WeatherData;
  hourly: ForecastItem[];
  daily: ForecastItem[];
  source: 'AzureMaps' | 'OpenMeteo' | 'Foreca';
  lastUpdated: number; // Unix timestamp
  // For error handling
  isError?: boolean;
  errorMessage?: string;
}

/**
 * API response types for Open Meteo
 */
interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weathercode: number[];
    surface_pressure: number[];
    visibility: number[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    uv_index: number[];
    is_day: number[];
  };
  daily?: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    winddirection_10m_dominant: number[];
    uv_index_max: number[];
  };
  hourly_units?: {
    [key: string]: string;
  };
  daily_units?: {
    [key: string]: string;
  };
}

/**
 * Open Meteo Weather Code Mapping
 * Used to map WMO weather codes to descriptions and icons
 */
interface WeatherCodeMapping {
  description: string;
  icon: string;
}

/**
 * API response types for Azure Maps
 */
interface AzureMapsSearchResponse {
  summary: {
    query: string;
    queryType: string;
    queryTime: number;
    numResults: number;
    offset: number;
    totalResults: number;
    fuzzyLevel: number;
  };
  results: Array<{
    type: string;
    id: string;
    score: number;
    address: {
      streetNumber: string;
      streetName: string;
      municipalitySubdivision: string;
      municipality: string;
      countrySecondarySubdivision: string;
      countrySubdivision: string;
      postalCode: string;
      countryCode: string;
      country: string;
      countryCodeISO3: string;
      freeformAddress: string;
      localName: string;
    };
    position: {
      lat: number;
      lon: number;
    };
    viewport: {
      topLeftPoint: {
        lat: number;
        lon: number;
      };
      btmRightPoint: {
        lat: number;
        lon: number;
      };
    };
  }>;
}

interface AzureMapsDailyForecastResponse {
  forecasts: Array<{
    date: string;
    temperature: {
      minimum: {
        value: number;
        unit: string;
      };
      maximum: {
        value: number;
        unit: string;
      };
    };
    realFeelTemperature: {
      minimum: {
        value: number;
        unit: string;
      };
      maximum: {
        value: number;
        unit: string;
      };
    };
    day: {
      iconCode: number;
      iconPhrase: string;
      hasPrecipitation: boolean;
      precipitationType?: string;
      precipitationIntensity?: string;
      shortPhrase: string;
      longPhrase: string;
      precipitationProbability: number;
      thunderstormProbability: number;
      rainProbability: number;
      snowProbability: number;
      iceProbability: number;
      wind: {
        speed: {
          value: number;
          unit: string;
        };
        direction: {
          degrees: number;
          localizedDescription: string;
        };
      };
      windGust: {
        speed: {
          value: number;
          unit: string;
        };
      };
      totalLiquid: {
        value: number;
        unit: string;
      };
      rain: {
        value: number;
        unit: string;
      };
      snow: {
        value: number;
        unit: string;
      };
      ice: {
        value: number;
        unit: string;
      };
      hoursOfPrecipitation: number;
      hoursOfRain: number;
      hoursOfSnow: number;
      hoursOfIce: number;
      cloudCover: number;
    };
    night: {
      iconCode: number;
      iconPhrase: string;
      hasPrecipitation: boolean;
      precipitationType?: string;
      precipitationIntensity?: string;
      shortPhrase: string;
      longPhrase: string;
      precipitationProbability: number;
      thunderstormProbability: number;
      rainProbability: number;
      snowProbability: number;
      iceProbability: number;
      wind: {
        speed: {
          value: number;
          unit: string;
        };
        direction: {
          degrees: number;
          localizedDescription: string;
        };
      };
      windGust: {
        speed: {
          value: number;
          unit: string;
        };
      };
      totalLiquid: {
        value: number;
        unit: string;
      };
      rain: {
        value: number;
        unit: string;
      };
      snow: {
        value: number;
        unit: string;
      };
      ice: {
        value: number;
        unit: string;
      };
      hoursOfPrecipitation: number;
      hoursOfRain: number;
      hoursOfSnow: number;
      hoursOfIce: number;
      cloudCover: number;
    };
    sun: {
      rise: string;
      epochRise: number;
      set: string;
      epochSet: number;
    };
    moon: {
      rise: string;
      epochRise: number;
      set: string;
      epochSet: number;
      phase: string;
      age: number;
    };
  }>;
}

/**
 * Props for the ZipCodeInput component
 */
interface ZipCodeInputProps {
  onSubmit: (zipCode: string) => void;
  recentZipCodes?: string[];
}

/**
 * Props for the WeatherDisplay component
 */
interface WeatherDisplayProps {
  zipCode?: string;
  weatherData?: WeatherForecast | WeatherForecast[];
  isLoading?: boolean;
  error?: string | null;
}