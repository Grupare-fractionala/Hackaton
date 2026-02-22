import { apiClient } from "@/api/axios";
import { mockApi } from "@/api/mock/mockServer";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function login(payload) {
  if (useMock) {
    return mockApi.auth.login(payload);
  }

  const response = await apiClient.post("/auth/login", payload);
  return response.data;
}

export async function getCurrentUser() {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.auth.me(token);
  }

  const response = await apiClient.get("/auth/me");
  return response.data;
}
