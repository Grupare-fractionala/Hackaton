import { apiClient } from "@/api/axios";
import { mockApi } from "@/api/mock/mockServer";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function sendChatMessage(payload) {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.chat.ask({ token, ...payload });
  }

  const response = await apiClient.post("/chat/message", payload);
  return response.data;
}
