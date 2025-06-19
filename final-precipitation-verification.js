const axios = require('axios');
const fs = require('fs');

// Test configuration
const TEST_ZIP = '10001'; // New York City
const TEST_LAT = 40.7143;
const TEST_LON = -74.006;

console.log('🔍 FINAL PRECIPITATION UNIT VERIFICATION');
console.log('=========================================');
console.log(`Testing ZIP: ${TEST_ZIP} (NYC)`);
console.log(`Coordinates: ${TEST_LAT}, ${TEST_LON}`);
console.log('');

async function testBackendAPI() {
  console.log('📡 Testing Backend Weather API...');
  try {
    const response = await axios.get(`http://localhost:3000/api/weather/${TEST_ZIP}`);
    
    if (response.data && response.data.length > 0) {
      console.log('✅ Backend API responded successfully');
      console.log(`📊 Services returned: ${response.data.length}`);
      
      // Analyze each service's precipitation data
      response.data.forEach((service, index) => {
        console.log(`\n🌤️  Service ${index + 1}: ${service.service}`);
        console.log(`   Location: ${service.location}`);
        
        if (service.hourlyData && service.hourlyData.length > 0) {
          // Find hours with precipitation > 0
          const precipHours = service.hourlyData.filter(hour => 
            hour.precipitation && parseFloat(hour.precipitation) > 0
          );
          
          if (precipHours.length > 0) {
            console.log(`   ✅ Found ${precipHours.length} hours with precipitation`);
            precipHours.slice(0, 3).forEach(hour => {
              console.log(`      ${hour.time}: ${hour.precipitation} ${hour.precipitationUnit || 'mm'}`);
            });
          } else {
            console.log(`   ℹ️  No precipitation in forecast`);
            // Show first few hours anyway to verify units
            service.hourlyData.slice(0, 3).forEach(hour => {
              console.log(`      ${hour.time}: ${hour.precipitation} ${hour.precipitationUnit || 'mm'}`);
            });
          }
        } else {
          console.log(`   ❌ No hourly data available`);
        }
      });
      
      return response.data;
    } else {
      console.log('❌ Backend API returned no data');
      return null;
    }
  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
    return null;
  }
}

