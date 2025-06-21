'use client';

/**
 * PrecipitationLegend Component
 *
 * This component displays a color-coded legend for precipitation intensity
 * used in the hourly comparison grid. It shows the different precipitation
 * levels with their corresponding colors and intensity ranges.
 *
 * Precipitation Intensity Levels:
 * - Light Blue: Drizzle (0.1-0.4mm)
 * - Medium Blue: Light Rain (0.4-2.0mm) 
 * - Dark Blue: Moderate Rain (2.0-5.0mm)
 * - Purple: Heavy Rain (5.0mm+)
 */

import React from 'react';

interface PrecipitationLegendProps {
  className?: string;
}

const PrecipitationLegend: React.FC<PrecipitationLegendProps> = ({ className = '' }) => {
  const precipitationLevels = [
    {
      label: 'Drizzle',
      range: '0.1-0.4mm',
      className: 'precip-drizzle',
      color: '#ADD8E6'
    },
    {
      label: 'Light Rain',
      range: '0.4-2.0mm', 
      className: 'precip-light-rain',
      color: '#4682B4'
    },
    {
      label: 'Moderate Rain',
      range: '2.0-5.0mm',
      className: 'precip-moderate-rain',
      color: '#1E3A8A'
    },
    {
      label: 'Heavy Rain',
      range: '5.0mm+',
      className: 'precip-heavy-rain',
      color: '#6B21A8'
    }
  ];

  return (
    <div className={`precipitation-legend ${className}`}>
      <h4 className="legend-title text-sm font-semibold text-gray-700 mb-2">
        Precipitation Intensity
      </h4>
      <div className="legend-items flex flex-wrap gap-3">
        {precipitationLevels.map((level, index) => (
          <div key={index} className="legend-item flex items-center space-x-2">
            <div 
              className={`legend-color-box w-4 h-4 rounded ${level.className}`}
              style={{ backgroundColor: level.color }}
              aria-label={`${level.label} precipitation color indicator`}
            />
            <div className="legend-text">
              <span className="legend-label text-xs font-medium text-gray-600">
                {level.label}
              </span>
              <span className="legend-range text-xs text-gray-500 ml-1">
                ({level.range})
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-note text-xs text-gray-500 mt-2">
        * Only precipitation above 0.1mm is displayed in the grid
      </div>
    </div>
  );
};

export default PrecipitationLegend;