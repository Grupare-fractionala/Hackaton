import { apiClient } from "@/api/axios";

export async function getDocuments() {
  const response = await apiClient.get("/documents");
  return response.data;
}

export async function createDocument(data) {
  const response = await apiClient.post("/documents", data);
  return response.data;
}
