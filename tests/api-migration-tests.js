/**
 * API Migration Test Suite
 * 
 * This file contains tests to verify the successful migration from front-end API key
 * management to back-end API endpoints in the Super Sky App.
 */

// Test Suite Configuration
const TEST_CONFIG = {
  validZipCode: '10001',
  invalidZipCode: 'abcde',
  testTimeout: 10000, // 10 seconds
  cacheTestDelay: 2000, // 2 seconds
};

// Test Results Container
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Adds a test result to the results container
 * @param {string} name - Test name
 * @param {boolean} passed - Whether the test passed
 * @param {string} message - Test result message
 * @param {Object} [details] - Additional test details
 */
function addTestResult(name, passed, message, details = {}) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.details.push({
    name,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  // Log to console
  console.log(
    `${passed ? '✅ PASS' : '❌ FAIL'} - ${name}: ${message}`,
    details
  );
}

/**
 * Creates a test element in the DOM
 * @param {string} name - Test name
 * @param {boolean} passed - Whether the test passed
 * @param {string} message - Test result message
 * @param {Object} [details] - Additional test details
 */
function createTestElement(name, passed, message, details = {}) {
  const testContainer = document.getElementById('test-results');
  if (!testContainer) return;
  
  const testElement = document.createElement('div');
  testElement.className = `test-result ${passed ? 'pass' : 'fail'}`;
  
  const header = document.createElement('h3');
  header.textContent = `${passed ? '✅' : '❌'} ${name}`;
  
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  
  testElement.appendChild(header);
  testElement.appendChild(messageElement);
  
  // Add details if provided
  if (Object.keys(details).length > 0) {
    const detailsElement = document.createElement('pre');
    detailsElement.textContent = JSON.stringify(details, null, 2);
    testElement.appendChild(detailsElement);
  }
  
  testContainer.appendChild(testElement);
}

/**
 * Runs a test and handles results
 * @param {string} name - Test name
 * @param {Function} testFn - Test function that returns a promise
 * @param {number} [timeout] - Test timeout in milliseconds
 */
async function runTest(name, testFn, timeout = TEST_CONFIG.testTimeout) {
  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timed out')), timeout);
    });
    
    // Race the test function against the timeout
    const result = await Promise.race([testFn(), timeoutPromise]);
    
    addTestResult(name, true, result.message, result.details);
    createTestElement(name, true, result.message, result.details);
  } catch (error) {
    addTestResult(name, false, error.message, { stack: error.stack });
    createTestElement(name, false, error.message, { stack: error.stack });
  }
}

/**
 * Updates the summary element with test results
 */
function updateSummary() {
  const summaryElement = document.getElementById('test-summary');
  if (!summaryElement) return;
  
  summaryElement.textContent = `Tests: ${testResults.total}, Passed: ${testResults.passed}, Failed: ${testResults.failed}`;
  summaryElement.className = testResults.failed > 0 ? 'summary-fail' : 'summary-pass';
}

// ===== FUNCTIONAL TESTS =====

/**
 * Test: Verify that weather data is correctly fetched for a valid ZIP code
 */
async function testFetchWeatherData() {
  const zipCode = TEST_CONFIG.validZipCode;
  
  // Ensure mock API handler is active
  if (!window.mockApiHandler.isActive) {
    window.mockApiHandler.start();
  }
  
  // Use the weatherService directly
  const weatherData = await window.weatherService.fetchWeatherData(zipCode);
  
  if (!weatherData) {
    throw new Error('No weather data returned');
  }
  
  if (weatherData.isError) {
    throw new Error(`Error fetching weather data: ${weatherData.errorMessage}`);
  }
  
  // Verify the data structure
  if (!weatherData.location || !weatherData.current) {
    throw new Error('Weather data missing required fields');
  }
  
  return {
    message: 'Successfully fetched weather data for valid ZIP code',
    details: {
      location: weatherData.location,
      temperature: weatherData.current.temperature,
      source: weatherData.source
    }
  };
}

/**
 * Test: Verify that super sky weather data is correctly fetched
 */
async function testFetchTripleCheckWeather() {
  const zipCode = TEST_CONFIG.validZipCode;
  
  // Ensure mock API handler is active
  if (!window.mockApiHandler.isActive) {
    window.mockApiHandler.start();
  }
  
  // Use the weatherService directly
  const weatherData = await window.weatherService.fetchTripleCheckWeather(zipCode);
  
  if (!weatherData || !Array.isArray(weatherData) || weatherData.length === 0) {
    throw new Error('No super sky weather data returned');
  }
  
  // Check if at least one source succeeded
  const anySuccess = weatherData.some(data => !data.isError);
  if (!anySuccess) {
    throw new Error('All sources failed to fetch weather data');
  }
  
  return {
    message: 'Successfully fetched super sky weather data',
    details: {
      sources: weatherData.map(data => data.source),
      successCount: weatherData.filter(data => !data.isError).length
    }
  };
}

