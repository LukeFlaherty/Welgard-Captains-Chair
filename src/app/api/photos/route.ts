import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const label = (formData.get("label") as string) ?? "additional";
    const inspectionId = formData.get("inspectionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `photos/${inspectionId ?? "draft"}/${label}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    // If linked to an inspection, persist immediately
    if (inspectionId) {
      await db.inspectionPhoto.create({
        data: {
          inspectionId,
          url: blob.url,
          label,
          fileName: file.name,
        },
      });
    }

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[Photo upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}
