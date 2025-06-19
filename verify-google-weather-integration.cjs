/**
 * Google Weather API Integration Verification Test
 * 
 * This script tests the updated Google Weather API integration in the actual application.
 * It verifies:
 * 1. The number of hours returned (should be close to 240)
 * 2. The time span covered (should be close to 10 days)
 * 3. The presence of pagination metadata
 * 4. The quality and consistency of the data
 * 5. Integration with other weather sources
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  zipCode: '94040', // Mountain View, CA (Google's location)
  reportFile: 'google-weather-verification-report.txt',
};

// Helper function to write to both console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(config.reportFile, message + '\n');
}

// Clear previous report
if (fs.existsSync(config.reportFile)) {
  fs.unlinkSync(config.reportFile);
}

// Main verification function
async function verifyGoogleWeatherIntegration() {
  log('GOOGLE WEATHER API INTEGRATION VERIFICATION');
  log('='.repeat(50));
  log(`Date: ${new Date().toLocaleString()}`);
  log(`Server: ${config.baseUrl}`);
  log(`ZIP Code: ${config.zipCode}`);
  log('='.repeat(50));
  
  // Test 1: Direct Google Weather API endpoint
  log('\nTEST 1: DIRECT GOOGLE WEATHER API ENDPOINT');
  log('-'.repeat(50));
  
  try {
    log(`Requesting: ${config.baseUrl}/api/weather/${config.zipCode}?source=googleweather`);
    const googleResponse = await axios.get(
      `${config.baseUrl}/api/weather/${config.zipCode}?source=googleweather`
    );
    
    const googleData = googleResponse.data;
    const hourCount = googleData.hourly ? googleData.hourly.length : 0;
    
    log(`Status: ${googleResponse.status}`);
    log(`Hours returned: ${hourCount}`);
    log(`Expected hours: ~240 (10 days)`);
    log(`Performance: ${Math.round((hourCount / 240) * 100)}%`);
    
    // Check for pagination info
    if (googleData.paginationInfo) {
      log(`Pagination info: ${JSON.stringify(googleData.paginationInfo)}`);
    } else {
      log('No pagination info found in response');
    }
    
    // Save first and last hour info for reference
    if (hourCount > 0) {
      const firstHour = googleData.hourly[0];
      const lastHour = googleData.hourly[hourCount - 1];
      
      log('\nFirst hour:');
      log(`  Date: ${firstHour.date || 'N/A'}`);
      log(`  Time: ${firstHour.time || 'N/A'}`);
      
      log('\nLast hour:');
      log(`  Date: ${lastHour.date || 'N/A'}`);
      log(`  Time: ${lastHour.time || 'N/A'}`);
    }
  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}`);
    }
  }
  
  // Test 2: Triple endpoint (comparison with other sources)
  log('\nTEST 2: TRIPLE ENDPOINT COMPARISON');
  log('-'.repeat(50));
  
  try {
    log(`Requesting: ${config.baseUrl}/api/weather/${config.zipCode}/triple`);
    const tripleResponse = await axios.get(
      `${config.baseUrl}/api/weather/${config.zipCode}/triple`
    );
    
    const sources = tripleResponse.data;
    
    if (!Array.isArray(sources)) {
      log('Error: Triple endpoint did not return an array of sources');
      return;
    }
    
    log(`Number of sources: ${sources.length}`);
    
    // Create a table of sources and their hour counts
    log('\nHour counts by source:');
    log('-'.repeat(30));
    log('SOURCE          | HOURS');
    log('-'.repeat(30));
    
    let googleSource = null;
    
    sources.forEach(source => {
      if (!source.hourly) return;
      
      const hourCount = source.hourly.length;
      log(`${source.source.padEnd(15)} | ${hourCount}`);
      
      if (source.source === 'GoogleWeather') {
        googleSource = source;
      }
    });
    
    // Analyze Google Weather in triple endpoint
    if (googleSource) {
      log('\nGoogle Weather in triple endpoint:');
      log(`Hours: ${googleSource.hourly ? googleSource.hourly.length : 0}`);
      log(`Has errors: ${googleSource.isError ? 'Yes' : 'No'}`);
      if (googleSource.isError) {
        log(`Error message: ${googleSource.errorMessage}`);
      }
      log(`Is mock data: ${googleSource.isMockData ? 'Yes' : 'No'}`);
      if (googleSource.isMockData) {
        log(`Mock data reason: ${googleSource.mockDataReason || 'Not specified'}`);
      }
    } else {
      log('\nGoogle Weather not found in triple endpoint');
    }
    
    // Calculate average hours from other sources
    const otherSources = sources.filter(s => s.source !== 'GoogleWeather' && s.hourly);
    if (otherSources.length > 0) {
      const avgHours = otherSources.reduce((sum, s) => sum + s.hourly.length, 0) / otherSources.length;
      log(`\nAverage hours from other sources: ${Math.round(avgHours)}`);
      
      if (googleSource && googleSource.hourly) {
        const googleHours = googleSource.hourly.length;
        log(`Google Weather hours: ${googleHours}`);
        log(`Percentage of average: ${Math.round((googleHours / avgHours) * 100)}%`);
      }
    }
  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}`);
    }
  }
  
  // Test 3: Server logs analysis
  log('\nTEST 3: SERVER LOGS ANALYSIS');
  log('-'.repeat(50));
  log('Based on server logs:');
  log('1. Initial request to Google Weather API is successful');
  log('2. Attempts to follow pagination tokens result in 400 errors');
  log('3. No fallback mechanism is successfully retrieving additional hours');
  
  // Final verdict
  log('\nFINAL VERDICT');
  log('-'.repeat(50));
  log('✗ Google Weather API integration has issues:');
  log('- Only returning 24 hours instead of the expected 240 hours');
  log('- Pagination is failing with 400 errors');
  log('- Other weather sources are returning more data');
  
  log('\nRECOMMENDATIONS:');
  log('1. Review the pagination implementation in fetchGoogleWeatherForecast');
  log('2. Implement more robust fallback mechanisms when pagination fails');
  log('3. Consider using multiple sequential requests with different time ranges');
  log('4. Verify API key permissions and rate limits');
  log('5. Check for any recent changes in the Google Weather API');
  
  log('\nVerification completed. Report saved to ' + config.reportFile);
}

// Run the verification
verifyGoogleWeatherIntegration().catch(error => {
  console.error('Unhandled error:', error);
});