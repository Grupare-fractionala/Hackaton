import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "primarie-auth";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (session) => {
        const user = session?.user ?? null;
        const token = session?.token ?? null;

        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }

        set({ user, token });
      },
      logout: async () => {
        const { supabase } = await import("@/supabaseClient");
        await supabase.auth.signOut();
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem("token", state.token);
        }
      },
    },
  ),
);
