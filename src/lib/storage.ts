import { put, del } from "@vercel/blob";

export async function uploadFile(
  file: File,
  folder: string = "inspections"
): Promise<string> {
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    console.warn("[Storage] Failed to delete file:", url);
  }
}
