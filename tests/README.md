# Super Sky App Testing

This directory contains testing tools and documentation for the Super Sky App, with a focus on verifying the successful migration from front-end API key management to back-end API endpoints.

## Test Files

- **api-migration-tests.js**: JavaScript test suite for verifying the API migration
- **api-migration-test-runner.html**: HTML page for running the automated tests in a browser
- **server-error-simulator.js**: Tool for simulating server errors during testing
- **API_MIGRATION_TESTING.md**: Comprehensive testing plan and documentation
- **manual-test-report-template.md**: Template for documenting manual test results

## Running the Tests

### Automated Tests

1. Start the application server:
   ```
   cd triple-check-weather-app
   http-server -p 8080
   ```

2. Open the test runner in your browser:
   ```
   http://localhost:8080/tests/api-migration-test-runner.html
   ```

3. Click the "Run All Tests" button to execute the automated tests.

### Manual Tests

1. Use the manual test report template to document your test results:
   ```
   cp manual-test-report-template.md my-test-report.md
   ```

2. Follow the test cases outlined in API_MIGRATION_TESTING.md.

3. Document your findings in the test report.

## Server Error Simulator

The server error simulator allows you to test how the application handles various error conditions. To use it:

1. Open the test runner page in your browser.

2. Look for the Error Simulator controls in the bottom right corner.

3. Configure the simulator:
   - **Error Type**: Select the type of error to simulate (500, 404, 403, timeout, network)
   - **Error Probability**: Set the probability of an error occurring (0-100%)
   - **Affected Endpoints**: Specify which API endpoints should be affected

4. Click "Start" to activate the simulator.

5. Perform your tests to see how the application handles errors.

6. Click "Stop" when you're done.

## Test Coverage

The tests cover the following areas:

1. **Functional Testing**:
   - Weather data fetching for valid ZIP codes
   - Triple-check mode functionality
   - Caching behavior
   - Recent ZIP codes tracking

2. **Error Handling**:
   - Invalid ZIP codes
   - Server errors
   - Network failures

3. **UI Testing**:
   - Removal of API key management UI components
   - Display of migration notification

4. **Performance Testing**:
   - Load time comparison between cached and fresh requests

5. **Compatibility Testing**:
   - Browser compatibility
   - Responsive design

## Adding New Tests

To add new tests to the test suite:

1. Open `api-migration-tests.js`.

2. Add a new test function following the existing pattern:
   ```javascript
   async function testMyNewFeature() {
     // Test implementation
     return {
       message: 'Test result message',
       details: {
         // Test details
       }
     };
   }
   ```

3. Add your test to the `runAllTests` function.

## Troubleshooting

If you encounter issues while running the tests:

- Check the browser console for errors
- Verify that the application server is running
- Clear browser cache and cookies
- Try running the tests in a different browser

## Contributing

When contributing new tests or improvements:

1. Follow the existing code style and patterns
2. Document your tests thoroughly
3. Update this README if necessary
4. Submit a pull request with your changes