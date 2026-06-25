/**
 * @aether/http-client - HTTP Client Utilities
 */

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class HttpClient {
  private baseHeaders: Record<string, string> = {};
  private interceptors: Array<(request: RequestOptions) => RequestOptions> = [];
  
  setDefaultHeader(key: string, value: string): void {
    this.baseHeaders[key] = value;
  }
  
  removeDefaultHeader(key: string): void {
    delete this.baseHeaders[key];
  }
  
  addInterceptor(interceptor: (request: RequestOptions) => RequestOptions): void {
    this.interceptors.push(interceptor);
  }
  
  removeInterceptor(interceptor: (request: RequestOptions) => RequestOptions): void {
    const idx = this.interceptors.indexOf(interceptor);
    if (idx !== -1) this.interceptors.splice(idx, 1);
  }
  
  async get<T>(url: string, options: RequestOptions = {}): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }
  
  async post<T>(url: string, body: any, options: RequestOptions = {}): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }
  
  async put<T>(url: string, body: any, options: RequestOptions = {}): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }
  
  async delete<T>(url: string, options: RequestOptions = {}): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
  
  async patch<T>(url: string, body: any, options: RequestOptions = {}): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }
  
  async request<T>(url: string, options: RequestOptions = {}): Promise<Response<T>> {
    let requestOptions: RequestOptions = {
      ...options,
      headers: { ...this.baseHeaders, ...(options.headers ?? {}) }
    };
    
    for (const interceptor of this.interceptors) {
      requestOptions = interceptor(requestOptions);
    }
    
    const maxRetries = requestOptions.retries ?? 0;
    const retryDelay = requestOptions.retryDelay ?? 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(url, requestOptions);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
    
    throw new Error('Request failed');
  }
  
  private async executeRequest<T>(url: string, options: RequestOptions): Promise<Response<T>> {
    const controller = new AbortController();
    const timeoutId = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : null;
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers ?? {})
      };
      
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      const data: T = await response.json() as T;
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      };
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
}

export function createHttpClient(): HttpClient {
  return new HttpClient();
}