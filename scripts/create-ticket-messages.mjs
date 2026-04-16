import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error } = await supabase.rpc("exec_sql", {
  sql: `
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
}).catch(() => ({ error: { message: "rpc not available" } }));

if (error) {
  // Fallback: insert a row to trigger table-creation error, or use direct SQL via pg
  console.log("RPC exec_sql not available — trying REST SQL endpoint...");

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_role TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed:", text);
    console.log("\nRun this SQL manually in the Supabase SQL editor:");
    console.log(`
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    `);
    process.exit(1);
  }

  console.log("✓ ticket_messages table created via REST");
} else {
  console.log("✓ ticket_messages table created");
}
