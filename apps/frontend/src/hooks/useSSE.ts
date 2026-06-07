import { useState, useEffect, useCallback, useRef } from 'react';

interface SSEOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface SSEState {
  connected: boolean;
  error: Error | null;
  data: any;
}

/**
 * Hook for Server-Sent Events (SSE)
 * Provides real-time updates from the server
 */
export function useSSE(url: string, options: SSEOptions = {}) {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [state, setState] = useState<SSEState>({
    connected: false,
    error: null,
    data: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log(`[SSE] Connected to ${url}`);
        setState(prev => ({ ...prev, connected: true, error: null }));
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, data }));
          onMessage?.(data);
        } catch (err) {
          console.error('[SSE] Failed to parse message:', err);
          setState(prev => ({ ...prev, data: event.data }));
          onMessage?.(event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[SSE] Error from ${url}:`, error);
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log(`[SSE] Max reconnection attempts reached (${maxReconnectAttempts})`);
          shouldReconnectRef.current = false;
          eventSource.close();
          setState(prev => ({
            ...prev,
            connected: false,
            error: new Error('Max reconnection attempts reached')
          }));
          onError?.(error);
          onClose?.();
          return;
        }

        setState(prev => ({
          ...prev,
          connected: false,
          error: error as any
        }));

        onError?.(error);

        // Attempt to reconnect
        if (shouldReconnectRef.current) {
          reconnectAttemptsRef.current++;
          console.log(`[SSE] Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };

    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        error: error as Error
      }));
      onError?.(error as Event);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false }));
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect
  };
}

/**
 * Hook for SSE with automatic fallback to polling
 * Useful when SSE might not be supported by the server
 */
export function useSSEWithFallback(
  sseUrl: string,
  pollFn: () => Promise<any>,
  pollInterval: number = 10000,
  sseOptions: SSEOptions = {}
) {
  const [useSSE, setUseSSE] = useState(true);
  const [sseFailed, setSseFailed] = useState(false);
  const [pollData, setPollData] = useState<any>(null);

  const sseState = useSSE(sseUrl, {
    ...sseOptions,
    onError: (error) => {
      console.log('[SSE] Connection failed, falling back to polling');
      setSseFailed(true);
      setUseSSE(false);
      sseOptions.onError?.(error);
    }
  });

  // Polling fallback
  useEffect(() => {
    if (useSSE && !sseFailed) return;

    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await pollFn();
        setPollData(data);
      } catch (err) {
        console.error('[Poll] Failed to fetch data:', err);
      }
    };

    poll();
    intervalId = setInterval(poll, pollInterval);

    return () => clearInterval(intervalId);
  }, [useSSE, sseFailed, pollFn, pollInterval]);

  return {
    connected: useSSE && !sseFailed ? sseState.connected : false,
    data: useSSE && !sseFailed ? sseState.data : pollData,
    error: useSSE && !sseFailed ? sseState.error : null,
    mode: useSSE && !sseFailed ? 'sse' : 'polling'
  };
}