/**
 * Test: Verify that caching works correctly with back-end endpoints
 */
async function testCaching() {
  const zipCode = TEST_CONFIG.validZipCode;
  
  // Ensure mock API handler is active
  if (!window.mockApiHandler.isActive) {
    window.mockApiHandler.start();
  }
  
  // Clear cache to start fresh
  window.mockApiHandler.cacheStore.clear();
  
  // First fetch to populate cache
  const firstFetch = await window.weatherService.fetchWeatherData(zipCode);
  
  // Small delay to ensure timestamps are different
  await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.cacheTestDelay));
  
  // Second fetch should use cache
  const secondFetch = await window.weatherService.fetchWeatherData(zipCode);
  
  if (!secondFetch.fromCache) {
    throw new Error('Second fetch did not use cached data');
  }
  
  // Force refresh should bypass cache
  const forcedFetch = await window.weatherService.fetchWeatherData(zipCode, true);
  
  if (forcedFetch.fromCache) {
    throw new Error('Force refresh did not bypass cache');
  }
  
  return {
    message: 'Caching works correctly with back-end endpoints',
    details: {
      firstFetchTime: new Date(firstFetch.lastUpdated).toISOString(),
      secondFetchCached: secondFetch.fromCache,
      forcedFetchCached: forcedFetch.fromCache
    }
  };
}

/**
 * Test: Verify that recent ZIP codes are still tracked
 */
async function testRecentZipCodes() {
  const zipCode = TEST_CONFIG.validZipCode;
  
  // Clear recent ZIP codes first
  localStorage.removeItem('recentZipCodes');
  
  // Save a ZIP code
  window.weatherUtils.saveRecentZipCode(zipCode);
  
  // Get recent ZIP codes
  const recentZipCodes = window.weatherUtils.getRecentZipCodes();
  
  if (!Array.isArray(recentZipCodes) || recentZipCodes.length === 0) {
    throw new Error('Recent ZIP codes not tracked correctly');
  }
  
  if (recentZipCodes[0] !== zipCode) {
    throw new Error('Recent ZIP code not saved correctly');
  }
  
  return {
    message: 'Recent ZIP codes are tracked correctly',
    details: {
      recentZipCodes
    }
  };
}

// ===== ERROR HANDLING TESTS =====

/**
 * Test: Verify error handling with invalid ZIP code
 */
async function testInvalidZipCode() {
  const zipCode = TEST_CONFIG.invalidZipCode;
  
  try {
    // This should fail because the ZIP code is invalid
    await window.weatherService.fetchWeatherData(zipCode);
    
    // If we get here, the test failed
    throw new Error('Invalid ZIP code did not trigger an error');
  } catch (error) {
    // This is expected behavior
    return {
      message: 'Invalid ZIP code correctly triggers an error',
      details: {
        error: error.message
      }
    };
  }
}

/**
 * Test: Verify error handling with server errors (simulated)
 */
async function testServerErrors() {
  // Use the server error simulator
  if (!window.serverErrorSimulator.isActive) {
    window.serverErrorSimulator.start('500', 1.0, ['/api/weather']);
  }
  
  try {
    // This should handle the error gracefully
    const weatherData = await window.weatherService.fetchWeatherData(TEST_CONFIG.validZipCode);
    
    if (!weatherData.isError) {
      throw new Error('Server error not handled correctly');
    }
    
    return {
      message: 'Server errors are handled gracefully',
      details: {
        errorHandled: weatherData.isError,
        errorMessage: weatherData.errorMessage
      }
    };
  } finally {
    // Stop the server error simulator
    window.serverErrorSimulator.stop();
    
    // Ensure mock API handler is active again
    if (!window.mockApiHandler.isActive) {
      window.mockApiHandler.start();
    }
  }
}

// ===== UI TESTS =====

/**
 * Test: Verify that API key management UI components are removed
 */
