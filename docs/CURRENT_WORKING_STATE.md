# Current Working State: Super Sky App
## Precipitation Visualization Documentation

This document serves as a comprehensive checkpoint of the current working state of the Super Sky app, focusing on the precipitation visualization. It provides a detailed reference that can be used to revert to this state if future tooltip fixes break the site.

## 1. Current State Overview

The Super Sky app is currently in a stable state with the precipitation visualization feature working correctly. The app displays hourly precipitation forecasts from multiple weather services in a grid format:

- **Azure AccuWeather API** (top row)
- **Open Meteo API** (middle row)
- **Foreca Rapid API** (bottom row)

The precipitation data is visualized using color-coded bars that represent different precipitation intensities, with proper styling for continuous precipitation periods and special indicators for thunderstorms.

### Key Features Currently Working

1. **Precipitation Visualization**
   - Color-coded bars based on precipitation intensity
   - Segmented approach with each hour as a separate DOM element
   - Proper border radius styling for continuous precipitation periods
   - Special styling for thunderstorms with yellow borders
   - Consistent visualization across different unit systems (mm and inches)

2. **Data Display**
   - Proper handling of missing data
   - Consistent unit conversion (inches to mm) for visualization
   - Detailed tooltip information on hover (using native title attribute)
   - Proper error handling for services with rate limits or errors

3. **Layout and Design**
   - Responsive grid layout that works on different screen sizes
   - Proper service indicators for each weather source
   - Clear visual hierarchy with dividing lines
   - Consistent spacing and animations

### Current Limitations

1. **Tooltip HTML Rendering**
   - Tooltips currently use the native HTML title attribute, which doesn't support HTML rendering
   - HTML content in tooltips appears as raw tags instead of being properly rendered
   - This is a known issue that will be addressed in future updates

2. **Performance Considerations**
   - The segmented approach creates 24 DOM elements per weather service
   - This may impact performance on older devices with large datasets

## 2. Key Files and Their Roles

### Core Components

#### `components/HourlyComparisonGrid.jsx`
The main component responsible for rendering the hourly precipitation grid. Key responsibilities:

- Processes weather data from multiple sources
- Renders the day selector and hourly grid
- Implements the precipitation bar visualization
- Handles error states and loading states
- Manages the tooltip integration

Key sections:
- Lines 55-254: Data processing and state management
- Lines 396-612: Precipitation bar rendering
- Lines 455-601: Segmented precipitation bar implementation
- Lines 500-539: Unit conversion for consistent visualization
- Lines 541-562: Border radius logic for continuous precipitation periods
- Lines 564-565: Tooltip content generation

#### `utils/precipitationVisualizer.js`
Utility module that provides functions for visualizing precipitation data. Key responsibilities:

- Determines appropriate colors based on precipitation amounts
- Generates tooltip content with detailed information
- Handles unit conversion between mm and inches
- Provides visualization logic for different precipitation intensities

Key sections:
- Lines 16-117: `getPrecipitationVisualization` function for determining visualization classes
- Lines 126-189: `generatePrecipitationTooltip` function for creating tooltip content
- Lines 209-238: `getPrecipitationColor` function for determining colors based on precipitation amount
- Lines 245-384: `renderPrecipitationBars` function for creating precipitation bar elements

#### `components/Tooltip.jsx`
Component that provides tooltip functionality. Currently not directly used for precipitation bars (which use native title attributes instead). Key responsibilities:

- Renders tooltips with proper HTML content
- Handles positioning and visibility
- Manages keyboard and mouse interactions
- Ensures tooltips stay within viewport

Key sections:
- Lines 20-160: Tooltip component implementation
- Lines 31-38: Show/hide tooltip functions
- Lines 73-127: Tooltip positioning logic
- Lines 152-155: HTML content rendering with dangerouslySetInnerHTML

### CSS Files

#### `styles/hourly-grid.css`
Styles for the hourly grid layout. Contains:
- Grid structure and cell styling
- Service indicator styling
- Day selector styling
- Responsive layout adjustments

#### `styles/precipitation-bar-chart.css`
Specific styles for the precipitation bars. Contains:
- Segmented bar container styles
- Individual hour segment styles
- Color definitions for different precipitation intensities
- Hover effects and transitions

#### `styles/tooltip.css`
Styles for tooltips. Contains:
- Tooltip positioning and appearance
- Arrow styling
- Content formatting
- Animation effects

### Backup Files

#### `backups/HourlyComparisonGrid.jsx.bak`
Backup of the HourlyComparisonGrid component before any tooltip fixes. This file preserves the current working state of the precipitation visualization.

