// Server configuration for different environments
export const serverConfig = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  
  // Port configuration
  get port() {
    return process.env.PORT || (this.isDevelopment ? 5000 : 3000);
  },
  
  // Host configuration
  get host() {
    return this.isDevelopment ? 'localhost' : '0.0.0.0';
  },
  
  // CORS configuration
  get corsOrigin() {
    if (this.isDevelopment) {
      return ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
    }
    return ['https://tavriyaschedule.onrender.com', 'https://tavriyascheduleapi.onrender.com'];
  },
  
  // Logging configuration
  get enableDetailedLogging() {
    return this.isDevelopment;
  }
};

// Helper function for development logging
export const devLog = (...args: any[]) => {
  if (serverConfig.enableDetailedLogging) {
    console.log('[DEV]', ...args);
  }
};

// Helper function for production logging
export const prodLog = (...args: any[]) => {
  console.log('[PROD]', ...args);
};