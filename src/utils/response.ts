import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200, meta?: ApiResponse['meta']): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

export const sendCreated = <T>(res: Response, data: T, meta?: ApiResponse['meta']): Response => {
  return sendSuccess(res, data, 201, meta);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit) || 1;
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages,
  });
};
