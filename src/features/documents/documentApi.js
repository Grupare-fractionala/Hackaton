import { supabase } from "@/supabaseClient";

export const uploadDocument = async (file, department) => {
  try {
    // 1. Upload the physical file to the Supabase Storage bucket
    const filePath = `${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("company_documents")
      .upload(filePath, file);

    if (storageError) throw storageError;

    // 2. Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from("company_documents")
      .getPublicUrl(filePath);

    // 3. Save the URL and details into your PostgreSQL 'documents' table
    const { data: dbData, error: dbError } = await supabase
      .from("documents")
      .insert([
        {
          file_name: file.name,
          file_url: urlData.publicUrl,
          department: department,
        },
      ]);

    if (dbError) throw dbError;

    console.log("Upload successful!", dbData);
    return true;
  } catch (error) {
    console.error("Upload failed:", error.message);
    return false;
  }
};
