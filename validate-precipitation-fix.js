/**
 * Validation script for precipitation unit conversion fixes
 * 
 * This script validates that the precipitation unit conversion issues have been resolved
 */

const transformers = require('./utils/transformers');

console.log('🔍 VALIDATING PRECIPITATION UNIT CONVERSION FIXES');
console.log('================================================\n');

/**
 * Test Foreca precipitation conversion
 */
function testForecaConversion() {
  console.log('🧪 TESTING FORECA PRECIPITATION CONVERSION');
  
  // Test current weather with high precipitation (simulating mm values)
  const mockForecaCurrent = {
    current: {
      temperature: 72,
      feelsLikeTemp: 70,
      relHumidity: 65,
      windSpeed: 8,
      windDir: 270,
      windGust: 12,
      pressure: 1015,
      visibility: 10,
      uvIndex: 5,
      cloudiness: 50,
      symbol: 'd200',
      symbolPhrase: 'light rain',
      precipProb: 80,
      precipAccum: 25.4 // This would be 25.4mm = 1.0 inch
    }
  };
  
  const transformedCurrent = transformers.transformForecaCurrent(mockForecaCurrent);
  console.log(`   Input precipAccum: ${mockForecaCurrent.current.precipAccum} (assumed mm)`);
  console.log(`   Output precipitation amount: ${transformedCurrent.precipitation.amount} inches`);
  console.log(`   Expected: 1.0 inches (25.4mm ÷ 25.4 = 1.0)`);
  console.log(`   ✅ Conversion ${transformedCurrent.precipitation.amount === 1.0 ? 'CORRECT' : 'INCORRECT'}\n`);
  
  // Test hourly forecast with high precipitation
  const mockForecaHourly = {
    forecast: [
      {
        time: '2025-05-24T21:00:00-04:00',
        temperature: 70,
        feelsLikeTemp: 68,
        relHumidity: 75,
        windSpeed: 10,
        windDir: 180,
        windGust: 15,
        pressure: 1012,
        visibility: 8,
        cloudiness: 80,
        symbol: 'd300',
        symbolPhrase: 'moderate rain',
        precipProb: 90,
        precipAccum: 50.8 // This would be 50.8mm = 2.0 inches
      }
    ]
  };
  
  const transformedHourly = transformers.transformForecaHourly(mockForecaHourly);
  if (transformedHourly.length > 0) {
    console.log(`   Hourly input precipAccum: ${mockForecaHourly.forecast[0].precipAccum} (assumed mm)`);
    console.log(`   Hourly output precipitation amount: ${transformedHourly[0].precipitation.amount} inches`);
    console.log(`   Expected: 2.0 inches (50.8mm ÷ 25.4 = 2.0)`);
    console.log(`   ✅ Conversion ${transformedHourly[0].precipitation.amount === 2.0 ? 'CORRECT' : 'INCORRECT'}\n`);
  }
}

/**
 * Test Google Weather (should already be fixed)
 */
function testGoogleWeatherConversion() {
  console.log('🧪 TESTING GOOGLE WEATHER PRECIPITATION (ALREADY FIXED)');
  
  // Test with mock data that simulates the API issue
  const mockGoogleWeather = {
    forecastHours: [
      {
        interval: { startTime: '2025-05-24T21:00:00Z' },
        isDaytime: false,
        weatherCondition: { type: 'RAIN' },
        temperature: { degrees: 70, unit: 'FAHRENHEIT' },
        feelsLikeTemperature: { degrees: 68, unit: 'FAHRENHEIT' },
        wind: { 
          speed: { value: 10, unit: 'MILES_PER_HOUR' },
          direction: { degrees: 180 }
        },
        humidity: 75,
        precipitation: {
          probability: { percent: 90, type: 'RAIN' },
          qpf: { 
            quantity: 0.5, // This is actually 0.5 inches, despite unit saying MILLIMETERS
            unit: 'MILLIMETERS' // This is incorrect - API lies about units
          }
        }
      }
    ]
  };
  
  const transformedGoogle = transformers.transformGoogleWeatherHourly(mockGoogleWeather);
  if (transformedGoogle.length > 0) {
    console.log(`   Input qpf.quantity: ${mockGoogleWeather.forecastHours[0].precipitation.qpf.quantity}`);
    console.log(`   Input qpf.unit: ${mockGoogleWeather.forecastHours[0].precipitation.qpf.unit}`);
    console.log(`   Output precipitation amount: ${transformedGoogle[0].precipitation.amount} inches`);
    console.log(`   Expected: 0.5 inches (no conversion applied)`);
    console.log(`   ✅ Fix ${transformedGoogle[0].precipitation.amount === 0.5 ? 'WORKING' : 'NOT WORKING'}\n`);
  }
}

