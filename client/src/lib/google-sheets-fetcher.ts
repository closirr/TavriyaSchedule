/**
 * Google Sheets Fetcher Module
 *
 * Handles fetching CSV data from Google Sheets with retry logic
 * and proper error handling.
 */

import { getConfig, validateGoogleSheetsUrl } from './google-sheets-config';

/**
 * Result of a successful fetch operation
 */
export interface FetchResult {
  data: string;
  fetchedAt: Date;
}

/**
 * Error types for fetch operations
 */
export type FetchError =
  | { type: 'config'; message: string }
  | { type: 'network'; message: string; retryAfter?: number }
  | { type: 'http'; message: string; status: number }
  | { type: 'timeout'; message: string };

/**
 * Result type for fetch operations
 */
export type FetchResultType =
  | { success: true; result: FetchResult }
  | { success: false; error: FetchError };

/**
 * Options for fetch operation
 */
export interface FetchOptions {
  url?: string;
  timeout?: number;
  retries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
}

const DEFAULT_OPTIONS = {
  timeout: 30000,
  retries: 3,
  initialRetryDelay: 5000,
  maxRetryDelay: 30000,
};

function calculateRetryDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

async function fetchOnce(
  url: string,
  timeout: number
): Promise<FetchResultType> {
  const { controller, timeoutId } = createTimeoutController(timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: {
          type: 'http',
          message: `HTTP Error: ${response.status} ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const data = await response.text();

    return {
      success: true,
      result: {
        data,
        fetchedAt: new Date(),
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            type: 'timeout',
            message: 'Request timeout. Please try again later.',
          },
        };
      }

      return {
        success: false,
        error: {
          type: 'network',
          message: `Network error: ${error.message}`,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'network',
        message: 'Unknown network error',
      },
    };
  }
}


export async function fetchGoogleSheetsCSV(
  options: FetchOptions = {}
): Promise<FetchResultType> {
  const {
    timeout = DEFAULT_OPTIONS.timeout,
    retries = DEFAULT_OPTIONS.retries,
    initialRetryDelay = DEFAULT_OPTIONS.initialRetryDelay,
    maxRetryDelay = DEFAULT_OPTIONS.maxRetryDelay,
  } = options;

  let url = options.url;
  
  if (!url) {
    const configResult = getConfig();
    if (!configResult.success) {
      return {
        success: false,
        error: {
          type: 'config',
          message: configResult.error.message,
        },
      };
    }
    url = configResult.config.googleSheetsUrl;
  } else {
    if (!validateGoogleSheetsUrl(url)) {
      return {
        success: false,
        error: {
          type: 'config',
          message: 'Invalid Google Sheets URL format.',
        },
      };
    }
  }

  let lastError: FetchError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await fetchOnce(url, timeout);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (
      result.error.type === 'config' ||
      (result.error.type === 'http' && result.error.status >= 400 && result.error.status < 500)
    ) {
      return result;
    }

    if (attempt < retries) {
      const delay = calculateRetryDelay(attempt, initialRetryDelay, maxRetryDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError || {
      type: 'network',
      message: 'Failed to load data after multiple attempts.',
    },
  };
}

export async function fetchGoogleSheetsCSVOrThrow(
  options: FetchOptions = {}
): Promise<FetchResult> {
  const result = await fetchGoogleSheetsCSV(options);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.result;
}
