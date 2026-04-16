import { supabase } from "@/supabaseClient";

export async function login({ username, password }) {
  const email = `${username.trim()}@primarie.local`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error("Username sau parola incorecta.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profilul utilizatorului nu a fost gasit.");
  }

  return {
    user: {
      id: data.user.id,
      username: profile.username,
      name: profile.username,
      role: profile.role,
      department: profile.department || "",
    },
    token: data.session?.access_token,
  };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
