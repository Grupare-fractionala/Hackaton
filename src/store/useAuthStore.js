import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "primarie-auth";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: ({ user, token }) => {
        if (token) {
          localStorage.setItem("token", token);
        }

        set({ user, token });
      },
      logout: () => {
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
