export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: PaginatedMeta;
  error?: ApiErrorPayload;
}
