/**
 * Functional Test Runner
 * 
 * This file contains the test runner for functional tests of the Super Sky app.
 * It executes test scenarios defined in functional-test-scenarios.js and reports results.
 */

// Test runner state
const testState = {
  currentScenario: null,
  results: {
    passed: 0,
    failed: 0,
    total: 0,
    scenarios: []
  },
  isRunning: false
};

/**
 * Initializes the test runner
 */
function initTestRunner() {
  const testContainer = document.getElementById('test-results-container');
  if (!testContainer) {
    console.error('Test results container not found');
    return;
  }
  
  // Clear previous results
  testContainer.innerHTML = '';
  
  // Create test controls
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'test-controls';
  controlsDiv.innerHTML = `
    <h2>Functional Test Runner</h2>
    <div class="test-buttons">
      <button id="run-rainy-tests" class="test-button">Test Rainy Scenarios</button>
      <button id="run-dry-tests" class="test-button">Test Dry Scenarios</button>
      <button id="run-mixed-tests" class="test-button">Test Mixed Conditions</button>
      <button id="run-sources-tests" class="test-button">Test Data Sources</button>
      <button id="run-all-tests" class="test-button primary">Run All Tests</button>
    </div>
    <div class="test-summary" id="test-summary"></div>
  `;
  
  testContainer.appendChild(controlsDiv);
  
  // Create results container
  const resultsDiv = document.createElement('div');
  resultsDiv.className = 'test-results';
  resultsDiv.id = 'test-results';
  testContainer.appendChild(resultsDiv);
  
  // Add event listeners
  document.getElementById('run-rainy-tests').addEventListener('click', () => runTests('rainyDays'));
  document.getElementById('run-dry-tests').addEventListener('click', () => runTests('dryDays'));
  document.getElementById('run-mixed-tests').addEventListener('click', () => runTests('mixedConditions'));
  document.getElementById('run-sources-tests').addEventListener('click', () => runTests('dataSources'));
  document.getElementById('run-all-tests').addEventListener('click', runAllTests);
}

/**
 * Runs all test scenarios
 */
async function runAllTests() {
  if (testState.isRunning) return;
  
  resetTestResults();
  testState.isRunning = true;
  
  const scenarioTypes = Object.keys(window.functionalTestScenarios.scenarios);
  
  for (const type of scenarioTypes) {
    await runTests(type);
  }
  
  testState.isRunning = false;
  updateTestSummary();
}

/**
 * Runs tests for a specific scenario type
 * @param {string} scenarioType - The type of scenario to run
 */
