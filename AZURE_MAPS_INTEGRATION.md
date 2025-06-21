# Azure Maps API Integration Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Authentication and Configuration](#authentication-and-configuration)
- [Data Flow](#data-flow)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Recent Fixes](#recent-fixes)
- [Developer Guide](#developer-guide)
  - [Testing the API Integration](#testing-the-api-integration)
  - [Extending Functionality](#extending-functionality)
  - [Best Practices](#best-practices)

## Overview

The Super Sky App integrates with Azure Maps API to provide accurate weather forecasts and location data. Azure Maps serves as one of the three weather data sources in the application, alongside Open Meteo and Foreca. The Azure Maps API provides geocoding services to convert ZIP codes to coordinates and weather forecast data (both daily and hourly).

Azure Maps was chosen for its reliability, comprehensive data, and integration with AccuWeather as the underlying data source. This integration enables the application to provide users with accurate location-based weather forecasts and contributes to the app's core functionality of comparing forecasts from multiple sources.

## Architecture

The application uses a backend-first approach for API integration, where all API calls to Azure Maps are made from the server side. This architecture provides several benefits:

- **Security**: API keys are stored securely on the server and never exposed to the client
- **Centralized Management**: All API interactions are managed in one place
- **Standardized Data**: Responses from different weather services are standardized before being sent to the client
- **Caching**: Server-side caching reduces the number of API calls and improves performance

### Architecture Diagram

```
┌─────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│  Client │────▶│  Backend    │────▶│  Azure Maps   │────▶│ AccuWeather │
│ Browser │◀────│  Express    │◀────│  API Gateway  │◀────│ Data Source │
└─────────┘     └─────────────┘     └───────────────┘     └─────────────┘
                       │
                       │
                       ▼
                ┌─────────────┐
                │  Other API  │
                │  Sources    │
                └─────────────┘
```

## API Endpoints

The application uses the following Azure Maps API endpoints:

### 1. Search Address API

**Endpoint**: `${AZURE_MAPS_BASE_URL}/search/address/json`

**Purpose**: Convert ZIP codes to geographic coordinates and location information

**Parameters**:
- `api-version`: '1.0'
- `subscription-key`: API key for authentication
- `query`: ZIP code to search for
- `countrySet`: 'US' (restricts search to United States)
- `limit`: '1' (returns only the top result)

**Example Request**:
```javascript
const url = `${process.env.AZURE_MAPS_BASE_URL}/search/address/json`;
const response = await axios.get(url, {
  params: {
    'api-version': '1.0',
    'subscription-key': apiKey,
    'query': '10001',
    'countrySet': 'US',
    'limit': '1'
  }
});
```

**Example Response**:
```json
{
  "summary": {
    "query": "10001",
    "queryType": "NON_NEAR",
    "queryTime": 35,
    "numResults": 1,
    "offset": 0,
    "totalResults": 1,
    "fuzzyLevel": 1
  },
  "results": [
    {
      "type": "Geography",
      "id": "US/ZIP/10001",
      "score": 4.5,
      "address": {
        "streetName": "",
        "municipalitySubdivision": "Chelsea, Manhattan",
        "municipality": "New York",
        "countrySecondarySubdivision": "New York",
        "countrySubdivision": "NY",
        "postalCode": "10001",
        "countryCode": "US",
        "country": "United States",
        "countryCodeISO3": "USA",
        "freeformAddress": "10001, New York, NY"
      },
      "position": {
        "lat": 40.75054,
        "lon": -73.99689
      }
    }
  ]
}
```

### 2. Daily Forecast API

**Endpoint**: `${AZURE_MAPS_BASE_URL}/weather/forecast/daily/json`

**Purpose**: Retrieve daily weather forecasts for a specific location

**Parameters**:
- `api-version`: '1.1'
- `subscription-key`: API key for authentication
- `query`: Latitude and longitude coordinates (e.g., "40.75054,-73.99689")
- `duration`: '5' (number of days to forecast)
- `unit`: 'imperial' (use imperial units for US audience)

**Example Request**:
```javascript
const url = `${process.env.AZURE_MAPS_BASE_URL}/weather/forecast/daily/json`;
const response = await axios.get(url, {
  params: {
    'api-version': '1.1',
    'subscription-key': apiKey,
    'query': `${latitude},${longitude}`,
    'duration': '5',
    'unit': 'imperial'
  }
});
```

**Example Response Structure**:
```json
{
  "forecasts": [
    {
      "date": "2023-05-21",
      "day": {
        "iconCode": 1,
        "iconPhrase": "Sunny",
        "hasPrecipitation": false,
        "precipitationType": null,
        "precipitationIntensity": null,
        "shortPhrase": "Sunny and pleasant",
        "longPhrase": "Pleasant with plenty of sunshine",
        "precipitationProbability": 0,
        "thunderstormProbability": 0,
        "rainProbability": 0,
        "snowProbability": 0,
        "iceProbability": 0,
        "wind": { ... },
        "temperature": { ... },
        "realFeelTemperature": { ... }
      },
      "night": { ... },
      "sources": ["AccuWeather"]
    },
    // Additional days...
  ]
}
```

### 3. Hourly Forecast API

**Endpoint**: `${AZURE_MAPS_BASE_URL}/weather/forecast/hourly/json`

**Purpose**: Retrieve hourly weather forecasts for a specific location

**Parameters**:
- `api-version`: '1.1'
- `subscription-key`: API key for authentication
- `query`: Latitude and longitude coordinates (e.g., "40.75054,-73.99689")
- `duration`: '24' (number of hours to forecast)
- `unit`: 'imperial' (use imperial units for US audience)
- `language`: 'en-US' (language for text descriptions)

**Example Request**:
```javascript
const url = `${process.env.AZURE_MAPS_BASE_URL}/weather/forecast/hourly/json`;
const response = await axios.get(url, {
  params: {
    'api-version': '1.1',
    'subscription-key': apiKey,
    'query': `${latitude},${longitude}`,
    'duration': '24',
    'unit': 'imperial',
    'language': 'en-US'
  }
});
```

**Example Response Structure**:
```json
{
  "forecasts": [
    {
      "date": "2023-05-21T12:00:00-04:00",
      "iconCode": 1,
      "iconPhrase": "Sunny",
      "hasPrecipitation": false,
      "isDaylight": true,
      "temperature": {
        "value": 72,
        "unit": "F"
      },
      "realFeelTemperature": {
        "value": 74,
        "unit": "F"
      },
      "wind": { ... },
      "precipitationProbability": 0,
      "rainProbability": 0,
      "snowProbability": 0,
      "iceProbability": 0,
      "sources": ["AccuWeather"]
    },
    // Additional hours...
  ]
}
```

## Authentication and Configuration

### API Key Management

The Azure Maps API uses subscription key authentication. The API key is stored in the server's environment variables and is never exposed to the client.

#### Environment Variables

The following environment variables are required for Azure Maps integration:

```
# Azure Maps API (uses AccuWeather as the underlying data source)
AZURE_MAPS_API_KEY=YOUR_AZURE_MAPS_API_KEY
AZURE_MAPS_BASE_URL=https://atlas.microsoft.com
```

#### Setting Up API Keys

1. Sign up for an Azure account at [https://azure.microsoft.com/](https://azure.microsoft.com/)
2. Create an Azure Maps resource in the Azure portal
3. Navigate to the Authentication section of your Azure Maps resource
4. Copy the primary key
5. Add the key to your `.env` file as `AZURE_MAPS_API_KEY`

### Security Considerations

- **Never commit API keys to version control**
- **Use environment variables** for storing sensitive information
- **Implement rate limiting** to prevent API abuse
- **Set up proper CORS configuration** to restrict access to your API endpoints
- **Validate all user inputs** before using them in API requests

## Data Flow

The data flow for Azure Maps integration follows these steps:

1. **Client Request**: The client sends a request to the backend with a ZIP code
2. **Geocoding**: The backend uses Azure Maps Search API to convert the ZIP code to coordinates
3. **Weather Data Retrieval**: The backend uses the coordinates to fetch weather data from Azure Maps
4. **Data Transformation**: The backend transforms the Azure Maps response into a standardized format
5. **Response to Client**: The standardized data is sent back to the client
6. **Display**: The client displays the weather data to the user

### Data Transformation

The application standardizes data from all weather sources to ensure consistent display and comparison. For Azure Maps data, the transformation includes:

- Extracting location information (city, state, coordinates)
- Formatting temperature and precipitation data
- Standardizing time formats
- Extracting probability and intensity values for precipitation
- Mapping weather condition codes to standardized values

## Troubleshooting

### Common Issues

#### 1. API Key Issues

**Symptoms**:
- 401 Unauthorized responses
- Error messages about invalid API keys

**Solutions**:
- Verify the API key is correctly set in the `.env` file
- Check if the API key has expired or been revoked
- Ensure the API key has the correct permissions for the endpoints you're using

#### 2. Rate Limiting

**Symptoms**:
- 429 Too Many Requests responses
- Sudden failures after working correctly

**Solutions**:
- Implement caching to reduce the number of API calls
- Add exponential backoff retry logic
- Consider upgrading your Azure Maps subscription tier

#### 3. Data Format Changes

**Symptoms**:
- Unexpected null or undefined values
- Application errors when processing API responses

**Solutions**:
- Add robust error handling and data validation
- Keep up with Azure Maps API documentation for any changes
- Implement graceful degradation when data is missing

#### 4. Network Issues

**Symptoms**:
- Timeout errors
- Network-related error messages

**Solutions**:
- Implement retry logic with exponential backoff
- Add proper error handling for network failures
- Provide fallback mechanisms (cached data or mock data)

### Recent Fixes

The following issues were recently identified and fixed in the Azure Maps integration:

#### 1. API Endpoint Configuration

**Issue**: Incorrect API version or endpoint URL parameters were causing failed requests or incomplete data.

**Fix**: Updated all API endpoint configurations to use the correct versions and parameters:
- Updated Search API to use `api-version: '1.0'`
- Updated Weather Forecast APIs to use `api-version: '1.1'`
- Ensured all required parameters are included in each request

#### 2. Data Structure Mapping

**Issue**: Changes in the Azure Maps API response structure were causing data mapping errors in the application.

**Fix**: Updated the data transformation logic to correctly map the current Azure Maps response structure:
- Fixed extraction of coordinates from the search results
- Updated temperature and precipitation data mapping
- Ensured proper handling of null or missing values

#### 3. CORS Configuration

**Issue**: Cross-Origin Resource Sharing (CORS) issues were preventing the frontend from accessing the backend API.

**Fix**: Updated the CORS configuration in the server.js file:
```javascript
// Security middleware
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

## Developer Guide

### Testing the API Integration

The application includes test scripts to verify the Azure Maps API integration:

#### 1. Testing the Search API

Run the following command to test the Search API integration:

```bash
node test-azure-api.js
```

This script:
- Tests the connection to Azure Maps Search API
- Verifies that the API key is working
- Checks if the response contains the expected data

#### 2. Testing the Hourly Forecast API

Run the following command to test the Hourly Forecast API integration:

```bash
node test-azure-hourly-api.js
```

This script:
- Tests the connection to Azure Maps Hourly Forecast API
- Verifies that hourly forecast data is being returned
- Checks the structure of the response

#### 3. Manual Testing

You can also test the API integration through the application:

1. Start the server: `node server.js`
2. Open the application in a browser
3. Enter a valid US ZIP code
4. Check if weather data is displayed correctly
5. Verify that the data source is shown as "AzureMaps"

### Extending Functionality

#### 1. Adding New Azure Maps Endpoints

To integrate additional Azure Maps endpoints:

1. Add a new function in `routes/weather.js` to fetch data from the endpoint
2. Follow the pattern of existing functions like `fetchAzureMapsLocation`
3. Update the route handler to use the new function
4. Add appropriate error handling and data transformation

Example:
```javascript
async function fetchAzureMapsSevereWeather(latitude, longitude) {
  try {
    const apiKey = process.env.AZURE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Azure Maps API key not configured');
    }
    
    const url = `${process.env.AZURE_MAPS_BASE_URL}/weather/severe/json`;
    
    const response = await axios.get(url, {
      params: {
        'api-version': '1.1',
        'subscription-key': apiKey,
        'query': `${latitude},${longitude}`,
        'unit': 'imperial'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Azure Maps severe weather:', error);
    throw error;
  }
}
```

#### 2. Enhancing Data Transformation

To improve the data transformation for Azure Maps responses:

1. Identify the specific data points you want to extract
2. Update the transformation logic in the route handler
3. Ensure the transformed data follows the application's standardized format
4. Add validation to handle missing or null values

#### 3. Adding Caching Strategies

To implement or improve caching for Azure Maps data:

1. Define appropriate cache keys based on the request parameters
2. Set reasonable TTL (Time To Live) values based on data freshness requirements
3. Implement cache invalidation strategies for when data needs to be refreshed
4. Add cache hit/miss logging for monitoring

### Best Practices

#### 1. API Usage

- **Minimize API Calls**: Use caching and combine requests where possible
- **Handle Rate Limits**: Implement retry logic with exponential backoff
- **Validate Inputs**: Always validate user inputs before using them in API requests
- **Handle Errors Gracefully**: Provide fallback mechanisms when API calls fail

#### 2. Data Handling

- **Validate Responses**: Always check if the response contains the expected data
- **Transform Consistently**: Ensure data from all sources is transformed to the same format
- **Handle Missing Data**: Provide default values or graceful degradation for missing data
- **Log Unusual Responses**: Monitor and log unexpected API responses for debugging

#### 3. Security

- **Protect API Keys**: Never expose API keys in client-side code
- **Use HTTPS**: Always use HTTPS for API requests
- **Implement Rate Limiting**: Protect your backend from abuse
- **Validate and Sanitize Inputs**: Prevent injection attacks

#### 4. Performance

- **Implement Caching**: Reduce API calls and improve response times
- **Use Compression**: Enable gzip/brotli compression for API responses
- **Optimize Payload Size**: Request only the data you need
- **Monitor Performance**: Track API response times and optimize as needed

By following these guidelines, you can maintain a robust, secure, and efficient integration with the Azure Maps API.