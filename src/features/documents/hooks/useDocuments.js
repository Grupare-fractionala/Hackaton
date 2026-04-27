import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDocument, deleteDocument, getDocuments } from "@/features/documents/api/documentApi";
import { useAuthStore } from "@/store/useAuthStore";

const DOCUMENTS_QUERY_KEY = ["documents"];

function buildDocumentsQueryKey(token) {
  return [...DOCUMENTS_QUERY_KEY, token || "anon"];
}

export function useDocumentsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: buildDocumentsQueryKey(token),
    queryFn: getDocuments,
    enabled: Boolean(token),
    refetchOnMount: "always",
  });
}

export function useCreateDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, department, title, category, description }) =>
      createDocument(file, department, { title, category, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fileUrl }) => deleteDocument(id, fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
