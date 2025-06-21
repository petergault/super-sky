'use client';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import HourlyComparisonGrid from './HourlyComparisonGrid';
import PrecipitationLegend from './PrecipitationLegend';
import LocationDisplay from './LocationDisplay';

/**
 * ComparisonView Component
 *
 * This component displays weather data from multiple sources side by side
 * for easy comparison.
 *
 * Features:
 * - Accessibility improvements with ARIA attributes
 * - Performance optimizations with memoization
 * - Improved error handling and loading states
 * - Enhanced keyboard navigation
 * - Added service indicators for each weather source
 * - Improved visual hierarchy with dividing lines
 * - Enhanced responsive design for all device sizes
 */

interface WeatherService {
  source: string;
  location?: {
    city: string;
    state: string;
    zipCode: string;
  };
  current?: any;
  daily?: any[];
  hourly?: any[];
  isError?: boolean;
  rateLimited?: boolean;
  errorMessage?: string;
}

interface ComparisonViewProps {
  weatherData: WeatherService[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Weather data comparison component
 */
const ComparisonView = memo<ComparisonViewProps>(({ weatherData, isLoading, error }) => {
  // All state hooks must be called unconditionally and in the same order on every render
  const [activeTab, setActiveTab] = useState('current');
  const [displayMode, setDisplayMode] = useState('full'); // 'full', 'simplified', 'rain-focused'
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('hourly'); // Only 'hourly' view is available now
  
  // Define all functions that use hooks at the top level
  // This ensures hooks are called in the same order on every render
  
  /**
   * Renders a service indicator based on the source name
   */
  const renderServiceIndicator = useCallback((sourceName: string) => {
    // Service name mapping
    const serviceInfo = getServiceInfo(sourceName);
    
    return (
      <div className={`service-indicator ${serviceInfo.colorClass}`}
           aria-label={serviceInfo.displayName}
           title={serviceInfo.displayName}>
        {serviceInfo.letter}
      </div>
    );
  }, []);
  
  // Process data before any hooks that depend on it
  // This ensures we don't have hooks after conditional returns
  const validData = weatherData && Array.isArray(weatherData) ? weatherData : [];
  
  // Log rate-limited services for debugging
  validData.forEach(data => {
    if (data.rateLimited) {
      console.log(`Service ${data.source} is rate limited, no data will be shown`);
    }
  });
  
  // Get the first non-error service for location info
  const nonErrorData = validData.filter(data => !data.isError);
  const location = nonErrorData.length > 0 ? nonErrorData[0].location :
                  (validData.length > 0 ? validData[0].location : null);
  
  // Memoized function to determine if any source predicts rain
  const hasRainPrediction = useCallback(() => {
    if (validData.length === 0) return false;
    
    return validData.some(data => {
      // Add safety checks for undefined properties
      if (!data ||
          (activeTab === 'current' && (!data.current || !data.current.precipitation)) ||
          (activeTab === 'daily' && (!data.daily || !data.daily[0] || !data.daily[0].precipitation))) {
        return false;
      }
      
      const precip = activeTab === 'current'
        ? (data.current.precipitation.probability || 0)
        : (data.daily?.[0]?.precipitation?.probability || 0);
      return precip >= 35; // Consider 35% or higher as a rain prediction
    });
  }, [validData, activeTab]);
  
  // Memoized function to determine if there's agreement between sources
  const determineAgreement = useCallback((property: string, threshold = 5) => {
    if (validData.length < 2) return { agrees: true, difference: 0, agreementLevel: 'high' };
    
    const values = validData.map(data => {
      // Add safety checks for undefined properties
      if (!data ||
          (activeTab === 'current' && (!data.current || data.current[property] === undefined)) ||
          (activeTab === 'daily' && (!data.daily || !data.daily[0] || data.daily[0][property] === undefined))) {
        return null;
      }
      
      const value = activeTab === 'current'
        ? data.current[property]
        : data.daily?.[0]?.[property];
      return typeof value === 'number' ? value : null;
    }).filter(val => val !== null);
    
    if (values.length < 2) return { agrees: true, difference: 0, agreementLevel: 'high' };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const difference = max - min;
    
    // Determine agreement level
    let agreementLevel = 'high';
    if (difference > threshold * 2) {
      agreementLevel = 'low';
    } else if (difference > threshold) {
      agreementLevel = 'medium';
    }
    
    return {
      agrees: difference <= threshold,
      difference: difference,
      agreementLevel: agreementLevel
    };
  }, [activeTab, validData]);

  // Memoized function to determine precipitation agreement
  const determinePrecipAgreement = useCallback((threshold = 20) => {
    if (validData.length < 2) return { agrees: true, difference: 0, agreementLevel: 'high' };
    
    const values = validData.map(data => {
      // Add safety checks for undefined properties
      if (!data ||
          (activeTab === 'current' && (!data.current || !data.current.precipitation)) ||
          (activeTab === 'daily' && (!data.daily || !data.daily[0] || !data.daily[0].precipitation))) {
        return null;
      }
      
      const precip = activeTab === 'current'
        ? (data.current.precipitation.probability || 0)
        : (data.daily?.[0]?.precipitation?.probability || 0);
      return typeof precip === 'number' ? precip : null;
    }).filter(val => val !== null);
    
    if (values.length < 2) return { agrees: true, difference: 0, agreementLevel: 'high' };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const difference = max - min;
    
    // Determine agreement level
    let agreementLevel = 'high';
    if (difference > threshold * 2) {
      agreementLevel = 'low';
    } else if (difference > threshold) {
      agreementLevel = 'medium';
    }
    
    return {
      agrees: difference <= threshold,
      difference: difference,
      agreementLevel: agreementLevel
    };
  }, [activeTab, validData]);

  // Memoized function to get precipitation category
  const getPrecipCategory = useCallback((probability: number) => {
    if (probability < 15) return 'very-low';
    if (probability < 35) return 'low';
    if (probability < 65) return 'medium';
    if (probability < 85) return 'high';
    return 'very-high';
  }, []);

  // Memoized function to get precipitation intensity
  const getPrecipIntensity = useCallback((amount: number) => {
    if (amount === 0) return 'none';
    if (amount < 0.1) return 'light';
    if (amount < 0.3) return 'moderate';
    if (amount < 0.5) return 'heavy';
    return 'extreme';
  }, []);
  
  // Memoized agreements - these must be called before any conditional returns
  const tempAgreement = useMemo(() => determineAgreement('temperature'), [determineAgreement]);
  const feelsLikeAgreement = useMemo(() => determineAgreement('feelsLike'), [determineAgreement]);
  const precipAgreement = useMemo(() => determinePrecipAgreement(), [determinePrecipAgreement]);
  
  // Automatically switch display mode based on rain prediction
  useEffect(() => {
    // Skip if no valid data, auto-switch is disabled, or not in standard view mode
    if (validData.length === 0 || !autoSwitchEnabled ||
        displayMode === 'full' || viewMode !== 'standard') {
      return;
    }
    
    if (hasRainPrediction()) {
      setDisplayMode('rain-focused');
    } else {
      setDisplayMode('simplified');
    }
  }, [validData, activeTab, displayMode, autoSwitchEnabled, hasRainPrediction, viewMode]);
  
  // Handle tab key navigation
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, nextTabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(nextTabId);
    }
  }, []);
  