async function testApiKeyUiRemoved() {
  // Check if the API key manager UI is present
  const apiKeyManager = document.getElementById('api-key-manager');
  
  if (apiKeyManager) {
    throw new Error('API key manager UI is still present');
  }
  
  // Check for any elements with API key related text
  const bodyText = document.body.innerText.toLowerCase();
  const apiKeyRelatedTerms = [
    'enter your api key',
    'save api key',
    'test api key',
    'clear api key'
  ];
  
  const foundTerms = apiKeyRelatedTerms.filter(term => bodyText.includes(term));
  
  if (foundTerms.length > 0) {
    throw new Error(`API key related UI text still present: ${foundTerms.join(', ')}`);
  }
  
  return {
    message: 'API key management UI components are completely removed',
    details: {
      apiKeyManagerPresent: !!apiKeyManager,
      apiKeyRelatedTermsFound: foundTerms
    }
  };
}

/**
 * Test: Verify that the migration notification is displayed
 */
async function testMigrationNotice() {
  // Make sure the app container is visible
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.style.display = 'block';
  }
  
  // Check if the migration notice is present
  const migrationNotice = document.querySelector('.api-migration-notice');
  
  if (!migrationNotice) {
    throw new Error('Migration notice is not displayed');
  }
  
  // Check if the notice contains the expected text
  const noticeText = migrationNotice.innerText.toLowerCase();
  const expectedText = 'api key management update';
  
  if (!noticeText.includes(expectedText)) {
    throw new Error('Migration notice does not contain expected text');
  }
  
  return {
    message: 'Migration notification is displayed correctly',
    details: {
      migrationNoticePresent: !!migrationNotice,
      noticeText: migrationNotice.innerText
    }
  };
}

// ===== PERFORMANCE TESTS =====

/**
 * Test: Measure load times for weather data
 */
async function testPerformance() {
  const zipCode = TEST_CONFIG.validZipCode;
  
  // Ensure mock API handler is active
  if (!window.mockApiHandler.isActive) {
    window.mockApiHandler.start();
  }
  
  // Clear cache to start fresh
  window.mockApiHandler.cacheStore.clear();
  
  // Measure time for first fetch (uncached)
  const startUncached = performance.now();
  await window.weatherService.fetchWeatherData(zipCode, true); // Force refresh
  const endUncached = performance.now();
  const uncachedTime = endUncached - startUncached;
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.cacheTestDelay));
  
  // Measure time for second fetch (cached)
  const startCached = performance.now();
  await window.weatherService.fetchWeatherData(zipCode);
  const endCached = performance.now();
  const cachedTime = endCached - startCached;
  
  // Calculate improvement
  const improvement = ((uncachedTime - cachedTime) / uncachedTime) * 100;
  
  return {
    message: 'Performance metrics collected',
    details: {
      uncachedLoadTime: `${uncachedTime.toFixed(2)}ms`,
      cachedLoadTime: `${cachedTime.toFixed(2)}ms`,
      improvement: `${improvement.toFixed(2)}%`
    }
  };
}

// ===== TEST RUNNER =====

/**
 * Runs all tests
 */
async function runAllTests() {
  // Create test container if it doesn't exist
  if (!document.getElementById('test-results')) {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = `
      <h2>API Migration Test Results</h2>
      <div id="test-summary" class="test-summary">Running tests...</div>
      <div id="test-results"></div>
    `;
    document.body.appendChild(container);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #test-container {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f9f9f9;
      }
      .test-summary {
        font-weight: bold;
        padding: 10px;
        margin-bottom: 20px;
        border-radius: 5px;
        background-color: #eee;
      }
      .summary-pass {
        background-color: #dff0d8;
        color: #3c763d;
      }
      .summary-fail {
        background-color: #f2dede;
        color: #a94442;
      }
      .test-result {
        margin-bottom: 15px;
        padding: 10px;
        border-radius: 5px;
      }
      .test-result.pass {
        background-color: #dff0d8;
        border-left: 5px solid #3c763d;
      }
      .test-result.fail {
        background-color: #f2dede;
        border-left: 5px solid #a94442;
      }
      .test-result h3 {
        margin-top: 0;
      }
      .test-result pre {
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 3px;
        overflow: auto;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Functional Tests
  await runTest('Fetch Weather Data', testFetchWeatherData);
  await runTest('Fetch Super Sky', testFetchTripleCheckWeather);
  await runTest('Caching', testCaching);
  await runTest('Recent ZIP Codes', testRecentZipCodes);
  
  // Error Handling Tests
  await runTest('Invalid ZIP Code', testInvalidZipCode);
  await runTest('Server Errors', testServerErrors);
  
  // UI Tests
  await runTest('API Key UI Removed', testApiKeyUiRemoved);
  await runTest('Migration Notice', testMigrationNotice);
  
  // Performance Tests
  await runTest('Performance', testPerformance);
  
  // Update summary
  updateSummary();
  
  return testResults;
}

// Export test functions
window.apiMigrationTests = {
  runAllTests,
  testResults
};