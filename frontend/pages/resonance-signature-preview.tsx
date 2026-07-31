import Head from "next/head";
import ResonanceSignaturePreview from "../components/resonanceSignature/ResonanceSignaturePreview";

export default function ResonanceSignaturePreviewPage() {
  const isProduction = process.env.NODE_ENV === "production";
  return (
    <>
      <Head><title>Resonance Signature Preview | SoulScope</title><meta name="robots" content="noindex" /></Head>
      <main style={{ minHeight: "100vh", background: "#01040A", color: "#e8fbff", padding: 32 }}>
        <h1 style={{ fontSize: 24, letterSpacing: 2, textTransform: "uppercase" }}>Resonance Signature Renderer Preview</h1>
        {!isProduction ? (
          <section style={{ display: "grid", gap: 24, alignItems: "start" }}>
            <div>
              <h2 style={{ fontSize: 14, color: "#58fff1" }}>Approved local reference</h2>
              <object
                data="file:///home/runner/work/SoulScope/SoulScope/Neon%20SoulScope%20Resonance%20Dashboard.png"
                type="image/png"
                aria-label="Approved SoulScope resonance dashboard reference"
                style={{ display: "block", width: "100%", maxWidth: 520, aspectRatio: "1", border: "1px solid rgba(88,255,241,0.2)" }}
              />
              <p style={{ color: "#8aa6b2", fontSize: 13 }}>Development-only local reference: <code>Neon SoulScope Resonance Dashboard.png</code></p>
            </div>
            <div>
              <h2 style={{ fontSize: 14, color: "#58fff1" }}>Renderer calibration view</h2>
              <ResonanceSignaturePreview />
            </div>
          </section>
        ) : (
          <p>This development preview is unavailable in production.</p>
        )}
      </main>
    </>
  );
}
