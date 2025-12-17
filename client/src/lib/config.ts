// Configuration for different environments
export const config = {
  // Automatically detect environment
  isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  
  // API Base URL - automatically switches between local and production
  get apiBaseUrl() {
    if (this.isDevelopment) {
      return 'http://localhost:5000'; // Local development - explicit API server
    }
    return 'https://tavriyascheduleapi.onrender.com'; // Production
  },
  
  // Other environment-specific settings
  get enableLogging() {
    return this.isDevelopment;
  }
};

// Helper function to log only in development
export const devLog = (...args: any[]) => {
  if (config.enableLogging) {
    console.log('[DEV]', ...args);
  }
};

// Log configuration on load
if (config.isDevelopment) {
  console.log('[CONFIG] Development mode detected');
  console.log('[CONFIG] API Base URL:', config.apiBaseUrl);
  console.log('[CONFIG] Current hostname:', window.location.hostname);
}