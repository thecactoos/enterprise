// Environment configuration for different development modes

const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3000', // Use API Gateway locally
    PDF_SERVICE_URL: 'http://localhost:8000', // Direct connection to PDF service locally
    USE_MOCK_DATA: false, // Use real API data
    MOCK_DELAY: 200, // Simulate network delay (reduced for development)
    LOG_LEVEL: 'debug',
  },
  staging: {
    API_BASE_URL: 'https://staging-api.yourapp.com',
    USE_MOCK_DATA: false,
    MOCK_DELAY: 0,
    LOG_LEVEL: 'info',
  },
  production: {
    API_BASE_URL: 'https://api.yourapp.com',
    USE_MOCK_DATA: false,
    MOCK_DELAY: 0,
    LOG_LEVEL: 'error',
  },
  test: {
    API_BASE_URL: 'http://localhost:3000',
    USE_MOCK_DATA: true,
    MOCK_DELAY: 0,
    LOG_LEVEL: 'debug',
  },
};

// Get current environment
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
};

// Environment-specific configuration
export const config = {
  ...getCurrentEnvironment(),
  
  // Feature flags
  features: {
    enableMockData: getCurrentEnvironment().USE_MOCK_DATA,
    enableErrorBoundary: true,
    enablePerformanceMonitoring: process.env.NODE_ENV === 'production',
    enableAnalytics: process.env.NODE_ENV === 'production',
  },
  
  // API configuration
  api: {
    baseURL: getCurrentEnvironment().API_BASE_URL,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  // PDF service configuration
  pdfService: {
    baseURL: getCurrentEnvironment().PDF_SERVICE_URL || 'http://localhost:8000',
    timeout: 300000, // 5 minutes for OCR processing
    retryAttempts: 2,
    retryDelay: 2000,
  },
  
  // Mock data configuration
  mock: {
    enabled: getCurrentEnvironment().USE_MOCK_DATA,
    delay: getCurrentEnvironment().MOCK_DELAY,
    seedData: true, // Initialize with sample data
  },
  
  // Development tools
  dev: {
    enableReduxDevTools: process.env.NODE_ENV === 'development',
    enableReactDevTools: process.env.NODE_ENV === 'development',
    enableHotReload: process.env.NODE_ENV === 'development',
  },
};

// Helper functions
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';
export const useMockData = () => config.mock.enabled; 