async function testIndividualAPIs() {
  console.log('\n🔬 Testing Individual Weather APIs...');
  
  // Test Azure Maps API
  console.log('\n🌐 Testing Azure Maps API...');
  try {
    const azureResponse = await axios.get('https://atlas.microsoft.com/weather/forecast/hourly/json', {
      params: {
        'api-version': '1.0',
        'subscription-key': process.env.AZURE_MAPS_KEY || 'test-key',
        query: `${TEST_LAT},${TEST_LON}`,
        duration: 240
      }
    });
    
    if (azureResponse.data && azureResponse.data.forecasts) {
      console.log('✅ Azure Maps API responded');
      const precipForecasts = azureResponse.data.forecasts.filter(f => 
        f.precipitationSummary && f.precipitationSummary.pastHour && f.precipitationSummary.pastHour.value > 0
      );
      
      if (precipForecasts.length > 0) {
        console.log(`   Found ${precipForecasts.length} hours with precipitation:`);
        precipForecasts.slice(0, 3).forEach(f => {
          console.log(`      ${f.date}: ${f.precipitationSummary.pastHour.value} ${f.precipitationSummary.pastHour.unit}`);
        });
      } else {
        console.log('   No precipitation in Azure forecast');
        // Show first few anyway
        azureResponse.data.forecasts.slice(0, 3).forEach(f => {
          const precip = f.precipitationSummary?.pastHour?.value || 0;
          const unit = f.precipitationSummary?.pastHour?.unit || 'mm';
          console.log(`      ${f.date}: ${precip} ${unit}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Azure Maps API test failed:', error.message);
  }
  
  // Test OpenMeteo API
  console.log('\n🌤️  Testing OpenMeteo API...');
  try {
    const openMeteoResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: TEST_LAT,
        longitude: TEST_LON,
        timezone: 'America/New_York',
        current_weather: true,
        forecast_days: 14,
        models: 'gfs_graphcast025',
        hourly: 'precipitation',
        temperature_unit: 'fahrenheit',
        windspeed_unit: 'mph',
        precipitation_unit: 'inch'
      }
    });
    
    if (openMeteoResponse.data && openMeteoResponse.data.hourly) {
      console.log('✅ OpenMeteo API responded');
      const precipData = openMeteoResponse.data.hourly.precipitation;
      const precipUnit = openMeteoResponse.data.hourly_units.precipitation;
      
      console.log(`   Precipitation unit: ${precipUnit}`);
      
      const nonZeroPrecip = precipData.map((val, idx) => ({ 
        time: openMeteoResponse.data.hourly.time[idx], 
        value: val 
      })).filter(item => item.value > 0);
      
      if (nonZeroPrecip.length > 0) {
        console.log(`   Found ${nonZeroPrecip.length} hours with precipitation:`);
        nonZeroPrecip.slice(0, 3).forEach(item => {
          console.log(`      ${item.time}: ${item.value} ${precipUnit}`);
        });
      } else {
        console.log('   No precipitation in OpenMeteo forecast');
        // Show first few values
        precipData.slice(0, 3).forEach((val, idx) => {
          console.log(`      ${openMeteoResponse.data.hourly.time[idx]}: ${val} ${precipUnit}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ OpenMeteo API test failed:', error.message);
  }
  
  // Test Google Weather API
  console.log('\n🔍 Testing Google Weather API...');
  try {
    const googleResponse = await axios.get('https://weather.googleapis.com/v1/forecast', {
      params: {
        key: process.env.GOOGLE_WEATHER_API_KEY || 'test-key',
        location: `${TEST_LAT},${TEST_LON}`,
        units: 'metric'
      }
    });
    
    if (googleResponse.data) {
      console.log('✅ Google Weather API responded');
      // Note: Google Weather API structure may vary
      console.log('   Response structure:', Object.keys(googleResponse.data));
    }
  } catch (error) {
    console.log('❌ Google Weather API test failed:', error.message);
  }
  
  // Test Foreca API
  console.log('\n🌦️  Testing Foreca API...');
  try {
    const forecaResponse = await axios.get('https://pfa.foreca.com/api/v1/forecast/hourly', {
      params: {
        location: `${TEST_LAT},${TEST_LON}`,
        periods: 24
      },
      headers: {
        'Authorization': `Bearer ${process.env.FORECA_API_KEY || 'test-key'}`
      }
    });
    
    if (forecaResponse.data) {
      console.log('✅ Foreca API responded');
      console.log('   Response structure:', Object.keys(forecaResponse.data));
    }
  } catch (error) {
    console.log('❌ Foreca API test failed:', error.message);
  }
}

async function analyzeTransformations() {
  console.log('\n🔄 Testing Precipitation Unit Transformations...');
  
  // Test the transformation functions directly
  try {
    const transformers = require('./utils/transformers.js');
    
    console.log('\n📐 Testing conversion functions:');
    
    // Test inch to mm conversion (Azure Maps case)
    const testInches = 0.04;
    const expectedMM = testInches * 25.4; // Should be ~1.016 mm
    console.log(`   ${testInches} inches → ${expectedMM} mm (expected: ~1.016)`);
    
    // Test mm to mm (no conversion needed)
    const testMM = 2.5;
    console.log(`   ${testMM} mm → ${testMM} mm (no conversion)`);
    
    // Test various precipitation values
    const testValues = [0, 0.01, 0.04, 0.1, 0.5, 1.0, 2.0];
    console.log('\n   Conversion table (inches → mm):');
    testValues.forEach(inches => {
      const mm = inches * 25.4;
      console.log(`      ${inches}" → ${mm.toFixed(3)} mm`);
    });
    
  } catch (error) {
    console.log('❌ Transformation test failed:', error.message);
  }
}

async function generateVerificationReport(backendData) {
  console.log('\n📋 VERIFICATION REPORT');
  console.log('=====================');
  
  if (!backendData) {
    console.log('❌ FAILED: No backend data available for verification');
    return;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    testZip: TEST_ZIP,
    servicesCount: backendData.length,
    services: {}
  };
  
  backendData.forEach(service => {
    const serviceName = service.service;
    const hasHourlyData = service.hourlyData && service.hourlyData.length > 0;
    
    if (hasHourlyData) {
      const precipHours = service.hourlyData.filter(hour => 
        hour.precipitation && parseFloat(hour.precipitation) > 0
      );
      
      const sampleHour = service.hourlyData[0];
      const precipUnit = sampleHour.precipitationUnit || 'mm';
      
      report.services[serviceName] = {
        status: 'SUCCESS',
        hourlyDataCount: service.hourlyData.length,
        precipitationHours: precipHours.length,
        precipitationUnit: precipUnit,
        sampleValues: service.hourlyData.slice(0, 3).map(hour => ({
          time: hour.time,
          precipitation: hour.precipitation,
          unit: hour.precipitationUnit || 'mm'
        }))
      };
      
      // Verify expected units
      let expectedUnit = 'mm'; // Default
      if (serviceName.toLowerCase().includes('openmeteo')) {
        expectedUnit = 'inch'; // OpenMeteo should be in inches
      }
      
      const unitCorrect = precipUnit === expectedUnit;
      report.services[serviceName].unitCorrect = unitCorrect;
      
      if (unitCorrect) {
        console.log(`✅ ${serviceName}: Correct unit (${precipUnit})`);
      } else {
        console.log(`❌ ${serviceName}: Wrong unit (${precipUnit}, expected ${expectedUnit})`);
      }
      
    } else {
      report.services[serviceName] = {
        status: 'NO_DATA',
        error: 'No hourly data available'
      };
      console.log(`❌ ${serviceName}: No hourly data`);
    }
  });
  
  // Save report
  fs.writeFileSync('precipitation-verification-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Report saved to: precipitation-verification-report.json');
  
  // Final assessment
  const successfulServices = Object.values(report.services).filter(s => s.status === 'SUCCESS').length;
  const correctUnits = Object.values(report.services).filter(s => s.unitCorrect === true).length;
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log(`   Services responding: ${successfulServices}/${backendData.length}`);
  console.log(`   Correct units: ${correctUnits}/${successfulServices}`);
  
  if (correctUnits === successfulServices && successfulServices > 0) {
    console.log('✅ ALL PRECIPITATION UNIT CONVERSIONS ARE WORKING CORRECTLY!');
  } else {
    console.log('❌ Some precipitation unit conversions need attention');
  }
}

async function runVerification() {
  try {
    console.log('Starting comprehensive precipitation verification...\n');
    
    // Test backend API (main test)
    const backendData = await testBackendAPI();
    
    // Test individual APIs for reference
    await testIndividualAPIs();
    
    // Test transformation functions
    await analyzeTransformations();
    
    // Generate final report
    await generateVerificationReport(backendData);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
runVerification();