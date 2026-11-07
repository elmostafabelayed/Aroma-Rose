import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabaseService } from '../../config/supabase.js';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors.js';
import { z } from 'zod';
import { loginSchema } from './auth.schema.js';

export class AuthService {
  /**
   * Admin / Staff Login using Supabase Auth with database profile lookup
   */
  static async login(credentials: z.infer<typeof loginSchema>) {
    let userId: string | null = null;
    let userEmail: string = credentials.email;
    let accessToken: string | null = null;

    // 1. Attempt Supabase Auth login
    try {
      const { data, error } = await supabaseService.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        // In production, an explicit rejection from Supabase Auth must abort immediately.
        // In non-production (local development/tests), allow fallback to local database authentication.
        if (env.NODE_ENV === 'production' && error.status && error.status >= 400 && error.status < 500) {
          throw new UnauthorizedError('Identifiants invalides (email ou mot de passe incorrect).');
        }
      } else if (data?.user && data.session) {
        userId = data.user.id;
        userEmail = data.user.email || credentials.email;
        accessToken = data.session.access_token;
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      // If network connection failed (e.g., local offline test against PostgreSQL container),
      // allow fallback to local credential verification.
    }

    // 2. In production, never allow fallback to local mock authentication
    if (!userId && env.NODE_ENV === 'production') {
      throw new UnauthorizedError('Service d\'authentification indisponible.');
    }

    // 3. If in local development or test mode without Supabase cloud:
    // verify credentials against auth.users & encrypted_password
    if (!userId) {
      const userRes = await query(
        `SELECT id, email, encrypted_password FROM auth.users WHERE email = $1`,
        [credentials.email]
      );

      if (userRes.rows.length === 0) {
        throw new UnauthorizedError('Identifiants invalides (email ou mot de passe incorrect).');
      }

      const userRecord = userRes.rows[0];

      // Verify bcrypt password hash if encrypted_password is populated
      if (userRecord.encrypted_password) {
        const isMatch = bcrypt.compareSync(credentials.password, userRecord.encrypted_password);
        if (!isMatch) {
          throw new UnauthorizedError('Identifiants invalides (email ou mot de passe incorrect).');
        }
      }

      userId = userRecord.id;
      userEmail = userRecord.email;

      // Issue signed JWT for local authentication
      accessToken = jwt.sign(
        {
          sub: userId,
          email: userEmail,
          aud: 'authenticated',
          role: 'authenticated',
        },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    // 3. Lookup staff/admin role from public.profiles
    const profileRes = await query(
      `SELECT id, full_name, role, is_active
       FROM public.profiles
       WHERE id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      throw new UnauthorizedError('No staff or administrator profile is associated with this account.');
    }

    const profile = profileRes.rows[0];

    // 4. Verify account active status
    if (!profile.is_active) {
      throw new ForbiddenError('This staff or administrator account has been deactivated.');
    }

    return {
      token: accessToken,
      user: {
        id: profile.id,
        email: userEmail,
        full_name: profile.full_name,
        role: profile.role,
      },
    };
  }

  /**
   * Logout session handling consistent with Supabase Auth
   */
  static async logout(token?: string) {
    if (token) {
      try {
        await supabaseService.auth.admin.signOut(token);
      } catch {
        // Fallback for offline JWT
      }
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * Get Current Authenticated Profile
   */
  static async getProfile(userId: string) {
    const res = await query(
      `SELECT p.id, p.full_name, p.role, p.is_active, p.created_at, u.email
       FROM public.profiles p
       LEFT JOIN auth.users u ON u.id = p.id
       WHERE p.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedError('Profile not found.');
    }

    return res.rows[0];
  }
}

