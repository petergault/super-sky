// index.jsx
const { StrictMode } = React;
const { createRoot } = ReactDOM;

// Get the root element
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render the App component
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Log migration message
console.log('API Key management has been migrated to the server side.');