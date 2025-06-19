# Super Sky App

A sophisticated weather application that displays forecasts from four different weather services (Azure Maps/AccuWeather, Open Meteo, Foreca, and Google Weather) with a focus on precipitation visualization and comparison. Super Sky helps users make more informed decisions by comparing weather forecasts from multiple trusted sources.

![Super Sky App](https://example.com/app-screenshot.png)

## 🌦️ Overview

Super Sky App helps users make more informed decisions by comparing weather forecasts from multiple trusted sources. The application specializes in precipitation forecasts, allowing users to see when different weather services agree or disagree about rain predictions.

While individual weather services can be inconsistent, Super Sky gives users confidence in their planning by displaying forecasts from multiple trusted sources in an intuitive, visual format. Users can quickly identify when all services agree (high confidence) or when predictions differ (lower confidence).

### Target Users
- Weather-dependent professionals (construction workers, event planners, photographers)
- Outdoor enthusiasts (hikers, cyclists, beach-goers)
- General consumers planning activities
- Weather enthusiasts who want to compare forecast accuracy

### Key Features

- **Multi-Source Weather Data**: Compare forecasts from Azure Maps (AccuWeather), Open Meteo, Foreca, and Google Weather
- **Precipitation Focus**: Detailed visualization of rain/snow probability and intensity
- **Comparison View**: Side-by-side comparison of weather data from all sources
- **Agreement Indicators**: Visual indicators showing when sources agree or disagree
- **Smart Display Logic**: Simplified view for days with no rain, detailed comparison for rainy days
- **Precipitation Visualization System**: Color-coded display with standardized probability indicators
- **Responsive Design**: Optimized for all device sizes (mobile, tablet, desktop)
- **Progressive Web App**: Install on your device and use offline
- **Weather Notifications**: Receive alerts for significant weather events
- **User Onboarding**: Guided tour for first-time users
- **Customizable Display**: Multiple view modes for different use cases
- **Caching & Offline Support**: Access recent forecasts without internet connection

## 📱 Installation

### As a Progressive Web App

1. Visit the application in your browser
2. For mobile devices:
   - iOS: Tap the share button and select "Add to Home Screen"
   - Android: Tap the menu button and select "Install App" or "Add to Home Screen"
3. For desktop:
   - Chrome/Edge: Click the install icon in the address bar
   - Firefox: Click the menu button and select "Install App"

### From Source

1. Clone the repository:
   ```
   git clone https://github.com/example/super-sky.git
   cd super-sky-app
   ```

2. Set up API keys:
   - Create a `.env` file based on `.env.example`
   - Add your API keys for Azure Maps and Foreca

3. Run the application:
   ```
   # Using Python's built-in HTTP server
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server
   ```

4. Open your browser and navigate to `http://localhost:8000`

## 🔑 API Keys

The application requires API keys for the following services:

1. **Azure Maps API**: Used for geocoding and weather data (AccuWeather)
   - Sign up at [Azure Maps](https://azure.microsoft.com/en-us/services/azure-maps/)
   - Create an API key in the Azure portal

2. **Foreca API**: Used for additional weather data
   - Sign up at [Foreca](https://developer.foreca.com/)
   - Create an API key in the developer portal

3. **Open Meteo API**: Free and open-source weather API (no key required)
   - [Open Meteo](https://open-meteo.com/)

## 🧩 Project Structure

```
super-sky-app/
├── components/           # React components
│   ├── ApiKeyTester.jsx  # Component for testing API keys
│   ├── App.jsx           # Main application component
│   ├── AppSettings.jsx   # Settings component
│   ├── ComparisonView.jsx # Weather comparison component
│   ├── HelpSection.jsx   # Help and FAQ component
│   ├── SkeletonLoader.jsx # Loading skeleton component
│   ├── Tooltip.jsx       # Tooltip component
│   └── UserOnboarding.jsx # Onboarding tour component
├── config/               # Configuration files
│   └── config.js         # App configuration
├── hooks/                # Custom React hooks
│   └── useWeather.js     # Hook for weather data
├── icons/                # App icons
│   ├── generate-icons.html # Icon generator
│   └── icon.svg          # Source icon
├── services/             # API and data services
│   └── weatherService.js # Weather API service
├── styles/               # CSS styles
│   ├── animations.css    # Animation styles
│   ├── design-system.css # Design system
│   ├── help.css          # Help section styles
│   ├── main.css          # Main styles
│   ├── onboarding.css    # Onboarding styles
│   ├── skeleton.css      # Loading skeleton styles
│   └── tooltip.css       # Tooltip styles
├── types/                # TypeScript type definitions
│   └── weather.d.ts      # Weather data types
├── utils/                # Utility functions
│   ├── apiKeyManager.js  # API key management
│   ├── cacheManager.js   # Data caching
│   ├── helpers.js        # Helper functions
│   ├── notificationManager.js # Notification management
│   └── transformers.js   # Data transformation
├── index.html            # Main HTML file
├── index.jsx             # Main React entry point
├── manifest.json         # PWA manifest
├── serviceWorker.js      # Service worker for offline support
└── README.md             # This documentation
```

## 🖥️ Usage Guide

### Basic Usage

1. **Enter ZIP Code**: Input a US ZIP code in the search field
2. **View Weather**: See current conditions and forecast from the primary source
3. **Compare Sources**: Toggle to Comparison View to see data from all sources
4. **Customize Display**: Choose between Full, Simplified, or Rain-Focused views

### Advanced Features

#### Comparison View

The Comparison View allows you to see weather data from all three sources side by side:

- **Tabs**: Switch between Current Conditions and Today's Forecast
- **Display Modes**:
  - **Full Comparison**: Shows all weather data points
  - **Simplified View**: Shows only the most important data
  - **Rain-Focused View**: Emphasizes precipitation data
- **Auto-Switch**: Automatically switches to Rain-Focused View when rain is predicted

#### Agreement Indicators

The application shows how closely the different weather sources agree:

- **Green** (High Agreement): Sources have very similar predictions
- **Yellow** (Medium Agreement): Sources have somewhat different predictions
- **Red** (Low Agreement): Sources have significantly different predictions

#### Precipitation Visualization

Precipitation is visualized using color and border styling:

- **Color Intensity**: Represents probability (darker blue = higher chance)
- **Border Thickness**: Represents intensity/amount (thicker border = heavier precipitation)

#### Offline Support

The application works offline with limited functionality:

- Cached weather data is available without an internet connection
- Recent ZIP codes are stored for quick access
- The app can be installed as a PWA for offline use

#### Notifications

Enable weather notifications to receive alerts for:

- Rain alerts
- Storm warnings
- Snow alerts
- Heat advisories

## 🛠️ Technical Details

### Technologies Used

- **React**: UI library for component-based architecture
- **TypeScript**: Type definitions for better code quality
- **Service Workers**: For offline capabilities and PWA support
- **Local Storage**: For caching and user preferences
- **Fetch API**: For data retrieval from weather services
- **Frontend-Only Architecture**: Client-side application with no backend requirements

### API Integration

The application integrates with four weather service APIs:

1. **Azure Maps/AccuWeather API**:
   - Used for geocoding and primary weather data
   - Provides hourly forecasts and current conditions
   - [Detailed Azure Maps Integration Documentation](./AZURE_MAPS_INTEGRATION.md)

2. **Open Meteo API**:
   - Free and open-source weather API
   - Provides hourly forecasts with detailed precipitation data

3. **Foreca API**:
   - Additional weather data source
   - Provides alternative precipitation forecasts for comparison

4. **Google Weather API**:
   - Fourth weather data source for enhanced comparison
   - Currently implemented with realistic mock data due to API availability issues
   - [Detailed Google Weather API Integration Documentation](./GOOGLE_WEATHER_API_INTEGRATION.md)

### Performance Optimizations

- **Component Memoization**: Prevents unnecessary re-renders
- **Debounced Inputs**: Improves performance for user inputs
- **Data Caching**: Reduces API calls and improves load times
- **Code Splitting**: Optimizes bundle size
- **Skeleton Screens**: Improves perceived performance during loading

### Accessibility Features

- **ARIA Attributes**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling for modals and dialogs
- **Color Contrast**: WCAG 2.1 AA compliant color contrast
- **Reduced Motion**: Support for users who prefer reduced motion
- **Screen Reader Support**: Descriptive text for screen readers

### Progressive Web App Features

- **Offline Support**: Works without an internet connection
- **Installable**: Can be added to home screen
- **Responsive**: Works on all device sizes
- **Push Notifications**: Weather alerts and updates
- **Background Sync**: Updates data when online

## 📈 Development Process

The Super Sky App was developed using a phased implementation approach:

### Implementation Phases

1. **Phase 1**:
   - Core UI structure and layout
   - ZIP code entry functionality with URL parameter support
   - Local storage for user preferences
   - Initial API integration with AccuWeather

2. **Phase 2**:
   - Open Meteo and Foreca API integrations
   - Data standardization layer across all three services
   - Basic visualization of weather conditions

3. **Phase 3**:
   - Enhanced visualization with raindrop icons and tooltips
   - Caching strategy for API responses
   - Error handling and graceful degradation

4. **Phase 4**:
   - Mobile responsiveness optimization
   - Performance improvements
   - Smart display logic for rain vs. no-rain days

5. **Phase 5**:
   - User testing and feedback collection
   - Refinement based on user feedback
   - Final polish and deployment

### Progressive Enhancement Approach

The application was built using a progressive enhancement strategy:
- Started with a single API to validate core functionality
- Added second and third APIs incrementally
- Focused on standardizing data correctly across all services
- Implemented rain probability visualization with a single service first
- Expanded to handle all visual indicators across all services

## 🔮 Future Enhancements

The following enhancements are planned for future releases:

- **Historical Accuracy Tracking**: Show which service performs best over time
- **Enhanced Location Customization**: Support for more location input methods
- **Severe Weather Alerts Aggregation**: Consolidated alerts from multiple sources
- **Premium Features**: Additional tools for weather-dependent professionals
- **Seasonal Feature Adjustments**: Snow forecasts in winter, UV index in summer
- **Expanded Visualization Options**: Additional ways to view and compare data
- **International Support**: Expanded coverage beyond US ZIP codes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Azure Maps](https://azure.microsoft.com/en-us/services/azure-maps/) for weather data
- [Open Meteo](https://open-meteo.com/) for open-source weather data
- [Foreca](https://developer.foreca.com/) for additional weather data
- [React](https://reactjs.org/) for the UI framework
- [TypeScript](https://www.typescriptlang.org/) for type definitions

## 📚 Documentation

- [Azure Maps API Integration](./AZURE_MAPS_INTEGRATION.md) - Detailed documentation on the Azure Maps API integration
- [Google Weather API Integration](./GOOGLE_WEATHER_API_INTEGRATION.md) - Comprehensive documentation of the Google Weather API integration process
- [Code Documentation](./CODE_DOCUMENTATION.md) - Documentation for code related to API integrations