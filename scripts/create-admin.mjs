import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(fileURLToPath(import.meta.url), "../../");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((p) => p.trim())),
);
Object.assign(process.env, env);

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin1234!";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const email = `${ADMIN_USERNAME}@primarie.local`;

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password: ADMIN_PASSWORD,
  email_confirm: true,
});

if (error) {
  console.error("Failed to create auth user:", error.message);
  process.exit(1);
}

const { error: profileError } = await supabase
  .from("profiles")
  .insert([{ id: data.user.id, username: ADMIN_USERNAME, role: "admin", department: "" }]);

if (profileError) {
  console.error("Failed to create profile:", profileError.message);
  process.exit(1);
}

console.log(`✓ Admin created — login with username: "${ADMIN_USERNAME}", password: "${ADMIN_PASSWORD}"`);
