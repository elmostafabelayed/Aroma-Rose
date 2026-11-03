import type { ApiResponse, PaginatedMeta } from '../types/api.types';

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown[];

  constructor(message: string, statusCode: number = 500, code: string = 'UNKNOWN_ERROR', details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
}

const AUTH_STORAGE_KEY = 'aroma_rose_token';

class ApiClient {
  private baseUrl: string;

  constructor() {
    const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;
    this.baseUrl = metaEnv || (typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : undefined) || '/api/v1';
  }

  public getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }

  public setStoredToken(token: string | null): void {
    if (typeof localStorage === 'undefined') return;
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return `${url.pathname}${url.search}`;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; meta?: PaginatedMeta }> {
    const { params, token, headers = {}, ...customConfig } = options;

    const authToken = token !== undefined ? token : this.getStoredToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const targetUrl = this.buildUrl(endpoint, params);

    const config: RequestInit = {
      ...customConfig,
      headers: requestHeaders,
    };

    try {
      const response = await fetch(targetUrl, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const payload: ApiResponse<T> = isJson ? await response.json() : null;

      if (!response.ok || (payload && payload.success === false)) {
        const errorInfo = payload?.error;
        throw new ApiError(
          errorInfo?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorInfo?.code || 'API_ERROR',
          errorInfo?.details
        );
      }

      return {
        data: payload.data as T,
        meta: payload.meta,
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      const genericMsg = err instanceof Error ? err.message : 'Network request failed';
      throw new ApiError(genericMsg, 0, 'NETWORK_ERROR');
    }
  }

  public get<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

