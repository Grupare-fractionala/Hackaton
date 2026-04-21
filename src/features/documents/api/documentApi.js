import { supabase } from "@/supabaseClient";

const FLOWISE_BASE_URL = "/flowise";
const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;

const DEPARTMENT_TO_CHATFLOW = {
  HR: import.meta.env.VITE_FLOWISE_HR_ID,
  Legislativ: import.meta.env.VITE_FLOWISE_JURIDIC_ID,
};

async function upsertToFlowise(file, department) {
  const chatflowId = DEPARTMENT_TO_CHATFLOW[department];
  if (!chatflowId) return;

  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/vector/upsert/${chatflowId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${FLOWISE_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Flowise upsert failed: ${response.status}`);
  }
}

export async function getDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createDocument(file, department = "General", { title, category, description } = {}) {
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
      title: title || file.name,
      category: category || null,
      description: description || null,
    }])
    .select()
    .single();

  if (dbError) throw dbError;

  await upsertToFlowise(file, department);

  return dbData;
}

export async function deleteDocument(id, fileUrl) {
  const urlParts = fileUrl ? fileUrl.split("/company_documents/") : [];
  if (urlParts.length === 2) {
    await supabase.storage.from("company_documents").remove([urlParts[1]]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
