import { supabase } from "@/supabaseClient";

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
  return dbData;
}

export async function deleteDocument(id, fileUrl) {
  // Extract storage path from the public URL
  const urlParts = fileUrl ? fileUrl.split("/company_documents/") : [];
  if (urlParts.length === 2) {
    await supabase.storage.from("company_documents").remove([urlParts[1]]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
