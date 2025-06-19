/**
 * HelpSection Component
 * 
 * This component provides a help section with frequently asked questions
 * and answers about the application's features.
 */

// Simulate React hooks
const { useState, useCallback, memo } = React;

/**
 * Help Section component with FAQ
 * @returns {JSX.Element} - Rendered component
 */
const HelpSection = memo(() => {
  // State for tracking expanded FAQ items
  const [expandedItems, setExpandedItems] = useState({});
  
  // Toggle FAQ item expansion
  const toggleItem = useCallback((id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  
  // FAQ data
  const faqItems = [
    {
      id: 'faq-1',
      question: 'What makes Super Sky different from other weather apps?',
      answer: 'Super Sky provides forecasts from three different weather services (Azure Maps, Open Meteo, and Foreca) side by side, allowing you to compare predictions and make more informed decisions. This is especially useful for precipitation forecasts, where different models may have varying predictions.'
    },
    {
      id: 'faq-2',
      question: 'How do I use the comparison view?',
      answer: 'Click the "Comparison View" button at the top of the page to see data from all three weather sources side by side. You can toggle between current conditions and today\'s forecast using the tabs, and choose different display modes to focus on specific weather aspects.'
    },
    {
      id: 'faq-3',
      question: 'What do the different colors in the precipitation indicators mean?',
      answer: 'The colors represent the probability of precipitation: lighter blues indicate lower chances (0-35%), medium blues show moderate chances (35-65%), and darker blues represent high chances (65-100%). The border thickness indicates the expected intensity or amount of precipitation.'
    },
    {
      id: 'faq-4',
      question: 'How often is the weather data updated?',
      answer: 'Weather data is cached for one hour by default to optimize performance and reduce API calls. You can manually refresh the data at any time by clicking the "Refresh Data" button.'
    },
    {
      id: 'faq-5',
      question: 'Can I use the app offline?',
      answer: 'Yes! Super Sky is a Progressive Web App (PWA) with offline capabilities. Your most recent weather data will be available even without an internet connection. You can also install the app on your device by clicking "Add to Home Screen" in your browser menu or using the install button in the app settings.'
    },
    {
      id: 'faq-6',
      question: 'How do I set up weather notifications?',
      answer: 'Go to the App Settings section and click "Enable Notifications." You\'ll need to grant permission in your browser. Once enabled, you can choose which types of weather alerts you want to receive (rain, storms, snow, heat) by checking the corresponding boxes.'
    },
    {
      id: 'faq-7',
      question: 'What does the "agreement level" in the comparison view mean?',
      answer: 'The agreement level shows how closely the different weather sources agree on a particular data point. High agreement (green) means all sources have similar predictions, medium agreement (yellow) shows some variation, and low agreement (red) indicates significant differences between sources.'
    },
    {
      id: 'faq-8',
      question: 'How do I provide feedback or report issues?',
      answer: 'We value your feedback! Please contact us at support@triplecheckweather.example.com with any questions, suggestions, or issues you encounter while using the app.'
    }
  ];
  
  return (
    <div className="help-section card" role="region" aria-labelledby="help-heading">
      <h2 id="help-heading">Help & FAQ</h2>
      
      <div className="faq-list" role="list">
        {faqItems.map(item => (
          <div 
            key={item.id} 
            className={`faq-item ${expandedItems[item.id] ? 'expanded' : ''}`}
            role="listitem"
          >
            <button 
              className="faq-question" 
              onClick={() => toggleItem(item.id)}
              aria-expanded={expandedItems[item.id] ? "true" : "false"}
              aria-controls={`${item.id}-answer`}
            >
              <span>{item.question}</span>
              <span className="faq-icon" aria-hidden="true">
                {expandedItems[item.id] ? '−' : '+'}
              </span>
            </button>
            <div 
              id={`${item.id}-answer`} 
              className="faq-answer"
              style={{ display: expandedItems[item.id] ? 'block' : 'none' }}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="help-resources">
        <h3>Additional Resources</h3>
        <ul>
          <li>
            <button 
              className="btn btn-link"
              onClick={() => window.UserOnboarding && window.UserOnboarding.startTour && window.UserOnboarding.startTour()}
              aria-label="Start app tour"
            >
              Take the app tour
            </button>
          </li>
          <li>
            <a 
              href="https://github.com/example/super-sky" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-link"
            >
              View source code on GitHub
            </a>
          </li>
          <li>
            <a 
              href="https://example.com/super-sky/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-link"
            >
              Developer documentation
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
});

// Set display name for debugging
HelpSection.displayName = 'HelpSection';

// Export the component
window.HelpSection = HelpSection;