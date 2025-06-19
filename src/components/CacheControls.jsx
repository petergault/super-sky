import React, { memo } from 'react';

/**
 * RefreshButton Component - Provides controls for refreshing data
 * Memoized for performance
 */
const RefreshButton = memo(({ onRefresh, isLoading }) => {
  return (
    <div className="refresh-controls" role="region" aria-label="Data refresh controls">
      <button
        className="btn btn-secondary"
        onClick={onRefresh}
        disabled={isLoading}
        aria-busy={isLoading ? "true" : "false"}
      >
        <span aria-hidden="true">↻</span> Refresh Data
      </button>
    </div>
  );
});

// Set display name for debugging
RefreshButton.displayName = 'RefreshButton';

export default RefreshButton;