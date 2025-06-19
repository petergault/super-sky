/**
 * ServiceTooltip Component
 * 
 * Provides detailed tooltips for weather service names with information about each service
 */

window.ServiceTooltip = function ServiceTooltip({ children, serviceName, className = '' }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const triggerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);

  // Service descriptions with proper line breaks
  const serviceDescriptions = {
    // Original API service names (lowercase)
    'googleweather': `Google Weather aggregates data from multiple meteorological sources to provide comprehensive weather information.

The service combines official government weather data with commercial weather providers to deliver accurate forecasts.

Google Weather is integrated into various Google services and provides real-time conditions, hourly forecasts, and severe weather alerts.`,

    'azuremaps': `AccuWeather is a commercial weather forecasting service founded in 1962, known for its proprietary forecasting techniques.

The service uses a combination of traditional meteorological data, satellite imagery, and radar information processed through proprietary algorithms.

AccuWeather provides hyper-local forecasts and is particularly known for its minute-by-minute precipitation forecasts and severe weather warnings.`,

    'foreca': `Foreca is a Finnish weather technology company that has been providing weather services since 1996.

The company operates its own weather prediction models and combines them with data from national meteorological institutes.

Foreca specializes in high-resolution weather modeling and provides detailed forecasts with particular strength in European weather patterns.`,

    'openmeteo': `NOAA (National Oceanic and Atmospheric Administration) is the official source of weather data for the United States government.

The agency operates the National Weather Service and maintains an extensive network of weather stations, satellites, and radar systems across the country.

NOAA data is considered the authoritative source for US weather information and serves as the foundation for most other weather services operating in the United States.`,

    // Display names (for backward compatibility)
    'GoogleWeather': `Google Weather aggregates data from multiple meteorological sources to provide comprehensive weather information.

The service combines official government weather data with commercial weather providers to deliver accurate forecasts.

Google Weather is integrated into various Google services and provides real-time conditions, hourly forecasts, and severe weather alerts.`,

    'Google': `Google Weather aggregates data from multiple meteorological sources to provide comprehensive weather information.

The service combines official government weather data with commercial weather providers to deliver accurate forecasts.

Google Weather is integrated into various Google services and provides real-time conditions, hourly forecasts, and severe weather alerts.`,

    'Foreca': `Foreca is a Finnish weather technology company that has been providing weather services since 1996.

The company operates its own weather prediction models and combines them with data from national meteorological institutes.

Foreca specializes in high-resolution weather modeling and provides detailed forecasts with particular strength in European weather patterns.`,

    'AccuWeather': `AccuWeather is a commercial weather forecasting service founded in 1962, known for its proprietary forecasting techniques.

The service uses a combination of traditional meteorological data, satellite imagery, and radar information processed through proprietary algorithms.

AccuWeather provides hyper-local forecasts and is particularly known for its minute-by-minute precipitation forecasts and severe weather warnings.`,

    'NOAA': `NOAA (National Oceanic and Atmospheric Administration) is the official source of weather data for the United States government.

The agency operates the National Weather Service and maintains an extensive network of weather stations, satellites, and radar systems across the country.

NOAA data is considered the authoritative source for US weather information and serves as the foundation for most other weather services operating in the United States.`
  };

  const getTooltipContent = (serviceName) => {
    if (!serviceName) return 'No service information available.';
    
    // Check for exact match first
    if (serviceDescriptions[serviceName]) {
      return serviceDescriptions[serviceName];
    }
    
    // Check for case-insensitive match
    const lowerServiceName = serviceName.toLowerCase();
    if (serviceDescriptions[lowerServiceName]) {
      return serviceDescriptions[lowerServiceName];
    }
    
    return `Information about ${serviceName} service is not available.`;
  };

  const updateTooltipPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    let top = triggerRect.bottom + 8;
    
    // Adjust horizontal position if tooltip would go off screen
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    
    // Adjust vertical position if tooltip would go off screen
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = triggerRect.top - tooltipRect.height - 8;
    }
    
    tooltipRef.current.style.left = `${left}px`;
    tooltipRef.current.style.top = `${top}px`;
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  React.useEffect(() => {
    if (isVisible) {
      // Small delay to ensure tooltip is rendered before positioning
      const timer = setTimeout(updateTooltipPosition, 10);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  React.useEffect(() => {
    if (isVisible) {
      const handleResize = () => updateTooltipPosition();
      const handleScroll = () => updateTooltipPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isVisible]);

  return (
    <>
      <span
        ref={triggerRef}
        className={`service-tooltip-trigger ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'help', position: 'relative' }}
      >
        {children}
      </span>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="service-tooltip"
          style={{
            position: 'fixed',
            zIndex: 10000,
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.5',
            maxWidth: '400px',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid #34495e',
            whiteSpace: 'pre-line',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {getTooltipContent(serviceName)}
        </div>
      )}
    </>
  );
};
