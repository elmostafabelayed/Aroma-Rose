export interface HttpResponse<T = any> {
  status: number;
  headers: Headers;
  body: T;
}

export class TestHttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T = any>(
    method: string,
    path: string,
    options: {
      body?: any;
      query?: Record<string, any>;
      token?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<HttpResponse<T>> {
    let url = `${this.baseUrl}${path}`;
    if (options.query) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(options.query)) {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let body: any = null;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    return {
      status: res.status,
      headers: res.headers,
      body,
    };
  }

  get<T = any>(path: string, options?: { query?: Record<string, any>; token?: string }) {
    return this.request<T>('GET', path, options);
  }

  post<T = any>(path: string, body?: any, options?: { token?: string }) {
    return this.request<T>('POST', path, { ...options, body });
  }

  patch<T = any>(path: string, body?: any, options?: { token?: string }) {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  delete<T = any>(path: string, options?: { token?: string }) {
    return this.request<T>('DELETE', path, options);
  }
}
