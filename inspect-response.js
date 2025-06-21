/**
 * Simple script to inspect the Google Weather API response structure
 */

const axios = require('axios');

async function inspectGoogleWeatherResponse() {
  try {
    console.log('Fetching data from http://localhost:3000/api/weather/94040?source=googleweather');
    
    const response = await axios.get(
      'http://localhost:3000/api/weather/94040?source=googleweather',
      { timeout: 30000 }
    );
    
    const data = response.data;
    
    // Print basic info
    console.log(`\nResponse received. Status: ${response.status}`);
    console.log(`Content type: ${response.headers['content-type']}`);
    console.log(`Data type: ${typeof data}`);
    
    // Print top-level keys
    console.log('\nTop-level keys in response:');
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (Array.isArray(value)) {
        console.log(`- ${key}: Array with ${value.length} items`);
      } else if (typeof value === 'object' && value !== null) {
        console.log(`- ${key}: Object with keys [${Object.keys(value).join(', ')}]`);
      } else {
        console.log(`- ${key}: ${value}`);
      }
    });
    
    // Print hourly data structure
    if (data.hourly && Array.isArray(data.hourly) && data.hourly.length > 0) {
      console.log('\nHourly data structure (first item):');
      const firstHour = data.hourly[0];
      
      Object.keys(firstHour).forEach(key => {
        const value = firstHour[key];
        if (typeof value === 'object' && value !== null) {
          console.log(`- ${key}: Object with keys [${Object.keys(value).join(', ')}]`);
        } else {
          console.log(`- ${key}: ${value}`);
        }
      });
      
      // Save the full response to a file for inspection
      const fs = require('fs');
      fs.writeFileSync('google-weather-response.json', JSON.stringify(data, null, 2));
      console.log('\nFull response saved to google-weather-response.json');
    } else {
      console.log('\nNo hourly data found in the response');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the inspection
inspectGoogleWeatherResponse();
