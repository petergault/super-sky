// ApiKeyTester.jsx
const { useState } = React;

/**
 * Component for API migration information
 * Informs users that API keys are now managed on the server
 */
const ApiKeyTester = () => {
  return (
    <div className="api-key-tester card">
      <h2>Weather API Information</h2>
      <p>API keys are now securely managed on the server side.</p>
      
      <div className="info-message">
        <h3>Server-Side API Management</h3>
        <p>
          For enhanced security, all API keys are now managed by the server.
          You no longer need to enter or manage API keys manually.
        </p>
        <p>
          This change improves security by keeping sensitive credentials
          on the server and simplifies the user experience.
        </p>
      </div>
      
      <div className="button-group">
        <a
          className="btn"
          href="https://docs.microsoft.com/en-us/azure/azure-maps/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Azure Maps Documentation
        </a>
      </div>
    </div>
  );
};

// Export the component
window.ApiKeyTester = ApiKeyTester;