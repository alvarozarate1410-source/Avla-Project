import path from "node:path";
import { installNodeCanvasPolyfills } from "@/lib/parsers/node-canvas-polyfills";

let workerConfigured = false;

/**
 * Shared pdfjs-dist (legacy Node build) loader.
 *
 * pdfjs-dist's own Node build (src/display/node_utils.js) runs an *eager*,
 * module-top-level `if (isNodeJS) { ... }` block the instant it's imported
 * — not something gated behind actually rendering a page. It tries to
 * self-polyfill DOMMatrix/Path2D/ImageData from an optional @napi-rs/canvas
 * dependency; if that require() fails it just warns and leaves those
 * globals undefined. Nothing crashes yet at that point — the crash only
 * happens later, when pdfjs's font/glyph-metric machinery (used even during
 * plain getTextContent() for fonts whose widths are only derivable by
 * evaluating glyph paths, e.g. Type3 fonts — common in the
 * stylized/watermarked fonts official Peru government PDFs embed)
 * constructs `new DOMMatrix(...)`.
 *
 * A real @napi-rs/canvas install was tried twice and failed twice in
 * production (its native binary depends on Vercel's build/runtime shipping
 * an exact architecture match, and on a bundler/tracer correctly following
 * a require() that's dynamically constructed inside another package's own
 * bundle — neither of which held up). installNodeCanvasPolyfills() installs
 * pure-JS stand-ins instead: no native binary, nothing for a tracer to
 * miss. They only need to not crash, not to render correctly — nothing in
 * this project ever calls page.render() or reads pixel data.
 */
export async function getPdfjs() {
  installNodeCanvasPolyfills();
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
