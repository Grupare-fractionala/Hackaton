import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";

export function AppProviders({ children }) {
  const setSession = useAuthStore((state) => state.setSession);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession({
        user: session?.user ?? null,
        token: session?.access_token ?? null,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession({
        user: session?.user ?? null,
        token: session?.access_token ?? null,
      });
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
