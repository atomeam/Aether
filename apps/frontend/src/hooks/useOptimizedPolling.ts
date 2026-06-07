import { useState, useEffect, useCallback, useRef } from 'react';
import { usePageVisibility } from './usePageVisibility';
import { deduplicatedFetch } from '../lib/requestDeduplication';

interface OptimizedPollingOptions {
  url: string;
  interval?: number;
  enabled?: boolean;
  deduplicate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface OptimizedPollingState {
  data: any;
  loading: boolean;
  error: Error | null;
  lastFetch: number | null;
}

/**
 * Optimized polling hook with:
 * 1. Page Visibility API - stops polling when tab is inactive
 * 2. Request deduplication - prevents concurrent requests to same endpoint
 * 3. Configurable interval and enabled state
 */
export function useOptimizedPolling(options: OptimizedPollingOptions) {
  const {
    url,
    interval = 10000,
    enabled = true,
    deduplicate = true,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<OptimizedPollingState>({
    data: null,
    loading: true,
    error: null,
    lastFetch: null
  });

  const isVisible = usePageVisibility();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = deduplicate
        ? await deduplicatedFetch(url)
        : await fetch(url).then(res => res.json());

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          data,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }));
        onSuccess?.(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Failed to fetch data');
        setState(prev => ({
          ...prev,
          loading: false,
          error
        }));
        onError?.(error);
      }
    }
  }, [url, deduplicate, onSuccess, onError]);

  // Setup polling interval
  useEffect(() => {
    if (!enabled || !isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchData();

    // Setup interval
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isVisible, interval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const manualRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    isVisible,
    manualRefresh
  };
}

/**
 * Hook for SSE with page visibility awareness
 * Automatically disconnects when tab is hidden, reconnects when visible
 */
export function useSSEWithVisibility(
  url: string,
  options: {
    onMessage?: (data: any) => void;
    onError?: (error: Event) => void;
    reconnectInterval?: number;
  } = {}
) {
  const { onMessage, onError, reconnectInterval = 3000 } = options;
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isVisible = usePageVisibility();

  useEffect(() => {
    // Disconnect when not visible
    if (!isVisible) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Connect when visible
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
            onMessage?.(parsedData);
          } catch (err) {
            setData(event.data);
            onMessage?.(event.data);
          }
        };

        eventSource.onerror = (err) => {
          setConnected(false);
          setError(err as Error);
          onError?.(err);
          
          // Attempt reconnection
          reconnectTimer = setTimeout(() => {
            if (isVisible) {
              connect();
            }
          }, reconnectInterval);
        };
      } catch (err) {
        setConnected(false);
        setError(err as Error);
        onError?.(err as Event);
      }
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [url, isVisible, onMessage, onError, reconnectInterval]);

  return {
    connected,
    data,
    error,
    isVisible,
    mode: connected ? 'sse' : 'polling'
  };
}