#### `backups/Tooltip.jsx.bak`
Backup of the Tooltip component before any modifications. This file preserves the current tooltip implementation.

## 3. Precipitation Bar Implementation Details

The precipitation visualization uses a segmented approach where each hour is represented by a separate DOM element with its own styling based on the precipitation amount.

### Rendering Process

1. **Data Processing**
   - Weather data is processed to extract hourly precipitation values
   - Data is organized by source (weather service) and hour
   - Missing data is handled gracefully with placeholder elements

2. **Visualization Logic**
   - Each hour's precipitation amount determines its color:
     - Drizzle (0.1-0.2mm): Very pale green (`#e0f0d0`)
     - Light Rain (0.3-2mm): Light blue (`#5fb8e0`)
     - Moderate Rain (2-5mm): Medium blue (`#3a6ea8`)
     - Heavy Rain (>5mm): Purple (`#6a006a`)
   - Hours with no precipitation are transparent
   - Thunderstorms get a special yellow border

3. **Border Radius Logic**
   - First hour with precipitation: rounded left corners
   - Last hour with precipitation: rounded right corners
   - Isolated hour with precipitation: fully rounded corners
   - Middle hours with precipitation: no rounded corners
   - This creates a continuous visual effect for consecutive precipitation hours

4. **Tooltip Integration**
   - Each hour segment has a tooltip with detailed information
   - Tooltip content is generated by `precipitationVisualizer.generatePrecipitationTooltip`
   - Currently uses native title attribute (HTML not rendered)

### Code Implementation

The core implementation of the precipitation bars is in `HourlyComparisonGrid.jsx` around line 455:

```jsx
<div className="precipitation-bar-container segmented" style={{
  display: 'flex',
  width: '100%',
  height: '20px',
  alignItems: 'center',
  position: 'relative',
  minWidth: '100%'
}}>
  {Array.from({ length: 24 }, (_, hourIndex) => {
    const hour = sourceData.hourly[hourIndex];
    
    // Handle missing hour data
    if (!hour) {
      return (
        <div
          key={`hour-segment-${hourIndex}`}
          className="precipitation-hour-segment no-data"
          data-hour={hourIndex}
          style={{
            backgroundColor: '#f0f0f0',
            flex: '1',
            height: '16px',
            opacity: 0.3
          }}
          aria-label={`Hour ${hourIndex}: No data available`}
        />
      );
    }
    
    // Extract precipitation data with proper null checks
    const precipAmount = hour.precipitation?.amount;
    const precipUnit = hour.precipitation?.unit || 'mm';
    const weatherCondition = hour.weatherCondition;
    
    // Convert to mm for consistent threshold checking
    let amountInMm = precipAmount;
    if (precipUnit === 'inches' && precipAmount !== null && precipAmount !== undefined) {
      amountInMm = precipAmount * 25.4;
    }
    const hasPrecipitation = precipAmount !== null && precipAmount !== undefined && amountInMm >= 0.1;
    
    // Get the background color for this hour based on precipitation amount
    const backgroundColor = hasPrecipitation ?
      window.precipitationVisualizer.getPrecipitationColor(precipAmount, precipUnit) :
      'transparent';
    
    // Check for thunderstorms for special styling
    const hasThunderstorm = weatherCondition && weatherCondition.toLowerCase().includes('thunder');
    
    // Determine border radius based on neighboring hours
    // [Border radius logic here]
    
    // Generate tooltip content with detailed precipitation information
    const tooltipContent = window.precipitationVisualizer.generatePrecipitationTooltip(hour, hourIndex);
    
    return (
      <div
        key={`hour-segment-${hourIndex}`}
        className="precipitation-hour-segment"
        data-hour={hourIndex}
        data-precipitation={precipAmount || 0}
        data-has-precipitation={hasPrecipitation}
        aria-label={`Hour ${hourIndex}: ${hasPrecipitation ? `${precipAmount?.toFixed(1) || '0.0'} ${precipUnit} precipitation` : 'No precipitation'}`}
        title={tooltipContent}
        style={{
          backgroundColor: backgroundColor,
          flex: '1 1 auto',
          height: '20px',
          border: hasThunderstorm ? '2px solid #ffcc00' : '1px solid rgba(0, 0, 0, 0.3)',
          boxSizing: 'border-box',
          minWidth: 'calc(100% / 24)',
          ...borderRadius
        }}
      />
    );
  })}
</div>
```

## 4. Tooltip Implementation Details

The current tooltip implementation for precipitation bars uses the native HTML title attribute, which doesn't support HTML rendering. This is a known limitation that will be addressed in future updates.

