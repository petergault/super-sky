# Super Sky App - Node.js Version

This is the Node.js version of the Super Sky App, which has been converted from a client-side only application to a full-stack application with a Node.js/Express backend.

## 🌦️ Overview

Super Sky App helps users make more informed decisions by comparing weather forecasts from multiple trusted sources. The application specializes in precipitation forecasts, allowing users to see when different weather services agree or disagree about rain predictions.

## 🚀 Key Improvements in the Node.js Version

- **Server-side API Calls**: API keys are now securely stored on the server
- **Better Performance**: Webpack build process for optimized client-side code
- **Enhanced Caching**: Server-side caching for improved performance
- **Rate Limiting**: Protection against API abuse
- **Modern Build System**: Babel and Webpack for modern JavaScript features
- **Improved Security**: Helmet middleware for security headers

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

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

## 🛠️ Installation

1. Clone the repository:
   ```
   git clone https://github.com/example/super-sky.git
   cd super-sky-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your API keys for Azure Maps and Foreca

4. Build the client-side code:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## 💻 Development

For development with hot-reloading:

1. Start the server in development mode:
   ```
   npm run dev
   ```

2. In a separate terminal, start the webpack watcher:
   ```
   npm run watch
   ```

3. Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
super-sky-app/
├── public/               # Static files (built by webpack)
├── routes/               # Express route handlers
│   └── weather.js        # Weather API routes
├── src/                  # Client-side source code
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # CSS styles
│   ├── utils/            # Utility functions
│   ├── index.html        # HTML template
│   └── index.jsx         # React entry point
├── .babelrc              # Babel configuration
├── .env.example          # Example environment variables
├── package.json          # Project dependencies and scripts
├── server.js             # Express server entry point
├── webpack.config.js     # Webpack configuration
└── README.md             # Project documentation
```

## 🔄 API Endpoints

- `GET /api/weather/:zipCode` - Get weather data for a specific ZIP code
- `GET /api/weather/:zipCode/triple` - Get weather data from all three sources
- `POST /api/weather/cache/clear` - Clear the server-side cache

## 🧪 Converting from Client-Side to Node.js

The conversion process involved:

1. Setting up a Node.js/Express server
2. Moving API calls to the server-side
3. Creating a build process with Webpack
4. Implementing server-side caching
5. Updating client-side code to use the new API endpoints

## 📈 Future Enhancements

- **TypeScript Integration**: Add TypeScript for better type safety
- **Testing**: Add unit and integration tests
- **Docker Support**: Containerize the application
- **CI/CD Pipeline**: Automated testing and deployment
- **User Authentication**: Add user accounts for personalized settings
- **Database Integration**: Store user preferences and historical data