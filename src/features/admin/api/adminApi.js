import { supabase } from "@/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const ROLES = [
  { value: "employee", label: "Angajat" },
  { value: "agent_tehnic", label: "Agent Tehnic" },
  { value: "agent_hr", label: "Agent HR" },
  { value: "agent_legislativ", label: "Agent Legislativ" },
  { value: "admin", label: "Administrator" },
];

export function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUser({ username, password, role, department }) {
  const email = `${username}@primarie.local`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw authError;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert([{ id: authData.user.id, username, role, department: department || "" }]);

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  return authData.user;
}

export async function deleteUser(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
}