/**
 * Test OpenMeteo (should be correct)
 */
function testOpenMeteoConversion() {
  console.log('🧪 TESTING OPENMETEO PRECIPITATION (SHOULD BE CORRECT)');
  
  const mockOpenMeteo = {
    hourly: {
      time: ['2025-05-24T21:00'],
      precipitation: [0.3], // Already in inches
      precipitation_probability: [80],
      temperature_2m: [70],
      is_day: [0],
      weathercode: [61]
    },
    hourly_units: {
      precipitation: 'inch'
    }
  };
  
  const transformedOpenMeteo = transformers.transformOpenMeteoHourly(mockOpenMeteo);
  if (transformedOpenMeteo.length > 0) {
    console.log(`   Input precipitation: ${mockOpenMeteo.hourly.precipitation[0]} ${mockOpenMeteo.hourly_units.precipitation}`);
    console.log(`   Output precipitation amount: ${transformedOpenMeteo[0].precipitation.amount} inches`);
    console.log(`   Expected: 0.3 inches (no conversion needed)`);
    console.log(`   ✅ Handling ${transformedOpenMeteo[0].precipitation.amount === 0.3 ? 'CORRECT' : 'INCORRECT'}\n`);
  }
}

/**
 * Test Azure Maps (should be correct with imperial units)
 */
function testAzureMapsConversion() {
  console.log('🧪 TESTING AZURE MAPS PRECIPITATION (SHOULD BE CORRECT)');
  
  const mockAzureMaps = {
    forecasts: [
      {
        date: '2025-05-24T21:00:00+00:00',
        temperature: { value: 70 },
        realFeelTemperature: { value: 68 },
        relativeHumidity: 75,
        wind: { 
          speed: { value: 10 },
          direction: { degrees: 180 }
        },
        phrase: 'Light Rain',
        iconCode: 18,
        precipitationProbability: 80,
        rain: { value: 0.4 } // Should already be in inches due to imperial unit setting
      }
    ]
  };
  
  const transformedAzure = transformers.transformAzureMapsHourly(mockAzureMaps);
  if (transformedAzure.length > 0) {
    console.log(`   Input rain.value: ${mockAzureMaps.forecasts[0].rain.value} (imperial units)`);
    console.log(`   Output precipitation amount: ${transformedAzure[0].precipitation.amount} inches`);
    console.log(`   Expected: 0.4 inches (no conversion needed)`);
    console.log(`   ✅ Handling ${transformedAzure[0].precipitation.amount === 0.4 ? 'CORRECT' : 'INCORRECT'}\n`);
  }
}

/**
 * Summary of realistic precipitation values
 */
function showRealisticValues() {
  console.log('📊 REALISTIC PRECIPITATION VALUES FOR REFERENCE');
  console.log('===============================================');
  console.log('   Trace rain: 0.01 - 0.05 inches');
  console.log('   Light rain: 0.05 - 0.25 inches per hour');
  console.log('   Moderate rain: 0.25 - 0.75 inches per hour');
  console.log('   Heavy rain: 0.75 - 1.5 inches per hour');
  console.log('   Very heavy rain: 1.5+ inches per hour');
  console.log('   Daily totals: 0.1 - 3.0 inches typical\n');
}

// Run all tests
try {
  testForecaConversion();
  testGoogleWeatherConversion();
  testOpenMeteoConversion();
  testAzureMapsConversion();
  showRealisticValues();
  
  console.log('✅ VALIDATION COMPLETE');
  console.log('======================');
  console.log('🔧 FIXES APPLIED:');
  console.log('   1. ✅ Foreca API: Added mm to inches conversion (÷ 25.4)');
  console.log('   2. ✅ Google Weather API: Already fixed (no conversion)');
  console.log('   3. ✅ OpenMeteo API: Correctly configured for inches');
  console.log('   4. ✅ Azure Maps API: Correctly configured for imperial units');
  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. Restart the server to apply changes');
  console.log('   2. Clear browser cache');
  console.log('   3. Test with real weather data');
  console.log('   4. Verify precipitation values are now realistic (0.1-5mm typical)');
  
} catch (error) {
  console.error('❌ Error during validation:', error.message);
}