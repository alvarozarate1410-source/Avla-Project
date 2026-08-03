// The classify route bounds itself to well under 120s (see maxDuration and
// REQUEST_BUDGET_MS in app/api/documents/classify/route.ts) so it always
// sends back a proper response instead of running out the clock — but
// without a timeout on this end too, a dropped connection or unexpected
// platform-level kill would still leave the fetch hanging forever, which
// reads to the user as an upload stuck "Procesando"/"Analizando" that never
// finishes. Set comfortably above the server's own budget so the server's
// clean response/error wins in the normal case.
const CLASSIFY_TIMEOUT_MS = 140_000;

// Vercel's serverless functions hard-cap the request body at ~4.5MB — not
// configurable per-plan, and real scanned Peruvian official documents
// routinely exceed it. Files above this go through Vercel Blob's
// direct-from-browser upload instead (see classifyLargeFile below), which
// bypasses this function's body entirely; staying a bit under the actual
// 4.5MB platform limit leaves room for multipart overhead on the small path.
const DIRECT_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export class ClassifyRequestError extends Error {}

/**
 * POSTs a file to /api/documents/classify (small files) or uploads it
 * directly to Vercel Blob first and sends the resulting URL (large files),
 * and returns the parsed response — or throws a ClassifyRequestError with a
 * message that's always safe to show the user directly.
 *
 * Two failure modes need explicit handling beyond a plain fetch + res.json():
 * - Vercel's platform itself rejects request bodies over ~4.5MB with a 413
 *   *before* our route code ever runs, so that response is plain text/HTML,
 *   not JSON — calling res.json() on it throws a second, more confusing
 *   parse error on top of the real one, which is what used to happen here.
 * - A network drop or an unexpected platform-level kill mid-request leaves
 *   the fetch hanging with no response ever arriving.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function classifyFile(file: File, context: string): Promise<any> {
  if (file.size > DIRECT_UPLOAD_MAX_BYTES) {
    return classifyLargeFile(file, context);
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("context", context);
  return sendClassifyRequest({ body: fd });
}

async function classifyLargeFile(file: File, context: string) {
  const { upload } = await import("@vercel/blob/client");
  let blob: { url: string };
  try {
    blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/documents/upload-token",
    });
  } catch (err) {
    throw new ClassifyRequestError(
      err instanceof Error ? `No se pudo subir el archivo pesado: ${err.message}` : "No se pudo subir el archivo pesado. Intenta nuevamente."
    );
  }

  return sendClassifyRequest({
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url, fileName: file.name, context }),
  });
}

async function sendClassifyRequest(init: { headers?: Record<string, string>; body: BodyInit }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("/api/documents/classify", { method: "POST", signal: controller.signal, ...init });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ClassifyRequestError("El documento tardó demasiado en procesarse. Intenta con un archivo más liviano o vuelve a intentarlo.");
    }
    throw new ClassifyRequestError("Hubo un problema de conexión. Intenta nuevamente.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 413) {
    throw new ClassifyRequestError(
      "El archivo es muy pesado (más de 4 MB). Intenta comprimirlo, escanearlo en menor resolución, o dividirlo en partes más pequeñas."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new ClassifyRequestError(`El servidor respondió con un error (${res.status}). Intenta subir el archivo de nuevo.`);
  }

  if (!res.ok) {
    throw new ClassifyRequestError(typeof data.error === "string" ? data.error : `El servidor respondió con un error (${res.status}).`);
  }

  return data;
}
