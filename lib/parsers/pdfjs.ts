import path from "node:path";

let workerConfigured = false;

/**
 * Shared pdfjs-dist (legacy Node build) loader. Used directly for text and
 * form-field extraction instead of going through the `pdf-parse` package,
 * which bundles its own copy of pdfjs-dist that additionally tries to build
 * a full render operator list — that pulls in DOMMatrix/Path2D/ImageData
 * (browser-only APIs) via an optional @napi-rs/canvas polyfill it
 * self-detects with a dynamic require(). That require is invisible to
 * Vercel's file tracer, so the native binary it needs silently doesn't ship
 * in production even though it resolves fine locally — confirmed by two
 * rounds of "DOMMatrix is not defined" crashes that only reproduced on
 * Vercel. getTextContent() below never needs any of that: it walks the
 * text-showing operators directly without constructing a render operator
 * list, so it has no canvas dependency at all.
 */
export async function getPdfjs() {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!workerConfigured) {
    // pdfjs-dist's default worker auto-discovery resolves to a bundler chunk
    // path that doesn't exist under Turbopack/webpack server builds. Pointing
    // it at the on-disk worker file avoids "fake worker" resolution failures.
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
    workerConfigured = true;
  }
  return pdfjsLib;
}
