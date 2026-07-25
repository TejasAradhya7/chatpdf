import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadToSupabase(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  try {
    const sanitizeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const file_key = "uploads/" + Date.now().toString() + "_" + sanitizeFileName;

    const { data, error } = await supabase.storage
      .from('chatpdf')
      .upload(file_key, file);

    if (error) {
      console.warn("Supabase Storage unavailable, trying local storage fallback:", error.message);
      try {
        return await uploadLocally(file);
      } catch (localErr: any) {
        throw new Error(`Supabase upload failed: "${error.message}" (Ensure a public bucket named 'chatpdf' is created in your Supabase dashboard)`);
      }
    }

    return {
      file_key,
      file_name: file.name,
    };
  } catch (error: any) {
    console.warn("Supabase Storage error, trying local storage fallback:", error);
    try {
      return await uploadLocally(file);
    } catch (localErr: any) {
      throw new Error(`Supabase error: "${error.message || error}" (Ensure your Supabase project credentials are correct and storage bucket is configured)`);
    }
  }
}

async function uploadLocally(file: File): Promise<{ file_key: string; file_name: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload-local", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to upload file to storage.");
  }
  return response.json();
}

export function getSupabaseUrl(file_key: string) {
  if (file_key.startsWith("local_uploads/")) {
    const filename = file_key.replace("local_uploads/", "");
    return `/uploads/${filename}`;
  }
  const { data } = supabase.storage.from('chatpdf').getPublicUrl(file_key);
  return data.publicUrl;
}
