"use client";

import ScanWizard from "../components/ScanWizard";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="hero__eyebrow">SoulScope</p>
        <h1 className="hero__title">Guide seekers through a Core Frequency scan.</h1>
        <p className="hero__subtitle">
          A 6–8 minute ritual that captures physiology, voice, emotional reactivity, and recovery so
          you can fuse it into one cohesive core frequency reading.
        </p>
        <div className="hero__cta">
          <span className="hero__cta-note">
            Screened journey · PhysioTimeSeries · ReactivityMetrics · VoiceFeatures
          </span>
        </div>
      </section>
      <ScanWizard />
    </main>
  );
}
