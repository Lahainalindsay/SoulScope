import Head from "next/head";
import ResonanceSignaturePreview from "../components/resonanceSignature/ResonanceSignaturePreview";

export default function ResonanceSignaturePreviewPage() {
  const isProduction = process.env.NODE_ENV === "production";
  return (
    <>
      <Head><title>Resonance Signature Preview | SoulScope</title><meta name="robots" content="noindex" /></Head>
      <main style={{ minHeight: "100vh", background: "#020509", color: "#e8fbff", padding: 32 }}>
        <h1 style={{ fontSize: 24, letterSpacing: 2, textTransform: "uppercase" }}>Resonance Signature Renderer Preview</h1>
        {!isProduction ? (
          <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
            <div>
              <h2 style={{ fontSize: 14, color: "#58fff1" }}>Approved local reference</h2>
              <object
                data="file:///home/lahainalindsay9111/soulscope/Neon%20SoulScope%20Resonance%20Dashboard.png"
                type="image/png"
                aria-label="Approved SoulScope resonance dashboard reference"
                style={{ display: "block", width: "100%", maxWidth: 520, aspectRatio: "1", border: "1px solid rgba(88,255,241,0.2)" }}
              />
              <p style={{ color: "#8aa6b2", fontSize: 13 }}>Local reference: `Neon SoulScope Resonance Dashboard.png`</p>
            </div>
            <div>
              <h2 style={{ fontSize: 14, color: "#58fff1" }}>Procedural renderer fixtures</h2>
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
