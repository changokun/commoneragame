import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * ErrorBoundary Component
 * 
 * ========================================================================
 * WHAT IT DOES:
 * - Catches JavaScript errors that occur during rendering in child components
 * - Displays a user-friendly error message instead of crashing the whole app
 * - Logs detailed error information to the console for debugging
 * 
 * ========================================================================
 * IMPORTANT LIMITATIONS:
 * Error boundaries ONLY catch errors in:
 *   ✅ Component render methods
 *   ✅ Component lifecycle methods (except componentDidCatch itself)
 *   ✅ Component constructors
 *   ✅ Children components' render tree
 * 
 * Error boundaries do NOT catch errors in:
 *   ❌ Event handlers (async or sync) - use try/catch for these
 *   ❌ setTimeout/setInterval callbacks
 *   ❌ Promise rejections - use .catch() or try/catch with async/await
 *   ❌ The ErrorBoundary component's own errors
 * 
 * ========================================================================
 * USAGE EXAMPLE:
 * 
 * // Wrap your component tree at the appropriate level
 * <ErrorBoundary onReset={() => window.location.reload()}>
 *   <PlayPage />
 * </ErrorBoundary>
 * 
 * // Or with a custom fallback
 * <ErrorBoundary fallbackComponent={<CustomErrorComponent />}>
 *   <SomeRiskyComponent />
 * </ErrorBoundary>
 * 
 * ========================================================================
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;          // Called when user clicks "Try Again" - typically reloads data or page
  fallbackComponent?: ReactNode; // Custom error UI to display instead of default
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  // Initialize state - no error initially
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  /**
   * getDerivedStateFromError - Static method called when an error is thrown
   * 
   * This is the first lifecycle method called when an error occurs.
   * It updates the state so the next render will show the fallback UI.
   * 
   * @param error - The error that was thrown
   * @returns The new state with the error
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary: Caught error during render:', error);
    return { hasError: true, error, errorInfo: null };
  }

  /**
   * componentDidCatch - Called after an error has been thrown
   * 
   * This is where you would typically log the error to an external service
   * like Sentry, Datadog, etc. It receives both the error and information
   * about which component caused it.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Contains the componentStack property showing where the error occurred
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error with full context for debugging
    console.group('ErrorBoundary Details');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.groupEnd();

    // Update state with the error info (for displaying component stack in UI)
    this.setState({ errorInfo });
  }

  /**
   * Render the component
   * 
   * If there's an error, show the fallback UI.
   * Otherwise, render the children normally.
   */
  public render(): ReactNode {
    // If there's an error, show the error UI
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI with detailed information
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full shadow-2xl border-destructive dark:border-destructive/30">
            <div className="p-6">
              {/* Error icon and title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-destructive dark:text-destructive/80">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    An error occurred while rendering this page.
                  </p>
                </div>
              </div>

              {/* Error message */}
              <div className="mb-4 p-3 bg-muted/50 rounded text-sm">
                <code className="text-foreground">{this.state.error?.message || 'Unknown error'}</code>
              </div>

              {/* Collapsible technical details section */}
              <details className="mb-6 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium mb-2 text-foreground">
                  Technical Details (click to expand)
                </summary>
                <div className="space-y-2 p-3 bg-background rounded overflow-x-auto">
                  {this.state.error?.stack && (
                    <div>
                      <div className="font-semibold mb-1">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <div className="font-semibold mb-1">Component Stack:</div>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                {this.props.onReset && (
                  <Button 
                    onClick={this.props.onReset}
                    className="bg-background hover:bg-background/80 text-foreground border border-border"
                  >
                    Try Again
                  </Button>
                )}
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-background hover:bg-background/80 text-foreground border border-border"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}
