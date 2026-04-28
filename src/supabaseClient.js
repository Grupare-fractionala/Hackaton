import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// No-op lock: bypasses navigator.locks, which has been observed to deadlock
// when a tab is closed mid-token-refresh. Safe here because we've also
// disabled autoRefreshToken, so there is no concurrent session work to serialize.
const noopLock = (_name, _acquireTimeout, fn) => fn();

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'mock-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      lock: noopLock,
    },
  },
);
