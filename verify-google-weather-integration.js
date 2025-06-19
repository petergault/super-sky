/**
 * Google Weather API Integration Verification Test
 */

const axios = require('axios');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  zipCode: '94040', // Mountain View, CA (Google's location)
  timeoutMs: 30000, // 30 seconds timeout for API calls
};

console.log('GOOGLE WEATHER API INTEGRATION VERIFICATION TEST');
console.log('='.repeat(60));
console.log(`Testing against server: ${config.baseUrl}`);
console.log(`Using ZIP code: ${config.zipCode}`);
console.log('='.repeat(60));

// Test functions
async function testGoogleWeatherEndpoint() {
  console.log('\nTesting Google Weather API Endpoint');
  console.log('='.repeat(50));
  
  try {
    console.log(`Fetching data from ${config.baseUrl}/api/weather/${config.zipCode}?source=googleweather`);
    
    const startTime = Date.now();
    const response = await axios.get(
      `${config.baseUrl}/api/weather/${config.zipCode}?source=googleweather`,
      { timeout: config.timeoutMs }
    );
    const endTime = Date.now();
    
    console.log(`Request completed in ${(endTime - startTime) / 1000} seconds`);
    
    const data = response.data;
    
    // Check if we got data
    if (!data || !data.hourly) {
      console.log('No hourly data returned');
      return null;
    }
    
    // Verify the number of hours
    const hourCount = data.hourly.length;
    console.log(`Number of hours: ${hourCount}`);
    
    // Verify the time span
    if (hourCount > 0) {
      const firstHour = data.hourly[0];
      const lastHour = data.hourly[hourCount - 1];
      
      console.log(`First hour: ${new Date(firstHour.time).toLocaleString()}`);
      console.log(`Last hour: ${new Date(lastHour.time).toLocaleString()}`);
      
      const start = new Date(firstHour.time);
      const end = new Date(lastHour.time);
      const diffTime = Math.abs(end - start);
      const daysCovered = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`Days covered: ${daysCovered}`);
    }
    
    // Check for pagination metadata
    if (data.paginationInfo) {
      console.log('Pagination metadata is present');
      console.log(`Pages requested: ${data.paginationInfo.pagesRequested}`);
      console.log(`Total hours retrieved: ${data.paginationInfo.totalHoursRetrieved}`);
      console.log(`Hours from API: ${data.paginationInfo.hoursFromApi}`);
      console.log(`Hours from mock data: ${data.paginationInfo.hoursFromMockData}`);
    } else {
      console.log('No pagination metadata found');
    }
    
    return data;
  } catch (error) {
    console.log(`Error testing Google Weather endpoint: ${error.message}`);
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function testTripleEndpoint() {
  console.log('\nTesting Triple Weather Endpoint (Integration Test)');
  console.log('='.repeat(50));
  
  try {
    console.log(`Fetching data from ${config.baseUrl}/api/weather/${config.zipCode}/triple`);
    
    const startTime = Date.now();
    const response = await axios.get(
      `${config.baseUrl}/api/weather/${config.zipCode}/triple`,
      { timeout: config.timeoutMs }
    );
    const endTime = Date.now();
    
    console.log(`Request completed in ${(endTime - startTime) / 1000} seconds`);
    
    const data = response.data;
    
    // Check if we got data from all sources
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No data returned from triple endpoint');
      return null;
    }
    
    console.log(`Number of sources: ${data.length}`);
    
    // Find Google Weather data
    const googleWeatherData = data.find(source => source.source === 'GoogleWeather');
    
    if (!googleWeatherData) {
      console.log('Google Weather data not found in triple endpoint response');
      return data;
    }
    
    console.log('Google Weather data found in triple endpoint response');
    
    // Check for errors
    if (googleWeatherData.isError) {
      console.log(`Google Weather data has an error: ${googleWeatherData.errorMessage}`);
    } else {
      console.log('Google Weather data has no errors');
    }
    
    // Check if it's mock data
    if (googleWeatherData.isMockData) {
      console.log('Google Weather data is mock data');
      if (googleWeatherData.mockDataReason) {
        console.log(`Reason for mock data: ${googleWeatherData.mockDataReason}`);
      }
    }
    
    // Compare hour counts across sources
    const sourcesWithHourly = data.filter(source => source.hourly && Array.isArray(source.hourly));
    
    console.log(`Sources with hourly data: ${sourcesWithHourly.length}`);
    
    if (sourcesWithHourly.length > 0) {
      const hourCounts = sourcesWithHourly.map(source => ({
        source: source.source,
        hourCount: source.hourly.length
      }));
      
      console.log('\nHour counts by source:');
      hourCounts.forEach(item => {
        console.log(`${item.source.padEnd(15)}: ${item.hourCount} hours`);
      });
    }
    
    return data;
  } catch (error) {
    console.log(`Error testing triple endpoint: ${error.message}`);
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Main test function
async function runTests() {
  // Test the Google Weather endpoint
  const googleWeatherData = await testGoogleWeatherEndpoint();
  
  // Test the triple endpoint
  const tripleData = await testTripleEndpoint();
  
  // Final summary
  console.log('\nTest Summary');
  console.log('='.repeat(50));
  
  if (googleWeatherData && tripleData) {
    const googleHours = googleWeatherData.hourly ? googleWeatherData.hourly.length : 0;
    
    // Calculate days covered
    let googleDaysCovered = 0;
    if (googleHours > 0) {
      const firstHour = googleWeatherData.hourly[0];
      const lastHour = googleWeatherData.hourly[googleHours - 1];
      const start = new Date(firstHour.time);
      const end = new Date(lastHour.time);
      const diffTime = Math.abs(end - start);
      googleDaysCovered = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const googleInTriple = tripleData.find(source => source.source === 'GoogleWeather');
    const googleTripleHours = googleInTriple && googleInTriple.hourly ? googleInTriple.hourly.length : 0;
    
    console.log('\nGoogle Weather API Integration Results:');
    console.log(`Direct endpoint hours: ${googleHours}`);
    console.log(`Direct endpoint days covered: ${googleDaysCovered}`);
    console.log(`Triple endpoint hours: ${googleTripleHours}`);
    console.log(`Using mock data: ${googleWeatherData.isMockData ? 'Yes' : 'No'}`);
    
    if (googleHours >= 200 && googleDaysCovered >= 9 && googleTripleHours >= 200) {
      console.log('\n✓ Google Weather API integration is working correctly!');
    } else if (googleHours >= 100 && googleDaysCovered >= 7 && googleTripleHours >= 100) {
      console.log('\n⚠ Google Weather API integration is partially working.');
    } else {
      console.log('\n✗ Google Weather API integration has issues.');
    }
  } else {
    console.log('\n✗ Tests failed to complete successfully.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
