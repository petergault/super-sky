# Code Documentation for Azure Maps API Integration

This document contains the code comments that should be added to the JavaScript files to document the Azure Maps API integration. Since Architect mode can only edit Markdown files, these comments are provided here for reference and can be added to the actual code files later.

## routes/weather.js

### Azure Maps Location API Function

```javascript
/**
 * Fetch location data from Azure Maps API using ZIP code
 * 
 * This function calls the Azure Maps Search API to convert a ZIP code to geographic coordinates
 * and location information. It uses the /search/address/json endpoint with the following parameters:
 * - api-version: 1.0
 * - subscription-key: Azure Maps API key from environment variables
 * - query: ZIP code provided by the user
 * - countrySet: US (restricts search to United States)
 * - limit: 1 (returns only the top result)
 * 
 * The response includes detailed address information and coordinates that are used for
 * subsequent weather API calls.
 * 
 * @param {string} zipCode - 5-digit US ZIP code
 * @returns {Promise<Object>} - Promise resolving to location data from Azure Maps
 * @throws {Error} - If API key is missing or if the API request fails
 */
async function fetchAzureMapsLocation(zipCode) {
  // Function implementation...
}
```

### Azure Maps Daily Forecast API Function

```javascript
/**
 * Fetch daily forecast from Azure Maps API
 * 
 * This function calls the Azure Maps Weather API to get daily weather forecasts for a specific
 * location. It uses the /weather/forecast/daily/json endpoint with the following parameters:
 * - api-version: 1.1
 * - subscription-key: Azure Maps API key from environment variables
 * - query: Latitude and longitude coordinates
 * - duration: 5 (number of days to forecast)
 * - unit: imperial (use imperial units for US audience)
 * 
 * The response includes daily forecasts with temperature, precipitation, and other weather data.
 * 
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} - Promise resolving to daily forecast data
 * @throws {Error} - If API key is missing or if the API request fails
 */
async function fetchAzureMapsDailyForecast(latitude, longitude) {
  // Function implementation...
}
```

### Azure Maps Hourly Forecast API Function

```javascript
/**
 * Fetch hourly forecast from Azure Maps API
 * 
 * This function calls the Azure Maps Weather API to get hourly weather forecasts for a specific
 * location. It uses the /weather/forecast/hourly/json endpoint with the following parameters:
 * - api-version: 1.1
 * - subscription-key: Azure Maps API key from environment variables
 * - query: Latitude and longitude coordinates
 * - duration: 24 (number of hours to forecast)
 * - unit: imperial (use imperial units for US audience)
 * - language: en-US (language for text descriptions)
 * 
 * The response includes hourly forecasts with temperature, precipitation probability, and other
 * weather data for the next 24 hours.
 * 
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} - Promise resolving to hourly forecast data
 * @throws {Error} - If API key is missing or if the API request fails
 */
async function fetchAzureMapsHourlyForecast(latitude, longitude) {
  // Function implementation...
}
```

### Weather Route Handler

```javascript
/**
 * GET /api/weather/:zipCode
 * 
 * This route handler fetches weather data for a specific ZIP code from the requested source.
 * It first validates the ZIP code, then fetches location data using Azure Maps Search API,
 * and finally fetches weather data from the specified source.
 * 
 * Query Parameters:
 * - source: Weather data source (azuremaps, openmeteo, foreca, googleweather). Default is 'azuremaps'.
 * 
 * For Azure Maps source, it fetches both daily and hourly forecasts in parallel and combines
 * them into a standardized response format.
 * 
 * The response includes:
 * - location: Information about the location (city, state, coordinates)
 * - current: Current weather conditions
 * - daily: Daily forecast for the next 5 days
 * - hourly: Hourly forecast for the next 24 hours
 * - source: The data source (AzureMaps)
 * - lastUpdated: Timestamp of when the data was fetched
 * 
 * Error Handling:
 * - 400 Bad Request: If the ZIP code is invalid
 * - 404 Not Found: If coordinates cannot be determined for the ZIP code
 * - 400 Bad Request: If the requested source is unsupported
 * - 500 Internal Server Error: For other errors
 */
router.get('/:zipCode', async (req, res, next) => {
  // Route handler implementation...
});
```

## services/weatherService.js

### Fetch With Retry Function

```javascript
/**
 * Fetches data with retry logic
 * 
 * This function implements a retry mechanism with exponential backoff for API requests.
 * It attempts to fetch data using the provided function and arguments, and retries
 * if the request fails. Each retry has an increasing delay to prevent overwhelming
 * the API server.
 * 
 * This is particularly useful for Azure Maps API calls which may occasionally fail
 * due to network issues or rate limiting.
 * 
 * @param {Function} fetchFunction - The function to fetch data
 * @param {Array} args - Arguments to pass to the fetch function
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} delay - Initial delay between retries in milliseconds (default: 1000)
 * @returns {Promise<Object>} - A promise that resolves to the fetched data
 * @throws {Error} - If all retry attempts fail
 */
async function fetchWithRetry(fetchFunction, args = [], maxRetries = MAX_RETRY_ATTEMPTS, delay = RETRY_DELAY) {
  // Function implementation...
}
```

