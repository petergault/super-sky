/**
 * Mock Components
 * 
 * This file contains mock implementations of React components for testing purposes.
 */

// Mock ApiMigrationNotice component
if (typeof window.ApiMigrationNotice === 'undefined') {
  window.ApiMigrationNotice = function() {
    return React.createElement('div', { 
      className: 'api-migration-notice',
      'data-testid': 'api-migration-notice'
    }, 
    React.createElement('div', { className: 'notice-content' },
      [
        React.createElement('h3', { key: 'title' }, 'API Key Management Update'),
        React.createElement('p', { key: 'message' }, 
          'API keys are now managed securely on the server side. You no longer need to enter or manage your API keys manually.'
        ),
        React.createElement('button', { 
          key: 'close',
          className: 'btn-close',
          'aria-label': 'Close notification'
        }, '×')
      ]
    ));
  };
}

// Mock App component with ApiMigrationNotice
if (typeof window.App === 'undefined') {
  window.App = function() {
    return React.createElement('div', { className: 'app-container' },
      [
        React.createElement('header', { key: 'header', className: 'header' },
          React.createElement('div', { className: 'container' },
            [
              React.createElement('h1', { key: 'title' }, 'Super Sky'),
              React.createElement(window.ApiMigrationNotice, { key: 'migration-notice' })
            ]
          )
        ),
        React.createElement('main', { key: 'main', className: 'main-content' },
          React.createElement('div', { className: 'container' },
            React.createElement('p', null, 'Mock App Component for Testing')
          )
        )
      ]
    );
  };
}

// Mock ComparisonView component
if (typeof window.ComparisonView === 'undefined') {
  window.ComparisonView = function(props) {
    return React.createElement('div', { className: 'comparison-view' },
      React.createElement('h2', null, 'Weather Comparison')
    );
  };
}

// Render the App component for UI testing if in test mode
if (window.location.pathname.includes('/tests/')) {
  document.addEventListener('DOMContentLoaded', () => {
    // Create a container for the app if it doesn't exist
    let appContainer = document.getElementById('app-container');
    if (!appContainer) {
      appContainer = document.createElement('div');
      appContainer.id = 'app-container';
      appContainer.style.display = 'none'; // Hide it by default
      document.body.appendChild(appContainer);
    }
    
    // Render the App component
    ReactDOM.render(
      React.createElement(window.App),
      appContainer
    );
    
    // Add a toggle button to show/hide the app
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle App View';
    toggleButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1001;
    `;
    
    toggleButton.addEventListener('click', () => {
      appContainer.style.display = appContainer.style.display === 'none' ? 'block' : 'none';
    });
    
    document.body.appendChild(toggleButton);
  });
}