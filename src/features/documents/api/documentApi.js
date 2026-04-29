import { supabase } from "@/supabaseClient";
import { createMockDocument, deleteMockDocument, getMockDocuments } from "@/api/mockStore";
import { isMockMode } from "@/config/env";

const FLOWISE_BASE_URL = import.meta.env.VITE_FLOWISE_BASE_URL || "/flowise";
const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;

// Maps the upload form's "Departament" value to the Flowise chatflow that
// owns its vector store, plus the metadata.department tag the chatflow
// filters on at retrieval time. Departments not in this map are stored in
// Supabase but never embedded (Tehnic, General).
const FLOWISE_UPSERT_TARGETS = {
  HR: {
    chatflowId: import.meta.env.VITE_FLOWISE_HR_ID,
    metadataDepartment: "HR",
  },
  Administrativ: {
    chatflowId: import.meta.env.VITE_FLOWISE_JURIDIC_ID,
    metadataDepartment: "Legislativ",
  },
};

async function upsertToFlowise(file, department) {
  const target = FLOWISE_UPSERT_TARGETS[department];
  if (!target?.chatflowId) {
    return null;
  }

  const formData = new FormData();
  formData.append("files", file);
  formData.append(
    "overrideConfig",
    JSON.stringify({ metadata: { department: target.metadataDepartment } }),
  );

  const response = await fetch(
    `${FLOWISE_BASE_URL}/api/v1/vector/upsert/${target.chatflowId}`,
    {
      method: "POST",
      headers: FLOWISE_API_KEY ? { Authorization: `Bearer ${FLOWISE_API_KEY}` } : {},
      body: formData,
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Flowise upsert (${response.status}): ${text || response.statusText}`,
    );
  }

  return response.json();
}

export async function getDocuments() {
  if (isMockMode) {
    return getMockDocuments();
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createDocument(file, department = "General") {
  if (isMockMode) {
    return createMockDocument(file, department);
  }

  const filePath = `${Date.now()}_${file.name}`;

  const { error: storageError } = await supabase.storage
    .from("company_documents")
    .upload(filePath, file);

  if (storageError) throw storageError;

  const { data: urlData } = supabase.storage
    .from("company_documents")
    .getPublicUrl(filePath);

  const { data: dbData, error: dbError } = await supabase
    .from("documents")
    .insert([{
      file_name: file.name,
      file_url: urlData.publicUrl,
      department,
    }])
    .select()
    .single();

  if (dbError) throw dbError;

  try {
    await upsertToFlowise(file, department);
  } catch (err) {
    throw new Error(
      `Documentul a fost salvat in Supabase, dar embedding-ul a esuat: ${err.message}`,
    );
  }

  return dbData;
}

export async function deleteDocument(id, fileUrl) {
  if (isMockMode) {
    return deleteMockDocument(id);
  }

  const urlParts = fileUrl ? fileUrl.split("/company_documents/") : [];
  if (urlParts.length === 2) {
    await supabase.storage.from("company_documents").remove([urlParts[1]]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
