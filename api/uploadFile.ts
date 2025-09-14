import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim();
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Supabase URL or SERVICE ROLE KEY is missing in environment variables!");
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const uploadFile = new Hono();

uploadFile.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return c.json({ error: "No file provided." }, 400);

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt) return c.json({ error: "File has no extension." }, 400);

    const isPDF = file.type === "application/pdf" || fileExt === "pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPDF && !isImage) {
      return c.json({ error: "Only PDF or image files are allowed." }, 400);
    }

    // Decide bucket and folder
    const bucketName = isPDF ? "pdfs" : "images";
    const folder = isPDF ? "pdfs" : "images";
    const fileName = `${folder}/${Date.now()}-${file.name}`;

    // Convert file to Uint8Array
    const fileData = new Uint8Array(await file.arrayBuffer());

    // Upload
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileData, { contentType: file.type, upsert: true });

    if (uploadError) {
      if (uploadError.message.includes("bucket")) {
        return c.json({
          error: `Bucket "${bucketName}" does not exist. Please create it in Supabase Storage.`,
        }, 500);
      }
      return c.json({ error: uploadError.message }, 500);
    }

    // Get public URL
    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const fileUrl = data.publicUrl;

    if (!fileUrl) return c.json({ error: "Failed to retrieve public URL." }, 500);

    return c.json({
      message: "File uploaded successfully!",
      fileUrl,
      type: isPDF ? "pdf" : "image",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return c.json({ error: message }, 500);
  }
});

export default uploadFile;
