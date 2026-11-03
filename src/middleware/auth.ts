import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseService } from '../config/supabase.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      throw new UnauthorizedError('Bearer token value cannot be empty.');
    }

    let userId: string | null = null;
    let userEmail: string | undefined = undefined;

    // 1. Attempt verification with Supabase Auth API
    try {
      const { data, error } = await supabaseService.auth.getUser(token);
      if (error) {
        // If Supabase Auth responded with an explicit rejection (e.g. 401, 403, bad JWT),
        // do not fall back. Abort immediately with UnauthorizedError.
        if (error.status && error.status >= 400 && error.status < 500) {
          throw new UnauthorizedError(error.message || 'Invalid or expired Supabase authentication token.');
        }
      } else if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email;
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      // If network connection failed (e.g., local offline testing against PostgreSQL container),
      // allow fallback to local JWT verification.
    }

    // 2. If Supabase cloud unavailable (offline/local test mode), verify with local JWT secret
    if (!userId) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET, {
          algorithms: ['HS256'],
        }) as any;

        // Verify audience if specified
        if (decoded.aud && decoded.aud !== 'authenticated') {
          throw new UnauthorizedError('Invalid token audience.');
        }

        userId = decoded.sub || decoded.id || decoded.userId;
        userEmail = decoded.email;
      } catch (jwtErr: any) {
        if (jwtErr instanceof UnauthorizedError) throw jwtErr;
        throw new UnauthorizedError('Invalid or expired authentication token.');
      }
    }

    if (!userId) {
      throw new UnauthorizedError('Could not resolve user identity from authentication token.');
    }

    // 3. Look up canonical staff/admin profile from database (never trust client-supplied role)
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

    // 4. Verify account active status (Deactivation Kill-Switch)
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
