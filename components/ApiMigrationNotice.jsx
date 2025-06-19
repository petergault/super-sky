// ApiMigrationNotice.jsx
const { useState, useEffect } = React;

/**
 * Component to notify users about the API key management migration
 * Displays a temporary notification about the backend migration
 */
const ApiMigrationNotice = () => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide the notification after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="api-migration-notice">
      <div className="notice-content">
        <h3>API Key Management Update</h3>
        <p>
          API keys are now managed securely on the server side. 
          You no longer need to enter or manage your API keys manually.
        </p>
        <button 
          className="btn-close" 
          onClick={() => setVisible(false)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Export the component
window.ApiMigrationNotice = ApiMigrationNotice;