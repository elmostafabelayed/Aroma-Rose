export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export const parsePagination = (
  rawPage?: any,
  rawLimit?: any,
  defaultLimit: number = 12,
  maxLimit: number = 50
): PaginationOptions => {
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  let limit = parseInt(String(rawLimit), 10) || defaultLimit;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};