async function runTests(scenarioType) {
  if (testState.isRunning) return;
  
  const scenarios = window.functionalTestScenarios.scenarios[scenarioType];
  if (!scenarios) {
    console.error(`No scenarios found for type: ${scenarioType}`);
    return;
  }
  
  testState.isRunning = true;
  
  // Create or update section for this scenario type
  let sectionEl = document.getElementById(`test-section-${scenarioType}`);
  if (!sectionEl) {
    sectionEl = document.createElement('div');
    sectionEl.id = `test-section-${scenarioType}`;
    sectionEl.className = 'test-section';
    sectionEl.innerHTML = `
      <h3>${formatScenarioType(scenarioType)} Tests</h3>
      <div class="test-scenarios" id="test-scenarios-${scenarioType}"></div>
    `;
    document.getElementById('test-results').appendChild(sectionEl);
  }
  
  const scenariosContainer = document.getElementById(`test-scenarios-${scenarioType}`);
  scenariosContainer.innerHTML = ''; // Clear previous results
  
  // Run each scenario
  for (const scenario of scenarios) {
    testState.currentScenario = scenario;
    testState.results.total++;
    
    // Create scenario result element
    const scenarioEl = document.createElement('div');
    scenarioEl.className = 'test-scenario running';
    scenarioEl.innerHTML = `
      <div class="scenario-header">
        <span class="scenario-name">${scenario.name}</span>
        <span class="scenario-status">Running...</span>
      </div>
      <div class="scenario-details"></div>
    `;
    scenariosContainer.appendChild(scenarioEl);
    
    // Run the test
    try {
      const result = await runScenario(scenario, scenarioType);
      
      // Update scenario element with results
      scenarioEl.className = `test-scenario ${result.success ? 'passed' : 'failed'}`;
      scenarioEl.querySelector('.scenario-status').textContent = result.success ? 'Passed' : 'Failed';
      
      const detailsEl = scenarioEl.querySelector('.scenario-details');
      detailsEl.innerHTML = formatTestResults(result);
      
      // Update test state
      if (result.success) {
        testState.results.passed++;
      } else {
        testState.results.failed++;
      }
      
      testState.results.scenarios.push({
        name: scenario.name,
        type: scenarioType,
        success: result.success,
        details: result
      });
    } catch (error) {
      console.error(`Error running scenario ${scenario.name}:`, error);
      
      // Update scenario element with error
      scenarioEl.className = 'test-scenario error';
      scenarioEl.querySelector('.scenario-status').textContent = 'Error';
      
      const detailsEl = scenarioEl.querySelector('.scenario-details');
      detailsEl.innerHTML = `<div class="error-message">${error.message}</div>`;
      
      testState.results.failed++;
    }
    
    // Update summary after each scenario
    updateTestSummary();
    
    // Small delay to avoid UI freezing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  testState.isRunning = false;
  testState.currentScenario = null;
}

/**
 * Runs a single test scenario
 * @param {Object} scenario - The scenario to run
 * @param {string} scenarioType - The type of scenario
 * @returns {Object} - Test results
 */
async function runScenario(scenario, scenarioType) {
  // Fetch weather data for the scenario's ZIP code
  const weatherData = await fetchWeatherData(scenario.zipCode);
  
  // Validate based on scenario type
  if (scenarioType === 'dataSources') {
    // For data sources scenarios, validate available sources
    return window.functionalTestScenarios.validateDataSources(
      weatherData,
      scenario.expectedSources
    );
  } else {
    // For weather condition scenarios, validate conditions and display mode
    const firstSource = Array.isArray(weatherData) ? weatherData[0] : weatherData;
    
    // Get current display mode
    const displayMode = getCurrentDisplayMode();
    
    // Validate weather conditions
    const conditionsResult = window.functionalTestScenarios.validateWeatherConditions(
      firstSource,
      scenario.expectedConditions
    );
    
    // Validate display mode
    const displayModeResult = window.functionalTestScenarios.validateDisplayMode(
      displayMode,
      scenario.expectedConditions.displayMode
    );
    
    // Combine results
    return {
      success: conditionsResult.success && displayModeResult.success,
      weatherConditions: conditionsResult,
      displayMode: displayModeResult
    };
  }
}

/**
 * Fetches weather data for a ZIP code
 * @param {string} zipCode - The ZIP code to fetch weather for
 * @returns {Promise<Object|Array>} - Weather data
 */
async function fetchWeatherData(zipCode) {
  try {
    // Use the app's weather service to fetch data
    if (window.weatherService) {
      return await window.weatherService.fetchTripleCheckWeather(zipCode);
    } else {
      throw new Error('Weather service not available');
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Gets the current display mode from the UI
 * @returns {string} - The current display mode
 */
function getCurrentDisplayMode() {
  // Try to get the display mode from the select element
  const displayModeSelect = document.getElementById('display-mode-select');
  if (displayModeSelect) {
    return displayModeSelect.value;
  }
  
  // Default to 'full' if not found
  return 'full';
}

/**
 * Formats test results for display
 * @param {Object} results - The test results
 * @returns {string} - Formatted HTML
 */
function formatTestResults(results) {
  let html = '<div class="result-details">';
  
  if (results.weatherConditions) {
    html += '<h4>Weather Conditions</h4>';
    html += '<table class="results-table">';
    html += '<tr><th>Condition</th><th>Expected</th><th>Actual</th><th>Result</th></tr>';
    
    for (const [key, value] of Object.entries(results.weatherConditions.details)) {
      html += `
        <tr>
          <td>${formatPropertyName(key)}</td>
          <td>${value.expected}</td>
          <td>${value.actual}</td>
          <td class="${value.pass ? 'pass' : 'fail'}">${value.pass ? 'Pass' : 'Fail'}</td>
        </tr>
      `;
    }
    
    html += '</table>';
  }
  
  if (results.displayMode) {
    html += '<h4>Display Mode</h4>';
    html += '<table class="results-table">';
    html += '<tr><th>Expected</th><th>Actual</th><th>Result</th></tr>';
    html += `
      <tr>
        <td>${results.displayMode.details.expected}</td>
        <td>${results.displayMode.details.actual}</td>
        <td class="${results.displayMode.success ? 'pass' : 'fail'}">${results.displayMode.success ? 'Pass' : 'Fail'}</td>
      </tr>
    `;
    html += '</table>';
  }
  
  if (results.details) {
    html += '<h4>Data Sources</h4>';
    html += '<table class="results-table">';
    html += '<tr><th>Expected Sources</th><th>Actual Sources</th></tr>';
    html += `
      <tr>
        <td>${results.details.expected}</td>
        <td>${results.details.actual}</td>
      </tr>
    `;
    html += '</table>';
    
    if (results.details.missing !== 'None') {
      html += `<div class="warning">Missing source: ${results.details.missing}</div>`;
    }
    
    if (results.details.unexpected !== 'None') {
      html += `<div class="info">Unexpected source: ${results.details.unexpected}</div>`;
    }
  }
  
  html += '</div>';
  return html;
}

/**
 * Updates the test summary display
 */
function updateTestSummary() {
  const summaryEl = document.getElementById('test-summary');
  if (!summaryEl) return;
  
  const { passed, failed, total } = testState.results;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  summaryEl.innerHTML = `
    <div class="summary-stats">
      <div class="stat">
        <span class="stat-value">${passed}</span>
        <span class="stat-label">Passed</span>
      </div>
      <div class="stat">
        <span class="stat-value">${failed}</span>
        <span class="stat-label">Failed</span>
      </div>
      <div class="stat">
        <span class="stat-value">${total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat">
        <span class="stat-value">${passRate}%</span>
        <span class="stat-label">Pass Rate</span>
      </div>
    </div>
  `;
}

/**
 * Resets the test results
 */
function resetTestResults() {
  testState.results = {
    passed: 0,
    failed: 0,
    total: 0,
    scenarios: []
  };
  
  document.getElementById('test-results').innerHTML = '';
  updateTestSummary();
}

/**
 * Formats a scenario type for display
 * @param {string} type - The scenario type
 * @returns {string} - Formatted type
 */
function formatScenarioType(type) {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Formats a property name for display
 * @param {string} name - The property name
 * @returns {string} - Formatted name
 */
function formatPropertyName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

// Export the test runner functions
window.functionalTestRunner = {
  init: initTestRunner,
  runTests,
  runAllTests,
  getResults: () => testState.results
};