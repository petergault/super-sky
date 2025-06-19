/**
 * Server Error Simulator
 * 
 * This script helps simulate server errors for testing error handling in the
 * Super Sky App. It intercepts fetch requests to the weather API
 * endpoints and can return various error responses.
 */

class ServerErrorSimulator {
  constructor() {
    this.isActive = false;
    this.errorType = '500'; // Default error type
    this.errorProbability = 1.0; // Default 100% error rate
    this.originalFetch = window.fetch;
    this.affectedEndpoints = ['/api/weather'];
  }

  /**
   * Start the error simulator
   * @param {string} errorType - Type of error to simulate ('500', '404', '403', 'timeout', 'network')
   * @param {number} probability - Probability of error (0.0 to 1.0)
   * @param {string[]} endpoints - API endpoints to affect
   */
  start(errorType = '500', probability = 1.0, endpoints = ['/api/weather']) {
    if (this.isActive) {
      this.stop();
    }

    this.errorType = errorType;
    this.errorProbability = Math.max(0, Math.min(1, probability));
    this.affectedEndpoints = endpoints;
    this.isActive = true;

    // Override fetch
    window.fetch = this.fetchWithErrors.bind(this);

    console.log(`Server Error Simulator started: ${this.errorType} errors with ${this.errorProbability * 100}% probability`);
    return true;
  }

  /**
   * Stop the error simulator
   */
  stop() {
    if (!this.isActive) return false;

    // Restore original fetch
    window.fetch = this.originalFetch;
    this.isActive = false;

    console.log('Server Error Simulator stopped');
    return true;
  }

  /**
   * Check if a URL matches any of the affected endpoints
   * @param {string} url - URL to check
   * @returns {boolean} - Whether the URL is affected
   */
  isAffectedEndpoint(url) {
    return this.affectedEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Fetch with simulated errors
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  async fetchWithErrors(url, options) {
    // If not active or URL not affected, use original fetch
    if (!this.isActive || !this.isAffectedEndpoint(url)) {
      return this.originalFetch(url, options);
    }

    // Determine if we should simulate an error based on probability
    if (Math.random() > this.errorProbability) {
      return this.originalFetch(url, options);
    }

    console.log(`Simulating ${this.errorType} error for: ${url}`);

    // Simulate different types of errors
    switch (this.errorType) {
      case '404':
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Simulated 404 Not Found error'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );

      case '403':
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Simulated 403 Forbidden error'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );

      case 'timeout':
        // Simulate a timeout by delaying for a long time then rejecting
        await new Promise(resolve => setTimeout(resolve, 30000));
        throw new Error('Simulated timeout error');

      case 'network':
        throw new Error('Simulated network error');

      case '500':
      default:
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Simulated 500 Internal Server Error'
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
  }

  /**
   * Get the current status of the simulator
   * @returns {Object} - Status object
   */
  getStatus() {
    return {
      isActive: this.isActive,
      errorType: this.errorType,
      errorProbability: this.errorProbability,
      affectedEndpoints: this.affectedEndpoints
    };
  }
}

// Create and export the simulator
window.serverErrorSimulator = new ServerErrorSimulator();

// Add UI controls if in test mode
if (window.location.pathname.includes('/tests/')) {
  document.addEventListener('DOMContentLoaded', () => {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'error-simulator-controls';
    controlsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
    `;

    controlsContainer.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px;">Error Simulator</h3>
      <div style="margin-bottom: 10px;">
        <label for="error-type">Error Type:</label>
        <select id="error-type" style="width: 100%; padding: 5px; margin-top: 5px;">
          <option value="500">500 Internal Server Error</option>
          <option value="404">404 Not Found</option>
          <option value="403">403 Forbidden</option>
          <option value="timeout">Request Timeout</option>
          <option value="network">Network Error</option>
        </select>
      </div>
      <div style="margin-bottom: 10px;">
        <label for="error-probability">Error Probability:</label>
        <input type="range" id="error-probability" min="0" max="100" value="100" style="width: 100%; margin-top: 5px;">
        <span id="probability-value">100%</span>
      </div>
      <div style="margin-bottom: 10px;">
        <label for="affected-endpoints">Affected Endpoints:</label>
        <input type="text" id="affected-endpoints" value="/api/weather" style="width: 100%; padding: 5px; margin-top: 5px;">
        <small style="color: #6c757d; display: block; margin-top: 5px;">Comma-separated list of endpoint patterns</small>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="start-simulator" style="flex: 1; padding: 8px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Start</button>
        <button id="stop-simulator" style="flex: 1; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>Stop</button>
      </div>
      <div id="simulator-status" style="margin-top: 10px; font-size: 12px; color: #6c757d;">Simulator inactive</div>
    `;

    document.body.appendChild(controlsContainer);

    // Set up event listeners
    const errorTypeSelect = document.getElementById('error-type');
    const errorProbabilityInput = document.getElementById('error-probability');
    const probabilityValueSpan = document.getElementById('probability-value');
    const affectedEndpointsInput = document.getElementById('affected-endpoints');
    const startButton = document.getElementById('start-simulator');
    const stopButton = document.getElementById('stop-simulator');
    const statusDiv = document.getElementById('simulator-status');

    // Update probability value display
    errorProbabilityInput.addEventListener('input', () => {
      probabilityValueSpan.textContent = `${errorProbabilityInput.value}%`;
    });

    // Start button
    startButton.addEventListener('click', () => {
      const errorType = errorTypeSelect.value;
      const probability = parseInt(errorProbabilityInput.value, 10) / 100;
      const endpoints = affectedEndpointsInput.value.split(',').map(e => e.trim());

      window.serverErrorSimulator.start(errorType, probability, endpoints);

      startButton.disabled = true;
      stopButton.disabled = false;
      statusDiv.textContent = `Simulator active: ${errorType} errors with ${probability * 100}% probability`;
      statusDiv.style.color = '#dc3545';
    });

    // Stop button
    stopButton.addEventListener('click', () => {
      window.serverErrorSimulator.stop();

      startButton.disabled = false;
      stopButton.disabled = true;
      statusDiv.textContent = 'Simulator inactive';
      statusDiv.style.color = '#6c757d';
    });
  });
}