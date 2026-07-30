import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js resolves its worker script and WASM core with runtime-relative
  // paths under node_modules; bundling it rewrites those paths and breaks
  // module resolution, so it must run as a plain, unbundled Node dependency.
  serverExternalPackages: ["tesseract.js", "@napi-rs/canvas"],
};

export default nextConfig;
