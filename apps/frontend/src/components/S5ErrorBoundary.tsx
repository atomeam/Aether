import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class S5ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('S5 Component Error:', error, errorInfo);
    
    // Log error to backend for S5 learning
    this.logErrorToBackend(error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  async logErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      const token = localStorage.getItem('aether_token');
      if (!token) return;
      
      await fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/errors`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Failed to log S5 error:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <RefreshCcw className="w-5 h-5" />
            <span className="font-bold">Optimizing...</span>
          </div>
          <p className="text-sm text-white/60">
            AI-generated component encountered an error. S5 is learning from this and will generate a fix in the next evolution cycle.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}