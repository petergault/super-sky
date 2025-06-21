/**
 * SkeletonLoader Component
 * 
 * This component provides skeleton loading screens for different parts of the application
 * to improve perceived performance and user experience during data loading.
 */

// Simulate React hooks
const { memo } = React;

/**
 * Skeleton Loader component
 * @param {Object} props - Component props
 * @param {string} props.type - Type of skeleton to display ('weather', 'comparison', 'settings', 'hourly-grid')
 * @returns {JSX.Element} - Rendered component
 */
const SkeletonLoader = memo(({ type = 'weather' }) => {
  // Weather display skeleton
  const renderWeatherSkeleton = () => (
    <div className="skeleton-weather card" aria-busy="true" aria-label="Loading weather data">
      <div className="skeleton-weather-header">
        <div className="skeleton skeleton-text skeleton-title" aria-hidden="true"></div>
        <div className="skeleton skeleton-text" style={{ width: '30%' }} aria-hidden="true"></div>
      </div>
      
      <div className="skeleton-weather-content">
        <div className="skeleton-weather-temp skeleton" aria-hidden="true"></div>
        <div className="skeleton-weather-details">
          <div className="skeleton skeleton-text" style={{ width: '60%' }} aria-hidden="true"></div>
          <div className="skeleton skeleton-text" style={{ width: '70%' }} aria-hidden="true"></div>
          <div className="skeleton skeleton-text" style={{ width: '50%' }} aria-hidden="true"></div>
          <div className="skeleton skeleton-text" style={{ width: '65%' }} aria-hidden="true"></div>
        </div>
      </div>
      
      <div className="skeleton-text" style={{ width: '40%', marginTop: '1rem' }} aria-hidden="true"></div>
    </div>
  );
  
  // Comparison view skeleton
  const renderComparisonSkeleton = () => (
    <div className="skeleton-comparison card" aria-busy="true" aria-label="Loading comparison data">
      <div className="skeleton skeleton-text skeleton-title" aria-hidden="true"></div>
      
      <div className="skeleton-tabs" aria-hidden="true">
        <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: '4px' }}></div>
        <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: '4px', opacity: '0.7' }}></div>
      </div>
      
      <div className="skeleton-table" aria-hidden="true">
        <div className="skeleton-row">
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
        </div>
        <div className="skeleton-row">
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
        </div>
        <div className="skeleton-row">
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
        </div>
        <div className="skeleton-row">
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '30px', borderRadius: '4px' }}></div>
        </div>
      </div>
    </div>
  );
  
  // Settings skeleton
  const renderSettingsSkeleton = () => (
    <div className="skeleton-settings card" aria-busy="true" aria-label="Loading settings">
      <div className="skeleton skeleton-text skeleton-title" aria-hidden="true"></div>
      
      <div className="skeleton-section" aria-hidden="true">
        <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '1px', margin: '12px 0' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
        <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '4px', marginTop: '12px' }}></div>
      </div>
      
      <div className="skeleton-section" aria-hidden="true">
        <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '1px', margin: '12px 0' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
        <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '4px', marginTop: '12px' }}></div>
      </div>
    </div>
  );
  
  // Hourly grid skeleton
  const renderHourlyGridSkeleton = () => (
    <div className="skeleton-hourly-grid card" aria-busy="true" aria-label="Loading hourly weather grid">
      <div className="skeleton skeleton-text skeleton-title" aria-hidden="true"></div>
      
      {/* Day selector skeleton */}
      <div className="skeleton-day-selector" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="skeleton" style={{
            width: '80px',
            height: '60px',
            borderRadius: '4px',
            opacity: i === 0 ? 1 : 0.7
          }}></div>
        ))}
      </div>
      
      {/* Day stats skeleton */}
      <div className="skeleton-day-stats" aria-hidden="true">
        <div className="skeleton" style={{ width: '120px', height: '24px', borderRadius: '4px' }}></div>
        <div className="skeleton" style={{ width: '120px', height: '24px', borderRadius: '4px' }}></div>
      </div>
      
      {/* Hourly grid skeleton */}
      <div className="skeleton-grid" aria-hidden="true">
        {/* Header row */}
        <div className="skeleton-grid-row">
          <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: '4px' }}></div>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="skeleton" style={{
              width: '50px',
              height: '30px',
              borderRadius: '4px',
              opacity: 0.8
            }}></div>
          ))}
        </div>
        
        {/* Data rows for each source */}
        {Array.from({ length: 3 }, (_, sourceIndex) => (
          <div key={sourceIndex} className="skeleton-grid-row">
            <div className="skeleton" style={{
              width: '100px',
              height: '30px',
              borderRadius: '4px',
              opacity: 0.9
            }}></div>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="skeleton" style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                opacity: 0.7
              }}></div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend skeleton */}
      <div className="skeleton-legend" aria-hidden="true">
        <div className="skeleton skeleton-text" style={{ width: '80px', height: '24px' }}></div>
        <div className="skeleton-legend-items">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton" style={{
              width: '100px',
              height: '20px',
              borderRadius: '4px',
              opacity: 0.7
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Render the appropriate skeleton based on type
  switch (type) {
    case 'comparison':
      return renderComparisonSkeleton();
    case 'settings':
      return renderSettingsSkeleton();
    case 'hourly-grid':
      return renderHourlyGridSkeleton();
    case 'weather':
    default:
      return renderWeatherSkeleton();
  }
});

// Set display name for debugging
SkeletonLoader.displayName = 'SkeletonLoader';

// Export the component
window.SkeletonLoader = SkeletonLoader;