### Fetch Azure Maps Data Function

```javascript
/**
 * Fetches complete weather data from Azure Maps for a given ZIP code
 * 
 * This function makes a request to the backend API endpoint which in turn calls
 * the Azure Maps API. It uses the /api/weather/:zipCode endpoint with the azuremaps
 * source parameter.
 * 
 * The function includes error handling to provide mock data if the API request fails,
 * ensuring the application can continue to function even when the API is unavailable.
 * 
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchAzureMapsData(zipCode) {
  // Function implementation...
}
```

### Fetch Weather Data Function

```javascript
/**
 * Fetches weather data for a given ZIP code with retry logic
 * 
 * This function uses the fetchWithRetry utility to make a robust request for
 * weather data from Azure Maps. It handles errors and provides fallback mock
 * data if all retry attempts fail.
 * 
 * @param {string} zipCode - The ZIP code to fetch weather data for
 * @param {boolean} forceRefresh - Whether to force a refresh (bypass cache)
 * @returns {Promise<Object>} - A promise that resolves to weather data
 */
async function fetchWeatherData(zipCode, forceRefresh = false) {
  // Function implementation...
}
```

## server.js

### CORS and Security Configuration

```javascript
/**
 * Security middleware configuration
 * 
 * This configuration sets up security headers using the helmet middleware,
 * including Content Security Policy (CSP) directives that allow connections
 * to the Azure Maps API.
 * 
 * The connectSrc directive specifically includes:
 * - 'self': Allow connections to the same origin
 * - https://atlas.microsoft.com: Allow connections to Azure Maps API
 * - Other necessary domains for the application
 * 
 * This configuration is essential for the frontend to be able to display
 * maps and other content from Azure Maps.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.openweathermap.org", "https://atlas.microsoft.com", "http://localhost:3000", "http://localhost:8080"]
    }
  }
}));
```

### Google Weather API Function

```javascript
/**
 * Fetch Google Weather API forecast
 *
 * NOTE: This function returns mock data as the Google Weather API
 * endpoint (https://weather.googleapis.com/v1/forecast/hours:lookup)
 * appears to be unavailable or deprecated.
 *
 * The function generates realistic mock data that matches the expected structure
 * of the Google Weather API response. It includes:
 * - 24 hours of hourly forecast data
 * - Realistic temperature ranges and weather conditions
 * - Proper time progression
 * - All expected data fields (temperature, precipitation, etc.)
 *
 * The response includes flags to indicate that it's mock data:
 * - isMockData: true
 * - mockDataReason: "Google Weather API is currently unavailable"
 *
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} - Promise resolving to mock Google Weather forecast data
 */
async function fetchGoogleWeatherForecast(latitude, longitude) {
  // Function implementation...
}
```

### Google Weather Data Transformation Functions

```javascript
/**
 * Map Google Weather API condition code to standardized icon name
 *
 * This function converts Google Weather condition codes to our application's
 * standardized icon names. It handles different icons for day and night conditions.
 *
 * @param {string} conditionCode - Google Weather API condition code
 * @param {boolean} isDay - Whether it's daytime
 * @returns {string} - Standardized icon name
 */
function mapGoogleWeatherIcon(conditionCode, isDay = true) {
  // Function implementation...
}

/**
 * Determine precipitation type from Google Weather API condition
 *
 * This function analyzes the condition code to determine the type of precipitation
 * (rain, snow, ice, or mixed).
 *
 * @param {string} conditionCode - Google Weather API condition code
 * @returns {string|undefined} - Precipitation type
 */
function determineGooglePrecipType(conditionCode) {
  // Function implementation...
}

/**
 * Transform Google Weather API hourly forecast to standardized format
 *
 * This function converts the Google Weather API hourly forecast data to our
 * application's standardized format for consistent display and comparison.
 *
 * @param {Object} forecastData - Google Weather API forecast response
 * @returns {Array} - Standardized hourly forecast data
 */
function transformGoogleWeatherHourly(forecastData) {
  // Function implementation...
}

/**
 * Create current weather data from Google Weather API data
 *
 * This function extracts current weather conditions from the first hour of
 * the Google Weather API forecast data.
 *
 * @param {Object} forecastData - Google Weather API forecast response
 * @returns {Object} - Current weather data
 */
function createGoogleWeatherCurrent(forecastData) {
  // Function implementation...
}

/**
 * Combine all Google Weather data into a standardized forecast
 *
 * This function combines location data with transformed Google Weather data
 * into our application's standardized format.
 *
 * @param {Object} location - Location data
 * @param {Object} forecastData - Google Weather API forecast data
 * @returns {Object} - Complete standardized forecast
 */
function combineGoogleWeatherData(location, forecastData) {
  // Function implementation...
}
```

These code comments provide detailed documentation for the API integrations in the application. They explain the purpose of each function, the parameters they accept, the expected return values, and any error handling that's implemented. They also include information about the API endpoints, parameters, and response formats.

For more information about the Google Weather API issue and mock data implementation, see the [GOOGLE_WEATHER_API_ISSUE.md](GOOGLE_WEATHER_API_ISSUE.md) document.