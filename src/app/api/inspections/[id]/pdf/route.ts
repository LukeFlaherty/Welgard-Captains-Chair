import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { WellReportPDF } from "@/components/pdf/well-report-template";

const logoPath = path.join(process.cwd(), "public", "welgard-logos", "wg-logo-white-on-blue-bg.png");

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const inspection = await db.inspection.findUnique({
      where: { id },
      include: { photos: true, yieldTests: { orderBy: { testNumber: "asc" } } },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found." }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(WellReportPDF as any, { inspection, logoPath });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await (renderToBuffer as any)(element);

    // Upload to Vercel Blob
    const filename = `reports/${inspection.reportId ?? id}-${Date.now()}.pdf`;
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });

    const now = new Date();

    // Update inspection's latest PDF pointer and append a history record
    await db.$transaction([
      db.inspection.update({
        where: { id },
        data: { generatedPdfUrl: blob.url, reportGeneratedAt: now },
      }),
      db.pdfGeneration.create({
        data: { inspectionId: id, url: blob.url, generatedAt: now },
      }),
    ]);

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[PDF generation]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed." },
      { status: 500 }
    );
  }
}
