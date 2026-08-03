// pdfjs-dist's Node build (src/display/node_utils.js) runs an *eager*,
// module-top-level `if (isNodeJS) { ... }` block the instant it's imported —
// not something gated behind actually calling page.render(). It tries to
// self-polyfill DOMMatrix/Path2D/ImageData from an optional @napi-rs/canvas
// dependency, and if that require() fails it just logs a warning and moves
// on, leaving those globals undefined. Nothing crashes yet at that point.
// The crash only happens later, when pdfjs's font/glyph-metric machinery
// (used even during plain getTextContent() for fonts whose widths are only
// derivable by evaluating glyph paths, e.g. Type3 fonts — common in the
// stylized/watermarked fonts official Peru government PDFs embed) actually
// constructs `new DOMMatrix(...)`.
//
// A real @napi-rs/canvas install was tried twice and failed twice in
// production: it depends on Vercel's build/runtime shipping the exact
// matching native .node binary for the deployed architecture, which isn't
// something verifiable without production deploy access, and File tracing
// gaps for packages that are only ever require()'d dynamically inside
// another package's own bundle have already bitten this exact code path
// once. These polyfills are pure JS — no native binary, no architecture
// dependency, nothing for a bundler/tracer to miss.
//
// We only need them to not crash, not to render correctly: nothing in this
// project ever calls page.render() or reads pixel data, so approximating
// (rather than perfectly replicating) canvas geometry semantics is fine —
// text extraction never inspects the geometry these produce.

class DOMMatrixPolyfill {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(init?: number[]) {
    [this.a, this.b, this.c, this.d, this.e, this.f] = init && init.length >= 6 ? init : [1, 0, 0, 1, 0, 0];
  }

  // this = left × right, per the standard 2D affine composition used
  // throughout pdfjs's own matrix math (verified against pdfjs's internal
  // `Util.transform`, which implements this exact formula).
  private static multiply(left: DOMMatrixPolyfill, right: DOMMatrixPolyfill): [number, number, number, number, number, number] {
    return [
      left.a * right.a + left.c * right.b,
      left.b * right.a + left.d * right.b,
      left.a * right.c + left.c * right.d,
      left.b * right.c + left.d * right.d,
      left.a * right.e + left.c * right.f + left.e,
      left.b * right.e + left.d * right.f + left.f,
    ];
  }

  private setFrom([a, b, c, d, e, f]: number[]) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  multiplySelf(other: DOMMatrixPolyfill) {
    return this.setFrom(DOMMatrixPolyfill.multiply(this, other));
  }

  preMultiplySelf(other: DOMMatrixPolyfill) {
    return this.setFrom(DOMMatrixPolyfill.multiply(other, this));
  }

  translate(tx = 0, ty = 0) {
    return new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f]).multiplySelf(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty]));
  }

  scale(sx = 1, sy = sx) {
    return new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f]).multiplySelf(new DOMMatrixPolyfill([sx, 0, 0, sy, 0, 0]));
  }

  invertSelf() {
    const { a, b, c, d, e, f } = this;
    const det = a * d - b * c;
    if (!det) {
      // A singular matrix's inverse is undefined; DOMMatrix's real behavior
      // flags the matrix rather than throwing. We only need to not crash.
      this.a = this.d = 1;
      this.b = this.c = this.e = this.f = 0;
      return this;
    }
    this.a = d / det;
    this.b = -b / det;
    this.c = -c / det;
    this.d = a / det;
    this.e = (c * f - d * e) / det;
    this.f = (b * e - a * f) / det;
    return this;
  }
}

// Path2D's actual geometry is only ever consumed by real canvas rendering,
// which this project never triggers — every method is a harmless no-op so
// any call sequence pdfjs makes against it just succeeds silently.
class Path2DPolyfill {
  constructor() {}
  addPath() {}
  rect() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  closePath() {}
}

class ImageDataPolyfill {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      this.data = dataOrWidth;
      this.width = widthOrHeight;
      this.height = height ?? Math.max(1, Math.floor(dataOrWidth.length / 4 / Math.max(1, widthOrHeight)));
    } else {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(Math.max(0, dataOrWidth * widthOrHeight * 4));
    }
  }
}

let installed = false;

export function installNodeCanvasPolyfills() {
  if (installed) return;
  installed = true;

  const g = globalThis as unknown as {
    DOMMatrix?: unknown;
    Path2D?: unknown;
    ImageData?: unknown;
  };

  g.DOMMatrix ??= DOMMatrixPolyfill;
  g.Path2D ??= Path2DPolyfill;
  g.ImageData ??= ImageDataPolyfill;
}
