import { useAuthStore } from "@/store/useAuthStore";

const ROLE_DEPARTMENTS = {
  agent_tehnic: ["Tehnic"],
  agent_hr: ["HR"],
  agent_legislativ: ["Administrativ"],
};

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const role = user.role || "employee";
  const isAgent = role.startsWith("agent_");
  const isAdmin = role === "admin";

  return {
    ...user,
    name: user.name || user.username || "Utilizator",
    role,
    isAdmin,
    isAgent,
    isEmployee: role === "employee",
    handledDepartments: ROLE_DEPARTMENTS[role] || [],
  };
}
