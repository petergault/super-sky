/**
 * Data Transformers
 *
 * This file contains utility functions for transforming API responses
 * into standardized data models.
 */
/**
 * Applies standardized precipitation rounding rules
 * @param {number} amount - The precipitation amount in mm
 * @returns {number} - Rounded precipitation amount
 */
function roundPrecipitation(amount) {
  if (typeof amount !== 'number') return 0;
  
  // Apply new rounding rules:
  // - Below 0.1mm: Return 0.0 (no more "Trace" category)
  // - 0.1mm to 0.9mm: Keep one decimal place
  // - Above 1.0mm: Round to nearest one decimal place
  
  if (amount < 0.1) {
    return 0.0;
  } else if (amount >= 0.1 && amount < 1.0) {
    return Math.round(amount * 10) / 10;  // Keep one decimal place
  } else {
    // For values >= 1.0, round to nearest one decimal place
    return Math.round(amount * 10) / 10;
  }
}

/**
 * Transform Azure Maps search data to standardized location format
 * @param {Object} searchData - Azure Maps search API response
 * @param {string} zipCode - The ZIP code used for the search
 * @returns {Object} - Standardized location object
 */
function transformAzureMapsLocation(searchData, zipCode) {
  if (!searchData || !searchData.results || searchData.results.length === 0) {
    return null;
  }
  
  const result = searchData.results[0]; // Use the first result
  
  return {
    zipCode: zipCode,
    city: result.address?.municipality || 'Unknown',
    state: result.address?.countrySubdivision || 'Unknown',
    country: result.address?.country || 'Unknown',
    coordinates: {
      latitude: result.position?.lat || 0,
      longitude: result.position?.lon || 0
    }
  };
}

/**
 * Transform Azure Maps daily forecast to standardized format
 * @param {Object} forecastData - Azure Maps daily forecast API response
 * @returns {Array} - Standardized daily forecast data
 */
function transformAzureMapsDaily(forecastData) {
  if (!forecastData || !forecastData.forecasts || !Array.isArray(forecastData.forecasts)) {
    return [];
  }
  
  return forecastData.forecasts.map(day => {
    const date = new Date(day.date);
    
    // Use day values as the primary values
    return {
      timestamp: date.getTime(),
      date: date.toLocaleDateString(),
      time: '12:00 PM', // Midday as representative time
      temperatureMin: day.temperature?.minimum?.value || 0,
      temperatureMax: day.temperature?.maximum?.value || 0,
      temperature: day.temperature?.maximum?.value || 0, // Use max as the main temperature
      feelsLike: day.realFeelTemperature?.maximum?.value || 0,
      humidity: day.day?.relativeHumidity || 0,
      windSpeed: day.day?.wind?.speed?.value || 0,
      windDirection: day.day?.wind?.direction?.degrees,
      windGust: day.day?.windGust?.speed?.value,
      cloudCover: day.day?.cloudCover,
      description: (() => {
        return day.day?.shortPhrase || 'Unknown';
      })(),
      longDescription: day.day?.shortPhrase || 'Unknown',
      shortDescription: day.day?.shortPhrase || 'Unknown',
      iconCode: day.day?.iconCode,
      icon: mapAzureMapsIcon(day.day?.iconCode),
      precipitation: {
        probability: day.day?.precipitationProbability || 0,
        // FIXED: Azure Maps returns precipitation in inches, convert to mm by multiplying by 25.4
        // Apply standardized rounding rules
        amount: roundPrecipitation((day.day?.totalLiquid?.value || 0) * 25.4),
        unit: 'mm',
        type: determinePrecipitationType(day.day)
      },
      sunrise: day.sun?.epochRise * 1000, // Convert to milliseconds if needed
      sunset: day.sun?.epochSet * 1000, // Convert to milliseconds if needed
      rawData: day
    };
  });
}

/**
 * Determine precipitation type based on probabilities
 * @param {Object} dayData - Day forecast data
 * @returns {string} - Precipitation type
 */
function determinePrecipitationType(dayData) {
  if (!dayData) return undefined;
  
  // Find the highest probability type
  const types = [
    { type: 'rain', prob: dayData.rainProbability || 0 },
    { type: 'snow', prob: dayData.snowProbability || 0 },
    { type: 'ice', prob: dayData.iceProbability || 0 }
  ];
  
  // Sort by probability (highest first)
  types.sort((a, b) => b.prob - a.prob);
  
  // If highest probability is 0, return undefined
  if (types[0].prob === 0) return undefined;
  
  // If multiple types have equal high probability, return 'mixed'
  if (types[0].prob === types[1].prob && types[0].prob > 0) return 'mixed';
  
  // Otherwise return the highest probability type
  return types[0].type;
}

/**
 * Map Azure Maps icon code to our standardized icon name
 * @param {number} iconCode - Azure Maps icon code
 * @returns {string} - Standardized icon name
 */
function mapAzureMapsIcon(iconCode) {
  // Azure Maps uses the same icon codes as AccuWeather
  const iconMap = {
    1: 'sunny',
    2: 'mostly-sunny',
    3: 'partly-sunny',
    4: 'intermittent-clouds',
    5: 'hazy-sunshine',
    6: 'mostly-cloudy',
    7: 'cloudy',
    8: 'dreary',
    11: 'fog',
    12: 'showers',
    13: 'mostly-cloudy-showers',
    14: 'partly-sunny-showers',
    15: 'thunderstorms',
    16: 'mostly-cloudy-thunderstorms',
    17: 'partly-sunny-thunderstorms',
    18: 'rain',
    19: 'flurries',
    20: 'mostly-cloudy-flurries',
    21: 'partly-sunny-flurries',
    22: 'snow',
    23: 'mostly-cloudy-snow',
    24: 'ice',
    25: 'sleet',
    26: 'freezing-rain',
    29: 'rain-and-snow',
    30: 'hot',
    31: 'cold',
    32: 'windy',
    33: 'clear-night',
    34: 'mostly-clear-night',
    35: 'partly-cloudy-night',
    36: 'intermittent-clouds-night',
    37: 'hazy-night',
    38: 'mostly-cloudy-night',
    39: 'partly-cloudy-showers-night',
    40: 'mostly-cloudy-showers-night',
    41: 'partly-cloudy-thunderstorms-night',
    42: 'mostly-cloudy-thunderstorms-night',
    43: 'mostly-cloudy-flurries-night',
    44: 'mostly-cloudy-snow-night'
  };
  
  return iconMap[iconCode] || 'unknown';
}

/**
 * Map Open Meteo weather code to our standardized icon name and description
 * @param {number} weatherCode - Open Meteo WMO weather code
 * @param {boolean} isDay - Whether it's daytime
 * @returns {Object} - Object with icon and description
 */
