import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createDefaultVoiceAnalysisProvider, SoulScopeAcousticProvider, type ConsentRecord } from "../lib/voiceAnalysisProvider";

const consent: ConsentRecord = {
  consentId: "consent-1",
  obtainedFromDataSubject: true,
  obtainedAt: "2026-07-23T00:00:00.000Z",
  method: "scan_preparation",
};

test("default voice provider is the clean-room SoulScope acoustic provider", () => {
  const provider = createDefaultVoiceAnalysisProvider();
  assert.equal(provider.namespace, "soulscope");
  assert.equal(provider.providerId, "soulscope-acoustic");
});

test("voice provider refuses analysis without explicit subject consent", async () => {
  const provider = new SoulScopeAcousticProvider();
  await assert.rejects(
    provider.analyzeFile(
      { blob: new Blob(["not-a-real-audio-file"]), captureId: "capture-1" },
      { ...consent, obtainedFromDataSubject: false },
    ),
    /explicit consent/i,
  );
});

test("scan flow uses provider boundary instead of direct analyzer calls", () => {
  const source = readFileSync("pages/scan/analyzing.tsx", "utf8");
  assert.match(source, /createDefaultVoiceAnalysisProvider/);
  assert.match(source, /provider\.analyzeFile/);
  assert.doesNotMatch(source, /analyzeVoiceSpectrum\(/);
});
