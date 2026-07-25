import { createClient } from '@supabase/supabase-js'
import fs from "fs";
import path from "path";
import os from "os";

export async function downloadFromSupabase(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (file_key.startsWith("local_uploads/")) {
        const localFileName = file_key.replace("local_uploads/", "");
        const localFilePath = path.join(process.cwd(), "public", "uploads", localFileName);
        if (fs.existsSync(localFilePath)) {
          return resolve(localFilePath);
        }
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data, error } = await supabase.storage.from('chatpdf').download(file_key)
      
      if (error || !data) {
        throw error || new Error("No data downloaded from Supabase");
      }

      const tmpDir = os.tmpdir();
      const file_name = path.join(tmpDir, `pdf_${Date.now().toString()}.pdf`);

      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(file_name, buffer);
      resolve(file_name);

    } catch (error) {
      console.error("Supabase Download Error:", error);
      reject(error);
    }
  });
}
