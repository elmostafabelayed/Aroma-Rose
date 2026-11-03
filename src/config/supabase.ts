import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Public Anonymous Supabase Client.
 * Restricted by default Row Level Security (RLS) policies.
 */
export const supabaseAnon: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * CRITICAL SECURITY INVARIANT:
 * Server-Side Service Role Supabase Client.
 * Bypasses Row Level Security (RLS).
 * MUST NEVER be exposed to the browser or client-side code.
 */
export const supabaseService: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Creates an authenticated Supabase client for a specific user JWT.
 * Executes queries under that user's authenticated context respecting RLS.
 */
export const getAuthenticatedSupabaseClient = (accessToken: string): SupabaseClient => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

