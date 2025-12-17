/**
 * Google Sheets Configuration Module
 * 
 * Handles configuration for fetching schedule data from Google Sheets.
 * Reads URL from environment variables and validates the format.
 */

export interface GoogleSheetsConfig {
  googleSheetsUrl: string;
  refreshInterval?: number; // optional auto-refresh in ms
}

/**
 * Google Sheets public CSV export URL pattern
 * Format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv
 * or: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:csv
 */
const GOOGLE_SHEETS_URL_PATTERNS = [
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/export\?format=csv(&gid=\d+)?$/,
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/gviz\/tq\?tqx=out:csv(&gid=\d+)?$/,
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/pub\?output=csv(&gid=\d+)?$/,
];

/**
 * Validates if the provided URL is a valid Google Sheets CSV export URL
 * @param url - URL string to validate
 * @returns true if URL matches Google Sheets CSV export pattern
 */
export function validateGoogleSheetsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return false;
  }
  
  return GOOGLE_SHEETS_URL_PATTERNS.some(pattern => pattern.test(trimmedUrl));
}

/**
 * Configuration error types
 */
export type ConfigError = 
  | { type: 'missing'; message: string }
  | { type: 'invalid'; message: string };

/**
 * Result type for getConfig
 */
export type ConfigResult = 
  | { success: true; config: GoogleSheetsConfig }
  | { success: false; error: ConfigError };

/**
 * Gets the Google Sheets configuration from environment variables
 * @returns ConfigResult with either config or error
 */
export function getConfig(): ConfigResult {
  const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined;
  
  if (!googleSheetsUrl) {
    return {
      success: false,
      error: {
        type: 'missing',
        message: 'Google Sheets URL не налаштовано. Встановіть змінну середовища VITE_GOOGLE_SHEETS_URL.',
      },
    };
  }
  
  if (!validateGoogleSheetsUrl(googleSheetsUrl)) {
    return {
      success: false,
      error: {
        type: 'invalid',
        message: 'Невірний формат URL Google Sheets. URL повинен бути публічним посиланням на експорт CSV.',
      },
    };
  }
  
  const refreshInterval = import.meta.env.VITE_REFRESH_INTERVAL 
    ? parseInt(import.meta.env.VITE_REFRESH_INTERVAL as string, 10)
    : undefined;
  
  return {
    success: true,
    config: {
      googleSheetsUrl,
      refreshInterval: refreshInterval && !isNaN(refreshInterval) ? refreshInterval : undefined,
    },
  };
}

/**
 * Gets the Google Sheets URL or throws an error
 * Convenience function for cases where you want to fail fast
 * @throws Error if URL is not configured or invalid
 */
export function getGoogleSheetsUrlOrThrow(): string {
  const result = getConfig();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.config.googleSheetsUrl;
}
