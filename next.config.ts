import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js and @hyzyla/pdfium resolve worker scripts / WASM binaries with
  // runtime-relative paths under node_modules; bundling them rewrites those
  // paths and breaks module resolution, so they must run as plain, unbundled
  // Node dependencies. sharp is a native addon with the same requirement.
  serverExternalPackages: ["tesseract.js", "@hyzyla/pdfium", "sharp"],
};

export default nextConfig;
