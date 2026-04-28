import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { isMockMode } from "@/config/env";
import { supabase } from "@/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";

async function buildUserSession(supabaseUser) {
  if (!supabaseUser) return { user: null, token: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", supabaseUser.id)
    .single();

  if (error) {
    console.warn("[auth] Failed to fetch profile, keeping existing session:", error);
    return null;
  }

  if (!profile) return { user: null, token: null };

  return {
    user: {
      id: supabaseUser.id,
      username: profile.username,
      name: profile.username,
      role: profile.role,
      department: profile.department || "",
    },
    token: (await supabase.auth.getSession()).data.session?.access_token ?? null,
  };
}

export function AppProviders({ children }) {
  const setSession = useAuthStore((state) => state.setSession);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  useEffect(() => {
    if (isMockMode) {
      return undefined;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const sessionData = await buildUserSession(session?.user ?? null);
      if (sessionData !== null) setSession(sessionData);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionData = await buildUserSession(session?.user ?? null);
      if (sessionData !== null) setSession(sessionData);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
