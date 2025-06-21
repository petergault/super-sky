/**
 * UserOnboarding Component
 * 
 * This component provides a guided tour and onboarding experience for first-time users.
 * It includes:
 * - Welcome modal for first-time visitors
 * - Feature tour with tooltips highlighting key functionality
 * - Helpful tips for complex features
 * - Dismissable and resumable tour
 */

// Simulate React hooks
const { useState, useEffect, useCallback, useRef, memo } = React;

/**
 * User Onboarding component
 * @returns {JSX.Element} - Rendered component
 */
const UserOnboarding = memo(({ onComplete }) => {
  // State for tracking onboarding progress
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  
  // Tour steps configuration
  const tourSteps = [
    {
      target: 'zip-code-input',
      title: 'Enter Your Location',
      content: 'Start by entering your ZIP code to get weather information for your area.',
      placement: 'bottom'
    },
    {
      target: 'view-toggle',
      title: 'Compare Weather Sources',
      content: 'Toggle between single source view and comparison view to see forecasts from multiple providers.',
      placement: 'bottom'
    },
    {
      target: 'cache-controls',
      title: 'Refresh Your Data',
      content: 'Use these controls to refresh your weather data or clear the cache for the latest information.',
      placement: 'left'
    },
    {
      target: 'comparison-tabs',
      title: 'Current vs. Forecast',
      content: 'Switch between current conditions and today\'s forecast to plan your day.',
      placement: 'top'
    },
    {
      target: 'display-controls',
      title: 'Customize Your View',
      content: 'Change how weather data is displayed with these options.',
      placement: 'left'
    },
    {
      target: 'app-settings',
      title: 'Personalize Your Experience',
      content: 'Configure notifications, offline access, and other app settings here.',
      placement: 'top'
    }
  ];
  
  // Check if this is the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsFirstVisit(true);
      setShowWelcome(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Check if tour was paused
    const savedTourStep = localStorage.getItem('tourStep');
    if (savedTourStep) {
      setCurrentStep(parseInt(savedTourStep, 10));
    }
  }, []);
  
  // Save tour progress when step changes
  useEffect(() => {
    if (tourActive && currentStep > 0) {
      localStorage.setItem('tourStep', currentStep.toString());
    }
    
    // If tour is complete, remove saved step
    if (currentStep >= tourSteps.length) {
      localStorage.removeItem('tourStep');
      setTourActive(false);
      if (onComplete) onComplete();
    }
  }, [currentStep, tourActive, tourSteps.length, onComplete]);
  
  // Start the tour
  const startTour = useCallback(() => {
    setTourActive(true);
    setShowWelcome(false);
    setCurrentStep(0);
  }, []);
  
  // Skip the tour
  const skipTour = useCallback(() => {
    setTourActive(false);
    setShowWelcome(false);
    localStorage.removeItem('tourStep');
    if (onComplete) onComplete();
  }, [onComplete]);
  
  // Navigate to next step
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);
  
  // Navigate to previous step
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);
  
  // Highlight the current target element
  useEffect(() => {
    if (!tourActive || currentStep >= tourSteps.length) return;
    
    const currentTarget = tourSteps[currentStep].target;
    const targetElement = document.getElementById(currentTarget);
    
    if (targetElement) {
      // Remove highlight from all elements
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
      
      // Add highlight to current target
      targetElement.classList.add('tour-highlight');
      
      // Scroll element into view if needed
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return () => {
      // Cleanup - remove highlight when component unmounts or step changes
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [tourActive, currentStep, tourSteps]);
  
  // Render welcome modal
  const renderWelcomeModal = () => {
    if (!showWelcome) return null;
    
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <div className="modal-content welcome-modal slide-in-up">
          <h2 id="welcome-title">Welcome to Super Sky!</h2>
          <p>Get the most accurate weather forecasts by comparing data from multiple sources.</p>
          <p>Would you like a quick tour of the app's features?</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={skipTour}>Skip Tour</button>
            <button className="btn" onClick={startTour}>Start Tour</button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render tour tooltip
  const renderTourTooltip = () => {
    if (!tourActive || currentStep >= tourSteps.length) return null;
    
    const step = tourSteps[currentStep];
    
    return (
      <div className="tour-tooltip" data-placement={step.placement} role="dialog" aria-live="polite">
        <div className="tour-tooltip-content">
          <h3>{step.title}</h3>
          <p>{step.content}</p>
          <div className="tour-tooltip-actions">
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={skipTour}
              aria-label="Skip the rest of the tour"
            >
              Skip
            </button>
            <div className="tour-navigation">
              {currentStep > 0 && (
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={prevStep}
                  aria-label="Go to previous step"
                >
                  Previous
                </button>
              )}
              <button 
                className="btn btn-sm" 
                onClick={nextStep}
                aria-label={currentStep < tourSteps.length - 1 ? "Go to next step" : "Finish tour"}
              >
                {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
              </button>
            </div>
          </div>
          <div className="tour-progress">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
        </div>
      </div>
    );
  };
  
  // Render help button to restart tour
  const renderHelpButton = () => {
    if (tourActive || showWelcome) return null;
    
    return (
      <button 
        className="help-button" 
        onClick={startTour}
        aria-label="Start app tour"
        title="Take a tour of the app"
      >
        <span aria-hidden="true">?</span>
      </button>
    );
  };
  
  return (
    <>
      {renderWelcomeModal()}
      {renderTourTooltip()}
      {renderHelpButton()}
    </>
  );
});

// Set display name for debugging
UserOnboarding.displayName = 'UserOnboarding';

// Export the component
window.UserOnboarding = UserOnboarding;