### Current Implementation

In `HourlyComparisonGrid.jsx`, tooltips are applied to precipitation hour segments using the title attribute:

```jsx
<div
  title={tooltipContent}
  aria-label={`Hour ${hourIndex}: ${hasPrecipitation ? `${precipAmount?.toFixed(1) || '0.0'} ${precipUnit} precipitation` : 'No precipitation'}`}
/>
```

The tooltip content is generated by `precipitationVisualizer.generatePrecipitationTooltip`, which returns HTML content:

```javascript
function generatePrecipitationTooltip(hourData, hourIndex = null) {
  // [Content generation logic]
  
  const content = `
    <div class="precip-tooltip">
      ${hourDisplay ? `<div class="tooltip-header">${hourDisplay}</div>` : ''}
      <div class="tooltip-section precipitation-section">
        <div class="data-row">
          <span class="data-label">Precipitation:</span>
          <span class="data-value">${precipitationDisplay}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Probability:</span>
          <span class="data-value">${precipProbability === "n/a" ? "n/a" : `${precipProbability}%`}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Condition:</span>
          <span class="data-value condition">${visualInfo.description}</span>
        </div>
      </div>
    </div>
  `;
  
  return content;
}
```

The app has a custom `Tooltip` component that properly renders HTML content using `dangerouslySetInnerHTML`, but it's not currently used for the precipitation bars.

## 5. How to Revert to This State

If future tooltip fixes break the precipitation visualization functionality, follow these steps to revert to the current working state:

### Option 1: Restore from Backup Files

1. **Restore HourlyComparisonGrid.jsx**:
   ```bash
   cp triple-check-weather-app/backups/HourlyComparisonGrid.jsx.bak triple-check-weather-app/components/HourlyComparisonGrid.jsx
   ```

2. **Restore Tooltip.jsx**:
   ```bash
   cp triple-check-weather-app/backups/Tooltip.jsx.bak triple-check-weather-app/components/Tooltip.jsx
   ```

3. **Restart the application**:
   ```bash
   cd triple-check-weather-app && npm start
   ```

### Option 2: Manual Reversion

If the backup files are not available or outdated, you can manually revert the changes:

1. **Revert to using native title attribute for tooltips**:
   - In `HourlyComparisonGrid.jsx`, find the precipitation hour segment rendering code
   - Replace any custom tooltip implementation with the native title attribute:
     ```jsx
     <div
       title={tooltipContent}
       // other attributes
     />
     ```

2. **Ensure proper precipitation bar styling**:
   - Check that each hour segment has the correct styling:
     ```jsx
     style={{
       backgroundColor: backgroundColor,
       flex: '1 1 auto',
       height: '20px',
       border: hasThunderstorm ? '2px solid #ffcc00' : '1px solid rgba(0, 0, 0, 0.3)',
       boxSizing: 'border-box',
       minWidth: 'calc(100% / 24)',
       ...borderRadius
     }}
     ```

3. **Verify border radius logic**:
   - Ensure the border radius logic for continuous precipitation periods is intact:
     ```jsx
     if (hasPrecipitation) {
       if (!prevHasPrecip && nextHasPrecip) {
         // First hour with precipitation
         borderRadius = {
           borderTopLeftRadius: '8px',
           borderBottomLeftRadius: '8px'
         };
       } else if (prevHasPrecip && !nextHasPrecip) {
         // Last hour with precipitation
         borderRadius = {
           borderTopRightRadius: '8px',
           borderBottomRightRadius: '8px'
         };
       } else if (!prevHasPrecip && !nextHasPrecip) {
         // Isolated hour with precipitation
         borderRadius = {
           borderRadius: '8px'
         };
       }
     }
     ```

4. **Check unit conversion**:
   - Verify that unit conversion for consistent visualization is working:
     ```jsx
     let amountInMm = precipAmount;
     if (precipUnit === 'inches' && precipAmount !== null && precipAmount !== undefined) {
       amountInMm = precipAmount * 25.4;
     }
     const hasPrecipitation = precipAmount !== null && precipAmount !== undefined && amountInMm >= 0.1;
     ```

## 6. Conclusion

The Super Sky app's precipitation visualization is currently in a stable and functional state. The implementation uses a segmented approach with color-coded bars that provide a clear visual representation of precipitation patterns throughout the day.

The main limitation is the tooltip implementation, which currently uses the native title attribute and doesn't properly render HTML content. This will be addressed in future updates.

This documentation serves as a comprehensive reference for the current working state of the precipitation visualization, providing a safety net that can be used to revert to this state if future changes break the functionality.