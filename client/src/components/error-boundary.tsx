import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Щось пішло не так
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Виникла помилка при завантаженні сторінки. Спробуйте оновити сторінку.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-navy-600 hover:bg-navy-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Оновити сторінку
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
