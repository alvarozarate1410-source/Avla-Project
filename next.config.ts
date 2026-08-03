import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js and @hyzyla/pdfium resolve worker scripts / WASM binaries with
  // runtime-relative paths under node_modules; bundling them rewrites those
  // paths and breaks module resolution, so they must run as plain, unbundled
  // Node dependencies. sharp is a native addon with the same requirement.
  // pdf-parse dynamically `require()`s @napi-rs/canvas from its own bundled
  // code (to polyfill DOMMatrix/ImageData/Path2D for PDFs with pattern or
  // shading fills — without it, those PDFs fail with "DOMMatrix is not
  // defined"). @napi-rs/canvas isn't installed directly by this project; it
  // comes in as pdf-parse's own exact-pinned dependency, nested under
  // node_modules/pdf-parse/node_modules/@napi-rs/canvas* (npm won't hoist it
  // to the top level since pdf-parse pins an old 0.x version). pdf-parse's
  // require of it is invisible to static bundling analysis (constructed via
  // module.createRequire inside pdf-parse's own minified bundle) — verified
  // by inspecting the actual .next/**/route.js.nft.json trace output, which
  // had zero @napi-rs/canvas entries until this include was added.
  serverExternalPackages: ["tesseract.js", "@hyzyla/pdfium", "sharp", "pdf-parse"],
  outputFileTracingIncludes: {
    "/api/documents/classify": ["./node_modules/pdf-parse/node_modules/@napi-rs/canvas*/**"],
  },
};

export default nextConfig;
