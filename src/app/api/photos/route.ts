import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
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

    let photoId: string | undefined;

    if (inspectionId) {
      // Replace any existing photos with the same label so the PDF always gets the latest
      const existing = await db.inspectionPhoto.findMany({
        where: { inspectionId, label },
      });
      for (const old of existing) {
        try { await del(old.url); } catch { /* blob may already be gone */ }
        await db.inspectionPhoto.delete({ where: { id: old.id } });
      }

      const photo = await db.inspectionPhoto.create({
        data: { inspectionId, url: blob.url, label, fileName: file.name },
      });
      photoId = photo.id;
    }

    return NextResponse.json({ url: blob.url, id: photoId });
  } catch (err) {
    console.error("[Photo upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "No photo ID provided." }, { status: 400 });
    }

    const photo = await db.inspectionPhoto.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    try { await del(photo.url); } catch { /* blob may already be gone */ }
    await db.inspectionPhoto.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Photo delete]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed." },
      { status: 500 }
    );
  }
}
