# Google Weather API Limitation

## Issue: Limited Hours Returned

The Google Weather API has a limitation where it only returns 24 hours of forecast data at a time, despite requesting 240 hours in the API call. This issue affects the hourly forecast display in the Super Sky App.

### API Request

The API request is correctly formatted to request 240 hours of data:

```
https://weather.googleapis.com/v1/forecast/hours:lookup?key=API_KEY&location.latitude=40.7483136&location.longitude=-73.9940525&hours=240&pageSize=240
```

### Observed Behavior

Despite requesting 240 hours, the API only returns 24 hours of data. The response includes a pagination token (`nextPageToken`), suggesting that the API supports pagination to retrieve additional hours.

### Pagination Attempts

We attempted to implement pagination by following the `nextPageToken` in the response, but encountered a 400 error ("Request contains an invalid argument") when making subsequent requests with the pagination token.

Example pagination request that fails:

```
https://weather.googleapis.com/v1/forecast/hours:lookup?key=API_KEY&pageToken=PAGINATION_TOKEN
```

### Time Distribution

The 24 hours returned by the API are typically distributed across two days:
- Partial hours for the current day (usually afternoon/evening hours)
- Partial hours for the next day (usually morning/afternoon hours)

This means that for any given day, we may only have a subset of the 24 hours.

## Solution Implemented

Since we cannot retrieve all 240 hours of data due to API limitations, we've implemented the following solution:

1. **Transparent Communication**: Added a clear message in the UI when displaying Google Weather data, informing users that only a limited number of hours are available for each day.

2. **Display Available Hours**: Modified the HourlyComparisonGrid component to display the available hours for each day, even if we don't have all 24 hours.

3. **Visual Distinction**: Added styling to make it clear when we're displaying limited data from the Google Weather API.

4. **Fallback Mechanism**: Maintained the existing fallback to mock data when the API fails completely.

## Future Considerations

1. **API Documentation**: The Google Weather API documentation should be consulted for the correct way to use pagination, if available.

2. **Alternative Approach**: Consider making multiple API requests for different time periods to build a more complete forecast.

3. **Caching Strategy**: Implement a caching strategy to store and combine data from multiple API calls over time.

4. **User Feedback**: Collect user feedback on whether the limited hourly data from Google Weather is still valuable compared to other weather sources.

## Testing

To test the Google Weather API and verify this limitation, use the following test scripts:

- `google-weather-api-debug.js`: Tests the basic API request and response
- `test-google-weather-pagination.js`: Tests pagination attempts
- `test-google-weather-display.js`: Tests how the data is transformed and displayed

Run these scripts with Node.js:

```
node google-weather-api-debug.js
node test-google-weather-pagination.js
node test-google-weather-display.js