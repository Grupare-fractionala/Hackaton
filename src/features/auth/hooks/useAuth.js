import { useMutation } from "@tanstack/react-query";
import { login, register } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/store/useAuthStore";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      // Session management is handled by Supabase listener.
    },
  });
}
