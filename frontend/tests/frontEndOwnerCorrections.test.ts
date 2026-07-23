import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("homepage opens with the campaign line before the concise Soul and Scope captions", () => {
  const source = read("pages/index.tsx");
  const clarityIndex = source.indexOf("Clarity comes from within.");
  const observeIndex = source.indexOf("Observe your inner world.");
  const soulIndex = source.indexOf("Your inner experience.");
  const scopeIndex = source.indexOf("A way of seeing.");

  assert.ok(clarityIndex >= 0);
  assert.ok(observeIndex > clarityIndex);
  assert.ok(soulIndex > observeIndex);
  assert.ok(scopeIndex > observeIndex);
  assert.match(source, />Soul</);
  assert.match(source, />Scope</);
  assert.match(source, /<h1[^>]*className=\{styles\.heroHeadline\}>Clarity comes from within\.<\/h1>/);
  assert.doesNotMatch(source, /The inner world of a person/);
  assert.doesNotMatch(source, /An instrument used to observe, examine/);
  assert.doesNotMatch(source, /A private instrument for seeing more clearly within\./);
});

test("homepage no longer renders an illustrative Resonance Signature", () => {
  const source = read("pages/index.tsx");
  const styles = read("styles/Home.module.css");

  assert.doesNotMatch(source, /ResonanceSignature/);
  assert.doesNotMatch(source, /DEMO_SIGNATURE_DATA/);
  assert.doesNotMatch(source, /illustrative SoulScope signature/i);
  assert.doesNotMatch(styles, /heroVisual|illustrativeLabel|signatureFrame/);
});

test("homepage definition layout stays paired on mobile with a narrow fallback", () => {
  const styles = read("styles/Home.module.css");

  assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+18px\s+minmax\(0,\s*1fr\)/);
  assert.match(styles, /@media\s*\(max-width:\s*330px\)/);
});

test("How It Works explains the illustrative Resonance Signature in the signature section", () => {
  const source = read("pages/how-it-works.tsx");

  assert.match(source, /ResonanceSignature/);
  assert.match(source, /DEMO_SIGNATURE_DATA/);
  assert.match(source, /Many measured patterns\. One visual signature\./);
  assert.match(
    source,
    /An illustrative Resonance Signature\.\s*Your personal signature is created from the patterns present in\s*your own scan\./,
  );
  assert.doesNotMatch(source, /fake pattern|percentage|score/i);
});

test("scan intro uses direct preparation language instead of vague or subject-management language", () => {
  const source = read("pages/scan.tsx");

  assert.match(source, /Prepare for the clearest possible recording\./);
  assert.match(source, /Complete these steps before starting\./);
  assert.match(source, /Choose a quiet location/);
  assert.match(source, /I have followed the scan preparation steps\./);
  assert.match(source, /Begin My Scan/);
  assert.doesNotMatch(source, /Let(?:&apos;|'|’)s create a quiet moment/);
  assert.doesNotMatch(source, /Scan subject|Guest scan|Add subject/);
  assert.doesNotMatch(source, /if possible|I(?:&apos;|'|’)m Ready|Skip/);
});

test("scan intro gates the primary action behind the preparation confirmation", () => {
  const source = read("pages/scan.tsx");

  assert.match(source, /const canBegin = preparationConfirmed && Boolean\(scanSubject\)/);
  assert.match(source, /disabled=\{!canBegin\}/);
  assert.match(source, /Confirm the preparation steps to begin your scan\./);
});

test("standard scan resolves the current user's primary subject without exposing a chooser", () => {
  const source = read("pages/scan.tsx");

  assert.match(source, /DEFAULT_SELF_SCAN_SUBJECT/);
  assert.match(source, /\.from\("scan_subjects"\)/);
  assert.match(source, /\.eq\("subject_type", "primary"\)/);
  assert.match(source, /setGuidedScanSubject\(scanSubject\)/);
  assert.doesNotMatch(source, /\.insert\s*\(/);
});

test("duration copy avoids unverified sixty-second claims", () => {
  const homepage = read("pages/index.tsx");
  const scanIntro = read("pages/scan.tsx");

  assert.match(homepage, /Private by design · Guided voice scan · No diagnosis/);
  assert.doesNotMatch(homepage + scanIntro, /About 60 seconds|60 seconds|about one minute/i);
  assert.match(scanIntro, /Set aside about 3 minutes\./);
});
