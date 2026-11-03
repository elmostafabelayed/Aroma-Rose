import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseService } from '../config/supabase.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { AuthenticatedUser } from '../types/express.d.js';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    let userId: string | null = null;
    let userEmail: string | undefined = undefined;

    // 1. Attempt verification with Supabase Auth API
    try {
      const { data: { user }, error } = await supabaseService.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
        userEmail = user.email;
      }
    } catch {
      // Supabase remote call fallback
    }

    // 2. If Supabase API unavailable (e.g. offline/local test), verify via JWT secret
    if (!userId) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        userId = decoded.sub || decoded.id || decoded.userId;
        userEmail = decoded.email;
      } catch {
        throw new UnauthorizedError('Invalid or expired authentication token.');
      }
    }

    if (!userId) {
      throw new UnauthorizedError('Could not resolve user identity from token.');
    }

    // 3. Look up staff/admin profile from database (never trust client-supplied role)
    const profileRes = await query(
      `SELECT p.id, p.full_name, p.role, p.is_active, u.email
       FROM public.profiles p
       LEFT JOIN auth.users u ON u.id = p.id
       WHERE p.id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      throw new UnauthorizedError('No staff or administrator profile found for this account.');
    }

    const profile = profileRes.rows[0];

    // 4. Verify account active status
    if (!profile.is_active) {
      throw new ForbiddenError('Administrator or staff account has been deactivated.');
    }

    req.user = {
      id: profile.id,
      email: profile.email || userEmail,
      role: profile.role,
      full_name: profile.full_name,
      is_active: profile.is_active,
    };

    next();
  } catch (error) {
    next(error);
  }
};
