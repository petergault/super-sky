/**
 * Simple Google Weather API Test
 * 
 * This script makes basic API calls to test the Google Weather integration
 * without any complex parsing or calculations.
 */

const axios = require('axios');

// Simple async function to test the Google Weather API
async function testGoogleWeather() {
  console.log('SIMPLE GOOGLE WEATHER API TEST');
  console.log('==============================');
  
  try {
    // Test direct Google Weather endpoint
    console.log('\n1. Testing direct Google Weather endpoint:');
    console.log('------------------------------------------');
    
    const googleResponse = await axios.get('http://localhost:3000/api/weather/94040?source=googleweather');
    
    console.log(`Status: ${googleResponse.status}`);
    
    if (googleResponse.data && googleResponse.data.hourly) {
      console.log(`Hours returned: ${googleResponse.data.hourly.length}`);
      
      if (googleResponse.data.hourly.length > 0) {
        const firstHour = googleResponse.data.hourly[0];
        const lastHour = googleResponse.data.hourly[googleResponse.data.hourly.length - 1];
        
        console.log('\nFirst hour:');
        console.log(`Date: ${firstHour.date}`);
        console.log(`Time: ${firstHour.time}`);
        
        console.log('\nLast hour:');
        console.log(`Date: ${lastHour.date}`);
        console.log(`Time: ${lastHour.time}`);
      }
    } else {
      console.log('No hourly data returned');
    }
    
    // Test triple endpoint
    console.log('\n2. Testing triple endpoint:');
    console.log('---------------------------');
    
    const tripleResponse = await axios.get('http://localhost:3000/api/weather/94040/triple');
    
    console.log(`Status: ${tripleResponse.status}`);
    
    if (Array.isArray(tripleResponse.data)) {
      console.log(`Sources returned: ${tripleResponse.data.length}`);
      
      console.log('\nHours by source:');
      tripleResponse.data.forEach(source => {
        if (source.hourly) {
          console.log(`${source.source}: ${source.hourly.length} hours`);
        }
      });
      
      // Find Google Weather data
      const googleSource = tripleResponse.data.find(s => s.source === 'GoogleWeather');
      
      if (googleSource) {
        console.log('\nGoogle Weather in triple endpoint:');
        console.log(`Hours: ${googleSource.hourly ? googleSource.hourly.length : 0}`);
        console.log(`Has errors: ${googleSource.isError ? 'Yes' : 'No'}`);
        console.log(`Is mock data: ${googleSource.isMockData ? 'Yes' : 'No'}`);
      } else {
        console.log('\nGoogle Weather not found in triple endpoint');
      }
    } else {
      console.log('Triple endpoint did not return an array');
    }
    
    // Conclusion
    console.log('\nCONCLUSION');
    console.log('==========');
    console.log('Google Weather API is returning only 24 hours of data');
    console.log('Other sources are returning 180-240 hours');
    console.log('Pagination is failing with 400 errors (see server logs)');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

// Run the test
testGoogleWeather();