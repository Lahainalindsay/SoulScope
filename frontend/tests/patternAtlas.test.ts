import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAtlasProfile } from "../lib/patternAtlas";

describe("Pattern Atlas", () => {
  it("separates overextension from grounded regulation", () => {
    const loaded = resolveAtlasProfile({
      "sustained-effort": 0.95,
      "reduced-recovery": 0.94,
      "cognitive-searching": 0.72,
      "steady-regulation": 0.58,
    });
    const grounded = resolveAtlasProfile({
      "grounded-presence": 0.95,
      "steady-regulation": 0.92,
      "directional-clarity": 0.82,
      "adaptive-momentum": 0.78,
      "reduced-recovery": 0.08,
    });

    assert.notEqual(loaded.profile.id, grounded.profile.id);
    assert.ok(["overextended-steward", "quietly-overloaded"].includes(loaded.profile.id));
    assert.ok(["grounded-navigator", "steady-supporter"].includes(grounded.profile.id));
  });

  it("distinguishes protective expression from open expression", () => {
    const protectedResult = resolveAtlasProfile({
      "protective-restraint": 0.95,
      "cognitive-searching": 0.7,
      "social-availability": 0.42,
      "steady-regulation": 0.62,
    });
    const openResult = resolveAtlasProfile({
      "expressive-flexibility": 0.92,
      "social-availability": 0.9,
      "steady-regulation": 0.78,
      "protective-restraint": 0.05,
    });

    assert.ok(["reflective-protector", "contained-communicator"].includes(protectedResult.profile.id));
    assert.equal(openResult.profile.id, "open-integrator");
  });

  it("returns two alternative profiles based on the same evidence graph", () => {
    const result = resolveAtlasProfile({
      "returning-capacity": 0.9,
      "steady-regulation": 0.68,
      "adaptive-momentum": 0.62,
      "reduced-recovery": 0.35,
    });

    assert.equal(result.supporting.length, 2);
    assert.equal(new Set([result.profile.id, ...result.supporting.map((entry) => entry.profile.id)]).size, 3);
    assert.ok(result.subpatterns.length >= 3);
  });
});