  // Handle display mode change
  const handleDisplayModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDisplayMode(e.target.value);
  }, []);
  
  // Handle auto-switch toggle
  const handleAutoSwitchToggle = useCallback(() => {
    setAutoSwitchEnabled(!autoSwitchEnabled);
  }, [autoSwitchEnabled]);
  
  // Early returns for loading, error, and empty states
  // These must come AFTER all hook declarations
  if (isLoading) {
    return <SkeletonLoader type="comparison" />;
  }
  
  if (error) {
    // Pass the error directly to HourlyComparisonGrid
    return <HourlyComparisonGrid weatherData={[]} error={error} />;
  }
  
  if (!weatherData || !Array.isArray(weatherData) || weatherData.length === 0) {
    // Pass empty data to HourlyComparisonGrid which will show placeholder
    return <HourlyComparisonGrid weatherData={[]} />;
  }
  
  if (validData.length === 0) {
    // Pass the error message to HourlyComparisonGrid
    return <HourlyComparisonGrid
      weatherData={weatherData}
      error="Unable to fetch weather data from any source. Please try again."
    />;
  }
  
  // If all services have errors, still show them in the comparison grid
  const allServicesHaveErrors = validData.length > 0 && validData.every(data => data.isError);
  if (allServicesHaveErrors) {
    console.log("All services have errors, but still showing them in the comparison grid");
  }
  
  return (
    <div className="comparison-view-container">
      <div className="comparison-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <LocationDisplay location={location} />
        <PrecipitationLegend />
      </div>
      <HourlyComparisonGrid
        weatherData={weatherData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
});

// Set display name for debugging
ComparisonView.displayName = 'ComparisonView';

// Helper function to get service information
function getServiceInfo(sourceName: string) {
  const serviceMap: Record<string, { displayName: string; letter: string; colorClass: string }> = {
    'AzureMaps': {
      displayName: 'Azure Maps (AccuWeather)',
      letter: 'A',
      colorClass: 'service-indicator-accuweather'
    },
    'OpenMeteo': {
      displayName: 'Open Meteo',
      letter: 'O',
      colorClass: 'service-indicator-openmeteo'
    },
    'Foreca': {
      displayName: 'Foreca',
      letter: 'F',
      colorClass: 'service-indicator-foreca'
    },
    'GoogleWeather': {
      displayName: 'Google Weather',
      letter: 'G',
      colorClass: 'service-indicator-google'
    }
  };

  return serviceMap[sourceName] || {
    displayName: sourceName,
    letter: sourceName.charAt(0).toUpperCase(),
    colorClass: 'service-indicator-default'
  };
}

// Simple skeleton loader for comparison view
const SkeletonLoader: React.FC<{ type?: string }> = ({ type = "comparison" }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonView;