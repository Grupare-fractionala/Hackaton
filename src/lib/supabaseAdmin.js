import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://example.supabase.co",
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "mock-key",
  { auth: { autoRefreshToken: false, persistSession: false } },
);
