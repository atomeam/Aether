/**
 * @aether/error-boundary - Error Boundary Components
 * 
 * Provides error boundary for React applications.
 */

export class ErrorBoundary {
  constructor(private onError?: (error: Error) => void) {}
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error) {
    this.onError?.(error);
  }
}