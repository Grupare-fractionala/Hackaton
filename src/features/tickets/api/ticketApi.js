import { apiClient } from "@/api/axios";
import { mockApi } from "@/api/mock/mockServer";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function getTickets() {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.tickets.list({ token });
  }

  const response = await apiClient.get("/tickets");
  return response.data;
}

export async function createTicket(ticketData) {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.tickets.create({ token, data: ticketData });
  }

  const response = await apiClient.post("/tickets", ticketData);
  return response.data;
}

export async function respondToTicket(payload) {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.tickets.respond({ token, ...payload });
  }

  const response = await apiClient.post(`/tickets/${payload.ticketId}/respond`, payload);
  return response.data;
}
