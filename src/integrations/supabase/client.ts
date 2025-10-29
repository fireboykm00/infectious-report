import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging for connection issues
if (typeof window !== 'undefined') {
  console.log('[Supabase] Initializing client', {
    url: supabaseUrl?.substring(0, 30) + '...',
    hasKey: !!supabaseAnonKey,
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  const error = 'Missing Supabase environment variables. Please check your .env.local file.';
  console.error('[Supabase]', error);
  throw new Error(error);
}

// Use createBrowserClient from @supabase/ssr for Next.js
// This properly handles cookies for both client and server
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'idsr-platform',
      },
    },
  }
);

// Test connection on client side
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('[Supabase] Connection error:', error);
    } else {
      console.log('[Supabase] Connected successfully', {
        hasSession: !!data.session,
      });
    }
  }).catch((err) => {
    console.error('[Supabase] Fatal connection error:', err);
  });
}