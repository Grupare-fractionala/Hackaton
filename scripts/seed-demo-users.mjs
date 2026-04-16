import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoAccounts = [
  { email: "secretara@primarie.local", password: "Secretara123!", label: "Angajat" },
  { email: "tehnic@primarie.local", password: "Tehnic123!", label: "Agent Tehnic" },
  { email: "hr@primarie.local", password: "Hr123456!", label: "Agent HR" },
  { email: "administrativ@primarie.local", password: "AdminDep123!", label: "Agent Admin" },
  { email: "urbanism@primarie.local", password: "Urbanism123!", label: "Urbanism" },
  { email: "admin@primarie.local", password: "Admin123!", label: "Admin IT" },
];

for (const account of demoAccounts) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });

  if (error) {
    if (error.message?.includes("already been registered")) {
      console.log(`⏭  ${account.label} (${account.email}) — already exists`);
    } else {
      console.error(`✗  ${account.label} (${account.email}) — ${error.message}`);
    }
  } else {
    console.log(`✓  ${account.label} (${account.email}) — created`);
  }
}
