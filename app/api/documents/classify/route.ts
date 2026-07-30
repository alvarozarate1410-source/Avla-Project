import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/parsers/extract-text";
import { classifyDocument } from "@/lib/services/document-classifier";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractText(file.name, buffer);
  const classification = classifyDocument(file.name, text);

  return NextResponse.json({
    fileName: file.name,
    size: file.size,
    ...classification,
    extracto: text.slice(0, 240),
  });
}
