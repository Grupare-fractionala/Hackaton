import { supabase } from "@/supabaseClient";

const DEMO_ACCOUNTS = [
  { email: "secretara@primarie.local", password: "Secretara123!", name: "Secretara", role: "Angajat" },
  { email: "tehnic@primarie.local", password: "Tehnic123!", name: "Agent Tehnic", role: "Agent Tehnic" },
  { email: "hr@primarie.local", password: "Hr123456!", name: "Agent HR", role: "Agent HR" },
  { email: "administrativ@primarie.local", password: "AdminDep123!", name: "Agent Admin", role: "Agent Admin" },
  { email: "urbanism@primarie.local", password: "Urbanism123!", name: "Urbanism", role: "Urbanism" },
  { email: "admin@primarie.local", password: "Admin123!", name: "Admin IT", role: "Admin IT" },
];

export async function login({ email, password }) {
  const demo = DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );

  if (demo) {
    const user = {
      id: `demo-${demo.email}`,
      email: demo.email,
      user_metadata: { full_name: demo.name, role: demo.role },
    };
    const token = `demo-token-${btoa(demo.email)}-${Date.now()}`;
    return { user, token };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    token: data.session?.access_token,
  };
}

export async function register({ email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    token: data.session?.access_token,
  };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}
