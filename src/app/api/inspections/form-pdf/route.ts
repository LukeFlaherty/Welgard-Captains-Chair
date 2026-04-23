import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { db } from "@/lib/db";
import { BlankInspectionFormPDF } from "@/components/pdf/blank-form-template";

const logoPath = path.join(process.cwd(), "public", "welgard-logos", "wg-logo-white-on-blue-bg.webp");

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inspectorId = searchParams.get("inspectorId");

  let inspector: { name: string; company: string | null } | null = null;

  if (inspectorId) {
    const record = await db.inspector.findUnique({
      where: { id: inspectorId },
      select: { name: true, company: true },
    });
    if (record) inspector = record;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(BlankInspectionFormPDF as any, { logoPath, inspector });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await (renderToBuffer as any)(element);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="welgard-inspection-form.pdf"`,
      },
    });
  } catch (err) {
    console.error("[form-pdf]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed." },
      { status: 500 }
    );
  }
}
