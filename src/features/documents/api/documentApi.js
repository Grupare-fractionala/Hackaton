import { apiClient } from "@/api/axios";
import { mockApi } from "@/api/mock/mockServer";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function getDocuments() {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.documents.list({ token });
  }

  const response = await apiClient.get("/documents");
  return response.data;
}

export async function createDocument(data) {
  if (useMock) {
    const token = localStorage.getItem("token");
    return mockApi.documents.create({ token, data });
  }

  const response = await apiClient.post("/documents", data);
  return response.data;
}
