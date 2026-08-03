import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Server-side half of the direct-to-Blob client upload used for files over
// Vercel's ~4.5MB serverless request-body limit (see lib/services/classify-file.ts
// and app/api/documents/classify/route.ts). This route never sees the file
// bytes themselves — it only issues a short-lived client token that the
// browser uses to upload straight to Blob storage, and Vercel Blob calls it
// back once the upload completes.
//
// Requires a Vercel Blob store connected to this project (Vercel dashboard →
// Storage → create/connect a Blob store), which provisions the
// BLOB_READ_WRITE_TOKEN environment variable this reads implicitly. Without
// that setup, handleUpload throws and this route returns a clear error
// instead of a large-file upload silently failing with no explanation.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/tiff",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        // Comfortably above any real broker document; the classify route's
        // own OCR/extraction budgets are what actually bound processing time.
        maximumSizeInBytes: 100 * 1024 * 1024,
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar la subida del archivo." },
      { status: 400 }
    );
  }
}
