import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Extract pagination parameters from a request query string.
 * Defaults: page=1, limit=20, max limit=100.
 */
export function getPagination(req: Request): PaginationOptions {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
