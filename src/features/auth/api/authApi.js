import { supabase } from "@/supabaseClient";

export async function login({ email, password }) {
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
