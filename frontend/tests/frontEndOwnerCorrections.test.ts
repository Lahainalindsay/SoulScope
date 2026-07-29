import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("homepage opens with the current clarity-led instrument landing page", () => {
  const source = read("pages/index.tsx");

  assert.match(source, /Clarity comes from within/);
  assert.match(source, /The way you express yourself naturally changes as you move through life\./);
  assert.match(source, /unique Resonance Signature for every scan/);
  assert.match(source, /personal Resonance Timeline/);
  assert.match(source, /Begin Your Resonance Scan/);
  assert.match(source, /How SoulScope Works/);
  assert.doesNotMatch(source, /Observe your inner world\./);
  assert.doesNotMatch(source, /The inner world of a person/);
});

test("homepage does not render the illustrative Resonance Signature component", () => {
  const source = read("pages/index.tsx");

  assert.doesNotMatch(source, /<ResonanceSignature/);
  assert.doesNotMatch(source, /DEMO_SIGNATURE_DATA/);
});

test("homepage hero remains compact and action-focused", () => {
  const source = read("pages/index.tsx");
  const styles = read("styles/Home.module.css");

  assert.match(source, /className=\{styles\.heroHeadline\}/);
  assert.match(source, /className=\{styles\.heroActions\}/);
  assert.match(styles, /\.heroHeadline/);
  assert.match(styles, /\.heroActions/);
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

  assert.match(source, /Scan Preparation/);
  assert.match(source, /Be in a quiet location\./);
  assert.match(source, /All background noise can limit results\./);
  assert.match(source, /Speak naturally and continuously\./);
  assert.match(source, /Begin My Scan/);
  assert.doesNotMatch(source, /Prepare for the clearest possible recording\./);
  assert.doesNotMatch(source, /Complete these steps before starting\./);
  assert.doesNotMatch(source, /Choose a quiet location/);
  assert.doesNotMatch(source, /I have followed the scan preparation steps\./);
  assert.doesNotMatch(source, /Let(?:&apos;|'|’)s create a quiet moment/);
  assert.doesNotMatch(source, /Scan subject|Guest scan|Add subject/);
  assert.doesNotMatch(source, /if possible|I(?:&apos;|'|’)m Ready|Skip/);
});

test("scan intro uses the begin button without a preparation checkbox gate", () => {
  const source = read("pages/scan.tsx");
  const styles = read("pages/scan/ScanIntro.module.css");

  assert.match(source, /const canBegin = Boolean\(scanSubject\)/);
  assert.match(source, /disabled=\{!canBegin\}/);
  assert.match(source, /Preparing your scan\./);
  assert.doesNotMatch(source, /preparationConfirmed|setPreparationConfirmed|type="checkbox"|Confirm the preparation steps/);
  assert.doesNotMatch(styles, /\.confirmation/);
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

  assert.match(homepage, /Private by design\./);
  assert.match(homepage, /Your scan data remains securely associated with your account\./);
  assert.doesNotMatch(homepage + scanIntro, /About 60 seconds|60 seconds|about one minute/i);
  assert.match(scanIntro, /You have 30 seconds to answer each one/);
});

test("scan intro lists the three continuous speech prompts inside the second prep step", () => {
  const source = read("pages/scan.tsx");
  const protocol = read("lib/scanProtocol.ts");

  assert.match(source, /You will be guided through 3 prompts/);
  assert.match(source, /Please speak for the entire 30 seconds available\./);
  assert.match(source, /className=\{styles\.promptList\}/);
  assert.doesNotMatch(source, /What You Will Answer/);
  assert.doesNotMatch(source, /Speak for the full 30 seconds on each prompt\./);
  assert.match(protocol, /Please tell me about yourself, whatever comes to mind\./);
  assert.match(protocol, /Tell me about something that has been troubling or weighing on you\./);
  assert.match(protocol, /Tell me about something you hope for in the future, even if it still feels far away\./);
  assert.equal((protocol.match(/durationMs: 30000/g) ?? []).length, 3);
  assert.doesNotMatch(protocol, /Hold a comfortable ah sound/);
});

test("guided scan question pages keep timing while using the prompt as the page title", () => {
  const source = read("pages/scan/question/[step].tsx");

  assert.match(source, /const AUTO_START_DELAY_MS = 10000/);
  assert.match(source, /className=\{styles\.title\}/);
  assert.match(source, /\{question\.prompt\}/);
  assert.match(source, /clamp\(28px, 4\.2vw, 48px\)/);
  assert.match(source, /Keep speaking continuously for \$\{recordingDurationSeconds\} seconds\./);
  assert.match(source, /\$\{remainingSeconds\}s left/);
  assert.doesNotMatch(source, /Speak naturally\. There is no perfect answer\./);
  assert.doesNotMatch(source, /Keep speaking until the 30-second timer ends/);
  assert.doesNotMatch(source, /question\.rationale|CymaticSigil|Camera — optional|broad changes in facial movement/);
});

test("standalone Reference Signature calibration renders a live recording countdown", () => {
  const source = read("pages/baseline.tsx");

  assert.match(source, /role="timer"/);
  assert.match(source, /\{remainingSeconds\}s left/);
  assert.match(source, /Recording · \$\{remainingSeconds\}s/);
  assert.match(source, /onRecordingStateChange=\{handleRecordingStateChange\}/);
});

test("scan intro numbered preparation layout keeps a real text column on narrow screens", () => {
  const styles = read("pages/scan/ScanIntro.module.css");

  assert.match(styles, /\.preparationList > li\s*\{[^}]*grid-template-columns:\s*42px minmax\(0,\s*1fr\)/s);
  assert.match(styles, /\.preparationList > li::before\s*\{[^}]*grid-column:\s*1/s);
  assert.match(styles, /\.preparationList > li > strong\s*\{[^}]*grid-column:\s*2/s);
  assert.match(styles, /\.preparationList > li > span\s*\{[^}]*grid-column:\s*2/s);
  assert.match(styles, /\.promptList\s*\{[^}]*grid-column:\s*2/s);
  assert.match(styles, /\.promptList li\s*\{[^}]*display:\s*list-item/s);
  assert.match(styles, /grid-template-columns:\s*32px minmax\(0,\s*1fr\)/);
  assert.doesNotMatch(styles, /grid-template-columns:\s*1fr;\n\s*}\n}\s*$/);
});
