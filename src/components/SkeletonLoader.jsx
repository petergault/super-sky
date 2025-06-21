import React from 'react';

/**
 * SkeletonLoader Component - Displays a loading skeleton for different content types
 * @param {Object} props - Component props
 * @param {string} props.type - Type of skeleton to display (weather, comparison)
 */
const SkeletonLoader = ({ type = 'weather' }) => {
  if (type === 'comparison') {
    return (
      <div className="skeleton-comparison card" role="status" aria-label="Loading comparison data">
        <div className="skeleton-header"></div>
        <div className="skeleton-tabs">
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
        </div>
        <div className="skeleton-content">
          <div className="skeleton-source">
            <div className="skeleton-title"></div>
            <div className="skeleton-data"></div>
            <div className="skeleton-data"></div>
            <div className="skeleton-data"></div>
          </div>
          <div className="skeleton-source">
            <div className="skeleton-title"></div>
            <div className="skeleton-data"></div>
            <div className="skeleton-data"></div>
            <div className="skeleton-data"></div>
          </div>
          <div className="skeleton-source">
            <div className="skeleton-title"></div>
            <div className="skeleton-data"></div>
            <div className="skeleton-data"></div>
            <div className="skeleton-data"></div>
          </div>
        </div>
        <div className="skeleton-footer"></div>
        <div className="sr-only">Loading weather comparison data...</div>
      </div>
    );
  }

  // Default weather skeleton
  return (
    <div className="skeleton-weather card" role="status" aria-label="Loading weather data">
      <div className="skeleton-header"></div>
      <div className="skeleton-content">
        <div className="skeleton-temperature"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-details">
          <div className="skeleton-data"></div>
          <div className="skeleton-data"></div>
          <div className="skeleton-data"></div>
          <div className="skeleton-data"></div>
        </div>
      </div>
      <div className="skeleton-footer"></div>
      <div className="sr-only">Loading weather data...</div>
    </div>
  );
};

export default SkeletonLoader;