function mapOpenMeteoWeatherCode(weatherCode, isDay = true) {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  const codeMap = {
    0: { description: 'Clear sky', icon: isDay ? 'sunny' : 'clear-night' },
    1: { description: 'Mainly clear', icon: isDay ? 'mostly-sunny' : 'mostly-clear-night' },
    2: { description: 'Partly cloudy', icon: isDay ? 'partly-sunny' : 'partly-cloudy-night' },
    3: { description: 'Overcast', icon: isDay ? 'cloudy' : 'cloudy' },
    45: { description: 'Fog', icon: isDay ? 'fog' : 'fog' },
    48: { description: 'Depositing rime fog', icon: isDay ? 'fog' : 'fog' },
    51: { description: 'Light drizzle', icon: isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night' },
    53: { description: 'Moderate drizzle', icon: isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night' },
    55: { description: 'Dense drizzle', icon: isDay ? 'showers' : 'mostly-cloudy-showers-night' },
    56: { description: 'Light freezing drizzle', icon: isDay ? 'freezing-rain' : 'freezing-rain' },
    57: { description: 'Dense freezing drizzle', icon: isDay ? 'freezing-rain' : 'freezing-rain' },
    61: { description: 'Slight rain', icon: isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night' },
    63: { description: 'Moderate rain', icon: isDay ? 'rain' : 'rain' },
    65: { description: 'Heavy rain', icon: isDay ? 'rain' : 'rain' },
    66: { description: 'Light freezing rain', icon: isDay ? 'freezing-rain' : 'freezing-rain' },
    67: { description: 'Heavy freezing rain', icon: isDay ? 'freezing-rain' : 'freezing-rain' },
    71: { description: 'Slight snow fall', icon: isDay ? 'partly-sunny-flurries' : 'mostly-cloudy-flurries-night' },
    73: { description: 'Moderate snow fall', icon: isDay ? 'snow' : 'mostly-cloudy-snow-night' },
    75: { description: 'Heavy snow fall', icon: isDay ? 'snow' : 'mostly-cloudy-snow-night' },
    77: { description: 'Snow grains', icon: isDay ? 'snow' : 'mostly-cloudy-snow-night' },
    80: { description: 'Slight rain showers', icon: isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night' },
    81: { description: 'Moderate rain showers', icon: isDay ? 'showers' : 'mostly-cloudy-showers-night' },
    82: { description: 'Violent rain showers', icon: isDay ? 'rain' : 'rain' },
    85: { description: 'Slight snow showers', icon: isDay ? 'partly-sunny-flurries' : 'mostly-cloudy-flurries-night' },
    86: { description: 'Heavy snow showers', icon: isDay ? 'snow' : 'mostly-cloudy-snow-night' },
    95: { description: 'Thunderstorm', icon: isDay ? 'thunderstorms' : 'mostly-cloudy-thunderstorms-night' },
    96: { description: 'Thunderstorm with slight hail', icon: isDay ? 'thunderstorms' : 'mostly-cloudy-thunderstorms-night' },
    99: { description: 'Thunderstorm with heavy hail', icon: isDay ? 'thunderstorms' : 'mostly-cloudy-thunderstorms-night' }
  };
  
  return codeMap[weatherCode] || { description: 'Unknown', icon: 'unknown' };
}

/**
 * Create a current weather object from the first day of the forecast
 * @param {Object} firstDay - First day of the forecast
 * @returns {Object} - Current weather data
 */
function createCurrentFromForecast(firstDay) {
  if (!firstDay) {
    // Return realistic mock data if no forecast data is available
    return {
      temperature: 72,
      feelsLike: 70,
      humidity: 65,
      windSpeed: 8,
      windDirection: 270,
      cloudCover: 50,
      description: 'Partly Cloudy',
      icon: 'partly-sunny',
      precipitation: {
        probability: 20,
        amount: 0,
        unit: 'mm',
        type: 'rain'
      }
    };
  }
  
  // Use the day data for the current conditions
  return {
    temperature: firstDay.temperature?.maximum?.value || 72,
    feelsLike: firstDay.realFeelTemperature?.maximum?.value || 70,
    humidity: firstDay.day?.relativeHumidity || 65,
    windSpeed: firstDay.day?.wind?.speed?.value || 8,
    windDirection: firstDay.day?.wind?.direction?.degrees || 270,
    windGust: firstDay.day?.windGust?.speed?.value || 12,
    cloudCover: firstDay.day?.cloudCover || 50,
    description: (() => {
      return firstDay.day?.shortPhrase || 'Partly Cloudy';
    })(),
    longDescription: firstDay.day?.shortPhrase || 'Partly Cloudy',
    shortDescription: firstDay.day?.shortPhrase || 'Partly Cloudy',
    iconCode: firstDay.day?.iconCode,
    icon: mapAzureMapsIcon(firstDay.day?.iconCode) || 'partly-sunny',
    precipitation: {
      probability: firstDay.day?.precipitationProbability || 20,
      // FIXED: Azure Maps returns precipitation in inches, convert to mm by multiplying by 25.4
      // Apply standardized rounding rules
      amount: roundPrecipitation((firstDay.day?.totalLiquid?.value || 0) * 25.4),
      unit: 'mm',
      type: determinePrecipitationType(firstDay.day) || 'rain'
    },
    rawData: firstDay
  };
}

/**
 * Create hourly forecast data from daily forecast
 * @param {Array} dailyData - Daily forecast data
 * @returns {Array} - Simulated hourly forecast data
 */
function createHourlyFromDaily(dailyData) {
  if (!dailyData || dailyData.length === 0) {
    return [];
  }
  
  const hourlyData = [];
  const now = new Date();
  const startHour = now.getHours();
  
  // Create 24 hours of forecast data
  for (let i = 0; i < 24; i++) {
    const hour = (startHour + i) % 24;
    const dayOffset = Math.floor((startHour + i) / 24);
    const dayData = dailyData[Math.min(dayOffset, dailyData.length - 1)];
    
    const isDay = hour >= 6 && hour < 20; // Simple day/night determination
    const useDay = isDay ? dayData.day : dayData.night;
    
    const timestamp = new Date(now);
    timestamp.setHours(hour, 0, 0, 0);
    if (dayOffset > 0) {
      timestamp.setDate(timestamp.getDate() + dayOffset);
    }
    
    // Interpolate temperature based on hour of day
    let tempFactor = 0;
    if (hour >= 6 && hour <= 14) {
      // Morning to afternoon: rising temperature
      tempFactor = (hour - 6) / 8;
    } else if (hour > 14 && hour <= 20) {
      // Afternoon to evening: falling temperature
      tempFactor = 1 - (hour - 14) / 6;
    } else {
      // Night: low temperature
      tempFactor = 0;
    }
    
    // Add defensive checks for temperature values
    const maxTemp = dayData.temperature?.maximum?.value || 70;
    const minTemp = dayData.temperature?.minimum?.value || 50;
    const tempRange = maxTemp - minTemp;
    const temp = minTemp + tempRange * tempFactor;
    
    hourlyData.push({
      timestamp: timestamp.getTime(),
      date: timestamp.toLocaleDateString(),
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDay: isDay,
      temperature: temp,
      feelsLike: temp - 2 + Math.random() * 4, // Approximate feels like
      humidity: useDay?.relativeHumidity || 0,
      windSpeed: useDay?.wind?.speed?.value || 0,
      windDirection: useDay?.wind?.direction?.degrees,
      description: (() => {
        return useDay?.shortPhrase || 'Unknown';
      })(),
      longDescription: useDay?.shortPhrase || 'Unknown',
      shortDescription: useDay?.shortPhrase || 'Unknown',
      iconCode: useDay?.iconCode,
      icon: mapAzureMapsIcon(useDay?.iconCode),
      precipitation: {
        probability: useDay?.precipitationProbability || 0,
        // FIXED: Azure Maps returns precipitation in inches, convert to mm by multiplying by 25.4, then distribute over hours
        // Apply standardized rounding rules
        amount: roundPrecipitation(((useDay?.totalLiquid?.value || 0) * 25.4) / 24),
        unit: 'mm',
        type: determinePrecipitationType(useDay)
      }
    });
  }
  
  return hourlyData;
}

/**
 * Combine all Azure Maps data into a standardized forecast
 * @param {Object} location - Transformed location data
 * @param {Array} daily - Transformed daily forecast
 * @returns {Object} - Complete standardized forecast
 */
function combineAzureMapsData(location, daily) {
  // Create current conditions from the first day of the forecast
  const current = createCurrentFromForecast(daily[0]);
  
  // Create hourly forecast from daily data
  const hourly = createHourlyFromDaily(daily);
  
  return {
    location: location,
    current: current,
    hourly: hourly,
    daily: daily,
    source: 'AzureMaps',
    lastUpdated: Date.now()
  };
}

/**
 * Transform Open Meteo hourly forecast to standardized format
 * @param {Object} forecastData - Open Meteo forecast API response
 * @returns {Array} - Standardized hourly forecast data
 */
function transformOpenMeteoHourly(forecastData) {
  if (!forecastData || !forecastData.hourly || !forecastData.hourly.time) {
    return [];
  }
  
  const hourly = forecastData.hourly;
  const hourlyData = [];
  
  for (let i = 0; i < hourly.time.length; i++) {
    const time = new Date(hourly.time[i]);
    const isDay = hourly.is_day && hourly.is_day[i] === 1;
    const weatherCode = hourly.weathercode && hourly.weathercode[i];
    const weatherInfo = mapOpenMeteoWeatherCode(weatherCode, isDay);
    
    hourlyData.push({
      timestamp: time.getTime(),
      date: time.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDay: isDay,
      temperature: hourly.temperature_2m && hourly.temperature_2m[i],
      feelsLike: hourly.apparent_temperature && hourly.apparent_temperature[i],
      humidity: hourly.relativehumidity_2m && hourly.relativehumidity_2m[i],
      windSpeed: hourly.windspeed_10m && hourly.windspeed_10m[i],
      windDirection: hourly.winddirection_10m && hourly.winddirection_10m[i],
      pressure: hourly.surface_pressure && hourly.surface_pressure[i],
      visibility: hourly.visibility && (hourly.visibility[i] / 1609), // Convert meters to miles
      uvIndex: hourly.uv_index && hourly.uv_index[i],
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      precipitation: {
        probability: hourly.precipitation_probability && hourly.precipitation_probability[i] !== undefined ? hourly.precipitation_probability[i] : "n/a",
        // FIXED: OpenMeteo API is called with precipitation_unit='inch' (confirmed in weather.js:204)
        // Convert from inches to mm for consistency with other sources (1 inch = 25.4 mm)
        // Apply standardized rounding rules
        amount: roundPrecipitation(hourly.precipitation && hourly.precipitation[i] ? hourly.precipitation[i] * 25.4 : 0),
        unit: 'mm',
        type: 'rain' // Open Meteo doesn't differentiate precipitation types in hourly data
      },
      rawData: {
        time: hourly.time[i],
        temperature: hourly.temperature_2m && hourly.temperature_2m[i],
        weatherCode: weatherCode
      }
    });
  }
  
  return hourlyData;
}

/**
 * Transform Open Meteo daily forecast to standardized format
 * @param {Object} forecastData - Open Meteo forecast API response
 * @returns {Array} - Standardized daily forecast data
 */
function transformOpenMeteoDaily(forecastData) {
  if (!forecastData || !forecastData.daily || !forecastData.daily.time) {
    return [];
  }
  
  const daily = forecastData.daily;
  const dailyData = [];
  
  for (let i = 0; i < daily.time.length; i++) {
    const date = new Date(daily.time[i]);
    const weatherCode = daily.weathercode && daily.weathercode[i];
    const weatherInfo = mapOpenMeteoWeatherCode(weatherCode, true); // Assume day for daily summary
    
    dailyData.push({
      timestamp: date.getTime(),
      date: date.toLocaleDateString(),
      time: '12:00 PM', // Midday as representative time
      temperatureMin: daily.temperature_2m_min && daily.temperature_2m_min[i],
      temperatureMax: daily.temperature_2m_max && daily.temperature_2m_max[i],
      temperature: daily.temperature_2m_max && daily.temperature_2m_max[i], // Use max as the main temperature
      feelsLike: daily.apparent_temperature_max && daily.apparent_temperature_max[i],
      humidity: 0, // Not provided in daily data
      windSpeed: daily.windspeed_10m_max && daily.windspeed_10m_max[i],
      windDirection: daily.winddirection_10m_dominant && daily.winddirection_10m_dominant[i],
      uvIndex: daily.uv_index_max && daily.uv_index_max[i],
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      precipitation: {
        probability: daily.precipitation_probability_max && daily.precipitation_probability_max[i] !== undefined ? daily.precipitation_probability_max[i] : "n/a",
        // FIXED: OpenMeteo API is called with precipitation_unit='inch' (confirmed in weather.js:204)
        // Convert from inches to mm for consistency with other sources (1 inch = 25.4 mm)
        // Apply standardized rounding rules
        amount: roundPrecipitation(daily.precipitation_sum && daily.precipitation_sum[i] ? daily.precipitation_sum[i] * 25.4 : 0),
        unit: 'mm',
        type: 'rain' // Open Meteo doesn't differentiate precipitation types
      },
      sunrise: daily.sunrise && new Date(daily.sunrise[i]).getTime(),
      sunset: daily.sunset && new Date(daily.sunset[i]).getTime(),
      rawData: {
        time: daily.time[i],
        temperatureMin: daily.temperature_2m_min && daily.temperature_2m_min[i],
        temperatureMax: daily.temperature_2m_max && daily.temperature_2m_max[i],
        weatherCode: weatherCode
      }
    });
  }
  
  return dailyData;
}

/**
 * Create current weather data from Open Meteo data
 * @param {Object} forecastData - Open Meteo forecast API response
 * @returns {Object} - Current weather data
 */
function createOpenMeteoCurrent(forecastData) {
  if (!forecastData) {
    return null;
  }
  
  // Use current_weather if available
  if (forecastData.current_weather) {
    const current = forecastData.current_weather;
    const isDay = true; // Assume day for simplicity if not provided
    const weatherInfo = mapOpenMeteoWeatherCode(current.weathercode, isDay);
    
    // Get humidity and other data from the first hour of hourly data if available
    let humidity = 0;
    let precipitation = { probability: 0, amount: 0, unit: 'mm', type: 'rain' };
    let uvIndex = 0;
    let visibility = 0;
    let feelsLike = current.temperature;
    
    if (forecastData.hourly && forecastData.hourly.time && forecastData.hourly.time.length > 0) {
      const currentTime = new Date(current.time);
      const hourlyTimes = forecastData.hourly.time;
      
      // Find the closest hourly time
      let closestIndex = 0;
      let closestDiff = Infinity;
      
      for (let i = 0; i < hourlyTimes.length; i++) {
        const hourlyTime = new Date(hourlyTimes[i]);
        const diff = Math.abs(currentTime.getTime() - hourlyTime.getTime());
        
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIndex = i;
        }
      }
      
      // Get additional data from the closest hourly time
      humidity = forecastData.hourly.relativehumidity_2m && forecastData.hourly.relativehumidity_2m[closestIndex] || 0;
      precipitation.probability = forecastData.hourly.precipitation_probability && forecastData.hourly.precipitation_probability[closestIndex] !== undefined ? forecastData.hourly.precipitation_probability[closestIndex] : "n/a";
      // FIXED: OpenMeteo API is called with precipitation_unit='inch' (confirmed in weather.js:204)
      // Convert from inches to mm for consistency with other sources (1 inch = 25.4 mm)
      // Apply standardized rounding rules
      const precipValue = forecastData.hourly.precipitation && forecastData.hourly.precipitation[closestIndex] || 0;
      precipitation.amount = roundPrecipitation(precipValue * 25.4);
      uvIndex = forecastData.hourly.uv_index && forecastData.hourly.uv_index[closestIndex] || 0;
      visibility = forecastData.hourly.visibility && (forecastData.hourly.visibility[closestIndex] / 1609) || 0; // Convert meters to miles
      feelsLike = forecastData.hourly.apparent_temperature && forecastData.hourly.apparent_temperature[closestIndex] || current.temperature;
    }
    
    return {
      temperature: current.temperature,
      feelsLike: feelsLike,
      humidity: humidity,
      windSpeed: current.windspeed,
      windDirection: current.winddirection,
      uvIndex: uvIndex,
      visibility: visibility,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      precipitation: precipitation,
      rawData: current
    };
  }
  
  // If current_weather is not available, use the first hour of hourly data
  if (forecastData.hourly && forecastData.hourly.time && forecastData.hourly.time.length > 0) {
    const index = 0; // Use the first hour
    const isDay = forecastData.hourly.is_day && forecastData.hourly.is_day[index] === 1;
    const weatherCode = forecastData.hourly.weathercode && forecastData.hourly.weathercode[index];
    const weatherInfo = mapOpenMeteoWeatherCode(weatherCode, isDay);
    
    return {
      temperature: forecastData.hourly.temperature_2m && forecastData.hourly.temperature_2m[index],
      feelsLike: forecastData.hourly.apparent_temperature && forecastData.hourly.apparent_temperature[index],
      humidity: forecastData.hourly.relativehumidity_2m && forecastData.hourly.relativehumidity_2m[index],
      windSpeed: forecastData.hourly.windspeed_10m && forecastData.hourly.windspeed_10m[index],
      windDirection: forecastData.hourly.winddirection_10m && forecastData.hourly.winddirection_10m[index],
      pressure: forecastData.hourly.surface_pressure && forecastData.hourly.surface_pressure[index],
      visibility: forecastData.hourly.visibility && (forecastData.hourly.visibility[index] / 1609), // Convert meters to miles
      uvIndex: forecastData.hourly.uv_index && forecastData.hourly.uv_index[index],
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      precipitation: {
        probability: forecastData.hourly.precipitation_probability && forecastData.hourly.precipitation_probability[index] !== undefined ? forecastData.hourly.precipitation_probability[index] : "n/a",
        // FIXED: OpenMeteo API is called with precipitation_unit='inch' - convert to mm for consistency
        amount: roundPrecipitation((forecastData.hourly.precipitation && forecastData.hourly.precipitation[index] || 0) * 25.4),
        unit: 'mm',
        type: 'rain' // Open Meteo doesn't differentiate precipitation types
      },
      rawData: {
        time: forecastData.hourly.time[index],
        temperature: forecastData.hourly.temperature_2m && forecastData.hourly.temperature_2m[index],
        weatherCode: weatherCode
      }
    };
  }
  
  // If no data is available, return a default object
  return {
    temperature: 72,
    feelsLike: 70,
    humidity: 65,
    windSpeed: 8,
    windDirection: 270,
    description: 'Partly Cloudy',
    icon: 'partly-sunny',
    precipitation: {
      probability: "n/a",
      amount: roundPrecipitation(2.54), // 0.1 inch converted to mm (0.1 * 25.4)
      unit: 'mm',
      type: 'rain'
    }
  };
}

/**
 * Transform Open Meteo data to standardized format
 * @param {Object} forecastData - Open Meteo forecast API response
 * @param {Object} location - Location data
 * @returns {Object} - Standardized weather forecast
 */
function transformOpenMeteoData(forecastData, location) {
  if (!forecastData) {
    return {
      location: location,
      current: createOpenMeteoCurrent(null),
      hourly: [],
      daily: [],
      source: 'OpenMeteo',
      lastUpdated: Date.now()
    };
  }
  
  // Transform hourly and daily data
  const hourly = transformOpenMeteoHourly(forecastData);
  const daily = transformOpenMeteoDaily(forecastData);
  
  // Create current conditions
  const current = createOpenMeteoCurrent(forecastData);
  
  return {
    location: location,
    current: current,
    hourly: hourly,
    daily: daily,
    source: 'OpenMeteo',
    lastUpdated: Date.now()
  };
}

/**
 * Map Foreca symbol to our standardized icon name
 * @param {string} symbol - Foreca weather symbol
 * @returns {string} - Standardized icon name
 */
function mapForecaSymbol(symbol) {
  // Foreca uses symbols like "d000" (clear day), "n000" (clear night)
  // First character: d = day, n = night
  // Last three digits: weather code
  
  const isDay = symbol && symbol.charAt(0) === 'd';
  const code = symbol && symbol.substring(1);
  
  const symbolMap = {
    // Clear
    '000': isDay ? 'sunny' : 'clear-night',
    // Mostly clear
    '100': isDay ? 'mostly-sunny' : 'mostly-clear-night',
    // Partly cloudy
    '200': isDay ? 'partly-sunny' : 'partly-cloudy-night',
    '210': isDay ? 'partly-sunny' : 'partly-cloudy-night',
    // Cloudy
    '300': isDay ? 'cloudy' : 'cloudy',
    '400': isDay ? 'cloudy' : 'cloudy',
    // Fog
    '500': isDay ? 'fog' : 'fog',
    // Light rain
    '600': isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night',
    '610': isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night',
    // Rain
    '620': isDay ? 'rain' : 'rain',
    '700': isDay ? 'rain' : 'rain',
    // Thunderstorms
    '800': isDay ? 'thunderstorms' : 'mostly-cloudy-thunderstorms-night',
    // Light snow
    '900': isDay ? 'partly-sunny-flurries' : 'mostly-cloudy-flurries-night',
    // Snow
    '910': isDay ? 'snow' : 'mostly-cloudy-snow-night',
    '920': isDay ? 'snow' : 'mostly-cloudy-snow-night',
    // Sleet/freezing rain
    '930': isDay ? 'sleet' : 'sleet',
    '940': isDay ? 'freezing-rain' : 'freezing-rain'
  };
  
  return symbolMap[code] || 'unknown';
}

/**
 * Map Foreca symbol to description
 * @param {string} symbol - Foreca weather symbol
 * @param {string} phrase - Foreca symbol phrase
 * @returns {string} - Weather description
 */
function getForecaDescription(symbol, phrase) {
  if (phrase) return phrase;
  
  // If no phrase is provided, derive from symbol
  const code = symbol && symbol.substring(1);
  
  const descriptionMap = {
    '000': 'Clear',
    '100': 'Mostly Clear',
    '200': 'Partly Cloudy',
    '210': 'Partly Cloudy',
    '300': 'Cloudy',
    '400': 'Overcast',
    '500': 'Fog',
    '600': 'Light Rain',
    '610': 'Rain Showers',
    '620': 'Rain',
    '700': 'Heavy Rain',
    '800': 'Thunderstorms',
    '900': 'Light Snow',
    '910': 'Snow Showers',
    '920': 'Snow',
    '930': 'Sleet',
    '940': 'Freezing Rain'
  };
  
  return descriptionMap[code] || 'Unknown';
}

/**
 * Determine precipitation type from Foreca symbol
 * @param {string} symbol - Foreca weather symbol
 * @returns {string|undefined} - Precipitation type
 */
function determineForecaPrecipType(symbol) {
  if (!symbol) return undefined;
  
  const code = symbol.substring(1);
  const codeNum = parseInt(code, 10);
  
  if (codeNum >= 600 && codeNum < 900) return 'rain';
  if (codeNum >= 900 && codeNum < 930) return 'snow';
  if (codeNum === 930) return 'mixed';
  if (codeNum === 940) return 'ice';
  
  return undefined;
}

/**
 * Transform Foreca current weather to standardized format
 * @param {Object} currentData - Foreca current weather API response
 * @returns {Object} - Standardized current weather data
 */
function transformForecaCurrent(currentData) {
  if (!currentData || !currentData.current) {
    // Return a default weather object instead of calling getMockWeatherData
    return {
      temperature: 72,
      feelsLike: 70,
      humidity: 65,
      windSpeed: 8,
      windDirection: 270,
      windGust: 12,
      pressure: 1015,
      visibility: 10,
      uvIndex: 5,
      cloudCover: 50,
      description: 'Partly Cloudy',
      icon: 'partly-sunny',
      precipitation: {
        probability: 20,
        amount: 0.1,
        type: 'rain'
      },
      rawData: { mock: true }
    };
  }
  
  const current = currentData.current;
  const icon = mapForecaSymbol(current.symbol);
  const description = getForecaDescription(current.symbol, current.symbolPhrase);
  
  return {
    temperature: current.temperature,
    feelsLike: current.feelsLikeTemp,
    humidity: current.relHumidity,
    windSpeed: current.windSpeed,
    windDirection: current.windDir,
    windGust: current.windGust,
    pressure: current.pressure,
    visibility: current.visibility,
    uvIndex: current.uvIndex,
    cloudCover: current.cloudiness,
    description: description,
    icon: icon,
    precipitation: {
      probability: current.precipProb,
      // CONFIRMED: Foreca returns precipitation in MM (validated by debug-unit-validation.js)
      // No conversion needed - keep raw MM values
      // Apply standardized rounding rules
      amount: roundPrecipitation(current.precipAccum || 0),
      unit: 'mm',
      type: determineForecaPrecipType(current.symbol)
    },
    rawData: current
  };
}

/**
 * Transform Foreca daily forecast to standardized format - REMOVED
 * Daily forecast functionality has been removed
 * @param {Object} forecastData - Foreca forecast API response
 * @returns {Array} - Empty array since daily forecast functionality has been removed
 */
function transformForecaDaily(forecastData) {
  console.log('Foreca daily forecast functionality has been removed');
  return [];
}

/**
 * Transform Azure Maps hourly forecast to standardized format
 * @param {Object} hourlyData - Azure Maps hourly forecast API response
 * @returns {Array} - Standardized hourly forecast data
 */
function transformAzureMapsHourly(hourlyData) {
  if (!hourlyData || !hourlyData.forecasts || !Array.isArray(hourlyData.forecasts)) {
    return [];
  }
  
  const result = [];
  
  // Process each hour in the forecast
  for (let i = 0; i < hourlyData.forecasts.length; i++) {
    const hour = hourlyData.forecasts[i];
    
    // Parse the date and time from the forecast
    // Azure Maps date format is like "2025-05-23T00:00:00+00:00"
    const forecastDate = new Date(hour.date);
    
    // Use the actual forecast date from Azure instead of modifying today's date
    const timestamp = new Date(forecastDate);
    
    result.push({
      timestamp: timestamp.getTime(),
      date: timestamp.toLocaleDateString(),
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: hour.temperature?.value || 0,
      feelsLike: hour.realFeelTemperature?.value || 0,
      humidity: hour.relativeHumidity || 0,
      windSpeed: hour.wind?.speed?.value || 0,
      windDirection: hour.wind?.direction?.degrees || 0,
      description: hour.iconPhrase || 'Unknown',
      icon: mapAzureMapsIcon(hour.iconCode),
      weatherCondition: hour.iconPhrase || '',
      // DIAGNOSTIC: Log the actual values
      ...(console.log(`[DIAGNOSTIC] Azure Maps Hour Transform - iconPhrase: "${hour.iconPhrase}", iconCode: ${hour.iconCode}, hasPrecipitation: ${hour.hasPrecipitation}`) || {}),
      precipitation: {
        probability: hour.precipitationProbability || 0,
        // FIXED: Azure Maps returns precipitation in inches, convert to mm by multiplying by 25.4
        // Apply standardized rounding rules
        amount: roundPrecipitation((hour.totalLiquid?.value || 0) * 25.4),
        unit: 'mm',
        type: determinePrecipitationType(hour) || 'rain'
      }
    });
  }
  
  return result;
}

/**
 * Transform Foreca hourly forecast to standardized format
 * Handles up to 7 days of hourly data (maximum the API offers)
 * @param {Object} forecastData - Foreca hourly forecast API response
 * @param {boolean} includeEmptyDays - Whether to include empty data for days 8-10
 * @returns {Array} - Standardized hourly forecast data
 */
function transformForecaHourly(forecastData, includeEmptyDays = true) {
  // Handle rate limit errors or missing data
  if (!forecastData || forecastData.status === 429 || !forecastData.forecast) {
    console.warn('Foreca API rate limit reached or data missing');
    return [];
  }

  const hourlyData = [];
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  
  // Process available hourly data (up to 7 days)
  if (Array.isArray(forecastData.forecast)) {
    forecastData.forecast.forEach(hour => {
      const time = new Date(hour.time);
      
      hourlyData.push({
        timestamp: time.getTime(),
        date: time.toLocaleDateString(),
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temperature: hour.temperature,
        feelsLike: hour.feelsLikeTemp,
        humidity: hour.relHumidity,
        windSpeed: hour.windSpeed,
        windDirection: hour.windDir,
        windGust: hour.windGust,
        pressure: hour.pressure,
        visibility: hour.visibility,
        cloudCover: hour.cloudiness,
        description: getForecaDescription(hour.symbol, hour.symbolPhrase),
        icon: mapForecaSymbol(hour.symbol),
        precipitation: {
          probability: hour.precipProb,
          // CONFIRMED: Foreca returns precipitation in MM (validated by debug-unit-validation.js)
          // No conversion needed - keep raw MM values
          // Apply standardized rounding rules
          amount: roundPrecipitation(hour.precipAccum || 0),
          unit: 'mm',
          type: determineForecaPrecipType(hour.symbol)
        },
        rawData: hour
      });
    });
  }
  
  // Add "no data available" entries for days 8-10 if requested
  if (includeEmptyDays) {
    const tenDaysFromNow = new Date(now);
    tenDaysFromNow.setDate(now.getDate() + 10);
    
    // Create placeholder entries for days 8-10
    for (let day = 8; day <= 10; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      
      // Add 4 entries per day (6am, 12pm, 6pm, 12am) as placeholders
      [6, 12, 18, 0].forEach(hour => {
        const time = new Date(date);
        time.setHours(hour, 0, 0, 0);
        
        hourlyData.push({
          timestamp: time.getTime(),
          date: time.toLocaleDateString(),
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature: null,
          feelsLike: null,
          humidity: null,
          windSpeed: null,
          windDirection: null,
          description: "No data available",
          icon: "unknown",
          precipitation: {
            probability: null,
            amount: null,
            unit: 'mm',
            type: null
          },
          noDataAvailable: true
        });
      });
    }
  }
  
  return hourlyData;
}

/**
 * Combine all Foreca data into a standardized forecast
 * Note: Daily forecast functionality has been removed
 * @param {Object} location - Location data
 * @param {Object} currentData - Current weather data
 * @param {Object} dailyData - Not used anymore (daily forecast functionality removed)
 * @param {Object} hourlyData - Hourly forecast data
 * @returns {Object} - Complete standardized forecast
 */
function combineForecaData(location, currentData, dailyData, hourlyData) {
  // Handle rate limit errors
  const isRateLimited =
    (currentData && currentData.status === 429) ||
    (hourlyData && hourlyData.status === 429);
  
  if (isRateLimited) {
    console.warn('Foreca API rate limit reached');
  }
  
  // Transform the data
  const current = transformForecaCurrent(currentData);
  const hourly = transformForecaHourly(hourlyData);
  
  // Empty array for daily since functionality has been removed
  const daily = [];
  
  return {
    location: location,
    current: current,
    hourly: hourly,
    daily: daily, // Empty array since daily forecast functionality has been removed
    source: 'Foreca',
    lastUpdated: Date.now(),
    rateLimited: isRateLimited
  };
}

/**
 * Map Google Weather API condition code to our standardized icon name
 * @param {string} conditionCode - Google Weather API condition code
 * @param {boolean} isDay - Whether it's daytime
 * @returns {string} - Standardized icon name
 */
function mapGoogleWeatherIcon(conditionCode, isDay = true) {
  // Google Weather API condition codes mapping to our standardized icons
  const iconMap = {
    'CONDITION_UNSPECIFIED': 'unknown',
    'CLEAR': isDay ? 'sunny' : 'clear-night',
    'MOSTLY_CLEAR': isDay ? 'mostly-sunny' : 'mostly-clear-night',
    'PARTLY_CLOUDY': isDay ? 'partly-sunny' : 'partly-cloudy-night',
    'MOSTLY_CLOUDY': isDay ? 'mostly-cloudy' : 'mostly-cloudy-night',
    'CLOUDY': 'cloudy',
    'FOG': 'fog',
    'LIGHT_FOG': 'fog',
    'LIGHT_RAIN': isDay ? 'partly-sunny-showers' : 'partly-cloudy-showers-night',
    'RAIN': 'rain',
    'HEAVY_RAIN': 'rain',
    'LIGHT_SNOW': isDay ? 'partly-sunny-flurries' : 'mostly-cloudy-flurries-night',
    'SNOW': 'snow',
    'HEAVY_SNOW': 'snow',
    'FREEZING_DRIZZLE': 'freezing-rain',
    'FREEZING_RAIN': 'freezing-rain',
    'LIGHT_FREEZING_RAIN': 'freezing-rain',
    'HEAVY_FREEZING_RAIN': 'freezing-rain',
    'ICE_PELLETS': 'sleet',
    'HEAVY_ICE_PELLETS': 'sleet',
    'LIGHT_ICE_PELLETS': 'sleet',
    'THUNDERSTORM': isDay ? 'thunderstorms' : 'mostly-cloudy-thunderstorms-night',
    'WINDY': 'windy',
    'HAZE': isDay ? 'hazy-sunshine' : 'hazy-night',
    'SMOKE': isDay ? 'hazy-sunshine' : 'hazy-night',
    'DUST': isDay ? 'hazy-sunshine' : 'hazy-night',
    'TORNADO': 'thunderstorms',
    'HURRICANE': 'thunderstorms'
  };
  
  return iconMap[conditionCode] || 'unknown';
}

/**
 * Determine precipitation type from Google Weather API condition
 * @param {string} conditionCode - Google Weather API condition code
 * @returns {string|undefined} - Precipitation type
 */
function determineGooglePrecipType(conditionCode) {
  if (!conditionCode) return undefined;
  
  // Map condition codes to precipitation types
  if (conditionCode.includes('RAIN') ||
      conditionCode === 'THUNDERSTORM' ||
      conditionCode.includes('SHOWER') ||
      conditionCode.includes('STORM') ||
      conditionCode === 'DRIZZLE') {
    return 'rain';
  }
  
  if (conditionCode.includes('SNOW') || conditionCode.includes('FLURR')) {
    return 'snow';
  }
  
  if (conditionCode.includes('ICE') || conditionCode.includes('FREEZING') || conditionCode === 'SLEET') {
    return 'ice';
  }
  
  if (conditionCode === 'SLEET' || conditionCode.includes('MIXED')) {
    return 'mixed';
  }
  
  return undefined;
}

/**
 * Transform Google Weather API hourly forecast to standardized format
 * @param {Object} forecastData - Google Weather API forecast response
 * @returns {Array} - Standardized hourly forecast data
 */
function transformGoogleWeatherHourly(forecastData) {
  if (!forecastData || !forecastData.forecastHours || !Array.isArray(forecastData.forecastHours)) {
    return [];
  }
  
  const hourlyData = [];
  
  for (let i = 0; i < forecastData.forecastHours.length; i++) {
    const hour = forecastData.forecastHours[i];
    
    // Parse the date and time - handle both mock and real API formats
    const timeString = hour.time || (hour.interval && hour.interval.startTime);
    const time = new Date(timeString);
    
    // Determine if it's day or night (use isDaytime if available, otherwise approximate)
    const isDay = hour.isDaytime !== undefined ? hour.isDaytime : (time.getHours() >= 6 && time.getHours() < 20);
    
    // Map the condition to our icon system - handle both mock and real API formats
    let conditionType = hour.conditionCode;
    if (hour.weatherCondition && hour.weatherCondition.type) {
      conditionType = hour.weatherCondition.type;
    }
    const icon = mapGoogleWeatherIcon(conditionType, isDay);
    
    // Get description - handle both mock and real API formats
    let description = conditionType ? conditionType.replace(/_/g, ' ').toLowerCase() : 'unknown';
    if (hour.weatherCondition && hour.weatherCondition.description && hour.weatherCondition.description.text) {
      description = hour.weatherCondition.description.text;
    }
    
    // Calculate precipitation probability and amount - handle both mock and real API formats
    let precipProbability = hour.precipitationProbability || 0;
    let precipAmount = hour.precipitationAmount?.value || 0;
    let precipType = determineGooglePrecipType(conditionType);
    
    // CRITICAL FIX: Handle mock data format precipitation units
    if (hour.precipitationAmount && hour.precipitationAmount.value && hour.precipitationAmount.unit) {
      const mockUnit = hour.precipitationAmount.unit;
      if (mockUnit === 'in' || mockUnit === 'inches' || mockUnit === 'INCHES') {
        // Convert mock data inches to millimeters for consistency
        console.log(`[Google Weather Mock] Converting precipitation: ${precipAmount} inches → ${precipAmount * 25.4} mm`);
        precipAmount = precipAmount * 25.4;
      } else if (mockUnit === 'mm' || mockUnit === 'MILLIMETERS') {
        // Already in millimeters, no conversion needed
        console.log(`[Google Weather Mock] Precipitation already in mm: ${precipAmount} mm`);
      } else {
        // Unknown unit in mock data, log warning and assume inches for safety
        console.warn(`[Google Weather Mock] Unknown precipitation unit: ${mockUnit}, assuming inches`);
        precipAmount = precipAmount * 25.4;
      }
    }
    
    if (hour.precipitation) {
      if (hour.precipitation.probability && hour.precipitation.probability.percent !== undefined) {
        precipProbability = hour.precipitation.probability.percent;
      }
      if (hour.precipitation.qpf && hour.precipitation.qpf.quantity !== undefined) {
        precipAmount = hour.precipitation.qpf.quantity;
        
        // CRITICAL FIX: Check the actual unit returned by Google Weather API
        // The API documentation is inconsistent about units, so we check the unit field
        const precipUnit = hour.precipitation.qpf.unit;
        
        if (precipUnit === 'INCHES' || precipUnit === 'inches') {
          // Convert inches to millimeters for consistency across all APIs
          console.log(`[Google Weather] Converting precipitation: ${precipAmount} inches → ${precipAmount * 25.4} mm`);
          precipAmount = precipAmount * 25.4;
        } else if (precipUnit === 'MILLIMETERS' || precipUnit === 'mm') {
          // Already in millimeters, no conversion needed
          console.log(`[Google Weather] Precipitation already in mm: ${precipAmount} mm`);
        } else {
          // Unknown unit, log warning and assume inches for safety
          console.warn(`[Google Weather] Unknown precipitation unit: ${precipUnit}, assuming inches`);
          precipAmount = precipAmount * 25.4;
        }
      }
      if (hour.precipitation.probability && hour.precipitation.probability.type) {
        precipType = hour.precipitation.probability.type.toLowerCase();
      }
    }
    
    // Get temperature - handle both mock and real API formats
    let temperature = hour.temperature?.value || 0;
    let feelsLike = hour.temperatureApparent?.value || 0;
    
    if (hour.temperature && hour.temperature.degrees !== undefined) {
      temperature = hour.temperature.degrees;
      // Convert from Celsius to Fahrenheit if needed
      if (hour.temperature.unit === 'CELSIUS') {
        temperature = (temperature * 9/5) + 32;
      }
    }
    
    if (hour.feelsLikeTemperature && hour.feelsLikeTemperature.degrees !== undefined) {
      feelsLike = hour.feelsLikeTemperature.degrees;
      // Convert from Celsius to Fahrenheit if needed
      if (hour.feelsLikeTemperature.unit === 'CELSIUS') {
        feelsLike = (feelsLike * 9/5) + 32;
      }
    }
    
    // Get wind data - handle both mock and real API formats
    let windSpeed = hour.windSpeed?.value || 0;
    let windDirection = hour.windDirection?.degrees || 0;
    
    if (hour.wind) {
      if (hour.wind.speed && hour.wind.speed.value !== undefined) {
        windSpeed = hour.wind.speed.value;
        // Convert from km/h to mph if needed
        if (hour.wind.speed.unit === 'KILOMETERS_PER_HOUR') {
          windSpeed = windSpeed * 0.621371;
        }
      }
      if (hour.wind.direction && hour.wind.direction.degrees !== undefined) {
        windDirection = hour.wind.direction.degrees;
      }
    }
    
    // Get other data - handle both mock and real API formats
    let humidity = hour.humidity || hour.relativeHumidity || 0;
    let pressure = hour.pressure?.value || (hour.airPressure?.meanSeaLevelMillibars || 0);
    let visibility = hour.visibility?.value || (hour.visibility?.distance || 0);
    let cloudCover = hour.cloudCover || 0;
    let uvIndex = hour.uvIndex || 0;
    
    hourlyData.push({
      timestamp: time.getTime(),
      date: time.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDay: isDay,
      temperature: temperature,
      feelsLike: feelsLike,
      humidity: humidity,
      windSpeed: windSpeed,
      windDirection: windDirection,
      pressure: pressure,
      visibility: visibility,
      cloudCover: cloudCover,
      uvIndex: uvIndex,
      description: description,
      icon: icon,
      precipitation: {
        probability: precipProbability,
        // Google Weather API returns precipitation in mm after conversion
        // Apply standardized rounding rules
        amount: roundPrecipitation(precipAmount),
        unit: 'mm',
        type: precipType
      },
      rawData: hour
    });
  }
  
  return hourlyData;
}

/**
 * Create current weather data from Google Weather API data
 * @param {Object} forecastData - Google Weather API forecast response
 * @returns {Object} - Current weather data
 */
function createGoogleWeatherCurrent(forecastData) {
  if (!forecastData || !forecastData.forecastHours || !forecastData.forecastHours.length) {
    // Return default weather object if no data
    return {
      temperature: 72,
      feelsLike: 70,
      humidity: 65,
      windSpeed: 8,
      windDirection: 270,
      pressure: 1015,
      visibility: 10,
      uvIndex: 5,
      cloudCover: 50,
      description: 'Partly Cloudy',
      icon: 'partly-sunny',
      precipitation: {
        probability: 20,
        amount: 0.1,
        type: 'rain'
      }
    };
  }
  
  // Use the first hour as current conditions
  const currentHour = forecastData.forecastHours[0];
  
  // Parse the date and time - handle both mock and real API formats
  const timeString = currentHour.time || (currentHour.interval && currentHour.interval.startTime);
  const time = new Date(timeString);
  
  // Determine if it's day or night (use isDaytime if available, otherwise approximate)
  const isDay = currentHour.isDaytime !== undefined ? currentHour.isDaytime : (time.getHours() >= 6 && time.getHours() < 20);
  
  // Map the condition to our icon system - handle both mock and real API formats
  let conditionType = currentHour.conditionCode;
  if (currentHour.weatherCondition && currentHour.weatherCondition.type) {
    conditionType = currentHour.weatherCondition.type;
  }
  
  // Get description - handle both mock and real API formats
  let description = conditionType ? conditionType.replace(/_/g, ' ').toLowerCase() : 'unknown';
  if (currentHour.weatherCondition && currentHour.weatherCondition.description && currentHour.weatherCondition.description.text) {
    description = currentHour.weatherCondition.description.text;
  }
  
  // Calculate precipitation probability and amount - handle both mock and real API formats
  let precipProbability = currentHour.precipitationProbability || 0;
  let precipAmount = currentHour.precipitationAmount?.value || 0;
  let precipType = determineGooglePrecipType(conditionType);
  
  // CRITICAL FIX: Handle mock data format precipitation units
  if (currentHour.precipitationAmount && currentHour.precipitationAmount.value && currentHour.precipitationAmount.unit) {
    const mockUnit = currentHour.precipitationAmount.unit;
    if (mockUnit === 'in' || mockUnit === 'inches' || mockUnit === 'INCHES') {
      // Convert mock data inches to millimeters for consistency
      console.log(`[Google Weather Current Mock] Converting precipitation: ${precipAmount} inches → ${precipAmount * 25.4} mm`);
      precipAmount = precipAmount * 25.4;
    } else if (mockUnit === 'mm' || mockUnit === 'MILLIMETERS') {
      // Already in millimeters, no conversion needed
      console.log(`[Google Weather Current Mock] Precipitation already in mm: ${precipAmount} mm`);
    } else {
      // Unknown unit in mock data, log warning and assume inches for safety
      console.warn(`[Google Weather Current Mock] Unknown precipitation unit: ${mockUnit}, assuming inches`);
      precipAmount = precipAmount * 25.4;
    }
  }
  
  if (currentHour.precipitation) {
    if (currentHour.precipitation.probability && currentHour.precipitation.probability.percent !== undefined) {
      precipProbability = currentHour.precipitation.probability.percent;
    }
    if (currentHour.precipitation.qpf && currentHour.precipitation.qpf.quantity !== undefined) {
      precipAmount = currentHour.precipitation.qpf.quantity;
      
      // CRITICAL FIX: Check the actual unit returned by Google Weather API
      // The API documentation is inconsistent about units, so we check the unit field
      const precipUnit = currentHour.precipitation.qpf.unit;
      
      if (precipUnit === 'INCHES' || precipUnit === 'inches') {
        // Convert inches to millimeters for consistency across all APIs
        console.log(`[Google Weather Current] Converting precipitation: ${precipAmount} inches → ${precipAmount * 25.4} mm`);
        precipAmount = precipAmount * 25.4;
      } else if (precipUnit === 'MILLIMETERS' || precipUnit === 'mm') {
        // Already in millimeters, no conversion needed
        console.log(`[Google Weather Current] Precipitation already in mm: ${precipAmount} mm`);
      } else {
        // Unknown unit, log warning and assume inches for safety
        console.warn(`[Google Weather Current] Unknown precipitation unit: ${precipUnit}, assuming inches`);
        precipAmount = precipAmount * 25.4;
      }
    }
    if (currentHour.precipitation.probability && currentHour.precipitation.probability.type) {
      precipType = currentHour.precipitation.probability.type.toLowerCase();
    }
  }
  
  // Get temperature - handle both mock and real API formats
  let temperature = currentHour.temperature?.value || 0;
  let feelsLike = currentHour.temperatureApparent?.value || 0;
  
  if (currentHour.temperature && currentHour.temperature.degrees !== undefined) {
    temperature = currentHour.temperature.degrees;
    // Convert from Celsius to Fahrenheit if needed
    if (currentHour.temperature.unit === 'CELSIUS') {
      temperature = (temperature * 9/5) + 32;
    }
  }
  
  if (currentHour.feelsLikeTemperature && currentHour.feelsLikeTemperature.degrees !== undefined) {
    feelsLike = currentHour.feelsLikeTemperature.degrees;
    // Convert from Celsius to Fahrenheit if needed
    if (currentHour.feelsLikeTemperature.unit === 'CELSIUS') {
      feelsLike = (feelsLike * 9/5) + 32;
    }
  }
  
  // Get wind data - handle both mock and real API formats
  let windSpeed = currentHour.windSpeed?.value || 0;
  let windDirection = currentHour.windDirection?.degrees || 0;
  
  if (currentHour.wind) {
    if (currentHour.wind.speed && currentHour.wind.speed.value !== undefined) {
      windSpeed = currentHour.wind.speed.value;
      // Convert from km/h to mph if needed
      if (currentHour.wind.speed.unit === 'KILOMETERS_PER_HOUR') {
        windSpeed = windSpeed * 0.621371;
      }
    }
    if (currentHour.wind.direction && currentHour.wind.direction.degrees !== undefined) {
      windDirection = currentHour.wind.direction.degrees;
    }
  }
  
  // Get other data - handle both mock and real API formats
  let humidity = currentHour.humidity || currentHour.relativeHumidity || 0;
  let pressure = currentHour.pressure?.value || (currentHour.airPressure?.meanSeaLevelMillibars || 0);
  let visibility = currentHour.visibility?.value || (currentHour.visibility?.distance || 0);
  let cloudCover = currentHour.cloudCover || 0;
  let uvIndex = currentHour.uvIndex || 0;
  
  return {
    temperature: temperature,
    feelsLike: feelsLike,
    humidity: humidity,
    windSpeed: windSpeed,
    windDirection: windDirection,
    pressure: pressure,
    visibility: visibility,
    cloudCover: cloudCover,
    uvIndex: uvIndex,
    description: description,
    icon: mapGoogleWeatherIcon(conditionType, isDay),
    precipitation: {
      probability: precipProbability,
      // Google Weather API returns precipitation in mm after conversion
      // Apply standardized rounding rules
      amount: roundPrecipitation(precipAmount),
      unit: 'mm',
      type: precipType
    },
    rawData: currentHour
  };
}

/**
 * Combine all Google Weather data into a standardized forecast
 * @param {Object} location - Location data
 * @param {Object} forecastData - Google Weather API forecast data
 * @returns {Object} - Complete standardized forecast
 */
function combineGoogleWeatherData(location, forecastData) {
  // Transform hourly data
  const hourly = transformGoogleWeatherHourly(forecastData);
  
  // Create current conditions from the first hour
  const current = createGoogleWeatherCurrent(forecastData);
  
  // Google Weather API doesn't provide daily forecast, so we'll create an empty array
  const daily = [];
  
  return {
    location: location,
    current: current,
    hourly: hourly,
    daily: daily,
    source: 'GoogleWeather',
    lastUpdated: Date.now()
  };
}

// Export the functions
const transformers = {
  transformAzureMapsLocation,
  transformAzureMapsDaily,
  transformAzureMapsHourly,
  combineAzureMapsData,
  createCurrentFromForecast,
  createHourlyFromDaily,
  mapAzureMapsIcon,
  determinePrecipitationType,
  mapOpenMeteoWeatherCode,
  transformOpenMeteoHourly,
  transformOpenMeteoDaily,
  createOpenMeteoCurrent,
  transformOpenMeteoData,
  mapForecaSymbol,
  getForecaDescription,
  determineForecaPrecipType,
  transformForecaCurrent,
  transformForecaDaily,
  transformForecaHourly,
  combineForecaData,
  mapGoogleWeatherIcon,
  determineGooglePrecipType,
  transformGoogleWeatherHourly,
  createGoogleWeatherCurrent,
  combineGoogleWeatherData
};

// For browser environments
if (typeof window !== 'undefined') {
  window.transformers = transformers;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = transformers;
}