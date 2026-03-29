import { apiClient } from "@/api/axios";

export async function sendChatMessage(payload) {
  const response = await apiClient.post("/chat/message", payload);
  return response.data;
}
