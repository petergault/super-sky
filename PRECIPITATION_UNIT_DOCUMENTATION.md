# Precipitation Unit Handling Documentation

## Overview

This document describes the systematic approach to handling precipitation units across different weather APIs in the Super Sky App. All APIs now consistently return precipitation values in **millimeters (mm)** after transformation.

## Problem Statement

Previously, the weather app had inconsistent precipitation unit handling:
- Different APIs returned precipitation in different units (inches vs millimeters)
- Frontend code performed additional conversions that caused errors
- Values were inconsistent across weather services for the same real-world precipitation

## Solution: Standardized Unit Conversion

All transformer functions now convert precipitation values to **millimeters (mm)** as the standard unit for display.

## API-Specific Unit Handling

### 1. Azure Maps API
- **Native Unit**: Inches
- **Conversion**: Multiply by 25.4 (inches → mm)
- **Implementation**: 
  ```javascript
  // Azure Maps returns precipitation in inches - convert to mm for consistency
  amount: (day.day?.totalLiquid?.value || 0) * 25.4
  ```

### 2. Open Meteo API
- **Native Unit**: Millimeters
- **Conversion**: None (use values directly)
- **Implementation**:
  ```javascript
  // Open Meteo returns precipitation in mm - use directly
  amount: hourly.precipitation && hourly.precipitation[i]
  ```

### 3. Foreca API
- **Native Unit**: Millimeters
- **Conversion**: None (use values directly)
- **Implementation**:
  ```javascript
  // Foreca returns precipitation in mm - use directly
  amount: current.precipAccum || 0
  ```

### 4. Google Weather API
- **Native Unit**: Inches (despite API claiming "MILLIMETERS")
- **Conversion**: Multiply by 25.4 (inches → mm)
- **Implementation**:
  ```javascript
  // Google Weather returns precipitation in inches - convert to mm for consistency
  amount: precipAmount * 25.4
  ```

**Note**: Google Weather API has a known issue where the unit field incorrectly reports "MILLIMETERS" but the actual values are in inches.

## Frontend Changes

### Removed Conversions
The following frontend files were updated to remove incorrect unit conversions:

1. **`utils/helpers.js`**:
   - Removed heuristic conversion logic
   - Now simply formats the standardized mm values

2. **`utils/precipitationVisualizer.js`**:
   - Removed `* 25.4` conversions
   - Uses precipitation values directly as they're already in mm

## Transformer Function Changes

### Azure Maps Transformers
- [`transformAzureMapsDaily()`](utils/transformers.js:38): Converts inches to mm
- [`transformAzureMapsHourly()`](utils/transformers.js:759): Converts inches to mm
- [`createCurrentFromForecast()`](utils/transformers.js:203): Converts inches to mm

### Open Meteo Transformers
- [`transformOpenMeteoHourly()`](utils/transformers.js:342): Uses mm directly
- [`transformOpenMeteoDaily()`](utils/transformers.js:392): Uses mm directly
- [`createOpenMeteoCurrent()`](utils/transformers.js:443): Uses mm directly

### Foreca Transformers
- [`transformForecaCurrent()`](utils/transformers.js:692): Uses mm directly
- [`transformForecaHourly()`](utils/transformers.js:807): Uses mm directly

### Google Weather Transformers
- [`transformGoogleWeatherHourly()`](utils/transformers.js:1005): Converts inches to mm
- [`createGoogleWeatherCurrent()`](utils/transformers.js:1141): Converts inches to mm

## Validation

A comprehensive test suite validates the unit standardization:

```bash
node test-precipitation-unit-standardization.js
```

This test confirms:
- ✅ All APIs convert to millimeters correctly
- ✅ Cross-API consistency for equivalent real-world precipitation
- ✅ No additional frontend conversions needed

## Real-World Example

For 0.5 inches of rain:
- **Azure Maps**: 0.5 inches → 12.7 mm ✅
- **Open Meteo**: 12.7 mm → 12.7 mm ✅
- **Foreca**: 12.7 mm → 12.7 mm ✅
- **Google Weather**: 0.5 inches → 12.7 mm ✅

All APIs now return consistent values for the same precipitation amount.

## Code Comments

All precipitation-related code now includes clear comments indicating:
- The source unit from each API
- Whether conversion is applied
- The target unit (always mm)

Example:
```javascript
precipitation: {
  probability: hour.precipProb,
  // Foreca returns precipitation in mm - use directly
  amount: hour.precipAccum || 0,
  type: determineForecaPrecipType(hour.symbol)
}
```

## Benefits

1. **Consistency**: All weather services show identical precipitation values for the same conditions
2. **Accuracy**: Eliminates the 25.4x multiplication errors that occurred with incorrect conversions
3. **Maintainability**: Clear documentation and comments make the unit handling transparent
4. **User Experience**: Users see consistent, accurate precipitation values regardless of data source

## Future Considerations

- If new weather APIs are added, follow this standardization approach
- Always document the native units returned by new APIs
- Add appropriate conversion logic to transform to millimeters
- Update the test suite to validate new API integrations