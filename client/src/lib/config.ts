// Configuration for different environments
export const config = {
  // Automatically detect environment
  isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  
  // API Base URL - automatically switches between local and production
  get apiBaseUrl() {
    if (this.isDevelopment) {
      return ''; // Local development - empty string for same origin
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
    console.log(...args);
  }
};