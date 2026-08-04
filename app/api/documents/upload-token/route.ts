import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { list } from "@vercel/blob";
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

// Quick self-check for whether the Blob store is actually reachable —
// visit this route's URL directly in a browser (GET, not the POST the
// upload flow itself uses) to confirm the BLOB_READ_WRITE_TOKEN env var is
// both present *and* valid in seconds, instead of only finding out via a
// full large-file upload attempt failing. `list()` (not just checking the
// env var exists) is what actually proves the token authenticates
// correctly against the connected store, not just that some value is set.
export async function GET(): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "BLOB_READ_WRITE_TOKEN no está configurada. En el dashboard de Vercel: Storage → crea o conecta un Blob Store a este proyecto (esto añade la variable automáticamente), luego vuelve a desplegar.",
      },
      { status: 503 }
    );
  }
  try {
    await list({ limit: 1 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `BLOB_READ_WRITE_TOKEN está configurada pero la conexión al Blob Store falló: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;
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
