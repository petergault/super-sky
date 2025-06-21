'use client';

/**
 * LocationDisplay Component
 *
 * This component displays location information for the weather comparison view.
 * It shows the city, state, and ZIP code extracted from weather service data.
 *
 * Features:
 * - Displays formatted location string (e.g., "New York, NY 10001")
 * - Handles missing or incomplete location data gracefully
 * - Provides accessibility support with proper ARIA labels
 * - Responsive design for all device sizes
 */

import React from 'react';

interface LocationInfo {
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface LocationDisplayProps {
  location?: LocationInfo | null;
  className?: string;
  showZipCode?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ 
  location, 
  className = '',
  showZipCode = true 
}) => {
  // Handle missing or null location
  if (!location) {
    return (
      <div className={`location-display location-unknown ${className}`}>
        <span className="text-gray-500 text-sm">Location unavailable</span>
      </div>
    );
  }

  // Build location string components
  const locationParts: string[] = [];
  
  if (location.city) {
    locationParts.push(location.city);
  }
  
  if (location.state) {
    locationParts.push(location.state);
  }
  
  // Create the main location string (city, state)
  const mainLocation = locationParts.join(', ');
  
  // Handle case where we have no city/state data
  if (!mainLocation) {
    return (
      <div className={`location-display location-incomplete ${className}`}>
        {location.zipCode && showZipCode ? (
          <span className="text-gray-600 text-sm">
            ZIP Code: {location.zipCode}
          </span>
        ) : (
          <span className="text-gray-500 text-sm">Location information incomplete</span>
        )}
      </div>
    );
  }

  return (
    <div className={`location-display ${className}`} role="region" aria-label="Weather location">
      <div className="location-content flex items-center space-x-2">
        {/* Location icon */}
        <span className="location-icon text-gray-500" aria-hidden="true">
          📍
        </span>
        
        {/* Main location text */}
        <span className="location-text text-gray-800 font-medium">
          {mainLocation}
        </span>
        
        {/* ZIP code (if available and enabled) */}
        {location.zipCode && showZipCode && (
          <span className="zip-code text-gray-600 text-sm">
            {location.zipCode}
          </span>
        )}
        
        {/* Country (if available and different from US) */}
        {location.country && location.country.toUpperCase() !== 'US' && (
          <span className="country text-gray-600 text-sm">
            ({location.country.toUpperCase()})
          </span>
        )}
      </div>
    </div>
  );
};

export default LocationDisplay;