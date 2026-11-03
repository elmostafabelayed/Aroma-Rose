import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const requireRole = (allowedRoles: Array<'admin' | 'staff'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);

